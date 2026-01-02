import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, FileText, BarChart, Trash2, ShieldAlert, Edit,
  UserX, UserCheck, Search, MessageSquare, Eye, EyeOff
} from "lucide-react";
import {
  getAdminStats,
  getAllUsers,
  deleteUser,
  getAllPosts,
  deletePostAdmin,
  togglePostHide,
  updateUser,
  changeUserRole // ✅ import 확인
} from "../backend/services/adminService";

// ✅ [수정 1] AdminUser 인터페이스 정의 추가
interface AdminUser {
  id: number;
  username: string;
  name: string;
  role: string;
  created_at: string;
  is_banned: boolean;
  admin_memo?: string;
}

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"dashboard" | "users" | "posts">("dashboard");
  const [stats, setStats] = useState({ user_count: 0, post_count: 0 });
  
  // state 타입 명시 (any 대신 AdminUser[] 권장하지만 편의상 any[] 유지 가능)
  const [users, setUsers] = useState<AdminUser[]>([]); 
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchKeyword, setSearchKeyword] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 데이터 불러오는 함수 이름: fetchData
  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "dashboard") {
        const data = await getAdminStats();
        setStats(data);
      } else if (activeTab === "users") {
        const data = await getAllUsers(searchKeyword);
        setUsers(data);
      } else if (activeTab === "posts") {
        const data = await getAllPosts();
        setPosts(data);
      }
    } catch (error: any) {
      console.error(error);
      if (error.response?.status === 403) {
        alert("관리자 권한이 없습니다! 쫒겨납니다. 🚨");
        navigate("/");
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = () => {
    fetchData();
  };

  useEffect(() => {
    setSearchKeyword("");
    if(searchInputRef.current) searchInputRef.current.value = "";
    fetchData();
  }, [activeTab]);

  const handleDeleteUser = async (id: number, username: string) => {
    if (window.confirm(`[경고] 회원 '${username}'을(를) 정말 삭제하시겠습니까?`)) {
      try {
        await deleteUser(id);
        alert("회원이 삭제되었습니다.");
        fetchData();
      } catch (e) { alert("삭제 실패"); }
    }
  };

  const handleUpdateUser = async (user: any) => {
    // 권한 변경은 별도 버튼으로 분리했으므로 여기선 제외해도 되지만, 유지한다면 아래와 같이
    const newMemo = window.prompt("관리자 메모 (없으면 비워두세요)", user.admin_memo || "");
    if (newMemo === null) return;

    try {
      await updateUser(user.id, {
        role: user.role, // 기존 권한 유지
        is_banned: user.is_banned,
        admin_memo: newMemo,
      });
      alert("메모가 수정되었습니다.");
      fetchData();
    } catch (e) { alert("수정 실패"); }
  };

  const handleToggleBan = async (user: any) => {
    const action = user.is_banned ? '차단 해제' : '로그인 차단';
    if (window.confirm(`'${user.username}' 회원을 정말로 ${action} 하시겠습니까?`)) {
      try {
        await updateUser(user.id, {
          role: user.role,
          is_banned: !user.is_banned,
          admin_memo: user.admin_memo,
        });
        alert(`회원이 ${action} 처리되었습니다.`);
        fetchData();
      } catch(e) { alert("상태 변경 실패"); }
    }
  };

  // ✅ [수정 2] 권한 변경 핸들러
  const handleToggleRole = async (user: AdminUser) => {
    const targetRole = user.role === "ADMIN" ? "USER" : "ADMIN";
    const actionText = targetRole === "ADMIN" ? "관리자로 승격" : "일반 유저로 강등";

    if (!window.confirm(`'${user.name}'님을 ${actionText} 하시겠습니까?`)) return;

    try {
      await changeUserRole(user.id, targetRole);
      alert("권한이 변경되었습니다.");
      
      // 🚨 수정된 부분: fetchUsers() -> fetchData()로 변경
      fetchData(); 
    } catch (e) {
      console.error(e);
      alert("권한 변경 실패");
    }
  };

  const handleToggleHide = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await togglePostHide(id);
      fetchData();
    } catch (error) { alert("상태 변경 실패"); }
  };

  const handleDeletePost = async (id: number) => {
    if (window.confirm("이 게시글을 정말 삭제하시겠습니까?")) {
      try {
        await deletePostAdmin(id);
        alert("게시글이 삭제되었습니다.");
        fetchData();
      } catch (e) { alert("삭제 실패"); }
    }
  };

  const handleGoToPost = (postId: number) => {
    navigate("/", { state: { targetView: "COMMUNITY_DETAIL", postId } });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-red-100 text-red-600 rounded-full"><ShieldAlert size={32} /></div>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">관리자 페이지</h1>
          <p className="text-gray-500">Pilly 서비스 전체 현황을 관리합니다.</p>
        </div>
      </div>
      <div className="flex gap-2 mb-8 border-b border-gray-200 pb-1">
        <TabButton active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} icon={<BarChart size={18}/>}>대시보드</TabButton>
        <TabButton active={activeTab === "users"} onClick={() => setActiveTab("users")} icon={<Users size={18}/>}>회원 관리</TabButton>
        <TabButton active={activeTab === "posts"} onClick={() => setActiveTab("posts")} icon={<FileText size={18}/>}>게시글 관리</TabButton>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 min-h-[400px]">
        {loading ? ( <div className="text-center py-20 text-gray-400">데이터를 불러오는 중...</div> ) 
        : (
          <>
            {activeTab === "dashboard" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard title="총 회원 수" value={`${stats.user_count}명`} icon={<Users />} color="bg-blue-50 text-blue-600" />
                <StatCard title="총 게시글 수" value={`${stats.post_count}개`} icon={<FileText />} color="bg-green-50 text-green-600" />
              </div>
            )}

            {activeTab === "users" && (
              <>
                <div className="flex gap-2 mb-6">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="아이디 또는 이름으로 검색"
                    className="flex-grow p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition"
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button onClick={handleSearch} className="bg-gray-800 text-white px-5 rounded-lg hover:bg-gray-700 transition flex items-center gap-2">
                    <Search size={18}/> 검색
                  </button>
                </div>

                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="p-4">ID</th>
                      <th className="p-4">아이디/이름</th>
                      <th className="p-4">권한</th>
                      <th className="p-4">가입일</th>
                      <th className="p-4 text-center">메모</th>
                      <th className="p-4 text-center">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className={`border-b transition-colors ${u.is_banned ? 'bg-red-50 text-gray-500' : 'hover:bg-gray-50'}`}>
                        <td className="p-4">{u.id}</td>
                        <td className="p-4">
                          <div className="font-bold text-gray-800">{u.username}</div>
                          <div className="text-gray-500">{u.name}</div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="p-4 text-center">
                            {u.admin_memo && (
                            <span title={u.admin_memo}>
                                <MessageSquare size={16} className="mx-auto text-gray-400" />
                            </span>
                        )}
                        </td>
                        <td className="p-4 text-center flex justify-center gap-2">
                          
                          {/* ✅ 1. 권한 변경 버튼 (ADMIN <-> USER 토글) */}
                          <button 
                              onClick={() => handleToggleRole(u)} 
                              className={`p-2 rounded transition-colors ${
                                  u.role === 'ADMIN' 
                                  ? "bg-purple-50 text-purple-600 hover:bg-purple-100" 
                                  : "bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
                              }`} 
                              title={u.role === 'ADMIN' ? "일반 유저로 강등" : "관리자로 승격"}
                          >
                              {u.role === 'ADMIN' ? <UserCheck size={16} /> : <ShieldAlert size={16} />}
                          </button>

                          {/* 2. 차단/해제 (관리자 아닐 때만) */}
                          {u.role !== 'ADMIN' && (
                            <button onClick={() => handleToggleBan(u)} className={`p-2 rounded transition-colors ${u.is_banned ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`} title={u.is_banned ? '차단 해제' : '로그인 차단'}>
                              {u.is_banned ? <UserCheck size={16} /> : <UserX size={16} />}
                            </button>
                          )}

                          {/* 3. 메모 수정 */}
                          <button onClick={() => handleUpdateUser(u)} className="bg-blue-50 text-blue-500 hover:bg-blue-500 hover:text-white p-2 rounded transition-colors" title="메모 수정"><Edit size={16} /></button>
                          
                          {/* 4. 회원 삭제 (관리자 아닐 때만) */}
                          {u.role !== 'ADMIN' && (
                             <button onClick={() => handleDeleteUser(u.id, u.username)} className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white p-2 rounded transition-colors" title="회원 삭제"><Trash2 size={16} /></button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {activeTab === "posts" && (
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4">ID</th>
                    <th className="p-4 w-1/2">제목</th>
                    <th className="p-4">작성자</th>
                    <th className="p-4">조회수</th>
                    <th className="p-4">작성일</th>
                    <th className="p-4 text-center">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((p) => (
                    <tr key={p.id} className={`border-b transition-colors ${p.is_hidden ? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
                      <td className="p-4 text-gray-400">{p.id}</td>
                      <td className={`p-4 font-bold cursor-pointer hover:underline ${p.is_hidden ? 'text-gray-400 line-through' : 'text-gray-800 hover:text-blue-600'}`} onClick={() => handleGoToPost(p.id)}>
                        {p.title} 
                        {p.is_hidden && <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-500 no-underline">숨김됨</span>}
                      </td>
                      <td className="p-4">{p.username}</td>
                      <td className="p-4">{p.views}</td>
                      <td className="p-4 text-gray-500">{new Date(p.created_at).toLocaleDateString()}</td>
                      <td className="p-4 text-center flex items-center justify-center gap-2">
                        <button onClick={(e) => handleToggleHide(e, p.id)} className={`p-2 rounded transition-colors ${p.is_hidden ? "bg-gray-200 text-gray-500 hover:bg-gray-300" : "bg-blue-50 text-blue-500 hover:bg-blue-100"}`} title={p.is_hidden ? "숨김 해제" : "게시글 숨기기"}>
                          {p.is_hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeletePost(p.id); }} className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white p-2 rounded transition-colors" title="영구 삭제">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPage;

// --- UI 컴포넌트들 ---
function TabButton({ active, onClick, children, icon }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-3 rounded-t-lg font-bold transition-all flex items-center gap-2 ${
        active
          ? "bg-white text-gray-800 border-t border-x border-gray-200 relative top-[1px]"
          : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
      }`}
    >
      {icon} {children}
    </button>
  );
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <div className="p-8 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-6 bg-white hover:shadow-md transition-shadow">
      <div className={`p-5 rounded-full ${color}`}>{icon}</div>
      <div>
        <p className="text-gray-500 mb-1">{title}</p>
        <p className="text-4xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}