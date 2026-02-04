import os
import json
import re
import pymysql
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, UploadFile, File, Query, Depends, Request, HTTPException
from jose import jwt, JWTError
import google.generativeai as genai
from dotenv import load_dotenv

from db import get_conn

# ---------------------------------------------------------
# [0] 환경 설정
# ---------------------------------------------------------
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

if not GOOGLE_API_KEY:
    print("❌ [ERROR] GOOGLE_API_KEY가 없습니다.")
else:
    genai.configure(api_key=GOOGLE_API_KEY)

# ✅ 모든 기능을 담당할 라우터
router = APIRouter(prefix="/api/pills", tags=["pills"])

# ---------------------------------------------------------
# [1] 유저 ID 추출 헬퍼 함수 (토큰 만료 방지)
# ---------------------------------------------------------
def get_current_user_id_optional(request: Request) -> Optional[int]:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username: return None
            
        conn = get_conn()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT id FROM users WHERE username = %s", (username,))
                row = cur.fetchone()
                if row:
                    return row['id'] if isinstance(row, dict) else row[0]
                return None
        finally:
            conn.close()
    except Exception:
        return None

# ---------------------------------------------------------
# [2] AI 이미지 분석 관련 함수들
# ---------------------------------------------------------
def ask_gemini(image_bytes):
    try:
        model = genai.GenerativeModel('gemini-2.0-flash') 
        prompt = """
        Analyze this pill image. Return a JSON object with these fields:
        - shape: (choose one: 원형, 타원형, 장방형, 삼각형, 사각형, 마름모, 오각형, 육각형, 팔각형)
        - color: (choose one: 하양, 노랑, 주황, 분홍, 빨강, 갈색, 연두, 초록, 청록, 파랑, 남색, 보라, 회색, 검정, 투명)
        - print: (text printed on the pill, if any)
        Return ONLY the JSON. No markdown.
        """
        image_parts = [{"mime_type": "image/jpeg", "data": image_bytes}]
        response = model.generate_content([prompt, image_parts[0]])
        text = re.sub(r"```json|```", "", response.text).strip()
        return json.loads(text)
    except Exception as e:
        print(f"❌ Gemini 분석 실패: {e}")
        return None

@router.post("/analyze")
async def analyze_pill(file: UploadFile = File(...)):
    print(f"📸 이미지 수신: {file.filename}")
    contents = await file.read()
    gemini_result = ask_gemini(contents)
    
    detected_info = {}
    if gemini_result:
        detected_info = {
            "shape": gemini_result.get("shape", ""),
            "color": gemini_result.get("color", ""),
            "print": gemini_result.get("print", "")
        }
    else:
        return {"success": False, "message": "AI가 약을 인식하지 못했습니다."}

    # AI 결과로 DB 검색 (간단 버전)
    conn = get_conn()
    matched_pills = []
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cur:
            shape_query = f"%{detected_info.get('shape', '')}%"
            color_query = f"%{detected_info.get('color', '')}%"
            print_query = f"%{detected_info.get('print', '').strip()}%"

            sql = """
                SELECT * FROM pill_mfds 
                WHERE drug_shape LIKE %s AND color_class1 LIKE %s
            """
            params = [shape_query, color_query]
            
            if detected_info.get('print', '').strip():
                sql += " AND (print_front LIKE %s OR print_back LIKE %s)"
                params.extend([print_query, print_query])
                
            sql += " LIMIT 10"
            cur.execute(sql, tuple(params))
            matched_pills = cur.fetchall()
    finally:
        conn.close()

    results = []
    for pill in matched_pills:
        results.append({"detected_info": detected_info, "pill_info": pill})

    return {"success": True, "results": results}

# ---------------------------------------------------------
# [3] 통합 검색 API (검색 기록 저장 + 상세 필터링)
# ---------------------------------------------------------
@router.get("")
def search_pills(
    keyword: Optional[str] = Query(None),
    drug_shape: Optional[str] = Query(None),
    color_class: Optional[str] = Query(None),
    print_front: Optional[str] = Query(None),
    print_back: Optional[str] = Query(None),
    entp_name: Optional[str] = Query(None),
    class_no: Optional[str] = Query(None),
    sort: str = Query("popular"),
    page: int = 1,
    page_size: int = 20,
    current_user_id: Optional[int] = Depends(get_current_user_id_optional)
):
    conn = get_conn()
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cur:
            
            # ✅ 1. 검색 기록 저장 (로그인 시 & 키워드 있을 시)
            if keyword and current_user_id:
                try:
                    cur.execute("DELETE FROM search_history WHERE user_id = %s AND keyword = %s", (current_user_id, keyword))
                    cur.execute("INSERT INTO search_history (user_id, keyword, created_at) VALUES (%s, %s, NOW())", (current_user_id, keyword))
                    conn.commit()
                except Exception as e:
                    print(f"❌ 검색 기록 저장 실패: {e}")
                    conn.rollback()

            # ✅ 2. 검색 쿼리 구성 (search.py의 강력한 로직 사용)
            base_from = "FROM pill_mfds AS m LEFT JOIN pill_easy_info AS e ON m.item_seq = e.item_seq"
            where_clauses = ["1=1"]
            params = []

            if keyword:
                k = f"%{keyword.strip()}%"
                where_clauses.append("(replace(m.item_name,' ','') LIKE %s OR replace(m.entp_name,' ','') LIKE %s OR replace(e.efcy_qesitm,' ','') LIKE %s)")
                # 공백 제거 검색을 위해 키워드도 공백 제거
                k_nospace = f"%{keyword.strip().replace(' ', '')}%"
                params.extend([k_nospace, k_nospace, k_nospace])

            if drug_shape:
                where_clauses.append("m.drug_shape LIKE %s")
                params.append(f"%{drug_shape}%")

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

            where_sql = "WHERE " + " AND ".join(where_clauses)

            # 정렬
            if sort == "popular":
                order_by = "ORDER BY m.view_count DESC, m.item_name ASC"
            elif sort == "recent":
                order_by = "ORDER BY m.item_seq DESC"
            else:
                order_by = "ORDER BY m.item_name ASC"

            # 개수 조회
            cur.execute(f"SELECT COUNT(*) AS cnt {base_from} {where_sql}", tuple(params))
            total = cur.fetchone()["cnt"]

            # 목록 조회
            offset = (page - 1) * page_size
            sql = f"SELECT m.* {base_from} {where_sql} {order_by} LIMIT %s OFFSET %s"
            cur.execute(sql, tuple(params + [page_size, offset]))
            items = cur.fetchall()

            # 좋아요 여부 체크
            if current_user_id:
                cur.execute("SELECT item_seq FROM pill_likes WHERE user_id = %s", (current_user_id,))
                liked_seqs = {row['item_seq'] for row in cur.fetchall()}
                for item in items:
                    item['is_liked'] = item['item_seq'] in liked_seqs
            else:
                for item in items:
                    item['is_liked'] = False
            
            # 이미지 URL 수정
            for item in items:
                if item.get('item_image'):
                    item['item_image'] = item['item_image'].replace('127.0.0.1', '3.38.78.49')

            return {"items": items, "total": total, "page": page, "page_size": page_size}
    finally:
        conn.close()

# ---------------------------------------------------------
# [4] 약 상세 조회 API (search.py 기능 복구)
# ---------------------------------------------------------
@router.get("/{item_seq}")
def get_pill_detail(item_seq: str, current_user_id: Optional[int] = Depends(get_current_user_id_optional)):
    conn = get_conn()
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cur:
            # 조회수 증가
            cur.execute("UPDATE pill_mfds SET view_count = view_count + 1 WHERE item_seq = %s", (item_seq,))
            conn.commit()

            sql = """
                SELECT m.*, 
                       e.efcy_qesitm, e.use_method_qesitm, e.atpn_warn_qesitm, 
                       e.atpn_qesitm, e.intrc_qesitm, e.se_qesitm, e.deposit_method_qesitm
                FROM pill_mfds AS m 
                LEFT JOIN pill_easy_info AS e ON m.item_seq = e.item_seq 
                WHERE m.item_seq = %s
            """
            cur.execute(sql, (item_seq,))
            pill = cur.fetchone()

            if not pill:
                raise HTTPException(status_code=404, detail="해당 약을 찾을 수 없습니다.")

            # 이미지 URL 수정
            if pill.get('item_image'):
                pill['item_image'] = pill['item_image'].replace('127.0.0.1', '3.38.78.49')

            # 좋아요 여부
            pill['is_liked'] = False
            if current_user_id:
                cur.execute("SELECT 1 FROM pill_likes WHERE user_id = %s AND item_seq = %s", (current_user_id, item_seq))
                if cur.fetchone():
                    pill['is_liked'] = True

            return {"pill": pill}
    finally:
        conn.close()

# ---------------------------------------------------------
# [5] 좋아요 토글 API (search.py 기능 복구)
# ---------------------------------------------------------
@router.post("/{item_seq}/like")
def toggle_like(item_seq: str, current_user_id: Optional[int] = Depends(get_current_user_id_optional)):
    if not current_user_id:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.")

    conn = get_conn()
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cur:
            cur.execute("SELECT * FROM pill_likes WHERE user_id = %s AND item_seq = %s", (current_user_id, item_seq))
            existing = cur.fetchone()

            if existing:
                cur.execute("DELETE FROM pill_likes WHERE user_id = %s AND item_seq = %s", (current_user_id, item_seq))
                is_liked = False
            else:
                cur.execute("INSERT INTO pill_likes (user_id, item_seq) VALUES (%s, %s)", (current_user_id, item_seq))
                is_liked = True
            
            conn.commit()
            return {"is_liked": is_liked}
    finally:
        conn.close()