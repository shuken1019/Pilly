// src/components/SearchSection.tsx
import React, { useState, useEffect } from "react";
import {
  Search,
  Pill as PillIcon,
  AlertCircle,
  Filter,
  ChevronDown,
  ChevronUp,
  Check,
  MousePointerClick,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Heart,
  Loader2,
} from "lucide-react";
import {
  searchPills,
  Pill,
  SearchFilters,
  getPillDetail,
  togglePillLike,
} from "../backend/services/api";
import PillDetailModal from "./PillDetailModal";

// --- 상수 데이터 ---
const SHAPES = [
  { label: "원형", value: "원형" },
  { label: "타원형", value: "타원형" },
  { label: "장방형", value: "장방형" },
  { label: "삼각형", value: "삼각형" },
  { label: "사각형", value: "사각형" },
  { label: "마름모", value: "마름모" },
  { label: "오각형", value: "오각형" },
  { label: "육각형", value: "육각형" },
  { label: "팔각형", value: "팔각형" },
];
const COLORS = [
  { label: "하양", value: "하양", code: "#FFFFFF", border: true },
  { label: "노랑", value: "노랑", code: "#FACC15", border: false },
  { label: "주황", value: "주황", code: "#FB923C", border: false },
  { label: "분홍", value: "분홍", code: "#F472B6", border: false },
  { label: "빨강", value: "빨강", code: "#EF4444", border: false },
  { label: "갈색", value: "갈색", code: "#78350F", border: false },
  { label: "연두", value: "연두", code: "#A3E635", border: false },
  { label: "초록", value: "초록", code: "#16A34A", border: false },
  { label: "청록", value: "청록", code: "#14B8A6", border: false },
  { label: "파랑", value: "파랑", code: "#2563EB", border: false },
  { label: "남색", value: "남색", code: "#1E3A8A", border: false },
  { label: "보라", value: "보라", code: "#7C3AED", border: false },
  { label: "회색", value: "회색", code: "#9CA3AF", border: false },
  { label: "검정", value: "검정", code: "#1F2937", border: false },
  { label: "투명", value: "투명", code: "transparent", border: true },
];
const CATEGORIES = [
  { label: "전체", value: "" },
  { label: "해열/진통/소염", value: "01140" },
  { label: "항생제", value: "06100" },
  { label: "감기약", value: "01140" },
  { label: "소화제", value: "02330" },
  { label: "혈압약", value: "02140" },
  { label: "당뇨약", value: "03960" },
  { label: "항히스타민", value: "01410" },
];
const PAGE_SIZE = 20;

interface SearchSectionProps {
  externalFilters?: SearchFilters | null;
  onInputClick?: () => void;
}

const SearchSection: React.FC<SearchSectionProps> = ({
  externalFilters,
  onInputClick,
}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    keyword: "",
    shape: "",
    color: "",
    printFront: "",
    printBack: "",
    entpName: "",
    classNo: "",
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [results, setResults] = useState<Pill[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(1);
  
  // ✅ [수정] 정렬 상태 추가 (기본값: popular)
  const [sortType, setSortType] = useState("popular");

  const [selectedPill, setSelectedPill] = useState<Pill | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const handleInputChange = (key: keyof SearchFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  async function handleCardClick(itemSeq: string) {
    try {
      setDetailLoading(true);
      setDetailError(null);
      const pillDetail = await getPillDetail(itemSeq);
      setSelectedPill(pillDetail);
    } catch (err) {
      console.error(err);
      setDetailError("상세 정보를 불러오지 못했습니다.");
    } finally {
      setDetailLoading(false);
    }
  }

  const handleLike = async (e: React.MouseEvent, pill: Pill) => {
    e.stopPropagation();
    const token = localStorage.getItem("token");
    if (!token) return alert("로그인이 필요합니다.");

    try {
      const newStatus = await togglePillLike(pill.item_seq);
      setResults((prev) =>
        prev.map((p) =>
          p.item_seq === pill.item_seq ? { ...p, is_liked: newStatus } : p
        )
      );
    } catch (err) {
      alert("오류가 발생했습니다.");
    }
  };

  const fetchPills = async (targetPage: number, currentFilters = filters) => {
    const hasCondition = Object.values(currentFilters).some(
      (val) => val && val.trim() !== ""
    );
    if (!hasCondition) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      // ✅ [수정] sortType을 API로 전송
      const searchParams = { ...currentFilters, sort: sortType };
      
      // 만약 SearchFilters 타입 에러가 나면 'as any'를 사용
      const res = await searchPills(searchParams as any, targetPage, PAGE_SIZE);
      
      setResults(res.items);
      setTotal(res.total);
      setPage(targetPage);
      
      if (currentFilters !== filters) {
        setTimeout(() => {
          const section = document.getElementById("search-results-area");
          if (section) section.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } catch (err) {
      setError("검색 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const searchWithExternalParams = (params: SearchFilters) => {
    const newFilters = { ...filters, ...params };
    fetchPills(1, newFilters);
  };

  // ✅ [수정] 정렬 기준 변경 감지 (문법 오류 수정됨)
  useEffect(() => {
    if (searched) {
      fetchPills(1, filters);
    }
  }, [sortType]);

  // ✅ [수정] 외부 필터 감지 (문법 오류 수정됨)
  useEffect(() => {
    if (externalFilters) {
      setFilters((prev) => ({ ...prev, ...externalFilters }));
      if (externalFilters.color || externalFilters.printFront)
        setShowAdvanced(true);
      searchWithExternalParams(externalFilters);
    }
  }, [externalFilters]);


  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    fetchPills(1, filters);
  };

  const handlePageChange = (newPage: number) => {
    const totalPages = Math.ceil(total / PAGE_SIZE);
    if (newPage < 1 || newPage > totalPages) return;
    fetchPills(newPage, filters);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFilters = () => {
    setFilters({
      keyword: "",
      shape: "",
      color: "",
      printFront: "",
      printBack: "",
      entpName: "",
      classNo: "",
    });
    setSearched(false);
    setResults([]);
    setTotal(0);
    setPage(1);
    setError(null);
  };

  const renderPagination = () => {
    const totalPages = Math.ceil(total / PAGE_SIZE);
    if (totalPages <= 1) return null;
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages)
      startPage = Math.max(1, endPage - maxVisiblePages + 1);

    pages.push(
      <button
        key="first"
        onClick={() => handlePageChange(1)}
        disabled={page === 1}
        className="p-2 rounded-lg hover:bg-sage/10 disabled:opacity-30 transition-colors text-charcoal"
      >
        <ChevronsLeft size={20} />
      </button>
    );
    pages.push(
      <button
        key="prev"
        onClick={() => handlePageChange(page - 1)}
        disabled={page === 1}
        className="p-2 rounded-lg hover:bg-sage/10 disabled:opacity-30 transition-colors text-charcoal mr-2"
      >
        <ChevronLeft size={20} />
      </button>
    );
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
            page === i
              ? "bg-olive-primary text-white shadow-md transform scale-105"
              : "text-charcoal hover:bg-sage/20 bg-white border border-sage/20"
          }`}
        >
          {i}
        </button>
      );
    }
    pages.push(
      <button
        key="next"
        onClick={() => handlePageChange(page + 1)}
        disabled={page === totalPages}
        className="p-2 rounded-lg hover:bg-sage/10 disabled:opacity-30 transition-colors text-charcoal ml-2"
      >
        <ChevronRight size={20} />
      </button>
    );
    pages.push(
      <button
        key="last"
        onClick={() => handlePageChange(totalPages)}
        disabled={page === totalPages}
        className="p-2 rounded-lg hover:bg-sage/10 disabled:opacity-30 transition-colors text-charcoal"
      >
        <ChevronsRight size={20} />
      </button>
    );
    return (
      <div className="flex justify-center items-center gap-1 mt-12 mb-8 animate-fade-in-up">
        {pages}
      </div>
    );
  };

  return (
    <section
      id="search-section"
      className="w-full max-w-5xl mx-auto px-4 py-8 md:py-12 relative"
    >
      {/* 상세 정보 로딩 중 오버레이 */}
      {detailLoading && (
        <div className="fixed inset-0 z-[60] bg-black/20 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-olive-primary" size={32} />
            <span className="text-charcoal font-bold">
              약 정보를 불러오는 중...
            </span>
          </div>
        </div>
      )}

      <div className="text-center mb-8 animate-fade-in-up">
        <h2 className="text-3xl md:text-4xl font-bold text-charcoal mb-3">
          스마트 약 검색
        </h2>
        <p className="text-sage text-lg">
          약의 이름, 모양, 색상, 식별문자로 정확하게 찾아보세요.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-lg border border-sage/20 overflow-hidden mb-12 animate-fade-in-up">
        <div className="p-6 pb-2">
          <form onSubmit={handleSearchSubmit} className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-6 w-6 text-sage group-focus-within:text-olive-primary transition-colors" />
            </div>
            <input
              type="text"
              placeholder="약 이름 (예: 타이레놀, 게보린)"
              value={filters.keyword}
              onClick={onInputClick}
              onChange={(e) => handleInputChange("keyword", e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-cream border-2 border-transparent focus:bg-white focus:border-olive-primary rounded-xl text-lg placeholder:text-gray-400 focus:outline-none transition-all"
            />
          </form>
        </div>

        <div className="px-6 flex justify-between items-center">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm font-medium text-sage hover:text-olive-primary transition-colors py-2"
          >
            <Filter size={16} />
            <span>상세 필터 {showAdvanced ? "접기" : "펼치기"}</span>
            {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {(filters.shape ||
            filters.color ||
            filters.entpName ||
            filters.printFront ||
            filters.classNo) && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm text-coral-dark hover:text-coral-primary underline decoration-1 underline-offset-2"
            >
              초기화
            </button>
          )}
        </div>

        <div
          className={`overflow-hidden transition-all duration-500 ease-in-out ${
            showAdvanced ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="p-6 pt-2 space-y-6 border-t border-sage/10 mt-2">
            <div>
              <label className="block text-sm font-bold text-charcoal mb-3">
                모양
              </label>
              <div className="flex flex-wrap gap-2">
                {SHAPES.map((shape) => (
                  <button
                    key={shape.value}
                    type="button"
                    onClick={() =>
                      handleInputChange(
                        "shape",
                        filters.shape === shape.value ? "" : shape.value
                      )
                    }
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all border ${
                      filters.shape === shape.value
                        ? "bg-olive-primary text-white border-olive-primary shadow-md"
                        : "bg-white text-charcoal border-sage/30 hover:border-olive-primary hover:text-olive-primary"
                    }`}
                  >
                    {shape.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-charcoal mb-3">
                색상
              </label>
              <div className="flex flex-wrap gap-3">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() =>
                      handleInputChange(
                        "color",
                        filters.color === c.value ? "" : c.value
                      )
                    }
                    className={`relative w-8 h-8 rounded-full shadow-sm transition-transform hover:scale-110 focus:outline-none ${
                      c.border ? "border border-gray-200" : ""
                    }`}
                    style={{ backgroundColor: c.code }}
                    title={c.label}
                  >
                    {filters.color === c.value && (
                      <>
                        <span className="absolute inset-0 flex items-center justify-center">
                          <Check
                            size={16}
                            className={
                              c.label === "하양" ||
                              c.label === "투명" ||
                              c.label === "노랑"
                                ? "text-charcoal"
                                : "text-white"
                            }
                          />
                        </span>
                        <span className="absolute -inset-1 rounded-full border-2 border-olive-primary" />
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-charcoal mb-2">
                  식별 문자
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="앞면"
                    value={filters.printFront}
                    onChange={(e) =>
                      handleInputChange("printFront", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-cream border border-sage/30 rounded-lg focus:outline-none focus:border-olive-primary text-sm"
                  />
                  <input
                    type="text"
                    placeholder="뒷면"
                    value={filters.printBack}
                    onChange={(e) =>
                      handleInputChange("printBack", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-cream border border-sage/30 rounded-lg focus:outline-none focus:border-olive-primary text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-charcoal mb-2">
                  제약회사
                </label>
                <input
                  type="text"
                  placeholder="예: 종근당, 한미약품"
                  value={filters.entpName}
                  onChange={(e) =>
                    handleInputChange("entpName", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-cream border border-sage/30 rounded-lg focus:outline-none focus:border-olive-primary text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-charcoal mb-3">
                효능 분류
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.label}
                    type="button"
                    onClick={() =>
                      handleInputChange(
                        "classNo",
                        filters.classNo === cat.value && cat.value !== ""
                          ? ""
                          : cat.value
                      )
                    }
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      filters.classNo === cat.value
                        ? "bg-sage text-white"
                        : "bg-cream text-charcoal/70 hover:bg-sage/20"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-cream/50 border-t border-sage/10 flex justify-center">
          <button
            onClick={() => handleSearchSubmit()}
            disabled={loading}
            className="w-full md:w-auto md:px-12 py-3 bg-olive-primary hover:bg-olive-dark text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>검색 중...</>
            ) : (
              <>
                <Search size={20} />
                검색하기
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 animate-fade-in-up border border-red-100">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}
      {detailError && (
        <div className="max-w-2xl mx-auto mb-4 p-3 bg-yellow-50 text-yellow-700 rounded-xl flex items-center gap-2 text-sm border border-yellow-100">
          <AlertCircle size={18} />
          <span>{detailError}</span>
        </div>
      )}

      {!loading && searched && !error && (
        <div
          id="search-results-area"
          className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-up"
        >
          <p className="text-charcoal font-medium">
            검색 결과{" "}
            <span className="text-olive-primary font-bold">{total}</span>건
            <span className="text-sage text-sm ml-2 font-normal">
              (총 {Math.ceil(total / PAGE_SIZE)} 페이지 중 {page} 페이지)
            </span>
          </p>

          {/* ✅ [수정] 정렬 드롭다운 UI 추가 */}
          <div className="relative inline-flex group self-end sm:self-auto">
            <select
              value={sortType}
              onChange={(e) => setSortType(e.target.value)}
              className="appearance-none bg-white border border-sage/30 text-charcoal py-2 pl-4 pr-10 rounded-lg text-sm font-medium shadow-sm hover:border-olive-primary focus:outline-none focus:ring-2 focus:ring-olive-primary/20 transition-all cursor-pointer"
            >
              <option value="popular">인기순</option>
              <option value="recent">최신순</option>
              <option value="name">가나다순</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-sage group-hover:text-olive-primary transition-colors">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((pill, index) => (
          <div
            key={pill.item_seq}
            onClick={() => handleCardClick(pill.item_seq)}
            className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-sage/10 flex flex-col animate-fade-in-up cursor-pointer relative"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <button
              onClick={(e) => handleLike(e, pill)}
              className="absolute top-3 right-3 z-20 p-2 bg-white/80 rounded-full shadow-sm hover:bg-white transition-all backdrop-blur-sm"
            >
              <Heart
                size={20}
                className={
                  pill.is_liked
                    ? "fill-rose-500 text-rose-500"
                    : "text-gray-400"
                }
              />
            </button>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
              <span className="bg-white/90 text-charcoal px-4 py-2 rounded-full text-sm font-bold shadow-sm flex items-center gap-2 backdrop-blur-sm transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                <MousePointerClick size={16} /> 자세히 보기
              </span>
            </div>
            <div className="relative aspect-[4/3] bg-cream overflow-hidden">
              {pill.item_image ? (
                <img
                  src={pill.item_image}
                  alt={pill.item_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-sage/50 bg-warmWhite">
                  <PillIcon size={48} strokeWidth={1.5} />
                  <span className="text-sm mt-2 font-medium">이미지 없음</span>
                </div>
              )}
            </div>
            <div className="p-5 flex flex-col flex-1">
              <div className="mb-auto">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-olive-dark bg-olive-primary/10 px-2 py-1 rounded">
                    {pill.entp_name}
                  </span>
                  {pill.drug_shape && (
                    <span className="text-xs text-sage border border-sage/30 px-1.5 py-0.5 rounded-full">
                      {pill.drug_shape}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-charcoal leading-snug mb-3 line-clamp-2 group-hover:text-olive-primary transition-colors">
                  {pill.item_name}
                </h3>
                <div className="space-y-1.5 mb-4 text-sm text-charcoal/80 bg-cream/50 p-3 rounded-lg">
                  {pill.color_class1 && (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full border border-gray-200"
                        style={{
                          backgroundColor: getColorCode(pill.color_class1),
                        }}
                      ></div>
                      <span>
                        {pill.color_class1}
                        {pill.color_class2 ? ` / ${pill.color_class2}` : ""}
                      </span>
                    </div>
                  )}
                  {(pill.print_front || pill.print_back) && (
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 text-sage text-xs uppercase tracking-wider mt-0.5 font-bold">
                        식별
                      </span>
                      <span className="font-mono text-charcoal/90 text-xs">
                        {pill.print_front || "-"} | {pill.print_back || "-"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!loading && total > 0 && renderPagination()}

      {selectedPill && (
        <PillDetailModal
          pill={selectedPill}
          onClose={() => {
            setSelectedPill(null);
            setDetailError(null);
          }}
        />
      )}
    </section>
  );
};

const getColorCode = (colorName: string): string => {
  const found = COLORS.find((c) => colorName.includes(c.value));
  return found ? found.code : "#eee";
};

export default SearchSection;