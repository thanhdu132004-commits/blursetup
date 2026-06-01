"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { 
  Bell, Home, Megaphone, ShoppingBag, User, Gift, X, Send, Sun, Moon 
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// IMPORT SERVER ACTIONS ĐỂ LẤY VÀ TẠO THÔNG BÁO THẬT
import { getNotifications, createNotification } from "./notifications/actions";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // States Modal Tạo thông báo
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [target, setTarget] = useState("Tất cả khách hàng (Toàn hệ thống)");

  // State lưu thông báo từ DB
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    loadNotifications();
  }, []);

  // Hàm load dữ liệu từ MongoDB
  const loadNotifications = async () => {
    const data = await getNotifications();
    setNotifications(data);
  };

  // Hàm xử lý khi bấm nút "Phát sóng ngay"
  const handleSendNotification = async () => {
    if (!title.trim() || !content.trim()) return alert("Vui lòng điền đủ Tiêu đề và Nội dung!");
    
    const res = await createNotification({
      title,
      content,
      type: "broadcast", // Đánh dấu đây là thông báo do Admin phát
      target
    });

    if (res.success) {
      alert("Đã phát sóng thông báo và lưu vào hệ thống thành công!");
      setIsComposeOpen(false);
      setTitle(""); // Reset form
      setContent("");
      loadNotifications(); // Cập nhật lại số lượng chuông ngay lập tức
    } else {
      alert(res.error);
    }
  };

  return (
    <div 
      className="flex h-screen bg-gray-50 dark:bg-[#09090b] overflow-hidden font-sans transition-colors duration-300" 
      suppressHydrationWarning
    >
      <AdminSidebar />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden" suppressHydrationWarning>
        
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-[#18181b] border-b border-gray-200 dark:border-gray-800 flex items-center justify-end px-6 shadow-sm z-10 flex-shrink-0 transition-colors duration-300">
          <div className="flex items-center gap-3 md:gap-5">
            
            {/* Nút Chuyển đổi Sáng/Tối */}
            {mounted && (
              <button 
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            )}

            <Link 
              href="/" 
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-red-600 rounded-xl transition-colors shadow-sm"
            >
              <Home className="w-4 h-4" /> <span className="hidden sm:block">Xem trang web</span>
            </Link>

            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>

            {/* NÚT CHUÔNG THÔNG BÁO */}
            <DropdownMenu>
              <DropdownMenuTrigger className="relative p-2.5 text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 rounded-full transition-colors outline-none cursor-pointer">
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-white dark:border-[#18181b] animate-pulse"></span>
                )}
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-80 sm:w-96 bg-white dark:bg-[#18181b] border-gray-200 dark:border-gray-800 shadow-2xl rounded-2xl p-0 z-50 mt-2">
                {/* Header Dropdown */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/80 dark:bg-gray-900/50 rounded-t-2xl">
                  <h3 className="text-sm font-black text-gray-900 dark:text-gray-100">Thông báo hệ thống</h3>
                  <button 
                    onClick={() => setIsComposeOpen(true)} 
                    className="flex items-center gap-1.5 text-[11px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                  >
                    <Megaphone className="w-3.5 h-3.5" /> Gửi thông báo
                  </button>
                </div>

                {/* Danh sách thông báo */}
                <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 5).map(noti => (
                      <DropdownMenuItem 
                        key={noti.id} 
                        className="p-4 border-b border-gray-50 dark:border-gray-800 last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 flex items-start gap-3 rounded-none outline-none focus:bg-gray-50 dark:focus:bg-gray-800 transition-colors"
                      >
                        <div className={`p-2.5 rounded-xl flex-shrink-0 shadow-sm ${noti.type === 'system' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
                          {noti.type === 'system' ? <Bell className="w-4 h-4" /> : <Megaphone className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 space-y-1 mt-0.5">
                          <p className="text-xs leading-snug line-clamp-2 font-bold text-gray-900 dark:text-gray-100">
                            {noti.title}
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium">{new Date(noti.createdAt).toLocaleString('vi-VN')}</p>
                        </div>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-gray-400 font-medium">Chưa có thông báo nào.</div>
                  )}
                </div>

                {/* Footer Dropdown */}
                <div className="p-3 border-t border-gray-100 dark:border-gray-800 text-center bg-gray-50/50 dark:bg-gray-900/30 rounded-b-2xl">
                  <Link href="/admin/notifications" className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-red-600 transition-colors">
                    Xem tất cả lịch sử thông báo
                  </Link>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-[#09090b] transition-colors duration-300" suppressHydrationWarning>
          {children}
        </div>
      </main>

      {/* MODAL TẠO THÔNG BÁO */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsComposeOpen(false)}></div>
          
          <div className="relative w-full max-w-lg bg-white dark:bg-[#18181b] rounded-3xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 transition-colors duration-300">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2 uppercase tracking-tight">
                <Megaphone className="w-5 h-5 text-red-600" /> Tạo thông báo hàng loạt
              </h2>
              <button onClick={() => setIsComposeOpen(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Tiêu đề thông báo</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Tặng ngay voucher 500K cho khách hàng mua Laptop..." 
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#09090b] focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm font-medium outline-none focus:border-red-500 transition-colors shadow-inner dark:text-white" 
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Nội dung chi tiết</label>
                <textarea 
                  rows={4} 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Nhập nội dung chi tiết về chương trình khuyến mãi hoặc thông báo hệ thống..." 
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#09090b] focus:bg-white dark:focus:bg-gray-800 rounded-xl text-sm font-medium outline-none focus:border-red-500 transition-colors resize-none shadow-inner dark:text-white"
                ></textarea>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Đối tượng nhận thông báo</label>
                <select 
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#09090b] rounded-xl text-sm font-bold text-gray-700 dark:text-gray-200 outline-none focus:border-red-500 shadow-sm cursor-pointer"
                >
                  <option value="Tất cả khách hàng (Toàn hệ thống)">Tất cả khách hàng (Toàn hệ thống)</option>
                  <option value="Chỉ khách hàng mới đăng ký (Dưới 30 ngày)">Chỉ khách hàng mới đăng ký (Dưới 30 ngày)</option>
                  <option value="Khách hàng VIP (Đã từng mua hàng)">Khách hàng VIP (Đã từng mua hàng)</option>
                </select>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 rounded-b-3xl flex justify-end gap-3 transition-colors duration-300">
              <button 
                onClick={() => setIsComposeOpen(false)} 
                className="px-6 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleSendNotification} 
                className="px-6 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <Send className="w-4 h-4" /> Phát sóng ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}