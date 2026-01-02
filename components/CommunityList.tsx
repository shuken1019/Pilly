import React, { useEffect, useState } from "react";
import { Edit3, Heart, MessageSquare, User } from "lucide-react";
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
                  <div className="flex gap-3 text-xs text-gray-400 items-center">
                    
                    {/* ✅ 작성자 정보 영역 수정 */}
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-200 flex-shrink-0">
                        {/* 🚨 profileImage 대신 profile_image만 사용해서 TS 에러 해결 */}
                        {post.profile_image ? (
                        <img
                          src={post.profile_image}
                          alt="profile"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // 혹시라도 이미지 경로가 깨지면 회색 아이콘으로 대체
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <User size={14} className="text-gray-400" />
                      )}
                    </div>
                      <span className="font-medium text-gray-500">
                        {post.nickname || post.username}
                      </span>
                    </div>

                    <span className="text-gray-300">|</span>
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

              {/* 오른쪽: 게시글 이미지 썸네일 */}
              {post.image_url && (
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0 shadow-sm">
                  <img
                    src={post.image_url}
                    alt="thumbnail"
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
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