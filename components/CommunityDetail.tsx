import React, { useEffect, useState } from "react";
import { 
  ArrowLeft, Heart, MessageSquare, Trash2, Edit, X, User, 
  CornerDownRight // ✅ 답글 아이콘 추가
} from "lucide-react";
import {
  CommunityPost,
  CommunityComment,
  getPostDetail,
  getComments,
  createComment,
  togglePostLike,
  deletePost,
  deleteComment,
} from "../backend/services/communityService";
import { getMyProfile } from "../backend/services/mypageService"; 

interface CommunityDetailProps {
  postId: number;
  onBack: () => void;
  onEdit: (id: number) => void;
}

const CommunityDetail: React.FC<CommunityDetailProps> = ({
  postId,
  onBack,
  onEdit,
}) => {
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [myProfile, setMyProfile] = useState<{ username: string } | null>(null);
  
  // ✅ 대댓글 관련 상태
  const [replyingTo, setReplyingTo] = useState<number | null>(null); 
  const [replyInput, setReplyInput] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [postData, commentsData, myData] = await Promise.all([
          getPostDetail(postId),
          getComments(postId),
          getMyProfile().catch(() => null)
        ]);

        setPost(postData);
        setComments(commentsData);
        setMyProfile(myData); 

        // @ts-ignore
        if (postData.is_liked) {
          setIsLiked(true);
        } else {
          setIsLiked(false);
        }
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

  const handleDeletePost = async () => {
    if (!window.confirm("정말 이 글을 삭제하시겠습니까?")) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await deletePost(token, postId);
      alert("삭제되었습니다.");
      onBack();
    } catch (err) {
      alert("삭제 실패");
    }
  };

  const handlePostLike = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("로그인이 필요합니다.");

    const prevIsLiked = isLiked;
    setIsLiked(!prevIsLiked);

    try {
      const res = await togglePostLike(token, postId);
      setPost((prev) =>
        prev ? { ...prev, like_count: res.like_count } : null
      );
      // @ts-ignore
      setIsLiked(res.is_liked);
    } catch (err) {
      setIsLiked(prevIsLiked);
      console.error(err);
    }
  };

  // ✅ 일반 댓글 등록
  const handleCommentSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("로그인이 필요합니다.");
    if (!commentInput.trim()) return;

    try {
      const newComment = await createComment(token, postId, commentInput);
      setComments((prev) => [...prev, newComment]);
      setCommentInput("");
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ 대댓글(답글) 등록 함수
  const handleReplySubmit = async (parentId: number) => {
    const token = localStorage.getItem("token");
    if (!token) return alert("로그인이 필요합니다.");
    if (!replyInput.trim()) return;

    try {
      // API 호출 시 parentId를 함께 보냄
      const newReply = await createComment(token, postId, replyInput, parentId);
      setComments((prev) => [...prev, newReply]);
      setReplyInput("");
      setReplyingTo(null); // 입력창 닫기
    } catch (err) {
      console.error(err);
      alert("답글 등록 실패");
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm("댓글을 삭제할까요?")) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await deleteComment(token, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      alert("삭제 실패");
    }
  };

  if (loading || !post)
    return <div className="p-10 text-center text-gray-500">로딩 중...</div>;

  const isMyPost = myProfile && post && (myProfile.username === post.username);

  return (
    <div className="max-w-3xl mx-auto p-6 pb-20">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-charcoal transition-colors">
          <ArrowLeft size={20} /> 목록으로
        </button>

        {isMyPost && (
          <div className="flex gap-2">
            <button onClick={() => onEdit(postId)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-100 hover:text-olive-primary transition-colors">
              <Edit size={14} /> 수정
            </button>
            <button onClick={handleDeletePost} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors">
              <Trash2 size={14} /> 삭제
            </button>
          </div>
        )}
      </div>

      <article className="bg-white rounded-3xl shadow-sm border border-sage/20 p-8 mb-8">
        <div className="mb-6">
          <span className="bg-olive-primary/10 text-olive-primary px-3 py-1 rounded-full text-xs font-bold mb-3 inline-block">
            {post.category === "combo" ? "영양제 꿀조합" : post.category === "qna" ? "이 약 뭔가요?" : "복용 후기"}
          </span>
          <h1 className="text-3xl font-extrabold text-charcoal mb-3 leading-tight">{post.title}</h1>
          <div className="flex items-center gap-3 text-sm text-gray-400 font-medium">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden border border-gray-200 flex items-center justify-center flex-shrink-0">
                {post.profile_image ? <img src={post.profile_image} alt="" className="w-full h-full object-cover" /> : <User size={18} className="text-gray-400" />}
              </div>
              <span className="text-charcoal font-bold">{post.nickname || post.username}</span>
            </div>
            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
            <span>{new Date(post.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {post.image_url && (
          <div className="mb-8 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
            <img src={post.image_url} alt="게시글 이미지" className="w-full h-auto max-h-[500px] object-contain block" crossOrigin="anonymous" onError={(e) => { e.currentTarget.style.display = "none"; }} />
          </div>
        )}

        <div className="text-gray-800 leading-relaxed whitespace-pre-line min-h-[100px] mb-8 text-lg">{post.content}</div>

        <div className="flex items-center justify-between border-t border-gray-100 pt-6">
          <button onClick={handlePostLike} className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${isLiked ? "bg-rose-50 text-rose-500 border border-rose-100" : "text-gray-500 hover:bg-gray-50"}`}>
            <Heart size={20} className={isLiked ? "fill-rose-500" : ""} />
            <span className={`font-bold text-sm ${isLiked ? "text-rose-500" : ""}`}>좋아요 {post.like_count || 0}</span>
          </button>
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <MessageSquare size={20} /> <span>댓글 {comments.length}</span>
          </div>
        </div>
      </article>

      {/* 메인 댓글 입력창 */}
      <div className="bg-white rounded-2xl shadow-sm border border-sage/20 p-6 mb-8">
        <div className="flex gap-3">
          <input value={commentInput} onChange={(e) => setCommentInput(e.target.value)} placeholder="댓글을 남겨보세요..." className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-olive-primary outline-none bg-gray-50 focus:bg-white transition-all" />
          <button onClick={handleCommentSubmit} className="bg-charcoal text-white px-6 rounded-xl font-bold text-sm hover:bg-black transition-colors">등록</button>
        </div>
      </div>

      <ul className="space-y-3">
        {comments.map((c) => (
          <div key={c.id}>
            {/* ✅ 댓글 카드 (대댓글일 경우 ml-10 들여쓰기) */}
            <li className={`bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-start group ${c.parent_id ? "ml-10 bg-gray-50/50" : ""}`}>
              <div className="flex gap-3">
                {/* ✅ 대댓글 아이콘 */}
                {c.parent_id && <CornerDownRight size={18} className="text-gray-300 mt-1" />}
                
                <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden border border-gray-200 flex-shrink-0 flex items-center justify-center">
                  {c.profile_image ? <img src={c.profile_image} alt="" className="w-full h-full object-cover" /> : <User size={16} className="text-gray-400" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-charcoal">{c.nickname || c.username}</span>
                    <span className="text-xs text-gray-400">{c.created_at}</span>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{c.content}</p>
                  
                  {/* ✅ 답글 달기 버튼 (부모 댓글에만 노출) */}
                  {!c.parent_id && (
                    <button 
                      onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                      className="text-xs font-bold text-olive-primary mt-2 hover:underline"
                    >
                      답글 달기
                    </button>
                  )}
                </div>
              </div>

              {myProfile && myProfile.username === c.username && (
                <button onClick={() => handleDeleteComment(c.id)} className="text-gray-400 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all" title="댓글 삭제">
                  <X size={18} />
                </button>
              )}
            </li>

            {/* ✅ 대댓글(답글) 입력창 */}
            {replyingTo === c.id && (
              <div className="ml-10 mt-2 mb-4 flex gap-2 animate-fade-in">
                <input 
                  autoFocus
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  placeholder="답글을 입력하세요..."
                  className="flex-1 px-4 py-2 text-sm rounded-lg border border-gray-200 outline-none focus:border-olive-primary bg-white"
                />
                <button 
                  onClick={() => handleReplySubmit(c.id)}
                  className="bg-olive-primary text-white px-4 rounded-lg text-xs font-bold"
                >
                  등록
                </button>
                <button onClick={() => setReplyingTo(null)} className="text-gray-400 px-2 text-xs">취소</button>
              </div>
            )}
          </div>
        ))}
      </ul>
    </div>
  );
};

export default CommunityDetail;