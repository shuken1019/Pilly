// src/components/AuthModal.tsx
import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Lock,
  Calendar,
  Phone,
  ArrowRight,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { ViewState } from "../types";
import { loginUser, signupUser } from "../services/authService";

interface AuthModalProps {
  view: ViewState;
  onClose: () => void;
  onChangeView: (view: ViewState) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({
  view,
  onClose,
  onChangeView,
}) => {
  if (view !== ViewState.LOGIN && view !== ViewState.SIGNUP) return null;

  const isLogin = view === ViewState.LOGIN;

  // --- 상태 관리 ---
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");

  // 회원가입 추가 정보
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState(""); // M, F, U
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 초기화
  useEffect(() => {
    setUsername("");
    setPassword("");
    setPasswordConfirm("");
    setName("");
    setBirthdate("");
    setGender("");
    setPhone("");
    setError(null);
  }, [view]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 유효성 검사 (비밀번호 일치)
    if (!isLogin && password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const data = await loginUser(username, password);
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("username", data.username);
        localStorage.setItem("name", data.name);
        alert(`${data.name}님 환영합니다!`);
        onClose();
        window.location.reload();
      } else {
        // 회원가입 함수 호출 (파라미터 순서 주의)
        await signupUser({
          username,
          password,
          name,
          birthdate,
          gender,
          phone,
        });
        alert("회원가입이 완료되었습니다! 로그인해주세요.");
        onChangeView(ViewState.LOGIN);
      }
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError("서버 연결에 실패했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
      {/* 배경 클릭 시 닫기 */}
      <div className="absolute inset-0" onClick={onClose}></div>

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all scale-100 my-8">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <X size={24} />
        </button>

        <div className="p-8 pt-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-charcoal mb-2">
              {isLogin ? "Pilly 로그인" : "회원가입"}
            </h2>
            <p className="text-sage text-sm">
              {isLogin
                ? "아이디와 비밀번호를 입력해주세요."
                : "약 관리를 위한 필수 정보를 입력해주세요."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. 아이디 */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400 group-focus-within:text-olive-primary transition-colors" />
              </div>
              <input
                type="text"
                required
                placeholder="아이디 (영문/숫자)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-cream border border-transparent focus:bg-white focus:border-olive-primary rounded-xl outline-none transition-all"
              />
            </div>

            {/* 2. 비밀번호 */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-olive-primary transition-colors" />
              </div>
              <input
                type="password"
                required
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-cream border border-transparent focus:bg-white focus:border-olive-primary rounded-xl outline-none transition-all"
              />
            </div>

            {/* 회원가입 추가 필드들 */}
            {!isLogin && (
              <div className="space-y-4 animate-fade-in-down">
                {/* 비밀번호 확인 */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <CheckCircle
                      className={`h-5 w-5 transition-colors ${
                        passwordConfirm && password === passwordConfirm
                          ? "text-olive-primary"
                          : "text-gray-400"
                      }`}
                    />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="비밀번호 재입력"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3.5 bg-cream border rounded-xl outline-none transition-all ${
                      passwordConfirm && password !== passwordConfirm
                        ? "border-red-300 focus:border-red-500"
                        : "border-transparent focus:bg-white focus:border-olive-primary"
                    }`}
                  />
                </div>

                {/* 이름 */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400 group-focus-within:text-olive-primary transition-colors" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="이름 (닉네임)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-cream border border-transparent focus:bg-white focus:border-olive-primary rounded-xl outline-none transition-all"
                  />
                </div>

                {/* 생년월일 & 성별 (한 줄 배치) */}
                <div className="flex gap-3">
                  <div className="relative group flex-1">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400 group-focus-within:text-olive-primary transition-colors" />
                    </div>
                    <input
                      type="text"
                      placeholder="생년월일(8자리)"
                      maxLength={8}
                      value={birthdate}
                      onChange={(e) => setBirthdate(e.target.value)}
                      className="w-full pl-12 pr-2 py-3.5 bg-cream border border-transparent focus:bg-white focus:border-olive-primary rounded-xl outline-none transition-all text-sm"
                    />
                  </div>
                  <div className="flex bg-cream rounded-xl p-1 w-36">
                    {["남", "여"].map((label, idx) => {
                      const val = idx === 0 ? "M" : "F";
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setGender(val)}
                          className={`flex-1 rounded-lg text-sm font-medium transition-all ${
                            gender === val
                              ? "bg-white text-olive-primary shadow-sm"
                              : "text-gray-400 hover:text-gray-600"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 전화번호 */}
                <div className="relative group flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400 group-focus-within:text-olive-primary transition-colors" />
                    </div>
                    <input
                      type="tel"
                      placeholder="휴대전화 번호"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-cream border border-transparent focus:bg-white focus:border-olive-primary rounded-xl outline-none transition-all"
                    />
                  </div>
                  <button
                    type="button"
                    className="px-4 py-3.5 bg-sage/20 text-sage hover:bg-sage hover:text-white rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
                  >
                    인증
                  </button>
                </div>
              </div>
            )}

            {/* 에러 메시지 */}
            {error && (
              <div className="text-red-500 text-sm text-center font-medium bg-red-50 py-2 rounded-xl animate-pulse flex items-center justify-center gap-2">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            {/* 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-olive-primary hover:bg-olive-dark text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  {isLogin ? "로그인하기" : "가입하기"}
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {/* 전환 링크 */}
          <div className="mt-6 text-center text-sm text-gray-500">
            {isLogin ? "아직 계정이 없으신가요?" : "이미 계정이 있으신가요?"}{" "}
            <button
              onClick={() =>
                onChangeView(isLogin ? ViewState.SIGNUP : ViewState.LOGIN)
              }
              className="font-bold text-olive-primary hover:underline ml-1"
            >
              {isLogin ? "회원가입" : "로그인"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
