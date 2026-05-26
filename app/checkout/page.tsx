"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, MapPin, Phone, User, CheckCircle2, TicketPercent, PenSquare } from "lucide-react";
import { getCart } from "@/app/actions/cart";
import toast from "react-hot-toast"; // <--- THÊM DÒNG NÀY VÀO

// Import hàm lấy thông tin User từ Database
import { getUserProfile } from "@/app/profile/actions";

function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [cart, setCart] = useState<any>(null);
  const [voucher, setVoucher] = useState<{ code: string, discount: number } | null>(null);
  const [loading, setLoading] = useState(true);

  // Dữ liệu User từ Database (để so sánh)
  const [dbUser, setDbUser] = useState<any>(null);

  // Form Thông tin Khách hàng sẽ submit theo Đơn hàng
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    city: "",
    district: "",
    ward: "",
    address: ""
  });

  // State Phương thức thanh toán
  const [paymentMethod, setPaymentMethod] = useState("momo"); 

  useEffect(() => {
    // Nếu chưa đăng nhập thì đẩy ra ngoài (Bảo vệ Route)
    if (status === "unauthenticated") {
      router.push("/auth");
      return;
    }

    // 1. Tải Giỏ hàng
    const fetchCart = async () => {
      const userId = (session?.user as any)?.id || "6a0de954edad2fe7af807713";
      const response = await getCart(userId);
      if (response.success && response.data.items.length > 0) {
        setCart(response.data);
      } else {
        alert("Giỏ hàng trống!");
        router.push("/cart");
      }
    };

    // 2. Tải thông tin User thật từ Database
    const fetchUserData = async () => {
      if (session?.user) {
        const userId = (session.user as any).id;
        const data = await getUserProfile(userId);
        if (data) {
          setDbUser(data);
          // Tự động điền Form bằng dữ liệu Database
          setFormData({
            name: data.name || "",
            phone: data.phone || "",
            city: data.city || "",
            district: data.district || "",
            ward: data.ward || "",
            address: data.address || ""
          });
        }
      }
    };

    if (status === "authenticated") {
      fetchCart();
      fetchUserData();
      // 3. Đọc Voucher
      const savedVoucher = sessionStorage.getItem("checkoutVoucher");
      if (savedVoucher) setVoucher(JSON.parse(savedVoucher));
      
      setLoading(false);
    }
  }, [session, status, router]);

  // Xử lý tính toán tiền
  const cartItems = cart?.items || [];
  const subTotal = cartItems.reduce((acc: number, item: any) => acc + (item.product.price * item.quantity), 0);
  
  // Phí vận chuyển: Mặc định 30k, nếu mã là FREESHIP thì phí ship là 0
  const shippingFee = voucher?.code === "FREESHIP" ? 0 : 30000;
  const voucherDiscount = voucher?.discount || 0;
  
  const finalTotal = subTotal + shippingFee - voucherDiscount;

  const [isProcessing, setIsProcessing] = useState(false);

  const handlePlaceOrder = async () => {
    // 1. Kiểm tra tính hợp lệ của Form giao hàng
    if (!formData.name || !formData.phone || !formData.city || !formData.district || !formData.ward || !formData.address) {
      return toast.error("Vui lòng điền đầy đủ Thông tin nhận hàng!");
    }

    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phoneRegex.test(formData.phone)) {
       return toast.error("Số điện thoại không hợp lệ!");
    }

    setIsProcessing(true);

    try {
      // 2. Nơi đây bạn sẽ gọi API lưu đơn hàng vào Database của bạn trước
      // Ví dụ: const orderId = await saveOrderToDB(formData, cartItems, finalTotal);
      const fakeOrderId = "BLUR_" + Math.floor(Math.random() * 1000000); // Tạm thời dùng ID ảo

      // 3. Xử lý gọi API Thanh toán tương ứng
      if (paymentMethod === "momo") {
        const res = await fetch("/api/payment/momo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: fakeOrderId,
            amount: finalTotal,
            orderInfo: "Thanh toan don hang BlurSetup"
          })
        });
        const data = await res.json();
        
        if (data.payUrl) {
          // Chuyển hướng khách hàng sang trang của MoMo
          window.location.href = data.payUrl;
        } else {
          toast.error("Lỗi khởi tạo MoMo: " + data.message);
          setIsProcessing(false);
        }

      } else if (paymentMethod === "zalopay") {
        const res = await fetch("/api/payment/zalopay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: fakeOrderId,
            amount: finalTotal,
            orderInfo: "Thanh toan don hang BlurSetup"
          })
        });
        const data = await res.json();
        
        if (data.order_url) {
          // Chuyển hướng khách hàng sang trang của ZaloPay
          window.location.href = data.order_url;
        } else {
          toast.error("Lỗi khởi tạo ZaloPay: " + data.message);
          setIsProcessing(false);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Đã xảy ra lỗi khi kết nối cổng thanh toán.");
      setIsProcessing(false);
    }
  };

  // Xác định khách hàng có thiếu thông tin địa chỉ hay không
  const isMissingAddress = !formData.address || !formData.city || !formData.district || !formData.ward;

  if (loading || status === "loading") {
    return <div className="min-h-screen bg-[#f4f6f8] flex items-center justify-center font-bold text-gray-500">Đang chuẩn bị đơn hàng...</div>;
  }

  return (
    <div className="bg-[#f4f6f8] min-h-screen pb-20 pt-6">
      <div className="max-w-[1000px] mx-auto px-4 md:px-8 space-y-6">
        
        <div className="flex items-center">
          <Link href="/cart" className="flex items-center gap-1 text-sm font-bold text-gray-600 hover:text-[#d70018] transition-colors">
            <ArrowLeft className="w-4 h-4" /> Quay lại giỏ hàng
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* CỘT TRÁI: THÔNG TIN GIAO HÀNG & THANH TOÁN */}
          <div className="space-y-6">
            
            {/* THÔNG TIN GIAO HÀNG */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-black text-gray-900 uppercase flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#d70018]" /> Thông tin nhận hàng
                </h2>
                <Link href="/profile" className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1">
                  <PenSquare className="w-3 h-3" /> Cập nhật hồ sơ gốc
                </Link>
              </div>
              
              {isMissingAddress && (
                <div className="mb-4 bg-orange-50 text-orange-700 text-xs font-bold p-3 rounded-lg border border-orange-200">
                  Hồ sơ gốc của bạn đang thiếu địa chỉ. Vui lòng bổ sung để giao hàng chính xác!
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 flex items-center gap-1"><User className="w-3.5 h-3.5" /> Họ và tên người nhận</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="VD: Nguyễn Văn A" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#d70018] focus:bg-white transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Số điện thoại</label>
                    <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="VD: 0912345678" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#d70018] focus:bg-white transition-all" />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-gray-50">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Địa chỉ giao hàng chi tiết</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} placeholder="Tỉnh / Thành phố" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#d70018] focus:bg-white transition-all" />
                    <input type="text" value={formData.district} onChange={(e) => setFormData({...formData, district: e.target.value})} placeholder="Quận / Huyện" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#d70018] focus:bg-white transition-all" />
                  </div>
                  <div className="grid grid-cols-1 mt-3">
                    <input type="text" value={formData.ward} onChange={(e) => setFormData({...formData, ward: e.target.value})} placeholder="Phường / Xã" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#d70018] focus:bg-white transition-all mb-3" />
                    <textarea rows={2} value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="Số nhà, Tên đường cụ thể..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#d70018] focus:bg-white transition-all resize-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* PHƯƠNG THỨC THANH TOÁN */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
              <h2 className="text-base font-black text-gray-900 uppercase mb-5">Phương thức thanh toán</h2>
              <div className="space-y-3">
                {/* ZaloPay */}
                <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === 'zalopay' ? 'border-[#0068ff] bg-[#0068ff]/5' : 'border-gray-100 hover:border-[#0068ff]/30'}`}>
                  <input type="radio" name="paymentMethod" value="zalopay" className="hidden" checked={paymentMethod === 'zalopay'} onChange={() => setPaymentMethod('zalopay')} />
                  <div className="w-12 h-12 rounded-lg bg-[#0068ff] flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-white font-black text-xs">ZaloPay</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900">Ví điện tử ZaloPay</span>
                    <span className="text-[11px] text-gray-500">Mở app Zalo hoặc ZaloPay để quét mã</span>
                  </div>
                  {paymentMethod === 'zalopay' && <CheckCircle2 className="w-5 h-5 text-[#0068ff] ml-auto" />}
                </label>

                {/* MoMo */}
                <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === 'momo' ? 'border-[#ae2070] bg-[#ae2070]/5' : 'border-gray-100 hover:border-[#ae2070]/30'}`}>
                  <input type="radio" name="paymentMethod" value="momo" className="hidden" checked={paymentMethod === 'momo'} onChange={() => setPaymentMethod('momo')} />
                  <div className="w-12 h-12 rounded-lg bg-[#ae2070] flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-white font-black text-sm">MoMo</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900">Ví điện tử MoMo</span>
                    <span className="text-[11px] text-gray-500">Thanh toán tự động bằng mã QR</span>
                  </div>
                  {paymentMethod === 'momo' && <CheckCircle2 className="w-5 h-5 text-[#ae2070] ml-auto" />}
                </label>
              </div>
            </div>

          </div>

          {/* CỘT PHẢI: CHI TIẾT ĐƠN HÀNG */}
          <div className="space-y-6 lg:sticky lg:top-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 space-y-6">
              <h2 className="text-base font-black text-gray-900 uppercase border-b border-gray-100 pb-3">Đơn hàng của bạn</h2>
              
              {/* Danh sách SP */}
              <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {cartItems.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 p-1 flex-shrink-0">
                      <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-gray-800 line-clamp-2">{item.product.name}</h4>
                      <p className="text-[10px] text-gray-500 mt-0.5">Số lượng: x{item.quantity}</p>
                    </div>
                    <div className="text-sm font-black text-gray-900">
                      {(item.product.price * item.quantity).toLocaleString("vi-VN")} ₫
                    </div>
                  </div>
                ))}
              </div>

              {/* Thông tin Voucher */}
              {voucher && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between text-xs font-bold text-green-700">
                  <span className="flex items-center gap-1.5"><TicketPercent className="w-4 h-4"/> Đã áp dụng mã: {voucher.code}</span>
                  <span>- {voucher.discount.toLocaleString("vi-VN")} ₫</span>
                </div>
              )}

              {/* Chi tiết chi phí */}
              <div className="space-y-3 pt-4 border-t border-gray-100 text-sm font-medium text-gray-600">
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <span className="text-gray-900 font-bold">{subTotal.toLocaleString("vi-VN")} ₫</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí vận chuyển</span>
                  <span>{shippingFee === 0 ? <strong className="text-green-600">Miễn phí</strong> : `${shippingFee.toLocaleString("vi-VN")} ₫`}</span>
                </div>
                {voucherDiscount > 0 && (
                  <div className="flex justify-between text-[#d70018]">
                    <span>Khuyến mãi Voucher</span>
                    <span className="font-bold">- {voucherDiscount.toLocaleString("vi-VN")} ₫</span>
                  </div>
                )}
              </div>

              {/* Tổng cộng */}
              <div className="pt-4 border-t border-gray-100 flex justify-between items-end">
                <span className="text-sm font-bold text-gray-900">Tổng thanh toán:</span>
                <div className="text-right">
                  <div className="text-2xl font-black text-[#d70018] leading-none">{finalTotal.toLocaleString("vi-VN")} ₫</div>
                </div>
              </div>

              <button 
                onClick={handlePlaceOrder}
                // Thêm thuộc tính disabled để khách không bấm được nhiều lần khi đang xử lý
                disabled={isProcessing} 
                className="w-full py-4 rounded-xl font-black uppercase tracking-tight bg-[#d70018] hover:bg-red-700 text-white shadow-lg shadow-red-500/30 transition-all text-base disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {/* Chỗ này sử dụng biểu thức điều kiện để đổi chữ */}
                {isProcessing ? "Đang xử lý..." : "Xác nhận đặt hàng"}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(CheckoutPage), { ssr: false });