// src/services/communityService.ts
import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api/community";

export interface CommunityPost {
  id: number;
  category: string;
  title: string;
  content: string;
  username: string;
  created_at: string;
  like_count: number;
  comment_count: number;
  pills?: {
    item_seq: string;
    item_name: string;
    item_image: string | null;
  }[];
}

export interface CommunityComment {
  id: number;
  user_id: number;
  username: string;
  content: string;
  created_at: string;
  like_count: number;
}

// 🟢 게시글 목록 조회
export async function getPosts(category: string): Promise<CommunityPost[]> {
  const res = await axios.get(`${API_URL}/${category}`);
  return res.data;
}

// 🟢 게시글 상세 조회
export async function getPostDetail(postId: number): Promise<CommunityPost> {
  const res = await axios.get(`${API_URL}/post/${postId}`);
  return res.data;
}

// 🟢 게시글 작성
export async function createPost(
  token: string,
  data: {
    category: string;
    title: string;
    content: string;
    pill_ids: number[];
  }
) {
  const res = await axios.post(`${API_URL}/`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

// ✅ [추가됨] 게시글 수정
export async function updatePost(
  token: string,
  postId: number,
  data: {
    category: string;
    title: string;
    content: string;
    pill_ids: number[];
  }
) {
  const res = await axios.put(`${API_URL}/${postId}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

// ✅ [추가됨] 게시글 삭제 (에러 원인 해결)
export async function deletePost(token: string, postId: number) {
  const res = await axios.delete(`${API_URL}/${postId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

// 🟢 게시글 좋아요
export async function togglePostLike(
  token: string,
  postId: number
): Promise<{ like_count: number }> {
  const res = await axios.post(
    `${API_URL}/${postId}/like`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
}

// 🟢 댓글 목록 조회
export async function getComments(postId: number): Promise<CommunityComment[]> {
  const res = await axios.get(`${API_URL}/${postId}/comments`);
  return res.data;
}

// 🟢 댓글 작성
export async function createComment(
  token: string,
  postId: number,
  content: string
) {
  const res = await axios.post(
    `${API_URL}/${postId}/comments`,
    { content },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
}

// ✅ [추가됨] 댓글 삭제
export async function deleteComment(token: string, commentId: number) {
  const res = await axios.delete(`${API_URL}/comments/${commentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

// 🟢 댓글 좋아요
export async function toggleCommentLike(
  token: string,
  commentId: number
): Promise<{ like_count: number }> {
  const res = await axios.post(
    `${API_URL}/comments/${commentId}/like`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
}