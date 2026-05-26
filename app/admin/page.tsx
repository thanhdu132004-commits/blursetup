"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link"; 
import { useSession } from "next-auth/react";
import { 
  Package, TrendingUp, DollarSign, Users, 
  ShoppingBag, Newspaper, ChevronRight, Edit, Eye, 
  LayoutDashboard, FileText, Settings, BarChart3, MessageSquare, Reply
} from "lucide-react";

// Import hàm lấy dữ liệu và trả lời câu hỏi
import { getQuestions, adminReplyToQuestion } from "@/app/actions/qa";

// MOCK DATA: Giữ nguyên để làm khung giao diện thống kê đẹp mắt
const STATS = [
  { title: "Tổng doanh thu", value: "128.500.000 ₫", increase: "+12.5%", icon: <DollarSign className="w-5 h-5 text-green-600" />, bgColor: "bg-green-100" },
  { title: "Đơn hàng mới", value: "356", increase: "+8.2%", icon: <ShoppingBag className="w-5 h-5 text-blue-600" />, bgColor: "bg-blue-100" },
  { title: "Tổng sản phẩm", value: "1,240", increase: "-2.4%", icon: <Package className="w-5 h-5 text-orange-600" />, bgColor: "bg-orange-100" },
  { title: "Tin tức & Review", value: "48", increase: "+15.3%", icon: <Newspaper className="w-5 h-5 text-purple-600" />, bgColor: "bg-purple-100" },
];

const RECENT_NEWS = [
  { title: "Đánh giá chi tiết Laptop Lenovo Legion 5 Pro 2026", author: "Admin", date: "22/05/2026", views: 1240 },
  { title: "Top 5 bàn phím cơ dưới 2 triệu đồng đáng mua nhất", author: "BlurReview", date: "21/05/2026", views: 856 },
];

const TOP_PRODUCTS = [
  { name: "Màn hình Dell UltraSharp U2723QE", sales: 124, revenue: "1.548.760.000 ₫" },
  { name: "Tai nghe Sony WH-1000XM5", sales: 98, revenue: "783.020.000 ₫" },
];

function AdminDashboard() {
  const { data: session } = useSession();
  const [isMounted, setIsMounted] = useState(false);
  
  // State quản lý Hỏi Đáp
  const [questions, setQuestions] = useState<any[]>([]);
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});
  const [isReplying, setIsReplying] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    fetchQA();
  }, []);

  const fetchQA = async () => {
    const q = await getQuestions();
    setQuestions(q);
  };

  const handleAdminReply = async (questionId: string) => {
    const content = replyContent[questionId];
    if (!content?.trim()) return alert("Vui lòng nhập nội dung câu trả lời!");

    setIsReplying(questionId);
    // Lấy ID của Admin đang đăng nhập (hoặc dùng ID mặc định nếu test)
    const adminId = (session?.user as any)?.id || "6a0de954edad2fe7af807713";

    const res = await adminReplyToQuestion(questionId, adminId, content);
    if (res.success) {
      alert("Đã trả lời khách hàng thành công!");
      // Xóa form nhập và load lại dữ liệu
      setReplyContent(prev => ({ ...prev, [questionId]: "" }));
      fetchQA();
    } else {
      alert(res.error);
    }
    setIsReplying(null);
  };

  if (!isMounted) return <div className="p-8 font-bold text-gray-500">Đang tải dashboard...</div>;

  return (
    <div className="p-6 md:p-8 space-y-8 bg-gray-50/50 min-h-screen">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Tổng quan hệ thống</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Chào mừng quay lại, quản trị viên BlurSetup.</p>
        </div>
        
        {/* NÚT ĐIỀU HƯỚNG MỚI */}
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/news" className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:border-red-500 hover:text-red-600 transition-all shadow-sm">
            <Newspaper className="w-4 h-4" /> Quản lý tin tức
          </Link>
          
          <Link href="/admin/products" className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-all shadow-md">
            <Package className="w-4 h-4" /> Quản lý kho
          </Link>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {STATS.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bgColor}`}>
                {stat.icon}
              </div>
              <span className={`text-[10px] font-black px-2 py-1 rounded-md ${stat.increase.startsWith('+') ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                {stat.increase}
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-gray-500 text-[11px] font-bold uppercase tracking-wider">{stat.title}</h3>
              <div className="text-xl font-black text-gray-900 tracking-tight">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* DASHBOARD GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* CỘT TRÁI: HỎI ĐÁP & TIN TỨC */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* QUẢN LÝ HỎI ĐÁP KHÁCH HÀNG (DỮ LIỆU THẬT) */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-blue-50/30">
              <h2 className="text-sm font-black text-gray-900 uppercase flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" /> Hỏi đáp từ khách hàng
              </h2>
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-md">
                {questions.filter(q => q.replies.length === 0).length} câu hỏi chưa đáp
              </span>
            </div>
            
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto custom-scrollbar">
              {questions.length > 0 ? questions.map(q => (
                <div key={q.id} className="p-5 space-y-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="font-bold text-sm text-gray-900">{q.user?.name || "Khách hàng ẩn danh"}</div>
                      <div className="text-[10px] text-gray-500">{new Date(q.createdAt).toLocaleString("vi-VN")}</div>
                    </div>
                    {q.replies?.length > 0 ? (
                      <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2.5 py-1 rounded-md border border-green-200">Đã trả lời</span>
                    ) : (
                      <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2.5 py-1 rounded-md border border-orange-200">Chờ xử lý</span>
                    )}
                  </div>
                  
                  {/* Nội dung câu hỏi */}
                  <div className="text-sm text-gray-800 bg-gray-100/70 p-3 rounded-xl border border-gray-200/50">
                    <span className="font-bold text-red-600 mr-1">Hỏi:</span>{q.content}
                  </div>

                  {/* Lịch sử Admin đã trả lời */}
                  {q.replies?.map((r: any) => (
                    <div key={r.id} className="ml-4 pl-4 border-l-2 border-green-400 space-y-1">
                      <div className="font-bold text-[11px] text-green-700">
                        {r.user?.name || "Admin"} đã trả lời lúc {new Date(r.createdAt).toLocaleString("vi-VN")}:
                      </div>
                      <p className="text-sm text-gray-700 bg-green-50 p-3 rounded-xl border border-green-100/50">{r.content}</p>
                    </div>
                  ))}

                  {/* Form gõ câu trả lời của Admin */}
                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Gõ câu trả lời của bạn..."
                      value={replyContent[q.id] || ""}
                      onChange={e => setReplyContent({...replyContent, [q.id]: e.target.value})}
                      className="flex-1 text-sm border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all bg-white"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAdminReply(q.id);
                      }}
                    />
                    <button
                      onClick={() => handleAdminReply(q.id)}
                      disabled={isReplying === q.id}
                      className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                    >
                      <Reply className="w-3.5 h-3.5" /> {isReplying === q.id ? "Đang gửi..." : "Trả lời"}
                    </button>
                  </div>
                </div>
              )) : (
                <div className="p-10 text-center flex flex-col items-center justify-center">
                  <MessageSquare className="w-10 h-10 text-gray-300 mb-3" />
                  <div className="text-sm text-gray-500 font-medium">Chưa có câu hỏi nào từ khách hàng.</div>
                </div>
              )}
            </div>
          </div>

          {/* Tin tức mới nhất */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-black text-gray-900 uppercase flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-purple-600" /> Bài viết tin tức
              </h2>
              <Link href="/admin/news" className="text-xs font-bold text-red-600 hover:underline">Quản lý bài viết</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {RECENT_NEWS.map((news, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="text-sm font-bold text-gray-800">{news.title}</div>
                  <div className="text-xs text-gray-400 font-medium">{news.date}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: BÁN CHẠY */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
             <h2 className="text-sm font-black text-gray-900 uppercase mb-4 flex items-center gap-2">
               <TrendingUp className="w-4 h-4 text-orange-500" /> Sản phẩm bán chạy
             </h2>
             <div className="space-y-3">
              {TOP_PRODUCTS.map((p, i) => (
                 <div key={i} className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-700 truncate w-32">{p.name}</span>
                    <span className="font-black text-red-600">{p.revenue.split(' ')[0]}</span>
                 </div>
              ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(AdminDashboard), { ssr: false });