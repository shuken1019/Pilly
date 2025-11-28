import React from 'react';
import { Scan, FileText, Bell, Users, Shield, Heart } from 'lucide-react';

const features = [
  {
    icon: <Scan size={32} />,
    title: "AI 기반 약 인식",
    desc: "최신 AI 기술로 약의 모양, 색상, 각인을 분석하여 정확한 약 정보를 제공합니다."
  },
  {
    icon: <FileText size={32} />,
    title: "상세한 정보 제공",
    desc: "성분, 효능, 복용법, 주의사항 등 필요한 모든 정보를 쉽게 이해할 수 있도록 제공합니다."
  },
  {
    icon: <Bell size={32} />,
    title: "복약 알림",
    desc: "복약 시간을 설정하면 정확한 시간에 알림을 보내드립니다. (출시 예정)"
  },
  {
    icon: <Users size={32} />,
    title: "가족 공유",
    desc: "가족 구성원의 복약 정보를 함께 관리하고 공유할 수 있습니다. (출시 예정)"
  },
  {
    icon: <Shield size={32} />,
    title: "안전한 보안",
    desc: "모든 개인정보는 암호화되어 안전하게 보호됩니다."
  },
  {
    icon: <Heart size={32} />,
    title: "무료 서비스",
    desc: "기본 약 검색 기능은 완전 무료로 제공됩니다."
  }
];

const Features: React.FC = () => {
  return (
    <section id="features" className="py-24 px-6 bg-white relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl lg:text-5xl font-extrabold text-charcoal mb-4 tracking-tight">Pilly의 주요 기능</h2>
          <p className="text-xl text-gray-500">안전하고 정확한 약 정보를 제공합니다</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div 
              key={idx}
              className="group p-8 rounded-[32px] bg-warmWhite border border-gray-100 hover:border-olive-primary/30 hover:shadow-2xl hover:shadow-olive-primary/10 hover:-translate-y-2 transition-all duration-300"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-olive-light to-sage text-white flex items-center justify-center mb-6 shadow-lg shadow-olive-primary/20 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold text-charcoal mb-3">{feature.title}</h3>
              <p className="text-gray-500 leading-relaxed">
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