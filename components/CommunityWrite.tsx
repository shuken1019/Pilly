// src/components/CommunityWrite.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  X,
  Plus,
  Loader2,
  Camera,
} from "lucide-react";
import {
  createPost,
  updatePost,
  getPostDetail,
  uploadImage,
} from "../backend/services/communityService";
import SearchSection from "./SearchSection";
import { Pill } from "../backend/services/api";

interface CommunityWriteProps {
  onBack: () => void;
  onComplete: () => void;
  editPostId?: number | null;
}

const CommunityWrite: React.FC<CommunityWriteProps> = ({
  onBack,
  onComplete,
  editPostId,
}) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<"combo" | "review" | "qna">("combo");
  const [selectedPills, setSelectedPills] = useState<Pill[]>([]);

  // 📸 이미지 관련 상태
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // 수정 모드일 때 데이터 불러오기
  useEffect(() => {
    if (editPostId) {
      const fetchOriginData = async () => {
        try {
          setLoading(true);
          const data = await getPostDetail(editPostId);
          setTitle(data.title);
          setContent(data.content);
          setCategory(data.category as any);
          if (data.image_url) setImageUrl(data.image_url); // 이미지 불러오기
        } catch (error) {
          console.error(error);
          alert("글 정보를 불러오지 못했습니다.");
          onBack();
        } finally {
          setLoading(false);
        }
      };
      fetchOriginData();
    }
  }, [editPostId, onBack]);

  // 📸 이미지 선택 핸들러
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadImage(file); // 백엔드에 업로드하고 URL 받기
      setImageUrl(url);
    } catch (err) {
      console.error(err);
      alert("이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("로그인이 필요합니다.");
    if (!title.trim() || !content.trim())
      return alert("제목과 내용을 입력해주세요.");

    try {
      setLoading(true);
      const postData = {
        category,
        title,
        content,
        image_url: imageUrl || "", // ✅ 이미지 URL 포함
        pill_ids: selectedPills.map((p) => parseInt(p.item_seq)),
      };

      if (editPostId) {
        await updatePost(token, editPostId, postData);
        alert("게시글이 수정되었습니다.");
      } else {
        await createPost(token, postData);
        alert("게시글이 등록되었습니다.");
      }
      onComplete();
    } catch (error) {
      console.error(error);
      alert("처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && editPostId && !title)
    return <div className="p-10 text-center">로딩 중...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white min-h-screen">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft />
        </button>
        <h2 className="text-2xl font-bold">
          {editPostId ? "글 수정하기" : "글 쓰기"}
        </h2>
      </div>

      {/* 카테고리 */}
      <div className="flex gap-2 mb-6">
        {[
          { id: "combo", label: "💊 영양제 꿀조합" },
          { id: "review", label: "🤒 복용 후기" },
          { id: "qna", label: "🔍 이 약 뭔가요?" },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id as any)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
              category === cat.id
                ? "bg-olive-primary text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <input
          type="text"
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-xl font-bold p-4 bg-cream/30 border border-gray-200 rounded-xl focus:outline-none focus:border-olive-primary"
        />

        {/* 📸 이미지 업로드 영역 */}
        <div className="flex gap-4 items-start">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-olive-primary hover:text-olive-primary transition-colors bg-gray-50"
          >
            {uploading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Camera size={24} />
            )}
            <span className="text-xs mt-1">사진 추가</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageChange}
          />

          {/* 업로드된 이미지 미리보기 */}
          {imageUrl && (
            <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 group">
              <img
                src={imageUrl}
                alt="Uploaded"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setImageUrl(null)}
                className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        {/* 약 태그 영역 */}
        <div className="p-4 border border-sage/30 rounded-xl bg-white">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-bold text-sage">
              태그된 약 ({selectedPills.length})
            </span>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="text-xs flex items-center gap-1 bg-olive-primary/10 text-olive-primary px-3 py-1.5 rounded-lg hover:bg-olive-primary hover:text-white transition-colors"
            >
              <Plus size={14} /> 약 검색해서 추가
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedPills.map((pill) => (
              <div
                key={pill.item_seq}
                className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full text-sm"
              >
                <span>{pill.item_name}</span>
                <button
                  onClick={() =>
                    setSelectedPills((p) =>
                      p.filter((x) => x.item_seq !== pill.item_seq)
                    )
                  }
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <textarea
          placeholder="내용을 입력하세요."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-60 p-4 bg-cream/30 border border-gray-200 rounded-xl focus:outline-none focus:border-olive-primary resize-none"
        />
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={loading || uploading}
          className="bg-olive-primary text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-olive-dark shadow-lg transition-all flex items-center gap-2"
        >
          {loading && <Loader2 className="animate-spin" size={20} />}
          {editPostId ? "수정 완료" : "등록하기"}
        </button>
      </div>

      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl h-[80vh] rounded-2xl p-4 relative overflow-hidden flex flex-col">
            <button
              onClick={() => setIsSearchOpen(false)}
              className="absolute top-4 right-4 z-10"
            >
              <X />
            </button>
            <div className="flex-1 overflow-y-auto">
              <SearchSection />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityWrite;
