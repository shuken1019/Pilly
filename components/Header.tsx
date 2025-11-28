import React, { useState, useEffect } from 'react';
import { ViewState } from '../types';
import { Pill, Menu, X } from 'lucide-react';

interface HeaderProps {
  setViewState: (view: ViewState) => void;
  currentView: ViewState;
}

const Header: React.FC<HeaderProps> = ({ setViewState, currentView }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (view: ViewState) => {
    setViewState(view);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        {/* Logo */}
        <button 
          onClick={() => handleNavClick(ViewState.HOME)}
          className="flex items-center gap-3 group"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-olive-primary to-sage rounded-xl flex items-center justify-center text-white shadow-lg group-hover:rotate-[-10deg] transition-transform duration-300">
            <Pill size={24} />
          </div>
          <span className="text-2xl font-bold text-olive-primary tracking-tight">Pilly</span>
        </button>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <button 
            onClick={() => handleNavClick(ViewState.HOME)}
            className="text-charcoal font-medium hover:text-olive-primary transition-colors"
          >
            About
          </button>
          <button 
            onClick={() => handleNavClick(ViewState.SEARCH)}
            className={`font-medium transition-colors hover:text-olive-primary ${currentView === ViewState.SEARCH ? 'text-olive-primary' : 'text-charcoal'}`}
          >
            약 검색
          </button>
          <button 
            onClick={() => handleNavClick(ViewState.HOME)}
            className="text-charcoal font-medium hover:text-olive-primary transition-colors"
          >
            AI 약 사진 인식
          </button>
          <a href="#features" className="text-charcoal font-medium hover:text-olive-primary transition-colors">기능</a>
        </div>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <button 
            onClick={() => handleNavClick(ViewState.LOGIN)}
            className="bg-gradient-to-br from-olive-primary to-sage text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-olive-primary/20 hover:shadow-olive-primary/40 hover:-translate-y-0.5 transition-all duration-300"
          >
            로그인
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden text-charcoal"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-100 p-6 flex flex-col gap-4 shadow-lg animate-fade-in-up">
          <button onClick={() => handleNavClick(ViewState.HOME)} className="text-left font-medium py-2">About</button>
          <button onClick={() => handleNavClick(ViewState.SEARCH)} className="text-left font-medium py-2">약 검색</button>
          <button onClick={() => handleNavClick(ViewState.HOME)} className="text-left font-medium py-2">AI 약 사진 인식</button>
          <a href="#features" className="text-left font-medium py-2" onClick={() => setIsMobileMenuOpen(false)}>기능</a>
          <button 
            onClick={() => handleNavClick(ViewState.LOGIN)}
            className="bg-olive-primary text-white py-3 rounded-lg font-semibold mt-2"
          >
            로그인
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;