import React, { useEffect, useState, useRef } from "react";
import {
  User,
  History,
  FileText,
  Bookmark,
  ArrowLeft,
  Camera,
  Settings,
  LogOut,
  AlertTriangle,
  Lock,
  X,
} from "lucide-react";
import {
  getMyProfile,
  getMyHistory,
  getMyPosts,
  getMyScrappedPills,
  updateProfileInfo,
  updateProfileImage,
  updatePassword,
  withdrawAccount,
  deleteHistoryItem,
} from "../backend/services/mypageService"; // 경로 확인 필요 (api_mypage.ts 파일명에 맞게)
import { Pill } from "../backend/services/api";
import { useNavigate } from "react-router-dom";

// --- 타입 정의 ---
interface Profile {
  id: number;
  username: string;
  name: string; // 닉네임
  realName?: string; // 실명
  email?: string;
  phone?: string;
  birthdate?: string;
  profileImage?: string; // 프로필 이미지 URL
}

interface HistoryItem {
  id: number;
  keyword: string;
  created_at: string;
}

interface MyPost {
  id: number;
  category: string;
  title: string;
  created_at: string;
  views: number;
  like_count: number;
}

interface MyPageProps {
  onPostClick: (postId: number) => void;
  onSearchClick: (keyword: string) => void;
  onPillClick?: (itemSeq: string) => void;
}

type TabKey = "history" | "posts" | "scraps";
type ViewMode = "main" | "profile_edit";

const MyPage: React.FC<MyPageProps> = ({
  onPostClick,
  onSearchClick,
  onPillClick,
}) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 상태 관리 ---
  const [profile, setProfile] = useState<Profile | null>(null);
  const [searchHistory, setSearchHistory] = useState<any[]>([]);
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [scraps, setScraps] = useState<any[]>([]); // Pill 타입 대신 유연하게 any 사용
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<TabKey>("history");
  const [viewMode, setViewMode] = useState<ViewMode>("main");

  // 비밀번호 변경 모달 상태
  const [pwModalOpen, setPwModalOpen] = useState(false);

  // 수정 폼 상태
  const [editForm, setEditForm] = useState({
    name: "", // 닉네임
    realName: "",
    birthdate: "",
    phone: "",
    email: "",
  });
  
  // 이미지 파일 상태 (미리보기용)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

 useEffect (() => {
    fetchData();
  }, []);

const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const [p, h, postsData, s] = await Promise.all([
        getMyProfile(),
        getMyHistory(), // 여기서 {"items": [...]} 가 옵니다.
        getMyPosts(),
        getMyScrappedPills(),
      ]);
      console.log("프로필 데이터:", p);
      console.log("검색 기록 데이터(원본):", h);

      setProfile({
            ...p,
            realName: p.real_name || p.realName || "", 
            birthdate: p.birthdate,
            phone: p.phone,
            email: p.email,
            profileImage: p.profile_image || p.profileImage 
        });
// 2. 검색 기록 설정 (안전 장치 추가)
      if (h && Array.isArray(h.items)) {
        // 서버가 { items: [...] } 형태로 줄 때 (현재 상황)
        console.log("✅ items 배열을 찾았습니다:", h.items);
        setSearchHistory(h.items);
      } else if (Array.isArray(h)) {
        // 서버가 그냥 [...] 배열만 줄 때
        console.log("✅ 배열 자체를 받았습니다:", h);
        setSearchHistory(h);
      } else {
        console.warn("⚠️ 검색 기록 데이터 형식이 예상과 다릅니다:", h);
        setSearchHistory([]);
      }
// 3. 게시글 및 스크랩 설정
      setPosts((postsData as any) || []);
      setScraps((s as any) || []);

    } catch (e) {
      console.error("데이터 로딩 실패:", e);
    } finally {
      setLoading(false);
    }
  };
  // --- 핸들러: 수정 모드 진입 ---
  const handleEnterEditMode = () => {
    if (profile) {
      setEditForm({
        name: profile.name || "",
        realName: profile.realName || "", 
        birthdate: (profile.birthdate || "").replace(/\./g, "-"), // 날짜 형식 변환
        phone: profile.phone || "",
        email: profile.email || "",
      });
      setSelectedFile(null);
      setPreviewUrl(profile.profileImage || null);
    }
    setViewMode("profile_edit");
  };
// --- 핸들러: 검색 기록 개별 삭제 ---
const handleDeleteHistory = async (e: React.MouseEvent, id: number) => {
  e.stopPropagation(); // 👈 중요: 부모의 클릭 이벤트(검색 실행)가 발생하지 않도록 막음
  
  if (!window.confirm("이 검색 기록을 삭제하시겠습니까?")) return;

  try {
    await deleteHistoryItem(id);
    // ✅ 성공 시 상태 업데이트 (화면에서 즉시 제거)
    setSearchHistory(prev => prev.filter(item => item.id !== id));
  } catch (error) {
    console.error("삭제 실패:", error);
    alert("삭제에 실패했습니다.");
  }
};
  // --- 핸들러: 저장하기 (API 연동) ---
  const handleSaveProfile = async () => {
    try {
      // 1. 유효성 검사
      if (!editForm.name.trim()) return alert("닉네임을 입력해주세요.");

      // 2. 서버로 보낼 데이터 (변수명 변환: realName -> real_name)
      const payload = {
        name: editForm.name,
        real_name: editForm.realName,
        birthdate: editForm.birthdate,
        phone: editForm.phone,
        email: editForm.email
      };

      // 3. 텍스트 정보 업데이트 요청
      await updateProfileInfo(payload);

      // 4. 이미지가 변경되었다면 업로드
      if (selectedFile) {
        await updateProfileImage(selectedFile);
      }

      alert("저장되었습니다.");
      
      // 닉네임 변경 시 로컬스토리지 업데이트
      localStorage.setItem("username", editForm.name);
      window.location.reload(); 

    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.detail || "저장에 실패했습니다.";
      alert(msg);
    }
  };

  // --- 핸들러: 이미지 선택 ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  // --- 핸들러: 로그아웃 & 탈퇴 ---
  const handleLogout = () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      window.location.href = "/";
    }
  };

  const handleWithdrawal = async () => {
    if (window.confirm("정말 탈퇴하시겠습니까? 탈퇴 후 데이터는 복구할 수 없습니다.")) {
      try {
        await withdrawAccount();
        alert("탈퇴가 완료되었습니다.");
        localStorage.clear();
        window.location.href = "/";
      } catch (e) {
        alert("탈퇴 처리에 실패했습니다.");
      }
    }
  };

  // --- 약 상세 페이지 이동 ---
  const handlePillClick = (itemSeq: string) => {
    // 상세 페이지 경로로 이동 (라우터 설정에 따라 다를 수 있음)
    // 보통 /pills/:id 또는 /search/detail/:id 등을 사용
    navigate(`/pills/${itemSeq}`); 
  };

  if (loading) return <div className="text-center py-20 text-sage">로딩 중...</div>;

  return (
    <div className="max-w-xl mx-auto min-h-screen bg-white relative">
      
      {/* =======================
          1. 프로필 관리 (수정) 화면
         ======================= */}
      {viewMode === "profile_edit" && (
        <div className="animate-fade-in-right pb-20">
          <div className="flex items-center gap-3 p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
            <button onClick={() => setViewMode("main")} className="text-charcoal hover:text-olive-primary">
              <ArrowLeft size={24} />
            </button>
            <h2 className="text-lg font-bold text-charcoal">프로필 관리</h2>
          </div>

          <div className="p-6 flex flex-col items-center gap-6">
            {/* 프로필 이미지 */}
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-28 h-28 bg-gray-100 rounded-full flex items-center justify-center text-gray-300 overflow-hidden border border-gray-200">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <User size={56} />
                )}
              </div>
              <div className="absolute bottom-0 right-0 bg-charcoal text-white p-2 rounded-full border-2 border-white shadow-sm">
                <Camera size={18} />
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>
            <p className="text-xs text-gray-400 -mt-3">프로필 사진 변경</p>

            {/* 입력 폼 */}
            <div className="w-full space-y-6 mt-2">
              <InputGroup label="닉네임" value={editForm.name} onChange={(v) => setEditForm({ ...editForm, name: v })} />
              
              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-sm font-bold text-sage mb-4">회원 정보</h3>
                <div className="space-y-5">
                  <InputGroup label="이름" value={editForm.realName} onChange={(v) => setEditForm({ ...editForm, realName: v })} placeholder="실명 입력" />
                  <InputGroup label="생년월일" type="date" value={editForm.birthdate} onChange={(v) => setEditForm({ ...editForm, birthdate: v })} />
                  <InputGroup label="휴대폰 번호" value={editForm.phone} onChange={(v) => setEditForm({ ...editForm, phone: v })} placeholder="010-0000-0000" />
                  <InputGroup label="이메일" value={editForm.email} onChange={(v) => setEditForm({ ...editForm, email: v })} placeholder="example@email.com" />
                </div>
              </div>
            </div>
            
            {/* 비밀번호 변경 버튼 */}
            <button 
                onClick={() => setPwModalOpen(true)}
                className="w-full py-3.5 mt-2 border border-olive-primary text-olive-primary rounded-xl font-bold text-sm hover:bg-olive-primary/5 transition-colors flex items-center justify-center gap-2"
            >
                <Lock size={16} /> 비밀번호 변경
            </button>

            {/* 저장 버튼 */}
            <button 
              onClick={handleSaveProfile}
              className="w-full py-4 mt-2 bg-[#6B8A7A] text-white rounded-xl font-bold text-lg hover:bg-[#5a7566] transition-colors shadow-md"
            >
              저장하기
            </button>

            {/* 로그아웃 / 회원탈퇴 영역 */}
            <div className="w-full mt-8 pt-8 border-t border-gray-100 flex flex-col gap-3">
                <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 bg-gray-50 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors">
                    <LogOut size={16} /> 로그아웃
                </button>
                <button onClick={handleWithdrawal} className="w-full flex items-center justify-center gap-2 py-3 text-gray-400 hover:text-red-500 text-sm font-medium transition-colors">
                    <AlertTriangle size={16} /> 회원 탈퇴
                </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================
          2. 메인 설정 화면
         ======================= */}
      {viewMode === "main" && (
        <div className="animate-fade-in">
          <div className="p-5 pb-2">
            <h1 className="text-2xl font-bold text-charcoal">마이페이지</h1>
          </div>

          <div className="mx-5 p-5 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 border border-gray-100 overflow-hidden">
                {profile?.profileImage ? (
                   <img src={profile.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                   <User size={30} />
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold text-charcoal">{profile?.name}</h2>
                <p className="text-sm text-gray-400">{profile?.email || profile?.username}</p>
              </div>
            </div>
            
            <button
              onClick={handleEnterEditMode}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-olive-primary hover:text-white hover:border-olive-primary transition-all"
            >
              <Settings size={14} />
              프로필 관리
            </button>
          </div>

          {/* 나의 활동 (탭) */}
          <div className="mt-8 px-4 pb-20">
            <h3 className="text-lg font-bold text-charcoal mb-4">나의 활동</h3>
            <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
              <TabButton active={activeTab === "history"} onClick={() => setActiveTab("history")} icon={<History size={16} />}>
                최근 검색
              </TabButton>
              <TabButton active={activeTab === "posts"} onClick={() => setActiveTab("posts")} icon={<FileText size={16} />}>
                내가 쓴 글
              </TabButton>
              <TabButton active={activeTab === "scraps"} onClick={() => setActiveTab("scraps")} icon={<Bookmark size={16} />}>
                찜한 약
              </TabButton>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 min-h-[200px]">
              {/* 최근 검색 탭 */}
              {{/* 최근 검색 탭 */}
{activeTab === "history" && (
  <ul className="space-y-2">
    {searchHistory.length === 0 ? (
      <EmptyState text="최근 검색 기록이 없습니다." />
    ) : (
      searchHistory.map((item, idx) => (
        <li 
          key={item.id || idx} 
          onClick={() => onSearchClick(item.keyword)} 
          className="group flex justify-between items-center p-4 bg-white rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-all border border-transparent hover:border-gray-100"
        >
          <div className="flex flex-col">
            <span className="font-bold text-charcoal">{item.keyword}</span>
            <span className="text-[10px] text-gray-400 mt-1">
              {item.created_at ? new Date(item.created_at).toLocaleDateString() : ""}
            </span>
          </div>
          
          {/* ❌ 삭제 버튼 */}
          <button 
            onClick={(e) => handleDeleteHistory(e, item.id)}
            className="p-2 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
            title="삭제"
          >
            <X size={18} />
          </button>
        </li>
      ))
    )}
  </ul>
)}

              {/* 내가 쓴 글 탭 */}
            {activeTab === "posts" && (
              <div className="space-y-2">
                {posts.length === 0 ? (
                  <EmptyState text="작성한 글이 없습니다." />
                ) : (
                  posts.map((post, idx) => {
                    // ✅ 바꾼 이름에 맞춰서 매핑 테이블 수정
                    const categoryLabels: { [key: string]: string } = {
                      free: "영양제 꿀조합",
                      review: "복용 후기",
                      qna: "QNA",
                    };

                    return (
                      <div key={idx} onClick={() => onPostClick(post.id)} className="p-3 bg-white rounded-xl shadow-sm cursor-pointer flex justify-between hover:shadow-md transition-shadow">
                        <div className="flex flex-col">
                          {/* ✅ 여기서 바뀐 이름이 출력됩니다 */}
                          <span className="text-xs text-[#718355] mb-1 font-bold">
                            [{categoryLabels[post.category] || post.category}]
                          </span>
                          <span className="font-bold text-charcoal truncate">{post.title}</span>
                        </div>
                        <div className="flex flex-col items-end justify-center text-xs text-gray-400">
                          <span>{new Date(post.created_at).toLocaleDateString()}</span>
                          <span>조회 {post.views}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

              {/* 찜한 약 탭 */}
              {activeTab === "scraps" && (
                <div className="grid grid-cols-1 gap-2">
                {scraps.length === 0 ? <EmptyState text="찜한 약이 없습니다." /> : scraps.map((pill, idx) => (
                  <div key={idx} onClick={() => handlePillClick(pill.item_seq)} className="p-3 bg-white rounded-xl shadow-sm cursor-pointer flex gap-3 items-center hover:shadow-md transition-shadow">
                     <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                        {pill.item_image ? (
                            <img src={pill.item_image} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Img</div>
                        )}
                     </div>
                     <div className="overflow-hidden">
                       <div className="text-[10px] text-olive-primary font-bold">{pill.entp_name}</div>
                       <div className="font-bold text-sm truncate text-charcoal">{pill.item_name}</div>
                     </div>
                  </div>
                ))}
              </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ✅ 비밀번호 변경 모달 */}
      {pwModalOpen && (
        <PasswordChangeModal onClose={() => setPwModalOpen(false)} />
      )}

    </div>
  );
};

export default MyPage;

// --- Sub Components ---

const PasswordChangeModal = ({ onClose }: { onClose: () => void }) => {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const handleSubmit = async () => {
    if (newPw !== confirmPw) return alert("새 비밀번호가 일치하지 않습니다.");
    if (newPw.length < 4) return alert("비밀번호는 4자 이상이어야 합니다.");
    
    try {
      await updatePassword(currentPw, newPw);
      alert("비밀번호가 변경되었습니다.");
      onClose();
    } catch (e: any) {
      alert(e.response?.data?.detail || "비밀번호 변경 실패: 현재 비밀번호를 확인해주세요.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl animate-fade-in-up">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-charcoal">비밀번호 변경</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-charcoal" /></button>
        </div>
        <div className="space-y-4">
          <InputGroup label="현재 비밀번호" type="password" value={currentPw} onChange={setCurrentPw} placeholder="현재 비밀번호 입력" />
          <InputGroup label="새 비밀번호" type="password" value={newPw} onChange={setNewPw} placeholder="새 비밀번호 입력" />
          <InputGroup label="새 비밀번호 확인" type="password" value={confirmPw} onChange={setConfirmPw} placeholder="한 번 더 입력" />
          <button onClick={handleSubmit} className="w-full py-3 bg-olive-primary text-white rounded-xl font-bold mt-2 hover:bg-[#5a7566] transition-colors">변경하기</button>
        </div>
      </div>
    </div>
  );
};

const InputGroup = ({ 
  label, value, onChange, type = "text", placeholder 
}: { 
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string 
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-bold text-charcoal">{label}</label>
    <input 
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-olive-primary focus:bg-white transition-all text-sm"
    />
  </div>
);

function TabButton({ active, onClick, icon, children }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 font-bold text-sm border-b-2 transition-all whitespace-nowrap ${
        active ? "border-olive-primary text-olive-primary" : "border-transparent text-gray-400 hover:text-charcoal"
      }`}
    >
      {icon} {children}
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2">
      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-300">
        <AlertTriangle size={20} />
      </div>
      <div className="text-gray-400 text-sm">{text}</div>
    </div>
  );
}