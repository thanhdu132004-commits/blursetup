// components/layout/footer.tsx
import Link from "next/link";
import { PhoneCall, ShieldCheck, Truck, HeadphonesIcon, MapPin } from "lucide-react";

// Import các icon mạng xã hội chính thức từ gói react-icons
import { FaFacebookF, FaInstagram, FaTiktok } from "react-icons/fa6";
import { SiZalo } from "react-icons/si";

export function Footer() {
  return (
    <footer className="w-full bg-white dark:bg-[#09090b] border-t border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 pt-12 pb-6 mt-16 transition-colors duration-300">
      
      {/* CONTAINER CHÍNH GIỚI HẠN 1200PX ĐỒNG BỘ VỚI TRANG CHỦ */}
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 space-y-12">
        
        {/* LƯỚI THÔNG TIN: 4 CỘT */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 items-start">
          
          {/* CỘT 1: TỔNG ĐÀI & ĐỊA CHỈ */}
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <span className="font-black text-2xl tracking-tighter uppercase italic text-[#d70018]">BlurSetup</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
              Hệ thống bán lẻ thiết bị công nghệ, PC, Laptop và Hi-end Gear hàng đầu dành cho Gamer và Creator.
            </p>
            
            <ul className="space-y-3 text-xs text-gray-600 dark:text-gray-400 pt-2">
              <li>
                <span className="block font-bold text-gray-900 dark:text-gray-100 mb-1">Tổng đài hỗ trợ (7h30 - 22h00)</span>
                <Link href="tel:18002097" className="text-lg font-black text-[#d70018] dark:text-red-500 hover:underline flex items-center gap-1.5">
                  <PhoneCall className="w-4 h-4" /> 1800.2097
                </Link>
              </li>
              <li className="flex items-start gap-2 pt-2">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">Khu Công Nghệ Cao, Thành phố Hồ Chí Minh, Việt Nam</span>
              </li>
            </ul>
          </div>

          {/* CỘT 2: THÔNG TIN VÀ CHÍNH SÁCH */}
          <div className="space-y-5">
            <h3 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Thông tin & Chính sách
            </h3>
            <ul className="space-y-3 text-xs font-medium text-gray-600 dark:text-gray-400">
              <li><Link href="#" className="hover:text-[#d70018] dark:hover:text-red-400 transition-colors flex items-center gap-2">Mua hàng và thanh toán Online</Link></li>
              <li><Link href="#" className="hover:text-[#d70018] dark:hover:text-red-400 transition-colors">Chính sách giao hàng tận nơi</Link></li>
              <li><Link href="#" className="hover:text-[#d70018] dark:hover:text-red-400 transition-colors">Chính sách đổi trả & bảo hành 1-đổi-1</Link></li>
              <li><Link href="#" className="hover:text-[#d70018] dark:hover:text-red-400 transition-colors">Tra cứu hóa đơn điện tử VAT</Link></li>
              <li><Link href="#" className="hover:text-[#d70018] dark:hover:text-red-400 transition-colors">Hệ thống bảo hành ủy quyền chính hãng</Link></li>
              <li><Link href="#" className="hover:text-[#d70018] dark:hover:text-red-400 transition-colors">Chính sách bảo mật thông tin cá nhân</Link></li>
            </ul>
          </div>

          {/* CỘT 3: DỊCH VỤ & ƯU ĐÃI ĐẶC QUYỀN */}
          <div className="space-y-5">
            <h3 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-500" /> Dịch vụ & Tiện ích
            </h3>
            <ul className="space-y-3 text-xs font-medium text-gray-600 dark:text-gray-400">
              <li><Link href="#" className="hover:text-[#d70018] dark:hover:text-red-400 transition-colors">Khách hàng doanh nghiệp (B2B)</Link></li>
              <li><Link href="#" className="hover:text-[#d70018] dark:hover:text-red-400 transition-colors">Ưu đãi trả góp 0% qua thẻ tín dụng</Link></li>
              <li><Link href="#" className="hover:text-[#d70018] dark:hover:text-red-400 transition-colors">Chương trình thu cũ đổi mới</Link></li>
              <li><Link href="#" className="hover:text-[#d70018] dark:hover:text-red-400 transition-colors">Đăng ký thành viên BlurS-Member</Link></li>
              <li><Link href="#" className="hover:text-[#d70018] dark:hover:text-red-400 transition-colors">Tuyển dụng (Gia nhập BlurTech)</Link></li>
            </ul>
            
            {/* KHỐI WEBSITE THÀNH VIÊN */}
            <div className="pt-2">
              <h4 className="font-bold text-xs text-gray-900 dark:text-gray-200 mb-2">Website thành viên:</h4>
              <Link href="#" className="inline-flex items-center justify-center px-4 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-black rounded-lg text-[10px] border border-red-100 dark:border-red-900/30 uppercase tracking-wider hover:bg-[#d70018] hover:text-white dark:hover:bg-red-600 dark:hover:text-white transition-all shadow-sm">
                BlurCare - SuaChuaNhanh
              </Link>
            </div>
          </div>

          {/* CỘT 4: MẠNG XÃ HỘI & THANH TOÁN */}
          <div className="space-y-6">
            
            {/* KẾT NỐI MẠNG XÃ HỘI */}
            <div>
              <h3 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider mb-4">Kết nối với chúng tôi</h3>
              <div className="flex items-center gap-3">
                
                {/* Facebook */}
                <Link 
                  href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center bg-blue-50 dark:bg-blue-900/30 text-[#1877F2] dark:text-blue-400 hover:bg-[#1877F2] hover:text-white dark:hover:bg-[#1877F2] dark:hover:text-white rounded-full border border-blue-100 dark:border-blue-800 transition-all shadow-sm"
                  title="Facebook"
                >
                  <FaFacebookF className="w-4 h-4" />
                </Link>

                {/* Zalo */}
                <Link 
                  href="#" 
                  className="w-10 h-10 flex items-center justify-center bg-sky-50 dark:bg-sky-900/30 text-[#0068FF] dark:text-sky-400 hover:bg-[#0068FF] hover:text-white dark:hover:bg-[#0068FF] dark:hover:text-white rounded-full border border-sky-100 dark:border-sky-800 transition-all shadow-sm"
                  title="Zalo"
                >
                  <SiZalo className="w-5 h-5" />
                </Link>

                {/* Instagram */}
                <Link 
                  href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center bg-pink-50 dark:bg-pink-900/30 text-[#E1306C] dark:text-pink-400 hover:bg-gradient-to-tr hover:from-yellow-500 hover:via-purple-500 hover:to-pink-500 hover:text-white dark:hover:text-white rounded-full border border-pink-100 dark:border-pink-800 transition-all shadow-sm"
                  title="Instagram"
                >
                  <FaInstagram className="w-4.5 h-4.5" />
                </Link>

                {/* TikTok */}
                <Link 
                  href="https://tiktok.com" target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black rounded-full border border-zinc-200 dark:border-zinc-700 transition-all shadow-sm"
                  title="TikTok"
                >
                  <FaTiktok className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* PHƯƠNG THỨC THANH TOÁN */}
            <div>
              <h3 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider mb-3">Thanh toán tiện lợi</h3>
              <div className="flex flex-wrap gap-2">
                {["Apple Pay", "VNPAY", "MoMo", "Moca", "Visa", "MasterCard"].map((pay) => (
                  <div 
                    key={pay} 
                    className="px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-[10px] font-bold text-gray-600 dark:text-gray-300 shadow-sm"
                  >
                    {pay}
                  </div>
                ))}
              </div>
            </div>
            
          </div>
        </div>

        {/* ĐƯỜNG KẺ PHÂN CÁCH & BẢN QUYỀN Ở ĐÁY FOOTER */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
          <div className="space-y-1 text-center md:text-left">
            <p>© 2026 <strong className="text-gray-900 dark:text-gray-200">BlurSetup Corporation</strong>. Bảo lưu mọi quyền.</p>
            <p>Đồ án tốt nghiệp Frontend - Giao diện mô phỏng thương mại điện tử.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            <Link href="#" className="hover:text-[#d70018] dark:hover:text-red-400 transition-colors">Điều khoản dịch vụ</Link>
            <span className="opacity-50">|</span>
            <Link href="#" className="hover:text-[#d70018] dark:hover:text-red-400 transition-colors">Chính sách vận hành</Link>
            <span className="opacity-50">|</span>
            <Link href="#" className="hover:text-[#d70018] dark:hover:text-red-400 transition-colors">Chính sách đại lý</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}