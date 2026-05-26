"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { 
  Search, MoreHorizontal, UserCheck, UserX, Phone, Mail, MapPin, 
  ShieldAlert, Key, Pencil, Trash2, X, ChevronLeft, ChevronRight, Calendar
} from "lucide-react";
import { 
  getCustomers, toggleCustomerStatus, deleteCustomer, updateCustomerProfile, resetCustomerPassword 
} from "./actions";

import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuGroup, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- LOGIC PHÂN TRANG ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- QUẢN LÝ DRAWER ---
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"view" | "edit">("view");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  
  // States cho Form Cập nhật
  const [formData, setFormData] = useState({ name: "", phone: "", address: "", city: "", district: "", ward: "" });
  const [newPassword, setNewPassword] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const data = await getCustomers();
    setCustomers(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // Filter
  const filteredCustomers = customers.filter(cus => 
    cus.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    cus.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cus.phone.includes(searchTerm)
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + itemsPerPage);

  // Reset trang khi tìm kiếm
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const openDrawer = (customer: any, mode: "view" | "edit") => {
    setSelectedCustomer(customer);
    setDrawerMode(mode);
    if (mode === "edit") {
      setFormData({
        name: customer.name, phone: customer.phone === "Chưa cập nhật" ? "" : customer.phone,
        address: customer.address || "", city: customer.city || "", district: customer.district || "", ward: customer.ward || ""
      });
    }
    setNewPassword(""); // Xóa trắng ô password mỗi khi mở drawer
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => { setIsDrawerOpen(false); setSelectedCustomer(null); };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    if (window.confirm(`Bạn có chắc chắn muốn ${currentStatus ? "Khóa" : "Mở khóa"} tài khoản này?`)) {
      const res = await toggleCustomerStatus(id, currentStatus);
      if (res.success) fetchData(); else alert(res.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("CẢNH BÁO: Bạn đang xóa vĩnh viễn khách hàng này. Xác nhận?")) {
      const res = await deleteCustomer(id);
      if (res.success) fetchData(); else alert(res.error);
    }
  };

  // Cập nhật thông tin VÀ mật khẩu cùng lúc
  const handleUpdateProfile = async () => {
    if (!formData.name) return alert("Tên không được để trống!");
    setIsSubmitting(true);
    
    // 1. Cập nhật thông tin chung
    const resInfo = await updateCustomerProfile(selectedCustomer.id, formData);
    if (!resInfo.success) {
      alert(resInfo.error);
      setIsSubmitting(false);
      return;
    }

    // 2. Cập nhật mật khẩu nếu Admin có nhập vào ô
    if (newPassword.trim() !== "") {
      if (newPassword.length < 6) {
        alert("Thông tin đã lưu, nhưng Mật khẩu mới phải có ít nhất 6 ký tự!");
        setIsSubmitting(false);
        return;
      }
      const resPw = await resetCustomerPassword(selectedCustomer.id, newPassword);
      if (!resPw.success) {
        alert(resPw.error);
        setIsSubmitting(false);
        return;
      }
    }

    alert("Cập nhật thông tin khách hàng thành công!");
    closeDrawer();
    fetchData();
    setIsSubmitting(false);
  };

  if (loading) return <div className="p-8 min-h-screen bg-gray-50/50 font-bold text-gray-500">Đang tải dữ liệu...</div>;

  return (
    <div className="p-8 bg-gray-50/50 min-h-screen space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Quản lý khách hàng</h1>
          <p className="text-sm text-gray-500 font-medium">Hệ thống đang có {customers.length} tài khoản thành viên</p>
        </div>
      </div>

      {/* THANH CÔNG CỤ */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 flex justify-between items-center shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input 
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-red-500 w-72" 
            placeholder="Tìm tên, email hoặc số điện thoại..." 
          />
        </div>
      </div>

      {/* BẢNG DỮ LIỆU */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-wider">
              <th className="px-6 py-4 font-black">Khách hàng</th>
              <th className="px-6 py-4 font-black">Liên hệ</th>
              <th className="px-6 py-4 font-black">Tham gia</th>
              <th className="px-6 py-4 font-black">Trạng thái</th>
              <th className="px-6 py-4 font-black text-right">Tùy chọn</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedCustomers.length > 0 ? paginatedCustomers.map((cus) => (
              <tr key={cus.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-black text-xs uppercase shadow-sm border border-red-200">
                      {cus.avatar ? <img src={cus.avatar} className="w-full h-full rounded-full object-cover" alt="avt" /> : cus.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">{cus.name}</div>
                      <div className="text-xs text-gray-500">{cus.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs font-medium text-gray-600 flex items-center gap-2 mt-2"><Phone className="w-3.5 h-3.5" /> {cus.phone}</td>
                <td className="px-6 py-4 text-gray-500 text-sm font-medium">{cus.joined}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-md ${cus.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                    {cus.isActive ? <UserCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                    {cus.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="p-2 hover:bg-gray-100 rounded-lg outline-none cursor-pointer"><MoreHorizontal className="w-4 h-4" /></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 p-1 bg-white rounded-xl shadow-xl border border-gray-100">
                      <DropdownMenuGroup>
                        <DropdownMenuItem onClick={() => openDrawer(cus, "view")} className="text-xs font-bold cursor-pointer py-2 hover:text-red-600"><UserCheck className="w-3.5 h-3.5 mr-2" /> Xem chi tiết</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openDrawer(cus, "edit")} className="text-xs font-bold cursor-pointer py-2 hover:text-red-600"><Pencil className="w-3.5 h-3.5 mr-2" /> Cập nhật</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleToggleStatus(cus.id, cus.isActive)} className={`text-xs font-bold cursor-pointer py-2 ${cus.isActive ? "text-amber-600" : "text-green-600"}`}>
                          {cus.isActive ? <UserX className="w-3.5 h-3.5 mr-2" /> : <UserCheck className="w-3.5 h-3.5 mr-2" />}
                          {cus.isActive ? "Khóa tài khoản" : "Mở khóa"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(cus.id)} className="text-xs font-bold cursor-pointer py-2 text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5 mr-2" /> Xóa vĩnh viễn</DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-sm font-medium text-gray-500">Không tìm thấy khách hàng.</td></tr>
            )}
          </tbody>
        </table>

        {/* PHÂN TRANG (PAGINATION) CHUẨN */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <span className="text-xs text-gray-500 font-medium">
              Hiển thị {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredCustomers.length)} trong tổng số {filteredCustomers.length} khách hàng
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded-lg">{currentPage} / {totalPages}</span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DRAWER (XEM CHI TIẾT & CẬP NHẬT) */}
      {isDrawerOpen && selectedCustomer && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeDrawer} />
          <div className="relative w-full max-w-md bg-white h-full p-6 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-xl font-black text-gray-900">
                {drawerMode === "view" ? "Hồ sơ khách hàng" : "Cập nhật dữ liệu"}
              </h2>
              <button onClick={closeDrawer} className="p-1.5 hover:bg-gray-100 rounded-full transition"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              
              {/* === GIAO DIỆN XEM CHI TIẾT (GIỐNG TRANG PROFILE) === */}
              {drawerMode === "view" && (
                <div className="space-y-6">
                  <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="w-24 h-24 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-black text-3xl shadow-inner border-4 border-white mb-4">
                      {selectedCustomer.avatar ? <img src={selectedCustomer.avatar} className="w-full h-full rounded-full object-cover" alt="avt" /> : selectedCustomer.name.charAt(0)}
                    </div>
                    <h3 className="font-black text-gray-900 text-xl">{selectedCustomer.name}</h3>
                    <p className="text-sm text-gray-500 font-medium mt-1">{selectedCustomer.email}</p>
                    <span className={`mt-3 px-3 py-1 text-[10px] font-bold rounded-full ${selectedCustomer.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {selectedCustomer.isActive ? "Đang hoạt động" : "Bị khóa"}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Thông tin liên hệ</h4>
                    <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl">
                      <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Phone className="w-4 h-4" /></div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400">Số điện thoại</p>
                        <p className="text-sm font-bold text-gray-900">{selectedCustomer.phone}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl">
                      <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><MapPin className="w-4 h-4" /></div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400">Địa chỉ giao hàng</p>
                        <p className="text-sm font-bold text-gray-900 leading-tight">
                          {selectedCustomer.address ? `${selectedCustomer.address}, ${selectedCustomer.ward}, ${selectedCustomer.district}, ${selectedCustomer.city}` : "Chưa cập nhật địa chỉ"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl">
                      <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><Calendar className="w-4 h-4" /></div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400">Ngày tham gia</p>
                        <p className="text-sm font-bold text-gray-900">{selectedCustomer.joined}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* === GIAO DIỆN CẬP NHẬT (GỘP CHUNG INFO & ĐỔI MK) === */}
              {drawerMode === "edit" && (
                <div className="space-y-6 pb-6">
                  {/* Sửa thông tin */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-black text-gray-900 flex items-center gap-2"><UserCheck className="w-4 h-4 text-red-600" /> Sửa thông tin cá nhân</h4>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Tên khách hàng</label>
                      <input className="w-full p-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl text-sm outline-none focus:border-red-500 transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Số điện thoại</label>
                      <input className="w-full p-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl text-sm outline-none focus:border-red-500 transition-all" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">Tỉnh/Thành phố</label>
                        <input className="w-full p-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl text-sm outline-none focus:border-red-500 transition-all" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">Quận/Huyện</label>
                        <input className="w-full p-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl text-sm outline-none focus:border-red-500 transition-all" value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Phường/Xã</label>
                      <input className="w-full p-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl text-sm outline-none focus:border-red-500 transition-all" value={formData.ward} onChange={e => setFormData({...formData, ward: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Số nhà, Tên đường</label>
                      <textarea rows={2} className="w-full p-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl text-sm outline-none focus:border-red-500 resize-none transition-all" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                    </div>
                  </div>

                  <div className="h-px bg-gray-100 my-2"></div>

                  {/* Đổi mật khẩu mới */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-black text-gray-900 flex items-center gap-2"><Key className="w-4 h-4 text-amber-500" /> Cấp lại mật khẩu</h4>
                    <p className="text-[10px] text-gray-500 italic">Bỏ trống nếu không muốn đổi mật khẩu của khách.</p>
                    <div className="space-y-1">
                      <input 
                        type="text" 
                        className="w-full p-3 border border-gray-200 bg-amber-50/30 focus:bg-white rounded-xl text-sm outline-none focus:border-amber-500 transition-all placeholder:text-gray-400" 
                        placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)..." 
                        value={newPassword} 
                        onChange={e => setNewPassword(e.target.value)} 
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {drawerMode === "edit" && (
              <div className="pt-4 border-t border-gray-100 mt-2 bg-white">
                <button onClick={handleUpdateProfile} disabled={isSubmitting} className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-sm shadow-md transition-all disabled:opacity-70">
                  {isSubmitting ? "Đang lưu hệ thống..." : "Lưu tất cả thay đổi"}
                </button>
              </div>
            )}
            
          </div>
        </div>
      )}

    </div>
  );
}

export default dynamic(() => Promise.resolve(CustomersPage), { ssr: false });