# backend/routers/mypage.py

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File # 👈 UploadFile, File 추가됨
from pydantic import BaseModel
from typing import Optional
from db import get_conn
from routers.auth import get_current_user
from utils.security import verify_password, get_password_hash # 비밀번호 변경용
import shutil # 👈 파일 저장용
import os     # 👈 경로 설정용
import uuid   # 👈 고유 파일명용

router = APIRouter(prefix="/api/mypage", tags=["mypage"])

# ---------------------------------------------------
# 1. 내 프로필 조회
# ---------------------------------------------------
@router.get("/profile")
def get_my_profile(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "username": current_user["username"],
        "name": current_user["name"],
        "role": current_user["role"],
        "realName": current_user.get("real_name"),
        "birthdate": current_user.get("birthdate"),
        "phone": current_user.get("phone"),
        "email": current_user.get("email"),
        "profileImage": current_user.get("profile_image")
    }

# ---------------------------------------------------
# 2. 프로필 정보 수정 (텍스트)
# ---------------------------------------------------
class ProfileUpdate(BaseModel):
    name: str 
    real_name: Optional[str] = None
    birthdate: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

@router.put("/profile")
def update_my_profile(data: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            # 닉네임 중복 체크 (내 닉네임 아닐 때만)
            if data.name != current_user['name']:
                cur.execute("SELECT id FROM users WHERE name = %s", (data.name,))
                if cur.fetchone():
                    raise HTTPException(status_code=400, detail="이미 사용 중인 닉네임입니다.")

            # 정보 업데이트
            sql = """
                UPDATE users 
                SET name = %s, 
                    real_name = %s, 
                    birthdate = %s, 
                    phone = %s, 
                    email = %s
                WHERE username = %s
            """
            cur.execute(sql, (
                data.name, 
                data.real_name, 
                data.birthdate, 
                data.phone, 
                data.email, 
                current_user['username']
            ))
            conn.commit()
            
            return {"message": "프로필이 성공적으로 수정되었습니다."}
    except Exception as e:
        print(f"프로필 수정 에러: {e}")
        raise HTTPException(status_code=500, detail="서버 오류가 발생했습니다.")
    finally:
        conn.close()

# ---------------------------------------------------
# 3. 비밀번호 변경
# ---------------------------------------------------
class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str

@router.put("/profile/password")
def update_my_password(data: PasswordUpdate, current_user: dict = Depends(get_current_user)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT password FROM users WHERE id = %s", (current_user['id'],))
            db_user = cur.fetchone()
            
            if not db_user:
                raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
                
            if not verify_password(data.current_password, db_user['password']):
                raise HTTPException(status_code=400, detail="현재 비밀번호가 일치하지 않습니다.")
            
            new_hashed_pw = get_password_hash(data.new_password)
            
            cur.execute("UPDATE users SET password = %s WHERE id = %s", (new_hashed_pw, current_user['id']))
            conn.commit()
            
            return {"message": "비밀번호가 성공적으로 변경되었습니다."}
    finally:
        conn.close()

# ---------------------------------------------------
# 4. 프로필 이미지 업로드 (여기가 문제였던 부분)
# ---------------------------------------------------
@router.post("/profile/image")
async def upload_profile_image(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    try:
        # 파일 저장 위치 (backend/uploads 폴더)
        UPLOAD_DIR = "uploads"
        
        # 파일명 중복 방지 (UUID 사용)
        file_extension = file.filename.split(".")[-1]
        unique_filename = f"{current_user['username']}_{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        # 서버에 파일 저장
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
      
        image_url = f"http://3.38.78.49:8000/uploads/{unique_filename}"
        
        # DB 업데이트
        conn = get_conn()
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE users SET profile_image = %s WHERE id = %s", 
                (image_url, current_user['id'])
            )
            conn.commit()
        conn.close()
        
        return {"imageUrl": image_url}
        
    except Exception as e:
        print(f"이미지 업로드 실패: {e}")
        raise HTTPException(status_code=500, detail="이미지 저장 중 오류가 발생했습니다.")

# ---------------------------------------------------
# 5. 기타 마이페이지 기능 (조회)
# ---------------------------------------------------
@router.get("/history")
def get_my_search_history(user: dict = Depends(get_current_user)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, keyword, created_at
                FROM search_logs
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT 10
                """,
                (user["id"],),
            )
            return {"items": cur.fetchall()}
    finally:
        conn.close()

@router.get("/posts")
def get_my_posts(user: dict = Depends(get_current_user)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, category, title, created_at, views, like_count
                FROM posts
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT 30
                """,
                (user["id"],),
            )
            return {"items": cur.fetchall()}
    finally:
        conn.close()

@router.get("/scraps")
def my_scraps(user: dict = Depends(get_current_user)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    pl.item_seq,
                    pl.created_at,
                    p.item_name,
                    p.entp_name,
                    p.item_image,
                    p.print_front,
                    p.print_back,
                    p.drug_shape,
                    p.color_class1,
                    p.color_class2
                FROM pill_likes pl
                JOIN pill_mfds p ON p.item_seq = pl.item_seq
                WHERE pl.user_id = %s
                ORDER BY pl.created_at DESC
                LIMIT 50
                """,
                (user["id"],),
            )
            return {"items": cur.fetchall()}
    finally:
        conn.close()
        # ✅ [추가] 회원 탈퇴 API
@router.delete("/profile")
def withdraw_account(current_user: dict = Depends(get_current_user)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            # 유저 삭제 쿼리 실행
            cur.execute("DELETE FROM users WHERE id = %s", (current_user['id'],))
            conn.commit()
            
            return {"message": "회원 탈퇴가 완료되었습니다."}
    except Exception as e:
        print(f"탈퇴 에러: {e}")
        raise HTTPException(status_code=500, detail="탈퇴 처리 중 오류가 발생했습니다.")
    finally:
        conn.close()