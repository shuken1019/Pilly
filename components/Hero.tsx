import React, { useState } from "react";
import { Search, ArrowUpRight, Plus, ChevronRight, Zap, Activity } from "lucide-react";

interface HeroProps {
  onAiSearchClick: () => void;
  onSearchClick: () => void;
  onCommunityClick: () => void;
  onChatOpen: () => void;
}

const Hero: React.FC<HeroProps> = ({ 
  onAiSearchClick, 
  onSearchClick, 
  onCommunityClick, 
  onChatOpen 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    // ✅ [수정 1] 모바일에서는 높이를 'auto'로 풀고, 바닥 여백(pb-32)을 줘서 채팅버튼에 안 가리게 함
    <div className="min-h-screen bg-[#FDFDFD] text-[#4A6D55] font-sans overflow-x-hidden relative flex flex-col pt-24 pb-32 lg:pb-0 lg:pt-24 lg:h-screen lg:overflow-hidden">
      
      {/* 배경 가이드 라인 (모바일엔 너무 복잡해서 숨김 or 연하게) */}
      <div className="absolute inset-0 grid grid-cols-4 lg:grid-cols-12 pointer-events-none opacity-[0.02]">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="border-r border-black h-full" />
        ))}
      </div>

      {/* ✅ [수정 2] 억지 스케일(scale) 제거하고, max-width로 중앙 정렬 */}
      <div className="w-full max-w-[1400px] mx-auto px-5 lg:px-6 relative z-10 flex-1 flex flex-col justify-center">
        
        {/* --- 섹션 1: 헤드라인 (모바일 폰트 사이즈 최적화) --- */}
        <div className="mb-8 lg:mb-6 relative flex flex-col lg:flex-row items-start lg:items-end justify-between gap-4">
          <div className="flex-1 animate-fade-in w-full">
            <h1 className="text-[13vw] lg:text-[7.5rem] font-black leading-[0.9] tracking-tighter uppercase text-left">
              Pill <br />
              <span className="flex items-center gap-2 lg:gap-6 flex-wrap">
                <span className="font-extralight italic tracking-tight opacity-70">Intelligence</span>
                <div 
                  className="w-10 h-10 lg:w-20 lg:h-20 rounded-full bg-[#4A6D55] flex items-center justify-center -rotate-12 shadow-lg"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  <Plus size={isHovered ? 30 : 20} className="text-white lg:w-10 lg:h-10 transition-all" strokeWidth={3} />
                </div>
              </span>
            </h1>
          </div>
        </div>

        {/* --- 섹션 2: 벤토 그리드 (모바일: 1열 / 데스크탑: 12열) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 w-full">
          
          {/* A. 사진 분석 카드 (모바일에서도 넉넉하게 보임) */}
          <div className="lg:col-span-8 bg-[#4A6D55] rounded-[24px] lg:rounded-[32px] p-6 lg:p-10 relative overflow-hidden group shadow-xl min-h-[220px]">
            <div className="relative z-10 h-full flex flex-col justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-[10px] font-black uppercase mb-3 tracking-widest border border-white/10 backdrop-blur-md">
                  <Zap size={12} fill="currentColor" /> Live Analysis
                </div>
                <h2 className="text-2xl lg:text-5xl font-bold text-white leading-tight tracking-tighter">
                  이름 모를 약,<br /> 사진으로 <span className="text-white/60">스캔</span>하세요
                </h2>
              </div>
              <div className="flex gap-3 relative z-20">
                <button onClick={onAiSearchClick} className="w-full lg:w-auto px-6 py-3 bg-white text-[#4A6D55] rounded-xl lg:rounded-2xl font-black text-sm lg:text-lg hover:bg-[#f0f0f0] transition-all shadow-md active:scale-95">
                  분석 시작
                </button>
              </div>
            </div>
            {/* 장식용 원 (위치 조정) */}
            <div className="absolute -right-6 -bottom-6 lg:top-1/2 lg:right-10 lg:-translate-y-1/2 flex justify-center items-center pointer-events-none opacity-50 lg:opacity-100">
                <div className="w-32 h-32 lg:w-40 lg:h-40 bg-[#FAFAFA]/10 rounded-full flex items-center justify-center relative overflow-hidden border border-white/10">
                   <div className="w-16 h-8 bg-[#FFB38E] rounded-full rotate-45 shadow-md z-10 opacity-70" />
                   <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent h-full w-full animate-scan" />
                </div>
            </div>
          </div>

          {/* B. 스마트 검색 카드 */}
          <div onClick={onSearchClick} className="lg:col-span-4 bg-white rounded-[24px] lg:rounded-[32px] p-6 lg:p-8 flex flex-col justify-between gap-4 group hover:bg-[#F9F9F9] transition-all cursor-pointer border border-gray-100 shadow-sm min-h-[160px] active:scale-[0.98]">
            <div className="flex justify-between items-start">
              <div className="p-2.5 bg-[#F8F8F6] rounded-xl text-[#4A6D55]"><Search size={20} /></div>
              <ArrowUpRight size={20} className="text-gray-300" />
            </div>
            <div>
              <h3 className="text-xl font-black mb-1 tracking-tighter text-gray-800">스마트 검색</h3>
              <p className="text-gray-400 text-xs leading-relaxed">모양, 색상, 각인 정보로 찾기</p>
            </div>
          </div>

          {/* C. AI 건강 상담 카드 */}
          <div onClick={onChatOpen} className="lg:col-span-4 bg-[#1A1C1A] text-white p-6 lg:p-8 rounded-[24px] lg:rounded-[32px] flex flex-col justify-between gap-4 overflow-hidden relative group cursor-pointer shadow-lg min-h-[160px] active:scale-[0.98]">
            <div className="relative z-10">
               <h3 className="text-xl font-black mb-1 tracking-tighter">AI 건강 상담</h3>
               <p className="text-white/40 text-[10px]">24시간 대기 중인 AI 약사</p>
            </div>
            <div className="relative z-10 flex justify-end">
               <button onClick={(e) => { e.stopPropagation(); onChatOpen(); }} className="bg-white text-black px-4 py-2 rounded-full font-black text-[10px] hover:scale-105 transition-transform">
                 상담 시작
               </button>
            </div>
            <Activity size={120} className="absolute -right-8 -bottom-8 opacity-10 text-white" />
          </div>

          {/* D. 커뮤니티 카드 */}
          <div 
            onClick={onCommunityClick}
            className="lg:col-span-8 bg-white p-6 lg:p-8 rounded-[24px] lg:rounded-[32px] flex items-center gap-5 lg:gap-8 border border-gray-100 shadow-sm group cursor-pointer hover:border-[#4A6D55]/30 transition-all active:scale-[0.98]"
          >
            <div className="w-16 h-16 lg:w-24 lg:h-24 rounded-2xl bg-gray-100 overflow-hidden flex-shrink-0 relative shadow-inner">
               <img src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=200&auto=format&fit=crop" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="pill" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg lg:text-xl font-black mb-1 tracking-tighter text-[#4A6D55]">Community</h3>
              <p className="text-gray-400 text-xs font-medium leading-relaxed line-clamp-2">
                12만 사용자가 검증한 가장 안전한 영양제 조합 정보.
              </p>
              <div className="mt-3 flex items-center gap-2 text-[10px] font-black uppercase text-[#4A6D55]">
                더보기 <ChevronRight size={14} />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 하단 티커 (모바일에서 숨기거나 작게) */}
      <div className="hidden lg:flex py-6 justify-between items-center px-10 border-t border-gray-100 font-mono text-[8px] font-bold text-gray-300 uppercase tracking-[0.4em] relative z-10 bg-white mt-auto">
        <span>© 2026 Pilly Intelligence</span>
        <span>Technology meets Wellness</span>
        <span>Seoul, South Korea</span>
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(200%); }
        }
        .animate-scan { animation: scan 3s infinite linear; }
        .animate-fade-in { animation: fadeIn 1s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default Hero;