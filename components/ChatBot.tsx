// src/components/ChatBot.tsx
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { MessageCircle, X, Send, Bot } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const API_BASE = "http://127.0.0.1:8000";

// ✅ 성분(예: 타이레놀, 부루펜) -> 괄호 안 예시 약이름만 링크
const EXAMPLE_PATTERN = /([A-Za-z가-힣0-9·\-\s]+)\(\s*예\s*:\s*([^)]+)\)/g;

// ✅ 약이름(무언가) -> 괄호 밖 "약이름"만 링크 (괄호 안 내용은 무시)
const PAREN_PATTERN = /([A-Za-z가-힣0-9·\-\s]+?)\s*\(([^)]+)\)/g;

function splitDrugNames(raw: string) {
  return raw
    .split(/[,/·]| 및 | 또는 /g)
    .map((x) => x.trim())
    .filter(Boolean);
}

/**
 * ✅ 약이름만 정확히 밑줄/클릭 되도록 렌더링
 * - 성분(예: 타이레놀) => "타이레놀"만 클릭
 * - 약이름(설명/성분/회사/기전 무엇이든) => "약이름"만 클릭
 */
function renderWithDrugLink(
  text: string,
  onDrugClick: (drugName: string) => void
) {
  const nodes: React.ReactNode[] = [];
  let i = 0;

  const pushText = (s: string) => {
    if (s) nodes.push(s);
  };

  while (i < text.length) {
    const rest = text.slice(i);

    const mEx = EXAMPLE_PATTERN.exec(rest);
    EXAMPLE_PATTERN.lastIndex = 0;

    const mPa = PAREN_PATTERN.exec(rest);
    PAREN_PATTERN.lastIndex = 0;

    const candidates: Array<{
      idx: number;
      type: "ex" | "pa";
      m: RegExpExecArray;
    }> = [];
    if (mEx) candidates.push({ idx: mEx.index, type: "ex", m: mEx });
    if (mPa) candidates.push({ idx: mPa.index, type: "pa", m: mPa });

    if (candidates.length === 0) {
      pushText(rest);
      break;
    }

    candidates.sort((a, b) => a.idx - b.idx);
    const picked = candidates[0];

    // 매치 전 텍스트
    pushText(rest.slice(0, picked.idx));

    if (picked.type === "ex") {
      // ✅ 성분(예: 타이레놀, 부루펜) -> 예시 약이름만 클릭
      const full = picked.m[0];
      const ingredient = picked.m[1];
      const examplesRaw = picked.m[2];
      const exampleNames = splitDrugNames(examplesRaw);

      pushText(`${ingredient}(`);
      pushText("예: ");

      exampleNames.forEach((name, idx2) => {
        nodes.push(
          <span
            key={`ex-${i}-${name}-${idx2}`}
            style={{ pointerEvents: "auto" }}
            className="underline cursor-pointer text-olive-dark font-semibold hover:text-olive-primary"
            onClick={() => onDrugClick(name)}
            title="클릭하면 검색 화면으로 이동해요"
          >
            {name}
          </span>
        );
        if (idx2 < exampleNames.length - 1) pushText(", ");
      });

      pushText(")");

      i += picked.idx + full.length;
      continue;
    }

    // ✅ 약이름(무언가) -> 괄호 밖 약이름만 무조건 링크
    const full = picked.m[0];
    const drugName = picked.m[1].trim(); // 괄호 밖
    // const inside = picked.m[2].trim(); // 괄호 안 (사용 안 함)

    const idx = full.indexOf(drugName);
    const before = idx > 0 ? full.slice(0, idx) : "";
    const after = idx >= 0 ? full.slice(idx + drugName.length) : "";

    pushText(before);
    nodes.push(
      <span
        key={`pa-${i}-${drugName}`}
        style={{ pointerEvents: "auto" }}
        className="underline cursor-pointer text-olive-dark font-semibold hover:text-olive-primary"
        onClick={() => onDrugClick(drugName)}
        title="클릭하면 검색 화면으로 이동해요"
      >
        {drugName}
      </span>
    );
    pushText(after);

    i += picked.idx + full.length;
  }

  return nodes;
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "안녕하세요! 어디가 불편하신가요? 증상을 말씀해주시면 약을 추천해 드릴게요. 💊",
    },
  ]);
  const [loading, setLoading] = useState(false);

  // ✅ 한글 IME 조합 상태 (끝 글자 남는 버그 방지)
  const [isComposing, setIsComposing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const recentMessages = [...messages, userMsg].slice(-6);
      const res = await axios.post(`${API_BASE}/api/chat`, {
        messages: recentMessages,
      });
      const aiMsg: Message = { role: "assistant", content: res.data.reply };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "죄송합니다. 잠시 후 다시 시도해주세요.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.nativeEvent as any).isComposing || isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const onDrugClick = async (drugName: string) => {
    try {
      const searchRes = await axios.get(`${API_BASE}/api/pills`, {
        params: { keyword: drugName, page: 1, page_size: 1 },
      });

      const first = searchRes.data?.items?.[0];
      if (!first) {
        alert("해당 약 정보를 찾지 못했어요. (DB에 없을 수 있어요)");
        return;
      }

      window.dispatchEvent(
        new CustomEvent("pilly:go-search", { detail: { keyword: drugName } })
      );
    } catch (error) {
      console.error(error);
      alert("검색 화면으로 이동하지 못했어요.");
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="w-[350px] h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col mb-4 overflow-hidden animate-fade-in-up">
          <div className="bg-olive-primary p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <Bot size={24} />
              <span className="font-bold text-lg">AI 약사 상담</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-1 rounded-full transition"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-olive-primary text-white rounded-tr-none shadow-md"
                      : "bg-white text-gray-800 border border-gray-200 rounded-tl-none shadow-sm"
                  }`}
                >
                  {msg.role === "assistant"
                    ? renderWithDrugLink(msg.content, onDrugClick)
                    : msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-200 shadow-sm flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              placeholder="증상을 입력하세요 (예: 열이 나요)"
              className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-olive-primary/50"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="p-2 bg-olive-primary text-white rounded-full hover:bg-olive-dark transition disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-olive-primary hover:bg-olive-dark text-white rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
      >
        {isOpen ? <X size={32} /> : <MessageCircle size={32} />}
      </button>
    </div>
  );
}
