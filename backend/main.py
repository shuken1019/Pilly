from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware


# base directory (this file's directory)
BASE_DIR = Path(__file__).resolve().parent

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 개발용: 필요시 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 템플릿 / 정적 파일 설정
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))
app.mount("/css", StaticFiles(directory=str(BASE_DIR / "css")), name="css")
app.mount("/js", StaticFiles(directory=str(BASE_DIR / "js")), name="js")
app.mount("/partials", StaticFiles(directory=str(BASE_DIR / "templates" / "partials")), name="partials")


# 임시 데이터 및 엔드포인트 (app.py의 내용을 통합)
DUMMY_PILLS = [
    {
        "id": 1,
        "item_name": "타이레놀정 160mg",
        "entp_name": "한국얀센",
        "drug_shape": "원형",
        "color_class1": "하양",
        "print_front": "TYL",
        "efcy_qesitm": "해열 및 진통에 사용합니다.",
        "use_method_qesitm": "성인은 1회 1~2정, 1일 3~4회 복용.",
        "atpn_qesitm": "간질환 환자는 복용 전 의사와 상담.",
    },
    {
        "id": 2,
        "item_name": "부루펜정",
        "entp_name": "삼일제약",
        "drug_shape": "원형",
        "color_class1": "분홍",
        "print_front": "IBU",
        "efcy_qesitm": "소염, 진통, 해열에 사용.",
        "use_method_qesitm": "식후에 충분한 물과 함께 복용.",
        "atpn_qesitm": "위장 장애가 있는 경우 주의.",
    },
]


@app.get("/about", response_class=HTMLResponse)
async def about(request: Request):
    return templates.TemplateResponse("about.html", {"request": request})


@app.get("/features", response_class=HTMLResponse)
async def features(request: Request):
    return templates.TemplateResponse("features.html", {"request": request})




@app.get("/search", response_class=HTMLResponse)
async def search(request: Request):
    return templates.TemplateResponse("search.html", {"request": request})


@app.get("/upload", response_class=HTMLResponse)
async def upload(request: Request):
    return templates.TemplateResponse("upload.html", {"request": request})


# /pills API (통합된 app.py 엔드포인트)
@app.get("/pills")
async def search_pills(keyword: str = ""):
    keyword = keyword.strip()
    if not keyword:
        return []

    results = []
    for pill in DUMMY_PILLS:
        if (
            keyword in pill["item_name"]
            or keyword in pill["entp_name"]
            or keyword in (pill["print_front"] or "")
        ):
            results.append(pill)

    return results


@app.get("/pills/{pill_id}")
async def get_pill_detail(pill_id: int):
    for pill in DUMMY_PILLS:
        if pill["id"] == pill_id:
            return pill
    return {}