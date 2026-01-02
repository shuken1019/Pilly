import os
import httpx
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from db import get_conn
from schemas.user import UserCreate, UserLogin, Token, UserOut
from utils.security import get_password_hash, verify_password, create_access_token, SECRET_KEY, ALGORITHM
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError

# 카카오 앱 키 (따옴표 필수)
KAKAO_CLIENT_ID = "234076b99f1688d6769264ebd5c51548"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)

# 카카오 인증 코드를 받을 모델
class KakaoCode(BaseModel):
    code: str

# 1. 회원가입 API
@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(user: UserCreate):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM users WHERE username = %s", (user.username,))
            if cur.fetchone():
                raise HTTPException(status_code=400, detail="이미 사용 중인 아이디입니다.")
            
            hashed_pw = get_password_hash(user.password)
            
            # 일반 회원가입 시에도 email 컬럼을 같이 채워주면 좋습니다. (필요 시 수정)
            sql = """
                INSERT INTO users (
                    username, password, name, 
                    real_name, birthdate, phone, email, 
                    role
                ) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """

            cur.execute(sql, (
                user.username, 
                hashed_pw, 
                user.name, 
                user.real_name, 
                user.birthdate, 
                user.phone, 
                user.email, 
                "user"  # 기본 역할은 일반 사용자
            ))
            conn.commit()
            return {"message": "회원가입 성공"}
    finally:
        conn.close()

# 2. 로그인 API
@router.post("/login", response_model=Token)
def login(user: UserLogin):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            # 로그인 시 모든 정보 가져오기
            cur.execute("SELECT * FROM users WHERE username = %s", (user.username,))
            db_user = cur.fetchone()
            
            if not db_user or not verify_password(user.password, db_user['password']):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="아이디 또는 비밀번호가 잘못되었습니다."
                )
            
            access_token = create_access_token(data={"sub": db_user['username']})
            
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "name": db_user['name'],
                "username": db_user['username']
            }
    finally:
        conn.close()

# 3. 현재 로그인한 사용자 정보 가져오기 (Dependency)
def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="자격 증명이 유효하지 않습니다.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            # ✅ [핵심] SELECT * 를 사용하여 real_name, birthdate 등 모든 컬럼을 가져옵니다.
            cur.execute("SELECT * FROM users WHERE username = %s", (username,))
            user = cur.fetchone()
            
            if user is None:
                raise credentials_exception
            
            return user
    finally:
        conn.close()

# 4. 내 정보 조회 API
@router.get("/me", response_model=UserOut)
def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user

# ✅ 5. 카카오 로그인 API
@router.post("/kakao")
async def kakao_login(data: KakaoCode):
    # 1. 카카오 토큰 요청
    token_url = "https://kauth.kakao.com/oauth/token"
    payload = {
        "grant_type": "authorization_code",
        "client_id": KAKAO_CLIENT_ID,
        "redirect_uri": "http://localhost:5173/oauth/kakao", 
        "code": data.code
    }
    
    async with httpx.AsyncClient() as client:
        token_res = await client.post(token_url, data=payload)
    
    if token_res.status_code != 200:
        print(f"카카오 토큰 발급 에러: {token_res.text}")
        raise HTTPException(status_code=400, detail="카카오 토큰 발급 실패")

    token_json = token_res.json()
    kakao_access_token = token_json.get("access_token")

    # 2. 카카오 사용자 정보 요청
    user_info_url = "https://kapi.kakao.com/v2/user/me"
    headers = {
        "Authorization": f"Bearer {kakao_access_token}",
        "Content-type": "application/x-www-form-urlencoded;charset=utf-8",
    }
    
    async with httpx.AsyncClient() as client:
        user_info_res = await client.get(user_info_url, headers=headers)
        
    if user_info_res.status_code != 200:
        raise HTTPException(status_code=400, detail="카카오 유저 정보 조회 실패")

    user_info = user_info_res.json()
    kakao_account = user_info.get("kakao_account")
    kakao_id = user_info.get("id")

    if not kakao_account:
        raise HTTPException(status_code=400, detail="카카오 계정 정보를 읽을 수 없습니다.")

    email = kakao_account.get("email", "")
    nickname = kakao_account.get("profile", {}).get("nickname", "카카오유저")

    # 3. DB 처리 (회원가입/로그인)
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            username_key = f"kakao_{kakao_id}"
            
            cur.execute("SELECT * FROM users WHERE username = %s", (username_key,))
            user = cur.fetchone()

            if not user:
                # 신규 가입
                hashed_pw = get_password_hash(f"kakao_pw_{kakao_id}")
                
                # ✅ [수정] email 컬럼에도 값을 같이 넣어줍니다.
                insert_sql = """
                    INSERT INTO users (username, password, name, recovery_email, email, role) 
                    VALUES (%s, %s, %s, %s, %s, %s)
                """
                cur.execute(insert_sql, (username_key, hashed_pw, nickname, email, email, "USER"))
                conn.commit()
                
                cur.execute("SELECT * FROM users WHERE username = %s", (username_key,))
                user = cur.fetchone()
            
            access_token = create_access_token(data={"sub": user['username']})
            
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "name": user['name'],
                "username": user['username']
            }
    finally:
        conn.close()