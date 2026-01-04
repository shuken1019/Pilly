import React, { useState } from "react";
import { Camera, Search, ArrowUpRight, Plus, ChevronRight, Zap, Activity, MessageSquare } from "lucide-react";

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
    <div className="h-screen bg-[#FDFDFD] text-[#4A6D55] font-sans selection:bg-[#4A6D55] selection:text-white overflow-hidden relative flex flex-col pt-20 lg:pt-24">
      
      {/* 1. 배경 가이드 라인 */}
      <div className="absolute inset-0 grid grid-cols-4 lg:grid-cols-12 pointer-events-none opacity-[0.02]">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="border-r border-black h-full" />
        ))}
      </div>

      <div className="max-w-[1400px] mx-auto w-full px-6 relative z-10 flex-1 flex flex-col justify-center transform scale-[0.85] lg:scale-[0.9] origin-center">
        
        {/* --- 섹션 1: 헤드라인 --- */}
        <div className="mb-6 relative flex flex-col lg:flex-row items-end justify-between gap-4">
          <div className="flex-1 animate-fade-in">
            <h1 className="text-[9vw] lg:text-[7.5rem] font-black leading-[0.8] tracking-tighter uppercase">
              Pill <br />
              <span className="flex items-center gap-4 lg:gap-6">
                <span className="font-extralight italic tracking-tight opacity-70">Intelligence</span>
                <div 
                  className="w-14 h-14 lg:w-20 lg:h-20 rounded-full bg-[#4A6D55] flex items-center justify-center -rotate-12 hover:rotate-0 transition-all duration-500 cursor-pointer shadow-lg"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  <Plus size={isHovered ? 40 : 32} className="text-white transition-all" strokeWidth={3} />
                </div>
              </span>
            </h1>
          </div>
          
          
        </div>

        {/* --- 섹션 2: 벤토 그리드 --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* A. 사진 분석 카드 (8칸) */}
          <div className="lg:col-span-8 bg-[#4A6D55] rounded-[32px] p-8 lg:p-10 relative overflow-hidden group shadow-xl">
            <div className="relative z-10 h-full flex flex-col justify-between min-h-[200px] lg:min-h-[240px]">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 text-white text-[9px] font-black uppercase mb-4 tracking-widest border border-white/10 backdrop-blur-md">
                  <Zap size={12} fill="currentColor" /> Live Analysis
                </div>
                <h2 className="text-3xl lg:text-5xl font-bold text-white leading-tight tracking-tighter">
                  이름 모를 약,<br /> 사진으로 <span className="text-white/60">스캔</span>하세요
                </h2>
              </div>
              <div className="flex gap-3 relative z-20">
                <button onClick={onAiSearchClick} className="px-8 py-3 bg-white text-[#4A6D55] rounded-2xl font-black text-lg hover:bg-[#f0f0f0] transition-all">
                  분석 시작
                </button>
                
              </div>
            </div>
            <div className="absolute top-1/2 right-10 -translate-y-1/2 flex justify-center items-center pointer-events-none">
                <div className="w-32 h-32 lg:w-40 lg:h-40 bg-[#FAFAFA]/10 rounded-full flex items-center justify-center relative overflow-hidden border border-white/10 group-hover:scale-105 transition-all duration-700">
                   <div className="w-16 h-8 bg-[#FFB38E] rounded-full rotate-45 shadow-md z-10 opacity-70" />
                   <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent h-full w-full animate-scan" />
                </div>
            </div>
          </div>

          {/* B. 스마트 검색 카드 (4칸) */}
          <div onClick={onSearchClick} className="lg:col-span-4 bg-white rounded-[32px] p-8 flex flex-col justify-between group hover:bg-[#F9F9F9] transition-all cursor-pointer border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="p-2.5 bg-[#F8F8F6] rounded-xl text-[#4A6D55]"><Search size={20} /></div>
              <ArrowUpRight size={20} className="text-gray-300" />
            </div>
            <div>
              <h3 className="text-xl font-black mb-1 tracking-tighter text-gray-800">스마트 검색</h3>
              <p className="text-gray-400 text-xs leading-relaxed">모양, 색상, 각인 정보로 찾기</p>
            </div>
          </div>

          {/* C. AI 건강 상담 카드 (4칸) */}
          <div onClick={onChatOpen} className="lg:col-span-4 bg-[#1A1C1A] text-white p-8 rounded-[32px] flex flex-col justify-between overflow-hidden relative group cursor-pointer shadow-lg">
            <div className="relative z-10">
               <h3 className="text-xl font-black mb-1 tracking-tighter">AI 건강 상담</h3>
               <p className="text-white/40 text-[10px]">24시간 대기 중인 AI 약사</p>
            </div>
            <div className="relative z-10 flex justify-end">
               <button onClick={(e) => { e.stopPropagation(); onChatOpen(); }} className="bg-white text-black px-4 py-2 rounded-full font-black text-[9px] hover:scale-105 transition-transform">
                 상담 시작
               </button>
            </div>
            <Activity size={180} className="absolute -right-16 -bottom-16 opacity-5 text-white" />
          </div>

          {/* ✅ D. Pilly Insights / 커뮤니티 연동 카드 (8칸) - 여기가 수정됨! */}
          <div 
            onClick={onCommunityClick}
            className="lg:col-span-8 bg-white p-8 rounded-[32px] flex items-center gap-8 border border-gray-100 shadow-sm group cursor-pointer hover:border-[#4A6D55]/30 transition-all"
          >
            <div className="w-24 h-24 rounded-2xl bg-gray-100 overflow-hidden flex-shrink-0 relative shadow-inner">
               <img src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=200&auto=format&fit=crop" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="pill" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-black mb-1 tracking-tighter text-[#4A6D55]">Community</h3>
              <p className="text-gray-400 text-xs font-medium leading-relaxed">
                12만 사용자가 검증한 가장 안전한 영양제 조합 정보.
              </p>
              <div className="mt-3 flex items-center gap-2 text-[10px] font-black uppercase text-[#4A6D55]">
                커뮤니티에서 더보기 <ChevronRight size={14} />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 하단 티커 */}
      <div className="py-6 flex justify-between items-center px-10 border-t border-gray-100 font-mono text-[8px] font-bold text-gray-300 uppercase tracking-[0.4em] relative z-10 bg-white">
        <span>© 2026 Pilly Intelligence</span>
        <span className="hidden md:block">Technology meets Wellness</span>
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