import os
import sys

# ⭐️ [가장 중요] 이 2줄이 모든 'from ...' 코드보다 무조건 위에 있어야 합니다! ⭐️
# 현재 main.py가 있는 폴더 위치를 파이썬에게 강력하게 알려주는 코드입니다.
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# --- 이제 라이브러리들을 불러옵니다 ---
import io
import math
import re
import numpy as np
import cv2
import uuid
from pathlib import Path
from typing import Optional, List, Dict, Any
from PIL import Image, ImageEnhance, ImageOps
from difflib import SequenceMatcher
from contextlib import asynccontextmanager # 스케줄러용

# ✅ [수정] HEIC 지원 라이브러리
from pillow_heif import register_heif_opener
register_heif_opener()

# ✅ [수정] 스케줄러 라이브러리 (순서 상관 없음, 경로 추가된 후에만 오면 됨)
from apscheduler.schedulers.background import BackgroundScheduler
from fastapi.staticfiles import StaticFiles 
# ✅ [수정] 여기가 에러나던 곳이죠? 이제 위에서 경로를 추가했으니 잘 될 겁니다.
from services.trend_service import update_daily_trends 

# 라우터
from routers import auth, community, search, upload, mypage, admin,pills
from routers.auth import get_current_user
from db import get_conn
from ultralytics import YOLO

# FastAPI 관련
from fastapi import FastAPI, HTTPException, Query, UploadFile, File, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from routers import chat
from google.cloud import vision
from google.oauth2 import service_account
from dotenv import load_dotenv

# .env 로드
load_dotenv()





BASE_DIR = Path(__file__).resolve().parent

# --- 1. 디렉터리 생성 ---
for _dir in ("templates", "css", "js", "assets", "debug_images", "uploads", "models"):
    try:
        Path(BASE_DIR / _dir).mkdir(parents=True, exist_ok=True)
    except Exception:
        pass
# --- [추가] 스케줄러 및 수명주기 설정 ---
scheduler = BackgroundScheduler()

# 매일 새벽 4시에 트렌드 점수 업데이트 실행
scheduler.add_job(update_daily_trends, 'cron', hour=4, minute=0)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 서버 시작 시 실행
    print(">>> ⏰ 자동 랭킹 업데이트 스케줄러 시작")
    scheduler.start()
    
    # (선택사항) 서버 켜질 때 즉시 한 번 실행하고 싶으면 아래 주석 해제
    # update_daily_trends()
    
    yield
    # 서버 종료 시 실행
    print(">>> ⏰ 스케줄러 종료")
    scheduler.shutdown()
app = FastAPI(title="Pilly Backend API,lifespan=lifespan")

# --- 2. CORS 설정 ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://3.38.78.49", "http://3.38.78.49:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 3. 정적 파일 연결 ---
upload_dir = BASE_DIR / "uploads"
if not upload_dir.exists():
    try:
        upload_dir.mkdir(parents=True, exist_ok=True)
    except Exception:
        pass

app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")
app.mount("/css", StaticFiles(directory=BASE_DIR / "css"), name="css")
app.mount("/js", StaticFiles(directory=BASE_DIR / "js"), name="js")
app.mount("/assets", StaticFiles(directory=BASE_DIR / "assets"), name="assets")
app.mount("/debug_images", StaticFiles(directory=BASE_DIR / "debug_images"), name="debug_images")

# --- 4. 라우터 등록 ---
app.include_router(auth.router)
app.include_router(community.router)
app.include_router(upload.router)
app.include_router(mypage.router)
app.include_router(admin.router)
app.include_router(chat.router)
app.include_router(search.router)
app.include_router(pills.router)
# --- Google Vision 설정 ---
KEY_PATH = "service-account-file.json"
vision_client = None
if os.path.exists(KEY_PATH):
    credentials = service_account.Credentials.from_service_account_file(KEY_PATH)
    vision_client = vision.ImageAnnotatorClient(credentials=credentials)

# --- [중요 수정] YOLO 모델 로드 ---
MODEL_PATH = BASE_DIR / "models" / "pill_detection.pt"
print(f">>> 모델 경로 확인: {MODEL_PATH}")

try:
    if MODEL_PATH.exists():
        yolo_model = YOLO(str(MODEL_PATH))
        print(">>> ✅ Custom AI 모델 로드 성공!")
    else:
        print(">>> ⚠️ 학습된 모델이 없습니다. 기본 yolov8n.pt를 로드합니다.")
        yolo_model = YOLO('yolov8n.pt') 
except Exception as e:
    print(f">>> 🚨 모델 로드 중 에러 발생: {e}")
    yolo_model = None

# --- 색상 기준표 ---
PILL_COLORS = {
    "하양": (245, 245, 245),
    "노랑": (250, 204, 21),
    "주황": (251, 146, 60),
    "분홍": (244, 114, 182),
    "빨강": (220, 38, 38),
    "갈색": (120, 53, 15),
    "연두": (163, 230, 53),
    "초록": (34, 139, 34),
    "청록": (20, 184, 166),
    "파랑": (37, 99, 235),
    "남색": (30, 58, 138),
    "보라": (124, 58, 237),
    "회색": (156, 163, 175),
    "검정": (31, 41, 55),
}

def get_nearest_color_name(r, g, b):
    min_dist = float("inf")
    nearest_name = "기타"
    for name, (cr, cg, cb) in PILL_COLORS.items():
        dist = math.sqrt((r - cr)**2 + (g - cg)**2 + (b - cb)**2)
        if dist < min_dist:
            min_dist = dist
            nearest_name = name
    return nearest_name

def fix_image_orientation(image: Image.Image) -> Image.Image:
    try:
        return ImageOps.exif_transpose(image)
    except:
        return image

# --- OpenCV 강제 탐지 ---
def force_detect_opencv(pil_image) -> List[bytes]:
    img = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (7, 7), 0)
    thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 19, 3)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    morph = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=2)
    contours, _ = cv2.findContours(morph, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    cropped_images = []
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < (w * h * 0.0005) or area > (w * h * 0.05): continue
        x, y, cw, ch = cv2.boundingRect(cnt)
        if float(cw) / ch > 3.0 or float(cw) / ch < 0.3: continue
        padding = 15
        nx, ny = max(0, x - padding), max(0, y - padding)
        nw, nh = min(w - nx, cw + padding * 2), min(h - ny, ch + padding * 2)
        crop = img[ny:ny+nh, nx:nx+nw]
        success, encoded = cv2.imencode('.jpg', crop)
        if success: cropped_images.append(encoded.tobytes())
    return cropped_images

# --- 하이브리드 탐지 ---
def detect_multiple_pills_hybrid(pil_image) -> List[bytes]:
    if not yolo_model:
        return force_detect_opencv(pil_image)
    try:
        enhancer = ImageEnhance.Sharpness(pil_image)
        pil_image_sharp = enhancer.enhance(2.0)
        
        # [중요] 학습된 모델을 사용하여 더 낮은 conf에서도 잘 찾도록 설정
        results = yolo_model(pil_image_sharp, conf=0.25, iou=0.45)
        result = results[0]
        yolo_crops = []
        original_cv_img = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
        h_img, w_img = original_cv_img.shape[:2]

        for box in result.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            w_box, h_box = x2 - x1, y2 - y1
            # 너무 큰 박스 제외
            if w_box * h_box > (w_img * h_img * 0.9): continue
            
            padding = 10
            nx1, ny1 = max(0, x1 - padding), max(0, y1 - padding)
            nx2, ny2 = min(w_img, x2 + padding), min(h_img, y2 + padding)
            crop = original_cv_img[ny1:ny2, nx1:nx2]
            success, encoded = cv2.imencode('.jpg', crop)
            if success: yolo_crops.append(encoded.tobytes())

        if len(yolo_crops) < 1:
            return force_detect_opencv(pil_image)
        return yolo_crops
    except Exception as e:
        print(f"Detection Error: {e}")
        return force_detect_opencv(pil_image)

# --- 텍스트 분석 ---
def extract_best_pill_text(texts) -> str:
    if not texts: return ""
    candidates = []
    full_text = texts[0].description.replace("\n", "").replace(" ", "").strip().upper()
    clean_full = re.sub(r"[^A-Z0-9]", "", full_text)
    if re.search("^[A-Z0-9]{2,6}$", clean_full):
        candidates.append({"word": clean_full, "score": 10})
    for text in texts[1:]:
        word = text.description.strip().upper()
        clean_word = re.sub(r"[^A-Z0-9]", "", word)
        if len(clean_word) < 1 or len(clean_word) > 6: continue
        if clean_word in ["TEL", "FAX", "TAB", "EXP", "KOREA", "MG", "CAP"]: continue
        score = 0
        if re.search("[A-Z]", clean_word) and re.search("[0-9]", clean_word): score += 10
        elif re.search("^[0-9]+$", clean_word): score += 5
        elif re.search("^[A-Z]+$", clean_word): score += 3
        candidates.append({"word": clean_word, "score": score})
    if candidates:
        candidates.sort(key=lambda x: -x["score"])
        return candidates[0]["word"]
    return ""

# --- 색상 분석 ---
def get_pill_color_hsv(image_bytes):
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None: return "기타"
        img_lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(img_lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        cl = clahe.apply(l)
        img = cv2.cvtColor(cv2.merge((cl,a,b)), cv2.COLOR_LAB2BGR)
        h, w = img.shape[:2]
        center_img = img[h//3:h*2//3, w//3:w*2//3]
        if center_img.size == 0: center_img = img
        data = np.float32(center_img.reshape((-1, 3)))
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
        _, _, center = cv2.kmeans(data, 1, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)
        b, g, r = center[0]
        hsv = cv2.cvtColor(np.uint8([[[b, g, r]]]), cv2.COLOR_BGR2HSV)[0][0]
        h_val, s_val, v_val = hsv
        if s_val < 35: 
            if v_val > 150: return "하양"
            if v_val < 60: return "검정"
            return "회색"
        if h_val < 10 or h_val > 170: return "빨강"
        if 10 <= h_val < 25: return "주황"
        if 25 <= h_val < 35: return "노랑"
        if 35 <= h_val < 85: return "초록"
        if 85 <= h_val < 130: return "파랑"
        if 130 <= h_val < 165: return "보라"
        if 165 <= h_val <= 170: return "분홍"
        return "기타"
    except:
        return "기타"

# --- 유사도 계산 ---
def calculate_similarity(a, b):
    return SequenceMatcher(None, a, b).ratio()

# --- DB 매칭 ---
def find_best_match_pill(detected_text: str, detected_color: str) -> Optional[Dict[str, Any]]:
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            if detected_text:
                sql = "SELECT * FROM pill_mfds WHERE (print_front LIKE %s OR print_back LIKE %s) AND (color_class1 LIKE %s OR color_class2 LIKE %s) LIMIT 1"
                cur.execute(sql, (f"%{detected_text}%", f"%{detected_text}%", f"%{detected_color}%", f"%{detected_color}%"))
                result = cur.fetchone()
                if result: return result
            if detected_text and len(detected_text) >= 1:
                sql = "SELECT * FROM pill_mfds WHERE (print_front LIKE %s OR print_back LIKE %s) LIMIT 1"
                cur.execute(sql, (f"%{detected_text}%", f"%{detected_text}%"))
                result = cur.fetchone()
                if result: return result
            search_colors = [detected_color]
            if detected_color == "회색": search_colors.append("하양")
            if detected_color == "빨강": search_colors.append("분홍")
            for color in search_colors:
                if color == "기타": continue
                if detected_text:
                    sql = "SELECT * FROM pill_mfds WHERE (color_class1 LIKE %s OR color_class2 LIKE %s) AND (print_front IS NOT NULL OR print_back IS NOT NULL)"
                    cur.execute(sql, (f"%{color}%", f"%{color}%"))
                    candidates = cur.fetchall()
                    best_match = None
                    highest_score = 0.0
                    for pill in candidates:
                        f, b = pill.get('print_front') or "", pill.get('print_back') or ""
                        score = max(calculate_similarity(detected_text, f), calculate_similarity(detected_text, b))
                        if score > highest_score:
                            highest_score = score
                            best_match = pill
                    if highest_score >= 0.4: return best_match
                sql = "SELECT * FROM pill_mfds WHERE (color_class1 LIKE %s OR color_class2 LIKE %s) ORDER BY RAND() LIMIT 1"
                cur.execute(sql, (f"%{color}%", f"%{color}%"))
                result = cur.fetchone()
                if result: return result
            return None
    finally:
        conn.close()

# API
@app.get("/")
def read_root():
    return {"message": "백엔드 서버가 정상적으로 실행 중입니다!"}

@app.post("/api/pills/analyze")
async def analyze_multiple_pills(file: UploadFile = File(...)):
    if os.path.exists("debug_images"):
        for f in os.listdir("debug_images"):
            try: os.remove(os.path.join("debug_images", f))
            except: pass
    if not vision_client: return {"success": False, "message": "Vision API Error"}
    try:
        original_bytes = await file.read()
        pil_image = Image.open(io.BytesIO(original_bytes))
        pil_image = fix_image_orientation(pil_image)
        cropped_images = detect_multiple_pills_hybrid(pil_image)
        analyzed_results = []
        for i, img_bytes in enumerate(cropped_images):
            color = get_pill_color_hsv(img_bytes)
            vision_img = vision.Image(content=img_bytes)
            text = ""
            try:
                text_res = vision_client.text_detection(image=vision_img)
                text = extract_best_pill_text(text_res.text_annotations)
            except: pass
            matched_pill = find_best_match_pill(text, color)
            analyzed_results.append({
                "detected_info": {"print": text, "color": color},
                "pill_info": matched_pill
            })
        return {"success": True, "count": len(analyzed_results), "results": analyzed_results}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check(): return {"status": "ok"}

# ✅ 1. 약 검색 API
@app.get("/api/pills")
# ✅ 1. 약 검색 API (수정본: 증상 검색 + 인기순 정렬 추가)
@app.get("/api/pills")
def search_pills(
    keyword: Optional[str] = Query(None),
    drug_shape: Optional[str] = Query(None),
    color_class: Optional[str] = Query(None),
    print_front: Optional[str] = Query(None),
    print_back: Optional[str] = Query(None),
    entp_name: Optional[str] = Query(None),
    class_no: Optional[str] = Query(None),
    # 👇 정렬 파라미터 추가 (기본값: popular)
    sort: str = Query("popular", description="정렬: popular(인기순), recent(최신순), name(이름순)"),
    page: int = Query(1),
    page_size: int = Query(20, alias="page_size"),
    authorization: Optional[str] = Header(None)
):
    size = page_size
    offset = (page - 1) * size
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            # 1. 로그인 유저 확인
            current_user_id = None
            if authorization:
                try:
                    token = authorization.split(" ")[1]
                    from routers.auth import get_current_user
                    user = get_current_user(token)
                    current_user_id = user['id']
                    
                    # 검색 로그 저장
                    if keyword:
                        cur.execute("INSERT INTO search_logs (user_id, keyword) VALUES (%s, %s)", (current_user_id, keyword))
                        conn.commit()
                except:
                    pass

            # 2. 쿼리 기본 구조 (pill_easy_info 테이블과 JOIN 추가)
            # m: 기본정보, e: 효능/증상 정보
            base_query = """
                FROM pill_mfds AS m
                LEFT JOIN pill_easy_info AS e ON m.item_seq = e.item_seq
            """
            
            where_clauses = ["1=1"]
            params = []

            # 3. 검색 조건 설정
            if keyword:
                kw = f"%{keyword}%"
                # ✅ [핵심] 약 이름 OR 제조사 OR '효능(efcy_qesitm)'에서 검색
                where_clauses.append("(m.item_name LIKE %s OR m.entp_name LIKE %s OR e.efcy_qesitm LIKE %s)")
                params.extend([kw, kw, kw])
            
            if drug_shape:
                where_clauses.append("m.drug_shape = %s")
                params.append(drug_shape)
            if color_class:
                where_clauses.append("(m.color_class1 LIKE %s OR m.color_class2 LIKE %s)")
                params.extend([f"%{color_class}%", f"%{color_class}%"])
            if print_front:
                where_clauses.append("m.print_front LIKE %s")
                params.append(f"%{print_front}%")
            if print_back:
                where_clauses.append("m.print_back LIKE %s")
                params.append(f"%{print_back}%")
            if entp_name:
                where_clauses.append("m.entp_name LIKE %s")
                params.append(f"%{entp_name}%")
            if class_no:
                where_clauses.append("m.class_no LIKE %s")
                params.append(f"%{class_no}%")

            where_sql = " WHERE " + " AND ".join(where_clauses)

            # 4. 전체 개수 조회
            count_sql = f"SELECT COUNT(*) AS cnt {base_query} {where_sql}"
            cur.execute(count_sql, params)
            row = cur.fetchone()
            total = row["cnt"] if isinstance(row, dict) else row[0]

            # 5. 정렬(Sort) 로직 설정
            # popular: 좋아요 많은 순 -> 이름순
            if sort == "popular":
                order_by = """
                    ORDER BY (
                        COALESCE(m.popularity_score, 0) +
                        (COALESCE(m.view_count, 0) * 10000) +
                        (like_count * 50000)
                    ) DESC, m.item_name ASC
                """
            # recent: 품목일련번호 역순 (보통 번호가 클수록 최신)
            elif sort == "recent":
                order_by = "ORDER BY m.item_seq DESC"
            # name: 가나다순
            else:
                order_by = "ORDER BY m.item_name ASC"

            # 6. 최종 데이터 조회
            # 서브쿼리로 like_count(총 찜 개수)를 계산해서 가져옵니다.
            data_sql = f"""
                SELECT m.*, 
                (SELECT COUNT(*) FROM pill_likes WHERE item_seq = m.item_seq) as like_count,
                (SELECT COUNT(*) FROM pill_likes WHERE item_seq = m.item_seq AND user_id = %s) as is_liked_val
                {base_query}
                {where_sql}
                {order_by}
                LIMIT %s OFFSET %s
            """
            
            # 파라미터 순서: [user_id(서브쿼리용)] + [WHERE절 params] + [LIMIT] + [OFFSET]
            # 비로그인 유저면 user_id에 0이나 None을 넣어서 에러 방지
            search_user_id = current_user_id if current_user_id else 0
            full_params = [search_user_id] + params + [size, offset]
            
            cur.execute(data_sql, full_params)
            rows = cur.fetchall()
            
            # 7. 데이터 후처리
            for row in rows:
                row['is_liked'] = bool(row['is_liked_val'])
                # (선택사항) 프론트엔드에서 바로 보여줄 짧은 효능 요약 추가
                # if row.get('efcy_qesitm'):
                #     row['short_efficacy'] = row['efcy_qesitm'][:40] + "..."

        return {
            "total": total,
            "page": page,
            "size": size,
            "sort": sort,
            "items": rows
        }
    finally:
        conn.close()

# ✅ 2. 약 찜하기 토글 API
@app.post("/api/pills/{item_seq}/like")
def toggle_pill_like(item_seq: str, user: dict = Depends(get_current_user)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM pill_likes WHERE user_id=%s AND item_seq=%s", (user['id'], item_seq))
            if cur.fetchone():
                cur.execute("DELETE FROM pill_likes WHERE user_id=%s AND item_seq=%s", (user['id'], item_seq))
                liked = False
            else:
                cur.execute("INSERT INTO pill_likes (user_id, item_seq) VALUES (%s, %s)", (user['id'], item_seq))
                liked = True
            conn.commit()
            return {"is_liked": liked}
    finally:
        conn.close()

@app.get("/pills/{item_seq}")
def get_pill_detail(item_seq: int):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("UPDATE pill_mfds SET view_count = view_count + 1 WHERE item_seq = %s", (item_seq,))
            conn.commit() # 저장 필수
            sql = """SELECT m.*, e.efcy_qesitm, e.use_method_qesitm, e.atpn_warn_qesitm, e.atpn_qesitm, e.intrc_qesitm, e.se_qesitm, e.deposit_method_qesitm 
                    FROM pill_mfds AS m LEFT JOIN pill_easy_info AS e ON m.item_seq = e.item_seq WHERE m.item_seq = %s"""
            cur.execute(sql, (item_seq,))
            data = cur.fetchone()
        if not data: raise HTTPException(status_code=404, detail="Not Found")
        return {"pill": data}
    finally:
        conn.close()

# ✅ 3. [신규] 단순 알약 감지 (위치 및 확률 반환)
@app.post("/api/predict")
async def predict_only(file: UploadFile = File(...)):
    """
    이미지를 받아 알약의 위치(BBox)와 확신도(Confidence)만 반환합니다.
    (Google Vision 사용 안 함 -> 빠름)
    """
    if yolo_model is None:
        raise HTTPException(status_code=500, detail="모델이 로드되지 않았습니다.")

    try:
        # 이미지 읽기
        image_data = await file.read()
        pil_image = Image.open(io.BytesIO(image_data))
        pil_image = fix_image_orientation(pil_image) # 회전 보정

        # 예측 실행
        results = yolo_model(pil_image, conf=0.5) # 확신도 50% 이상만
        
        detections = []
        found_pill = False

        for result in results:
            if len(result.boxes) > 0:
                found_pill = True
            
            for box in result.boxes:
                detections.append({
                    "confidence": round(float(box.conf), 2),
                    "bbox": box.xywh.tolist()[0] # [x_center, y_center, width, height]
                })

        return {
            "success": True,
            "filename": file.filename,
            "found_pill": found_pill,
            "count": len(detections),
            "predictions": detections
        }

    except Exception as e:
        print(f"Predict Error: {e}")
        return {"success": False, "error": str(e)}
    
# --- main.py 맨 아래에 추가하세요 ---

@app.get("/api/clear-history")
def clear_search_history():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("DELETE FROM search_logs") # 모든 검색 기록 삭제
    conn.commit()
    conn.close()
    return {"message": "검색 기록이 모두 깨끗하게 삭제되었습니다! ✨"}