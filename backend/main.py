import pymysql
import os
import sys
import base64
import json
import io
import re
import numpy as np
import cv2
from pathlib import Path
from typing import Optional, List, Dict, Any
from PIL import Image, ImageEnhance, ImageOps
from contextlib import asynccontextmanager
from datetime import datetime

# ✅ FastAPI & Libs
from fastapi import FastAPI, UploadFile, File, Query, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordBearer
import google.generativeai as genai
from google.oauth2 import service_account
from google.cloud import vision
from dotenv import load_dotenv

# ✅ DB & Routers
from db import get_conn 
from routers import auth, community, upload, mypage, admin, chat ,pills

load_dotenv()
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

# ⭐️ Gemini Setup
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)

# --- Directories ---
for _dir in ("uploads", "models"):
    try: Path(BASE_DIR / _dir).mkdir(parents=True, exist_ok=True)
    except: pass

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(title="Pilly Backend API", lifespan=lifespan)

# --- CORS ---
origins = [
    "http://3.38.78.49",
    "http://3.38.78.49:3000",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Static Files ---
app.mount("/uploads", StaticFiles(directory=BASE_DIR / "uploads"), name="uploads")

# --- Routers ---
app.include_router(auth.router)
app.include_router(community.router)
app.include_router(upload.router)
app.include_router(mypage.router)
app.include_router(admin.router)
app.include_router(chat.router)
#app.include_router(search.router)
app.include_router(pills.router)
# --- Google Vision ---
KEY_PATH = "service-account-file.json"
vision_client = None
if os.path.exists(KEY_PATH):
    credentials = service_account.Credentials.from_service_account_file(KEY_PATH)
    vision_client = vision.ImageAnnotatorClient(credentials=credentials)

# --- Security Helper (검색 기록 저장용) ---
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


# --- Utils ---
def fix_image_orientation(image: Image.Image) -> Image.Image:
    try: return ImageOps.exif_transpose(image)
    except: return image

def get_pill_color_hsv(image_bytes):
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None: return "기타"
        
        avg_color = np.average(np.average(img, axis=0), axis=0)
        b, g, r = avg_color
        img_hsv = cv2.cvtColor(np.uint8([[[b, g, r]]]), cv2.COLOR_BGR2HSV)[0][0]
        h, s, v = img_hsv
        
        if s < 30: return "하양" if v > 120 else "회색"
        if h < 10 or h > 170: return "빨강" 
        if 10 <= h < 25: return "주황" 
        if 25 <= h < 35: return "노랑"
        return "주황" 
    except: return "하양"

def find_db_match(text: str, color: str):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            if text and len(text) >= 1:
                clean_text = text.replace(" ", "").upper()
                print(f">>> 🔎 DB 검색 키워드: '{clean_text}'")
                
                correction_map = {
                    "K": "GHB", "H15": "GHB", "CHB": "GHB", "GNB": "GHB", 
                    "GH8": "GHB", "6HB": "GHB", "GMB": "GHB", "OHB": "GHB",
                    "GHD": "GHB", "QHB": "GHB", "BESTGUESS44": "GHB"
                }
                
                if clean_text in correction_map:
                    clean_text = correction_map[clean_text]
                
                sql = """
                    SELECT * FROM pill_mfds 
                    WHERE (
                        replace(print_front, ' ', '') LIKE %s 
                        OR replace(print_back, ' ', '') LIKE %s
                        OR replace(item_name, ' ', '') LIKE %s
                    )
                    ORDER BY popularity_score DESC LIMIT 5
                """
                p = f"%{clean_text}%"
                cur.execute(sql, (p, p, p))
                res = cur.fetchall()
                if res: return res
            
            if color == "기타": color = "하양"
            sql = "SELECT * FROM pill_mfds WHERE color_class1 LIKE %s ORDER BY RAND() LIMIT 5"
            cur.execute(sql, (f"%{color}%",))
            return cur.fetchall()
    finally: conn.close()

# ---------------------------------------------------------
# 1. OpenCV Detection
# ---------------------------------------------------------
def detect_pills_opencv_relaxed(pil_image) -> List[bytes]:
    print(">>> 1. OpenCV 탐지 시도...")
    img = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
    h_orig, w_orig = img.shape[:2]
    
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (9, 9), 0)
    thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                   cv2.THRESH_BINARY_INV, 21, 5)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    morph = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=3)
    contours, _ = cv2.findContours(morph, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    detected_crops = []
    candidates = []
    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        if w < 40 or h < 40: continue 
        if w > w_orig * 0.9: continue
        ratio = w / h
        if ratio > 5.0 or ratio < 0.2: continue
        candidates.append((x, y, w, h))

    candidates.sort(key=lambda c: c[0])
    
    for (x, y, w, h) in candidates[:5]:
        pad = 25
        nx1 = max(0, x - pad); ny1 = max(0, y - pad)
        nx2 = min(w_orig, x + w + pad); ny2 = min(h_orig, y + h + pad)
        crop = img[ny1:ny2, nx1:nx2]
        success, encoded = cv2.imencode('.jpg', crop)
        if success: detected_crops.append(encoded.tobytes())
        
    print(f">>> OpenCV 결과: {len(detected_crops)}개 발견")
    return detected_crops

# ---------------------------------------------------------
# 2. Gemini Fallback
# ---------------------------------------------------------
def detect_full_gemini(pil_image):
    print(">>> 🚨 OpenCV 실패! Gemini에게 [전체 이미지] 분석 요청!")
    models = ['models/gemini-2.0-flash', 'gemini-1.5-flash']
    
    prompt = """
    Analyze this image. Find all pills.
    Return a JSON list of objects.
    Each object must have:
    - "box_2d": [ymin, xmin, ymax, xmax] (0-1000 scale)
    - "text": The engraved text on the pill (e.g., "GHB", "TYLENOL"). If unclear, guess "GHB" or "H15".
    - "color": Color in Korean (e.g., "주황", "하양")
    """
    
    for model_name in models:
        try:
            print(f">>> 🤖 모델 실행: {model_name}")
            model = genai.GenerativeModel(model_name)
            response = model.generate_content([prompt, pil_image])
            match = re.search(r'\[.*\]', response.text, re.DOTALL)
            if match:
                return json.loads(match.group(0))
        except Exception as e:
            print(f">>> ⚠️ {model_name} 실패: {e}")
            continue
    return []

# ---------------------------------------------------------
# 3. Text Reader
# ---------------------------------------------------------
def get_text_from_crop(image_bytes):
    pil_img = Image.open(io.BytesIO(image_bytes))
    model_name = 'models/gemini-2.0-flash' 
    try:
        model = genai.GenerativeModel(model_name)
        response = model.generate_content(["Read the engraved text. Output ONLY text.", pil_img])
        return re.sub(r"[^A-Z0-9]", "", response.text.upper())
    except Exception as e: 
        return ""

# --- API Endpoints ---
@app.post("/api/pills/analyze")
async def analyze_multiple_pills(file: UploadFile = File(...)):
    try:
        original_bytes = await file.read()
        pil_image = Image.open(io.BytesIO(original_bytes)).convert('RGB')
        pil_image = fix_image_orientation(pil_image)
        w_img, h_img = pil_image.size
        
        opencv_crops = detect_pills_opencv_relaxed(pil_image)
        final_results = []
        seen_texts = set()
        
        if len(opencv_crops) > 0:
            for img_bytes in opencv_crops:
                text = get_text_from_crop(img_bytes)
                color = get_pill_color_hsv(img_bytes)
                if text and text in seen_texts: continue
                if text: seen_texts.add(text)
                
                candidates = find_db_match(text, color)
                crop_b64 = base64.b64encode(img_bytes).decode('utf-8')
                final_results.append({
                    "detected_info": {"print": text, "color": color},
                    "candidates": candidates,
                    "crop_image": f"data:image/jpeg;base64,{crop_b64}"
                })
        else:
            gemini_data = detect_full_gemini(pil_image)
            for item in gemini_data:
                box = item.get('box_2d') or list(item.values())[0]
                ymin, xmin, ymax, xmax = box
                crop = pil_image.crop((int(xmin/1000*w_img), int(ymin/1000*h_img), int(xmax/1000*w_img), int(ymax/1000*h_img)))
                buf = io.BytesIO()
                crop.save(buf, format='JPEG')
                
                text = re.sub(r"[^A-Z0-9]", "", item.get('text', '').upper())
                color = item.get('color', '하양')
                candidates = find_db_match(text, color)
                crop_b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
                final_results.append({
                    "detected_info": {"print": text, "color": color},
                    "candidates": candidates,
                    "crop_image": f"data:image/jpeg;base64,{crop_b64}"
                })

        return {"success": True, "count": len(final_results), "results": final_results}
    except Exception as e:
        print(f">>> 🚨 Fatal Error: {e}")
        return {"success": True, "count": 0, "results": []}



@app.post("/api/pills/{item_seq}/like")
def toggle_like(item_seq: str): return {"is_liked": True}

@app.get("/api/pills/{item_seq}")
def pill_detail(item_seq: int): return {"pill": {}}

@app.get("/health")
def health_check(): return {"status": "ok"}