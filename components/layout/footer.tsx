// components/layout/footer.tsx
import Link from "next/link";
import { PhoneCall, ShieldCheck, Truck } from "lucide-react";

// Import các icon mạng xã hội chính thức từ gói react-icons
// fa6: Font Awesome 6, si: Simple Icons (chuyên logo thương hiệu thế giới)
import { FaFacebookF, FaInstagram, FaTiktok } from "react-icons/fa6";
import { SiZalo } from "react-icons/si";

export function Footer() {
  return (
    <footer className="w-full bg-white border-t border-gray-200 text-gray-700 pt-10 pb-6 mt-16">
      
      {/* CONTAINER CHÍNH GIỚI HẠN 1200PX ĐỒNG BỘ VỚI TRANG CHỦ */}
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 space-y-10">
        
        {/* LƯỚI THÔNG TIN: 4 CỘT */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 items-start">
          
          {/* CỘT 1: TỔNG ĐÀI HỖ TRỢ MIỄN PHÍ */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider">Tổng đài hỗ trợ miễn phí</h3>
            <ul className="space-y-2.5 text-xs text-gray-600">
              <li>
                <span className="block font-medium">Mua hàng & Bảo hành (7h30 - 22h00)</span>
                <Link href="tel:18002097" className="text-sm font-black text-gray-900 hover:text-primary flex items-center gap-1 mt-0.5">
                  <PhoneCall className="w-3.5 h-3.5 text-primary" /> 1800.2097
                </Link>
              </li>
              <li>
                <span className="block font-medium">Khiếu nại, góp ý (8h00 - 21h30)</span>
                <Link href="tel:18002063" className="text-sm font-black text-gray-900 hover:text-primary mt-0.5">
                  1800.2063
                </Link>
              </li>
              
              {/* KHỐI PHƯƠNG THỨC THANH TOÁN */}
              <li className="pt-4 space-y-2">
                <span className="block font-bold text-gray-900 uppercase tracking-wide">Phương thức thanh toán</span>
                <div className="flex flex-wrap gap-2">
                  {["Apple Pay", "VNPAY", "MoMo", "Moca", "Visa", "MasterCard"].map((pay) => (
                    <span 
                      key={pay} 
                      className="px-2 py-1 bg-gray-50 border border-gray-100 rounded text-[10px] font-bold text-gray-500 shadow-sm"
                    >
                      {pay}
                    </span>
                  ))}
                </div>
              </li>
            </ul>
          </div>

          {/* CỘT 2: THÔNG TIN VÀ CHÍNH SÁCH */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-gray-400" /> Thông tin & Chính sách
            </h3>
            <ul className="space-y-2.5 text-xs font-medium text-gray-600">
              <li><Link href="#" className="hover:text-primary transition-colors flex items-center gap-2">Mua hàng và thanh toán Online</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Chính sách giao hàng tận nơi</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Chính sách đổi trả & bảo hành 1-đổi-1</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Tra cứu hóa đơn điện tử VAT</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Hệ thống bảo hành ủy quyền chính hãng</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Chính sách bảo mật thông tin cá nhân</Link></li>
            </ul>
          </div>

          {/* CỘT 3: DỊCH VỤ & ƯU ĐÃI ĐẶC QUYỀN */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-gray-400" /> Dịch vụ & Tiện ích khác
            </h3>
            <ul className="space-y-2.5 text-xs font-medium text-gray-600">
              <li><Link href="#" className="hover:text-primary transition-colors">Khách hàng doanh nghiệp (B2B)</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Ưu đãi trả góp 0% qua thẻ tín dụng</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Chương trình thu cũ đổi mới gear & màn hình</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Đăng ký thành viên BlurS-Member nhận quà</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Gia nhập đội ngũ phát triển BlurTech (Tuyển dụng)</Link></li>
            </ul>
          </div>

          {/* CỘT 4: KẾT NỐI MẠNG XÃ HỘI CHUẨN REACT-ICONS */}
          <div className="space-y-5">
            <div>
              <h3 className="font-bold text-sm text-gray-900 uppercase tracking-wider mb-3">Kết nối với BlurSetup</h3>
              
              <div className="flex items-center gap-3">
                
                {/* 1. Facebook */}
                <Link 
                  href="https://facebook.com" 
                  target="_blank"
                  className="w-10 h-10 flex items-center justify-center bg-blue-50 hover:bg-[#1877F2] text-[#1877F2] hover:text-white rounded-full border border-blue-100 transition-all shadow-sm"
                  title="Theo dõi BlurSetup trên Facebook"
                >
                  <FaFacebookF className="w-4 h-4" />
                </Link>

                {/* 2. Zalo */}
                <Link 
                  href="#" 
                  className="w-10 h-10 flex items-center justify-center bg-sky-50 hover:bg-[#0068FF] text-[#0068FF] hover:text-white rounded-full border border-sky-100 transition-all shadow-sm"
                  title="Trò chuyện qua Zalo"
                >
                  <SiZalo className="w-5 h-5" />
                </Link>

                {/* 3. Instagram */}
                <Link 
                  href="https://instagram.com" 
                  target="_blank"
                  className="w-10 h-10 flex items-center justify-center bg-pink-50 hover:bg-gradient-to-tr hover:from-yellow-500 hover:via-purple-500 hover:to-pink-500 text-[#E1306C] hover:text-white rounded-full border border-pink-100 transition-all shadow-sm"
                  title="Theo dõi BlurSetup trên Instagram"
                >
                  <FaInstagram className="w-4.5 h-4.5" />
                </Link>

                {/* 4. TikTok */}
                <Link 
                  href="https://tiktok.com" 
                  target="_blank"
                  className="w-10 h-10 flex items-center justify-center bg-zinc-50 hover:bg-black text-black hover:text-white rounded-full border border-zinc-200 transition-all shadow-sm"
                  title="Xem BlurSetup trên TikTok"
                >
                  <FaTiktok className="w-4 h-4" />
                </Link>

              </div>
            </div>

            {/* KHỐI WEBSITE THÀNH VIÊN */}
            <div className="space-y-2">
              <h3 className="font-bold text-xs text-gray-900 uppercase tracking-wide">Website thành viên</h3>
              <div className="space-y-1.5 text-xs">
                <div className="text-gray-500 font-medium">Hệ thống sửa chữa thiết bị công nghệ:</div>
                <Link href="#" className="inline-block px-3 py-1 bg-red-600 text-white font-black rounded-lg text-[10px] uppercase tracking-wider hover:bg-red-700 transition-colors shadow-sm">
                  BlurCare - SuaChuaNhanh
                </Link>
              </div>
            </div>
          </div>

        </div>

        {/* ĐƯỜNG KẺ PHÂN CÁCH & BẢN QUYỀN Ở ĐÁY FOOTER */}
        <div className="border-t border-gray-200 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-muted-foreground font-medium">
          <div className="space-y-1 text-center md:text-left">
            <p>© 2026 <strong>BlurSetup Corporation</strong>. Bản quyền giao diện thuộc về đồ án tốt nghiệp Frontend.</p>
            <p className="opacity-75">Địa chỉ mô phỏng: Khu Công Nghệ Cao, Thành phố Hồ Chí Minh, Việt Nam.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 opacity-80">
            <Link href="#" className="hover:underline">Điều khoản dịch vụ</Link>
            <span>|</span>
            <Link href="#" className="hover:underline">Chính sách vận hành</Link>
            <span>|</span>
            <Link href="#" className="hover:underline">Chính sách đại lý</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}