from fastapi import APIRouter, Depends, HTTPException, status
from db import get_conn
from routers.auth import get_current_user
from pydantic import BaseModel
from typing import Optional

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"]
)

# 🛡️ 관리자 권한 체크 함수
def check_admin(user: dict = Depends(get_current_user)):
    if user.get("role") != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="관리자 권한이 필요합니다."
        )
    return user

# --- 데이터 모델 (Pydantic) ---

# 1. 일반 회원 정보 수정용 (차단, 메모 등)
class UserUpdate(BaseModel):
    role: Optional[str] = None
    is_banned: Optional[bool] = None
    admin_memo: Optional[str] = None

# 2. 권한 변경 전용 모델 (✅ 새로 추가됨)
class RoleUpdate(BaseModel):
    role: str

# --- API 엔드포인트 ---

# 1. 회원 목록 조회 (검색 기능 포함)
@router.get("/users")
def get_all_users(
    admin: dict = Depends(check_admin),
    keyword: Optional[str] = None
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

# ✅ [핵심 추가] 사용자 권한 변경 API (ADMIN <-> USER 토글용)
@router.put("/users/{user_id}/role")
def update_user_role(user_id: int, data: RoleUpdate, admin: dict = Depends(check_admin)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            # 유저 존재 확인
            cur.execute("SELECT id FROM users WHERE id = %s", (user_id,))
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")

            # 권한 업데이트
            cur.execute("UPDATE users SET role = %s WHERE id = %s", (data.role, user_id))
            conn.commit()
            return {"message": "권한이 변경되었습니다."}
    finally:
        conn.close()

# 3. 회원 정보 수정 (메모, 차단 등 일반 수정)
@router.put("/users/{user_id}")
def update_user(user_id: int, user_data: UserUpdate, admin: dict = Depends(check_admin)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            # 값이 들어온 것만 업데이트 (동적 쿼리)
            fields = []
            values = []
            
            if user_data.role is not None:
                fields.append("role = %s")
                values.append(user_data.role)
            
            if user_data.is_banned is not None:
                fields.append("is_banned = %s")
                values.append(user_data.is_banned)
                
            if user_data.admin_memo is not None:
                fields.append("admin_memo = %s")
                values.append(user_data.admin_memo)
            
            if not fields:
                return {"message": "변경할 내용이 없습니다."}
            
            values.append(user_id)
            sql = f"UPDATE users SET {', '.join(fields)} WHERE id = %s"
            
            cur.execute(sql, tuple(values))
            conn.commit()
            return {"message": "회원 정보가 수정되었습니다."}
    finally:
        conn.close()

# 4. 전체 게시글 목록 조회 (관리자용)
@router.get("/posts")
def get_all_posts_admin(admin: dict = Depends(check_admin)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
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

# 5. 게시글 삭제
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

# 6. 게시글 숨김 처리 토글
@router.put("/posts/{post_id}/hide")
def toggle_post_hide(post_id: int, admin: dict = Depends(check_admin)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("UPDATE posts SET is_hidden = NOT is_hidden WHERE id = %s", (post_id,))
            conn.commit()
            return {"message": "게시글 상태가 변경되었습니다."}
    finally:
        conn.close()

# 7. 대시보드 통계
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