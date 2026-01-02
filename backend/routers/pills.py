# backend/routers/pills.py

import os
import json
import re
from fastapi import APIRouter, UploadFile, File
import google.generativeai as genai
from db import get_conn
from dotenv import load_dotenv

# 1. 환경변수 로드
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    print("❌ 오류: .env 파일에서 GOOGLE_API_KEY를 찾을 수 없습니다.")
else:
    print("✅ Google API 키 로드 성공")

genai.configure(api_key=GOOGLE_API_KEY)

router = APIRouter(prefix="/api/pills", tags=["pills"])

# ---------------------------------------------------------
# [1] Gemini에게 물어보는 함수
# ---------------------------------------------------------
def ask_gemini(image_bytes):
    try:
        # 사용자 환경에 맞는 모델 사용 (gemini-2.5-flash)
        model = genai.GenerativeModel('gemini-2.5-flash') 
        
        prompt = """
        Analyze this pill image. Return a JSON object with these fields:
        - shape: (choose one: 원형, 타원형, 장방형, 삼각형, 사각형, 마름모, 오각형, 육각형, 팔각형)
        - color: (choose one: 하양, 노랑, 주황, 분홍, 빨강, 갈색, 연두, 초록, 청록, 파랑, 남색, 보라, 회색, 검정, 투명)
        - print: (text printed on the pill, if any)
        
        Example format: {"shape": "타원형", "color": "분홍", "print": "BR"}
        Return ONLY the JSON. No markdown.
        """
        
        image_parts = [{"mime_type": "image/jpeg", "data": image_bytes}]
        response = model.generate_content([prompt, image_parts[0]])
        
        text = response.text
        text = re.sub(r"```json|```", "", text).strip()
        return json.loads(text)
        
    except Exception as e:
        print(f"❌ Gemini 분석 실패: {e}")
        return None

# ---------------------------------------------------------
# [2] 메인 분석 API
# ---------------------------------------------------------
@router.post("/analyze")
async def analyze_pill(file: UploadFile = File(...)):
    print(f"📸 이미지 수신: {file.filename}")
    
    contents = await file.read()
    
    # 1. YOLO (현재 미사용, 추후 확장 가능)
    yolo_results = [] 
    detected_info = {}
    
    # 2. Gemini 분석 실행
    if len(yolo_results) > 0:
        detected_info = yolo_results[0]
    else:
        print("⚠️ YOLO 결과 없음 -> Gemini에게 요청 중...")
        gemini_result = ask_gemini(contents)
        
        if gemini_result:
            print(f"✅ Gemini 응답 성공: {gemini_result}")
            detected_info = {
                "shape": gemini_result.get("shape", ""),
                "color": gemini_result.get("color", ""),
                "print": gemini_result.get("print", "")
            }
        else:
            return {"success": False, "message": "AI가 약을 인식하지 못했습니다."}

    # 3. DB 검색 (조건 완화 적용)
    conn = get_conn()
    matched_pills = []
    
    try:
        with conn.cursor() as cur:
            # 검색어 전처리
            shape_raw = detected_info.get('shape', '')
            color_raw = detected_info.get('color', '')
            print_raw = detected_info.get('print', '').strip()

            shape_query = f"%{shape_raw}%"
            color_query = f"%{color_raw}%"
            print_query = f"%{print_raw}%"

            print(f"🔎 DB 검색 시도: 모양[{shape_raw}], 색상[{color_raw}], 글자[{print_raw}]")

            # 🚨 핵심 수정: 검색 로직 분기
            # 글자가 감지되었을 때와 아닐 때를 나눠서 검색 정확도를 높임
            
            if print_raw: 
                # Case A: 글자가 있는 경우 -> (글자가 맞거나) OR (모양과 색상이 맞거나)
                sql = """
                    SELECT * FROM pill_mfds 
                    WHERE 
                        (print_front LIKE %s OR print_back LIKE %s)
                    OR
                        (drug_shape LIKE %s AND color_class1 LIKE %s)
                    LIMIT 10
                """
                cur.execute(sql, (print_query, print_query, shape_query, color_query))
                
            else:
                # Case B: 글자가 없는 경우 -> 모양과 색상만으로 검색
                sql = """
                    SELECT * FROM pill_mfds 
                    WHERE drug_shape LIKE %s AND color_class1 LIKE %s
                    LIMIT 10
                """
                cur.execute(sql, (shape_query, color_query))

            matched_pills = cur.fetchall()
            print(f"🔎 DB 검색 결과: {len(matched_pills)}개 발견")

    finally:
        conn.close()

    # 4. 결과 반환
    results = []
    for pill in matched_pills:
        results.append({
            "detected_info": detected_info,
            "pill_info": pill
        })

    return {"success": True, "results": results}