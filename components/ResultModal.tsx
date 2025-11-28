import React from 'react';
import { PillData } from '../types';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface ResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PillData | null;
  isLoading: boolean;
}

const ResultModal: React.FC<ResultModalProps> = ({ isOpen, onClose, data, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl animate-fade-in-up">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-cream rounded-full hover:bg-sand transition-colors text-charcoal"
        >
          <X size={24} />
        </button>

        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 border-4 border-olive-primary border-t-transparent rounded-full animate-spin mb-6"></div>
            <h3 className="text-2xl font-bold text-charcoal mb-2">분석 중입니다...</h3>
            <p className="text-gray-500">AI가 약의 특징을 분석하고 있습니다.</p>
          </div>
        ) : data ? (
          <div className="p-8 md:p-10">
            <div className="border-b-2 border-cream pb-6 mb-8">
              <span className="inline-block bg-gradient-to-r from-coral-primary to-coral-light text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-md shadow-coral-primary/30 mb-4">
                {data.category}
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-charcoal">{data.name}</h2>
            </div>

            <div className="space-y-8">
              <div className="bg-warmWhite p-6 rounded-2xl border border-olive-primary/10">
                <h3 className="text-xl font-bold text-olive-primary flex items-center gap-2 mb-3">
                  <Info size={20} />
                  주요 성분
                </h3>
                <p className="text-gray-700 text-lg">{data.ingredients}</p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-olive-primary flex items-center gap-2 mb-3">
                  <CheckCircle size={20} />
                  효능 · 효과
                </h3>
                <ul className="grid gap-2">
                  {data.efficacy.map((effect, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-700">
                      <span className="w-1.5 h-1.5 bg-sage rounded-full mt-2.5" />
                      {effect}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-olive-primary mb-3">복용 방법</h3>
                <p className="text-gray-700 leading-relaxed bg-cream/50 p-4 rounded-xl">
                  {data.usage}
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-coral-dark flex items-center gap-2 mb-3">
                  <AlertTriangle size={20} />
                  주의사항
                </h3>
                <ul className="grid gap-2">
                  {data.precautions.map((warn, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-700">
                      <span className="w-1.5 h-1.5 bg-coral-primary rounded-full mt-2.5" />
                      {warn}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-xl">
                <strong className="text-orange-700 block mb-1">⚠️ 의료 전문가 상담 필요</strong>
                <p className="text-orange-600 text-sm">
                  이 정보는 AI 분석 결과이며 참고용입니다. 정확한 진단과 처방은 반드시 의사나 약사와 상담하시기 바랍니다.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            데이터를 불러오지 못했습니다. 다시 시도해주세요.
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultModal;