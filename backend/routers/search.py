from fastapi import APIRouter, Query, HTTPException, Request
from typing import Optional
from db import get_conn
from jose import jwt
from utils.security import SECRET_KEY, ALGORITHM

# 라우터 설정 (/api/pills)
router = APIRouter(prefix="/api/pills", tags=["search"])

# --- 헬퍼 함수: 토큰에서 유저 ID 추출 ---
def get_current_user_id_optional(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username: return None
            
        conn = get_conn()
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM users WHERE username = %s", (username,))
            row = cur.fetchone()
            return row["id"] if row else None
    except Exception:
        return None
    finally:
        if 'conn' in locals(): conn.close()

# --- 1. 약 검색 API (정렬 + 효능 검색 포함) ---
@router.get("")
async def search_pills(
    request: Request,
    keyword: Optional[str] = Query(None),
    drug_shape: Optional[str] = Query(None),
    color_class: Optional[str] = Query(None),
    print_front: Optional[str] = Query(None),
    print_back: Optional[str] = Query(None),
    entp_name: Optional[str] = Query(None),
    class_no: Optional[str] = Query(None),
    sort: str = Query("popular", description="정렬"), # ✅ 정렬 파라미터 추가
    page: int = 1,
    page_size: int = 20,
):
    if page < 1 or page_size < 1:
        raise HTTPException(status_code=400, detail="page와 page_size는 1 이상이어야 합니다.")

    offset = (page - 1) * page_size
    
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            # ✅ 기본 정보(m)와 상세 정보(e)를 조인 (상세 내용으로도 검색 가능하게)
            base_from = "FROM pill_mfds AS m LEFT JOIN pill_easy_info AS e ON m.item_seq = e.item_seq"
            
            where_clauses = ["1=1"]
            params = []

            if keyword and keyword.strip():
                k = f"%{keyword.strip()}%"
                # 이름, 제조사, 그리고 '효능' 내용까지 검색
                where_clauses.append("(m.item_name LIKE %s OR m.entp_name LIKE %s OR e.efcy_qesitm LIKE %s)")
                params.extend([k, k, k])

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
                where_clauses.append("m.class_no = %s")
                params.append(class_no)

            where_sql = "WHERE " + " AND ".join(where_clauses)

            # ✅ 정렬 로직
            if sort == "popular":
                # 인기순 (조회수 + 좋아요 수 반영 등. 지금은 조회수 우선)
                order_by = "ORDER BY m.view_count DESC, m.item_name ASC"
            elif sort == "recent":
                # 최신순 (품목일련번호가 클수록 최신)
                order_by = "ORDER BY m.item_seq DESC"
            else:
                # 기본: 이름순
                order_by = "ORDER BY m.item_name ASC"

            # 1. 전체 개수 조회
            sql_count = f"SELECT COUNT(*) AS cnt {base_from} {where_sql}"
            cur.execute(sql_count, tuple(params))
            total = cur.fetchone()["cnt"]

            # 2. 목록 조회 (m.* 만 가져오면 목록에선 충분)
            sql_select = f"""
                SELECT m.* 
                {base_from}
                {where_sql}
                {order_by}
                LIMIT %s OFFSET %s
            """
            cur.execute(sql_select, tuple(params + [page_size, offset]))
            items = cur.fetchall()

            # 3. 좋아요 여부 체크
            user_id = get_current_user_id_optional(request)
            if user_id:
                cur.execute("SELECT item_seq FROM pill_likes WHERE user_id = %s", (user_id,))
                liked_seqs = {row['item_seq'] for row in cur.fetchall()}
                for item in items:
                    item['is_liked'] = item['item_seq'] in liked_seqs
            else:
                for item in items:
                    item['is_liked'] = False

            return {
                "page": page,
                "page_size": page_size,
                "total": total,
                "items": items,
            }

    finally:
        conn.close()

# --- 2. 약 상세 조회 API (수정됨: JOIN 추가) ---
@router.get("/{item_seq}")
async def get_pill_detail(item_seq: str, request: Request):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            # 조회수 증가
            cur.execute("UPDATE pill_mfds SET view_count = view_count + 1 WHERE item_seq = %s", (item_seq,))
            conn.commit()

            # ✅ 상세 정보를 같이 가져오기 위해 LEFT JOIN 사용
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

            # 좋아요 여부 확인
            user_id = get_current_user_id_optional(request)
            pill['is_liked'] = False
            
            if user_id:
                cur.execute(
                    "SELECT 1 FROM pill_likes WHERE user_id = %s AND item_seq = %s",
                    (user_id, item_seq)
                )
                if cur.fetchone():
                    pill['is_liked'] = True

            return {"pill": pill}

    finally:
        conn.close()

# --- 3. 좋아요 토글 API ---
@router.post("/{item_seq}/like")
async def toggle_like(item_seq: str, request: Request):
    user_id = get_current_user_id_optional(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.")

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            # 이미 좋아요 했는지 확인
            cur.execute("SELECT * FROM pill_likes WHERE user_id = %s AND item_seq = %s", (user_id, item_seq))
            existing = cur.fetchone()

            if existing:
                # 이미 있으면 삭제 (좋아요 취소)
                cur.execute("DELETE FROM pill_likes WHERE user_id = %s AND item_seq = %s", (user_id, item_seq))
                is_liked = False
            else:
                # 없으면 추가 (좋아요)
                cur.execute("INSERT INTO pill_likes (user_id, item_seq) VALUES (%s, %s)", (user_id, item_seq))
                is_liked = True
            
            conn.commit()
            return {"is_liked": is_liked}
    finally:
        conn.close()