# backend/routers/admin.py

from fastapi import APIRouter, Depends, HTTPException, status
from db import get_conn
from routers.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"]
)
class UserUpdate(BaseModel):
    role: str

# 🛡️ 관리자 권한 체크 함수 (Dependency)
def check_admin(user: dict = Depends(get_current_user)):
    if user.get("role") != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="관리자 권한이 필요합니다."
        )
    return user

# 1. 전체 회원 목록 조회
# backend/routers/admin.py

# ... (기존 import들)
from typing import Optional # 👈 검색어용

class UserUpdate(BaseModel):
    role: str
    is_banned: bool
    admin_memo: Optional[str] = None
    
# ... (기존 코드들)

# 1. [수정] 회원 목록 조회 (검색 기능 추가!)
@router.get("/users")
def get_all_users(
    admin: dict = Depends(check_admin),
    keyword: Optional[str] = None # 👈 검색어 파라미터
):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            sql = "SELECT id, username, name, role, created_at, is_banned, admin_memo FROM users"
            params = []
            if keyword:
                sql += " WHERE username LIKE %s OR name LIKE %s"
                params.extend([f"%{keyword}%", f"%{keyword}%"])
            
            sql += " ORDER BY created_at DESC"
            cur.execute(sql, params)
            return cur.fetchall()
    finally:
        conn.close()


# [수정] 회원 정보 수정 (차단, 메모 기능 포함)
@router.put("/users/{user_id}")
def update_user(user_id: int, user_data: UserUpdate, admin: dict = Depends(check_admin)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            sql = "UPDATE users SET role = %s, is_banned = %s, admin_memo = %s WHERE id = %s"
            cur.execute(sql, (user_data.role, user_data.is_banned, user_data.admin_memo, user_id))
            conn.commit()
            return {"message": "updated"}
    finally:
        conn.close()


# 3. 전체 게시글 관리 (삭제)
@router.delete("/posts/{post_id}")
def delete_any_post(post_id: int, admin: dict = Depends(check_admin)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM posts WHERE id = %s", (post_id,))
            conn.commit()
            return {"message": "게시글이 삭제되었습니다."}
    finally:
        conn.close()

# 4. 대시보드 통계 (가입자 수, 게시글 수 등)
@router.get("/stats")
def get_dashboard_stats(admin: dict = Depends(check_admin)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) as count FROM users")
            user_count = cur.fetchone()['count']
            
            cur.execute("SELECT COUNT(*) as count FROM posts")
            post_count = cur.fetchone()['count']

            return {
                "user_count": user_count,
                "post_count": post_count
            }
    finally:
        conn.close()

        # backend/routers/admin.py 맨 아래에 추가

# 기존 get_all_posts_admin 함수를 이걸로 교체하세요
@router.get("/posts")
def get_all_posts_admin(admin: dict = Depends(check_admin)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            # ✅ p.is_hidden 추가됨!
            sql = """
                SELECT p.id, p.title, u.username, p.views, p.created_at, p.is_hidden
                FROM posts p
                JOIN users u ON p.user_id = u.id
                ORDER BY p.created_at DESC
            """
            cur.execute(sql)
            return cur.fetchall()
    finally:
        conn.close()
        # backend/routers/admin.py 맨 아래에 추가

@router.put("/posts/{post_id}/hide")
def toggle_post_hide(post_id: int, admin: dict = Depends(check_admin)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            # 현재 상태 확인 후 반대로 뒤집기 (Toggle)
            cur.execute("UPDATE posts SET is_hidden = NOT is_hidden WHERE id = %s", (post_id,))
            conn.commit()
            return {"message": "changed"}
    finally:
        conn.close()
        # 6. [추가] 회원 권한 수정
@router.put("/users/{user_id}")
def update_user_role(user_id: int, user_data: UserUpdate, admin: dict = Depends(check_admin)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            # 해당 유저의 권한을 변경 (예: USER -> ADMIN)
            cur.execute("UPDATE users SET role = %s WHERE id = %s", (user_data.role, user_id))
            conn.commit()
            return {"message": "updated"}
    finally:
        conn.close()