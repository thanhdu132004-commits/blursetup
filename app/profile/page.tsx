"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  User, Mail, Phone, MapPin, Camera, ShieldCheck, 
  ShoppingBag, LogOut, ChevronRight, Save
} from "lucide-react";
import { getUserProfile, updateUserProfile } from "./actions";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: "", phone: "", address: "", city: "", district: "", ward: "", avatar: ""
  });

  useEffect(() => {
    // Nếu chưa đăng nhập thì đẩy ra trang auth
    if (status === "unauthenticated") {
      router.push("/auth");
    }

    async function loadData() {
      if (session?.user) {
        const userId = (session.user as any).id;
        const data = await getUserProfile(userId);
        if (data) {
          setUser(data);
          setFormData({
            name: data.name || "",
            phone: data.phone || "",
            address: data.address || "",
            city: data.city || "",
            district: data.district || "",
            ward: data.ward || "",
            avatar: data.avatar || "",
          });
        }
        setLoading(false);
      }
    }
    if (status === "authenticated") loadData();
  }, [session, status, router]);

  const handleSave = async () => {
    setSaving(true);
    const res = await updateUserProfile(user.id, formData);
    if (res.success) {
      alert(res.message);
      window.location.reload(); // Load lại để update avatar trên navbar
    } else {
      alert(res.error);
    }
    setSaving(false);
  };

  if (loading || status === "loading") {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-500">Đang tải hồ sơ...</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 mb-6">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-3 flex items-center gap-2 text-xs font-medium text-gray-500">
          <Link href="/" className="hover:text-red-600 transition-colors">Trang chủ</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-900 font-bold">Thông tin tài khoản</span>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        
        {/* CỘT TRÁI: MENU NAVIGATION */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 flex items-center gap-4 border-b border-gray-100">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-black text-xl overflow-hidden relative border-2 border-white shadow-sm">
              {user.avatar ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" /> : user.name.charAt(0)}
            </div>
            <div>
              <div className="font-bold text-gray-900 text-sm">{user.name}</div>
              <div className="flex items-center gap-1 text-xs text-green-600 font-bold mt-0.5">
                <ShieldCheck className="w-3 h-3" /> Thành viên
              </div>
            </div>
          </div>
          <div className="p-2 space-y-1">
            <Link href="/profile" className="flex items-center gap-3 px-4 py-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold transition-colors">
              <User className="w-4 h-4" /> Thông tin tài khoản
            </Link>
            <Link href="/orders" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl text-sm font-semibold transition-colors">
              <ShoppingBag className="w-4 h-4" /> Quản lý đơn hàng
            </Link>
            <button onClick={() => signOut()} className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl text-sm font-semibold transition-colors">
              <LogOut className="w-4 h-4" /> Đăng xuất
            </button>
          </div>
        </div>

        {/* CỘT PHẢI: FORM CHỈNH SỬA */}
        <div className="md:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
            <div className="border-b border-gray-100 pb-4 mb-6">
              <h2 className="text-xl font-black text-gray-900 uppercase">Hồ Sơ Của Tôi</h2>
              <p className="text-sm text-gray-500 font-medium mt-1">Quản lý thông tin hồ sơ để bảo mật tài khoản</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form Input */}
              <div className="lg:col-span-2 space-y-5">
                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-bold text-gray-600 text-right">Email đăng nhập</label>
                  <div className="flex-1 flex items-center gap-2 text-sm font-medium text-gray-500 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100">
                    <Mail className="w-4 h-4" /> {user.email} (Không thể thay đổi)
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-bold text-gray-600 text-right">Họ và Tên</label>
                  <input 
                    type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all" 
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-bold text-gray-600 text-right">Số điện thoại</label>
                  <input 
                    type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Thêm số điện thoại"
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all" 
                  />
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2"><MapPin className="w-4 h-4 text-red-600" /> Sổ địa chỉ giao hàng</h3>
                  <div className="space-y-4 ml-0 md:ml-[144px]">
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="Tỉnh / Thành phố" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500" />
                      <input type="text" value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} placeholder="Quận / Huyện" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500" />
                    </div>
                    <input type="text" value={formData.ward} onChange={e => setFormData({...formData, ward: e.target.value})} placeholder="Phường / Xã" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500" />
                    <textarea rows={2} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Số nhà, Tên đường cụ thể..." className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 resize-none" />
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <div className="w-32 hidden md:block"></div>
                  <button onClick={handleSave} disabled={saving} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition shadow-md disabled:opacity-70">
                    <Save className="w-4 h-4" /> {saving ? "Đang lưu..." : "Lưu Thay Đổi"}
                  </button>
                </div>
              </div>

              {/* Avatar Upload */}
              <div className="flex flex-col items-center justify-center border-t lg:border-t-0 lg:border-l border-gray-100 pt-8 lg:pt-0">
                <div className="w-28 h-28 rounded-full border-4 border-gray-50 shadow-lg overflow-hidden relative group bg-gray-100 flex items-center justify-center text-4xl font-black text-gray-400 mb-4">
                  {formData.avatar ? <img src={formData.avatar} alt="avatar" className="w-full h-full object-cover" /> : user.name.charAt(0)}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                </div>
                <input 
                  type="text" 
                  placeholder="Dán link ảnh avatar vào đây..." 
                  value={formData.avatar} 
                  onChange={e => setFormData({...formData, avatar: e.target.value})}
                  className="w-full max-w-[200px] text-center text-xs px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-red-500 bg-gray-50"
                />
                <p className="text-[10px] text-gray-400 mt-2 text-center max-w-[200px]">Dùng URL ảnh tạm thời do hệ thống chưa có tính năng upload file ảnh trực tiếp.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}