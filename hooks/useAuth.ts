// src/hooks/useAuth.ts
import { useState, useEffect } from "react";
import { getMyProfile } from "../backend/services/mypageService";

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const profile = await getMyProfile();
        setUser(profile);
      } catch (error) {
        console.error("인증 정보 확인 실패", error);
        // 토큰이 유효하지 않을 수 있으니 로그아웃 처리
        localStorage.removeItem("token");
        localStorage.removeItem("username");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading };
};
