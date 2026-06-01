"use client";

import { useState, useEffect } from "react";
import { 
  Save, Truck, Ticket, Plus, Trash2, Percent, DollarSign, AlertCircle, Loader2 
} from "lucide-react";
import toast from "react-hot-toast";

// IMPORT 2 HÀM SERVER ACTIONS VỪA TẠO
import { getSettings, updateSettings } from "./actions";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("shipping");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // --- STATE DỮ LIỆU ---
  const [shippingConfig, setShippingConfig] = useState({
    defaultFee: 30000,
    freeshipThreshold: 1000000,
  });

  const [vouchers, setVouchers] = useState<any[]>([]);

  const [newVoucher, setNewVoucher] = useState({
    code: "",
    type: "fixed", 
    value: 0,
    limit: 100
  });

  // 1. TẢI DỮ LIỆU KHI VÀO TRANG
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      const res = await getSettings();
      if (res.success && res.data) {
        setShippingConfig({
          defaultFee: res.data.defaultFee,
          freeshipThreshold: res.data.freeshipThreshold
        });
        
        // Prisma lưu JSON, ta cần parse nó ra
        if (res.data.vouchers) {
          const parsedVouchers = typeof res.data.vouchers === 'string' 
            ? JSON.parse(res.data.vouchers) 
            : res.data.vouchers;
          setVouchers(Array.isArray(parsedVouchers) ? parsedVouchers : []);
        }
      } else {
        toast.error("Không thể tải cấu hình từ máy chủ!");
      }
      setIsLoading(false);
    };

    fetchInitialData();
  }, []);

  // 2. LƯU VẬN CHUYỂN
  const handleSaveShipping = async () => {
    setIsSaving(true);
    const res = await updateSettings({
      defaultFee: shippingConfig.defaultFee,
      freeshipThreshold: shippingConfig.freeshipThreshold
    });

    if (res.success) {
      toast.success("Đã lưu cấu hình vận chuyển thành công!");
    } else {
      toast.error("Lỗi khi lưu dữ liệu!");
    }
    setIsSaving(false);
  };

  // 3. LƯU VOUCHER (THÊM/XÓA)
  const syncVouchersToDB = async (updatedVouchers: any[]) => {
    setIsSaving(true);
    const res = await updateSettings({ vouchers: updatedVouchers });
    
    if (res.success) {
      setVouchers(updatedVouchers);
      toast.success("Đã cập nhật danh sách mã giảm giá!");
    } else {
      toast.error("Lỗi cập nhật Voucher!");
    }
    setIsSaving(false);
  };

  const handleAddVoucher = () => {
    if (!newVoucher.code || newVoucher.value <= 0) {
      toast.error("Vui lòng nhập mã và giá trị giảm!");
      return;
    }

    if (vouchers.some(v => v.code === newVoucher.code.toUpperCase())) {
      toast.error("Mã khuyến mãi này đã tồn tại!");
      return;
    }

    const voucher: any = {
      id: Date.now().toString(),
      code: newVoucher.code.toUpperCase(),
      type: newVoucher.type,
      value: Number(newVoucher.value),
      limit: Number(newVoucher.limit),
      used: 0
    };

    const newVouchersList = [voucher, ...vouchers];
    syncVouchersToDB(newVouchersList); 
    
    setNewVoucher({ code: "", type: "fixed", value: 0, limit: 100 });
  };

  const handleDeleteVoucher = (id: string) => {
    if (window.confirm("Bạn có chắc muốn xóa mã giảm giá này?")) {
      const newVouchersList = vouchers.filter(v => v.id !== id);
      syncVouchersToDB(newVouchersList);
    }
  };

  if (isLoading) {
    return <div className="p-10 text-center font-bold text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin"/> Đang tải cấu hình hệ thống...</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 bg-gray-50 dark:bg-[#09090b] min-h-screen transition-colors duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Cài đặt hệ thống</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">Quản lý vận chuyển, thanh toán và mã khuyến mãi</p>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800">
        <button 
          onClick={() => setActiveTab("shipping")}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === "shipping" ? "border-red-600 text-red-600 dark:text-red-500" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600"
          }`}
        >
          <Truck className="w-4 h-4" /> Vận chuyển & Thanh toán
        </button>
        <button 
          onClick={() => setActiveTab("vouchers")}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === "vouchers" ? "border-red-600 text-red-600 dark:text-red-500" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600"
          }`}
        >
          <Ticket className="w-4 h-4" /> Quản lý Voucher
        </button>
      </div>

      {/* NỘI DUNG TABS */}
      <div className="bg-white dark:bg-[#18181b] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 transition-colors duration-300">
        
        {/* TAB 1: VẬN CHUYỂN */}
        {activeTab === "shipping" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">Cấu hình này sẽ tự động áp dụng vào phần tính tiền ở trang Giỏ hàng và Thanh toán của khách hàng.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Phí ship mặc định (VNĐ)</label>
                <input 
                  type="number" 
                  value={shippingConfig.defaultFee}
                  onChange={(e) => setShippingConfig({...shippingConfig, defaultFee: Number(e.target.value)})}
                  className="w-full p-3 bg-gray-50 dark:bg-[#09090b] border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-red-500 dark:text-white font-semibold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Hạn mức Freeship (VNĐ)</label>
                <input 
                  type="number" 
                  value={shippingConfig.freeshipThreshold}
                  onChange={(e) => setShippingConfig({...shippingConfig, freeshipThreshold: Number(e.target.value)})}
                  className="w-full p-3 bg-gray-50 dark:bg-[#09090b] border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-red-500 dark:text-white font-semibold"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Đơn hàng có tổng tiền lớn hơn mức này sẽ được miễn phí vận chuyển.</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
              <button 
                onClick={handleSaveShipping}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-md shadow-red-200 dark:shadow-none disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Lưu cấu hình vận chuyển
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: VOUCHERS */}
        {activeTab === "vouchers" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* Form thêm mới */}
            <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-2xl border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-red-600 dark:text-red-500" /> Tạo mã giảm giá mới
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Mã Code (Viết liền)</label>
                  <input 
                    type="text" 
                    value={newVoucher.code}
                    onChange={(e) => setNewVoucher({...newVoucher, code: e.target.value.replace(/\s+/g, '').toUpperCase()})}
                    placeholder="VD: KHUYENMAI20"
                    className="w-full p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-red-500 text-sm font-bold uppercase bg-white dark:bg-[#09090b] dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Loại giảm giá</label>
                  <select 
                    value={newVoucher.type}
                    onChange={(e) => setNewVoucher({...newVoucher, type: e.target.value})}
                    className="w-full p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-red-500 text-sm font-bold bg-white dark:bg-[#09090b] dark:text-white"
                  >
                    <option value="fixed">Giảm tiền mặt (VNĐ)</option>
                    <option value="percent">Giảm phần trăm (%)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Mức giảm</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      {newVoucher.type === 'fixed' ? <DollarSign className="w-3.5 h-3.5 text-gray-400" /> : <Percent className="w-3.5 h-3.5 text-gray-400" />}
                    </div>
                    <input 
                      type="number" 
                      value={newVoucher.value}
                      onChange={(e) => setNewVoucher({...newVoucher, value: Number(e.target.value)})}
                      className="w-full p-2.5 pl-8 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-red-500 text-sm font-bold bg-white dark:bg-[#09090b] dark:text-white"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Số lượng mã tối đa</label>
                  <input 
                    type="number" 
                    value={newVoucher.limit}
                    onChange={(e) => setNewVoucher({...newVoucher, limit: Number(e.target.value)})}
                    className="w-full p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-red-500 text-sm font-bold bg-white dark:bg-[#09090b] dark:text-white"
                  />
                </div>
              </div>
              <button 
                onClick={handleAddVoucher}
                disabled={isSaving}
                className="mt-4 flex items-center gap-2 px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold rounded-xl hover:bg-black dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Thêm Voucher
              </button>
            </div>

            {/* Danh sách Vouchers */}
            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">Danh sách Voucher đang hoạt động</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                      <th className="p-3 rounded-tl-lg">Mã Khuyến Mãi</th>
                      <th className="p-3">Loại giảm</th>
                      <th className="p-3">Mức giảm</th>
                      <th className="p-3">Đã dùng / Tổng</th>
                      <th className="p-3 text-right rounded-tr-lg">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vouchers.map((v) => (
                      <tr key={v.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="p-3 font-black text-red-600 dark:text-red-400">{v.code}</td>
                        <td className="p-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {v.type === 'fixed' ? <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-[10px]">Tiền mặt</span> : <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded text-[10px]">Phần trăm</span>}
                        </td>
                        <td className="p-3 text-sm font-bold text-gray-900 dark:text-white">
                          {v.type === 'fixed' ? `${v.value.toLocaleString("vi-VN")} ₫` : `${v.value}%`}
                        </td>
                        <td className="p-3 text-sm">
                          <span className="font-bold text-gray-900 dark:text-white">{v.used}</span> <span className="text-gray-400">/ {v.limit}</span>
                        </td>
                        <td className="p-3 text-right">
                          <button 
                            onClick={() => handleDeleteVoucher(v.id)} 
                            disabled={isSaving}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {vouchers.length === 0 && <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-6">Chưa có mã giảm giá nào.</p>}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}