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
} from "../backend/services/communityService";
// ✅ [추가] 내 진짜 아이디를 가져오기 위해 import
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
  
  // ✅ [추가] 내 정보를 담을 상태 (localStorage 대신 사용)
  const [myProfile, setMyProfile] = useState<{ username: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 1. 게시글, 댓글, 그리고 '내 정보'를 동시에 가져옴
        const [postData, commentsData, myData] = await Promise.all([
          getPostDetail(postId),
          getComments(postId),
          getMyProfile().catch(() => null) // 비로그인 상태 대비
        ]);

        setPost(postData);
        setComments(commentsData);
        setMyProfile(myData); // ✅ 내 정보 저장

        // 좋아요 상태 설정
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
      alert("삭제 실패: 본인 글이 아니거나 오류가 발생했습니다.");
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

  const handleCommentSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("로그인이 필요합니다.");
    if (!commentInput.trim()) return;

    try {
      const newComment = await createComment(token, postId, commentInput);
      setComments((prev) => [newComment, ...prev]);
      setCommentInput("");
    } catch (err) {
      console.error(err);
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

  // ✅ [핵심 수정] 내 진짜 아이디(myProfile.username)와 글 작성자(post.username) 비교
  const isMyPost = myProfile && post && (myProfile.username === post.username);

  return (
    <div className="max-w-3xl mx-auto p-6 pb-20">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-charcoal transition-colors"
        >
          <ArrowLeft size={20} /> 목록으로
        </button>

        {/* ✅ 조건이 맞으면 수정/삭제 버튼 표시 */}
        {isMyPost && (
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(postId)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-100 hover:text-olive-primary transition-colors"
            >
              <Edit size={14} /> 수정
            </button>
            <button
              onClick={handleDeletePost}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <Trash2 size={14} /> 삭제
            </button>
          </div>
        )}
      </div>

      <article className="bg-white rounded-3xl shadow-sm border border-sage/20 p-8 mb-8">
        <div className="mb-6">
          <span className="bg-olive-primary/10 text-olive-primary px-3 py-1 rounded-full text-xs font-bold mb-3 inline-block">
            {post.category === "combo"
              ? "영양제 꿀조합"
              : post.category === "qna"
              ? "이 약 뭔가요?"
              : "복용 후기"}
          </span>
          <h1 className="text-3xl font-extrabold text-charcoal mb-3 leading-tight">
            {post.title}
          </h1>
          <div className="flex items-center gap-3 text-sm text-gray-400 font-medium">
            <span className="text-charcoal">{post.username}</span>
            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
            <span>{new Date(post.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {post.image_url && (
          <div className="mb-8 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
            <img
              src={post.image_url}
              alt="게시글 이미지"
              className="w-full h-auto max-h-[500px] object-contain block"
              crossOrigin="anonymous"
              onError={(e) => {
                console.error("이미지 로드 실패:", post.image_url);
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        )}

        <div className="text-gray-800 leading-relaxed whitespace-pre-line min-h-[100px] mb-8 text-lg">
          {post.content}
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 pt-6">
          <button
            onClick={handlePostLike}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
              isLiked
                ? "bg-rose-50 text-rose-500 border border-rose-100"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Heart size={20} className={isLiked ? "fill-rose-500" : ""} />
            <span
              className={`font-bold text-sm ${isLiked ? "text-rose-500" : ""}`}
            >
              좋아요 {post.like_count || 0}
            </span>
          </button>
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <MessageSquare size={20} /> <span>댓글 {comments.length}</span>
          </div>
        </div>
      </article>

      <div className="bg-white rounded-2xl shadow-sm border border-sage/20 p-6 mb-8">
        <div className="flex gap-3">
          <input
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            placeholder="댓글을 남겨보세요..."
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-olive-primary outline-none bg-gray-50 focus:bg-white transition-all"
          />
          <button
            onClick={handleCommentSubmit}
            className="bg-charcoal text-white px-6 rounded-xl font-bold text-sm hover:bg-black transition-colors"
          >
            등록
          </button>
        </div>
      </div>

      <ul className="space-y-3">
        {comments.map((c) => (
          <li
            key={c.id}
            className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-start group"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-sm text-charcoal">
                  {c.username}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(c.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-700 leading-relaxed">{c.content}</p>
            </div>

            {/* 댓글 삭제 버튼도 동일하게 수정 */}
            {myProfile && myProfile.username === c.username && (
              <button
                onClick={() => handleDeleteComment(c.id)}
                className="text-gray-400 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all"
                title="댓글 삭제"
              >
                <X size={18} />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CommunityDetail;