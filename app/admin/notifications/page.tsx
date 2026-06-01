"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { 
  Search, Megaphone, Bell, Trash2, ChevronLeft, ChevronRight, Calendar 
} from "lucide-react";
import { getNotifications, deleteNotification } from "./actions";

function NotificationsHistoryPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Tất cả");
  const [searchTerm, setSearchTerm] = useState("");

  // --- LOGIC PHÂN TRANG CHUẨN ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    setLoading(true);
    const data = await getNotifications();
    setNotifications(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa thông báo này khỏi lịch sử?")) {
      const res = await deleteNotification(id);
      if (res.success) fetchData(); else alert(res.error);
    }
  };

  // Lọc dữ liệu thật từ DB
  const filteredNotifications = notifications.filter(noti => {
    const matchFilter = filter === "Tất cả" || 
                        (filter === "Hệ thống" && noti.type === "system") || 
                        (filter === "Bản tin phát sóng" && noti.type === "broadcast");
                        
    const matchSearch = noti.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        noti.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchFilter && matchSearch;
  });

  // Tính toán phân trang
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedNotifications = filteredNotifications.slice(startIndex, startIndex + itemsPerPage);

  // Reset trang về 1 khi người dùng lọc hoặc tìm kiếm
  useEffect(() => { setCurrentPage(1); }, [filter, searchTerm]);

  if (loading) return <div className="min-h-screen bg-gray-50 dark:bg-[#09090b] p-8 font-bold text-gray-500 transition-colors duration-300">Đang tải lịch sử thông báo...</div>;

  return (
    <div className="p-8 bg-gray-50 dark:bg-[#09090b] min-h-screen space-y-6 transition-colors duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Lịch sử thông báo</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Xem lại toàn bộ thông báo đã phát và thông báo từ hệ thống</p>
      </div>

      {/* Thanh công cụ lọc & tìm kiếm */}
      <div className="bg-white dark:bg-[#18181b] p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-wrap gap-3 items-center justify-between shadow-sm transition-colors duration-300">
        <div className="flex gap-2 flex-wrap">
          {["Tất cả", "Hệ thống", "Bản tin phát sóng"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                filter === tab 
                  ? "bg-red-600 text-white shadow-md" 
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-[#09090b] border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-red-500 transition-all w-64 dark:text-white placeholder:text-gray-400" 
            placeholder="Tìm kiếm tiêu đề, nội dung..." 
          />
        </div>
      </div>

      {/* Danh sách bài thông báo */}
      <div className="bg-white dark:bg-[#18181b] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden transition-colors duration-300">
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {paginatedNotifications.length > 0 ? (
            paginatedNotifications.map((noti) => (
              <div key={noti.id} className="p-5 flex items-start justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl flex-shrink-0 shadow-sm ${
                    noti.type === "system" 
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" 
                      : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                  }`}>
                    {noti.type === "system" ? <Bell className="w-5 h-5" /> : <Megaphone className="w-5 h-5" />}
                  </div>
                  <div className="space-y-1">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                      noti.type === "system" 
                        ? "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300" 
                        : "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300"
                    }`}>
                      {noti.type === "system" ? "Hệ thống" : `Phát sóng • Gửi đến: ${noti.target}`}
                    </span>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 pt-1">{noti.title}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed max-w-3xl whitespace-pre-wrap">{noti.content}</p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500 font-medium pt-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(noti.createdAt).toLocaleString("vi-VN")}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(noti.id)}
                  className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
              Không tìm thấy dữ liệu thông báo nào trong hệ thống.
            </div>
          )}
        </div>

        {/* PHÂN TRANG (PAGINATION) */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900 transition-colors duration-300">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Hiển thị {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredNotifications.length)} trong tổng số {filteredNotifications.length} thông báo
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#18181b] hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 dark:text-gray-200" />
              </button>
              <span className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white">{currentPage} / {totalPages}</span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#18181b] hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 dark:text-gray-200" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(NotificationsHistoryPage), { ssr: false });