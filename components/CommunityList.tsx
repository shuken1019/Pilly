// src/components/CommunityList.tsx
import React, { useEffect, useState } from "react";
import { Edit3, Heart, MessageSquare } from "lucide-react";
import { getPosts, CommunityPost } from "../services/communityService";

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
        alert("게시글을 불러오는 중 오류가 발생했습니다.");
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
          <h2 className="text-2xl font-bold">Pilly 커뮤니티</h2>
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
      <div className="flex gap-2 mb-6">
        {[
          { id: "combo", label: "💊 영양제 꿀조합" },
          { id: "review", label: "🤒 복용 후기" },
          { id: "qna", label: "🔍 이 약 뭔가요?" },
        ].map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id as any)}
            className={`px-4 py-2 rounded-full ${
              category === c.id
                ? "bg-olive-primary text-white"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* POST LIST */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        {loading ? (
          <div className="text-center py-20">불러오는 중...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            아직 작성된 글이 없어요.
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              onClick={() => onSelectPost(post.id)}
              className="border-b py-4 cursor-pointer hover:bg-gray-50 transition"
            >
              <h3 className="font-bold text-lg">{post.title}</h3>
              <p className="text-gray-600 line-clamp-2">{post.content}</p>

              <div className="mt-3 flex gap-3 text-xs text-gray-400">
                <span>{post.username ?? "익명"}</span>
                <span>
                  {new Date(post.created_at).toLocaleString("ko-KR", {
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div className="flex gap-4 mt-2 text-gray-400 text-xs">
                <span className="flex items-center gap-1">
                  <Heart size={14} /> {post.like_count}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare size={14} /> {post.comment_count}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommunityList;
