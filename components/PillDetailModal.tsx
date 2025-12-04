import React from "react";
import { X, ShieldCheck, Clock, AlertTriangle, Info } from "lucide-react";
import { Pill } from "../services/api";

interface PillDetailModalProps {
  pill: Pill;
  onClose: () => void;
}

const PillDetailModal: React.FC<PillDetailModalProps> = ({ pill, onClose }) => {
  // e약은요에서 온 값 + 없을 때 기본 문구
  const efficacy =
    pill.efcy_qesitm ??
    "이 약의 상세 효능 정보가 아직 준비되지 않았어요. 약 포장지 또는 약사와 상의해 주세요.";

  const usage =
    pill.use_method_qesitm ??
    "복용 방법 정보가 아직 준비되지 않았어요. 복용 전 약사 또는 의사와 상의해 주세요.";

  const warning =
    pill.atpn_warn_qesitm ??
    pill.atpn_qesitm ??
    "주의사항 정보가 아직 준비되지 않았어요. 이상 반응이 느껴지면 즉시 복용을 중단하고 의사와 상의하세요.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* 배경 (Backdrop) */}
      <div
        className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* 모달 컨텐츠 */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up">
        {/* 헤더 & 닫기 버튼 */}
        <div className="absolute top-0 right-0 p-4 z-10">
          <button
            onClick={onClose}
            className="p-2 bg-white/80 hover:bg-white rounded-full text-charcoal shadow-md transition-all hover:rotate-90"
          >
            <X size={24} />
          </button>
        </div>

        {/* 상단 이미지 및 기본 정보 */}
        <div className="bg-cream p-6 pb-8 text-center border-b border-sage/10">
          <div className="w-32 h-32 mx-auto bg-white rounded-full shadow-inner flex items-center justify-center overflow-hidden mb-4 border-4 border-white">
            {pill.item_image ? (
              <img
                src={pill.item_image}
                alt={pill.item_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sage text-xs">이미지 없음</span>
            )}
          </div>
          <span className="inline-block px-3 py-1 rounded-full bg-olive-primary/10 text-olive-dark text-xs font-bold mb-2">
            {pill.entp_name}
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-charcoal break-keep leading-snug">
            {pill.item_name}
          </h2>
          <div className="flex justify-center gap-2 mt-3 text-sm text-charcoal/60">
            {pill.drug_shape && <span>#{pill.drug_shape}</span>}
            {pill.color_class1 && <span>#{pill.color_class1}</span>}
          </div>
        </div>

        {/* 상세 내용 (스크롤 영역) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white">
          {/* 1. 효능/효과 */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold text-charcoal">
                어디에 좋은 약인가요?
              </h3>
            </div>
            <div className="pl-2 border-l-4 border-blue-100 ml-3">
              <p className="text-gray-700 leading-relaxed text-lg pl-4 whitespace-pre-line">
                {efficacy}
              </p>
            </div>
          </section>

          {/* 2. 용법/용량 */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                <Clock size={24} />
              </div>
              <h3 className="text-xl font-bold text-charcoal">
                어떻게 먹어야 하나요?
              </h3>
            </div>
            <div className="bg-green-50/50 p-5 rounded-2xl border border-green-100">
              <p className="text-gray-700 leading-relaxed font-medium whitespace-pre-line">
                {usage}
              </p>
            </div>
          </section>

          {/* 3. 성분 정보 – 지금은 구조화된 성분데이터가 없으니 안내만 */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-gray-50 text-gray-600 rounded-lg">
                <Info size={24} />
              </div>
              <h3 className="text-lg font-bold text-charcoal">포함된 성분</h3>
            </div>
            <p className="text-gray-600 text-sm whitespace-pre-line">
              성분 정보는 약 포장지의 성분표 또는 약사가 제공한 안내문을 참고해
              주세요.
            </p>
          </section>

          {/* 4. 주의사항 (가장 중요, 강조) */}
          <section className="bg-red-50 p-5 rounded-2xl border border-red-100">
            <div className="flex items-center gap-2 mb-3 text-red-600">
              <AlertTriangle size={24} />
              <h3 className="text-xl font-bold">꼭 주의해주세요!</h3>
            </div>
            <p className="text-charcoal/90 leading-relaxed whitespace-pre-line">
              {warning}
            </p>
          </section>
        </div>

        {/* 하단 버튼 (모바일 편의성) */}
        <div className="p-4 border-t border-gray-100 bg-white">
          <button
            onClick={onClose}
            className="w-full py-4 bg-charcoal text-white rounded-xl font-bold text-lg hover:bg-black transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default PillDetailModal;
