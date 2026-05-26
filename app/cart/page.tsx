"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast"; // Thêm dòng này
import { 
  Trash2, Plus, Minus, ArrowLeft, ShoppingBag, 
  TicketPercent, ShieldCheck, Truck, RotateCcw, Sparkles, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCart, updateCartItemQuantity, removeCartItem } from "@/app/actions/cart";
import { useSession } from "next-auth/react";

import { getProducts } from "@/app/admin/products/actions";
import { ProductCard } from "@/components/product-card";

function CartPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [visibleRelatedCount, setVisibleRelatedCount] = useState(10); // Hiển thị mặc định 10 SP liên quan

  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string, discount: number } | null>(null);
  const [voucherError, setVoucherError] = useState("");

  const fetchCart = async () => {
    setLoading(true);
    const userId = (session?.user as any)?.id || "6a0de954edad2fe7af807713";
    const response = await getCart(userId);
    if (response.success) setCart(response.data);
    else setCart({ items: [] });
    setLoading(false);
  };

  useEffect(() => {
    setIsMounted(true);
    if (status !== "loading") {
      fetchCart();
    }
  }, [session, status]);

  // LOGIC LẤY SẢN PHẨM LIÊN QUAN & ĐÃ XEM
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

      // 1. Ưu tiên: Sản phẩm cùng danh mục với các món trong giỏ
      const sameCategoryProducts = allProducts.filter(
        (p: any) => (cartCategories as string[]).includes(p.category) && !cartProductIds.includes(p.id)
      );

      // 2. Bổ sung: Sản phẩm khách hàng vừa xem gần đây
      const viewedProducts = allProducts.filter(
        (p: any) => (viewedSlugs.includes(p.slug) || viewedSlugs.includes(p.id)) && !cartProductIds.includes(p.id)
      );

      // Gom 2 danh sách lại và loại bỏ trùng lặp
      const combined = [...sameCategoryProducts, ...viewedProducts];
      const uniqueProducts = Array.from(new Set(combined.map(p => p.id)))
        .map(id => combined.find(p => p.id === id));

      // Lấy danh sách cuối cùng
      const finalProducts = uniqueProducts.length > 0 
        ? uniqueProducts 
        : allProducts.filter((p: any) => !cartProductIds.includes(p.id));

      setRelatedProducts(finalProducts); // Giữ lại toàn bộ để dùng cho nút "Xem thêm"
    }

    loadRelated();
  }, [cart]);

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
            fetchCart();
          }}
          className="bg-red-600 text-white px-3 py-1 rounded-md text-xs font-bold"
        >
          Xóa
        </button>
      </span>
    ), { duration: 4000 });
  };

  const handleApplyVoucher = () => {
    setVoucherError("");
    const code = voucherCode.toUpperCase().trim();
    
    if (code === "BLURSETUP") {
      setAppliedVoucher({ code, discount: 200000 });
      toast.success("Áp dụng mã giảm giá thành công!");
    } else if (code === "FREESHIP") {
      setAppliedVoucher({ code, discount: 50000 });
      toast.success("Áp dụng mã miễn phí vận chuyển!");
    } else if (code === "") {
      toast.error("Vui lòng nhập mã giảm giá");
    } else {
      toast.error("Mã giảm giá không hợp lệ");
    }
  };

  const handleProceedToCheckout = () => {
    if (cart?.items?.length === 0) {
      toast.error("Giỏ hàng của bạn đang trống!");
      return;
    }
    
    if (appliedVoucher) {
      sessionStorage.setItem("checkoutVoucher", JSON.stringify(appliedVoucher));
    } else {
      sessionStorage.removeItem("checkoutVoucher");
    }
    
    router.push("/checkout");
  };

  const cartItems = cart?.items || [];
  const totalItems = cartItems.reduce((acc: number, item: any) => acc + item.quantity, 0);
  const subTotal = cartItems.reduce((acc: number, item: any) => acc + (item.product.price * item.quantity), 0);
  
  const productDiscountTotal = cartItems.reduce((acc: number, item: any) => {
    if (item.product.originalPrice && item.product.originalPrice > item.product.price) {
      return acc + ((item.product.originalPrice - item.product.price) * item.quantity);
    }
    return acc;
  }, 0);

  const voucherDiscountAmount = appliedVoucher ? appliedVoucher.discount : 0;
  const finalTotal = subTotal - voucherDiscountAmount;

  if (cartItems.length === 0 && !loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#f4f6f8] px-4 text-center">
        <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-[#d70018] mb-6 shadow-sm border border-gray-100">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Giỏ hàng của bạn đang trống</h2>
        <p className="text-sm text-gray-500 max-w-sm mb-6">Hãy quay lại trang chủ và chọn những món đồ công nghệ yêu thích của bạn nhé!</p>
        <Link href="/">
          <Button className="px-6 py-5 rounded-xl font-bold text-sm bg-[#d70018] hover:bg-red-700 text-white transition-all shadow-md flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Tiếp tục mua sắm
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#f4f6f8] min-h-screen pb-16 pt-6">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 space-y-6">
        
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1 text-xs font-bold text-[#d70018] hover:underline transition-colors">
            <ArrowLeft className="w-4 h-4" /> Mua thêm sản phẩm khác
          </Link>
          <span className="text-sm font-medium text-gray-600">
            Giỏ hàng của bạn: <strong className="text-gray-900">{totalItems}</strong> sản phẩm
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item: any) => {
              const p = item.product;
              const isDiscounted = p.originalPrice && p.originalPrice > p.price;
              const discountPercent = isDiscounted ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;

              return (
                <div key={item.id} className="bg-white border border-gray-200/60 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-white border border-gray-100 flex-shrink-0 p-2">
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain" />
                    {isDiscounted && (
                      <span className="absolute top-0 left-0 bg-[#d70018] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-br-lg">
                        -{discountPercent}%
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-1 w-full">
                    <h3 className="text-sm font-bold text-gray-800 line-clamp-2 leading-snug">{p.name}</h3>
                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="text-base font-black text-[#d70018]">{p.price.toLocaleString("vi-VN")} ₫</span>
                      {isDiscounted && <span className="text-xs text-gray-400 line-through font-medium">{p.originalPrice.toLocaleString("vi-VN")} ₫</span>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6 mt-2 sm:mt-0">
                    <div className="flex items-center bg-gray-50 p-1 rounded-xl border border-gray-200">
                      <button onClick={() => handleUpdateQuantity(item.id, item.quantity, "decrease")} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm hover:text-[#d70018] transition-colors"><Minus className="w-3.5 h-3.5" /></button>
                      <span className="w-10 text-center text-sm font-bold">{item.quantity}</span>
                      <button onClick={() => handleUpdateQuantity(item.id, item.quantity, "increase")} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm hover:text-[#d70018] transition-colors"><Plus className="w-3.5 h-3.5" /></button>
                    </div>
                    <button onClick={() => handleRemove(item.id)} className="p-2 text-gray-400 hover:text-[#d70018] hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold">
                      <Trash2 className="w-4 h-4" /> <span className="sm:hidden">Xóa</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-4 lg:sticky lg:top-6">
            <div className="bg-white border border-gray-200/60 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                <TicketPercent className="w-5 h-5 text-[#d70018]" /> Khuyến mãi / Voucher
              </div>
              <div className="flex gap-2">
                <input type="text" value={voucherCode} onChange={(e) => setVoucherCode(e.target.value.toUpperCase())} placeholder="Nhập mã giảm giá..." className="flex-1 border border-gray-200 rounded-xl px-3 text-sm outline-none focus:border-[#d70018] uppercase placeholder:normal-case" />
                <Button onClick={handleApplyVoucher} className="bg-[#1a1a1a] hover:bg-[#d70018] text-white rounded-xl font-bold">Áp dụng</Button>
              </div>
              {voucherError && <p className="text-xs text-[#d70018] font-medium">{voucherError}</p>}
              {appliedVoucher && (
                <div className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 p-2 rounded-lg flex items-center justify-between">
                  <span>Đã áp dụng mã: {appliedVoucher.code}</span>
                  <span>-{appliedVoucher.discount.toLocaleString("vi-VN")} ₫</span>
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-200/60 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="text-sm font-bold border-b border-gray-100 pb-3">Chi tiết thanh toán</div>
              <div className="space-y-3 text-sm font-medium text-gray-600">
                <div className="flex justify-between">
                  <span>Tổng tiền hàng</span>
                  <span className="text-gray-900 font-bold">{(subTotal + productDiscountTotal).toLocaleString("vi-VN")} ₫</span>
                </div>
                {productDiscountTotal > 0 && (
                  <div className="flex justify-between text-[#d70018]">
                    <span>Giảm giá sản phẩm</span>
                    <span className="font-bold">-{productDiscountTotal.toLocaleString("vi-VN")} ₫</span>
                  </div>
                )}
                {appliedVoucher && (
                  <div className="flex justify-between text-[#d70018]">
                    <span>Voucher ({appliedVoucher.code})</span>
                    <span className="font-bold">-{appliedVoucher.discount.toLocaleString("vi-VN")} ₫</span>
                  </div>
                )}
              </div>
              
              <div className="border-t border-gray-100 pt-4 flex justify-between items-end">
                <span className="text-sm font-bold text-gray-900">Tổng tạm tính:</span>
                <div className="text-right">
                  <div className="text-2xl font-black text-[#d70018] leading-none">{finalTotal.toLocaleString("vi-VN")} ₫</div>
                </div>
              </div>

              <Button onClick={handleProceedToCheckout} className="w-full py-6 rounded-xl font-bold bg-[#d70018] hover:bg-red-700 text-white text-base shadow-lg shadow-red-500/30 transition-all mt-2">
                TIẾN HÀNH ĐẶT HÀNG
              </Button>
            </div>
            
            <div className="bg-white border border-gray-200/60 rounded-2xl p-4 shadow-sm flex justify-between items-center text-[10px] font-bold text-gray-600 uppercase text-center">
              <div className="flex flex-col items-center gap-1.5 w-1/3"><ShieldCheck className="w-5 h-5 text-emerald-500" /> Chính hãng 100%</div>
              <div className="flex flex-col items-center gap-1.5 w-1/3 border-x border-gray-100"><RotateCcw className="w-5 h-5 text-blue-500" /> Đổi trả 30 ngày</div>
              <div className="flex flex-col items-center gap-1.5 w-1/3"><Truck className="w-5 h-5 text-amber-500" /> Giao siêu tốc</div>
            </div>
          </div>
        </div>

        {/* --- SẢN PHẨM LIÊN QUAN DẠNG GRID --- */}
        {relatedProducts.length > 0 && (
          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-200 mt-10">
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-3">
              <h2 className="text-lg md:text-xl font-black uppercase tracking-tight text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-red-600" /> Sản phẩm liên quan
              </h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {relatedProducts.slice(0, visibleRelatedCount).map((p) => (
                <div key={`rel-${p.id}`} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>

            {relatedProducts.length > visibleRelatedCount && (
              <div className="flex justify-center pt-6 mt-4 border-t border-gray-100">
                <button 
                  onClick={() => setVisibleRelatedCount(prev => prev + 10)}
                  className="flex items-center gap-1 px-8 py-2.5 bg-white border border-gray-200 text-sm font-semibold text-gray-700 rounded-xl hover:border-red-500 hover:text-red-600 shadow-sm transition-all hover:bg-red-50"
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