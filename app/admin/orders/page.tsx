"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { 
  Search, Package, Truck, CheckCircle2, Clock, XCircle, Trash2, 
  ChevronLeft, ChevronRight, Eye, X, User, Phone, MapPin, CreditCard 
} from "lucide-react";
import { getOrders, deleteOrder, updateOrderStatus } from "./actions";
import toast from "react-hot-toast";

function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Tất cả");
  const [searchTerm, setSearchTerm] = useState("");
  
  // STATE CHO DRAWER CHI TIẾT
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // STATE PHÂN TRANG
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
    if (window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn đơn hàng này?")) {
      const res = await deleteOrder(id);
      if (res.success) {
        toast.success("Đã xóa đơn hàng!");
        fetchData();
        if (selectedOrder?.id === id) setSelectedOrder(null);
      } else {
        toast.error("Lỗi xóa đơn hàng.");
      }
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setIsUpdating(true);
    const res = await updateOrderStatus(orderId, newStatus);
    if (res.success) {
      toast.success(`Đã cập nhật: ${newStatus}`);
      await fetchData();
      // Cập nhật lại UI Drawer nếu đang mở
      setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }));
    } else {
      toast.error(res.error || "Có lỗi xảy ra");
    }
    setIsUpdating(false);
  };

  // Lọc dữ liệu
  const filteredOrders = orders.filter(order => {
    const matchFilter = filter === "Tất cả" || order.status === filter;
    const matchSearch = (order.customerName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || 
                        order.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchFilter && matchSearch;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [filter, searchTerm]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Chờ xác nhận": return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">Chờ xác nhận</span>;
      case "Đang xử lý": return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Đang xử lý</span>;
      case "Đang giao": return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">Đang giao</span>;
      case "Đã giao": return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Đã giao</span>;
      case "Đã hủy": return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Đã hủy</span>;
      default: return null;
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50 dark:bg-[#09090b] flex items-center justify-center font-bold text-gray-500">Đang tải đơn hàng...</div>;

  return (
    <div className="p-8 bg-gray-50 dark:bg-[#09090b] min-h-screen space-y-6 transition-colors duration-300 relative">
      
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Quản lý đơn hàng</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Có {orders.length} đơn hàng trên hệ thống</p>
      </div>

      {/* TOOLBAR */}
      <div className="bg-white dark:bg-[#18181b] p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-wrap gap-3 items-center justify-between shadow-sm">
        <div className="flex gap-2 flex-wrap">
          {["Tất cả", "Chờ xác nhận", "Đang xử lý", "Đang giao", "Đã giao", "Đã hủy"].map((tab) => (
            <button key={tab} onClick={() => setFilter(tab)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                filter === tab 
                  ? "bg-red-600 text-white shadow-md" 
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-[#09090b] border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-red-500 w-64 dark:text-white transition-all" 
            placeholder="Mã đơn, Tên KH..." />
        </div>
      </div>

      {/* BẢNG ĐƠN HÀNG */}
      <div className="bg-white dark:bg-[#18181b] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-xs uppercase font-black border-b border-gray-100 dark:border-gray-800">
              <th className="px-6 py-4">Mã Đơn</th>
              <th className="px-6 py-4">Khách Hàng</th>
              <th className="px-6 py-4">Thanh toán</th>
              <th className="px-6 py-4">Tổng Tiền</th>
              <th className="px-6 py-4">Trạng Thái</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {paginatedOrders.length > 0 ? (
              paginatedOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-sm text-gray-900 dark:text-gray-200">
                    #{order.id.slice(-8).toUpperCase()}
                    <div className="text-[10px] text-gray-400 font-medium mt-1">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{order.customerName}</p>
                    <p className="text-xs text-gray-500">{order.phone}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                      order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                    }`}>
                      {order.paymentStatus === 'paid' ? "Đã thanh toán" : "Chưa TT"}
                    </span>
                    <p className="text-[10px] text-gray-500 uppercase font-bold mt-1.5">{order.paymentMethod}</p>
                  </td>
                  <td className="px-6 py-4 font-black text-red-600 dark:text-red-400 text-sm">
                    {order.totalAmount?.toLocaleString('vi-VN')} ₫
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => setSelectedOrder(order)} className="p-2 text-blue-500 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/20 rounded-lg mr-2 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(order.id)} className="p-2 text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-900/20 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 text-sm">Không tìm thấy đơn hàng.</td></tr>
            )}
          </tbody>
        </table>

        {/* PHÂN TRANG */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900 transition-colors">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Hiển thị {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredOrders.length)} trong {filteredOrders.length}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#18181b] disabled:opacity-50">
                <ChevronLeft className="w-4 h-4 dark:text-gray-200" />
              </button>
              <span className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white">{currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#18181b] disabled:opacity-50">
                <ChevronRight className="w-4 h-4 dark:text-gray-200" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DRAWER CHI TIẾT ĐƠN HÀNG */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          <div className="relative w-full max-w-[500px] bg-white dark:bg-[#18181b] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-gray-200 dark:border-gray-800">
            
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-800">
              <div>
                <h2 className="text-lg font-black text-gray-900 dark:text-white">Chi tiết Đơn hàng</h2>
                <p className="text-xs font-bold text-gray-500 uppercase mt-1">Mã: #{selectedOrder.id.slice(-8)}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500"><X className="w-5 h-5"/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
              
              {/* Box Hành động Cập nhật */}
              <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-4 rounded-xl space-y-3">
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase mb-2">Thao tác trạng thái</h3>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => handleUpdateStatus(selectedOrder.id, "Chờ xác nhận")} disabled={isUpdating || selectedOrder.status === "Chờ xác nhận"} className="px-3 py-1.5 text-xs font-bold rounded-lg border border-orange-200 dark:border-orange-800 bg-white dark:bg-gray-800 text-orange-600 disabled:opacity-40">Chờ xác nhận</button>
                  <button onClick={() => handleUpdateStatus(selectedOrder.id, "Đang xử lý")} disabled={isUpdating || selectedOrder.status === "Đang xử lý"} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white disabled:opacity-40 shadow-sm">Xác nhận đơn (Trừ kho)</button>
                  <button onClick={() => handleUpdateStatus(selectedOrder.id, "Đang giao")} disabled={isUpdating || selectedOrder.status === "Đang giao"} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-purple-600 text-white disabled:opacity-40 shadow-sm">Giao cho ĐVVC</button>
                  <button onClick={() => handleUpdateStatus(selectedOrder.id, "Đã giao")} disabled={isUpdating || selectedOrder.status === "Đã giao"} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-green-600 text-white disabled:opacity-40 shadow-sm">Thành công</button>
                  <button onClick={() => handleUpdateStatus(selectedOrder.id, "Đã hủy")} disabled={isUpdating || selectedOrder.status === "Đã hủy"} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-600 text-white disabled:opacity-40 shadow-sm w-full mt-1">Hủy Đơn & Hoàn Kho</button>
                </div>
              </div>

              {/* Thông tin KH */}
              <div className="border border-gray-100 dark:border-gray-800 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase border-b border-gray-100 dark:border-gray-800 pb-2">Khách hàng</h3>
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><User className="w-4 h-4 text-gray-400"/> <strong>{selectedOrder.customerName}</strong></div>
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><Phone className="w-4 h-4 text-gray-400"/> {selectedOrder.phone}</div>
                <div className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"><MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0"/> <span className="leading-snug">{selectedOrder.address}</span></div>
              </div>

              {/* Thanh toán & Phí */}
              <div className="border border-gray-100 dark:border-gray-800 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase border-b border-gray-100 dark:border-gray-800 pb-2">Thanh toán</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-2"><CreditCard className="w-4 h-4"/> Phương thức</span>
                  <span className="font-bold uppercase text-gray-900 dark:text-white">{selectedOrder.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Trạng thái</span>
                  <span className="font-bold">{selectedOrder.paymentStatus === 'paid' ? <span className="text-green-600">Đã thanh toán</span> : <span className="text-orange-500">Chưa thanh toán</span>}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-dashed border-gray-200 dark:border-gray-700">
                  <span className="text-gray-500">Phí vận chuyển</span>
                  <span className="font-medium text-gray-900 dark:text-white">{selectedOrder.shippingFee > 0 ? `${selectedOrder.shippingFee.toLocaleString('vi-VN')}₫` : "Miễn phí"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Giảm giá (Voucher)</span>
                  <span className="font-medium text-red-500">-{selectedOrder.discountAmount?.toLocaleString('vi-VN')}₫</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-700 items-end">
                  <span className="font-bold text-gray-900 dark:text-white">Tổng cần thu</span>
                  <span className="text-xl font-black text-red-600">{selectedOrder.totalAmount?.toLocaleString('vi-VN')} ₫</span>
                </div>
              </div>

              {/* Sản phẩm */}
              <div className="space-y-3">
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase">Sản phẩm ({selectedOrder.items?.length})</h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-xl border border-gray-100 dark:border-gray-800">
                      <img src={item.product?.imageUrl || "/placeholder.jpg"} className="w-12 h-12 rounded-lg bg-white object-contain" alt="sp" />
                      <div className="flex-1">
                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200 line-clamp-1">{item.product?.name || "Sản phẩm không xác định"}</p>
                        <p className="text-[10px] text-gray-500 mt-1">SL: {item.quantity} x {item.price.toLocaleString('vi-VN')}₫</p>
                      </div>
                      <div className="text-sm font-black text-gray-900 dark:text-white mr-2">
                        {(item.quantity * item.price).toLocaleString('vi-VN')}₫
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default dynamic(() => Promise.resolve(OrdersPage), { ssr: false });