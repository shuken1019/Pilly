// authService.ts
import axios from "axios";

// --------------------------------------
// 🔧 1) Axios Instance 설정
// --------------------------------------
const API_BASE = "http://3.38.78.49";

const axiosAuth = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosAuth.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 🔐 백엔드에서 쓰는 유저 타입
export interface AuthUser {
  id: number;
  email: string;
  nickname?: string;
  role?: string;
  is_admin?: boolean;
}

// ✅ 회원가입 payload
export interface RegisterPayload {
  username: string;
  password: string;
  name: string;
  real_name?: string;
  birthdate?: string;
  gender?: string;
  phone?: string;
  email?: string;
}

let currentUser: AuthUser | null = null;

// --------------------------------------
// 🔥 2) 로그인 (아이디/비번)
// --------------------------------------
export async function login(username: string, password: string) {
  const res = await axiosAuth.post("/api/auth/login", {
    username,
    password,
  });

  const token = res.data.access_token;
  localStorage.setItem("token", token);
  return res.data;
}

// --------------------------------------
// 🔥 3) 회원가입
// --------------------------------------
export async function register(payload: RegisterPayload) {
  const res = await axiosAuth.post("/api/auth/signup", payload);
  return res.data;
}

// --------------------------------------
// 🔥 4) 현재 유저 정보 가져오기
// --------------------------------------
export async function fetchMe(): Promise<AuthUser | null> {
  try {
    const res = await axiosAuth.get("/api/auth/me");
    currentUser = res.data;
    return currentUser;
  } catch (e) {
    currentUser = null;
    return null;
  }
}

export function getCurrentUserSync() {
  return currentUser;
}

export function logout() {
  localStorage.removeItem("token");
  currentUser = null;
}

// --------------------------------------
// 🔥 5) 카카오 로그인 (새로 추가된 부분)
// --------------------------------------
export async function kakaoLogin(code: string) {
  // 백엔드 엔드포인트가 "/api/auth/kakao" 라고 가정했습니다.
  // 만약 백엔드 주소가 다르다면 "/api/login/kakao" 등으로 수정해주세요.
  const res = await axiosAuth.post("/api/auth/kakao", { code });

  // 로그인 성공 시 토큰 저장 처리 (일반 로그인과 동일하게)
  if (res.data.access_token) {
    localStorage.setItem("token", res.data.access_token);
  }

  return res.data;
}
