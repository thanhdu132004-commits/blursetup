// app/admin/page.tsx
"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link"; 
import { useSession } from "next-auth/react";
import { 
  Package, TrendingUp, DollarSign, 
  ShoppingBag, Newspaper, MessageSquare, Loader2, Calendar, Crown, ChevronRight
} from "lucide-react";

// Import Server Actions
import { getQuestions } from "@/app/actions/qa";
import { getDashboardStats } from "./actions";

function AdminDashboard() {
  const { data: session } = useSession();
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // State Thống kê hệ thống
  const [stats, setStats] = useState({ revenue: 0, orders: 0, products: 0, news: 0 });
  const [recentNews, setRecentNews] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  // State Hỏi Đáp (Chỉ dùng để hiển thị số lượng và vài câu mới nhất)
  const [unansweredCount, setUnansweredCount] = useState(0);
  const [recentQuestions, setRecentQuestions] = useState<any[]>([]);

  useEffect(() => {
    setIsMounted(true);
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [qaData, statsRes] = await Promise.all([
        getQuestions(),
        getDashboardStats()
      ]);

      if (qaData) {
        // Đếm số câu hỏi chưa được trả lời
        const unanswered = qaData.filter((q: any) => q.replies.length === 0);
        setUnansweredCount(unanswered.length);
        // Lấy 3 câu hỏi mới nhất để hiển thị nhanh
        setRecentQuestions(qaData.slice(0, 3));
      }

      if (statsRes.success && statsRes.data) {
        setStats({
          revenue: statsRes.data.revenue,
          orders: statsRes.data.orders,
          products: statsRes.data.products,
          news: statsRes.data.news
        });
        setRecentNews(statsRes.data.recentNews);
        setTopProducts(statsRes.data.topProducts);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="p-6 md:p-8 space-y-8 bg-gray-50 dark:bg-[#09090b] min-h-screen transition-colors duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Tổng quan hệ thống</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">Chào mừng quay lại, quản trị viên BlurSetup.</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/news" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:border-red-500 hover:text-red-600 transition-all shadow-sm">
            <Newspaper className="w-4 h-4" /> Quản lý tin tức
          </Link>
          <Link href="/admin/products" className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-all shadow-md">
            <Package className="w-4 h-4" /> Quản lý kho
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="w-10 h-10 animate-spin text-red-600 mb-4" />
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400 animate-pulse">Đang đồng bộ dữ liệu hệ thống...</p>
        </div>
      ) : (
        <>
          {/* STATS CARDS CHẠY DỮ LIỆU THẬT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            
            {/* Thẻ Doanh Thu */}
            <div className="bg-white dark:bg-[#18181b] rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-100 dark:bg-green-900/30">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-[10px] font-black px-2 py-1 rounded-md text-green-700 bg-green-50 dark:bg-green-900/30">Cập nhật lúc {new Date().toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-gray-500 dark:text-gray-400 text-[11px] font-bold uppercase tracking-wider">Tổng doanh thu</h3>
                <div className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{stats.revenue.toLocaleString("vi-VN")} ₫</div>
              </div>
            </div>

            {/* Thẻ Đơn Hàng */}
            <div className="bg-white dark:bg-[#18181b] rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-100 dark:bg-blue-900/30">
                  <ShoppingBag className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-gray-500 dark:text-gray-400 text-[11px] font-bold uppercase tracking-wider">Tổng đơn hàng</h3>
                <div className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{stats.orders} đơn</div>
              </div>
            </div>

            {/* Thẻ Sản Phẩm */}
            <div className="bg-white dark:bg-[#18181b] rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-orange-100 dark:bg-orange-900/30">
                  <Package className="w-5 h-5 text-orange-600" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-gray-500 dark:text-gray-400 text-[11px] font-bold uppercase tracking-wider">Kho sản phẩm</h3>
                <div className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{stats.products} mã</div>
              </div>
            </div>

            {/* Thẻ Tin Tức */}
            <div className="bg-white dark:bg-[#18181b] rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-100 dark:bg-purple-900/30">
                  <Newspaper className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-gray-500 dark:text-gray-400 text-[11px] font-bold uppercase tracking-wider">Bài viết / Tin tức</h3>
                <div className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{stats.news} bài</div>
              </div>
            </div>

          </div>

          {/* DASHBOARD GRID */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            
            {/* CỘT TRÁI: HỎI ĐÁP & TIN TỨC */}
            <div className="xl:col-span-2 space-y-6">
              
              {/* TÓM TẮT HỎI ĐÁP KHÁCH HÀNG (ĐÃ TỐI ƯU) */}
              <div className="bg-white dark:bg-[#18181b] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden transition-colors duration-300">
                <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-blue-50/30 dark:bg-blue-900/10">
                  <h2 className="text-sm font-black text-gray-900 dark:text-gray-100 uppercase flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Giao tiếp khách hàng
                  </h2>
                  <span className={`${unansweredCount > 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'} text-xs font-bold px-2 py-1 rounded-md`}>
                    {unansweredCount} câu hỏi chưa đáp
                  </span>
                </div>
                
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {recentQuestions.length > 0 ? recentQuestions.map(q => (
                    <div key={q.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex justify-between items-start gap-4">
                      <div>
                        <div className="font-bold text-sm text-gray-900 dark:text-gray-100">{q.user?.name || "Khách hàng ẩn danh"}</div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">{new Date(q.createdAt).toLocaleString("vi-VN")}</div>
                        <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                          <span className="font-bold text-gray-500 mr-1">Hỏi:</span>{q.content}
                        </div>
                      </div>
                      <div className="flex-shrink-0 mt-1">
                        {q.replies?.length > 0 ? (
                          <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-[10px] font-bold px-2.5 py-1 rounded-md border border-green-200 dark:border-green-800">Đã trả lời</span>
                        ) : (
                          <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-[10px] font-bold px-2.5 py-1 rounded-md border border-orange-200 dark:border-orange-800 animate-pulse">Chờ xử lý</span>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="p-10 text-center flex flex-col items-center justify-center">
                      <MessageSquare className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
                      <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Chưa có câu hỏi nào từ khách hàng.</div>
                    </div>
                  )}
                </div>
                
                {/* NÚT XEM TẤT CẢ Q&A DẪN SANG TRANG MỚI */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 text-center bg-gray-50/50 dark:bg-gray-900/20">
                  <Link href="/admin/qa" className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                    Đi tới Quản lý Hỏi Đáp <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* TIN TỨC MỚI NHẤT DỮ LIỆU THẬT */}
              <div className="bg-white dark:bg-[#18181b] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden transition-colors duration-300">
                <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <h2 className="text-sm font-black text-gray-900 dark:text-gray-100 uppercase flex items-center gap-2">
                    <Newspaper className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Bài viết mới cập nhật
                  </h2>
                  <Link href="/admin/news" className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline">Quản lý bài viết</Link>
                </div>
                <div className="divide-y divide-gray-50 dark:divide-gray-800">
                  {recentNews.length > 0 ? recentNews.map((news, idx) => (
                    <Link href={`/tin-tuc/${news.slug}`} key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors block">
                      <div className="text-sm font-bold text-gray-800 dark:text-gray-200 line-clamp-1">{news.title}</div>
                      <div className="text-[11px] flex items-center gap-1 text-gray-400 dark:text-gray-500 font-medium flex-shrink-0 ml-4">
                        <Calendar className="w-3 h-3" /> {new Date(news.createdAt).toLocaleDateString("vi-VN")}
                      </div>
                    </Link>
                  )) : (
                    <div className="p-6 text-center text-sm text-gray-500">Chưa có bài viết nào.</div>
                  )}
                </div>
              </div>
            </div>

            {/* CỘT PHẢI: BÁN CHẠY DỮ LIỆU THẬT */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-[#18181b] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 transition-colors duration-300">
                 <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase mb-4 flex items-center gap-2">
                   <TrendingUp className="w-4 h-4 text-orange-500 dark:text-orange-400" /> Top Sản phẩm bán chạy
                 </h2>
                 <div className="space-y-4">
                  {topProducts.length > 0 ? topProducts.map((p, i) => {
                    // Doanh thu ước tính của sản phẩm = Giá * Số lượng đã bán
                    const estimatedRevenue = p.sold * p.price;
                    return (
                     <div key={i} className="flex justify-between items-start text-xs border-b border-gray-50 dark:border-gray-800 pb-3 last:border-0 last:pb-0">
                        <div className="flex gap-2">
                          <span className={`font-black flex items-center justify-center w-5 h-5 rounded-full ${i === 0 ? 'bg-yellow-100 text-yellow-600' : i === 1 ? 'bg-gray-100 text-gray-500' : i === 2 ? 'bg-orange-100 text-orange-600' : 'text-gray-400'}`}>
                            {i < 3 ? <Crown className="w-3 h-3" /> : i + 1}
                          </span>
                          <div>
                            <div className="font-bold text-gray-800 dark:text-gray-200 line-clamp-2 w-[180px]">{p.name}</div>
                            <div className="text-[10px] text-gray-500 mt-1">Đã bán: <strong className="text-orange-600">{p.sold}</strong></div>
                          </div>
                        </div>
                        <div className="font-black text-red-600 dark:text-red-400 whitespace-nowrap pt-0.5">
                          {estimatedRevenue.toLocaleString("vi-VN")} ₫
                        </div>
                     </div>
                  )}) : (
                    <div className="text-center text-sm text-gray-500">Chưa có dữ liệu bán hàng.</div>
                  )}
                 </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default dynamic(() => Promise.resolve(AdminDashboard), { ssr: false });