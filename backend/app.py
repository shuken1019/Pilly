from pathlib import Path

from fastapi import FastAPI,Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates



# base directory (this file's directory)
BASE_DIR = Path(__file__).resolve().parent

app = FastAPI()

# 💛 CORS 여기
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5500", "http://127.0.0.1:5500", "*"],  # 개발만 * 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우터 연결
app.include_router(pillRouter, prefix="/pills")
# template / static 연결: 절대 경로 사용
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))


# 정적 파일을 절대 경로로 마운트
app.mount("/css", StaticFiles(directory=str(BASE_DIR / "css")), name="css")
app.mount("/js", StaticFiles(directory=str(BASE_DIR / "js")), name="js")
app.mount("/assets", StaticFiles(directory=str(BASE_DIR / "assets")), name="assets")
app.mount(
    "/partials",
    StaticFiles(directory=str(BASE_DIR / "templates" / "partials")),
    name="partials",
)

# 임시 약 데이터 (나중에 MySQL로 바꿀 부분)
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
        "atpn_qesitm": "간질환 환자는 복용 전 의사와 상담."
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
        "atpn_qesitm": "위장 장애가 있는 경우 주의."
    },
]
# 홈: index.html 렌더링
@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})
# /pills?keyword= 검색 API
@app.get("/pills")
async def search_pills(keyword: str = ""):
    keyword = keyword.strip()
    if not keyword:
        return []

    results = []
    for pill in DUMMY_PILLS:
        if (keyword in pill["item_name"]
            or keyword in pill["entp_name"]
            or keyword in (pill["print_front"] or "")):
            results.append(pill)

    return results

#약 /{id}상세정보 API
@app.get("/pills/{pill_id}")
async def get_pill_detail(pill_id:int):
    for pill in DUMMY_PILLS:
        if pill["id"]==pill_id:
            return pill
    return {}