from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
import logging

# ─────────────────────────────────────
# 1. 기본 설정
# ─────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent

# ensure expected static/template directories exist to avoid mount errors
for _dir in ("templates", "css", "js", "assets", "templates/partials"):
    p = BASE_DIR / _dir
    try:
        p.mkdir(parents=True, exist_ok=True)
    except Exception:
        # directory creation should not crash app; log and continue
        logging.getLogger(__name__).warning(f"Could not create directory: {p}")

app = FastAPI()

# CORS (필요하면 그대로 두고, 아니면 나중에 지워도 됨)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 정적 파일(css, js, 이미지) 경로 매핑
app.mount("/css", StaticFiles(directory=str(BASE_DIR / "css")), name="css")
app.mount("/js", StaticFiles(directory=str(BASE_DIR / "js")), name="js")
app.mount("/assets", StaticFiles(directory=str(BASE_DIR / "assets")), name="assets")

# 템플릿 설정
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

# ─────────────────────────────────────
# 2. 기본 페이지 라우트
# ─────────────────────────────────────

# 메인(index) 페이지
@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


# header / footer partial (지금 main.js에서 /partials/header.html 이런 식으로 가져오니까)
@app.get("/partials/header.html", response_class=HTMLResponse)
async def header_partial():
    return FileResponse(BASE_DIR / "templates" / "partials" / "header.html")


@app.get("/partials/footer.html", response_class=HTMLResponse)
async def footer_partial():
    return FileResponse(BASE_DIR / "templates" / "partials" / "footer.html")


# ─────────────────────────────────────
# 3. 기능별 라우터 연결 (로그인 / 검색 / 업로드)
# ─────────────────────────────────────
from routers import auth, search, upload  # ← 제일 밑에 둬도 됨

app.include_router(auth.router)
app.include_router(search.router)
app.include_router(upload.router)
