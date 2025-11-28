import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer id="about" className="bg-charcoal text-white pt-20 pb-10 border-t border-white/10 mt-auto">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          
          {/* Section 1: Pilly */}
          <div className="col-span-1">
            <h4 className="font-bold text-xl mb-6 text-white border-b-2 border-olive-primary inline-block pb-2">Pilly</h4>
            <p className="text-gray-400 leading-relaxed mb-2">AI 기반 약 정보 검색 서비스</p>
            <p className="text-gray-400 leading-relaxed">안전하고 정확한 복약 관리의 시작</p>
          </div>
          
          {/* Section 2: Service */}
          <div>
            <h4 className="font-bold text-lg mb-6 text-white">서비스</h4>
            <ul className="space-y-3 text-gray-400">
              <li><a href="#features" className="hover:text-olive-light transition-colors">주요 기능</a></li>
              <li><a href="#how" className="hover:text-olive-light transition-colors">사용 방법</a></li>
              <li><a href="#" className="hover:text-olive-light transition-colors">FAQ</a></li>
            </ul>
          </div>

          {/* Section 3: Company */}
          <div>
            <h4 className="font-bold text-lg mb-6 text-white">회사</h4>
            <ul className="space-y-3 text-gray-400">
              <li><a href="#" className="hover:text-olive-light transition-colors">회사 소개</a></li>
              <li><a href="#" className="hover:text-olive-light transition-colors">팀 소개</a></li>
              <li><a href="#" className="hover:text-olive-light transition-colors">채용</a></li>
            </ul>
          </div>

          {/* Section 4: Support */}
          <div>
            <h4 className="font-bold text-lg mb-6 text-white">지원</h4>
            <ul className="space-y-3 text-gray-400">
              <li><a href="#" className="hover:text-olive-light transition-colors">고객센터</a></li>
              <li><a href="#" className="hover:text-olive-light transition-colors">개인정보처리방침</a></li>
              <li><a href="#" className="hover:text-olive-light transition-colors">이용약관</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 text-center text-gray-500 text-sm">
          &copy; 2025 Pilly. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;