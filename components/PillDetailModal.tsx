// src/components/PillDetailModal.tsx
import React from "react";
import {
  X,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Info,
  Pill as PillIcon,
  CheckCircle2,
  AlertOctagon,
} from "lucide-react";
import { Pill } from "../services/api";

interface PillDetailModalProps {
  pill: Pill;
  onClose: () => void;
}

// 🎨 섹션별 디자인을 위한 재사용 컴포넌트
const InfoSection = ({
  icon: Icon,
  title,
  content,
  colorClass, // "blue" | "green" | "amber" | "red" | "gray"
}: {
  icon: any;
  title: string;
  content: string;
  colorClass: string;
}) => {
  // 색상 매핑
  const colorMap: Record<string, any> = {
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      iconBg: "bg-blue-100",
      text: "text-blue-700",
      accent: "border-l-blue-500",
    },
    green: {
      bg: "bg-green-50",
      border: "border-green-200",
      iconBg: "bg-green-100",
      text: "text-green-700",
      accent: "border-l-green-500",
    },
    amber: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      iconBg: "bg-amber-100",
      text: "text-amber-700",
      accent: "border-l-amber-500",
    },
    red: {
      bg: "bg-red-50",
      border: "border-red-200",
      iconBg: "bg-red-100",
      text: "text-red-700",
      accent: "border-l-red-500",
    },
    gray: {
      bg: "bg-gray-50",
      border: "border-gray-200",
      iconBg: "bg-gray-100",
      text: "text-gray-700",
      accent: "border-l-gray-400",
    },
  };

  const theme = colorMap[colorClass] || colorMap.gray;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border ${theme.border} bg-white shadow-sm hover:shadow-md transition-shadow duration-300`}
    >
      {/* 왼쪽 포인트 컬러 바 */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 ${theme.accent}`}
      ></div>

      <div className="p-5 pl-7">
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`p-2 rounded-lg ${theme.iconBg} ${theme.text} flex-shrink-0`}
          >
            <Icon size={20} strokeWidth={2} />
          </div>
          <h3 className={`text-lg font-bold text-charcoal`}>{title}</h3>
        </div>
        <p className="text-gray-700 leading-7 text-[15px] whitespace-pre-line break-keep">
          {content}
        </p>
      </div>
    </div>
  );
};

const PillDetailModal: React.FC<PillDetailModalProps> = ({ pill, onClose }) => {
  // 데이터 가공
  const efficacy =
    pill.efcy_qesitm?.trim() ||
    "이 약의 상세 효능 정보가 아직 준비되지 않았어요.\n약 포장지 또는 약사와 상의해 주세요.";

  const usage =
    pill.use_method_qesitm?.trim() ||
    "복용 방법 정보가 부족합니다.\n처방전 또는 약사에게 안내를 꼭 받으세요.";

  const sideEffects =
    pill.se_qesitm?.trim() ||
    "이 약의 대표적인 부작용에 대한 상세 정보는\n약 포장지 또는 약사 안내문을 참고해 주세요.";

  const warningsMain =
    pill.atpn_warn_qesitm?.trim() ||
    "특별히 주의가 필요한 경우가 있을 수 있습니다.\n기존 질환, 복용 중인 약이 있다면 반드시 의료진과 상의하세요.";

  const warningsDetail =
    [pill.atpn_qesitm, pill.intrc_qesitm, pill.deposit_method_qesitm]
      .filter(Boolean)
      .join("\n\n")
      .trim() ||
    "보관 방법, 병용 금기 등 자세한 내용은 약 포장지의 설명서를 참고해 주세요.";

  const shapeTag = pill.drug_shape || "";
  const colorTag = [pill.color_class1, pill.color_class2]
    .filter(Boolean)
    .join(" / ");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      {/* 배경 클릭 시 닫기 */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* 모달 카드 */}
      <div className="relative z-10 w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* 1. 상단 헤더 (고정) */}
        <div className="relative bg-white px-6 py-5 border-b border-gray-100 flex-shrink-0 z-20">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="닫기"
          >
            <X size={24} />
          </button>

          <div className="flex gap-5 items-start pr-8">
            {/* 이미지 */}
            <div className="w-24 h-24 rounded-2xl border border-gray-100 overflow-hidden shadow-sm flex-shrink-0 bg-gray-50 flex items-center justify-center">
              {pill.item_image ? (
                <img
                  src={pill.item_image}
                  alt={pill.item_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <PillIcon size={40} className="text-gray-300" />
              )}
            </div>

            {/* 타이틀 정보 */}
            <div className="flex-1 min-w-0 pt-1">
              <span className="inline-block px-2 py-0.5 mb-2 rounded-md bg-gray-100 text-gray-600 text-xs font-bold tracking-tight">
                {pill.entp_name}
              </span>
              <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 leading-tight mb-2 break-keep">
                {pill.item_name}
              </h2>
              <div className="flex flex-wrap gap-2 text-xs font-medium">
                {shapeTag && (
                  <span className="flex items-center gap-1 text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                    {shapeTag}
                  </span>
                )}
                {colorTag && (
                  <span className="flex items-center gap-1 text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                    {colorTag}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2. 스크롤 가능한 본문 */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-5 space-y-4">
          {/* 효능 */}
          <InfoSection
            icon={ShieldCheck}
            title="어디에 좋은 약인가요?"
            content={efficacy}
            colorClass="blue"
          />

          {/* 용법 */}
          <InfoSection
            icon={Clock}
            title="어떻게 먹어야 하나요?"
            content={usage}
            colorClass="green"
          />

          {/* 부작용 */}
          <InfoSection
            icon={AlertOctagon}
            title="주요 부작용"
            content={sideEffects}
            colorClass="amber"
          />

          {/* 경고 및 주의사항 (가장 강조) */}
          <div className="rounded-xl border border-red-200 bg-red-50/80 p-5 shadow-sm">
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle className="text-red-600 shrink-0" size={24} />
              <h3 className="text-lg font-bold text-red-700">
                꼭 주의해주세요!
              </h3>
            </div>
            <div className="pl-9">
              <p className="text-red-800 font-semibold mb-3 leading-relaxed break-keep">
                {warningsMain}
              </p>
              <div className="h-px bg-red-200 my-3"></div>
              <p className="text-red-700/90 text-sm leading-relaxed whitespace-pre-line">
                {warningsDetail}
              </p>
            </div>
          </div>

          {/* 성분 안내 (심플하게) */}
          <div className="px-2 py-2 flex items-start gap-3 text-gray-500">
            <Info size={18} className="mt-0.5 shrink-0" />
            <p className="text-xs leading-5">
              성분 정보는 약 포장지 뒷면의 성분표 또는 약사가 제공한 안내문을
              참고해 주세요. 정확한 복약 지도는 의사 및 약사와 상담하시기
              바랍니다.
              <br />
              <span className="opacity-70 text-[10px]">
                출처: 식품의약품안전처 의약품안전나라
              </span>
            </p>
          </div>
        </div>

        {/* 3. 하단 고정 버튼 */}
        <div className="p-4 bg-white border-t border-gray-100 z-20">
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-lg transition-colors shadow-lg active:scale-[0.98] transform"
          >
            확인했습니다
          </button>
        </div>
      </div>
    </div>
  );
};

export default PillDetailModal;
