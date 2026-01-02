// src/components/Hero.tsx
import React from "react";
import { Camera, ChevronRight } from "lucide-react";

interface HeroProps {
  onImageUpload: (file: File) => void; // (인터페이스 유지를 위해 남겨둠)
  onScrollToAiSearch?: () => void; // ✅ 페이지 이동 함수 (App.tsx에서 전달받음)
}

const Hero: React.FC<HeroProps> = ({ onImageUpload, onScrollToAiSearch }) => {
  return (
    <section className="relative pt-20 pb-20 lg:pt-32 lg:pb-32 overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* 왼쪽 텍스트 영역 */}
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-4xl lg:text-6xl font-extrabold text-charcoal leading-tight mb-6">
              약 정보,
              <br />
              <span className="relative inline-block text-olive-primary">
                사진 한 장
                <span className="absolute bottom-2 left-0 w-full h-3 bg-sage/20 -z-10"></span>
              </span>
              으로
              <br />
              바로 확인하세요
            </h1>

            <p className="text-lg text-sage mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              AI 기반 약 인식 기술로 성분, 효능, 주의사항까지
              <br className="hidden lg:block" />
              복잡한 의학 용어를 쉽게 풀어서 알려드립니다.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              {/* ✅ [수정] 버튼 클릭 시 AI 페이지로 이동하도록 설정 */}
              <button
                onClick={onScrollToAiSearch}
                className="bg-charcoal text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-black hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
              >
                <Camera size={20} />
                사진 업로드
              </button>

              <button className="bg-white border border-gray-200 text-charcoal px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all">
                사용방법 보기
              </button>
            </div>
          </div>

          {/* 오른쪽 아이폰 이미지 영역 */}
          <div className="flex-1 relative w-full max-w-[400px] lg:max-w-none flex justify-center">
            {/* 배경 장식 */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-sage/20 to-olive-primary/20 rounded-full blur-3xl opacity-50 -z-10"></div>

            {/* 폰 프레임 이미지 (이미지 경로는 프로젝트에 맞게 확인 필요) */}
            <div className="relative z-10 animate-float">
              {/* 폰 이미지가 없다면 CSS로 폰 모양 흉내 */}
              <div className="w-[300px] h-[600px] bg-white border-8 border-charcoal rounded-[3rem] shadow-2xl overflow-hidden relative">
                {/* 노치 */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-charcoal rounded-b-xl z-20"></div>

                {/* 화면 내용 */}
                <div className="w-full h-full bg-cream flex flex-col items-center justify-center p-6 space-y-6">
                  <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center shadow-inner">
                    {/* 알약 아이콘 또는 이미지 */}
                    <div className="w-12 h-6 bg-gradient-to-r from-red-500 to-yellow-400 rounded-full shadow-md transform -rotate-45"></div>
                  </div>
                  <div className="text-center w-full bg-white p-4 rounded-2xl shadow-sm">
                    <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3"></div>
                    <h3 className="font-bold text-charcoal text-lg">
                      타이레놀 정
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      해열진통제 • 아세트아미노펜
                    </p>
                    <div className="flex justify-center gap-1 mt-3">
                      <div className="w-1.5 h-1.5 bg-olive-primary rounded-full"></div>
                      <div className="w-1.5 h-1.5 bg-gray-200 rounded-full"></div>
                      <div className="w-1.5 h-1.5 bg-gray-200 rounded-full"></div>
                    </div>
                  </div>

                  <div className="w-full h-24 border-2 border-dashed border-sage/30 rounded-xl flex flex-col items-center justify-center text-sage/50 bg-white/50">
                    <Camera size={24} className="mb-1 opacity-50" />
                    <span className="text-xs font-medium">Drag & Drop</span>
                  </div>
                </div>
              </div>

              {/* 플로팅 요소 (데코레이션) */}
              <div className="absolute top-20 -right-4 bg-olive-primary/80 backdrop-blur-sm p-3 rounded-2xl shadow-lg animate-bounce-slow">
                <span className="text-2xl">🌿</span>
              </div>
              <div className="absolute bottom-40 -left-8 bg-white p-3 rounded-2xl shadow-lg animate-bounce-delayed">
                <span className="text-2xl">⚡️</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
