import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle,
  Phone,
  Calendar,
  Smile,
} from "lucide-react";
import { ViewState } from "../types";
import { login, register } from "../backend/services/authService";
import { getMyProfile } from "../backend/services/mypageService";

interface AuthModalProps {
  view: ViewState;
  onClose: () => void;
  onChangeView: (view: ViewState) => void;
}

const KakaoLoginButton = () => {
  const KAKAO_CLIENT_ID = "234076b99f1688d6769264ebd5c51548";
  const KAKAO_REDIRECT_URI = "http://3.38.78.49/oauth/kakao";
  const kakaoURL = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${KAKAO_REDIRECT_URI}&response_type=code`;

  return (
    <a href={kakaoURL} className="w-full">
      <div className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#FEE500] text-black/80 rounded-xl font-bold hover:bg-yellow-400 transition-colors">
        카카오로 1초 만에 시작하기
      </div>
    </a>
  );
};

const AuthModal: React.FC<AuthModalProps> = ({
  view,
  onClose,
  onChangeView,
}) => {
  const isLogin = view === ViewState.LOGIN;

  // 로그인 & 회원가입 공통
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  // 회원가입 전용 추가 필드
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState(""); // 닉네임
  const [realName, setRealName] = useState(""); // 실명
  const [birthdate, setBirthdate] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 모달 열릴 때 초기화
    setUsername("");
    setPassword("");
    setPasswordConfirm("");
    setName("");
    setRealName("");
    setBirthdate("");
    setPhone("");
    setEmail("");
    setError(null);
  }, [view]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isLogin && password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // 로그인 로직
        const data = await login(username, password);
        localStorage.setItem("token", data.access_token);
        try {
          const profile = await getMyProfile();
          localStorage.setItem("username", profile?.name || profile?.username || "");
        } catch {}
        onClose();
        window.location.reload();
      } else {
        // ✅ 회원가입 로직 (추가된 필드 전송)
        await register({ 
            username, 
            password, 
            name,       // 닉네임
            real_name: realName, // 실명 (백엔드 변수명에 맞춤)
            birthdate, 
            phone, 
            email 
        });
        alert("회원가입이 완료되었습니다! 로그인해주세요.");
        onChangeView(ViewState.LOGIN);
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.detail || "입력 정보를 확인해주세요."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="absolute inset-0" onClick={onClose}></div>

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>

        <h2 className="text-3xl font-extrabold text-center mb-2">
          {isLogin ? "로그인" : "회원가입"}
        </h2>
        <p className="text-center text-gray-500 mb-6">
          {isLogin
            ? "아이디와 비밀번호를 입력해주세요."
            : "서비스 이용을 위한 정보를 입력해주세요."}
        </p>

        {isLogin && (
            <div className="mb-6">
                <KakaoLoginButton />
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full pl-11 py-3 rounded-xl bg-cream outline-none focus:ring-2 focus:ring-olive-primary"
              placeholder="아이디"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              className="w-full pl-11 py-3 rounded-xl bg-cream outline-none focus:ring-2 focus:ring-olive-primary"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {!isLogin && (
            <>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  className="w-full pl-11 py-3 rounded-xl bg-cream outline-none focus:ring-2 focus:ring-olive-primary"
                  placeholder="비밀번호 확인"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  required
                />
              </div>
              
              <div className="relative">
                <Smile size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    className="w-full pl-11 py-3 rounded-xl bg-cream outline-none focus:ring-2 focus:ring-olive-primary"
                    placeholder="닉네임 (활동명)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
              </div>

              <div className="h-px bg-gray-100 my-2"></div>
              
              <p className="text-xs text-gray-400 font-bold ml-1">상세 정보 (선택)</p>

              <input
                className="w-full px-4 py-3 rounded-xl bg-cream outline-none focus:ring-2 focus:ring-olive-primary"
                placeholder="이름 (실명)"
                value={realName}
                onChange={(e) => setRealName(e.target.value)}
              />

              <div className="relative">
                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="date"
                    className="w-full pl-11 py-3 rounded-xl bg-cream outline-none focus:ring-2 focus:ring-olive-primary text-gray-500"
                    value={birthdate}
                    onChange={(e) => setBirthdate(e.target.value)}
                />
              </div>

              <div className="relative">
                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    className="w-full pl-11 py-3 rounded-xl bg-cream outline-none focus:ring-2 focus:ring-olive-primary"
                    placeholder="휴대폰 번호 (010-0000-0000)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <input
                type="email"
                className="w-full px-4 py-3 rounded-xl bg-cream outline-none focus:ring-2 focus:ring-olive-primary"
                placeholder="이메일 (example@email.com)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </>
          )}

          {error && (
            <div className="text-red-500 text-sm bg-red-50 py-2 rounded-xl flex justify-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-olive-primary text-white rounded-xl font-bold flex justify-center gap-2 mt-4 hover:bg-olive-dark transition-colors"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                {isLogin ? "로그인" : "가입하기"}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6 text-sm">
          {isLogin ? "계정이 없으신가요?" : "이미 계정이 있으신가요?"}{" "}
          <button
            className="text-olive-primary font-bold"
            onClick={() =>
              onChangeView(isLogin ? ViewState.SIGNUP : ViewState.LOGIN)
            }
          >
            {isLogin ? "회원가입" : "로그인"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;