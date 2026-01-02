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
  is_liked?:boolean;
  comment_count: number;
  image_url?: string; // ✅ [추가] 이미지 URL 필드
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

/* 🟢 이미지 업로드 (새로 추가됨) */
export async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  // 백엔드의 /api/community/upload 경로로 요청
  const res = await axios.post(`${API_URL}/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.url; // 서버가 반환한 이미지 URL
}

/* 🟢 게시글 목록 (수정됨: 토큰 전송) */
export async function getPosts(category: string): Promise<CommunityPost[]> {
  const token = localStorage.getItem("token"); // 토큰 가져오기
  const headers = token ? { Authorization: `Bearer ${token}` } : {}; // 토큰 있으면 헤더에 추가

  const res = await axios.get(`${API_URL}/${category}`, { headers });
  return res.data;
}

/* 🟢 게시글 상세 (수정됨: 토큰 전송 추가) */
export async function getPostDetail(postId: number): Promise<CommunityPost> {
  // 1. 로컬 스토리지에서 토큰 꺼내기
  const token = localStorage.getItem("token");
  
  // 2. 토큰이 있으면 헤더에 담기
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  // 3. 헤더와 함께 요청 보내기
  const res = await axios.get(`${API_URL}/post/${postId}`, { headers });
  
  return res.data;
}
/* 🟢 게시글 작성 (image_url 추가됨) */
export async function createPost(
  token: string,
  data: {
    category: string;
    title: string;
    content: string;
    image_url?: string; // ✅ 추가됨
    pill_ids: number[];
  }
) {
  const res = await axios.post(`${API_URL}/`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

/* 🟢 게시글 수정 (image_url 추가됨) */
export async function updatePost(
  token: string,
  postId: number,
  data: {
    category: string;
    title: string;
    content: string;
    image_url?: string; // ✅ 추가됨
    pill_ids: number[];
  }
) {
  const res = await axios.put(`${API_URL}/${postId}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

/* 🟢 게시글 삭제 */
export async function deletePost(token: string, postId: number) {
  const res = await axios.delete(`${API_URL}/${postId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

/* 🟢 게시글 좋아요 */
export async function togglePostLike(
  token: string,
  postId: number
): Promise<{ like_count: number; is_liked:boolean }> {
  const res = await axios.post(
    `${API_URL}/${postId}/like`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
}

/* 🟢 댓글 목록 */
export async function getComments(postId: number): Promise<CommunityComment[]> {
  const res = await axios.get(`${API_URL}/${postId}/comments`);
  return res.data;
}

/* 🟢 댓글 작성 */
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

/* 🟢 댓글 삭제 */
export async function deleteComment(token: string, commentId: number) {
  const res = await axios.delete(`${API_URL}/comments/${commentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

/* 🟢 댓글 좋아요 */
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
