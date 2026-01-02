import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Features from "./components/Features";
import SearchSection from "./components/SearchSection";
import AiSearchSection from "./components/AiSearchSection";
import Testimonials from "./components/Testimonials";
import Footer from "./components/Footer";
import ResultModal from "./components/ResultModal";
import AuthModal from "./components/AuthModal";
import { ViewState, PillData } from "./types";
import { SearchFilters } from "./backend/services/api";
import CommunityList from "./components/CommunityList";
import CommunityWrite from "./components/CommunityWrite";
import CommunityDetail from "./components/CommunityDetail";
import MyPage from "./components/MyPage";
import ChatBot from "./components/ChatBot";
import AdminPage from "./components/AdminPage";
import AdminRoute from "./components/route/AdminRoute";
import KakaoCallback from "./components/KakaoCallback";

const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [viewState, setViewState] = useState<ViewState>(ViewState.HOME);
  const [authView, setAuthView] = useState<ViewState | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [pillData, setPillData] = useState<PillData | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [editPostId, setEditPostId] = useState<number | null>(null);
  const [externalFilters, setExternalFilters] = useState<SearchFilters | null>(
    null
  );

  // ✅ [추가] 검색 화면을 강제로 초기화하기 위한 키 값
  const [searchKey, setSearchKey] = useState(0);

  // URL 경로 동기화
  useEffect(() => {
    const pathToView: { [key: string]: ViewState } = {
      "/": ViewState.HOME,
      "/search": ViewState.SEARCH,
      "/ai-search": ViewState.AI_SEARCH,
      "/community": ViewState.COMMUNITY,
      "/mypage": ViewState.MYPAGE,
      "/oauth/kakao": ViewState.KAKAO_REDIRECT,
    };
    const targetView = pathToView[location.pathname];

    if (targetView) {
      if (
        location.pathname === "/community" &&
        (viewState === ViewState.COMMUNITY_DETAIL ||
          viewState === ViewState.COMMUNITY_WRITE)
      ) {
        return;
      }
      if (targetView !== viewState) {
        setViewState(targetView);
      }
    }
  }, [location.pathname]);

  const checkLogin = (): boolean => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인이 필요한 서비스입니다.");
      setAuthView(ViewState.LOGIN);
      return false;
    }
    return true;
  };

  // ✅ [수정] 헤더 메뉴 클릭 핸들러
  const handleHeaderNav = (pathOrView: ViewState | string) => {
    if (pathOrView === ViewState.LOGIN || pathOrView === ViewState.SIGNUP) {
      setAuthView(pathOrView);
      return;
    }

    const path = pathOrView as string;

    // "약 검색" 메뉴를 눌렀을 때 초기화 로직
    if (path === "/search") {
      setSearchKey((prev) => prev + 1); // 키 값을 변경하여 강제 리렌더링 (초기화)
      setExternalFilters(null); // 마이페이지 등에서 넘어온 필터 제거
    }

    if (["/ai-search", "/community", "/mypage"].includes(path)) {
      if (!checkLogin()) return;
    }
    navigate(path);
  };

  const handleImageUpload = async (file: File) => {
    alert("이미지 업로드 기능 연결 필요: " + file.name);
  };
  const closeModal = () => {
    setModalOpen(false);
    setPillData(null);
  };

  useEffect(() => {
    if (location.state?.targetView === "COMMUNITY_DETAIL") {
      const { postId } = location.state;
      if (postId) {
        setSelectedPostId(postId);
        setViewState(ViewState.COMMUNITY_DETAIL);
        window.history.replaceState({}, document.title);
      }
    }
  }, [location]);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ keyword: string }>;
      const keyword = ce.detail?.keyword?.trim();
      if (!keyword) return;
      setExternalFilters({ keyword });
      navigate("/search");
    };
    window.addEventListener("pilly:go-search", handler as EventListener);
    return () =>
      window.removeEventListener("pilly:go-search", handler as EventListener);
  }, [navigate]);

  const renderContent = () => {
    if (location.pathname === "/admin") {
      return (
        <div className="pt-20 bg-gray-50 min-h-screen">
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        </div>
      );
    }

    switch (viewState) {
      case ViewState.HOME:
        return (
          <>
            <Hero
              onImageUpload={handleImageUpload}
              onScrollToAiSearch={() => navigate("/ai-search")}
            />
            <SearchSection onInputClick={() => navigate("/search")} />
            <Features /> <Testimonials />
          </>
        );
      case ViewState.SEARCH:
        return (
          <div className="pt-20 min-h-screen">
            {/* ✅ [수정] key 속성 추가: searchKey가 바뀌면 컴포넌트가 새로 만들어짐(초기화) */}
            <SearchSection key={searchKey} externalFilters={externalFilters} />
          </div>
        );
      case ViewState.AI_SEARCH:
        return (
          <div className="pt-20 min-h-screen pb-20">
            <AiSearchSection />
          </div>
        );
      case ViewState.COMMUNITY:
        return (
          <div className="pt-20 min-h-screen bg-gray-50">
            <CommunityList
              onWriteClick={() => setViewState(ViewState.COMMUNITY_WRITE)}
              onSelectPost={(id) => {
                setSelectedPostId(id);
                setViewState(ViewState.COMMUNITY_DETAIL);
              }}
            />
          </div>
        );
      case ViewState.COMMUNITY_WRITE:
        return (
          <div className="pt-20 min-h-screen bg-white">
            <CommunityWrite
              editPostId={editPostId}
              onBack={() => setViewState(ViewState.COMMUNITY)}
              onComplete={() => setViewState(ViewState.COMMUNITY)}
            />
          </div>
        );
      case ViewState.COMMUNITY_DETAIL:
        return (
          selectedPostId && (
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
          )
        );
      case ViewState.MYPAGE:
        return (
          <div className="pt-20 min-h-screen bg-white">
            <MyPage
              onPostClick={(id) => {
                setSelectedPostId(id);
                setViewState(ViewState.COMMUNITY_DETAIL);
              }}
              onSearchClick={(keyword) => {
                setExternalFilters({ keyword });
                navigate("/search");
              }}
              onPillClick={(itemSeq) => {
                setExternalFilters({ keyword: itemSeq });
                navigate("/search");
              }}
            />
          </div>
        );
      case ViewState.KAKAO_REDIRECT:
        return <KakaoCallback />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-warmWhite flex flex-col">
      <Header onNavClick={handleHeaderNav} currentView={viewState} />
      <main className="flex-grow">{renderContent()}</main>
      <Footer />
      <ChatBot />
      <ResultModal
        isOpen={modalOpen}
        onClose={closeModal}
        data={pillData}
        isLoading={false}
      />

      {authView && (
        <AuthModal
          view={authView}
          onClose={() => setAuthView(null)}
          onChangeView={(view) => setAuthView(view)}
        />
      )}
    </div>
  );
};

export default App;
