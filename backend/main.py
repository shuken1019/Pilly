# backend/main.py

from pathlib import Path
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from typing import Optional

from db import get_conn  # MySQL 연결 함수

BASE_DIR = Path(__file__).resolve().parent

# -------------------------------------------------------------------
# 디렉터리 보정: static/template 폴더가 없어도 mount 에러 안 나게 미리 생성
# -------------------------------------------------------------------
for _dir in ("templates", "css", "js", "assets", "templates/partials"):
    p = BASE_DIR / _dir
    try:
        p.mkdir(parents=True, exist_ok=True)
    except Exception:
        pass

# -------------------------------------------------------------------
# FastAPI 앱 & CORS 설정
# -------------------------------------------------------------------
app = FastAPI(title="Pilly Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # 나중에 도메인 생기면 여기 변경
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------------
# Static / templates mount
# -------------------------------------------------------------------
app.mount("/css", StaticFiles(directory=BASE_DIR / "css"), name="css")
app.mount("/js", StaticFiles(directory=BASE_DIR / "js"), name="js")
app.mount("/assets", StaticFiles(directory=BASE_DIR / "assets"), name="assets")


# -------------------------------------------------------------------
# 기본 페이지: index.html 반환
# -------------------------------------------------------------------
@app.get("/", response_class=FileResponse)
def serve_index():
    """
    루트 접속 시 templates/index.html 반환
    """
    index_path = BASE_DIR / "templates" / "index.html"
    if not index_path.exists():
        index_path.write_text(
            "<h1>Pilly Backend</h1><p>templates/index.html 을 아직 만들지 않았어요.</p>",
            encoding="utf-8",
        )
    return FileResponse(index_path)


# -------------------------------------------------------------------
# 약 검색 API
#   프론트: GET /api/pills?keyword=...&drug_shape=...&page=1&page_size=20
#   백엔드: /pills 와 /api/pills 둘 다 지원
# -------------------------------------------------------------------
@app.get("/pills")
@app.get("/api/pills")
def search_pills(
    keyword: Optional[str] = Query(None, description="제품명 / 회사명 검색"),
    drug_shape: Optional[str] = Query(None, description="정제 모양(원형/타원형/장방형 등)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, alias="page_size", ge=1, le=100),
):
    """
    pill_mfds 테이블 기준으로 기본 약 정보 검색

    - keyword: 제품명, 회사명 LIKE 검색
    - drug_shape: 모양 정확히 일치 검색
    """
    size = page_size
    offset = (page - 1) * size

    conn = get_conn()
    try:
        with conn.cursor() as cur:
            base_where = "WHERE 1=1"
            params: list = []

            # 🔍 키워드: 제품명 / 회사명만 검색 (mark_code_* 는 사용 X)
            if keyword:
                kw = f"%{keyword}%"
                base_where += """
                    AND (
                        m.item_name LIKE %s
                        OR m.entp_name LIKE %s
                    )
                """
                params.extend([kw, kw])

            # 🔍 모양 필터
            if drug_shape:
                base_where += " AND m.drug_shape = %s"
                params.append(drug_shape)

            # 전체 개수
            count_sql = f"SELECT COUNT(*) AS cnt FROM pill_mfds AS m {base_where}"
            cur.execute(count_sql, params)
            total = cur.fetchone()["cnt"]

            # 실제 데이터 (컬럼도 mark_code_* 제거)
            data_sql = f"""
                SELECT
                    m.item_seq,
                    m.item_name,
                    m.entp_name,
                    m.drug_shape,
                    m.color_class1,
                    m.color_class2,
                    m.item_image
                FROM pill_mfds AS m
                {base_where}
                ORDER BY m.item_seq
                LIMIT %s OFFSET %s
            """
            cur.execute(data_sql, params + [size, offset])
            rows = cur.fetchall()

        return {
            "total": total,
            "page": page,
            "size": size,
            "items": rows,
        }

    finally:
        conn.close()


# -------------------------------------------------------------------
# 약 상세 조회 API
#   GET /pills/{item_seq}
# -------------------------------------------------------------------
@app.get("/pills/{item_seq}")
def get_pill_detail(item_seq: int):
    """
    pill_mfds(기본 정보 전체) + pill_easy_info(e약은요 상세정보 일부) JOIN 해서 반환
    """
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            sql = """
                SELECT 
                    m.*,  -- pill_mfds의 모든 컬럼 (실제 있는 것만 알아서 가져옴)

                    -- e약은요 상세 정보 (우리가 추가한 컬럼들만)
                    e.efcy_qesitm,
                    e.use_method_qesitm,
                    e.atpn_warn_qesitm,
                    e.atpn_qesitm,
                    e.intrc_qesitm,
                    e.se_qesitm,
                    e.deposit_method_qesitm,
                    e.open_de,
                    e.update_de
                FROM pill_mfds AS m
                LEFT JOIN pill_easy_info AS e
                    ON m.item_seq = e.item_seq
                WHERE m.item_seq = %s
            """
            cur.execute(sql, (item_seq,))
            data = cur.fetchone()

        if not data:
            raise HTTPException(status_code=404, detail="해당 약을 찾을 수 없습니다.")

        return {"pill": data}

    finally:
        conn.close()




# -------------------------------------------------------------------
# 헬스 체크
# -------------------------------------------------------------------
@app.get("/health")
def health_check():
    return {"status": "ok"}
