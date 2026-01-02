// src/components/CommunityList.tsx
import React, { useEffect, useState } from "react";
import { Edit3, Heart, MessageSquare, ImageIcon } from "lucide-react";
import { getPosts, CommunityPost } from "../backend/services/communityService";

interface CommunityListProps {
  onWriteClick: () => void;
  onSelectPost: (id: number) => void;
}

const CommunityList: React.FC<CommunityListProps> = ({
  onWriteClick,
  onSelectPost,
}) => {
  const [category, setCategory] = useState<"combo" | "review" | "qna">("combo");
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const data = await getPosts(category);
        setPosts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [category]);

  return (
    <div className="max-w-4xl mx-auto px-4 pb-16">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-charcoal">Pilly 커뮤니티</h2>
          <p className="text-sage text-sm mt-1">
            영양제 조합, 후기, QnA를 나눠보세요.
          </p>
        </div>
        <button
          onClick={onWriteClick}
          className="inline-flex items-center gap-2 bg-olive-primary text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-md hover:bg-olive-dark transition-all"
        >
          <Edit3 size={16} />
          글쓰기
        </button>
      </div>

      {/* CATEGORY */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: "combo", label: "💊 영양제 꿀조합" },
          { id: "review", label: "🤒 복용 후기" },
          { id: "qna", label: "🔍 이 약 뭔가요?" },
        ].map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id as any)}
            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
              category === c.id
                ? "bg-olive-primary text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* POST LIST */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 min-h-[300px]">
        {loading ? (
          <div className="text-center py-20 text-gray-400">불러오는 중...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            아직 작성된 글이 없어요.
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              onClick={() => onSelectPost(post.id)}
              // ✅ [수정] flex-row로 변경하여 글과 이미지를 가로로 배치
              className="border-b last:border-b-0 py-5 cursor-pointer hover:bg-gray-50 transition px-2 flex justify-between gap-4"
            >
              {/* 왼쪽: 텍스트 정보 */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-charcoal mb-1 truncate">
                  {post.title}
                </h3>
                <p className="text-gray-600 line-clamp-2 text-sm mb-3">
                  {post.content}
                </p>

                <div className="flex justify-between items-center">
                  <div className="flex gap-3 text-xs text-gray-400">
                    <span className="font-medium text-gray-500">
                      {post.username ?? "익명"}
                    </span>
                    <span>
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex gap-4 text-gray-400 text-xs">
                    <span
                      className={`flex items-center gap-1 ${
                        post.is_liked ? "text-rose-500 font-bold" : ""
                      }`}
                    >
                      <Heart
                        size={14}
                        className={post.is_liked ? "fill-rose-500" : ""}
                      />
                      {post.like_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare size={14} /> {post.comment_count}
                    </span>
                  </div>
                </div>
              </div>

              {/* ✅ [추가] 오른쪽: 이미지 썸네일 (이미지가 있을 때만 표시) */}
              {post.image_url && (
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                  <img
                    src={post.image_url}
                    alt="thumbnail"
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      // 이미지 로드 실패 시 아이콘으로 대체
                      e.currentTarget.style.display = "none";
                      e.currentTarget.parentElement?.classList.add(
                        "flex",
                        "items-center",
                        "justify-center"
                      );
                      e.currentTarget.parentElement!.innerHTML =
                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-300"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                    }}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommunityList;
