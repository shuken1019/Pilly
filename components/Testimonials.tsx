import React from 'react';
import { Star } from 'lucide-react';

const Testimonials: React.FC = () => {
  return (
    <section className="py-24 px-6 bg-cream">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-charcoal mb-4">사용자들의 이야기</h2>
          <p className="text-xl text-gray-500">Pilly로 건강을 지키는 사람들의 경험담</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              name: "김민지",
              role: "직장인, 30대",
              text: "병원에서 처방받은 약이 뭔지 궁금할 때마다 사용해요. 복잡한 의학 용어를 쉽게 풀어주니까 이해하기 정말 편해요.",
              char: "김"
            },
            {
              name: "박준호",
              role: "프리랜서, 40대",
              text: "AI 인식 속도가 정말 빨라요. 사진만 찍으면 바로 결과가 나오고, 주의사항까지 자세히 알려줘서 안심하고 복용합니다.",
              char: "박"
            },
            {
              name: "이서연",
              role: "주부, 50대",
              text: "부모님 약 관리하는데 정말 유용해요. 복약 알림 기능도 있어서 약 먹는 시간을 놓치지 않게 되었어요.",
              char: "이"
            }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:-translate-y-2 transition-transform duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-coral-primary to-coral-light flex items-center justify-center text-white text-xl font-bold shadow-md">
                  {item.char}
                </div>
                <div>
                  <h4 className="font-bold text-lg text-charcoal">{item.name}</h4>
                  <p className="text-sm text-gray-400">{item.role}</p>
                </div>
              </div>
              <div className="flex gap-1 mb-4 text-yellow-400">
                {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
              </div>
              <p className="text-gray-600 leading-relaxed">"{item.text}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;