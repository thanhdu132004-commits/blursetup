"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User, Loader2 } from "lucide-react";

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: "bot" | "user";
  text: string;
}

export function ChatBot({ isOpen, onClose }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Xin chào! Mình là BlurBot 🤖. Mình có thể giúp gì cho góc Setup của bạn hôm nay?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();

      setMessages(prev => [...prev, { role: "bot", text: data.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "bot", text: "Xin lỗi, mình đang gặp chút sự cố kết nối. Bạn thử lại sau nhé!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-4 md:bottom-28 md:right-8 w-[350px] max-w-[calc(100vw-2rem)] h-[450px] bg-white rounded-2xl shadow-[0_5px_25px_rgba(0,0,0,0.15)] border border-gray-100 flex flex-col z-[100] overflow-hidden animate-in slide-in-from-bottom-5">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-[#d70018] p-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm">BlurBot AI</h3>
            <div className="flex items-center gap-1 text-[10px] text-red-100">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Trực tuyến
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Khu vực Chat */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "user" ? "bg-gray-800 text-white" : "bg-red-100 text-red-600"}`}>
              {msg.role === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>
            <div className={`max-w-[75%] p-3 text-sm rounded-2xl ${msg.role === "user" ? "bg-gray-900 text-white rounded-tr-sm" : "bg-white border border-gray-100 text-gray-800 shadow-sm rounded-tl-sm"}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-end gap-2">
            <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center"><Bot className="w-3.5 h-3.5" /></div>
            <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-gray-100">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-2 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500/20 transition-all">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Hỏi gì đó..." 
            className="flex-1 p-2 bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 transition-colors"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}