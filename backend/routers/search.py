from fastapi import APIRouter, Query, HTTPException
from typing import Optional

from db import get_conn  # db.py 에서 가져오기

router = APIRouter(prefix="/api", tags=["search"])


@router.get("/ping")
async def ping():
    return {"status": "ok", "service": "search"}


@router.get("/pills")
async def search_pills(
    keyword: str = Query(..., description="약 이름이나 앞/뒷면 식별문자"),
    page: int = 1,
    page_size: int = 20,
):
    """
    pill_mfds 테이블에서 약 검색하기
    - item_name, print_front, print_back 에 keyword가 들어간 것 찾기
    """
    if page < 1 or page_size < 1:
        raise HTTPException(status_code=400, detail="page와 page_size는 1 이상이어야 합니다.")

    offset = (page - 1) * page_size
    like = f"%{keyword}%"

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            # 1) 목록 조회
            cur.execute(
                """
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
                WHERE
                    item_name   LIKE %s
                    OR print_front LIKE %s
                    OR print_back  LIKE %s
                ORDER BY item_name
                LIMIT %s OFFSET %s
                """,
                (like, like, like, page_size, offset),
            )
            items = cur.fetchall()

            # 2) 총 개수
            cur.execute(
                """
                SELECT COUNT(*) AS cnt
                FROM pill_mfds
                WHERE
                    item_name   LIKE %s
                    OR print_front LIKE %s
                    OR print_back  LIKE %s
                """,
                (like, like, like),
            )
            total = cur.fetchone()["cnt"]

    finally:
        conn.close()

    return {
        "keyword": keyword,
        "page": page,
        "page_size": page_size,
        "total": total,
        "items": items,
    }
