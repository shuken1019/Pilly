import React, { useRef } from 'react';
import { Camera, Search, UploadCloud } from 'lucide-react';

interface HeroProps {
  onImageUpload: (file: File) => void;
}

const Hero: React.FC<HeroProps> = ({ onImageUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  return (
    <section className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto min-h-screen flex flex-col lg:flex-row items-center gap-16 lg:gap-8">
       {/* Background Blobs */}
       <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-olive-primary/10 rounded-full blur-[100px] animate-blob"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-coral-primary/10 rounded-full blur-[80px] animate-blob animation-delay-2000"></div>
      </div>

      {/* Content */}
      <div className="flex-1 text-center lg:text-left animate-fade-in-up">
        <h1 className="text-5xl lg:text-7xl font-black text-charcoal leading-[1.15] mb-8 tracking-tight">
          약 정보,<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-olive-primary to-sage relative inline-block">
            사진 한 장
            <svg className="absolute w-full h-3 -bottom-1 left-0 text-coral-primary/30" viewBox="0 0 100 10" preserveAspectRatio="none">
               <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
            </svg>
          </span>으로<br />
          바로 확인하세요
        </h1>
        <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0">
          AI 기반 약 인식 기술로 성분, 효능, 주의사항까지<br />
          복잡한 의학 용어를 쉽게 풀어서 알려드립니다.
        </p>
        
        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="group relative bg-charcoal text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-charcoal/20 hover:scale-105 transition-all duration-300 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Camera size={24} />
              사진 업로드
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-olive-primary to-sage opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
          <a href="#how" className="px-8 py-4 rounded-2xl font-bold text-olive-dark border-2 border-olive-primary/20 hover:bg-olive-primary/5 hover:border-olive-primary transition-all text-lg">
            사용방법 보기
          </a>
        </div>
      </div>

      {/* Phone Mockup 3D Effect */}
      <div className="flex-1 relative perspective-1000 w-full max-w-md mx-auto lg:max-w-full">
        <div className="relative z-10 w-[300px] h-[600px] bg-white rounded-[40px] border-[8px] border-charcoal mx-auto shadow-2xl transform rotate-y-[-12deg] rotate-x-[10deg] hover:rotate-0 transition-transform duration-500 ease-out">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-charcoal rounded-b-xl z-20"></div>
          
          {/* Screen */}
          <div className="w-full h-full rounded-[32px] overflow-hidden bg-gradient-to-b from-cream to-warmWhite relative flex flex-col items-center justify-center p-6">
            
            <div className="relative mb-8 animate-float">
              <div className="w-32 h-32 bg-gradient-to-br from-coral-primary to-coral-light rounded-full flex items-center justify-center shadow-lg shadow-coral-primary/40 text-6xl">
                💊
              </div>
              <div className="absolute -inset-4 bg-coral-primary/20 rounded-full blur-xl -z-10 animate-pulse"></div>
            </div>

            <div className="text-center space-y-3 bg-white/80 backdrop-blur p-6 rounded-2xl shadow-sm w-full">
              <div className="h-2 w-20 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <h3 className="font-bold text-xl text-charcoal">타이레놀 정</h3>
              <p className="text-gray-500 text-sm">해열진통제 • 아세트아미노펜</p>
              <div className="flex justify-center gap-2 pt-2">
                 <span className="w-2 h-2 rounded-full bg-olive-primary"></span>
                 <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                 <span className="w-2 h-2 rounded-full bg-gray-300"></span>
              </div>
            </div>

             {/* Upload Zone Simulation */}
             <div className="mt-8 w-full h-32 border-2 border-dashed border-olive-primary/30 rounded-2xl flex flex-col items-center justify-center text-olive-primary bg-olive-primary/5">
                <UploadCloud size={32} className="mb-2 opacity-50" />
                <span className="text-xs font-medium">Drag & Drop</span>
             </div>

          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 right-10 lg:right-20 w-16 h-16 bg-gradient-to-br from-olive-light to-sage rounded-2xl shadow-xl flex items-center justify-center text-2xl animate-float" style={{ animationDelay: '1s' }}>🌿</div>
        <div className="absolute bottom-40 left-0 lg:left-10 w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center text-xl animate-float" style={{ animationDelay: '2s' }}>⚡</div>
      </div>
    </section>
  );
};

export default Hero;