"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { 
  Search, Megaphone, Bell, Trash2, ChevronLeft, ChevronRight, Calendar, UserCheck 
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

  if (loading) return <div className="min-h-screen bg-gray-50/50 p-8 font-bold text-gray-500">Đang tải lịch sử thông báo...</div>;

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900">Lịch sử thông báo</h1>
        <p className="text-sm text-gray-500 font-medium">Xem lại toàn bộ thông báo đã phát và thông báo từ hệ thống</p>
      </div>

      {/* Thanh công cụ lọc & tìm kiếm */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-wrap gap-3 items-center justify-between shadow-sm">
        <div className="flex gap-2 flex-wrap">
          {["Tất cả", "Hệ thống", "Bản tin phát sóng"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                filter === tab ? "bg-red-600 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
            className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-red-500 transition-all w-64" 
            placeholder="Tìm kiếm tiêu đề, nội dung..." 
          />
        </div>
      </div>

      {/* Danh sách bài thông báo dạng bảng hoặc khối phẳng chuyên nghiệp */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-100">
          {paginatedNotifications.length > 0 ? (
            paginatedNotifications.map((noti) => (
              <div key={noti.id} className="p-5 flex items-start justify-between gap-4 hover:bg-gray-50 transition-colors group">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl flex-shrink-0 shadow-sm ${
                    noti.type === "system" ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600"
                  }`}>
                    {noti.type === "system" ? <Bell className="w-5 h-5" /> : <Megaphone className="w-5 h-5" />}
                  </div>
                  <div className="space-y-1">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                      noti.type === "system" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"
                    }`}>
                      {noti.type === "system" ? "Hệ thống" : `Phát sóng • Gửi đến: ${noti.target}`}
                    </span>
                    <h3 className="text-sm font-bold text-gray-900 pt-1">{noti.title}</h3>
                    <p className="text-xs text-gray-600 leading-relaxed max-w-3xl whitespace-pre-wrap">{noti.content}</p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium pt-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(noti.createdAt).toLocaleString("vi-VN")}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(noti.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-sm font-medium text-gray-500">
              Không tìm thấy dữ liệu thông báo nào trong hệ thống.
            </div>
          )}
        </div>

        {/* PHÂN TRANG (PAGINATION) CHUẨN ĐỒNG BỘ */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <span className="text-xs text-gray-500 font-medium">
              Hiển thị {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredNotifications.length)} trong tổng số {filteredNotifications.length} thông báo
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded-lg">{currentPage} / {totalPages}</span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(NotificationsHistoryPage), { ssr: false });