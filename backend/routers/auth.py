# backend/routers/auth.py
from fastapi import APIRouter,Depends, HTTPException, status
from db import get_conn
from schemas.user import UserCreate, UserLogin, Token
from utils.security import get_password_hash, verify_password, create_access_token
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from utils.security import SECRET_KEY, ALGORITHM


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)

# 1. 회원가입 API
@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(user: UserCreate):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            # 아이디 중복 확인
            cur.execute("SELECT id FROM users WHERE username = %s", (user.username,))
            if cur.fetchone():
                raise HTTPException(status_code=400, detail="이미 사용 중인 아이디입니다.")
            
            # 비밀번호 암호화
            hashed_pw = get_password_hash(user.password)
            
            # DB 저장 (필드 추가됨)
            sql = """
                INSERT INTO users (username, password, name, recovery_email, birthdate, gender, phone) 
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            cur.execute(sql, (
                user.username, 
                hashed_pw, 
                user.name, 
                user.recovery_email, 
                user.birthdate, 
                user.gender, 
                user.phone
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
            # 아이디로 유저 찾기
            cur.execute("SELECT * FROM users WHERE username = %s", (user.username,))
            db_user = cur.fetchone()
            
            # 유저가 없거나 비밀번호가 틀리면 에러
            if not db_user or not verify_password(user.password, db_user['password']):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="아이디 또는 비밀번호가 잘못되었습니다."
                )
            
            # 토큰 발급
            access_token = create_access_token(data={"sub": db_user['username']})
            
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "name": db_user['name'],
                "username":db_user['username']
            }
    finally:
        conn.close()

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
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
            cur.execute("SELECT * FROM users WHERE username = %s", (username,))
            user = cur.fetchone()
            if user is None:
                raise credentials_exception
            return user
    finally:
        conn.close()