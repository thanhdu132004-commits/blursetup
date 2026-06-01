"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation"; // <-- THÊM IMPORT NÀY
import { MessageCircle, X, Bot } from "lucide-react";
import { ChatBot } from "./chat-bot"; // Đảm bảo file chat-bot.tsx đã nằm cùng thư mục components

export function FloatingContact() {
  const [isOpen, setIsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false); // State quản lý cửa sổ chat AI
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname(); // <-- LẤY ĐƯỜNG DẪN HIỆN TẠI

  // =================================================================
  // ĐIỀN DỮ LIỆU THẬT CỦA BẠN VÀO ĐÂY
  // =================================================================
  const ZALO_PHONE = "0328275837"; // <-- Điền SĐT Zalo (Viết liền)
  const FACEBOOK_LINK = "https://m.me/nguyen.thanhdu.31392"; // <-- Điền link Messenger
  // =================================================================

  // Đóng menu khi click ra ngoài vùng nút
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // KHÔNG HIỂN THỊ NẾU ĐANG Ở TRANG ADMIN
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-[100]" ref={menuRef}>
        
        {/* CÁC NÚT LIÊN HỆ BÊN TRONG (Zalo, Mes, AI) */}
        <div 
          className={`absolute bottom-full right-0 mb-4 flex flex-col items-end gap-3 transition-all duration-300 origin-bottom-right 
          ${isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-50 translate-y-4 pointer-events-none"}`}
        >
          
          {/* NÚT AI CHAT */}
          <button 
            onClick={() => {
              setIsChatOpen(true);
              setIsOpen(false); 
            }}
            className="flex items-center gap-3 group"
          >
            <span className="px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg shadow-md transition-all whitespace-nowrap opacity-100 md:opacity-0 md:group-hover:opacity-100">
              Hỏi AI BlurBot
            </span>
            <div className="w-12 h-12 bg-gradient-to-tr from-[#d70018] to-[#ff4e50] rounded-full flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform border-2 border-white">
              <Bot className="w-6 h-6" />
            </div>
          </button>

          {/* NÚT MESSENGER */}
          <Link 
            href={FACEBOOK_LINK} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 group"
          >
            <span className="px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg shadow-md transition-all whitespace-nowrap opacity-100 md:opacity-0 md:group-hover:opacity-100">
              Chat Messenger
            </span>
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#0A7CFF] via-[#7544FF] to-[#FF477E] flex items-center justify-center p-2.5 shadow-lg group-hover:scale-110 transition-transform">
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-white">
                <path d="M16 2.66669C8.63623 2.66669 2.66669 8.24355 2.66669 15.1111C2.66669 18.9482 4.6067 22.3804 7.61869 24.5822C7.38536 25.8653 6.30535 28.1889 6.20869 28.4067C5.97869 28.9329 6.55135 29.352 7.03135 29.0835C7.23469 28.968 10.3667 27.2027 12.5834 26.6853C13.6707 27.2409 14.8087 27.5556 16 27.5556C23.3638 27.5556 29.3334 21.9787 29.3334 15.1111C29.3334 8.24355 23.3638 2.66669 16 2.66669ZM18.1774 19.3493L15.1667 16.1413L9.33335 19.3493L15.756 12.428L18.8334 15.636L24.6667 12.428L18.1774 19.3493Z" fill="currentColor"/>
              </svg>
            </div>
          </Link>

          {/* NÚT ZALO */}
          <Link 
            href={`https://zalo.me/${ZALO_PHONE}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 group"
          >
            <span className="px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg shadow-md transition-all whitespace-nowrap opacity-100 md:opacity-0 md:group-hover:opacity-100">
              Chat Zalo
            </span>
            <div className="w-12 h-12 rounded-full bg-[#0068FF] flex items-center justify-center p-2.5 shadow-lg group-hover:scale-110 transition-transform">
               <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-white">
                <path d="M16 2.66669C8.63623 2.66669 2.66669 8.24355 2.66669 15.1111C2.66669 18.9482 4.6067 22.3804 7.61869 24.5822C7.38536 25.8653 6.30535 28.1889 6.20869 28.4067C5.97869 28.9329 6.55135 29.352 7.03135 29.0835C7.23469 28.968 10.3667 27.2027 12.5834 26.6853C13.6707 27.2409 14.8087 27.5556 16 27.5556C23.3638 27.5556 29.3334 21.9787 29.3334 15.1111C29.3334 8.24355 23.3638 2.66669 16 2.66669Z" fill="currentColor"/>
                <path d="M11.6666 12.6666H9.33331V19.3333H11.6666V12.6666Z" fill="white"/>
                <path d="M15.9999 12.6666C14.159 12.6666 12.6666 14.159 12.6666 15.9999C12.6666 17.8409 14.159 19.3333 15.9999 19.3333C17.8409 19.3333 19.3333 17.8409 19.3333 15.9999C19.3333 14.159 17.8409 12.6666 15.9999 12.6666ZM15.9999 17.6666C15.0805 17.6666 14.3333 16.9194 14.3333 15.9999C14.3333 15.0805 15.0805 14.3333 15.9999 14.3333C16.9194 14.3333 17.6666 15.0805 17.6666 15.9999C17.6666 16.9194 16.9194 17.6666 15.9999 17.6666Z" fill="white"/>
                <path d="M22.6666 12.6666H20.3333V17.6666H22.6666V12.6666Z" fill="white"/>
              </svg>
            </div>
          </Link>
        </div>

        {/* NÚT TỔNG (TOGGLE CHÍNH) */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 bg-[#d70018] rounded-full shadow-[0_4px_15px_rgba(215,0,24,0.4)] flex items-center justify-center text-white hover:bg-red-700 hover:scale-105 transition-all duration-300 relative"
        >
          <div className={`absolute transition-all duration-300 ${isOpen ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}>
            <MessageCircle className="w-6 h-6" />
          </div>
          <div className={`absolute transition-all duration-300 ${isOpen ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`}>
            <X className="w-6 h-6" />
          </div>
        </button>
      </div>

      {/* RENDER CỬA SỔ CHAT KHI ĐƯỢC BẬT */}
      <ChatBot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
}