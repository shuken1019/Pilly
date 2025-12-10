// src/components/CommunityDetail.tsx
import React, { useEffect, useState } from "react";
import { ArrowLeft, Heart, MessageSquare, Trash2, Edit, X } from "lucide-react";
import {
  CommunityPost,
  CommunityComment,
  getPostDetail,
  getComments,
  createComment,
  togglePostLike,
  deletePost,
  deleteComment,
} from "../services/communityService";

interface CommunityDetailProps {
  postId: number;
  onBack: () => void;
  onEdit: (id: number) => void;
}

const CommunityDetail: React.FC<CommunityDetailProps> = ({ postId, onBack, onEdit }) => {
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [isLiked, setIsLiked] = useState(false);

  // 🆔 현재 로그인한 아이디 (localStorage)
  const currentUser = localStorage.getItem("username"); 

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [postData, commentsData] = await Promise.all([
          getPostDetail(postId),
          getComments(postId),
        ]);
        
        // 🔍 [디버깅] 콘솔에서 확인해보세요 (F12)
        console.log("=== 권한 확인 ===");
        console.log("내 아이디(Local):", currentUser);
        console.log("글쓴이(DB):", postData.username);
        
        setPost(postData);
        setComments(commentsData);
      } catch (err) {
        console.error(err);
        alert("게시글을 불러오지 못했습니다.");
        onBack();
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [postId, onBack]);

  // 글 삭제
  const handleDeletePost = async () => {
    if (!window.confirm("삭제하시겠습니까?")) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await deletePost(token, postId);
      alert("삭제되었습니다.");
      onBack();
    } catch { alert("삭제 실패"); }
  };

  // 좋아요
  const handlePostLike = async () => {
     const token = localStorage.getItem("token");
     if(!token) return alert("로그인 필요");
     setIsLiked(!isLiked); // UI 즉시 반영
     try {
         const res = await togglePostLike(token, postId);
         setPost(prev => prev ? {...prev, like_count: res.like_count} : null);
     } catch { setIsLiked(!isLiked); }
  };

  // 댓글 작성
  const handleCommentSubmit = async () => {
    const token = localStorage.getItem("token");
    if(!token) return alert("로그인 필요");
    if(!commentInput.trim()) return;
    try {
        const newComment = await createComment(token, postId, commentInput);
        setComments(prev => [newComment, ...prev]);
        setCommentInput("");
    } catch { alert("댓글 등록 실패"); }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId: number) => {
      if (!window.confirm("댓글 삭제?")) return;
      const token = localStorage.getItem("token");
      try {
          await deleteComment(token!, commentId);
          setComments(prev => prev.filter(c => c.id !== commentId));
      } catch { alert("삭제 실패"); }
  }

  if (loading || !post) return <div className="p-10 text-center">로딩 중...</div>;

  // ✅ 본인 확인 로직
  const isMyPost = currentUser === post.username;

  return (
    <div className="max-w-3xl mx-auto p-6 pb-20">
      
      {/* 🛠 [디버깅용 박스] 해결되면 지우세요 */}
      {!isMyPost && (
        <div className="mb-4 p-3 bg-yellow-50 text-yellow-800 text-xs rounded border border-yellow-200">
           <b>[디버그] 왜 버튼이 안 보일까?</b><br/>
           내 아이디: {currentUser || "로그인 안됨"}<br/>
           글쓴이 아이디: {post.username}<br/>
           (이 두 값이 똑같아야 수정/삭제 버튼이 보입니다. 다르면 로그아웃 후 다시 로그인해보세요.)
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500">
          <ArrowLeft size={20} /> 목록
        </button>
        
        {/* ✅ 수정/삭제 버튼 그룹 */}
        {isMyPost && (
            <div className="flex gap-2">
                <button onClick={() => onEdit(postId)} className="text-sm text-gray-500 hover:text-olive-primary flex items-center gap-1">
                    <Edit size={14}/> 수정
                </button>
                <button onClick={handleDeletePost} className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1">
                    <Trash2 size={14}/> 삭제
                </button>
            </div>
        )}
      </div>

      <article className="bg-white rounded-3xl shadow-sm border border-sage/20 p-8 mb-8">
        <h1 className="text-3xl font-bold text-charcoal mb-3">{post.title}</h1>
        <div className="flex items-center gap-3 text-sm text-gray-400 mb-6">
            <span>{post.username}</span>
            <span>•</span>
            <span>{new Date(post.created_at).toLocaleDateString()}</span>
        </div>
        <div className="text-gray-800 whitespace-pre-line mb-8">{post.content}</div>

        <div className="flex items-center gap-4 border-t pt-6">
          <button onClick={handlePostLike} className={`flex items-center gap-2 ${isLiked ? "text-rose-500" : "text-gray-500"}`}>
            <Heart size={20} className={isLiked ? "fill-current" : ""} />
            <span>{post.like_count || 0}</span>
          </button>
          <div className="flex items-center gap-2 text-gray-400">
             <MessageSquare size={20} /> <span>{comments.length}</span>
          </div>
        </div>
      </article>

      <div className="bg-white rounded-2xl shadow-sm border p-4 mb-4 flex gap-2">
         <input value={commentInput} onChange={e=>setCommentInput(e.target.value)} className="flex-1 outline-none" placeholder="댓글 입력..." />
         <button onClick={handleCommentSubmit} className="text-olive-primary font-bold">등록</button>
      </div>
      
      <ul className="space-y-3">
         {comments.map(c => (
             <li key={c.id} className="bg-white p-4 rounded-xl border flex justify-between group">
                 <div>
                     <div className="font-bold text-sm mb-1">{c.username}</div>
                     <p className="text-sm text-gray-700">{c.content}</p>
                 </div>
                 {currentUser === c.username && (
                    <button onClick={() => handleDeleteComment(c.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100">
                        <X size={16} />
                    </button>
                 )}
             </li>
         ))}
      </ul>
    </div>
  );
};

export default CommunityDetail;