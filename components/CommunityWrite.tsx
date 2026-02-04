import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { ArrowLeft, X, Plus, Camera, Loader2 } from "lucide-react";

const API_BASE_URL = "http://3.38.78.49:8000/api";

interface Pill {
  item_seq: string;
  item_name: string;
  entp_name: string;
}

interface CommunityWriteProps {
  onBack: () => void;
  onComplete: () => void;
  editPostId?: number | null;
}

const CommunityWrite: React.FC<CommunityWriteProps> = ({ onBack, onComplete, editPostId }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState("free");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // 검색 및 태그 상태
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<Pill[]>([]);
  const [selectedPills, setSelectedPills] = useState<Pill[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 이미지 선택 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // 약 검색 핸들러
// 약 검색 핸들러
  const handleSearchPill = async () => {
    if (!keyword.trim()) return;
    
    // ✅ 1. 로컬 스토리지에서 토큰을 가져와야 합니다. (이게 없으면 백엔드 current_user가 None이 됨)
    const token = localStorage.getItem("token");
    console.log("전송 시도 토큰:", token);
    setIsSearching(true);
    try {
      // ✅ 2. API 호출 시 헤더에 토큰을 실어 보냅니다.
      const res = await axios.get(`${API_BASE_URL}/pills`, { 
        params: { 
          keyword: keyword,
          page: 1,
          page_size: 20
        },
        headers: {
          Authorization: token ? `Bearer ${token}` : ""
        }
      });

      // ✅ 3. 백엔드 응답 구조(items)에 맞춰 데이터 세팅
      if (res.data && res.data.items) {
        setSearchResults(res.data.items);
      } else {
        setSearchResults([]);
      }
    } catch (error) { 
      console.error("약 검색 중 에러 발생:", error);
      setSearchResults([]);
    } finally { 
      setIsSearching(false); 
    }
  };
  // 약 추가 핸들러
  const addPill = (pill: Pill) => {
    if (selectedPills.find((p) => p.item_seq === pill.item_seq)) return alert("이미 추가된 약입니다.");
    setSelectedPills([...selectedPills, pill]);
    setKeyword("");
    setSearchResults([]);
    setIsSearchOpen(false);
  };

  // 등록 핸들러
  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return alert("제목과 내용을 입력해주세요.");
    const token = localStorage.getItem("token");
    if (!token) return alert("로그인이 필요합니다.");

    try {
      setIsUploading(true);
      let finalImageUrl = previewUrl || "";
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        const uploadRes = await axios.post(`${API_BASE_URL}/community/upload`, formData, { headers: { "Content-Type": "multipart/form-data" } });
        finalImageUrl = uploadRes.data.url;
      }
      const payload = { category, title, content, image_url: finalImageUrl, pill_ids: selectedPills.map(p => Number(p.item_seq)) };
      const headers = { Authorization: `Bearer ${token}` };

      await axios.post(`${API_BASE_URL}/community`, payload, { headers });
      alert("게시글이 등록되었습니다!");
      onComplete();
    } catch (error) { alert("등록 실패"); } finally { setIsUploading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white min-h-screen pb-20 p-6">
      {/* 뒤로가기 및 타이틀 */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="text-gray-600"><ArrowLeft size={24} /></button>
        <h2 className="text-2xl font-bold text-gray-800">글 쓰기</h2>
      </div>

      {/* 카테고리 탭 (이미지 스타일) */}
      <div className="flex gap-2 mb-6">
        {[
          { id: "free", label: "영양제 꿀조합", color: "bg-[#718355] text-white" },
          { id: "review", label: "복용 후기", color: "bg-[#F3E3D3] text-orange-800" },
          { id: "qna", label: "QNA", color: "bg-[#E9F0F5] text-blue-800" }
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${category === cat.id ? `${cat.color} ring-2 ring-offset-1 ring-gray-300` : "bg-gray-100 text-gray-500"}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 제목 입력 */}
      <input
        type="text"
        placeholder="제목을 입력하세요"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full p-4 mb-4 border border-gray-200 rounded-xl focus:outline-none focus:border-[#718355]"
      />

      {/* 사진 추가 버튼 */}
      <div className="mb-6">
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50"
        >
          <Camera size={24} />
          <span className="text-[10px] mt-1">사진 추가</span>
        </div>
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
        {previewUrl && <img src={previewUrl} className="mt-2 w-32 h-32 object-cover rounded-lg border" />}
      </div>

      {/* 태그된 약 섹션 (이미지와 동일한 디자인) */}
      <div className="border border-[#DCE4D8] rounded-xl p-4 mb-6 bg-[#F9FBFA]">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[#5B7A58] font-bold text-sm">태그된 약 ({selectedPills.length})</span>
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="bg-[#E9EFEC] text-[#5B7A58] px-3 py-1 rounded-lg text-xs font-bold border border-[#DCE4D8] flex items-center gap-1"
          >
            <Plus size={14} /> 약 검색해서 추가
          </button>
        </div>
        
        {/* 선택된 약들 표시 */}
        <div className="flex flex-wrap gap-2">
          {selectedPills.map(pill => (
            <div key={pill.item_seq} className="bg-white border border-[#DCE4D8] px-3 py-1 rounded-full text-xs flex items-center gap-2">
              #{pill.item_name}
              <X size={12} className="cursor-pointer" onClick={() => setSelectedPills(selectedPills.filter(p => p.item_seq !== pill.item_seq))} />
            </div>
          ))}
        </div>

        {/* 검색 모달 스타일 창 */}
        {isSearchOpen && (
          <div className="mt-4 p-3 bg-white border border-[#718355] rounded-xl shadow-lg">
            <div className="flex gap-2 mb-2">
              <input 
                type="text" 
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchPill()}
                placeholder="약 이름을 입력하세요"
                className="flex-1 text-sm p-2 border rounded-md focus:outline-none"
              />
              <button onClick={handleSearchPill} className="bg-[#718355] text-white px-3 py-1 rounded-md text-xs">검색</button>
            </div>
            <div className="max-h-40 overflow-y-auto">
              {searchResults.map(p => (
                <div key={p.item_seq} onClick={() => addPill(p)} className="p-2 hover:bg-gray-50 cursor-pointer text-xs border-b last:border-0 flex justify-between">
                  <span>{p.item_name}</span>
                  <span className="text-gray-400">{p.entp_name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 내용 입력 */}
      <textarea
        placeholder="내용을 입력하세요."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full p-4 h-64 border border-gray-200 rounded-xl focus:outline-none focus:border-[#718355] resize-none"
      />

      {/* 하단 등록하기 버튼 */}
      <button
        onClick={handleSubmit}
        disabled={isUploading}
        className="w-full mt-10 py-4 bg-[#718355] text-white rounded-xl font-bold text-lg hover:bg-[#5b6b45] shadow-lg disabled:bg-gray-300 flex justify-center items-center gap-2"
      >
        {isUploading ? <Loader2 className="animate-spin" size={20} /> : "등록하기"}
      </button>
    </div>
  );
};

export default CommunityWrite;