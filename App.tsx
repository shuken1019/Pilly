import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "./components/Header";
import Hero from "./components/Hero";
import AboutPage from "./components/AboutPage";
import SearchSection from "./components/SearchSection";
import AiSearchSection from "./components/AiSearchSection";
import Footer from "./components/Footer";
import AuthModal from "./components/AuthModal";
import { ViewState } from "./types";
import { SearchFilters } from "./backend/services/api";
import CommunityList from "./components/CommunityList";
import CommunityWrite from "./components/CommunityWrite";
import CommunityDetail from "./components/CommunityDetail";
import MyPage from "./components/MyPage";
import ChatBot from "./components/ChatBot";
import AdminPage from "./components/AdminPage";
import AdminRoute from "./components/route/AdminRoute";
import KakaoCallback from "./components/KakaoCallback";

// 🚨 [수정 1] 이 import가 빠져 있어서 에러가 났던 겁니다!
import { getMyProfile } from "./backend/services/mypageService";

const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [viewState, setViewState] = useState<ViewState>(ViewState.HOME);
  const [authView, setAuthView] = useState<ViewState | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [editPostId, setEditPostId] = useState<number | null>(null);
  const [externalFilters, setExternalFilters] = useState<SearchFilters | null>(
    null
  );

  const [searchKey, setSearchKey] = useState(0);

  // ✅ 프로필 이미지 상태
  const [userProfileImage, setUserProfileImage] = useState<string | null>(null);

  const [isChatOpen, setIsChatOpen] = useState(false);
  // URL 경로 동기화
  useEffect(() => {
    const pathToView: { [key: string]: ViewState } = {
      "/": ViewState.HOME,
      "/about": ViewState.ABOUT,
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

  // ✅ [추가] 앱 시작/페이지 이동 시 내 프로필(사진) 가져오기
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setUserProfileImage(null);
        return;
      }
      
      try {
        const profile = await getMyProfile();
        // 프로필 이미지가 있으면 상태 업데이트
        setUserProfileImage(profile.profileImage || null);
      } catch (e) {
        console.error("프로필 로드 실패:", e);
      }
    };
    fetchProfile();
  }, [location.pathname]); // 페이지 이동할 때마다 체크

  const checkLogin = (): boolean => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인이 필요한 서비스입니다.");
      setAuthView(ViewState.LOGIN);
      return false;
    }
    return true;
  };

  const handleHeaderNav = (pathOrView: ViewState | string) => {
    if (pathOrView === ViewState.LOGIN || pathOrView === ViewState.SIGNUP) {
      setAuthView(pathOrView);
      return;
    }

    const path = pathOrView as string;

    if (path === "/search") {
      setSearchKey((prev) => prev + 1);
      setExternalFilters(null);
    }

    if (["/ai-search", "/community", "/mypage", "/search"].includes(path)) {
      if (!checkLogin()) return;
    }
    navigate(path);
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
    const loginHandler = () => {
      setAuthView(ViewState.LOGIN); // 로그인 모달 상태를 ON으로 변경
    };
    window.addEventListener("pilly:go-search", handler as EventListener);
    window.addEventListener("pilly:open-login", loginHandler);
    return () => {
      window.removeEventListener("pilly:go-search", handler as EventListener);
      window.removeEventListener("pilly:open-login", loginHandler);
    };
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
              onAiSearchClick={() => handleHeaderNav("/ai-search")}
              onSearchClick={() => handleHeaderNav("/search")}
              onCommunityClick={() => navigate("/community")}
              onChatOpen={() => setIsChatOpen(true)}
            />
            

          </>
        );
      case ViewState.ABOUT:
        return <AboutPage />;


      case ViewState.SEARCH:
        return (
          <div className="pt-20 min-h-screen">
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
      <Header 
        onNavClick={handleHeaderNav} 
        currentView={viewState} 
        profileImage={userProfileImage} 
      />
      <main className="flex-grow">{renderContent()}</main>
      <Footer />
      <ChatBot isOpen={isChatOpen} setIsOpen={setIsChatOpen} />

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
