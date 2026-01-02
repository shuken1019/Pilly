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
} from "../backend/services/mypageService";
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
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [scraps, setScraps] = useState<Pill[]>([]);
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

  useEffect(() => {
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
        getMyHistory(),
        getMyPosts(),
        getMyScrappedPills(),
      ]);

      const historyItems = Array.isArray(h?.items) ? h.items : Array.isArray(h) ? h : [];
      const postItems = Array.isArray(postsData?.items) ? postsData.items : Array.isArray(postsData) ? postsData : [];
      const scrapItems = Array.isArray(s) ? s : [];

      setProfile({
            ...p,
            realName: p.real_name || p.realName || "", 
            birthdate: p.birthdate,
            phone: p.phone,
            email: p.email,
            profileImage: p.profile_image || p.profileImage 
        });

      setHistory(historyItems);
      setPosts(postItems);
      setScraps(scrapItems);
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
        birthdate: (profile.birthdate || "").replace(/\./g, "-"),
        phone: profile.phone || "",
        email: profile.email || "",
      });
      setSelectedFile(null);
      setPreviewUrl(profile.profileImage || null);
    }
    setViewMode("profile_edit");
  };

  // --- 핸들러: 저장하기 (API 연동) ---
  const handleSaveProfile = async () => {
    try {
      // 1. 유효성 검사
      if (!editForm.name.trim()) return alert("닉네임을 입력해주세요.");

      // 2. 서버로 보낼 데이터 (변수명 변환: realName -> real_name)
      const payload = {
        name: editForm.name,
        real_name: editForm.realName, // 여기가 핵심!
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
      
      localStorage.setItem("username", editForm.name);
      window.location.reload(); 

    } catch (error) {
      console.error(error);
      alert("저장에 실패했습니다. 잠시 후 다시 시도해주세요.");
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

  const handlePillClick = (itemSeq: string) => {
    if (onPillClick) onPillClick(itemSeq);
    else navigate(`/pills/${itemSeq}`);
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
            <h1 className="text-2xl font-bold text-charcoal">마이페이지</h1>
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
                <p className="text-sm text-gray-400">{profile?.username}</p>
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
              {activeTab === "history" && (
                <ul className="space-y-2">
                  {history.length === 0 ? <EmptyState text="기록이 없습니다." /> : history.map((item, idx) => (
                    <li key={idx} onClick={() => onSearchClick(item.keyword)} className="flex justify-between p-3 bg-white rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                      <span className="font-bold text-charcoal">{item.keyword}</span>
                      <span className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              )}
              {activeTab === "posts" && (
                 <div className="space-y-2">
                 {posts.length === 0 ? <EmptyState text="작성한 글이 없습니다." /> : posts.map((post, idx) => (
                   <div key={idx} onClick={() => onPostClick(post.id)} className="p-3 bg-white rounded-xl shadow-sm cursor-pointer flex justify-between hover:shadow-md transition-shadow">
                     <span className="font-bold text-charcoal truncate">{post.title}</span>
                     <span className="text-xs text-gray-400 whitespace-nowrap">조회 {post.views}</span>
                   </div>
                 ))}
               </div>
              )}
              {activeTab === "scraps" && (
                <div className="grid grid-cols-1 gap-2">
                {scraps.length === 0 ? <EmptyState text="찜한 약이 없습니다." /> : scraps.map((pill, idx) => (
                  <div key={idx} onClick={() => handlePillClick(pill.item_name)} className="p-3 bg-white rounded-xl shadow-sm cursor-pointer flex gap-3 items-center hover:shadow-md transition-shadow">
                     <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {pill.item_image && <img src={pill.item_image} alt="" className="w-full h-full object-cover" />}
                     </div>
                     <div className="overflow-hidden">
                       <div className="text-[10px] text-olive-primary">{pill.entp_name}</div>
                       <div className="font-bold text-sm truncate">{pill.item_name}</div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl animate-fade-in-up">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-charcoal">비밀번호 변경</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <div className="space-y-4">
          <InputGroup label="현재 비밀번호" type="password" value={currentPw} onChange={setCurrentPw} placeholder="현재 비밀번호 입력" />
          <InputGroup label="새 비밀번호" type="password" value={newPw} onChange={setNewPw} placeholder="새 비밀번호 입력" />
          <InputGroup label="새 비밀번호 확인" type="password" value={confirmPw} onChange={setConfirmPw} placeholder="한 번 더 입력" />
          <button onClick={handleSubmit} className="w-full py-3 bg-olive-primary text-white rounded-xl font-bold mt-2">변경하기</button>
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
        active ? "border-olive-primary text-olive-primary" : "border-transparent text-gray-400"
      }`}
    >
      {icon} {children}
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="text-center py-10 text-gray-400 text-sm">{text}</div>;
}