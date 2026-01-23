import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import heic2any from "heic2any"; // ✅ 라이브러리 import
import {
  Camera,
  Upload,
  X,
  Loader2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ChevronRight,
  RotateCcw,
  ZoomIn,
  Heart,
} from "lucide-react";
import { Pill, togglePillLike } from "../backend/services/api";
import PillDetailModal from "./PillDetailModal";

interface AnalyzedItem {
  detected_info: {
    print: string;
    color: string;
    shape?: string;
  };
  pill_info: Pill | null;
}

interface AiSearchSectionProps {
  onAnalysisComplete?: (data: any) => void;
}

const AiSearchSection: React.FC<AiSearchSectionProps> = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ✅ [추가] 변환 중 상태 (HEIC -> JPG 변환 시간 동안 로딩 표시)
  const [isConverting, setIsConverting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<AnalyzedItem[] | null>(
    null
  );
  const [selectedPill, setSelectedPill] = useState<Pill | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // 1. 파일 선택 및 HEIC 변환 로직
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    let selected = acceptedFiles[0];
    if (!selected) return;

    setError(null);
    setAnalysisResults(null);

    // 🍏 아이폰 HEIC 파일인지 확인
    if (
      selected.name.toLowerCase().endsWith(".heic") ||
      selected.type === "image/heic"
    ) {
      setIsConverting(true); // 변환 시작 알림
      try {
        // HEIC -> JPEG 변환
        const convertedBlob = await heic2any({
          blob: selected,
          toType: "image/jpeg",
          quality: 0.8,
        });

        // 결과가 배열일 수도 있고 단일 Blob일 수도 있음
        const finalBlob = Array.isArray(convertedBlob)
          ? convertedBlob[0]
          : convertedBlob;

        // 새로운 File 객체 생성 (확장자 .jpg로 변경)
        selected = new File(
          [finalBlob],
          selected.name.replace(/\.heic$/i, ".jpg"),
          { type: "image/jpeg" }
        );
      } catch (err) {
        console.error("HEIC 변환 실패:", err);
        setError("사진 변환에 실패했습니다. JPG로 다시 시도해주세요.");
        setIsConverting(false);
        return;
      }
      setIsConverting(false); // 변환 완료
    }

    setFile(selected);
  }, []);

  // 2. 미리보기 생성
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  // 3. Dropzone 설정 (heic 허용 추가)
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png, .heic, .HEIC, .heic, .HEIC": [".png"],
      "image/heic": [".heic"], // ✅ HEIC 허용
    },
    multiple: false,
    disabled: isConverting || loading,
  });

  const resetAll = () => {
    setFile(null);
    setPreview(null);
    setAnalysisResults(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("token");
      const headers: any = { "Content-Type": "multipart/form-data" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await axios.post(
        "http://13.124.212.174:8000/api/pills/analyze",
        formData,
        { headers }
      );

      if (response.data.success) {
        setAnalysisResults(response.data.results);
      } else {
        setError("분석에 실패했습니다. 약이 잘 보이게 다시 찍어주세요.");
      }
    } catch (err) {
      console.error(err);
      setError("서버 연결에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (e: React.MouseEvent, pill: Pill) => {
    e.stopPropagation();
    const token = localStorage.getItem("token");
    if (!token) return alert("로그인이 필요합니다.");

    try {
      const newStatus = await togglePillLike(pill.item_seq);
      setAnalysisResults((prev) => {
        if (!prev) return null;
        return prev.map((item) => {
          if (item.pill_info?.item_seq === pill.item_seq) {
            return {
              ...item,
              pill_info: { ...item.pill_info, is_liked: newStatus },
            };
          }
          return item;
        });
      });
    } catch (err) {
      console.error(err);
      alert("오류가 발생했습니다.");
    }
  };

  return (
    <section className="w-full max-w-4xl mx-auto px-4 py-12 relative">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-charcoal mb-3 flex items-center justify-center gap-2">
          <Camera className="text-olive-primary" />
          AI 약 사진 인식
        </h2>
        <p className="text-sage">
          약을 여러 개 찍어도 괜찮아요. AI가 각각 분석해서 알려드립니다.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-sage/20 overflow-hidden min-h-[400px]">
        {/* === A. 결과 화면 === */}
        {analysisResults ? (
          <div className="p-8 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-charcoal">
                분석 결과{" "}
                <span className="text-olive-primary">
                  {analysisResults.length}
                </span>
                개를 찾았습니다
              </h3>
              <button
                onClick={resetAll}
                className="flex items-center gap-2 text-sage hover:text-charcoal transition-colors font-medium"
              >
                <RotateCcw size={18} /> 다른 사진 찍기
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 mb-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                  {preview && (
                    <img
                      src={preview}
                      alt="Original"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  AI가 위 사진에서 알약들을 찾아내어 아래 목록을 만들었습니다.
                </p>
              </div>

              {analysisResults.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() =>
                    item.pill_info && setSelectedPill(item.pill_info)
                  }
                  className={`relative p-5 rounded-2xl border transition-all duration-300 flex gap-4 items-start ${
                    item.pill_info
                      ? "border-sage/30 bg-white hover:border-olive-primary hover:shadow-lg cursor-pointer group"
                      : "border-gray-200 bg-gray-50 cursor-default"
                  }`}
                >
                  {/* 약 이미지 썸네일 */}
                  <div
                    className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100 relative group/img cursor-zoom-in"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item.pill_info?.item_image) {
                        setZoomedImage(item.pill_info.item_image);
                      }
                    }}
                  >
                    {item.pill_info?.item_image ? (
                      <>
                        <img
                          src={item.pill_info.item_image}
                          alt="Pill"
                          className="w-full h-full object-cover transition-transform group-hover/img:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                          <ZoomIn className="text-white" size={20} />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <HelpCircle size={24} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          item.pill_info
                            ? "bg-olive-primary/10 text-olive-dark"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        AI 감지: {item.detected_info.print || "?"} /{" "}
                        {item.detected_info.color}{" "}
                        {item.detected_info.shape
                          ? ` / ${item.detected_info.shape}`
                          : ""}
                      </span>
                    </div>

                    {item.pill_info ? (
                      <>
                        <h4 className="text-lg font-bold text-charcoal truncate mb-1 group-hover:text-olive-primary transition-colors">
                          {item.pill_info.item_name}
                        </h4>
                        <p className="text-sm text-sage truncate">
                          {item.pill_info.entp_name}
                        </p>
                        <div className="mt-2 text-xs text-olive-primary font-bold flex items-center gap-1">
                          상세보기 <ChevronRight size={12} />
                        </div>
                      </>
                    ) : (
                      <>
                        <h4 className="text-lg font-bold text-gray-400 mb-1">
                          정보를 찾을 수 없음
                        </h4>
                        <p className="text-xs text-gray-400">
                          식별문자나 색상이 불분명하여 매칭 실패
                        </p>
                      </>
                    )}
                  </div>

                  <div className="absolute top-4 right-4">
                    {item.pill_info ? (
                      <button
                        onClick={(e) => handleLike(e, item.pill_info!)}
                        className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <Heart
                          size={24}
                          className={
                            item.pill_info.is_liked
                              ? "fill-rose-500 text-rose-500"
                              : "text-gray-300"
                          }
                        />
                      </button>
                    ) : (
                      <AlertCircle className="text-gray-300" size={20} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* === B. 업로드 화면 === */
          <div className="p-8">
            {!file && !isConverting ? (
              <div
                {...getRootProps()}
                className={`border-3 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-4 group ${
                  isDragActive
                    ? "border-olive-primary bg-olive-primary/5"
                    : "border-sage/30 hover:border-olive-primary hover:bg-cream"
                }`}
              >
                <input {...getInputProps()} />
                <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Upload className="text-sage group-hover:text-olive-primary w-8 h-8" />
                </div>
                <div>
                  <p className="text-lg font-bold text-charcoal mb-1">
                    여기를 클릭하거나 사진을 드래그하세요
                  </p>
                  <p className="text-sm text-sage">
                    JPG, PNG, HEIC(아이폰) 지원
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start animate-fade-in-up">
                <div className="relative w-full md:w-1/2 aspect-[4/3] rounded-2xl overflow-hidden shadow-md border border-sage/20 group bg-gray-50 flex items-center justify-center">
                  {/* 변환 중일 때 로딩 표시 */}
                  {isConverting ? (
                    <div className="flex flex-col items-center text-olive-primary">
                      <Loader2 className="animate-spin mb-2 w-8 h-8" />
                      <span className="text-sm font-medium">
                        아이폰 사진 변환 중...
                      </span>
                    </div>
                  ) : preview ? (
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Loader2 className="animate-spin text-gray-400" />
                  )}

                  {!isConverting && (
                    <button
                      onClick={resetAll}
                      className="absolute top-3 right-3 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors backdrop-blur-sm"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>

                <div className="w-full md:w-1/2 flex flex-col justify-center h-full py-4">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-charcoal mb-2">
                      {isConverting
                        ? "사진을 처리하고 있습니다"
                        : "사진이 준비되었습니다!"}
                    </h3>
                    <p className="text-sage text-sm mb-4">
                      {isConverting
                        ? "고화질 사진을 변환 중입니다. 잠시만 기다려주세요."
                        : "여러 개의 약을 한 번에 찍으셔도 됩니다.\n아래 버튼을 눌러 분석을 시작하세요."}
                    </p>
                    {error && (
                      <div className="flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-lg text-sm mb-4 border border-red-100">
                        <AlertCircle size={16} /> {error}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleAnalyze}
                    disabled={loading || isConverting}
                    className="w-full py-4 bg-olive-primary hover:bg-olive-dark text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" /> AI가 분석
                        중입니다...
                      </>
                    ) : (
                      <>
                        <Sparkles /> AI로 분석하기
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedPill && (
        <PillDetailModal
          pill={selectedPill}
          onClose={() => setSelectedPill(null)}
        />
      )}

      {zoomedImage && (
        <div
          className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4 cursor-pointer animate-fade-in"
          onClick={() => setZoomedImage(null)}
        >
          <button
            className="absolute top-6 right-6 text-white/70 hover:text-white p-2 transition-colors"
            onClick={() => setZoomedImage(null)}
          >
            <X size={36} />
          </button>
          <img
            src={zoomedImage}
            alt="Zoomed Pill"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
};

export default AiSearchSection;
