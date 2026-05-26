"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { 
  Eye, EyeOff, Lock, Mail, User, Phone, 
  ArrowLeft, MapPin, Building2, Map, Navigation 
} from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import { registerUser } from "@/app/actions/auth";

export default function AuthPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mở rộng State để khớp với Schema mới
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    city: "",
    district: "",
    ward: "",
    address: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (authMode === "register") {
      const result = await registerUser(formData);
      if (result.success) {
        alert("🎉 Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.");
        setAuthMode("login");
      } else {
        alert(result.error);
      }
    } else {
      const result = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (result?.error) {
        alert("Sai email hoặc mật khẩu! Vui lòng thử lại.");
      } else {
        router.push("/");
        router.refresh(); 
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/80 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-red-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

      <Link href="/" className="absolute top-6 left-6 md:left-12 flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#d70018] transition-colors bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm z-10">
        <ArrowLeft className="w-4 h-4" /> Về trang chủ
      </Link>

      {/* Box Form: Mở rộng width khi ở chế độ đăng ký để chứa form 2 cột */}
      <div className={`relative z-10 w-full bg-white rounded-3xl border border-gray-200/80 p-6 md:p-10 shadow-2xl transition-all duration-300 ${authMode === "register" ? "max-w-2xl" : "max-w-md"}`}>
        
        <div className="text-center space-y-3 mb-8">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-black tracking-tighter text-[#d70018] uppercase italic drop-shadow-sm">
              BlurSetup
            </span>
          </Link>
          <p className="text-sm text-gray-500 font-medium">
            {authMode === "login" 
              ? "Đăng nhập để quản lý không gian setup của bạn" 
              : "Tạo tài khoản để nhận ngay nhiều ưu đãi hấp dẫn"}
          </p>
        </div>

        <div className="flex p-1 bg-gray-100/80 rounded-xl mb-8">
          <button onClick={() => setAuthMode("login")} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${authMode === "login" ? "bg-white text-[#d70018] shadow-sm" : "text-gray-500 hover:text-gray-900"}`}>Đăng nhập</button>
          <button onClick={() => setAuthMode("register")} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${authMode === "register" ? "bg-white text-[#d70018] shadow-sm" : "text-gray-500 hover:text-gray-900"}`}>Đăng ký</button>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          
          {/* CÁC TRƯỜNG NHẬP LIỆU */}
          <div className={`grid gap-5 ${authMode === "register" ? "md:grid-cols-2" : "grid-cols-1"}`}>
            
            {/* Cột 1: Thông tin bắt buộc */}
            <div className="space-y-5">
              {authMode === "register" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Họ và tên <span className="text-red-500">*</span></label>
                    <div className="relative flex items-center">
                      <User className="absolute left-3 w-4 h-4 text-gray-400" />
                      <input type="text" required placeholder="Nhập họ và tên" 
                        value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full text-sm pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-[#d70018] focus:ring-4 focus:ring-red-500/10 transition-all placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Số điện thoại <span className="text-red-500">*</span></label>
                    <div className="relative flex items-center">
                      <Phone className="absolute left-3 w-4 h-4 text-gray-400" />
                      <input type="tel" required placeholder="09xx xxx xxx" 
                        value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full text-sm pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-[#d70018] focus:ring-4 focus:ring-red-500/10 transition-all placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Địa chỉ Email <span className="text-red-500">*</span></label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 w-4 h-4 text-gray-400" />
                  <input type="email" required placeholder="username@gmail.com" 
                    value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full text-sm pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-[#d70018] focus:ring-4 focus:ring-red-500/10 transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Mật khẩu <span className="text-red-500">*</span></label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 w-4 h-4 text-gray-400" />
                  <input type={showPassword ? "text" : "password"} required placeholder="••••••••" 
                    value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full text-sm pl-10 pr-12 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-[#d70018] focus:ring-4 focus:ring-red-500/10 transition-all placeholder:text-gray-400"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 text-gray-400 hover:text-[#d70018] outline-none transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Cột 2: Thông tin giao hàng (Chỉ hiện khi Đăng ký) */}
            {authMode === "register" && (
              <div className="space-y-5 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-[#d70018]" />
                  <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider">Thông tin giao hàng <span className="text-gray-400 normal-case font-medium text-[10px]">(Tùy chọn)</span></h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-500">Tỉnh / Thành phố</label>
                    <div className="relative flex items-center">
                      <Building2 className="absolute left-3 w-3.5 h-3.5 text-gray-400" />
                      <input type="text" placeholder="VD: Hồ Chí Minh" 
                        value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})}
                        className="w-full text-sm pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg outline-none focus:border-[#d70018] transition-all placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-500">Quận / Huyện</label>
                    <div className="relative flex items-center">
                      <Map className="absolute left-3 w-3.5 h-3.5 text-gray-400" />
                      <input type="text" placeholder="VD: Quận 1" 
                        value={formData.district} onChange={(e) => setFormData({...formData, district: e.target.value})}
                        className="w-full text-sm pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg outline-none focus:border-[#d70018] transition-all placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500">Phường / Xã</label>
                  <div className="relative flex items-center">
                    <Navigation className="absolute left-3 w-3.5 h-3.5 text-gray-400" />
                    <input type="text" placeholder="VD: Phường Bến Nghé" 
                      value={formData.ward} onChange={(e) => setFormData({...formData, ward: e.target.value})}
                      className="w-full text-sm pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg outline-none focus:border-[#d70018] transition-all placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500">Số nhà, Tên đường</label>
                  <textarea placeholder="VD: 123 Đường Lê Lợi..." rows={2}
                    value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full text-sm p-3 bg-white border border-gray-200 rounded-lg outline-none focus:border-[#d70018] transition-all placeholder:text-gray-400 resize-none custom-scrollbar"
                  />
                </div>
              </div>
            )}
          </div>

          {authMode === "login" && (
            <div className="flex justify-end pt-2">
              <Link href="#" className="text-xs font-bold text-gray-500 hover:text-[#d70018] transition-colors">
                Quên mật khẩu?
              </Link>
            </div>
          )}

          <Button type="submit" disabled={isLoading} className="w-full py-6 rounded-xl font-black text-[15px] bg-[#d70018] hover:bg-[#b00014] text-white transition-all shadow-lg shadow-red-500/20 mt-4">
            {isLoading ? "Đang xử lý..." : (authMode === "login" ? "Đăng nhập ngay" : "Tạo tài khoản")}
          </Button>
        </form>

        <div className="relative flex items-center justify-center mt-8 mb-6">
          <div className="border-t border-gray-200 w-full" />
          <span className="absolute bg-white px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Hoặc tiếp tục với</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 text-xs font-bold text-gray-700 transition-all shadow-sm">
            <FcGoogle className="w-5 h-5" /> Google
          </button>
          <button className="flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-[#1877F2]/20 text-xs font-bold text-gray-700 transition-all shadow-sm">
            <FaFacebook className="w-5 h-5 text-[#1877F2]" /> Facebook
          </button>
        </div>

      </div>
    </div>
  );
}