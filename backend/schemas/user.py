# backend/schemas/user.py

from pydantic import BaseModel
from typing import Optional

# 회원가입 데이터
class UserCreate(BaseModel):
    username: str
    password: str
    name: str
    real_name: Optional[str] = None
    recovery_email: Optional[str] = None
    birthdate: Optional[str] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
# 로그인 데이터
class UserLogin(BaseModel):
    username: str
    password: str

# 토큰 응답 데이터
class Token(BaseModel):
    access_token: str
    token_type: str
    name: str
    username: str

# ✅ [추가] 유저 정보 응답 데이터 (비밀번호 제외)
class UserOut(BaseModel):
    id: int
    username: str
    name: str
    real_name: Optional[str] = None
    email: Optional[str] = None