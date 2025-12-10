// src/components/Header.tsx
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
} from "lucide-react";

interface HeaderProps {
  setViewState: (view: ViewState) => void;
  currentView: ViewState;
}

const Header: React.FC<HeaderProps> = ({ setViewState, currentView }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 👤 로그인 사용자 이름 상태
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    // 1. 스크롤 감지
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);

    // 2. 로그인 상태 확인 (localStorage)
    const storedName = localStorage.getItem("username");
    const storedToken = localStorage.getItem("token");
    if (storedToken && storedName) {
      setUsername(storedName);
    }

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 👋 로그아웃 처리
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setUsername(null);
    alert("로그아웃 되었습니다.");
    window.location.reload(); // 상태 초기화를 위해 새로고침
  };

  const handleNavClick = (view: ViewState) => {
    setViewState(view);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/80 backdrop-blur-md shadow-sm py-3"
          : "bg-transparent py-5"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        {/* Logo */}
        <button
          onClick={() => handleNavClick(ViewState.HOME)}
          className="flex items-center gap-3 group"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-olive-primary to-sage rounded-xl flex items-center justify-center text-white shadow-lg group-hover:rotate-[-10deg] transition-transform duration-300">
            <Pill size={24} />
          </div>
          <span className="text-2xl font-bold text-olive-primary tracking-tight">
            Pilly
          </span>
        </button>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <button
            onClick={() => handleNavClick(ViewState.HOME)}
            className={`font-medium transition-colors hover:text-olive-primary ${
              currentView === ViewState.HOME
                ? "text-olive-primary"
                : "text-charcoal"
            }`}
          >
            About
          </button>

          <button
            onClick={() => handleNavClick(ViewState.SEARCH)}
            className={`font-medium transition-colors hover:text-olive-primary ${
              currentView === ViewState.SEARCH
                ? "text-olive-primary"
                : "text-charcoal"
            }`}
          >
            약 검색
          </button>

          <button
            onClick={() => handleNavClick(ViewState.AI_SEARCH)}
            className={`font-medium transition-colors hover:text-olive-primary flex items-center gap-1.5 ${
              currentView === ViewState.AI_SEARCH
                ? "text-olive-primary"
                : "text-charcoal"
            }`}
          >
            <Camera size={18} />
            AI 약 사진 인식
          </button>
          <button
            onClick={() => handleNavClick(ViewState.COMMUNITY)}
            className={`font-medium transition-colors hover:text-olive-primary flex items-center gap-1.5 ${
              currentView === ViewState.COMMUNITY ||
              currentView === ViewState.COMMUNITY_WRITE
                ? "text-olive-primary"
                : "text-charcoal"
            }`}
          >
            <MessageCircle size={18} />
            커뮤니티
          </button>
        </div>

        {/* CTA Buttons (로그인 상태에 따라 변경) */}
        <div className="hidden md:flex items-center gap-4">
          {username ? (
            // ✅ 로그인 상태: 이름 + 로그아웃 아이콘
            <div className="flex items-center gap-4 animate-fade-in">
              <div className="flex items-center gap-2 text-charcoal font-medium">
                <div className="w-8 h-8 bg-olive-primary/10 rounded-full flex items-center justify-center text-olive-primary">
                  <User size={18} />
                </div>
                <span>{username}님 환영합니다</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                title="로그아웃"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            // ✅ 비로그인 상태: 로그인 버튼
            <button
              onClick={() => handleNavClick(ViewState.LOGIN)}
              className="bg-gradient-to-br from-olive-primary to-sage text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-olive-primary/20 hover:shadow-olive-primary/40 hover:-translate-y-0.5 transition-all duration-300"
            >
              로그인
            </button>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-charcoal"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-100 p-6 flex flex-col gap-4 shadow-lg animate-fade-in-up">
          <button
            onClick={() => handleNavClick(ViewState.HOME)}
            className={`text-left font-medium py-2 ${
              currentView === ViewState.HOME
                ? "text-olive-primary"
                : "text-charcoal"
            }`}
          >
            About
          </button>
          <button
            onClick={() => handleNavClick(ViewState.SEARCH)}
            className={`text-left font-medium py-2 ${
              currentView === ViewState.SEARCH
                ? "text-olive-primary"
                : "text-charcoal"
            }`}
          >
            약 검색
          </button>

          <button
            onClick={() => handleNavClick(ViewState.AI_SEARCH)}
            className={`text-left font-medium py-2 flex items-center gap-2 ${
              currentView === ViewState.AI_SEARCH
                ? "text-olive-primary"
                : "text-charcoal"
            }`}
          >
            <Camera size={18} />
            AI 약 사진 인식
          </button>
          <button
            onClick={() => handleNavClick(ViewState.COMMUNITY)}
            className={`text-left font-medium py-2 flex items-center gap-2 ${
              currentView === ViewState.COMMUNITY ||
              currentView === ViewState.COMMUNITY_WRITE
                ? "text-olive-primary"
                : "text-charcoal"
            }`}
          >
            <MessageCircle size={18} />
            커뮤니티
          </button>
          <div className="border-t border-gray-100 pt-4 mt-2">
            {username ? (
              // 모바일 로그인 상태
              <div className="flex flex-col gap-3">
                <span className="font-bold text-olive-primary flex items-center gap-2">
                  <User size={18} /> {username}님
                </span>
                <button
                  onClick={handleLogout}
                  className="text-left text-gray-500 flex items-center gap-2"
                >
                  <LogOut size={16} /> 로그아웃
                </button>
              </div>
            ) : (
              // 모바일 비로그인 상태
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
