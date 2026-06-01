"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast"; 
import { 
  Trash2, Plus, Minus, ArrowLeft, ShoppingBag, 
  TicketPercent, ShieldCheck, Truck, RotateCcw, Sparkles, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCart, updateCartItemQuantity, removeCartItem } from "@/app/actions/cart";
import { useSession } from "next-auth/react";

import { getProducts } from "@/app/admin/products/actions";
import { ProductCard } from "@/components/product-card";
import { getSettings } from "@/app/admin/settings/actions";

function CartPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // --- STATE CHỌN SẢN PHẨM ---
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [visibleRelatedCount, setVisibleRelatedCount] = useState(10); 

  const [voucherCode, setVoucherCode] = useState("");
  // Đổi type của appliedVoucher để chứa type (fixed hay percent)
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string, discount: number, type: string } | null>(null);
  const [voucherError, setVoucherError] = useState("");

  // STATE LƯU VOUCHERS TỪ DATABASE
  const [dbVouchers, setDbVouchers] = useState<any[]>([]);

  // HÀM FETCH GIỎ HÀNG VÀ VOUCHER
  const fetchCart = async () => {
    setLoading(true);
    const userId = (session?.user as any)?.id || "6a0de954edad2fe7af807713";
    const response = await getCart(userId);
    if (response.success) {
      setCart(response.data);
    } else {
      setCart({ items: [] });
    }
    
    // ĐỒNG THỜI TẢI VOUCHER TỪ DATABASE VỀ TRANG GIỎ HÀNG
    try {
      const resSettings = await getSettings();
      if (resSettings.success && resSettings.data?.vouchers) {
         const parsedVouchers = typeof resSettings.data.vouchers === 'string' ? JSON.parse(resSettings.data.vouchers) : resSettings.data.vouchers;
         setDbVouchers(Array.isArray(parsedVouchers) ? parsedVouchers : []);
      }
    } catch (e) { console.error(e) }

    setLoading(false);
  };

  useEffect(() => {
    setIsMounted(true);
    if (status !== "loading") {
      fetchCart();
    }
  }, [session, status]);

  useEffect(() => {
    async function loadRelated() {
      if (!cart) return;

      const allProducts = await getProducts();
      const cartProductIds = cart.items ? cart.items.map((i: any) => i.product.id) : [];
      const cartCategories = cart.items ? [...new Set(cart.items.map((i: any) => i.product.category))] : [];

      let viewedSlugs: string[] = [];
      try {
        viewedSlugs = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
      } catch (e) {}

      const sameCategoryProducts = allProducts.filter(
        (p: any) => (cartCategories as string[]).includes(p.category) && !cartProductIds.includes(p.id)
      );

      const viewedProducts = allProducts.filter(
        (p: any) => (viewedSlugs.includes(p.slug) || viewedSlugs.includes(p.id)) && !cartProductIds.includes(p.id)
      );

      const combined = [...sameCategoryProducts, ...viewedProducts];
      const uniqueProducts = Array.from(new Set(combined.map(p => p.id)))
        .map(id => combined.find(p => p.id === id));

      const finalProducts = uniqueProducts.length > 0 
        ? uniqueProducts 
        : allProducts.filter((p: any) => !cartProductIds.includes(p.id));

      setRelatedProducts(finalProducts); 
    }

    loadRelated();
  }, [cart]);

  // --- LOGIC XỬ LÝ CHECKBOX ---
  const toggleItem = (itemId: string) => {
    setSelectedItems(prev => prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]);
  };

  const toggleSelectAll = () => {
    const cartItems = cart?.items || [];
    if (selectedItems.length === cartItems.length && cartItems.length > 0) {
      setSelectedItems([]); // Bỏ chọn tất cả
    } else {
      setSelectedItems(cartItems.map((item: any) => item.id)); // Chọn tất cả
    }
  };

  const handleUpdateQuantity = async (itemId: string, currentQty: number, type: "increase" | "decrease") => {
    const newQty = type === "increase" ? currentQty + 1 : currentQty - 1;
    await updateCartItemQuantity(itemId, newQty);
    fetchCart();
  };

  const handleRemove = async (itemId: string) => {
    toast((t) => (
      <span className="flex items-center gap-3">
        Bạn có chắc muốn xóa?
        <button 
          onClick={async () => {
            await removeCartItem(itemId);
            toast.dismiss(t.id);
            toast.success("Đã xóa sản phẩm!");
            setSelectedItems(prev => prev.filter(id => id !== itemId)); // Cập nhật lại list
            fetchCart();
          }}
          className="bg-red-600 text-white px-3 py-1 rounded-md text-xs font-bold"
        >
          Xóa
        </button>
      </span>
    ), { duration: 4000 });
  };

  // --- HÀM MỚI: XÓA HÀNG LOẠT (XÓA ĐÃ CHỌN / XÓA TẤT CẢ) ---
  const handleRemoveSelected = async () => {
    if (selectedItems.length === 0) return;
    
    toast((t) => (
      <span className="flex items-center gap-3">
        Xóa {selectedItems.length} sản phẩm này?
        <button 
          onClick={async () => {
            toast.dismiss(t.id);
            // Dùng Promise.all để xóa đồng loạt các item đã chọn cho nhanh
            await Promise.all(selectedItems.map(itemId => removeCartItem(itemId)));
            toast.success("Đã xóa thành công!");
            setSelectedItems([]); // Xóa sạch danh sách đã chọn
            fetchCart(); // Load lại giỏ hàng
          }}
          className="bg-red-600 text-white px-3 py-1 rounded-md text-xs font-bold"
        >
          Xóa ngay
        </button>
      </span>
    ), { duration: 4000 });
  };

  // HÀM ÁP DỤNG VOUCHER BẰNG DỮ LIỆU THẬT
  const handleApplyVoucher = () => {
    setVoucherError("");
    const code = voucherCode.toUpperCase().trim();
    
    if (!code) {
      toast.error("Vui lòng nhập mã giảm giá");
      return;
    }

    // TÌM MÃ TRONG DATABASE
    const foundVoucher = dbVouchers.find(v => v.code === code);

    if (foundVoucher) {
      setAppliedVoucher({ 
        code: foundVoucher.code, 
        discount: foundVoucher.value, 
        type: foundVoucher.type 
      });
      toast.success("Áp dụng mã giảm giá thành công!");
    } else {
      toast.error("Mã giảm giá không hợp lệ hoặc đã hết hạn!");
      setAppliedVoucher(null);
    }
  };

  const handleProceedToCheckout = () => {
    if (selectedItems.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 sản phẩm để thanh toán!");
      return;
    }
    
    // Lưu danh sách sản phẩm đã tick chọn
    sessionStorage.setItem("selectedCartItems", JSON.stringify(selectedItems));
    sessionStorage.removeItem("buyNowProductId"); // Xóa cờ mua ngay nếu có

    if (appliedVoucher) {
      sessionStorage.setItem("checkoutVoucher", JSON.stringify(appliedVoucher));
    } else {
      sessionStorage.removeItem("checkoutVoucher");
    }
    
    router.push("/checkout");
  };

  const cartItems = cart?.items || [];
  
  // TÍNH TIỀN DỰA TRÊN SẢN PHẨM ĐÃ CHỌN
  const selectedCartItemsData = cartItems.filter((item: any) => selectedItems.includes(item.id));
  const totalSelectedItems = selectedCartItemsData.reduce((acc: number, item: any) => acc + item.quantity, 0);
  const subTotal = selectedCartItemsData.reduce((acc: number, item: any) => acc + (item.product.price * item.quantity), 0);
  
  const productDiscountTotal = selectedCartItemsData.reduce((acc: number, item: any) => {
    if (item.product.originalPrice && item.product.originalPrice > item.product.price) {
      return acc + ((item.product.originalPrice - item.product.price) * item.quantity);
    }
    return acc;
  }, 0);

  // TÍNH VOUCHER (Tính % hoặc cố định)
  let voucherDiscountAmount = 0;
  if (appliedVoucher) {
    if (appliedVoucher.type === 'percent') {
      voucherDiscountAmount = (subTotal * appliedVoucher.discount) / 100;
    } else {
      voucherDiscountAmount = appliedVoucher.discount;
    }
  }

  const finalTotal = subTotal > 0 ? subTotal - voucherDiscountAmount : 0;

  if (cartItems.length === 0 && !loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#f4f6f8] dark:bg-[#09090b] px-4 text-center transition-colors duration-300">
        <div className="w-24 h-24 rounded-full bg-white dark:bg-[#18181b] flex items-center justify-center text-[#d70018] mb-6 shadow-sm border border-gray-100 dark:border-gray-800">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Giỏ hàng của bạn đang trống</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">Hãy quay lại trang chủ và chọn những món đồ công nghệ yêu thích của bạn nhé!</p>
        <Link href="/">
          <Button className="px-6 py-5 rounded-xl font-bold text-sm bg-[#d70018] hover:bg-red-700 text-white transition-all shadow-md flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Tiếp tục mua sắm
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#f4f6f8] dark:bg-[#09090b] min-h-screen pb-16 pt-6 transition-colors duration-300">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 space-y-6">
        
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1 text-xs font-bold text-[#d70018] hover:underline transition-colors">
            <ArrowLeft className="w-4 h-4" /> Mua thêm sản phẩm khác
          </Link>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Giỏ hàng của bạn: <strong className="text-gray-900 dark:text-gray-100">{cartItems.length}</strong> sản phẩm
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-4">
            
            {/* THANH CHỌN TẤT CẢ & XÓA ĐÃ CHỌN */}
            {cartItems.length > 0 && (
              <div className="bg-white dark:bg-[#18181b] border border-gray-200/60 dark:border-gray-800 rounded-2xl p-4 flex items-center justify-between shadow-sm transition-colors duration-300">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={selectedItems.length === cartItems.length && cartItems.length > 0} 
                    onChange={toggleSelectAll} 
                    className="w-5 h-5 accent-[#d70018] cursor-pointer" 
                  />
                  <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                    Chọn tất cả ({cartItems.length} sản phẩm)
                  </span>
                </div>
                
                {/* NÚT XÓA ĐÃ CHỌN / XÓA TẤT CẢ (Sẽ hiển thị khi có tick chọn) */}
                {selectedItems.length > 0 && (
                  <button 
                    onClick={handleRemoveSelected}
                    className="flex items-center gap-1.5 text-sm font-bold text-red-600 hover:text-red-700 transition-colors px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" /> 
                    Xóa {selectedItems.length === cartItems.length ? "tất cả" : "đã chọn"}
                  </button>
                )}
              </div>
            )}

            {cartItems.map((item: any) => {
              const p = item.product;
              const isDiscounted = p.originalPrice && p.originalPrice > p.price;
              const discountPercent = isDiscounted ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
              const isSelected = selectedItems.includes(item.id);

              return (
                <div key={item.id} className={`bg-white dark:bg-[#18181b] border ${isSelected ? 'border-[#d70018] dark:border-red-500' : 'border-gray-200/60 dark:border-gray-800'} rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm hover:shadow-md transition-all`}>
                  
                  {/* Ô CHECKBOX TỪNG SẢN PHẨM */}
                  <input 
                    type="checkbox" 
                    checked={isSelected}
                    onChange={() => toggleItem(item.id)}
                    className="w-5 h-5 accent-[#d70018] cursor-pointer mt-1 sm:mt-0 flex-shrink-0"
                  />

                  <div onClick={() => toggleItem(item.id)} className="relative w-24 h-24 rounded-xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex-shrink-0 p-2 cursor-pointer">
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain dark:mix-blend-normal mix-blend-multiply" />
                    {isDiscounted && (
                      <span className="absolute top-0 left-0 bg-[#d70018] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-br-lg">
                        -{discountPercent}%
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-1 w-full">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 line-clamp-2 leading-snug cursor-pointer hover:text-[#d70018] dark:hover:text-red-400" onClick={() => toggleItem(item.id)}>
                      {p.name}
                    </h3>
                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="text-base font-black text-[#d70018] dark:text-red-500">{p.price.toLocaleString("vi-VN")} ₫</span>
                      {isDiscounted && <span className="text-xs text-gray-400 dark:text-gray-500 line-through font-medium">{p.originalPrice.toLocaleString("vi-VN")} ₫</span>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6 mt-2 sm:mt-0">
                    <div className="flex items-center bg-gray-50 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
                      <button onClick={() => handleUpdateQuantity(item.id, item.quantity, "decrease")} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-700 rounded-lg shadow-sm hover:text-[#d70018] dark:hover:text-red-400 text-gray-800 dark:text-gray-200 transition-colors"><Minus className="w-3.5 h-3.5" /></button>
                      <span className="w-10 text-center text-sm font-bold text-gray-800 dark:text-gray-200">{item.quantity}</span>
                      <button onClick={() => handleUpdateQuantity(item.id, item.quantity, "increase")} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-700 rounded-lg shadow-sm hover:text-[#d70018] dark:hover:text-red-400 text-gray-800 dark:text-gray-200 transition-colors"><Plus className="w-3.5 h-3.5" /></button>
                    </div>
                    <button onClick={() => handleRemove(item.id)} className="p-2 text-gray-400 hover:text-[#d70018] dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold">
                      <Trash2 className="w-4 h-4" /> <span className="sm:hidden">Xóa</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-4 lg:sticky lg:top-6">
            <div className="bg-white dark:bg-[#18181b] border border-gray-200/60 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4 transition-colors duration-300">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-gray-200">
                <TicketPercent className="w-5 h-5 text-[#d70018] dark:text-red-500" /> Khuyến mãi / Voucher
              </div>
              <div className="flex gap-2">
                <input type="text" value={voucherCode} onChange={(e) => setVoucherCode(e.target.value.toUpperCase())} placeholder="Nhập mã giảm giá..." className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl px-3 text-sm outline-none focus:border-[#d70018] dark:focus:border-red-500 bg-transparent dark:text-white dark:placeholder-gray-500 uppercase placeholder:normal-case" />
                <Button onClick={handleApplyVoucher} className="bg-[#1a1a1a] dark:bg-gray-800 hover:bg-[#d70018] dark:hover:bg-red-600 text-white rounded-xl font-bold">Áp dụng</Button>
              </div>
              {voucherError && <p className="text-xs text-[#d70018] font-medium">{voucherError}</p>}
              {appliedVoucher && (
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 p-2 rounded-lg flex items-center justify-between">
                  <span>Đã áp dụng mã: {appliedVoucher.code}</span>
                  <span>-{voucherDiscountAmount.toLocaleString("vi-VN")} ₫</span>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-[#18181b] border border-gray-200/60 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4 transition-colors duration-300">
              <div className="text-sm font-bold border-b border-gray-100 dark:border-gray-800 pb-3 flex justify-between text-gray-800 dark:text-gray-200">
                Chi tiết thanh toán
                <span className="text-gray-500 dark:text-gray-400 font-medium text-xs">Đã chọn {totalSelectedItems} món</span>
              </div>
              <div className="space-y-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Tổng tiền hàng</span>
                  <span className="text-gray-900 dark:text-gray-100 font-bold">{(subTotal + productDiscountTotal).toLocaleString("vi-VN")} ₫</span>
                </div>
                {productDiscountTotal > 0 && (
                  <div className="flex justify-between text-[#d70018] dark:text-red-400">
                    <span>Giảm giá sản phẩm</span>
                    <span className="font-bold">-{productDiscountTotal.toLocaleString("vi-VN")} ₫</span>
                  </div>
                )}
                {appliedVoucher && (
                  <div className="flex justify-between text-[#d70018] dark:text-red-400">
                    <span>Voucher ({appliedVoucher.code})</span>
                    <span className="font-bold">-{voucherDiscountAmount.toLocaleString("vi-VN")} ₫</span>
                  </div>
                )}
              </div>
              
              <div className="border-t border-gray-100 dark:border-gray-800 pt-4 flex justify-between items-end">
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Tổng tạm tính:</span>
                <div className="text-right">
                  <div className="text-2xl font-black text-[#d70018] dark:text-red-500 leading-none">{finalTotal.toLocaleString("vi-VN")} ₫</div>
                </div>
              </div>

              <Button 
                onClick={handleProceedToCheckout} 
                disabled={selectedItems.length === 0}
                className="w-full py-6 rounded-xl font-bold bg-[#d70018] hover:bg-red-700 text-white text-base shadow-lg shadow-red-500/30 dark:shadow-none transition-all mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                TIẾN HÀNH ĐẶT HÀNG
              </Button>
            </div>
            
            {/* KHỐI 3 ĐẶC QUYỀN ĐÃ ĐƯỢC GIỮ LẠI NGUYÊN VẸN */}
            <div className="bg-white dark:bg-[#18181b] border border-gray-200/60 dark:border-gray-800 rounded-2xl p-4 shadow-sm flex justify-between items-center text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase text-center transition-colors duration-300">
              <div className="flex flex-col items-center gap-1.5 w-1/3"><ShieldCheck className="w-5 h-5 text-emerald-500" /> Chính hãng 100%</div>
              <div className="flex flex-col items-center gap-1.5 w-1/3 border-x border-gray-100 dark:border-gray-800"><RotateCcw className="w-5 h-5 text-blue-500" /> Đổi trả 30 ngày</div>
              <div className="flex flex-col items-center gap-1.5 w-1/3"><Truck className="w-5 h-5 text-amber-500" /> Giao siêu tốc</div>
            </div>
          </div>
        </div>

        {/* --- SẢN PHẨM LIÊN QUAN DẠNG GRID --- */}
        {relatedProducts.length > 0 && (
          <div className="bg-white dark:bg-[#18181b] rounded-2xl p-4 md:p-6 shadow-sm border border-gray-200 dark:border-gray-800 mt-10 transition-colors duration-300">
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-gray-800 pb-3">
              <h2 className="text-lg md:text-xl font-black uppercase tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-red-600" /> Sản phẩm liên quan
              </h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {relatedProducts.slice(0, visibleRelatedCount).map((p) => (
                <div key={`rel-${p.id}`} className="bg-white dark:bg-[#18181b] rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-800">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>

            {relatedProducts.length > visibleRelatedCount && (
              <div className="flex justify-center pt-6 mt-4 border-t border-gray-100 dark:border-gray-800">
                <button 
                  onClick={() => setVisibleRelatedCount(prev => prev + 10)}
                  className="flex items-center gap-1 px-8 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 rounded-xl hover:border-red-500 hover:text-red-600 dark:hover:bg-red-900/20 shadow-sm transition-all hover:bg-red-50"
                >
                  Xem thêm {relatedProducts.length - visibleRelatedCount} sản phẩm <ChevronDown className="w-4 h-4 ml-1" />
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(CartPage), { ssr: false });