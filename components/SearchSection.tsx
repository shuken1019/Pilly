import React, { useState } from 'react';
import { Search, Type, Shapes, Loader2, ImageOff } from 'lucide-react';
import { searchPills } from '../services/api';
import { SearchResult } from '../types';

const SearchSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'name' | 'mark' | 'visual'>('name');
  
  // 상태 관리
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // 검색 핸들러
  const handleSearch = async () => {
    if (!keyword.trim()) return;
    
    setLoading(true);
    setHasSearched(true);
    try {
      const data = await searchPills(keyword);
      setResults(data);
    } catch (error) {
      console.error("Search failed", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <section className="py-24 px-6 bg-gradient-to-b from-warmWhite to-cream">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-12">
          <span className="bg-olive-primary/10 text-olive-dark font-bold px-4 py-1.5 rounded-full text-sm mb-4 inline-block">
            FastAPI 연동됨
          </span>
          <h2 className="text-4xl font-extrabold text-charcoal mb-4">어떤 약을 찾고 계신가요?</h2>
          <p className="text-gray-500 text-lg">약 이름, 모양, 식별 문자로 정확하게 찾아보세요.</p>
        </div>

        <div className="bg-white p-2 rounded-[32px] shadow-xl shadow-gray-200/50 border border-gray-100">
          {/* Tabs */}
          <div className="flex gap-2 p-2 bg-gray-50 rounded-[24px] mb-8">
            <button
              onClick={() => { setActiveTab('name'); setResults([]); setHasSearched(false); setKeyword(''); }}
              className={`flex-1 py-3 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === 'name' ? 'bg-white text-charcoal shadow-md' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Type size={18} /> 이름 검색
            </button>
            <button
              onClick={() => { setActiveTab('mark'); setResults([]); setHasSearched(false); }}
              className={`flex-1 py-3 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === 'mark' ? 'bg-white text-charcoal shadow-md' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Search size={18} /> 식별문자
            </button>
            <button
              onClick={() => { setActiveTab('visual'); setResults([]); setHasSearched(false); }}
              className={`flex-1 py-3 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === 'visual' ? 'bg-white text-charcoal shadow-md' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Shapes size={18} /> 모양 검색
            </button>
          </div>

          {/* Content Area */}
          <div className="px-6 pb-8">
            {activeTab === 'name' && (
              <div className="animate-fade-in-up">
                <div className="relative flex items-center">
                  <Search className="absolute left-4 text-gray-400" size={24} />
                  <input 
                    type="text" 
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="약 이름을 입력하세요 (예: 타이레놀)" 
                    className="w-full pl-12 pr-28 py-4 bg-gray-50 border-2 border-transparent focus:border-olive-primary focus:bg-white rounded-2xl outline-none transition-all font-medium text-lg placeholder:text-gray-400"
                  />
                  <div className="absolute right-2 flex gap-2">
                    <button 
                      onClick={handleSearch}
                      disabled={loading || !keyword.trim()}
                      className="bg-olive-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-olive-dark transition-colors flex items-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : '검색'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'mark' && (
              <div className="animate-fade-in-up py-12 text-center text-gray-400">
                <div className="inline-block p-4 bg-gray-50 rounded-full mb-4">
                  <Search size={32} className="opacity-50" />
                </div>
                <p>식별문자 검색 API가 준비 중입니다.</p>
              </div>
            )}
            
            {activeTab === 'visual' && (
              <div className="animate-fade-in-up py-12 text-center text-gray-400">
                <div className="inline-block p-4 bg-gray-50 rounded-full mb-4">
                  <Shapes size={32} className="opacity-50" />
                </div>
                <p>모양/색상 검색 API가 준비 중입니다.</p>
              </div>
            )}
          </div>
        </div>

        {/* Search Results */}
        {hasSearched && !loading && (
          <div className="mt-12 text-left animate-fade-in-up max-w-5xl mx-auto">
            <h3 className="text-xl font-bold text-charcoal mb-6 flex items-center gap-2">
              검색 결과 <span className="bg-olive-primary text-white px-2.5 py-0.5 rounded-full text-sm">{results.length}</span>
            </h3>
            
            {results.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {results.map((item, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 hover:shadow-lg hover:border-olive-primary/30 transition-all duration-300">
                    {/* 이미지 영역 */}
                    <div className="w-full md:w-32 h-32 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 flex items-center justify-center">
                      {item.item_image ? (
                        <img 
                          src={item.item_image} 
                          alt={item.item_name} 
                          className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`flex flex-col items-center justify-center text-gray-300 ${item.item_image ? 'hidden' : ''}`}>
                         <ImageOff size={24} className="mb-1" />
                         <span className="text-xs">이미지 없음</span>
                      </div>
                    </div>

                    {/* 정보 영역 */}
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 mb-2">
                        <div>
                            <span className="text-xs font-bold text-olive-primary bg-olive-primary/10 px-2 py-1 rounded-md mb-2 inline-block">
                                {item.entp_name}
                            </span>
                            <h4 className="text-xl font-bold text-charcoal leading-tight">{item.item_name}</h4>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-3">
                         {item.drug_shape && (
                            <span className="px-3 py-1 bg-gray-50 rounded-lg text-sm text-gray-600 border border-gray-100 flex items-center gap-1">
                                💊 {item.drug_shape}
                            </span>
                         )}
                         {(item.color_class1 || item.color_class2) && (
                             <span className="px-3 py-1 bg-gray-50 rounded-lg text-sm text-gray-600 border border-gray-100 flex items-center gap-1">
                                🎨 {item.color_class1} {item.color_class2 && `& ${item.color_class2}`}
                             </span>
                         )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                        <div className="text-sm">
                            <span className="text-gray-400 block text-xs mb-0.5">앞면 각인</span>
                            <span className="font-medium text-charcoal">{item.print_front || '-'}</span>
                        </div>
                        <div className="text-sm">
                            <span className="text-gray-400 block text-xs mb-0.5">뒷면 각인</span>
                            <span className="font-medium text-charcoal">{item.print_back || '-'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-16 rounded-2xl border border-gray-100 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                    <Search size={32} />
                </div>
                <p className="text-lg font-bold text-charcoal mb-1">검색 결과가 없습니다</p>
                <p className="text-gray-500">다른 키워드로 검색해보세요.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default SearchSection;