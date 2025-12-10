# backend/schemas/user.py
from pydantic import BaseModel
from typing import Optional

# 회원가입 데이터 (모든 필드 추가)
class UserCreate(BaseModel):
    username: str
    password: str
    name: str
    # 👇 아래 4개 필드가 추가되어야 합니다!
    recovery_email: Optional[str] = None
    birthdate: Optional[str] = None
    gender: Optional[str] = None
    phone: Optional[str] = None

# 로그인 데이터
class UserLogin(BaseModel):
    username: str
    password: str

# 토큰 응답 데이터
class Token(BaseModel):
    access_token: str
    token_type: str
    name: str
    username:str