// src/App.tsx
import React, { useState } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Features from "./components/Features";
import SearchSection from "./components/SearchSection";
import AiSearchSection from "./components/AiSearchSection";
import Testimonials from "./components/Testimonials";
import Footer from "./components/Footer";
import ResultModal from "./components/ResultModal";
import AuthModal from "./components/AuthModal";
import { analyzePillImage } from "./services/geminiService";
import { ViewState, PillData } from "./types";

// ✅ 커뮤니티 컴포넌트 import
import CommunityList from "./components/CommunityList";
import CommunityWrite from "./components/CommunityWrite";
import CommunityDetail from "./components/CommunityDetail";

const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>(ViewState.HOME);

  // Hero / AI 검색용 상태
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pillData, setPillData] = useState<PillData | null>(null);

  // ✅ 커뮤니티 상태
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [editPostId, setEditPostId] = useState<number | null>(null);

  // 🛡️ 로그인 여부 체크
  const checkLogin = (): boolean => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인이 필요한 서비스입니다.\n먼저 로그인해주세요. 💊");
      setViewState(ViewState.LOGIN); // 로그인 모달 열기
      return false;
    }
    return true;
  };

  // 헤더 네비게이션
  const handleHeaderNav = (view: ViewState) => {
    // 보호할 메뉴들 지정
    if (
      view === ViewState.AI_SEARCH ||
      view === ViewState.COMMUNITY ||
      view === ViewState.COMMUNITY_WRITE ||
      view === ViewState.COMMUNITY_DETAIL
    ) {
      if (!checkLogin()) return;
    }
    setViewState(view);
  };

  // 텍스트 검색 화면 이동
  const handleGoToSearch = () => {
    if (checkLogin()) {
      setViewState(ViewState.SEARCH);
      window.scrollTo(0, 0);
    }
  };

  // AI 검색 화면 이동
  const handleGoToAiSearch = () => {
    if (checkLogin()) {
      setViewState(ViewState.AI_SEARCH);
      window.scrollTo(0, 0);
    }
  };

  // 이미지 업로드 + 분석
  const handleImageUpload = async (file: File) => {
    if (!checkLogin()) return;

    setLoading(true);
    setModalOpen(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      try {
        const base64String = reader.result as string;
        const result = await analyzePillImage(base64String);
        setPillData(result);
      } catch (error) {
        console.error("Analysis failed", error);
        setPillData(null);
      } finally {
        setLoading(false);
      }
    };
  };

  const closeModal = () => {
    setModalOpen(false);
    setPillData(null);
  };

  return (
    <div className="min-h-screen bg-warmWhite flex flex-col">
      <Header setViewState={handleHeaderNav} currentView={viewState} />

      <main className="flex-grow">
        {/* === 1. HOME 화면 === */}
        {viewState === ViewState.HOME && (
          <>
            <Hero
              onImageUpload={handleImageUpload}
              onScrollToAiSearch={handleGoToAiSearch}
            />
            <div className="w-full max-w-5xl mx-auto border-t border-sage/10"></div>
            <SearchSection onInputClick={handleGoToSearch} />
            <Features />
            <Testimonials />
            <section className="py-24 px-6 bg-gradient-to-br from-coral-primary to-coral-light relative overflow-hidden text-white">
              <div className="max-w-6xl mx-auto text-center">
                <h2 className="text-4xl font-bold">Pilly 앱 다운로드</h2>
              </div>
            </section>
          </>
        )}

        {/* === 2. 텍스트 검색 화면 === */}
        {viewState === ViewState.SEARCH && (
          <div className="pt-20 min-h-screen">
            <SearchSection />
          </div>
        )}

        {/* === 3. AI 약 사진 인식 화면 === */}
        {viewState === ViewState.AI_SEARCH && (
          <div className="pt-20 min-h-screen pb-20">
            <AiSearchSection />
          </div>
        )}

        {/* === 4. 커뮤니티 목록 화면 === */}
        {viewState === ViewState.COMMUNITY && (
          <div className="pt-20 min-h-screen bg-gray-50">
            <CommunityList
              onWriteClick={() => {
                setEditPostId(null); // 새 글 쓰기니까 null로 초기화
                if (checkLogin()) setViewState(ViewState.COMMUNITY_WRITE);
              }}
              onSelectPost={(id) => {
                setSelectedPostId(id);
                setViewState(ViewState.COMMUNITY_DETAIL);
              }}
            />
          </div>
        )}

        {/* === 5. 커뮤니티 글쓰기 화면 === */}
        {viewState === ViewState.COMMUNITY_WRITE && (
          <div className="pt-20 min-h-screen bg-white">
            <CommunityWrite
              editPostId={editPostId}
              onBack={() => setViewState(ViewState.COMMUNITY)}
              onComplete={() => setViewState(ViewState.COMMUNITY)}
            />
          </div>
        )}

        {/* === 6. 커뮤니티 게시글 상세 화면 === */}
        {viewState === ViewState.COMMUNITY_DETAIL &&
          selectedPostId !== null && (
            <div className="pt-20 min-h-screen bg-white">
              <CommunityDetail
                postId={selectedPostId}
                onBack={() => setViewState(ViewState.COMMUNITY)}
                onEdit={(id) => {
                  setEditPostId(id);
                  setViewState(ViewState.COMMUNITY_WRITE);
                }}
              />
            </div>
          )}
      </main>

      <Footer />

      <ResultModal
        isOpen={modalOpen}
        onClose={closeModal}
        data={pillData}
        isLoading={loading}
      />

      <AuthModal
        view={viewState}
        onClose={() => setViewState(ViewState.HOME)}
        onChangeView={setViewState}
      />
    </div>
  );
};

export default App;
