# backend/routers/community.py

from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import List, Optional
from db import get_conn
from routers.auth import get_current_user

# ✅ [수정] prefix 설정 및 태그 추가
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
@router.post("", status_code=201)
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
# 2. 게시글 목록 (수정됨: 숨김 처리된 글 제외하기)
@router.get("/{category}")
def get_posts(category: str, authorization: Optional[str] = Header(None)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            current_user_id = None
            if authorization:
                try:
                    token = authorization.split(" ")[1]
                    user = get_current_user(token)
                    current_user_id = user['id']
                except: pass

            if current_user_id:
                # ✅ 로그인 유저: 좋아요 여부 확인 + 숨김 글 제외(is_hidden = 0)
                sql = """
                    SELECT p.*, u.username, u.name,
                    (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count,
                    (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = %s) as is_liked_val
                    FROM posts p 
                    JOIN users u ON p.user_id = u.id 
                    WHERE p.category = %s AND p.is_hidden = 0 
                    ORDER BY p.created_at DESC
                """
                cur.execute(sql, (current_user_id, category))
            else:
                # ✅ 비로그인 유저: 숨김 글 제외(is_hidden = 0)
                sql = """
                    SELECT p.*, u.username, u.name,
                    (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count,
                    0 as is_liked_val
                    FROM posts p 
                    JOIN users u ON p.user_id = u.id 
                    WHERE p.category = %s AND p.is_hidden = 0 
                    ORDER BY p.created_at DESC
                """
                cur.execute(sql, (category,))

            rows = cur.fetchall()
            for row in rows:
                row['is_liked'] = bool(row['is_liked_val'])
            return rows
    finally:
        conn.close()
# 3. 게시글 상세
@router.get("/post/{post_id}")
def get_post_detail(post_id: int, authorization: Optional[str] = Header(None)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("UPDATE posts SET views = views + 1 WHERE id = %s", (post_id,))
            conn.commit()

            sql = """
                SELECT p.*, u.username, u.name,
                (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as real_like_count
                FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = %s
            """
            cur.execute(sql, (post_id,))
            post = cur.fetchone()
            if not post: raise HTTPException(status_code=404, detail="Post not found")
            
            post['like_count'] = post['real_like_count']
            
            is_liked = False
            if authorization:
                try:
                    token = authorization.split(" ")[1]
                    user = get_current_user(token)
                    cur.execute("SELECT 1 FROM post_likes WHERE user_id=%s AND post_id=%s", (user['id'], post_id))
                    if cur.fetchone(): is_liked = True
                except: pass
            
            post['is_liked'] = is_liked
            return post
    finally:
        conn.close()

# 4. 게시글 수정
@router.put("/{post_id}")
def update_post(post_id: int, post: PostCreate, user: dict = Depends(get_current_user)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT user_id FROM posts WHERE id = %s", (post_id,))
            row = cur.fetchone()
            if not row or row['user_id'] != user['id']:
                raise HTTPException(status_code=403, detail="권한 없음")
            
            cur.execute("UPDATE posts SET category=%s, title=%s, content=%s, image_url=%s WHERE id=%s", 
                        (post.category, post.title, post.content, post.image_url, post_id))
            conn.commit()
            return {"message": "updated"}
    finally:
        conn.close()

# 5. 게시글 삭제
@router.delete("/{post_id}")
def delete_post(post_id: int, user: dict = Depends(get_current_user)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT user_id FROM posts WHERE id = %s", (post_id,))
            row = cur.fetchone()
            if not row or row['user_id'] != user['id']:
                raise HTTPException(status_code=403, detail="권한 없음")
            
            cur.execute("DELETE FROM posts WHERE id = %s", (post_id,))
            conn.commit()
            return {"message": "deleted"}
    finally:
        conn.close()

# 6. 좋아요 토글
@router.post("/{post_id}/like")
def like_post(post_id: int, user: dict = Depends(get_current_user)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM post_likes WHERE user_id=%s AND post_id=%s", (user['id'], post_id))
            if cur.fetchone():
                cur.execute("DELETE FROM post_likes WHERE user_id=%s AND post_id=%s", (user['id'], post_id))
                is_liked = False
            else:
                cur.execute("INSERT INTO post_likes (user_id, post_id) VALUES (%s, %s)", (user['id'], post_id))
                is_liked = True
            conn.commit()
            
            cur.execute("SELECT COUNT(*) as cnt FROM post_likes WHERE post_id=%s", (post_id,))
            cnt = cur.fetchone()['cnt']
            cur.execute("UPDATE posts SET like_count=%s WHERE id=%s", (cnt, post_id))
            conn.commit()
            
            return {"like_count": cnt, "is_liked": is_liked}
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
            return {
                "id": cur.lastrowid, "user_id": user['id'], "username": user['username'], 
                "content": comment.content, "created_at": "방금", "like_count": 0
            }
    finally:
        conn.close()

# 8. 댓글 목록
@router.get("/{post_id}/comments")
def get_comments(post_id: int):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            sql = "SELECT c.*, u.username, u.name FROM comments c JOIN users u ON c.user_id = u.id WHERE c.post_id = %s ORDER BY c.created_at DESC"
            cur.execute(sql, (post_id,))
            return cur.fetchall()
    finally:
        conn.close()

# 9. 댓글 삭제
@router.delete("/comments/{comment_id}")
def delete_comment(comment_id: int, user: dict = Depends(get_current_user)):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT user_id FROM comments WHERE id = %s", (comment_id,))
            row = cur.fetchone()
            if not row or row['user_id'] != user['id']:
                raise HTTPException(status_code=403, detail="권한 없음")
            cur.execute("DELETE FROM comments WHERE id = %s", (comment_id,))
            conn.commit()
            return {"message": "deleted"}
    finally:
        conn.close()