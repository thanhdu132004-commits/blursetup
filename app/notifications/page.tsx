"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, Bell, Megaphone, Calendar, Loader2, ArrowLeft, BellRing } from "lucide-react";
import { useSession } from "next-auth/react";
import { getUserNotificationHistory } from "@/app/actions/notifications"; // Đảm bảo import đúng đường dẫn

export default function UserNotificationsPage() {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      // Đợi session khởi tạo xong
      if (status === "loading") return;

      setLoading(true);
      try {
        const userId = session?.user ? (session.user as any).id : undefined;
        const data = await getUserNotificationHistory(userId);
        setNotifications(data);
      } catch (error) {
        console.error("Lỗi tải thông báo:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [session, status]);

  return (
    <div className="bg-gray-50 dark:bg-[#09090b] min-h-screen pb-16 transition-colors duration-300">
      
      {/* Breadcrumb */}
      <div className="bg-white dark:bg-[#18181b] border-b border-gray-200 dark:border-gray-800 mb-8 shadow-sm transition-colors duration-300">
        <div className="max-w-[1000px] mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            <Link href="/" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">Trang chủ</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/profile" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">Tài khoản</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-900 dark:text-gray-200 font-bold">Thông báo của bạn</span>
          </div>
          
          <Link href="/" className="hidden sm:flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400 hover:underline">
            <ArrowLeft className="w-4 h-4" /> Quay lại trang chủ
          </Link>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-4 md:px-8">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-500 rounded-xl shadow-sm">
            <BellRing className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Thông báo hệ thống</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Cập nhật tin tức, ưu đãi và các thay đổi mới nhất từ BlurSetup.</p>
          </div>
        </div>

        {/* Nội dung danh sách */}
        <div className="bg-white dark:bg-[#18181b] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden transition-colors duration-300">
          
          {loading || status === "loading" ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-600">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-red-500" />
              <p className="font-bold text-sm">Đang đồng bộ thông báo...</p>
            </div>
          ) : notifications.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {notifications.map((noti) => (
                <div key={noti.id} className="p-5 md:p-6 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  
                  {/* Icon */}
                  <div className={`p-3 rounded-xl flex-shrink-0 shadow-sm border ${
                    noti.type === 'system' 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30' 
                      : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30'
                  }`}>
                    {noti.type === 'system' ? <Bell className="w-6 h-6" /> : <Megaphone className="w-6 h-6" />}
                  </div>
                  
                  {/* Nội dung chi tiết */}
                  <div className="flex-1 space-y-2 mt-0.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                      <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-snug">
                        {noti.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 dark:text-gray-500 flex-shrink-0 bg-gray-50 dark:bg-gray-800 px-2.5 py-1 rounded-lg w-fit">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(noti.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {noti.content}
                    </p>
                    
                    <div className="pt-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                        noti.type === 'system' 
                          ? 'bg-blue-100/50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' 
                          : 'bg-red-100/50 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                      }`}>
                        {noti.type === 'system' ? 'Thông báo hệ thống' : 'Tin khuyến mãi'}
                      </span>
                    </div>
                  </div>
                  
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center px-4">
              <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                <Bell className="w-10 h-10 text-gray-300 dark:text-gray-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Chưa có thông báo nào</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                Bạn đã xem hết tất cả thông báo. Chúng tôi sẽ cập nhật ngay khi có chương trình khuyến mãi hoặc tin tức mới!
              </p>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}