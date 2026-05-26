"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Search, Eye, CheckCircle, XCircle, Truck, Clock, ShieldCheck, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { getOrders, deleteOrder } from "./actions";

function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Tất cả");
  const [searchTerm, setSearchTerm] = useState("");
  
  // --- STATE PHÂN TRANG ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    setLoading(true);
    const data = await getOrders();
    setOrders(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa đơn hàng này?")) {
      await deleteOrder(id);
      fetchData();
    }
  };

  // Lọc dữ liệu
  const filteredOrders = orders.filter(order => {
    const matchFilter = filter === "Tất cả" || order.status === filter;
    const matchSearch = order.customer.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        order.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchFilter && matchSearch;
  });

  // --- LOGIC PHÂN TRANG ---
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  // Reset trang về 1 khi lọc hoặc tìm kiếm
  useEffect(() => { setCurrentPage(1); }, [filter, searchTerm]);

  if (loading) return <div className="min-h-screen bg-gray-50/50 p-8 font-bold text-gray-500">Đang tải...</div>;

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Quản lý đơn hàng</h1>
          <p className="text-sm text-gray-500">Tổng {orders.length} đơn hàng</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-wrap gap-3 items-center justify-between shadow-sm">
        <div className="flex gap-2 flex-wrap">
          {["Tất cả", "Đang xử lý", "Đã xác nhận", "Đang giao", "Đã giao", "Đã hủy"].map((tab) => (
            <button key={tab} onClick={() => setFilter(tab)}
              className={`px-4 py-2 text-xs font-bold rounded-lg ${filter === tab ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600"}`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs w-64 outline-none" 
            placeholder="Tìm mã đơn hoặc tên..." />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
              <th className="px-6 py-4">Mã Đơn</th>
              <th className="px-6 py-4">Khách Hàng</th>
              <th className="px-6 py-4">Ngày Đặt</th>
              <th className="px-6 py-4">Tổng Tiền</th>
              <th className="px-6 py-4">Trạng Thái</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedOrders.length > 0 ? (
              paginatedOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold text-sm">#{order.id.slice(-8)}</td>
                  <td className="px-6 py-4 text-sm">{order.customer}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{order.date}</td>
                  <td className="px-6 py-4 font-bold text-red-600 text-sm">{order.total}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${order.status === "Đã giao" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete(order.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500 text-sm">Không tìm thấy đơn hàng.</td></tr>
            )}
          </tbody>
        </table>

        {/* PHÂN TRANG (PAGINATION) */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <span className="text-xs text-gray-500 font-medium">
              Hiển thị {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredOrders.length)} trong tổng số {filteredOrders.length} đơn
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded-lg">{currentPage} / {totalPages}</span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50"
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

export default dynamic(() => Promise.resolve(OrdersPage), { ssr: false });