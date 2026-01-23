import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { MessageCircle, X, Send, Bot, CornerDownRight } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

// ✅ 1. Props 타입 정의 (부모로부터 상태를 전달받음)
interface ChatBotProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const API_BASE = "http://13.124.212.174:8000";

// --- 약 이름 링크 렌더링 헬퍼 함수들 (기존 로직 유지) ---
const EXAMPLE_PATTERN = /([A-Za-z가-힣0-9·\-\s]+)\(\s*예\s*:\s*([^)]+)\)/g;
const PAREN_PATTERN = /([A-Za-z가-힣0-9·\-\s]+?)\s*\(([^)]+)\)/g;

function splitDrugNames(raw: string) {
  return raw.split(/[,/·]| 및 | 또는 /g).map((x) => x.trim()).filter(Boolean);
}

function renderWithDrugLink(text: string, onDrugClick: (drugName: string) => void) {
  const nodes: React.ReactNode[] = [];
  let i = 0;
  const pushText = (s: string) => { if (s) nodes.push(s); };

  while (i < text.length) {
    const rest = text.slice(i);
    const mEx = EXAMPLE_PATTERN.exec(rest);
    EXAMPLE_PATTERN.lastIndex = 0;
    const mPa = PAREN_PATTERN.exec(rest);
    PAREN_PATTERN.lastIndex = 0;

    const candidates: Array<{ idx: number; type: "ex" | "pa"; m: RegExpExecArray; }> = [];
    if (mEx) candidates.push({ idx: mEx.index, type: "ex", m: mEx });
    if (mPa) candidates.push({ idx: mPa.index, type: "pa", m: mPa });

    if (candidates.length === 0) {
      pushText(rest);
      break;
    }

    candidates.sort((a, b) => a.idx - b.idx);
    const picked = candidates[0];
    pushText(rest.slice(0, picked.idx));

    if (picked.type === "ex") {
      const full = picked.m[0];
      const ingredient = picked.m[1];
      const examplesRaw = picked.m[2];
      const exampleNames = splitDrugNames(examplesRaw);
      pushText(`${ingredient}(예: `);
      exampleNames.forEach((name, idx2) => {
        nodes.push(
          <span key={`ex-${i}-${name}-${idx2}`} className="underline cursor-pointer text-olive-dark font-semibold hover:text-olive-primary" onClick={() => onDrugClick(name)}>
            {name}
          </span>
        );
        if (idx2 < exampleNames.length - 1) pushText(", ");
      });
      pushText(")");
      i += picked.idx + full.length;
      continue;
    }

    const full = picked.m[0];
    const drugName = picked.m[1].trim();
    const idx = full.indexOf(drugName);
    const before = idx > 0 ? full.slice(0, idx) : "";
    const after = idx >= 0 ? full.slice(idx + drugName.length) : "";
    pushText(before);
    nodes.push(
      <span key={`pa-${i}-${drugName}`} className="underline cursor-pointer text-olive-dark font-semibold hover:text-olive-primary" onClick={() => onDrugClick(drugName)}>
        {drugName}
      </span>
    );
    pushText(after);
    i += picked.idx + full.length;
  }
  return nodes;
}

// ✅ 2. 메인 컴포넌트: Props를 인자로 받음
export default function ChatBot({ isOpen, setIsOpen }: ChatBotProps) {
  // 🗑️ 내부 state인 const [isOpen, setIsOpen] = useState(false); 는 삭제되었습니다.

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

  const onDrugClick = async (drugName: string) => {
    window.dispatchEvent(new CustomEvent("pilly:go-search", { detail: { keyword: drugName } }));
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* 채팅창 몸체 */}
      {isOpen && (
        <div className="w-[350px] h-[550px] bg-white rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-gray-100 flex flex-col mb-4 overflow-hidden animate-fade-in-up">
          {/* 헤더 */}
          <div className="bg-[#4A6D55] p-5 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <Bot size={22} />
              <span className="font-bold">AI 약사 상담</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition">
              <X size={20} />
            </button>
          </div>

          {/* 메시지 영역 */}
          <div className="flex-1 overflow-y-auto p-5 bg-[#FDFCF9] space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] p-4 rounded-[20px] text-sm leading-relaxed shadow-sm ${
                  msg.role === "user" ? "bg-[#4A6D55] text-white rounded-tr-none" : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
                }`}>
                  {msg.role === "assistant" ? renderWithDrugLink(msg.content, onDrugClick) : msg.content}
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

          {/* 입력창 */}
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

      {/* 플로팅 버튼 (열기/닫기 토글) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-[#4A6D55] hover:bg-[#3a5643] text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
      >
        {isOpen ? <X size={30} /> : <MessageCircle size={30} />}
      </button>
    </div>
  );
}