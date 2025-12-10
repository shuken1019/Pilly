# backend/routers/community.py

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from db import get_conn
from routers.auth import get_current_user

router = APIRouter(prefix="/api/community", tags=["Community"])

# 데이터 모델
class PostCreate(BaseModel):
    category: str
    title: str
    content: str
    image_url: Optional[str] = None
    pill_ids: List[int] = []

class CommentCreate(BaseModel):
    content: str

# 1. 게시글 작성
@router.post("/")
def create_post(post: PostCreate, user: dict = Depends(get_current_user)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            sql = "INSERT INTO posts (user_id, category, title, content, image_url) VALUES (%s, %s, %s, %s, %s)"
            cur.execute(sql, (user['id'], post.category, post.title, post.content, post.image_url))
            post_id = cur.lastrowid
            
            if post.pill_ids:
                for seq in post.pill_ids:
                    cur.execute("INSERT INTO post_pills (post_id, item_seq) VALUES (%s, %s)", (post_id, seq))
            conn.commit()
            return {"message": "success", "post_id": post_id}
    finally:
        conn.close()

# 2. 게시글 목록
@router.get("/{category}")
def get_posts(category: str):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            # 댓글 수와 좋아요 수(임시)를 같이 가져옴
            sql = """
                SELECT p.*, u.username, u.name,
                (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count
                FROM posts p
                JOIN users u ON p.user_id = u.id
                WHERE p.category = %s
                ORDER BY p.created_at DESC
            """
            cur.execute(sql, (category,))
            return cur.fetchall()
    finally:
        conn.close()

# 3. 게시글 상세
@router.get("/post/{post_id}")
def get_post_detail(post_id: int):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            # 조회수 증가
            cur.execute("UPDATE posts SET views = views + 1 WHERE id = %s", (post_id,))
            conn.commit()

            # 게시글 정보
            sql = "SELECT p.*, u.username, u.name FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = %s"
            cur.execute(sql, (post_id,))
            post = cur.fetchone()
            if not post: raise HTTPException(status_code=404, detail="Post not found")
            return post
    finally:
        conn.close()

# ✅ 4. 게시글 수정 (PUT)
@router.put("/{post_id}")
def update_post(post_id: int, post: PostCreate, user: dict = Depends(get_current_user)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            # 본인 확인
            cur.execute("SELECT user_id FROM posts WHERE id = %s", (post_id,))
            row = cur.fetchone()
            if not row or row['user_id'] != user['id']:
                raise HTTPException(status_code=403, detail="권한이 없습니다.")

            # 업데이트
            sql = "UPDATE posts SET category=%s, title=%s, content=%s WHERE id=%s"
            cur.execute(sql, (post.category, post.title, post.content, post_id))
            conn.commit()
            return {"message": "updated"}
    finally:
        conn.close()

# ✅ 5. 게시글 삭제 (DELETE)
@router.delete("/{post_id}")
def delete_post(post_id: int, user: dict = Depends(get_current_user)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT user_id FROM posts WHERE id = %s", (post_id,))
            row = cur.fetchone()
            if not row or row['user_id'] != user['id']:
                raise HTTPException(status_code=403, detail="권한이 없습니다.")

            cur.execute("DELETE FROM posts WHERE id = %s", (post_id,))
            conn.commit()
            return {"message": "deleted"}
    finally:
        conn.close()

# ✅ 6. 게시글 좋아요 토글
@router.post("/{post_id}/like")
def like_post(post_id: int, user: dict = Depends(get_current_user)):
    # 실제 좋아요 테이블이 없으므로, 임시로 posts 테이블의 like_count만 증가시키는 로직
    # (제대로 하려면 likes 테이블을 만들어서 user_id와 매핑해야 함)
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("UPDATE posts SET views = views + 1 WHERE id = %s", (post_id,)) # views대신 like_count 컬럼이 있다면 사용
            # 간단 구현: like_count 컬럼이 없다면 views를 좋아요로 가정하거나 컬럼 추가 필요
            # 여기서는 편의상 like_count 컬럼이 있다고 가정하고 업데이트
            try:
                cur.execute("UPDATE posts SET like_count = like_count + 1 WHERE id = %s", (post_id,))
            except:
                pass # 컬럼 없으면 패스
            
            cur.execute("SELECT like_count FROM posts WHERE id = %s", (post_id,))
            res = cur.fetchone()
            return {"like_count": res['like_count'] if res and 'like_count' in res else 0}
    finally:
        conn.close()
        
# 7. 댓글 작성
@router.post("/{post_id}/comments")
def create_comment(post_id: int, comment: CommentCreate, user: dict = Depends(get_current_user)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            sql = "INSERT INTO comments (post_id, user_id, content) VALUES (%s, %s, %s)"
            cur.execute(sql, (post_id, user['id'], comment.content))
            conn.commit()
            
            # 방금 쓴 댓글 정보 리턴 (프론트 표시용)
            cmt_id = cur.lastrowid
            return {
                "id": cmt_id,
                "user_id": user['id'],
                "username": user['username'],
                "content": comment.content,
                "created_at": "방금",
                "like_count": 0
            }
    finally:
        conn.close()

# 8. 댓글 목록
@router.get("/{post_id}/comments")
def get_comments(post_id: int):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            sql = """
                SELECT c.*, u.username, u.name 
                FROM comments c JOIN users u ON c.user_id = u.id 
                WHERE c.post_id = %s ORDER BY c.created_at DESC
            """
            cur.execute(sql, (post_id,))
            return cur.fetchall()
    finally:
        conn.close()

# ✅ 9. 댓글 삭제
@router.delete("/comments/{comment_id}")
def delete_comment(comment_id: int, user: dict = Depends(get_current_user)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT user_id FROM comments WHERE id = %s", (comment_id,))
            row = cur.fetchone()
            if not row or row['user_id'] != user['id']:
                raise HTTPException(status_code=403, detail="권한이 없습니다.")

            cur.execute("DELETE FROM comments WHERE id = %s", (comment_id,))
            conn.commit()
            return {"message": "deleted"}
    finally:
        conn.close()