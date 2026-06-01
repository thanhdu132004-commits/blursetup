"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { 
  Monitor, Keyboard, Mouse, Armchair, Headphones, 
  CheckCircle2, ShoppingCart, Trash2, ChevronRight, Zap, ArrowLeft, Loader2
} from "lucide-react";
import toast from "react-hot-toast";

import { getProducts } from "@/app/admin/products/actions";
import { addToCart } from "@/app/actions/cart";

const SETUP_STEPS = [
  { id: "Ghế", title: "Chọn Ghế", icon: Armchair, desc: "Bắt đầu với sự thoải mái" },
  { id: "Màn hình", title: "Chọn Màn hình", icon: Monitor, desc: "Tầm nhìn sắc nét" },
  { id: "Bàn phím", title: "Chọn Bàn phím", icon: Keyboard, desc: "Cảm giác gõ đỉnh cao" },
  { id: "Chuột", title: "Chọn Chuột", icon: Mouse, desc: "Thao tác chuẩn xác" },
  { id: "Tai nghe", title: "Chọn Tai nghe", icon: Headphones, desc: "Âm thanh sống động" }, 
];

function BuildSetupPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState("Ghế");
  const [isAdding, setIsAdding] = useState(false);

  const [selectedItems, setSelectedItems] = useState<Record<string, any>>({
    "Ghế": null,
    "Màn hình": null,
    "Bàn phím": null,
    "Chuột": null,
    "Tai nghe": null, 
  });

  useEffect(() => {
    async function loadData() {
      const allProducts = await getProducts();
      setProducts(allProducts);
      setLoading(false);
    }
    loadData();
  }, []);

  const currentProducts = useMemo(() => {
    return products.filter(p => p.category === activeStep);
  }, [products, activeStep]);

  const handleSelect = (category: string, product: any) => {
    setSelectedItems(prev => ({
      ...prev,
      [category]: prev[category]?.id === product.id ? null : product 
    }));
  };

  const { selectedCount, subTotal, discount, finalTotal } = useMemo(() => {
    const items = Object.values(selectedItems).filter(Boolean); 
    const count = items.length;
    const total = items.reduce((sum, item) => sum + item.price, 0);
    
    const discountValue = count >= 3 ? total * 0.05 : 0; 
    
    return {
      selectedCount: count,
      subTotal: total,
      discount: discountValue,
      finalTotal: total - discountValue
    };
  }, [selectedItems]);

  const handleAddComboToCart = async () => {
    if (selectedCount === 0) {
      toast.error("Vui lòng chọn ít nhất 1 sản phẩm!");
      return;
    }

    if (!session?.user) {
      toast.error("Vui lòng đăng nhập để lưu cấu hình!");
      router.push("/auth");
      return;
    }

    setIsAdding(true);
    const userId = (session.user as any).id;

    try {
      const itemsToAdded = Object.values(selectedItems).filter(Boolean);
      
      for (const item of itemsToAdded) {
        await addToCart(userId, item.id, 1);
      }

      toast.success(`Đã thêm combo ${selectedCount} món vào giỏ hàng! 🎉`, { duration: 3000 });
      router.push("/cart"); 
    } catch (error) {
      toast.error("Có lỗi xảy ra, vui lòng thử lại!");
    } finally {
      setIsAdding(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#f4f6f8] dark:bg-[#09090b] flex items-center justify-center font-bold text-gray-500">Đang tải xưởng lắp ráp...</div>;
  }

  return (
    <div className="bg-[#f4f6f8] dark:bg-[#09090b] min-h-screen pb-20 pt-6 transition-colors duration-300">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 space-y-6">
        
        {/* BREADCRUMB & HEADER */}
        <div>
          <Link href="/" className="inline-flex items-center gap-1 text-sm font-bold text-red-600 dark:text-red-500 hover:text-red-700 transition-colors mb-2">
            <ArrowLeft className="w-4 h-4" /> Về trang chủ
          </Link>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight flex items-center gap-2">
            <Zap className="w-8 h-8 text-yellow-500 fill-yellow-500" /> Build Góc Setup Của Riêng Bạn
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-sm mt-1">Tự do phối ghép - Ưu đãi giảm ngay 5% khi build từ 3 món trở lên!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* CỘT TRÁI: DANH SÁCH LỰA CHỌN (8 Cột) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* THANH ĐIỀU HƯỚNG BƯỚC (STEPS) */}
            <div className="bg-white dark:bg-[#18181b] rounded-2xl p-2 shadow-sm border border-gray-100 dark:border-gray-800 flex overflow-x-auto custom-scrollbar">
              {SETUP_STEPS.map((step, idx) => {
                const isSelected = selectedItems[step.id] !== null;
                const isActive = activeStep === step.id;
                const Icon = step.icon;

                return (
                  <button
                    key={step.id}
                    onClick={() => setActiveStep(step.id)}
                    className={`flex-1 min-w-[120px] p-3 rounded-xl flex flex-col items-center gap-2 transition-all relative ${
                      isActive ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-500" : "hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-green-500 dark:text-green-400 bg-white dark:bg-gray-900 rounded-full" />}
                    <Icon className={`w-6 h-6 ${isActive ? "text-red-600 dark:text-red-500" : "text-gray-400"}`} />
                    <div className="text-center">
                      <div className={`text-xs font-bold ${isActive ? "text-red-600 dark:text-red-500" : "text-gray-700 dark:text-gray-300"}`}>{step.title}</div>
                      <div className="text-[9px] hidden sm:block opacity-70">{step.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* DANH SÁCH SẢN PHẨM THEO BƯỚC HIỆN TẠI */}
            <div className="bg-white dark:bg-[#18181b] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 md:p-6 min-h-[500px]">
              <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-gray-800 pb-3">
                <h2 className="text-lg font-black text-gray-900 dark:text-gray-100 uppercase">Danh sách {activeStep}</h2>
                <span className="text-sm font-bold text-gray-500 dark:text-gray-400">{currentProducts.length} sản phẩm</span>
              </div>

              {currentProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {currentProducts.map((p) => {
                    const isSelected = selectedItems[activeStep]?.id === p.id;
                    return (
                      <div 
                        key={p.id} 
                        onClick={() => handleSelect(activeStep, p)}
                        className={`relative rounded-xl border-2 cursor-pointer transition-all p-3 flex flex-col bg-white dark:bg-[#18181b] group hover:shadow-md ${
                          isSelected ? "border-red-500 dark:border-red-500 shadow-sm" : "border-gray-100 dark:border-gray-800 hover:border-red-200 dark:hover:border-red-900/50"
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 z-10 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div className="w-full aspect-square bg-gray-50 dark:bg-gray-800/50 rounded-lg mb-3 p-2 overflow-hidden flex items-center justify-center">
                          <img src={p.imageUrl} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-110 transition-transform" alt={p.name} />
                        </div>
                        <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 line-clamp-2 leading-snug mb-2">{p.name}</h3>
                        <div className="mt-auto font-black text-red-600 dark:text-red-500 text-sm">
                          {p.price.toLocaleString("vi-VN")}₫
                        </div>
                        <button className={`mt-3 w-full py-2 text-xs font-bold rounded-lg transition-colors ${
                          isSelected ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-700"
                        }`}>
                          {isSelected ? "Bỏ chọn" : "Chọn sản phẩm"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20 text-gray-400 font-medium text-sm">
                  Hiện chưa có sản phẩm nào trong danh mục này.
                </div>
              )}
            </div>
          </div>

          {/* CỘT PHẢI: BẢNG TỔNG KẾT (4 Cột) */}
          <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-6">
            <div className="bg-white dark:bg-[#18181b] rounded-2xl shadow-lg border border-red-100 dark:border-red-900/30 p-5 md:p-6 overflow-hidden relative">
              
              {/* Trang trí góc */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-red-50 dark:from-red-900/20 to-transparent -mr-10 -mt-10 rounded-full pointer-events-none"></div>

              <h2 className="text-lg font-black text-gray-900 dark:text-gray-100 uppercase mb-5 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                <ShoppingCart className="w-5 h-5 text-red-600 dark:text-red-500" /> Combo Của Bạn
              </h2>

              {/* KHAY CHỨA MÓN ĐÃ CHỌN */}
              <div className="space-y-3 mb-6">
                {SETUP_STEPS.map((step) => {
                  const item = selectedItems[step.id];
                  const Icon = step.icon;
                  
                  if (!item) {
                    return (
                      <div key={`empty-${step.id}`} onClick={() => setActiveStep(step.id)} className="flex items-center gap-3 p-3 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors">
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Chưa chọn {step.id}</span>
                        <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 ml-auto group-hover:translate-x-1 transition-transform" />
                      </div>
                    );
                  }

                  return (
                    <div key={`filled-${step.id}`} className="flex items-center gap-3 p-3 border border-red-100 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10 rounded-xl">
                      <div className="w-12 h-12 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-1 flex-shrink-0">
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain dark:mix-blend-normal mix-blend-multiply" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-gray-900 dark:text-gray-200 line-clamp-1">{item.name}</h4>
                        <div className="text-[11px] font-black text-red-600 dark:text-red-400">{item.price.toLocaleString("vi-VN")}₫</div>
                      </div>
                      <button onClick={() => handleSelect(step.id, item)} className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* TỔNG KẾT TIỀN */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm font-bold text-gray-600 dark:text-gray-400">
                  <span>Tổng {selectedCount} món</span>
                  <span>{subTotal.toLocaleString("vi-VN")}₫</span>
                </div>
                
                {/* HIỂN THỊ ĐIỀU KIỆN GIẢM GIÁ */}
                {selectedCount < 3 ? (
                  <div className="text-[11px] text-orange-600 dark:text-orange-400 font-bold bg-orange-100 dark:bg-orange-900/20 p-2 rounded-lg text-center">
                    Chọn thêm {3 - selectedCount} món nữa để được GIẢM 5% toàn bộ
                  </div>
                ) : (
                  <div className="flex justify-between text-sm font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20 p-2 rounded-lg">
                    <span>Ưu đãi Combo (5%)</span>
                    <span>-{discount.toLocaleString("vi-VN")}₫</span>
                  </div>
                )}

                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between items-end">
                  <span className="text-sm font-black text-gray-900 dark:text-gray-100">Thành tiền:</span>
                  <span className="text-2xl font-black text-red-600 dark:text-red-500 leading-none">
                    {finalTotal.toLocaleString("vi-VN")}₫
                  </span>
                </div>
              </div>

              <button 
                onClick={handleAddComboToCart}
                disabled={isAdding || selectedCount === 0}
                className="w-full mt-4 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black uppercase text-sm shadow-lg shadow-red-200 dark:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : "THÊM COMBO VÀO GIỎ"}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(BuildSetupPage), { ssr: false });