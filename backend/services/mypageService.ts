import axios from "axios";
import { Pill } from "./api";

// 1. 공통 Base URL 설정 (/api 까지)
// 이렇게 해야 /api/mypage 와 /api/users, /api/auth 등을 모두 호출할 수 있습니다.
const BASE_URL = "http://3.38.78.49:8000/api";

// 2. Axios 인스턴스 생성 ('api' 변수 정의)
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 3. 요청 인터셉터: 모든 요청에 토큰 자동 추가
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ----------------------------------------------------
// 📡 1. 조회 API (GET) - /api/mypage/...
// ----------------------------------------------------

// 내 프로필 조회
export async function getMyProfile() {
  const res = await api.get("/mypage/profile");
  return res.data;
}

export async function getMyHistory() {
  try {
    const response = await api.get("/mypage/search-history");
    return response.data;
  } catch (error) {
    console.error("검색 기록 로딩 실패:", error);
    return { items: [] };
  }
}

// 내가 쓴 글 조회
export async function getMyPosts() {
  const res = await api.get("/mypage/posts");
  return res.data.items || [];
}

// 내가 찜한 약 조회
export async function getMyScrappedPills(): Promise<Pill[]> {
  const res = await api.get("/mypage/scraps");
  return res.data.items || [];
}

// ----------------------------------------------------
// 📝 2. 수정/삭제 API (PUT, POST, DELETE)
// 백엔드 라우터 구조에 맞춰 경로를 설정했습니다.
// (만약 백엔드에서 404가 뜬다면 경로를 백엔드와 일치시켜야 합니다)
// ----------------------------------------------------

// ✅ [수정] 프로필 정보 수정 (닉네임, 실명, 생일, 폰, 이메일)
export const updateProfileInfo = async (data: any) => {
  const response = await api.put("/mypage/profile", data);
  return response.data;
};

// ✅ [추가] 프로필 이미지 업로드
export const updateProfileImage = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/mypage/profile/image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  // 변경된 이미지 URL을 반환해야 프론트에서 즉시 반영 가능
  return response.data.imageUrl;
};

// ✅ [추가] 비밀번호 변경
export const updatePassword = async (
  currentPassword: string,
  newPassword: string
) => {
  const response = await api.put("/mypage/profile/password", {
    current_password: currentPassword,
    new_password: newPassword,
  });
  return response.data;
};

// ✅ [추가] 회원 탈퇴
export const withdrawAccount = async () => {
  const response = await api.delete("/mypage/profile");
  return response.data;
};

export const deleteHistoryItem = async (historyId: number) => {
  const response = await api.delete(`/pills/history/${historyId}`);
  return response.data;
};
