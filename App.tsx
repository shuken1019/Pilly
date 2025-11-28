import React, { useState } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Features from "./components/Features";
import SearchSection from "./components/SearchSection";
import Testimonials from "./components/Testimonials";
import Footer from "./components/Footer";
import ResultModal from "./components/ResultModal";
import AuthModal from "./components/AuthModal";
import { analyzePillImage } from "./services/geminiService";
import { ViewState, PillData } from "./types";

const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>(ViewState.HOME);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pillData, setPillData] = useState<PillData | null>(null);

  const handleImageUpload = async (file: File) => {
    setLoading(true);
    setModalOpen(true);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      try {
        const base64String = reader.result as string;
        const result = await analyzePillImage(base64String);
        setPillData(result);
      } catch (error) {
        console.error("Analysis failed", error);
        setPillData(null);
      } finally {
        setLoading(false);
      }
    };
  };

  const closeModal = () => {
    setModalOpen(false);
    setPillData(null);
  };

  return (
    <div className="min-h-screen bg-warmWhite flex flex-col">
      <Header setViewState={setViewState} currentView={viewState} />

      <main className="flex-grow">
        {viewState === ViewState.HOME && (
          <>
            <Hero onImageUpload={handleImageUpload} />
            <SearchSection />
            <Features />
            <Testimonials />

            {/* App Download Section */}
            <section className="py-24 px-6 bg-gradient-to-br from-coral-primary to-coral-light relative overflow-hidden text-white">
              <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-white/10 rounded-full blur-3xl"></div>
              <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12 relative z-10">
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-4xl lg:text-5xl font-extrabold mb-6">
                    지금 바로
                    <br />
                    다운로드하세요
                  </h2>
                  <p className="text-xl opacity-90 mb-8 leading-relaxed">
                    iOS와 Android 모두 지원하는 Pilly 앱으로
                    <br />
                    언제 어디서나 안전하게 약 정보를 확인하세요.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                    <button className="flex items-center gap-3 bg-white text-charcoal px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:-translate-y-1 transition-all">
                      <span className="text-2xl">🍎</span>
                      <div className="text-left leading-tight">
                        <div className="text-xs">Download on the</div>
                        <div className="text-lg">App Store</div>
                      </div>
                    </button>
                    <button className="flex items-center gap-3 bg-white text-charcoal px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:-translate-y-1 transition-all">
                      <span className="text-2xl">🤖</span>
                      <div className="text-left leading-tight">
                        <div className="text-xs">GET IT ON</div>
                        <div className="text-lg">Google Play</div>
                      </div>
                    </button>
                  </div>
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="w-64 h-64 bg-white rounded-3xl flex items-center justify-center text-charcoal shadow-2xl transform rotate-6 hover:rotate-0 transition-all duration-500">
                    <div className="text-center">
                      <div className="text-8xl mb-2">📱</div>
                      <p className="font-bold text-gray-500">QR CODE</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {viewState === ViewState.SEARCH && (
          <div className="pt-20 min-h-screen">
            <SearchSection />
          </div>
        )}
      </main>

      <Footer />

      <ResultModal
        isOpen={modalOpen}
        onClose={closeModal}
        data={pillData}
        isLoading={loading}
      />

      <AuthModal
        view={viewState}
        onClose={() => setViewState(ViewState.HOME)}
        onChangeView={setViewState}
      />
    </div>
  );
};

export default App;
