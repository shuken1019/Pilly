import React, { useState } from 'react';
import { ViewState } from '../types';
import { X, Eye, EyeOff } from 'lucide-react';

interface AuthModalProps {
  view: ViewState;
  onClose: () => void;
  onChangeView: (view: ViewState) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ view, onClose, onChangeView }) => {
  const [showPassword, setShowPassword] = useState(false);
  
  if (view !== ViewState.LOGIN && view !== ViewState.SIGNUP) return null;

  const isLogin = view === ViewState.LOGIN;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-fade-in-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-charcoal">
          <X size={24} />
        </button>

        <div className="text-center mb-8">
          <div className="inline-block p-3 rounded-full bg-olive-primary/10 text-olive-primary mb-4 text-3xl">
            💊
          </div>
          <h2 className="text-2xl font-bold text-charcoal">{isLogin ? '환영합니다!' : '계정 만들기'}</h2>
          <p className="text-gray-500 mt-2">
            {isLogin ? 'Pilly 계정으로 로그인하세요' : '간편하게 가입하고 건강을 관리하세요'}
          </p>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          {!isLogin && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">이름</label>
              <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-olive-primary focus:ring-2 focus:ring-olive-primary/20 outline-none transition-all" placeholder="홍길동" />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">이메일</label>
            <input type="email" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-olive-primary focus:ring-2 focus:ring-olive-primary/20 outline-none transition-all" placeholder="example@email.com" />
          </div>

          <div className="relative">
            <label className="block text-sm font-bold text-gray-700 mb-1">비밀번호</label>
            <input 
              type={showPassword ? "text" : "password"}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-olive-primary focus:ring-2 focus:ring-olive-primary/20 outline-none transition-all" 
              placeholder="••••••••" 
            />
            <button 
              type="button"
              className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button className="w-full bg-olive-primary text-white py-4 rounded-xl font-bold hover:bg-olive-dark transition-colors shadow-lg shadow-olive-primary/20 mt-6">
            {isLogin ? '로그인' : '가입하기'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-gray-500 text-sm">
            {isLogin ? '아직 계정이 없으신가요?' : '이미 계정이 있으신가요?'} 
            <button 
              className="ml-2 text-olive-primary font-bold hover:underline"
              onClick={() => onChangeView(isLogin ? ViewState.SIGNUP : ViewState.LOGIN)}
            >
              {isLogin ? '회원가입' : '로그인'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;