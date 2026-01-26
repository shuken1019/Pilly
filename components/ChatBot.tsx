import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatBotProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

// ✅ [핵심] 포트 번호 없이 빈 문자열로 설정 (Nginx 중계 이용)
const API_BASE = "";

export default function ChatBot({ isOpen, setIsOpen }: ChatBotProps) {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "안녕하세요! 어디가 불편하신가요? 증상을 말씀해주시면 약을 추천해 드릴게요. 💊",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const recentMessages = [...messages, userMsg].slice(-6);
      const res = await axios.post(`${API_BASE}/api/chat`, { messages: recentMessages });
      
      const aiMsg: Message = { role: "assistant", content: res.data.reply };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", content: "죄송합니다. 잠시 후 다시 시도해주세요." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ✅ [수정완료] 약 이름 클릭 시 로그인 체크 -> 팝업 열기
  const onDrugClick = (drugName: string) => {
    // 1. 로컬 스토리지 확인
    const isLoggedIn = localStorage.getItem("token") || localStorage.getItem("accessToken");

    if (!isLoggedIn) {
      // 2. 로그인이 안 되어 있다면?
      const confirmLogin = window.confirm("자세한 약 정보를 보려면 로그인이 필요합니다.\n로그인 창을 여시겠습니까?");
      
      if (confirmLogin) {
        // ❌ 기존: navigate("/login"); -> 삭제함
        // ✅ 수정: 로그인 팝업 열기 이벤트 발송
        window.dispatchEvent(new CustomEvent("pilly:open-login"));
        setIsOpen(false); // 챗봇 창 닫기
      }
      return; // 여기서 중단 (검색 페이지로 안 넘어감)
    }

    // 3. 로그인이 되어 있다면? -> 검색 페이지로 이동
    console.log("약 검색 이동:", drugName);
    window.dispatchEvent(new CustomEvent("pilly:go-search", { detail: { keyword: drugName } }));
  };

  const renderMessageWithLinks = (text: string) => {
    const parts = text.split(/(\[\[.*?\]\])/g);

    return parts.map((part, index) => {
      if (part.startsWith("[[") && part.endsWith("]]")) {
        const keyword = part.slice(2, -2);
        return (
          <span
            key={index}
            onClick={() => onDrugClick(keyword)}
            className="text-olive-primary font-bold cursor-pointer hover:underline hover:bg-olive-primary/10 transition-colors px-1 rounded mx-0.5"
            title={`${keyword} 검색하기`}
          >
            {keyword}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
   <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      {isOpen && (
        <div className="w-[350px] h-[550px] bg-white rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-gray-100 flex flex-col mb-4 overflow-hidden animate-fade-in-up">
          <div className="bg-[#4A6D55] p-5 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <Bot size={22} />
              <span className="font-bold">AI 약사 상담</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 bg-[#FDFCF9] space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] p-4 rounded-[20px] text-sm leading-relaxed shadow-sm ${
                  msg.role === "user" ? "bg-[#4A6D55] text-white rounded-tr-none" : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
                }`}>
                  {msg.role === "assistant" ? renderMessageWithLinks(msg.content) : msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex gap-1">
                  <span className="w-1.5 h-1.5 bg-[#4A6D55]/40 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-[#4A6D55]/40 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-[#4A6D55]/40 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white border-t border-gray-50 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              placeholder="증상을 말씀해 주세요..."
              className="flex-1 px-5 py-3 bg-gray-50 rounded-full text-sm outline-none focus:ring-2 focus:ring-[#4A6D55]/20 transition-all"
            />
            <button onClick={handleSend} disabled={loading || !input.trim()} className="p-3 bg-[#4A6D55] text-white rounded-full hover:bg-[#3a5643] transition-all disabled:opacity-30">
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-[#4A6D55] hover:bg-[#3a5643] text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
      >
        {isOpen ? <X size={30} /> : <MessageCircle size={30} />}
      </button>
    </div>
  );
}