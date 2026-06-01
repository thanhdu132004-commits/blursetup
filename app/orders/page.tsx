"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Package, Truck, CheckCircle2, Clock, XCircle, ArrowLeft, Store } from "lucide-react";

// Import hàm lấy dữ liệu thật từ DB
import { getUserOrders } from "./actions";

const TABS = ["Tất cả", "Chờ xác nhận", "Đang xử lý", "Đang giao", "Đã giao", "Đã hủy"];

function OrderHistoryPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [activeTab, setActiveTab] = useState("Tất cả");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // GỌI API LẤY DỮ LIỆU THẬT KHI TRANG LOAD
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
      return;
    }

    const fetchOrders = async () => {
      if (session?.user) {
        const userId = (session.user as any).id;
        const res = await getUserOrders(userId);
        
        if (res.success) {
          setOrders(res.data);
        }
      }
      setLoading(false);
    };

    if (status === "authenticated") {
      fetchOrders();
    }
  }, [session, status, router]);

  // LỌC ĐƠN HÀNG THEO TAB TRẠNG THÁI
  const filteredOrders = activeTab === "Tất cả" 
    ? orders 
    : orders.filter(order => order.status === activeTab);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Chờ xác nhận": return <Clock className="w-4 h-4 text-orange-500" />;
      case "Đang xử lý": return <Package className="w-4 h-4 text-blue-500" />;
      case "Đang giao": return <Truck className="w-4 h-4 text-purple-500" />;
      case "Đã giao": return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "Đã hủy": return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading || status === "loading") {
    return <div className="min-h-screen bg-[#f4f6f8] dark:bg-[#09090b] flex items-center justify-center font-bold text-gray-500">Đang tải lịch sử đơn hàng...</div>;
  }

  return (
    <div className="bg-[#f4f6f8] dark:bg-[#09090b] min-h-screen pb-16 pt-6 transition-colors duration-300">
      <div className="max-w-[1000px] mx-auto px-4 md:px-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/profile" className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </Link>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-gray-100">Đơn hàng của tôi</h1>
        </div>

        {/* Thanh Tabs */}
        <div className="bg-white dark:bg-[#18181b] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex overflow-x-auto custom-scrollbar">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[120px] py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab 
                  ? "border-[#d70018] text-[#d70018] dark:text-red-400" 
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Danh sách đơn hàng */}
        <div className="space-y-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map(order => (
              <div key={order.id} className="bg-white dark:bg-[#18181b] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-md transition-shadow">
                
                {/* Header đơn hàng */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-wrap gap-2 items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <Store className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">BlurSetup Official</span>
                    <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[10px] font-bold rounded-md">
                      Mã: {order.id.slice(-8).toUpperCase()} {/* Chỉ lấy 8 số cuối cho gọn */}
                    </span>
                    {/* Badge trạng thái thanh toán */}
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                      order.paymentStatus === 'paid' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                    }`}>
                      {order.paymentStatus === 'paid' ? "Đã thanh toán" : "Chưa thanh toán"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-bold uppercase" style={{
                    color: order.status === "Đã giao" ? "#10b981" : 
                           order.status === "Đã hủy" ? "#ef4444" : "#f97316"
                  }}>
                    {getStatusIcon(order.status)} {order.status}
                  </div>
                </div>

                {/* Danh sách sản phẩm trong đơn */}
                <div className="p-4 space-y-4">
                  {order.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-4 items-center">
                      <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-2 flex-shrink-0">
                        <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-contain dark:mix-blend-normal mix-blend-multiply" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 line-clamp-2">{item.product.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Số lượng: x{item.quantity}</p>
                      </div>
                      <div className="text-sm font-bold text-[#d70018] dark:text-red-400">
                        {item.price.toLocaleString("vi-VN")} ₫
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer đơn hàng: Tổng tiền & Hành động */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-4 bg-gray-50/30 dark:bg-gray-800/20">
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    Ngày đặt: {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                  </div>
                  <div className="flex items-center gap-4 ml-auto">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Thành tiền: <span className="text-lg font-black text-[#d70018] dark:text-red-400 ml-1">{order.totalAmount.toLocaleString("vi-VN")} ₫</span>
                    </div>
                    {/* Nút hành động */}
                    {order.status === "Đã giao" && (
                      <button className="px-5 py-2 bg-[#d70018] hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors">
                        Mua lại
                      </button>
                    )}
                    {order.status === "Chờ xác nhận" && order.paymentStatus === "pending" && (
                      <button className="px-5 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-lg transition-colors">
                        Hủy đơn
                      </button>
                    )}
                  </div>
                </div>

              </div>
            ))
          ) : (
            <div className="bg-white dark:bg-[#18181b] rounded-2xl border border-gray-100 dark:border-gray-800 p-12 text-center flex flex-col items-center justify-center transition-colors duration-300">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 mb-4">
                <Package className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Chưa có đơn hàng nào</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Bạn chưa có đơn hàng nào trong trạng thái này.</p>
              <Link href="/">
                <button className="px-6 py-2.5 bg-[#d70018] text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors">
                  Tiếp tục mua sắm
                </button>
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(OrderHistoryPage), { ssr: false });