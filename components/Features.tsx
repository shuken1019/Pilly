import React from 'react';
import { Scan, FileText, Bell, Shield, Heart, MessageCircle } from 'lucide-react'; // Users 대신 MessageCircle 추가

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
    icon: <MessageCircle size={28} />, // 아이콘 변경
    title: "AI 건강 상담 챗봇", // 제목 변경
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

const Features: React.FC = () => {
  return (
    <section id="features" className="py-24 px-6 bg-white relative">
      <div className="max-w-7xl mx-auto">
        {/* 섹션 헤더 */}
        <div className="text-center mb-16">
          <span className="text-olive-primary font-bold tracking-wider uppercase text-sm">Our Features</span>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-charcoal mt-2 mb-6 tracking-tight">
            스마트한 건강 관리의 시작
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto break-keep">
            Pilly만의 독자적인 기술로 여러분의 건강한 일상을 지켜드립니다.
          </p>
        </div>

        {/* 그리드 카드 영역 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div 
              key={idx}
              className="group p-8 rounded-[32px] bg-warmWhite border border-gray-100 hover:border-olive-primary/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-2xl bg-olive-primary/10 text-olive-primary flex items-center justify-center mb-6 group-hover:bg-olive-primary group-hover:text-white transition-colors duration-300">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold text-charcoal mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-500 leading-relaxed text-sm lg:text-base break-keep">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;