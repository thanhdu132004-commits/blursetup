"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Package, Truck, CheckCircle2, Clock, XCircle, ArrowLeft, ChevronRight, Store } from "lucide-react";

// Dữ liệu mẫu (Thay thế bằng API Prisma sau)
const mockOrders = [
  {
    id: "ORD-982341",
    date: "2026-05-24T14:30:00",
    status: "Đang giao", // Các trạng thái: "Chờ xác nhận", "Đang xử lý", "Đang giao", "Đã giao", "Đã hủy"
    total: 31490000,
    items: [
      { name: "Laptop Gaming Acer Predator", price: 29990000, qty: 1, image: "/images/banner1.jpg" },
      { name: "Chuột Logitech G Pro X Superlight", price: 1500000, qty: 1, image: "/images/banner2.jpg" }
    ]
  },
  {
    id: "ORD-102938",
    date: "2026-05-10T09:15:00",
    status: "Đã giao",
    total: 850000,
    items: [
      { name: "Bàn phím cơ Keychron K8 Pro", price: 850000, qty: 1, image: "/images/banner3.jpg" }
    ]
  },
  {
    id: "ORD-456123",
    date: "2026-05-25T10:00:00",
    status: "Chờ xác nhận",
    total: 4500000,
    items: [
      { name: "Màn hình Dell UltraSharp 24 inch", price: 4500000, qty: 1, image: "/placeholder.jpg" }
    ]
  }
];

const TABS = ["Tất cả", "Chờ xác nhận", "Đang xử lý", "Đang giao", "Đã giao", "Đã hủy"];

function OrderHistoryPage() {
  const [activeTab, setActiveTab] = useState("Tất cả");

  // Lọc đơn hàng theo Tab
  const filteredOrders = activeTab === "Tất cả" 
    ? mockOrders 
    : mockOrders.filter(order => order.status === activeTab);

  // Hàm render Icon trạng thái
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

  return (
    <div className="bg-[#f4f6f8] min-h-screen pb-16 pt-6">
      <div className="max-w-[1000px] mx-auto px-4 md:px-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/profile" className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>
          <h1 className="text-xl md:text-2xl font-black text-gray-900">Đơn hàng của tôi</h1>
        </div>

        {/* Thanh Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex overflow-x-auto custom-scrollbar">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[120px] py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab 
                  ? "border-[#d70018] text-[#d70018]" 
                  : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50"
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
              <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                
                {/* Header đơn hàng */}
                <div className="p-4 border-b border-gray-100 flex flex-wrap gap-2 items-center justify-between bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <Store className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-bold text-gray-900">BlurSetup Official</span>
                    <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-[10px] font-bold rounded-md">
                      Mã: {order.id}
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
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-center">
                      <div className="w-20 h-20 bg-gray-50 rounded-xl border border-gray-100 p-2 flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-gray-800 line-clamp-2">{item.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">Số lượng: x{item.qty}</p>
                      </div>
                      <div className="text-sm font-bold text-[#d70018]">
                        {item.price.toLocaleString("vi-VN")} ₫
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer đơn hàng: Tổng tiền & Hành động */}
                <div className="p-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4 bg-gray-50/30">
                  <div className="text-sm text-gray-500 font-medium">
                    Ngày đặt: {new Date(order.date).toLocaleDateString("vi-VN")}
                  </div>
                  <div className="flex items-center gap-4 ml-auto">
                    <div className="text-sm font-medium text-gray-600">
                      Thành tiền: <span className="text-lg font-black text-[#d70018] ml-1">{order.total.toLocaleString("vi-VN")} ₫</span>
                    </div>
                    {/* Nút hành động tùy theo trạng thái */}
                    {order.status === "Đã giao" && (
                      <button className="px-5 py-2 bg-[#d70018] hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors">
                        Mua lại
                      </button>
                    )}
                    {order.status === "Chờ xác nhận" && (
                      <button className="px-5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-lg transition-colors">
                        Hủy đơn
                      </button>
                    )}
                  </div>
                </div>

              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
                <Package className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Chưa có đơn hàng nào</h2>
              <p className="text-sm text-gray-500 mb-6">Bạn chưa có đơn hàng nào trong trạng thái này.</p>
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