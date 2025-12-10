// src/services/authService.ts
import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api/auth";

// 회원가입: 아이디, 비번, 이름
export const signupUser = async (userData: any) => {
  const response = await axios.post(`${API_URL}/signup`, userData);
  return response.data;
};

// 로그인: 아이디, 비번
export const loginUser = async (username: string, password: string) => {
  const response = await axios.post(`${API_URL}/login`, {
    username,
    password,
  });
  return response.data;
};
