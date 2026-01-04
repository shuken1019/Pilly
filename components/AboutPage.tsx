import React from "react";
import { Scan, FileText, Bell, MessageCircle, Shield, Heart, Sparkles } from "lucide-react";

const features = [
  {
    icon: <Scan size={28} />,
    title: "AI 기반 약 인식",
    desc: "사진 한 장이면 충분합니다. 고도화된 AI가 약의 모양, 색상, 식별 문자를 분석해 정확한 정보를 찾아드립니다."
  },
  {
    icon: <FileText size={28} />,
    title: "상세한 정보 제공",
    desc: "어려운 의학 용어 대신, 누구나 이해하기 쉬운 성분, 효능, 부작용 정보를 제공하여 안전한 복용을 돕습니다."
  },
  {
    icon: <Bell size={28} />,
    title: "스마트 복약 알림",
    desc: "바쁜 일상 속에서도 약 챙기는 시간을 놓치지 않도록, 정확한 시간에 알림을 보내드립니다. (출시 예정)"
  },
  {
    icon: <MessageCircle size={28} />,
    title: "AI 건강 상담 챗봇",
    desc: "어디가 아프신가요? GPT 기반의 똑똑한 AI에게 증상을 말하면 예상 질환을 분석해주고, 적절한 약 정보를 실시간으로 상담해 드립니다."
  },
  {
    icon: <Shield size={28} />,
    title: "철저한 보안",
    desc: "사용자의 모든 개인 건강 정보는 강력하게 암호화되어 안전하게 보호되니 안심하고 사용하세요."
  },
  {
    icon: <Heart size={28} />,
    title: "무료 서비스",
    desc: "국민 건강 증진을 위해, 핵심 기능인 AI 약 검색 및 정보 확인 서비스는 평생 무료로 제공됩니다."
  }
];

const AboutPage: React.FC = () => {
  return (
    <div className="pt-32 pb-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* 상단 헤더 섹션 */}
        <div className="text-center mb-20 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-olive-primary/10 text-olive-primary mb-6">
            <Sparkles size={16} fill="currentColor" />
            <span className="text-xs font-bold uppercase tracking-wider">Our Vision</span>
          </div>
          <h2 className="text-4xl lg:text-6xl font-black text-charcoal mb-6 tracking-tight">
            스마트한 건강 관리의 시작
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto break-keep leading-relaxed">
            Pilly는 복잡하고 어려운 의약품 정보를 누구나 쉽게 이해할 수 있도록 <br className="hidden md:block" />
            AI 기술을 통해 혁신적인 헬스케어 경험을 제공합니다.
          </p>
        </div>

        {/* 그리드 카드 영역 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div 
              key={idx}
              className="group p-10 rounded-[40px] bg-warmWhite border border-gray-100 hover:border-olive-primary/20 hover:shadow-2xl transition-all duration-500"
            >
              <div className="w-14 h-14 rounded-2xl bg-white text-olive-primary flex items-center justify-center mb-8 shadow-sm group-hover:bg-olive-primary group-hover:text-white transition-all duration-300">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold text-charcoal mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-500 leading-relaxed break-keep">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>

        {/* 하단 브랜드 철학 섹션 (선택 사항) */}
        <div className="mt-32 p-12 rounded-[50px] bg-charcoal text-white overflow-hidden relative">
            <div className="relative z-10">
                <h3 className="text-3xl font-bold mb-6">Pilly가 꿈꾸는 세상</h3>
                <p className="text-gray-400 text-lg max-w-2xl leading-relaxed break-keep">
                    우리는 기술이 사람의 건강을 지키는 가장 따뜻한 도구가 되어야 한다고 믿습니다. 
                    정확한 정보가 없어 발생하는 약물 오남용을 막고, 
                    전 국민이 스스로의 건강을 주도적으로 관리할 수 있는 세상을 만들어갑니다.
                </p>
            </div>
            <div className="absolute -right-20 -bottom-20 opacity-10">
                <Scan size={300} />
            </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;