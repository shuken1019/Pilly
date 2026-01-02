import React, { useState, useEffect } from "react";
import { ViewState } from "../types";
import {
  Pill,
  Menu,
  X,
  Camera,
  MessageCircle,
  User,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getMyProfile } from "../backend/services/mypageService";

interface HeaderProps {
  onNavClick: (pathOrView: ViewState | string) => void;
  currentView: ViewState;
  // ✅ [추가] 부모(App.tsx)로부터 프로필 이미지를 받습니다.
  profileImage?: string | null;
}

const Header: React.FC<HeaderProps> = ({
  onNavClick,
  currentView,
  profileImage,
}) => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // ✅ 헤더 자체적으로도 이미지를 관리 (백업용)
  const [localProfileImage, setLocalProfileImage] = useState<string | null>(
    null
  );

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);

    const syncLoginState = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setDisplayName(null);
        setIsAdmin(false);
        setLocalProfileImage(null);
        return;
      }

      try {
        const profile = await getMyProfile();
        const name = profile?.name || profile?.username || "사용자";
        setDisplayName(name);

        // ✅ 서버에서 받아온 이미지 저장
        setLocalProfileImage(profile?.profileImage || null);

        const role = String(profile?.role || "").toLowerCase();
        setIsAdmin(role === "admin");
      } catch (e) {
        console.error("프로필 조회 실패", e);
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        setDisplayName(null);
        setIsAdmin(false);
        setLocalProfileImage(null);
      }
    };

    syncLoginState();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [profileImage]); // ✅ 이미지가 변경될 때마다 헤더 갱신

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setDisplayName(null);
    setIsAdmin(false);
    setLocalProfileImage(null);
    alert("로그아웃 되었습니다.");
    window.location.href = "/";
  };

  const handleNavClick = (pathOrView: ViewState | string) => {
    onNavClick(pathOrView);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ✅ 최종적으로 보여줄 이미지 (App에서 준게 있으면 그거 쓰고, 없으면 헤더가 직접 찾은거 씀)
  const displayImage = profileImage || localProfileImage;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/80 backdrop-blur-md shadow-sm py-3"
          : "bg-transparent py-5"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        {/* 로고 */}
        <button
          onClick={() => handleNavClick("/")}
          className="flex items-center gap-3 group"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-olive-primary to-sage rounded-xl flex items-center justify-center text-white shadow-lg group-hover:rotate-[-10deg] transition-transform duration-300">
            <Pill size={24} />
          </div>
          <span className="text-2xl font-bold text-olive-primary tracking-tight">
            Pilly
          </span>
        </button>

        {/* 데스크탑 메뉴 */}
        <div className="hidden md:flex items-center gap-8">
          <button
            onClick={() => handleNavClick("/")}
            className={`font-medium transition-colors hover:text-olive-primary ${
              currentView === ViewState.HOME
                ? "text-olive-primary"
                : "text-charcoal"
            }`}
          >
            About
          </button>
          <button
            onClick={() => handleNavClick("/search")}
            className={`font-medium transition-colors hover:text-olive-primary ${
              currentView === ViewState.SEARCH
                ? "text-olive-primary"
                : "text-charcoal"
            }`}
          >
            약 검색
          </button>
          <button
            onClick={() => handleNavClick("/ai-search")}
            className={`font-medium transition-colors hover:text-olive-primary flex items-center gap-1.5 ${
              currentView === ViewState.AI_SEARCH
                ? "text-olive-primary"
                : "text-charcoal"
            }`}
          >
            <Camera size={18} /> AI 약 사진 인식
          </button>
          <button
            onClick={() => handleNavClick("/community")}
            className={`font-medium transition-colors hover:text-olive-primary flex items-center gap-1.5 ${
              [ViewState.COMMUNITY, ViewState.COMMUNITY_WRITE].includes(
                currentView
              )
                ? "text-olive-primary"
                : "text-charcoal"
            }`}
          >
            <MessageCircle size={18} /> 커뮤니티
          </button>
        </div>

        {/* 우측 버튼 */}
        <div className="hidden md:flex items-center gap-4">
          {displayName ? (
            <div className="flex items-center gap-3 animate-fade-in">
              {isAdmin && (
                <button
                  onClick={() => navigate("/admin")}
                  className="flex items-center gap-1 text-red-500 font-bold px-3 py-1.5 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-sm"
                >
                  <ShieldCheck size={16} /> ADMIN
                </button>
              )}

              <button
                onClick={() => handleNavClick("/mypage")}
                className={`flex items-center gap-2 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-gray-50 ${
                  currentView === ViewState.MYPAGE
                    ? "text-olive-primary bg-olive-primary/5"
                    : "text-charcoal"
                }`}
              >
                {/* ✅ 프로필 사진 동그라미 처리 */}
                <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 flex items-center justify-center bg-gray-100">
                  {displayImage ? (
                    <img
                      src={displayImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={16} className="text-olive-primary" />
                  )}
                </div>
                <span>{displayName}님</span>
              </button>

              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
                title="로그아웃"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleNavClick(ViewState.LOGIN)}
              className="bg-gradient-to-br from-olive-primary to-sage text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-olive-primary/20 hover:shadow-olive-primary/40 hover:-translate-y-0.5 transition-all duration-300"
            >
              로그인
            </button>
          )}
        </div>

        {/* 모바일 토글 */}
        <button
          className="md:hidden text-charcoal"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* 모바일 메뉴 */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-100 p-6 flex flex-col gap-4 shadow-lg animate-fade-in-up">
          <button
            onClick={() => handleNavClick("/")}
            className="text-left font-medium py-2"
          >
            About
          </button>
          <button
            onClick={() => handleNavClick("/search")}
            className="text-left font-medium py-2"
          >
            약 검색
          </button>
          <button
            onClick={() => handleNavClick("/ai-search")}
            className="text-left font-medium py-2 flex items-center gap-2"
          >
            <Camera size={18} /> AI 약 사진 인식
          </button>
          <button
            onClick={() => handleNavClick("/community")}
            className="text-left font-medium py-2 flex items-center gap-2"
          >
            <MessageCircle size={18} /> 커뮤니티
          </button>

          <div className="border-t border-gray-100 pt-4 mt-2">
            {displayName ? (
              <div className="flex flex-col gap-3">
                {isAdmin && (
                  <button
                    onClick={() => {
                      navigate("/admin");
                      setIsMobileMenuOpen(false);
                    }}
                    className="font-bold text-red-500 flex items-center gap-2 py-2"
                  >
                    <ShieldCheck size={18} /> 관리자 페이지 이동
                  </button>
                )}
                <button
                  onClick={() => handleNavClick("/mypage")}
                  className="font-bold text-olive-primary flex items-center gap-2"
                >
                  {/* ✅ 모바일 메뉴에서도 사진 표시 */}
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-200 flex items-center justify-center bg-gray-100">
                    {displayImage ? (
                      <img
                        src={displayImage}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={14} className="text-olive-primary" />
                    )}
                  </div>
                  {displayName}님 (마이페이지)
                </button>
                <button
                  onClick={handleLogout}
                  className="text-left text-gray-500 flex items-center gap-2"
                >
                  <LogOut size={16} /> 로그아웃
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNavClick(ViewState.LOGIN)}
                className="bg-olive-primary text-white py-3 rounded-lg font-semibold mt-2 w-full"
              >
                로그인
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
