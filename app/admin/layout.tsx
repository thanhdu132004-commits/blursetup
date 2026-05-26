"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { 
  Bell, Home, Megaphone, ShoppingBag, User, Gift, X, Send 
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// IMPORT SERVER ACTIONS ĐỂ LẤY VÀ TẠO THÔNG BÁO THẬT
import { getNotifications, createNotification } from "./notifications/actions";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // States Modal Tạo thông báo
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [target, setTarget] = useState("Tất cả khách hàng (Toàn hệ thống)");

  // State lưu thông báo từ DB
  const [notifications, setNotifications] = useState<any[]>([]);

  // Hàm load dữ liệu từ MongoDB
  const loadNotifications = async () => {
    const data = await getNotifications();
    setNotifications(data);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

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
      className="flex h-screen bg-gray-50 overflow-hidden font-sans" 
      suppressHydrationWarning
    >
      <AdminSidebar />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden" suppressHydrationWarning>
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-6 shadow-sm z-10 flex-shrink-0">
          <div className="flex items-center gap-3 md:gap-5">
            
            <Link 
              href="/" 
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 hover:text-red-600 rounded-xl transition-colors shadow-sm"
            >
              <Home className="w-4 h-4" /> <span className="hidden sm:block">Xem trang web</span>
            </Link>

            <div className="w-px h-6 bg-gray-200 hidden sm:block"></div>

            {/* NÚT CHUÔNG THÔNG BÁO CHUYÊN NGHIỆP */}
            <DropdownMenu>
              <DropdownMenuTrigger className="relative p-2.5 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors outline-none cursor-pointer">
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-white animate-pulse"></span>
                )}
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-80 sm:w-96 bg-white border-gray-200 shadow-2xl rounded-2xl p-0 z-50 mt-2">
                {/* Header Dropdown */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80 rounded-t-2xl">
                  <h3 className="text-sm font-black text-gray-900">Thông báo hệ thống</h3>
                  <button 
                    onClick={() => setIsComposeOpen(true)} 
                    className="flex items-center gap-1.5 text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                  >
                    <Megaphone className="w-3.5 h-3.5" /> Gửi thông báo
                  </button>
                </div>

                {/* Danh sách thông báo (Chỉ hiển thị 5 cái mới nhất cho gọn) */}
                <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 5).map(noti => (
                      <DropdownMenuItem 
                        key={noti.id} 
                        className="p-4 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 flex items-start gap-3 rounded-none outline-none focus:bg-gray-50 transition-colors"
                      >
                        <div className={`p-2.5 rounded-xl flex-shrink-0 shadow-sm ${noti.type === 'system' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                          {noti.type === 'system' ? <Bell className="w-4 h-4" /> : <Megaphone className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 space-y-1 mt-0.5">
                          <p className="text-xs leading-snug line-clamp-2 font-bold text-gray-900">
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
                <div className="p-3 border-t border-gray-100 text-center bg-gray-50/50 rounded-b-2xl">
                  <Link href="/admin/notifications" className="text-xs font-bold text-gray-500 hover:text-red-600 transition-colors">
                    Xem tất cả lịch sử thông báo
                  </Link>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-gray-50/50" suppressHydrationWarning>
          {children}
        </div>
      </main>

      {/* MODAL TẠO THÔNG BÁO CHO NGƯỜI DÙNG */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsComposeOpen(false)}></div>
          
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2 uppercase tracking-tight">
                <Megaphone className="w-5 h-5 text-red-600" /> Tạo thông báo hàng loạt
              </h2>
              <button onClick={() => setIsComposeOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Tiêu đề thông báo</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Tặng ngay voucher 500K cho khách hàng mua Laptop..." 
                  className="w-full px-4 py-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl text-sm font-medium outline-none focus:border-red-500 transition-colors shadow-inner" 
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Nội dung chi tiết</label>
                <textarea 
                  rows={4} 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Nhập nội dung chi tiết về chương trình khuyến mãi hoặc thông báo hệ thống..." 
                  className="w-full px-4 py-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl text-sm font-medium outline-none focus:border-red-500 transition-colors resize-none shadow-inner"
                ></textarea>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Đối tượng nhận thông báo</label>
                <select 
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 bg-white rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-red-500 shadow-sm cursor-pointer"
                >
                  <option value="Tất cả khách hàng (Toàn hệ thống)">Tất cả khách hàng (Toàn hệ thống)</option>
                  <option value="Chỉ khách hàng mới đăng ký (Dưới 30 ngày)">Chỉ khách hàng mới đăng ký (Dưới 30 ngày)</option>
                  <option value="Khách hàng VIP (Đã từng mua hàng)">Khách hàng VIP (Đã từng mua hàng)</option>
                </select>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-3xl flex justify-end gap-3">
              <button 
                onClick={() => setIsComposeOpen(false)} 
                className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
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