from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from fastapi.middleware.cors import CORSMiddleware
from routers import pill_router

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], #처음에는 *로두고, 나중에 특정 도메인만 허용해도 됨
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
#다른 포트에서 웹페이지가 api를 호출해도 cors에러 안남
app.include_router(pill_router) 
@app.get("/")
def read_root():
    return {"message":"Pilly backend is running!"}