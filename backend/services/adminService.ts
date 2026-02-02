import axios from "axios";

// 1. 주소 설정 (/api/admin 포함)
const API_URL = "http://3.38.78.49:8000/api/admin";

// 2. 인증 헤더 함수 (토큰 자동 첨부)
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// --- 관리자 API 기능 ---

// 1. 대시보드 통계 (회원수, 게시글수)
export async function getAdminStats() {
  const res = await axios.get(`${API_URL}/stats`, { 
    headers: getAuthHeaders() 
  });
  return res.data;
}

// 2. 회원 목록 조회 (검색 기능 포함)
export async function getAllUsers(keyword?: string) {
  const params = keyword ? { params: { keyword } } : {};
  const res = await axios.get(`${API_URL}/users`, { 
    headers: getAuthHeaders(),
    ...params 
  });
  return res.data;
}

// 3. 회원 정보 수정 (차단, 메모 등 일반 수정)
export async function updateUser(userId: number, data: { role: string; is_banned: boolean; admin_memo?: string }) {
  await axios.put(`${API_URL}/users/${userId}`, data, { 
    headers: getAuthHeaders() 
  });
}

// 4. 회원 강제 삭제
export async function deleteUser(userId: number) {
  await axios.delete(`${API_URL}/users/${userId}`, { 
    headers: getAuthHeaders() 
  });
}

// 5. 전체 게시글 목록 조회
export async function getAllPosts() {
  const res = await axios.get(`${API_URL}/posts`, { 
    headers: getAuthHeaders() 
  });
  return res.data;
}

// 6. 게시글 강제 삭제
export async function deletePostAdmin(postId: number) {
  await axios.delete(`${API_URL}/posts/${postId}`, { 
    headers: getAuthHeaders() 
  });
}

// 7. 게시글 숨김/해제 토글
export async function togglePostHide(postId: number) {
  await axios.put(`${API_URL}/posts/${postId}/hide`, {}, { 
    headers: getAuthHeaders() 
  });
}

// 8. [핵심] 회원 권한 변경 (USER <-> ADMIN)
// AdminPage에서 이 이름(changeUserRole)을 사용하므로 이것만 남김!
export async function changeUserRole(userId: number, newRole: "ADMIN" | "USER") {
  await axios.put(`${API_URL}/users/${userId}/role`, { role: newRole }, { 
    headers: getAuthHeaders() 
  });
}

// (참고: 회원가입용 인터페이스는 보통 authService에 두지만, 에러 방지를 위해 남겨둠)
export interface RegisterPayload {
  username: string;
  password: string;
  name: string;
  real_name?: string;
  birthdate?: string;
  phone?: string;
  email?: string;
  gender?: string;
}