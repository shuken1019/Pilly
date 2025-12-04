# backend/routers/search.py

from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from db import get_conn  # db.py 에서 연결 함수 가져오기

# /api/pills 로 시작하게 하고 싶으면 prefix="/api"
router = APIRouter(prefix="/api", tags=["search"])

@router.get("/ping")
async def ping():
    return {"status": "ok", "service": "search"}

@router.get("/pills")
async def search_pills(
    keyword: Optional[str] = Query(None, description="약 이름 또는 통합 검색어"),
    drug_shape: Optional[str] = Query(None, description="약 모양"),
    color_class: Optional[str] = Query(None, description="색상"),
    print_front: Optional[str] = Query(None, description="식별문자(앞)"),
    print_back: Optional[str] = Query(None, description="식별문자(뒤)"),
    entp_name: Optional[str] = Query(None, description="제약회사명"),
    class_no: Optional[str] = Query(None, description="분류번호(효능)"),
    page: int = 1,
    page_size: int = 20,
):
    """
    pill_mfds 테이블에서 다중 조건 검색 (동적 쿼리)
    """
    if page < 1 or page_size < 1:
        raise HTTPException(status_code=400, detail="page와 page_size는 1 이상이어야 합니다.")

    offset = (page - 1) * page_size

    # 1) WHERE 조건과 파라미터 만들기
    where_clauses = []
    params = []

    # 키워드 (이름 / 식별문자)
    if keyword and keyword.strip():
        k = f"%{keyword.strip()}%"
        where_clauses.append(
            "(item_name LIKE %s OR print_front LIKE %s OR print_back LIKE %s)"
        )
        params.extend([k, k, k])

    # 모양
    if drug_shape:
        where_clauses.append("drug_shape = %s")
        params.append(drug_shape)

    # 색상 (1,2 중 하나라도 포함)
    if color_class:
        c = f"%{color_class}%"
        where_clauses.append("(color_class1 LIKE %s OR color_class2 LIKE %s)")
        params.extend([c, c])

    # 식별문자 앞/뒤
    if print_front:
        pf = f"%{print_front}%"
        where_clauses.append("print_front LIKE %s")
        params.append(pf)

    if print_back:
        pb = f"%{print_back}%"
        where_clauses.append("print_back LIKE %s")
        params.append(pb)

    # 제약회사
    if entp_name:
        en = f"%{entp_name}%"
        where_clauses.append("entp_name LIKE %s")
        params.append(en)

    # 효능 분류 코드
    if class_no:
        where_clauses.append("class_no = %s")
        params.append(class_no)

    # WHERE 절 합치기
    where_sql = ""
    if where_clauses:
        where_sql = "WHERE " + " AND ".join(where_clauses)

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            # (1) 전체 개수
            sql_count = f"SELECT COUNT(*) AS cnt FROM pill_mfds {where_sql}"
            cur.execute(sql_count, tuple(params))
            total_row = cur.fetchone()
            total = total_row["cnt"] if total_row else 0

            # (2) 실제 목록
            sql_select = f"""
                SELECT
                    item_seq,
                    item_name,
                    entp_name,
                    drug_shape,
                    color_class1,
                    color_class2,
                    print_front,
                    print_back,
                    item_image
                FROM pill_mfds
                {where_sql}
                ORDER BY item_name
                LIMIT %s OFFSET %s
            """
            select_params = params + [page_size, offset]
            cur.execute(sql_select, tuple(select_params))
            items = cur.fetchall()
    finally:
        conn.close()

    return {
        "keyword": keyword,
        "page": page,
        "page_size": page_size,
        "total": total,
        "items": items,
    }
