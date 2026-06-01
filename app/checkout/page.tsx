"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
// Đã thêm Trash2 vào import
import { ArrowLeft, MapPin, Phone, User, CheckCircle2, TicketPercent, PenSquare, Trash2 } from "lucide-react";
import { getCart } from "@/app/actions/cart";
import toast from "react-hot-toast";

// Import hàm lấy thông tin User từ Database
import { getUserProfile } from "@/app/profile/actions";
// IMPORT HÀM LẤY CÀI ĐẶT TỪ ADMIN
import { getSettings } from "@/app/admin/settings/actions";

function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [cart, setCart] = useState<any>(null);
  const [voucher, setVoucher] = useState<{ code: string, discount: number, type: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // STATE LƯU CẤU HÌNH VẬN CHUYỂN TỪ DATABASE
  const [shippingConfig, setShippingConfig] = useState({ defaultFee: 30000, freeshipThreshold: 1000000 });

  const [dbUser, setDbUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "", phone: "", city: "", district: "", ward: "", address: ""
  });

  const [paymentMethod, setPaymentMethod] = useState("momo"); 
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
      return;
    }

    const fetchCart = async () => {
      const userId = (session?.user as any)?.id || "6a0de954edad2fe7af807713";
      const response = await getCart(userId);
      
      // Sử dụng 'as any' để bỏ qua kiểm tra cấu trúc nghiêm ngặt của TypeScript cho response từ server
      const cartData = response?.data as any;

      if (response?.success && cartData?.items && cartData.items.length > 0) {
        let itemsToCheckout = cartData.items;
        const buyNowProductId = sessionStorage.getItem("buyNowProductId");
        const selectedCartItemsStr = sessionStorage.getItem("selectedCartItems");

        if (buyNowProductId) {
          itemsToCheckout = itemsToCheckout.filter((item: any) => 
            item.product?.id === buyNowProductId || 
            item.product?._id === buyNowProductId ||
            item.productId === buyNowProductId
          );
        } else if (selectedCartItemsStr) {
          try {
            const selectedIds = JSON.parse(selectedCartItemsStr);
            itemsToCheckout = itemsToCheckout.filter((item: any) => selectedIds.includes(item.id));
          } catch (e) {
            console.error("Lỗi parse JSON selectedCartItems:", e);
          }
        }

        if (itemsToCheckout.length === 0) {
          toast.error("Không có sản phẩm nào được chọn!");
          router.push("/cart");
          return;
        }
        
        // Cập nhật state với dữ liệu đã lọc
        setCart({ ...cartData, items: itemsToCheckout });
      } else {
        toast.error("Giỏ hàng trống hoặc có lỗi xảy ra!");
        router.push("/cart");
      }
    };

    const fetchUserData = async () => {
      if (session?.user) {
        const userId = (session.user as any).id;
        const data = await getUserProfile(userId);
        if (data) {
          setDbUser(data);
          setFormData({
            name: data.name || "", phone: data.phone || "", city: data.city || "",
            district: data.district || "", ward: data.ward || "", address: data.address || ""
          });
        }
      }
    };

    // TẢI CẤU HÌNH VẬN CHUYỂN TỪ DATABASE
    const loadSettings = async () => {
      try {
        const res = await getSettings();
        if (res.success && res.data) {
          setShippingConfig({
            defaultFee: res.data.defaultFee,
            freeshipThreshold: res.data.freeshipThreshold
          });
        }
      } catch (error) {
        console.error("Lỗi lấy cấu hình:", error);
      }
    };

    if (status === "authenticated") {
      fetchCart();
      fetchUserData();
      loadSettings(); 

      const savedVoucher = sessionStorage.getItem("checkoutVoucher");
      if (savedVoucher) setVoucher(JSON.parse(savedVoucher));
      
      setLoading(false);
    }
  }, [session, status, router]);

  // --- HÀM XÓA SẢN PHẨM KHỎI ĐƠN HÀNG ---
  const handleRemoveItem = (itemIdToRemove: string) => {
    const updatedItems = cart.items.filter((item: any) => item.id !== itemIdToRemove);

    if (updatedItems.length === 0) {
      toast.error("Đơn hàng không còn sản phẩm nào, đang quay về giỏ hàng!");
      sessionStorage.removeItem("buyNowProductId");
      sessionStorage.removeItem("selectedCartItems");
      router.push("/cart");
      return;
    }

    // Cập nhật lại state giỏ hàng -> React sẽ TỰ ĐỘNG tính toán lại tổng tiền, freeship, voucher
    setCart({ ...cart, items: updatedItems });

    // Cập nhật lại Session Storage để lỡ F5 trang web thì sản phẩm vừa xóa ko bị hiện lại
    const selectedCartItemsStr = sessionStorage.getItem("selectedCartItems");
    if (selectedCartItemsStr) {
      const selectedIds = JSON.parse(selectedCartItemsStr);
      const newSelectedIds = selectedIds.filter((id: string) => id !== itemIdToRemove);
      sessionStorage.setItem("selectedCartItems", JSON.stringify(newSelectedIds));
    }

    toast.success("Đã xóa sản phẩm khỏi đơn hàng");
  };

  // --- TÍNH TOÁN DỰA TRÊN DỮ LIỆU THẬT ---
  const cartItems = cart?.items || [];
  const subTotal = cartItems.reduce((acc: number, item: any) => acc + (item.product.price * item.quantity), 0);
  
  // NẾU TỔNG TIỀN >= HẠN MỨC FREESHIP THÌ PHÍ SHIP = 0, NGƯỢC LẠI LẤY PHÍ MẶC ĐỊNH
  const shippingFee = subTotal >= shippingConfig.freeshipThreshold ? 0 : shippingConfig.defaultFee;
  
  // TÍNH TOÁN VOUCHER (Theo % hoặc Tiền mặt)
  let voucherDiscountAmount = 0;
  if (voucher) {
    if (voucher.type === 'percent') {
      voucherDiscountAmount = (subTotal * voucher.discount) / 100;
    } else {
      voucherDiscountAmount = voucher.discount;
    }
  }
  
  const finalTotal = subTotal + shippingFee - voucherDiscountAmount;

  const handlePlaceOrder = async () => {
    if (!formData.name || !formData.phone || !formData.city || !formData.district || !formData.ward || !formData.address) {
      return toast.error("Vui lòng điền đầy đủ Thông tin nhận hàng!");
    }
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phoneRegex.test(formData.phone)) {
       return toast.error("Số điện thoại không hợp lệ!");
    }

    setIsProcessing(true);

    try {
      const createOrderRes = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: (session?.user as any)?.id, 
          formData,
          cartItems,
          totalAmount: finalTotal,
          shippingFee: shippingFee,
          discountAmount: voucherDiscountAmount,
          paymentMethod: paymentMethod
        })
      });

      const orderData = await createOrderRes.json();

      if (!orderData.success) {
        toast.error("Không thể tạo đơn hàng, vui lòng thử lại!");
        setIsProcessing(false);
        return;
      }

      const realDbOrderId = orderData.order.id; 

      if (paymentMethod === "momo") {
        const res = await fetch("/api/payment/momo", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: realDbOrderId, amount: finalTotal, orderInfo: "Thanh toan BlurSetup" })
        });
        const data = await res.json();
        
        if (data.payUrl) {
          sessionStorage.removeItem("buyNowProductId");
          sessionStorage.removeItem("selectedCartItems");
          sessionStorage.removeItem("checkoutVoucher");
          window.location.href = data.payUrl;
        } else {
          toast.error("Lỗi khởi tạo MoMo: " + data.message);
          setIsProcessing(false);
        }

      } else if (paymentMethod === "zalopay") {
        const res = await fetch("/api/payment/zalopay", {
          method: "POST", 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: realDbOrderId, amount: finalTotal, orderInfo: "Thanh toan BlurSetup" })
        });
        
        const data = await res.json();
        
        if (data.success && data.order_url) {
          sessionStorage.removeItem("buyNowProductId");
          sessionStorage.removeItem("selectedCartItems");
          sessionStorage.removeItem("checkoutVoucher");
          window.location.href = data.order_url;
        } else {
          toast.error(data.message || "Lỗi khởi tạo thanh toán ZaloPay.");
          setIsProcessing(false);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Đã xảy ra lỗi khi kết nối cổng thanh toán.");
      setIsProcessing(false);
    }
  };

  const isMissingAddress = !formData.address || !formData.city || !formData.district || !formData.ward;

  if (loading || status === "loading") {
    return <div className="min-h-screen bg-[#f4f6f8] dark:bg-[#09090b] flex items-center justify-center font-bold text-gray-500">Đang chuẩn bị đơn hàng...</div>;
  }

  return (
    <div className="bg-[#f4f6f8] dark:bg-[#09090b] min-h-screen pb-20 pt-6 transition-colors duration-300">
      <div className="max-w-[1000px] mx-auto px-4 md:px-8 space-y-6">
        
        <div className="flex items-center">
          <Link href="/cart" className="flex items-center gap-1 text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-[#d70018] dark:hover:text-red-400 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Quay lại giỏ hàng
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#18181b] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 md:p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-black text-gray-900 dark:text-gray-100 uppercase flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#d70018] dark:text-red-500" /> Thông tin nhận hàng
                </h2>
                <Link href="/profile" className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                  <PenSquare className="w-3 h-3" /> Cập nhật hồ sơ
                </Link>
              </div>
              
              {isMissingAddress && (
                <div className="mb-4 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 text-xs font-bold p-3 rounded-lg border border-orange-200 dark:border-orange-900/30">
                  Hồ sơ gốc của bạn đang thiếu địa chỉ. Vui lòng bổ sung để giao hàng chính xác!
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1"><User className="w-3.5 h-3.5" /> Họ và tên</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-[#09090b] border border-gray-200 dark:border-gray-800 rounded-xl text-sm outline-none focus:border-[#d70018] dark:focus:border-red-500 focus:bg-white dark:focus:bg-[#18181b] transition-all text-gray-900 dark:text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Số điện thoại</label>
                    <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-[#09090b] border border-gray-200 dark:border-gray-800 rounded-xl text-sm outline-none focus:border-[#d70018] dark:focus:border-red-500 focus:bg-white dark:focus:bg-[#18181b] transition-all text-gray-900 dark:text-white" />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-gray-50 dark:border-gray-800/50">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Địa chỉ giao hàng</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} placeholder="Tỉnh / Thành phố" className="w-full p-3 bg-gray-50 dark:bg-[#09090b] border border-gray-200 dark:border-gray-800 rounded-xl text-sm outline-none focus:border-[#d70018] dark:focus:border-red-500 text-gray-900 dark:text-white placeholder:text-gray-400" />
                    <input type="text" value={formData.district} onChange={(e) => setFormData({...formData, district: e.target.value})} placeholder="Quận / Huyện" className="w-full p-3 bg-gray-50 dark:bg-[#09090b] border border-gray-200 dark:border-gray-800 rounded-xl text-sm outline-none focus:border-[#d70018] dark:focus:border-red-500 text-gray-900 dark:text-white placeholder:text-gray-400" />
                  </div>
                  <div className="grid grid-cols-1 mt-3">
                    <input type="text" value={formData.ward} onChange={(e) => setFormData({...formData, ward: e.target.value})} placeholder="Phường / Xã" className="w-full p-3 bg-gray-50 dark:bg-[#09090b] border border-gray-200 dark:border-gray-800 rounded-xl text-sm outline-none focus:border-[#d70018] dark:focus:border-red-500 mb-3 text-gray-900 dark:text-white placeholder:text-gray-400" />
                    <textarea rows={2} value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="Số nhà, Tên đường cụ thể..." className="w-full p-3 bg-gray-50 dark:bg-[#09090b] border border-gray-200 dark:border-gray-800 rounded-xl text-sm outline-none focus:border-[#d70018] dark:focus:border-red-500 resize-none text-gray-900 dark:text-white placeholder:text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#18181b] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 md:p-6">
              <h2 className="text-base font-black text-gray-900 dark:text-gray-100 uppercase mb-5">Phương thức thanh toán</h2>
              <div className="space-y-3">
                <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === 'zalopay' ? 'border-[#0068ff] bg-[#0068ff]/5 dark:bg-[#0068ff]/10' : 'border-gray-100 dark:border-gray-800 hover:border-[#0068ff]/30'}`}>
                  <input type="radio" name="paymentMethod" value="zalopay" className="hidden" checked={paymentMethod === 'zalopay'} onChange={() => setPaymentMethod('zalopay')} />
                  <div className="w-12 h-12 rounded-lg bg-[#0068ff] flex items-center justify-center flex-shrink-0 shadow-sm"><span className="text-white font-black text-xs">ZaloPay</span></div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Ví điện tử ZaloPay</span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">Mở app Zalo hoặc ZaloPay để quét mã</span>
                  </div>
                  {paymentMethod === 'zalopay' && <CheckCircle2 className="w-5 h-5 text-[#0068ff] ml-auto" />}
                </label>

                <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === 'momo' ? 'border-[#ae2070] bg-[#ae2070]/5 dark:bg-[#ae2070]/10' : 'border-gray-100 dark:border-gray-800 hover:border-[#ae2070]/30'}`}>
                  <input type="radio" name="paymentMethod" value="momo" className="hidden" checked={paymentMethod === 'momo'} onChange={() => setPaymentMethod('momo')} />
                  <div className="w-12 h-12 rounded-lg bg-[#ae2070] flex items-center justify-center flex-shrink-0 shadow-sm"><span className="text-white font-black text-sm">MoMo</span></div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Ví điện tử MoMo</span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">Thanh toán tự động bằng mã QR</span>
                  </div>
                  {paymentMethod === 'momo' && <CheckCircle2 className="w-5 h-5 text-[#ae2070] ml-auto" />}
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-6 lg:sticky lg:top-6">
            <div className="bg-white dark:bg-[#18181b] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 md:p-6 space-y-6">
              <h2 className="text-base font-black text-gray-900 dark:text-gray-100 uppercase border-b border-gray-100 dark:border-gray-800 pb-3">Đơn hàng của bạn</h2>
              
              <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {cartItems.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 group">
                    <div className="w-16 h-16 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-1 flex-shrink-0">
                      <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-contain dark:mix-blend-normal" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 line-clamp-2">{item.product.name}</h4>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Số lượng: x{item.quantity}</p>
                    </div>
                    {/* Phần giá tiền và nút xóa */}
                    <div className="text-right flex flex-col items-end gap-1.5">
                      <div className="text-sm font-black text-gray-900 dark:text-gray-100">
                        {(item.product.price * item.quantity).toLocaleString("vi-VN")} ₫
                      </div>
                      <button 
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-[10px] text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                        title="Xóa khỏi đơn hàng"
                      >
                        <Trash2 className="w-3 h-3" /> Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {voucher && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-xl p-3 flex items-center justify-between text-xs font-bold text-green-700 dark:text-green-400">
                  <span className="flex items-center gap-1.5"><TicketPercent className="w-4 h-4"/> Đã áp dụng mã: {voucher.code}</span>
                  <span>-{voucherDiscountAmount.toLocaleString("vi-VN")} ₫</span>
                </div>
              )}

              <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800 text-sm font-medium text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <span className="text-gray-900 dark:text-gray-100 font-bold">{subTotal.toLocaleString("vi-VN")} ₫</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí vận chuyển</span>
                  <span>{shippingFee === 0 ? <strong className="text-green-600 dark:text-green-400">Miễn phí</strong> : `${shippingFee.toLocaleString("vi-VN")} ₫`}</span>
                </div>
                {voucherDiscountAmount > 0 && (
                  <div className="flex justify-between text-[#d70018] dark:text-red-400">
                    <span>Khuyến mãi Voucher</span>
                    <span className="font-bold">-{voucherDiscountAmount.toLocaleString("vi-VN")} ₫</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-end">
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Tổng thanh toán:</span>
                <div className="text-right">
                  <div className="text-2xl font-black text-[#d70018] dark:text-red-500 leading-none">{finalTotal.toLocaleString("vi-VN")} ₫</div>
                </div>
              </div>

              <button 
                onClick={handlePlaceOrder}
                disabled={isProcessing} 
                className="w-full py-4 rounded-xl font-black uppercase tracking-tight bg-[#d70018] hover:bg-red-700 text-white shadow-lg shadow-red-500/30 dark:shadow-none transition-all text-base disabled:opacity-70 disabled:cursor-not-allowed"
              >
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