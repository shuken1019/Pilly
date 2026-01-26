// src/backend/services/adminService.ts
import axios from "axios";

// 1. 주소 수정: /api/admin 까지 포함해야 합니다.
const API_URL = "http://3.38.78.49:8000/api/admin";

// 2. 인증 헤더 함수 (필수!)
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// --- 기능 구현 (admin.py와 일치시킴) ---

// 1. 대시보드 통계 (회원수, 게시글수)
export async function getAdminStats() {
  const res = await axios.get(`${API_URL}/stats`, { 
    headers: getAuthHeaders() // 헤더 필수
  });
  return res.data;
}

// src/backend/services/adminService.ts

// [수정] 회원 목록 조회 (검색 기능 추가)
export async function getAllUsers(keyword?: string) {
  const params = keyword ? { params: { keyword } } : {};
  const res = await axios.get(`${API_URL}/users`, { 
    headers: getAuthHeaders(),
    ...params 
  });
  return res.data;
}

// [수정] 회원 정보 업데이트 (차단, 메모 포함)
export async function updateUser(userId: number, data: { role: string; is_banned: boolean; admin_memo?: string }) {
  await axios.put(`${API_URL}/users/${userId}`, data, { 
    headers: getAuthHeaders() 
  });
}

// 3. 회원 강제 삭제
export async function deleteUser(userId: number) {
  await axios.delete(`${API_URL}/users/${userId}`, { 
    headers: getAuthHeaders() 
  });
}

// 4. 전체 게시글 목록 조회
export async function getAllPosts() {
  const res = await axios.get(`${API_URL}/posts`, { 
    headers: getAuthHeaders() 
  });
  return res.data;
}

// 5. 게시글 강제 삭제
export async function deletePostAdmin(postId: number) {
  await axios.delete(`${API_URL}/posts/${postId}`, { 
    headers: getAuthHeaders() 
  });
}
// ... (위쪽 기존 코드들은 그대로 두세요)

// 6. [추가] 게시글 숨김/해제 토글
export async function togglePostHide(postId: number) {
  // PUT 요청을 보낼 때 body({})는 비워두고, 헤더만 보냅니다.
  await axios.put(`${API_URL}/posts/${postId}/hide`, {}, { 
    headers: getAuthHeaders() 
  });
}
// src/backend/services/adminService.ts 맨 아래에 추가

// 7. [추가] 회원 권한 수정 요청
export async function updateUserRole(userId: number, newRole: "ADMIN" | "USER") {
  // role 정보를 body에 담아서 보냄
  await axios.put(`${API_URL}/users/${userId}/role`, { role: newRole }, { 
    headers: getAuthHeaders() 
  });
}
// 7. [추가] 회원 권한 수정 요청
export async function changeUserRole(userId: number, newRole: "ADMIN" | "USER") {
  // role 정보를 body에 담아서 보냄
  await axios.put(`${API_URL}/users/${userId}/role`, { role: newRole }, { 
    headers: getAuthHeaders() 
  });
}

export interface RegisterPayload {
  username: string;
  password: string;
  name: string; // 닉네임
  
  // 👇 아래 4줄을 추가해 주세요!
  real_name?: string; // 실명 (백엔드 변수명 real_name과 일치시킴)
  birthdate?: string;
  phone?: string;
  email?: string;
  
  gender?: string; // (기존에 있었다면 유지, 없으면 삭제해도 무방)
}

