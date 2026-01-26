import axios from "axios";

const API_URL = "http://3.38.78.49:8000/api/community";

export interface CommunityPost {
  id: number;
  category: string;
  title: string;
  content: string;
  username: string;
  nickname: string;
  profile_image: string;
  created_at: string;
  like_count: number;
  is_liked?: boolean;
  comment_count: number;
  image_url?: string;
  pills?: {
    item_seq: string;
    item_name: string;
    item_image: string | null;
  }[];
}

export interface CommunityComment {
  id: number;
  post_id: number; // 추가
  user_id: number;
  username: string;
  nickname: string;
  profile_image: string;
  content: string;
  parent_id: number | null; // ✅ 대댓글 처리를 위해 추가
  created_at: string;
  like_count: number;
}

/* 🟢 이미지 업로드 */
export async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axios.post(`${API_URL}/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.url;
}

/* 🟢 게시글 목록 */
export async function getPosts(category: string): Promise<CommunityPost[]> {
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await axios.get(`${API_URL}/${category}`, { headers });
  return res.data;
}

/* 🟢 게시글 상세 */
export async function getPostDetail(postId: number): Promise<CommunityPost> {
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await axios.get(`${API_URL}/post/${postId}`, { headers });
  return res.data;
}

/* 🟢 게시글 작성 */
export async function createPost(
  token: string,
  data: {
    category: string;
    title: string;
    content: string;
    image_url?: string;
    pill_ids: number[];
  }
) {
  const res = await axios.post(`${API_URL}/`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

/* 🟢 게시글 수정 */
export async function updatePost(
  token: string,
  postId: number,
  data: {
    category: string;
    title: string;
    content: string;
    image_url?: string;
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
): Promise<{ like_count: number; is_liked: boolean }> {
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

/* 🟢 댓글 및 대댓글 작성 (수정됨) */
export const createComment = async (
  token: string,
  postId: number,
  content: string,
  parentId: number | null = null // ✅ 4번째 인자로 부모 ID를 받습니다.
) => {
  // 🚨 'api' 대신 'axios'를 사용하여 요청 보냄
  const res = await axios.post(
    `${API_URL}/${postId}/comments`,
    {
      content,
      parent_id: parentId, // ✅ 백엔드로 전달
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
};

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