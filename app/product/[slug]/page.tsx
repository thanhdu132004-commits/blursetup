"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { addToCart } from "@/app/actions/cart";
import toast from "react-hot-toast";
import { getReviewsByProductId, submitReview } from "@/app/actions/review"; 
import { useRouter } from "next/navigation"; 
import { 
  Star, ChevronRight, ShoppingCart, Gift, ShieldCheck, 
  ThumbsUp, MessageCircle, Send, CheckCircle2, ChevronDown, User as UserIcon,
  MapPin, Truck, RefreshCcw, Wrench, Headphones, Plus, X
} from "lucide-react";

import { getProductBySlug, getProducts } from "@/app/admin/products/actions";
import { getNews } from "@/app/admin/news/actions"; 

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: session } = useSession();

  const router = useRouter(); 
  
  // STATE CƠ BẢN
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [newsArticles, setNewsArticles] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]); 
  
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [showFloatingBar, setShowFloatingBar] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isAddingCart, setIsAddingCart] = useState(false);

  // STATE CHO FORM ĐÁNH GIÁ
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  // --- BUNDLE DEALS STATE ---
  const [bundleProducts, setBundleProducts] = useState<any[]>([]);
  const [selectedBundleIds, setSelectedBundleIds] = useState<string[]>([]);

  // HÀM XỬ LÝ NÚT BẤM THÊM VÀO GIỎ HÀNG
  const handleAddToCart = async () => {
    setIsAddingCart(true);
    const userId = (session?.user as any)?.id || "6a0de954edad2fe7af807713"; 
    
    const res = await addToCart(userId, product.id, 1);
    if (res.success) {
      toast.success("Thêm vào giỏ hàng thành công!", {
        style: { borderRadius: '12px', background: '#333', color: '#fff' }
      });
    } else {
      toast.error("Có lỗi: " + res.error);
    }
    setIsAddingCart(false);
  };

  // Hàm xử lý chọn ảnh
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (reviewImages.length + files.length > 2) {
      return toast.error("Chỉ được tải lên tối đa 2 hình ảnh!");
    }

    files.forEach(file => {
      if (file.size > 2 * 1024 * 1024) { 
        return toast.error(`Ảnh ${file.name} quá lớn (Tối đa 2MB)`);
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setReviewImages(prev => [...prev, reader.result as string]);
      };
    });
  };

  // HÀM XỬ LÝ NÚT MUA NGAY 
  const handleBuyNow = async () => {
    setIsAddingCart(true);
    const userId = (session?.user as any)?.id || "6a0de954edad2fe7af807713"; 
    
    const res = await addToCart(userId, product.id, 1);
    
    if (res.success) {
      sessionStorage.setItem("buyNowProductId", product.id);
      window.location.href = "/checkout";
    } else {
      toast.error("Có lỗi xảy ra: " + res.error);
      setIsAddingCart(false);
    }
  };

  // HÀM GỬI ĐÁNH GIÁ THẬT
  const handleSubmitReview = async () => {
    if (!comment.trim()) {
      toast.error("Vui lòng nhập nội dung đánh giá!");
      return;
    }
    
    setIsSubmittingReview(true);
    const userId = (session?.user as any)?.id || "6a0de954edad2fe7af807713"; 
    
    // Đã cập nhật để gửi ảnh đi
    const res = await submitReview(product.id, userId, rating, comment, reviewImages);
    if (res.success) {
      toast.success("Cảm ơn bạn! Đánh giá đã được ghi nhận.", {
        style: { borderRadius: '12px', background: '#333', color: '#fff' }
      });
      setComment("");
      setReviewImages([]);
      setShowReviewForm(false);
      
      const updatedReviews = await getReviewsByProductId(product.id);
      setReviews(updatedReviews);
      
      const updatedProduct = await getProductBySlug(slug);
      setProduct(updatedProduct);
    } else {
      toast.error("Có lỗi: " + res.error);
    }
    setIsSubmittingReview(false);
  };

  // --- HÀM THÊM CẢ COMBO VÀO GIỎ HÀNG ---
  const handleAddBundleToCart = async () => {
    setIsAddingCart(true);
    const userId = (session?.user as any)?.id || "6a0de954edad2fe7af807713"; 
    
    await addToCart(userId, product.id, 1);
    for (const id of selectedBundleIds) {
      await addToCart(userId, id, 1);
    }
    
    toast.success(`Thêm thành công Combo ${selectedBundleIds.length + 1} sản phẩm vào giỏ!`, {
      icon: '🎉', style: { borderRadius: '10px', background: '#d70018', color: '#fff' }
    });
    setIsAddingCart(false);
  };

  const toggleBundleItem = (id: string) => {
    setSelectedBundleIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // Tính toán tiền Combo
  const selectedAccessories = bundleProducts.filter(p => selectedBundleIds.includes(p.id));
  const accessoriesTotal = selectedAccessories.reduce((sum, p) => sum + p.price, 0);
  const bundleDiscount = selectedAccessories.length > 0 ? selectedAccessories.length * 50000 : 0; 
  const finalBundlePrice = (product?.price || 0) + accessoriesTotal - bundleDiscount;

  useEffect(() => {
    async function loadData() {
      if (!slug) return;
      const data = await getProductBySlug(slug);
      if (data) {
        setProduct(data);
        
        try {
          const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
          const filtered = viewed.filter((s: string) => s !== data.slug && s !== data.id);
          const updated = [data.slug || data.id, ...filtered].slice(0, 10);
          localStorage.setItem('recentlyViewed', JSON.stringify(updated));
        } catch (e) {
          console.error("Lỗi lưu lịch sử xem sản phẩm:", e);
        }

        const fetchedReviews = await getReviewsByProductId(data.id);
        setReviews(fetchedReviews);
      }

      const [allProducts, allNews] = await Promise.all([ getProducts(), getNews() ]);

      if (data) {
        // 1. SẢN PHẨM LIÊN QUAN
        const related = allProducts.filter((p: any) => p.category === data.category && p.id !== data.id).slice(0, 4);
        setRelatedProducts(related);
        
        // 2. THUẬT TOÁN GỢI Ý MUA KÈM
        let targetCategories: string[] = [];
        switch (data.category) {
          case "Laptop": targetCategories = ["Phụ kiện", "Chuột", "Bàn phím"]; break;
          case "Màn hình": targetCategories = ["Bàn phím", "Chuột", "Phụ kiện"]; break;
          case "Bàn phím": targetCategories = ["Chuột", "Tai nghe"]; break;
          case "Chuột": targetCategories = ["Bàn phím", "Tai nghe", "Phụ kiện"]; break;
          case "Tai nghe": targetCategories = ["Ghế", "Phụ kiện", "Bàn phím"]; break;
          case "Ghế": targetCategories = ["Tai nghe", "Phụ kiện", "Bàn phím"]; break;
          default: targetCategories = ["Phụ kiện"];
        }
        
        const accessories: any[] = [];
        for (const targetCat of targetCategories) {
          const item = allProducts.find((p: any) => 
            p.category === targetCat && p.id !== data.id && !accessories.some(a => a.id === p.id) 
          );
          if (item) accessories.push(item);
          if (accessories.length === 2) break; 
        }
        
        if (accessories.length < 2) {
          const backups = allProducts.filter((p: any) => 
            targetCategories.includes(p.category) && p.id !== data.id && !accessories.some(a => a.id === p.id)
          ).slice(0, 2 - accessories.length);
          accessories.push(...backups);
        }
        
        setBundleProducts(accessories);
        setSelectedBundleIds(accessories.map(a => a.id)); 
      }
      
      setNewsArticles(allNews.slice(0, 3)); 
      setLoading(false);
    }
    loadData();
  }, [slug]);

  useEffect(() => {
    const handleScroll = () => setShowFloatingBar(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (loading) return <div className="min-h-screen bg-gray-50 dark:bg-[#09090b] flex items-center justify-center font-bold text-gray-500">Đang tải dữ liệu sản phẩm...</div>;
  if (!product) return <div className="min-h-screen bg-gray-50 dark:bg-[#09090b] flex items-center justify-center font-bold text-gray-500">Không tìm thấy sản phẩm này.</div>;

  const allImages = [product.imageUrl, ...(product.gallery || [])].filter(Boolean);

  return (
    <div className="bg-gray-50 dark:bg-[#09090b] min-h-screen pb-32 transition-colors duration-300">
      {/* BREADCRUMB */}
      <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
        <Link href="/" className="hover:text-red-600 dark:hover:text-red-400">Trang chủ</Link> <ChevronRight className="w-3 h-3" />
        <span className="hover:text-red-600 dark:hover:text-red-400 cursor-pointer">{product.category}</span> <ChevronRight className="w-3 h-3" />
        <span className="text-gray-900 dark:text-gray-200 line-clamp-1">{product.name}</span>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 space-y-6">
        
        {/* PHẦN 1: HERO SECTION */}
        <div className="bg-white dark:bg-[#18181b] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 md:p-6">
          <div className="border-b border-gray-100 dark:border-gray-800 pb-4 mb-4">
            <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-gray-100 leading-snug">{product.name}</h1>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center text-yellow-400">
                {[1,2,3,4,5].map(i => <Star key={i} className={`w-4 h-4 ${i <= Math.round(product.rating || 5) ? 'fill-current' : 'text-gray-300 dark:text-gray-600'}`} />)}
                <span className="text-gray-500 dark:text-gray-400 text-xs font-medium ml-2">({product.reviewCount || 0} đánh giá)</span>
              </div>
              <div className="h-4 w-px bg-gray-300 dark:bg-gray-700"></div>
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Thương hiệu: <span className="text-blue-600 dark:text-blue-400">{product.brand}</span></span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* CỘT TRÁI: HÌNH ẢNH */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              <div className="w-full flex flex-col items-center gap-4">
                <div className="w-full max-w-md aspect-square rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 p-4 flex items-center justify-center">
                  <img src={allImages[activeImg]} className="max-w-full max-h-full object-contain mix-blend-multiply dark:mix-blend-normal transition-all duration-300" alt={product.name} />
                </div>
                {allImages.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar justify-center w-full">
                    {allImages.map((img, idx) => (
                      <button 
                        key={idx} onClick={() => setActiveImg(idx)}
                        className={`w-16 h-16 md:w-20 md:h-20 rounded-xl border-2 flex-shrink-0 p-1 bg-white dark:bg-gray-800 flex items-center justify-center transition-all ${activeImg === idx ? 'border-red-600 shadow-md scale-105' : 'border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-500'}`}
                      >
                        <img src={img} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" alt={`thumb-${idx}`} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {product.highlights && product.highlights.length > 0 && (
                <div className="bg-[#fff3f3] dark:bg-red-900/10 rounded-2xl p-5 border border-red-100 dark:border-red-900/30">
                  <h3 className="text-base font-black text-red-600 dark:text-red-500 uppercase mb-4 text-center">Tính năng nổi bật</h3>
                  <ul className="space-y-3 text-sm text-gray-800 dark:text-gray-200 font-medium">
                    {product.highlights.map((hl: string, i: number) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" /> 
                        <span className="leading-relaxed">{hl}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* CỘT PHẢI: GIÁ, NÚT MUA & THÔNG SỐ */}
            <div className="lg:col-span-6 space-y-6">
              <div className="flex flex-col border-b border-gray-100 dark:border-gray-800 pb-4">
                <div className="flex items-end gap-4">
                  <span className="text-4xl font-black text-red-600 dark:text-red-500">{Number(product.price).toLocaleString("vi-VN")}₫</span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-sm font-bold text-gray-400 dark:text-gray-500 line-through mb-1.5">
                      {Number(product.originalPrice).toLocaleString("vi-VN")}₫
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm font-medium">
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300">Tình trạng: <strong className="text-gray-900 dark:text-white">{product.condition}</strong></span>
                <span className="px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg">Kho: <strong>{product.stock > 0 ? `Còn ${product.stock} sản phẩm` : "Hết hàng"}</strong></span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2">
                <button 
                  disabled={product.stock <= 0 || isAddingCart}
                  onClick={handleBuyNow} 
                  className="bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl flex flex-col items-center justify-center transition-colors shadow-lg shadow-red-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <span className="font-black uppercase text-base md:text-lg group-hover:scale-105 transition-transform">
                    {isAddingCart ? "Đang xử lý..." : "Mua Ngay"}
                  </span>
                  <span className="text-[10px] opacity-90 hidden sm:block">Giao tận nơi hoặc nhận tại shop</span>
                </button>
                <button 
                  disabled={product.stock <= 0 || isAddingCart}
                  onClick={handleAddToCart}
                  className="bg-white dark:bg-[#18181b] border-2 border-red-600 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 py-4 rounded-xl flex flex-col items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <ShoppingCart className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="font-black text-sm uppercase">
                    {isAddingCart ? "Đang thêm..." : "Thêm vào giỏ"}
                  </span>
                </button>
              </div>

              {/* THÔNG TIN VẬN CHUYỂN */}
              <div className="bg-white dark:bg-[#18181b] border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">Thông tin vận chuyển</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center bg-blue-500 text-white rounded-md px-2 py-0.5 text-xs font-black italic shadow-sm mt-0.5 flex-shrink-0">
                    <Truck className="w-3.5 h-3.5 mr-1" /> 2 GIỜ
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
                    Giao hàng hỏa tốc trong 2h tại <span className="font-bold text-gray-900 dark:text-white">Nội thành TP. HCM</span> & <span className="font-bold text-gray-900 dark:text-white">Hà Nội</span>.
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:underline mt-1">
                  <MapPin className="w-4 h-4" /> Chọn địa chỉ giao hàng để xem thời gian dự kiến
                </div>
              </div>

              {/* ĐẶC QUYỀN MUA HÀNG TẠI BLURSETUP */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 bg-green-50/50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/30">
                  <ShieldCheck className="w-6 h-6 text-green-600 dark:text-green-500 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-gray-900 dark:text-gray-200">100% Chính hãng</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">Hoàn tiền 200% nếu fake</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                  <RefreshCcw className="w-6 h-6 text-blue-600 dark:text-blue-500 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-gray-900 dark:text-gray-200">Đổi trả 30 ngày</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">Miễn phí tận nơi</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-orange-50/50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-900/30">
                  <Wrench className="w-6 h-6 text-orange-500 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-gray-900 dark:text-gray-200">Bảo hành 2 năm</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">Chính hãng toàn quốc</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-purple-50/50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-900/30">
                  <Headphones className="w-6 h-6 text-purple-600 dark:text-purple-500 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-gray-900 dark:text-gray-200">Hỗ trợ kỹ thuật</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">Trọn đời 24/7</span>
                  </div>
                </div>
              </div>

              {/* THÔNG SỐ KỸ THUẬT */}
              {product.specs && Object.keys(product.specs).length > 0 && (
                <div className="bg-white dark:bg-[#18181b] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 mt-6 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                    <h2 className="text-base font-black text-gray-900 dark:text-white uppercase">Thông số kỹ thuật</h2>
                  </div>
                  <div className="p-4">
                    <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden text-xs">
                      {Object.keys(product.specs).map((key, i) => (
                        <div key={i} className={`flex items-start p-3 ${i % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/30' : 'bg-white dark:bg-[#18181b]'}`}>
                          <div className="w-1/3 font-bold text-gray-500 dark:text-gray-400">{key}</div>
                          <div className="w-2/3 font-bold text-gray-900 dark:text-gray-200">{product.specs[key]}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- ƯU ĐÃI MUA KÈM (BUNDLE DEALS) --- */}
        {bundleProducts.length > 0 && (
          <div className="bg-gradient-to-r from-red-50 dark:from-red-900/10 to-orange-50 dark:to-orange-900/10 rounded-2xl p-5 md:p-6 border border-red-100 dark:border-red-900/30 shadow-sm">
            <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase mb-5 flex items-center gap-2">
              <Gift className="w-5 h-5 text-red-600 dark:text-red-500" /> Ưu đãi mua kèm (Combo Tiết Kiệm)
            </h2>
            
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <div className="flex flex-1 flex-wrap items-center justify-center lg:justify-start gap-4 w-full">
                <div className="flex flex-col items-center w-28 flex-shrink-0">
                  <div className="w-20 h-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-2 shadow-sm mb-2 relative">
                    <img src={product.imageUrl} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" alt="main" />
                    <CheckCircle2 className="absolute -top-2 -right-2 w-5 h-5 text-green-500 bg-white dark:bg-gray-800 rounded-full" />
                  </div>
                  <span className="text-[10px] font-bold text-center line-clamp-2 text-gray-800 dark:text-gray-200">{product.name}</span>
                </div>

                {bundleProducts.map(bp => (
                  <div key={bp.id} className="flex items-center gap-4">
                    <Plus className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div className="flex flex-col items-center w-28 flex-shrink-0 cursor-pointer group" onClick={() => toggleBundleItem(bp.id)}>
                      <div className={`w-20 h-20 bg-white dark:bg-gray-800 border-2 rounded-xl p-2 shadow-sm mb-2 relative transition-all ${selectedBundleIds.includes(bp.id) ? 'border-red-500' : 'border-gray-200 dark:border-gray-700 group-hover:border-red-300 dark:group-hover:border-red-500'}`}>
                        <img src={bp.imageUrl} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" alt="phu-kien" />
                        <input type="checkbox" readOnly checked={selectedBundleIds.includes(bp.id)} className="absolute -top-2 -right-2 w-5 h-5 accent-red-600 cursor-pointer pointer-events-none" />
                      </div>
                      <span className="text-[10px] font-bold text-center line-clamp-2 text-gray-800 dark:text-gray-200">{bp.name}</span>
                      <span className="text-[11px] font-black text-red-600 dark:text-red-500 mt-0.5">{bp.price.toLocaleString("vi-VN")}₫</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="w-full lg:w-72 bg-white dark:bg-[#18181b] rounded-xl border border-red-200 dark:border-red-900/50 shadow-sm p-4 flex flex-col justify-center flex-shrink-0">
                <div className="flex justify-between text-sm mb-2 text-gray-600 dark:text-gray-400">
                  <span>Tổng {selectedBundleIds.length + 1} sản phẩm:</span>
                  <span className="line-through">{(product.price + accessoriesTotal).toLocaleString("vi-VN")} ₫</span>
                </div>
                <div className="flex justify-between text-sm mb-3 text-green-600 dark:text-green-500 font-bold">
                  <span>Tiết kiệm được:</span>
                  <span>- {bundleDiscount.toLocaleString("vi-VN")} ₫</span>
                </div>
                <div className="flex justify-between items-end border-t border-gray-100 dark:border-gray-800 pt-3 mb-4">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">Combo:</span>
                  <span className="text-xl font-black text-red-600 dark:text-red-500">{finalBundlePrice.toLocaleString("vi-VN")} ₫</span>
                </div>
                <button 
                  disabled={isAddingCart}
                  onClick={handleAddBundleToCart}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-black text-sm transition-colors shadow-md disabled:opacity-50"
                >
                  {isAddingCart ? "Đang xử lý..." : "THÊM COMBO VÀO GIỎ"}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* PHẦN 2: CHI TIẾT HTML & TIN TỨC */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white dark:bg-[#18181b] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-black text-red-600 dark:text-red-500 uppercase mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">Thông tin chi tiết</h2>
              <div className={`relative transition-all duration-500 overflow-hidden ${isDescExpanded ? 'max-h-[none]' : 'max-h-[600px]'}`}>
                {product.description ? (
                  <div 
                    className="prose prose-red dark:prose-invert max-w-none w-full text-gray-700 dark:text-gray-300 leading-relaxed
                      prose-headings:font-black prose-headings:text-gray-900 dark:prose-headings:text-white prose-headings:mt-8 prose-headings:mb-4
                      prose-h2:!text-2xl prose-h2:!font-black prose-h3:!text-xl
                      prose-p:text-[15px] prose-p:mb-5 prose-p:text-justify
                      prose-img:!mx-auto prose-img:rounded-2xl prose-img:my-8 prose-img:shadow-md prose-img:max-w-full lg:prose-img:max-w-[80%] prose-img:object-cover
                      prose-ul:list-disc prose-ul:pl-5
                      prose-strong:!text-gray-900 dark:prose-strong:!text-white prose-strong:!font-bold"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">Đang cập nhật bài viết chi tiết cho sản phẩm này.</p>
                )}
                {!isDescExpanded && product.description && (
                  <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white dark:from-[#18181b] to-transparent"></div>
                )}
              </div>
              {product.description && (
                <div className="mt-4 text-center">
                  <button 
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                    className="px-6 py-2.5 border border-red-600 text-red-600 dark:text-red-500 font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-sm transition shadow-sm flex items-center gap-1 mx-auto"
                  >
                    {isDescExpanded ? 'Thu gọn nội dung' : 'Xem thêm nội dung'} 
                    <ChevronDown className={`w-4 h-4 transition-transform ${isDescExpanded ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-[#18181b] p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 sticky top-20">
              <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-800 pb-3">
                <h2 className="text-base font-black text-gray-900 dark:text-white uppercase">Tin tức sản phẩm</h2>
                <Link href="/tin-tuc" className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer">Xem tất cả</Link>
              </div>
              <div className="space-y-4">
                {newsArticles.length > 0 ? newsArticles.map((news) => (
                  <Link key={news.id} href={`/tin-tuc/${news.slug}`} className="flex gap-3 group border-b border-gray-50 dark:border-gray-800 pb-3 last:border-0 last:pb-0">
                    <div className="w-24 h-16 rounded-xl bg-gray-200 dark:bg-gray-800 overflow-hidden flex-shrink-0 border border-gray-100 dark:border-gray-700">
                      <img src={news.imageUrl || "/placeholder.jpg"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="news" />
                    </div>
                    <div className="flex flex-col justify-between py-0.5">
                      <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 line-clamp-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-snug">{news.title}</h4>
                      <p className="text-[10px] text-gray-400 font-medium">{new Date(news.createdAt).toLocaleDateString("vi-VN")}</p>
                    </div>
                  </Link>
                )) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic">Chưa có tin tức nào.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* PHẦN 3: SẢN PHẨM CÙNG DANH MỤC */}
        {relatedProducts.length > 0 && (
          <div className="bg-white dark:bg-[#18181b] p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase mb-4">Có thể bạn cũng thích</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((rp) => {
                const discount = rp.originalPrice ? Math.round(((rp.originalPrice - rp.price) / rp.originalPrice) * 100) : 0;
                return (
                  <Link href={`/product/${rp.slug || rp.id}`} key={rp.id} className="border border-gray-100 dark:border-gray-800 rounded-xl p-3 hover:shadow-lg transition-shadow bg-white dark:bg-[#18181b] relative group flex flex-col">
                    {discount > 0 && <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-md z-10 shadow-sm">Giảm {discount}%</span>}
                    <div className="w-full aspect-square mb-3 relative flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg p-2 overflow-hidden">
                       <img src={rp.imageUrl} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-110 transition-transform duration-500" alt={rp.name} />
                    </div>
                    <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 line-clamp-2 mb-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-snug flex-1">{rp.name}</h3>
                    <div className="flex flex-col mt-auto">
                      <span className="text-sm font-black text-red-600 dark:text-red-500">{Number(rp.price).toLocaleString("vi-VN")}₫</span>
                      {rp.originalPrice && <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 line-through">{Number(rp.originalPrice).toLocaleString("vi-VN")}₫</span>}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* PHẦN 4: ĐÁNH GIÁ SẢN PHẨM */}
        <div className="bg-white dark:bg-[#18181b] p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase mb-6">Đánh giá sản phẩm</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center border-b border-gray-100 dark:border-gray-800 pb-6 mb-6">
            <div className="md:col-span-3 text-center border-r border-gray-100 dark:border-gray-800">
              <p className="text-5xl font-black text-red-600 dark:text-red-500">{product.rating ? Number(product.rating).toFixed(1) : "5.0"}<span className="text-2xl text-gray-400 dark:text-gray-600">/5</span></p>
              <div className="flex items-center justify-center text-yellow-400 my-2">
                {[1,2,3,4,5].map(i => <Star key={i} className={`w-5 h-5 ${i <= Math.round(product.rating || 5) ? 'fill-current' : 'text-gray-300 dark:text-gray-700'}`} />)}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{product.reviewCount || 0} đánh giá</p>
            </div>

            <div className="md:col-span-5 space-y-2">
              {[5,4,3,2,1].map((star) => {
                const count = reviews.filter(r => r.rating === star).length;
                const percent = reviews.length > 0 ? (count / reviews.length) * 100 : (star === 5 ? 100 : 0);
                return (
                  <div key={star} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-bold flex items-center gap-1 w-8">{star} <Star className="w-3 h-3 fill-yellow-400 text-yellow-400"/></span>
                    <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-red-600 dark:bg-red-500 transition-all" style={{ width: `${percent}%` }}></div>
                    </div>
                    <span className="font-medium w-12 text-right">{count} đánh giá</span>
                  </div>
                )
              })}
            </div>
            
            <div className="md:col-span-4 flex flex-col items-center gap-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center">Bạn đã dùng sản phẩm này?</p>
              <button 
                onClick={() => {
                  if (!session) return toast.error("Vui lòng đăng nhập để gửi đánh giá!");
                  setShowReviewForm(!showReviewForm);
                }}
                className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-700 shadow-md transition-all"
              >
                Gửi đánh giá của bạn
              </button>
            </div>
          </div>

          {/* Form nhập đánh giá */}
          {showReviewForm && (
            <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-200 dark:border-gray-700 mb-6 transition-all animate-in slide-in-from-top-2">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3">Đánh giá của bạn về {product.name}</h3>
              <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Chất lượng:</span>
                  <div className="flex cursor-pointer">
                    {[1,2,3,4,5].map(i => (
                      <Star 
                        key={i} 
                        onClick={() => setRating(i)}
                        className={`w-6 h-6 transition-colors ${i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} 
                      />
                    ))}
                  </div>
              </div>
              
              {/* --- PHẦN 4: FORM NHẬP ĐÁNH GIÁ & UPLOAD ẢNH --- */}
              <textarea 
                rows={3} 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Xin mời chia sẻ cảm nhận của bạn về sản phẩm..." 
                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-red-500 dark:focus:border-red-500 bg-white dark:bg-[#18181b] text-gray-900 dark:text-white mb-3 text-sm resize-none"
              />
              
              <div className="mb-4">
                <div className="flex gap-3 flex-wrap">
                  {reviewImages.map((img, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden group">
                      <img src={img} className="w-full h-full object-cover" alt="preview" />
                      <button onClick={() => setReviewImages(reviewImages.filter((_, i) => i !== idx))} className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  {reviewImages.length < 2 && (
                    <label className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-red-500 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 transition-colors">
                      <Plus className="w-5 h-5" />
                      <span className="text-[9px] font-bold mt-1">Thêm ảnh</span>
                      <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                    </label>
                  )}
                </div>
              </div>
              {/* --- KẾT THÚC PHẦN 4 --- */}

              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setShowReviewForm(false)}
                  className="px-6 py-2 rounded-lg text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleSubmitReview}
                  disabled={isSubmittingReview}
                  className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-2 rounded-lg text-sm font-bold hover:bg-black dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {isSubmittingReview ? "Đang gửi..." : "Gửi đánh giá"}
                </button>
              </div>
            </div>
          )}

          {/* Danh sách đánh giá thật */}
          <div className="space-y-6">
            {reviews.length > 0 ? reviews.map(review => (
              <div key={review.id} className="border-b border-gray-100 dark:border-gray-800 pb-6 last:border-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center font-black text-gray-600 dark:text-gray-400 text-xs">
                    {review.user?.name ? review.user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4"/>}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      {review.user?.name || "Khách hàng"} 
                      <span className="bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-500 text-[9px] px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3"/> Đã mua hàng
                      </span>
                    </p>
                    <div className="flex text-yellow-400 mt-0.5">
                      {[1,2,3,4,5].map(i => <Star key={i} className={`w-3 h-3 ${i <= review.rating ? 'fill-current' : 'text-gray-300 dark:text-gray-700'}`} />)}
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mt-3 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">{review.comment}</p>
                
                {/* --- PHẦN 5: HIỂN THỊ ẢNH ĐÁNH GIÁ --- */}
                {review.images && review.images.length > 0 && (
                  <div className="flex gap-2 mt-3 pl-2">
                    {review.images.map((img: string, i: number) => (
                      <div key={i} className="w-16 h-16 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                        <img src={img} className="w-full h-full object-cover" alt="review-img" />
                      </div>
                    ))}
                  </div>
                )}
                {/* --- KẾT THÚC PHẦN 5 --- */}

                <div className="flex items-center gap-4 mt-3 text-xs font-medium text-gray-400 dark:text-gray-500 pl-2">
                  <button className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400"><ThumbsUp className="w-3 h-3" /> Hữu ích</button>
                  <span>{new Date(review.createdAt).toLocaleDateString("vi-VN")}</span>
                </div>
              </div>
            )) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-6">Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên!</p>
            )}
          </div>
        </div>

      </div>

      {/* FLOATING ACTION BAR DƯỚI CÙNG */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#18181b] border-t border-gray-200 dark:border-gray-800 shadow-[0_-4px_10px_-1px_rgb(0,0,0,0.1)] transition-transform duration-300 ${showFloatingBar ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="hidden md:flex items-center gap-3">
            <img src={product.imageUrl} className="w-12 h-12 rounded-lg border dark:border-gray-700 p-1 bg-gray-50 dark:bg-gray-800 object-contain dark:mix-blend-normal mix-blend-multiply" alt="thumb-float" />
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-1">{product.name}</p>
              <div className="flex items-center gap-2">
                <span className="text-red-600 dark:text-red-500 font-black">{Number(product.price).toLocaleString("vi-VN")}₫</span>
                {product.originalPrice && <span className="text-xs text-gray-400 dark:text-gray-500 line-through">{Number(product.originalPrice).toLocaleString("vi-VN")}₫</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-[400px]">
            <button 
              disabled={product.stock <= 0 || isAddingCart}
              onClick={handleAddToCart}
              className="flex-1 py-3 border-2 border-red-600 text-red-600 bg-white dark:bg-[#18181b] rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
            >
              <ShoppingCart className="w-5 h-5" /> {isAddingCart ? "Đang thêm..." : "Thêm giỏ"}
            </button>
            <button 
              disabled={product.stock <= 0 || isAddingCart}
              onClick={handleBuyNow} 
              className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black text-sm hover:bg-red-700 shadow-md shadow-red-200 dark:shadow-none transition-colors disabled:opacity-50"
            >
              {isAddingCart ? "Đang xử lý..." : "MUA NGAY"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}