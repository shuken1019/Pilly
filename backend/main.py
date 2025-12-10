# backend/main.py

import os
import io
import math
import re
import numpy as np
import cv2
import uuid
from pathlib import Path
from typing import Optional, List, Dict, Any
from PIL import Image, ImageEnhance, ImageOps
from pillow_heif import register_heif_opener
from difflib import SequenceMatcher
from routers import auth,community  # 인증 관련 라우터 추가
# YOLO
from ultralytics import YOLO

register_heif_opener()

from fastapi import FastAPI, HTTPException, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from google.cloud import vision
from google.oauth2 import service_account

from db import get_conn

BASE_DIR = Path(__file__).resolve().parent

# --- 디렉터리 생성 ---
for _dir in ("templates", "css", "js", "assets", "debug_images"):
    try:
        Path(BASE_DIR / _dir).mkdir(parents=True, exist_ok=True)
    except Exception:
        pass

app = FastAPI(title="Pilly Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/css", StaticFiles(directory=BASE_DIR / "css"), name="css")
app.mount("/js", StaticFiles(directory=BASE_DIR / "js"), name="js")
app.mount("/assets", StaticFiles(directory=BASE_DIR / "assets"), name="assets")
app.mount("/debug_images", StaticFiles(directory=BASE_DIR / "debug_images"), name="debug_images")
app.include_router(auth.router)
app.include_router(community.router)
# --- 설정 로드 ---
KEY_PATH = "service-account-file.json"
vision_client = None
if os.path.exists(KEY_PATH):
    credentials = service_account.Credentials.from_service_account_file(KEY_PATH)
    vision_client = vision.ImageAnnotatorClient(credentials=credentials)

try:
    yolo_model = YOLO('best.pt') # 커스텀 모델 우선
except:
    try:
        yolo_model = YOLO('yolov8n.pt') # 없으면 기본 모델
    except:
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

# -------------------------------------------------------------------
# 🕵️‍♂️ [OpenCV] 강제 탐지 모드 (YOLO가 놓쳤을 때 사용)
# -------------------------------------------------------------------
def force_detect_opencv(pil_image) -> List[bytes]:
    """
    YOLO가 실패했을 때, 이미지 처리 기술(Thresholding + Contours)로
    알약으로 추정되는 모든 물체를 강제로 잘라냅니다.
    """
    img = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
    h, w = img.shape[:2]
    
    # 1. 전처리: 그레이스케일 -> 블러 (노이즈 제거)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (7, 7), 0)
    
    # 2. 이진화 (Adaptive Threshold): 배경과 물체를 분리
    # Block size를 19로 설정하여 작은 알약도 잡음
    thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 19, 3)
    
    # 3. 모폴로지 (작은 구멍 메우기)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    morph = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=2)
    
    # 4. 윤곽선 찾기
    contours, _ = cv2.findContours(morph, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    cropped_images = []
    
    for cnt in contours:
        area = cv2.contourArea(cnt)
        
        # (1) 크기 필터: 너무 작거나(먼지) 너무 큰(전체 바닥) 것 제외
        # 알약 크기: 전체 화면의 0.05% ~ 5% 사이로 가정
        if area < (w * h * 0.0005) or area > (w * h * 0.05):
            continue

        # (2) 비율 필터: 너무 길쭉한 건(나무 무늬) 제외
        x, y, cw, ch = cv2.boundingRect(cnt)
        aspect_ratio = float(cw) / ch
        if aspect_ratio > 3.0 or aspect_ratio < 0.3:
            continue
            
        # ✅ 알약으로 판단! 자르기 (여유 공간 Padding 추가)
        padding = 15
        nx = max(0, x - padding)
        ny = max(0, y - padding)
        nw = min(w - nx, cw + padding * 2)
        nh = min(h - ny, ch + padding * 2)
        
        crop = img[ny:ny+nh, nx:nx+nw]
        
        success, encoded = cv2.imencode('.jpg', crop)
        if success:
            cropped_images.append(encoded.tobytes())
            
    print(f"🕵️‍♂️ OpenCV 강제 탐지 결과: {len(cropped_images)}개 발견")
    return cropped_images

# -------------------------------------------------------------------
# 🚀 [YOLO + Hybrid] 하이브리드 탐지
# -------------------------------------------------------------------
def detect_multiple_pills_hybrid(pil_image) -> List[bytes]:
    if not yolo_model:
        return force_detect_opencv(pil_image)

    try:
        # [1단계] YOLO 시도 (민감도 극대화)
        enhancer = ImageEnhance.Sharpness(pil_image)
        pil_image_sharp = enhancer.enhance(2.0)
        
        results = yolo_model(pil_image_sharp, conf=0.01, iou=0.4) # conf 0.01: 1%만 의심돼도 잡음
        result = results[0]
        
        yolo_crops = []
        original_cv_img = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
        h_img, w_img = original_cv_img.shape[:2]

        for box in result.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            w_box, h_box = x2 - x1, y2 - y1
            
            # 너무 큰 배경만 제외
            if w_box * h_box > (w_img * h_img * 0.8): continue
            
            padding = 10
            nx1, ny1 = max(0, x1 - padding), max(0, y1 - padding)
            nx2, ny2 = min(w_img, x2 + padding), min(h_img, y2 + padding)
            crop = original_cv_img[ny1:ny2, nx1:nx2]
            
            success, encoded = cv2.imencode('.jpg', crop)
            if success: yolo_crops.append(encoded.tobytes())

        print(f"🤖 YOLO 감지 개수: {len(yolo_crops)}")

        # [2단계] YOLO가 너무 적게 찾았다면? (2개 미만) -> OpenCV 강제 실행!
        # 알약이 5개인데 1개만 찾았다면 실패한 것이므로 OpenCV로 다시 찾습니다.
        if len(yolo_crops) < 2:
            print("⚠️ YOLO가 알약을 충분히 못 찾음 -> OpenCV 모드 전환!")
            opencv_crops = force_detect_opencv(pil_image)
            # OpenCV가 더 많이 찾았으면 그걸로 대체
            if len(opencv_crops) > len(yolo_crops):
                return opencv_crops
        
        # YOLO가 2개 이상 찾았거나, OpenCV도 못 찾았으면 YOLO 결과 반환
        return yolo_crops if yolo_crops else force_detect_opencv(pil_image)

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

# --- DB 매칭 로직 ---
def find_best_match_pill(detected_text: str, detected_color: str) -> Optional[Dict[str, Any]]:
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            # 1. 정확 매칭
            if detected_text:
                sql = "SELECT * FROM pill_mfds WHERE (print_front LIKE %s OR print_back LIKE %s) AND (color_class1 LIKE %s OR color_class2 LIKE %s) LIMIT 1"
                cur.execute(sql, (f"%{detected_text}%", f"%{detected_text}%", f"%{detected_color}%", f"%{detected_color}%"))
                result = cur.fetchone()
                if result: return result

            # 2. 글자 매칭 (색상 무시)
            if detected_text and len(detected_text) >= 1:
                sql = "SELECT * FROM pill_mfds WHERE (print_front LIKE %s OR print_back LIKE %s) LIMIT 1"
                cur.execute(sql, (f"%{detected_text}%", f"%{detected_text}%"))
                result = cur.fetchone()
                if result: return result

            # 3. 색상 유사 매칭 + 랜덤 추천
            search_colors = [detected_color]
            if detected_color == "회색": search_colors.append("하양") # 회색->하양 보정
            if detected_color == "빨강": search_colors.append("분홍") 

            for color in search_colors:
                if color == "기타": continue
                
                # 유사도 매칭 (글자가 조금 틀렸을 때)
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

                # 글자도 없으면 그냥 색상 맞는거 랜덤 추천
                sql = "SELECT * FROM pill_mfds WHERE (color_class1 LIKE %s OR color_class2 LIKE %s) ORDER BY RAND() LIMIT 1"
                cur.execute(sql, (f"%{color}%", f"%{color}%"))
                result = cur.fetchone()
                if result: return result

            return None
    finally:
        conn.close()

# API
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
        
        # ✅ [수정] 하이브리드 탐지 사용
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
            
            print(f"💊 Pill #{i+1}: Text='{text}', Color='{color}'")

            matched_pill = find_best_match_pill(text, color)
            
            analyzed_results.append({
                "detected_info": {"print": text, "color": color},
                "pill_info": matched_pill
            })

        return {
            "success": True,
            "count": len(analyzed_results),
            "results": analyzed_results 
        }

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check(): return {"status": "ok"}

# ===================================================================
# 🔍 1. 약 검색 API (GET /api/pills) - 추가해주세요!
# ===================================================================
@app.get("/api/pills")
def search_pills(
    keyword: Optional[str] = Query(None),
    drug_shape: Optional[str] = Query(None),
    color_class: Optional[str] = Query(None),
    print_front: Optional[str] = Query(None),
    print_back: Optional[str] = Query(None),
    entp_name: Optional[str] = Query(None),
    class_no: Optional[str] = Query(None),
    page: int = Query(1),
    page_size: int = Query(20, alias="page_size"),
):
    size = page_size
    offset = (page - 1) * size
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            base_where = "WHERE 1=1"
            params: list = []

            # 1. 키워드 (이름, 제조사)
            if keyword:
                kw = f"%{keyword}%"
                base_where += " AND (m.item_name LIKE %s OR m.entp_name LIKE %s)"
                params.extend([kw, kw])

            # 2. 모양
            if drug_shape:
                base_where += " AND m.drug_shape = %s"
                params.append(drug_shape)
            
            # 3. 색상
            if color_class:
                base_where += " AND (m.color_class1 LIKE %s OR m.color_class2 LIKE %s)"
                c_kw = f"%{color_class}%"
                params.extend([c_kw, c_kw])

            # 4. 식별문자 (앞면)
            if print_front:
                base_where += " AND m.print_front LIKE %s"
                params.append(f"%{print_front}%")
            
            # 5. 식별문자 (뒷면)
            if print_back:
                base_where += " AND m.print_back LIKE %s"
                params.append(f"%{print_back}%")

            # 6. 제조사
            if entp_name:
                base_where += " AND m.entp_name LIKE %s"
                params.append(f"%{entp_name}%")

            # 7. 분류코드
            if class_no:
                base_where += " AND m.class_no LIKE %s"
                params.append(f"%{class_no}%")

            # --- 전체 개수 조회 ---
            count_sql = f"SELECT COUNT(*) AS cnt FROM pill_mfds AS m {base_where}"
            cur.execute(count_sql, params)
            row = cur.fetchone()
            
            # DB 설정(DictCursor)에 맞춰 딕셔너리로 값 꺼내기
            if row and isinstance(row, dict):
                total = row["cnt"]
            else:
                total = row[0] if row else 0

            # --- 데이터 조회 ---
            data_sql = f"""
                SELECT
                    m.item_seq, m.item_name, m.entp_name, m.drug_shape,
                    m.color_class1, m.color_class2, m.item_image,
                    m.print_front, m.print_back
                FROM pill_mfds AS m
                {base_where}
                ORDER BY m.item_seq
                LIMIT %s OFFSET %s
            """
            cur.execute(data_sql, params + [size, offset])
            rows = cur.fetchall()

        return {"total": total, "page": page, "size": size, "items": rows}
    finally:
        conn.close()


# ===================================================================
# 🔍 2. 약 상세 API (GET /pills/{item_seq}) - 이것도 없으면 추가하세요!
# ===================================================================
@app.get("/pills/{item_seq}")
def get_pill_detail(item_seq: int):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            sql = """
                SELECT m.*, e.efcy_qesitm, e.use_method_qesitm, e.atpn_warn_qesitm,
                       e.atpn_qesitm, e.intrc_qesitm, e.se_qesitm, e.deposit_method_qesitm,
                       e.open_de, e.update_de
                FROM pill_mfds AS m
                LEFT JOIN pill_easy_info AS e ON m.item_seq = e.item_seq
                WHERE m.item_seq = %s
            """
            cur.execute(sql, (item_seq,))
            data = cur.fetchone()

        if not data:
            raise HTTPException(status_code=404, detail="해당 약을 찾을 수 없습니다.")

        return {"pill": data}
    finally:
        conn.close()