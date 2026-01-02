// src/components/KakaoCallback.tsx
import React, { useEffect, useRef } from 'react'; // useRef 추가
import { useSearchParams, useNavigate } from 'react-router-dom';
import { kakaoLogin } from '../backend/services/authService';
import { Loader2 } from 'lucide-react';

const KakaoCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // ✅ 요청이 이미 전송되었는지 체크하는 변수
  const isRequestSent = useRef(false);

  useEffect(() => {
    const code = searchParams.get('code');

    if (code) {
      // ✅ 이미 요청을 보냈다면(true) 다시 실행하지 않음 (React StrictMode 중복 방지)
      if (isRequestSent.current) return;
      isRequestSent.current = true;

      kakaoLogin(code)
        .then(data => {
          console.log("카카오 로그인 성공:", data);
          // 토큰 저장 (백엔드 응답 키값에 따라 access_token 확인 필요)
          const token = data.access_token; 
          const name = data.username || data.name || "사용자";

          if (token) {
            localStorage.setItem('token', token);
            localStorage.setItem('username', name);
            
            alert(`${name}님, 환영합니다!`);
            window.location.href = "/";
          } else {
             // 토큰이 없는 경우 에러 처리
             throw new Error("토큰 응답 없음");
          }
        })
        .catch(error => {
          console.error("로그인 에러:", error);
          // 400 에러(중복 요청 등)가 나더라도, 토큰이 이미 저장되어 있으면 성공으로 간주
          if (localStorage.getItem("token")) {
             window.location.href = "/";
             return;
          }
          alert("로그인 처리에 실패했습니다. 다시 시도해주세요.");
          navigate('/');
        });
    } else {
      // 코드가 없으면 메인으로
      isRequestSent.current = true; // 불필요한 재실행 방지
      navigate('/');
    }
  }, [searchParams, navigate]);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-white gap-4">
      <Loader2 className="animate-spin text-olive-primary" size={48} />
      <p className="text-xl font-bold text-charcoal">카카오 로그인 중입니다...</p>
    </div>
  );
};

export default KakaoCallback;