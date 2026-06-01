"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { getQuestions, submitQuestion } from "@/app/actions/qa";
import Link from "next/link";
import toast from "react-hot-toast"; 
import { 
  Monitor, Keyboard, Mouse, Headphones, Armchair, Zap, Flame, 
  ChevronLeft, ChevronRight, Filter, Truck, Sparkles, CircleDollarSign, 
  ChevronDown, ChevronUp, Star, TrendingDown, TrendingUp, Play, Eye, Laptop, Percent, Gift, Send, HelpCircle, X,
  Tags, ShieldCheck, Search, Clock
} from "lucide-react";

import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProductCard, type Product } from "@/components/product-card"; 
import { getProducts } from "./admin/products/actions";
import { getNews } from "./admin/news/actions"; 

// Giữ lại MOCK cho Reviews YouTube và Hỏi đáp
const MOCK_REVIEWS = [
  { 
    title: "Galaxy S26 Series: Đánh giá chi tiết sau 1 tuần sử dụng thực tế", 
    channel: "BlurReview", 
    imageUrl: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&q=80",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  },
  { 
    title: "Laptop HP Omnibook X: Chip Snapdragon X Elite có thực sự bá chủ?", 
    channel: "BlurReview", 
    imageUrl: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&q=80",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  },
  { 
    title: "Trải nghiệm Apple Watch Ultra 3: Màn hình OLED này quá đỉnh", 
    channel: "BlurReview", 
    imageUrl: "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=400&q=80",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  },
  { 
    title: "Lenovo Legion Go 2: Cỗ máy gaming cầm tay đáng mua nhất hiện tại", 
    channel: "BlurReview", 
    imageUrl: "https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=400&q=80",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  },
];

function Home() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollOldRef = useRef<HTMLDivElement>(null); 
  const scrollViewedRef = useRef<HTMLDivElement>(null); 
  const productGridRef = useRef<HTMLDivElement>(null);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [newsList, setNewsList] = useState<any[]>([]); 
  const [viewedProducts, setViewedProducts] = useState<Product[]>([]); 
  const [loading, setLoading] = useState(true);
  
  const [visibleCount, setVisibleCount] = useState(10);
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({ q1: true, q2: true });

  const { data: session } = useSession();
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionInput, setQuestionInput] = useState("");
  const [isSubmittingQ, setIsSubmittingQ] = useState(false);

  // --- STATE FLASH SALE (ĐẾM NGƯỢC) ---
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999); // Đếm ngược đến hết ngày hôm nay
      const diff = endOfDay.getTime() - now.getTime();
      setTimeLeft({
        h: Math.floor((diff / (1000 * 60 * 60)) % 24),
        m: Math.floor((diff / 1000 / 60) % 60),
        s: Math.floor((diff / 1000) % 60)
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Hàm xử lý gửi câu hỏi
  const handleAskQuestion = async () => {
    if (!session?.user) return toast.error("Vui lòng đăng nhập để đặt câu hỏi!");
    if (!questionInput.trim()) return toast.error("Vui lòng nhập nội dung câu hỏi!");
    
    setIsSubmittingQ(true);
    const userId = (session.user as any).id || "6a0de954edad2fe7af807713";
    
    const res = await submitQuestion(userId, questionInput);
    if (res.success) {
      toast.success("Đã gửi câu hỏi thành công! Chúng tôi sẽ phản hồi sớm nhất.");
      setQuestionInput("");
      const updatedQ = await getQuestions();
      setQuestions(updatedQ);
    } else {
      toast.error((res as any).error);
    }
    setIsSubmittingQ(false);
  };

  // === CÁC STATE QUẢN LÝ BỘ LỌC ===
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeBrand, setActiveBrand] = useState<string | null>(null);
  const [activePrice, setActivePrice] = useState<string | null>(null);
  const [activeSort, setActiveSort] = useState<string>("Phổ biến");

  useEffect(() => {
    async function loadData() {
      try {
        const [productsData, newsData, qaData] = await Promise.all([
          getProducts(),
          getNews(),
          getQuestions() 
        ]);

        const formattedProducts = productsData.map((p: any) => ({
          ...p,
          id: p.id || p._id?.toString()
        }));
        
        setProducts(formattedProducts);
        setNewsList(newsData || []); 
        setQuestions(qaData || []); 
        
        // --- LOGIC LẤY SẢN PHẨM ĐÃ XEM TỪ LOCALSTORAGE ---
        try {
          const storedSlugs = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
          if (storedSlugs.length > 0) {
            const viewed = storedSlugs
              .map((slug: string) => formattedProducts.find(p => p.slug === slug || p.id === slug))
              .filter(Boolean);
            setViewedProducts(viewed.slice(0, 7));
          } else {
            setViewedProducts(formattedProducts.slice(0, 7));
          }
        } catch (e) {
          setViewedProducts(formattedProducts.slice(0, 7));
        }

      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const scrollToProducts = () => {
    if (productGridRef.current) {
      productGridRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const displayProducts = useMemo(() => {
    let result = [...products];
    if (activeCategory) result = result.filter(p => p.category === activeCategory);
    if (activeBrand) result = result.filter(p => p.brand === activeBrand);
    if (activePrice) {
      result = result.filter(p => {
        if (activePrice === "Dưới 10 triệu") return p.price < 10000000;
        if (activePrice === "10 - 15 triệu") return p.price >= 10000000 && p.price <= 15000000;
        if (activePrice === "15 - 20 triệu") return p.price >= 15000000 && p.price <= 20000000;
        if (activePrice === "20 - 25 triệu") return p.price >= 20000000 && p.price <= 25000000;
        if (activePrice === "Trên 25 triệu") return p.price > 25000000;
        return true;
      });
    }

    if (activeSort === "Giá Thấp - Cao") {
      result.sort((a, b) => a.price - b.price);
    } else if (activeSort === "Giá Cao - Thấp") {
      result.sort((a, b) => b.price - a.price);
    } else if (activeSort === "Khuyến mãi HOT") {
      result = result.filter(p => p.originalPrice && p.originalPrice > p.price);
      result.sort((a, b) => {
        const percentA = ((a.originalPrice! - a.price) / a.originalPrice!) * 100;
        const percentB = ((b.originalPrice! - b.price) / b.originalPrice!) * 100;
        return percentB - percentA;
      });
    }
    return result;
  }, [products, activeCategory, activeBrand, activePrice, activeSort]);

  const clearFilters = () => {
    setActiveCategory(null);
    setActiveBrand(null);
    setActivePrice(null);
    setActiveSort("Phổ biến");
    setVisibleCount(10);
  };

  const toggleReply = (id: string) => setExpandedReplies(prev => ({ ...prev, [id]: !prev[id] }));

  const scroll = (direction: 'left' | 'right', ref: any) => {    if (ref.current) {
      const { current } = ref;
      const scrollAmount = direction === 'left' ? -current.offsetWidth + 100 : current.offsetWidth - 100;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const menuItems = [
    { name: "Laptop", icon: <Laptop className="w-5 h-5" /> },
    { name: "Màn hình", icon: <Monitor className="w-5 h-5" /> },
    { name: "Bàn phím", icon: <Keyboard className="w-5 h-5" /> },
    { name: "Chuột", icon: <Mouse className="w-5 h-5" /> },
    { name: "Tai nghe", icon: <Headphones className="w-5 h-5" /> },
    { name: "Ghế", icon: <Armchair className="w-5 h-5" /> },
    { name: "Phụ kiện", icon: <Zap className="w-5 h-5" /> },
  ];

  const brands = ["Apple", "ASUS", "Lenovo", "Dell", "HP", "MSI", "Acer", "LG", "Logitech", "Razer"];

  const filterOptions = [
    { title: "Hãng sản xuất", type: "brand", items: ["Apple", "ASUS", "Lenovo", "Dell", "HP", "MSI", "Acer", "LG", "Logitech", "Razer"] },
    { title: "Mức giá", type: "price", items: ["Dưới 10 triệu", "10 - 15 triệu", "15 - 20 triệu", "20 - 25 triệu", "Trên 25 triệu"] },
  ];

  const oldProducts = products.filter(p => p.condition === "Cũ");
  const flashSaleProducts = products.filter(p => p.originalPrice && p.originalPrice > p.price).slice(0, 5);

  return (
    <div className="bg-gray-100 dark:bg-[#09090b] min-h-screen pb-12 transition-colors duration-300">
      <section className="max-w-[1200px] mx-auto px-4 md:px-8 py-6 space-y-10">
        
        {/* KHỐI 1: MENU NGANG CHỌN DANH MỤC */}
        <div className="bg-white dark:bg-[#18181b] rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-between overflow-x-auto py-2 px-2 shadow-sm [&::-webkit-scrollbar]:hidden">
          {menuItems.map((item, index) => (
            <button 
              key={index} 
              onClick={() => {
                setActiveCategory(activeCategory === item.name ? null : item.name);
                scrollToProducts();
              }}
              className={`flex flex-col md:flex-row items-center gap-2 px-4 py-2 transition-all min-w-max rounded-lg
                ${activeCategory === item.name ? "bg-red-50 dark:bg-red-900/20 text-red-600 font-bold" : "text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 font-medium"}`}
            >
              {item.icon} <span className="text-sm">{item.name}</span>
            </button>
          ))}
        </div>

        {/* KHỐI 2: BANNER GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-auto lg:h-[300px]">
          <Link href="#" className="lg:col-span-2 relative rounded-xl overflow-hidden group shadow-sm">
            <img src="/images/banner1.jpg" alt="Banner" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"/>
          </Link>
          <div className="flex flex-col gap-4 h-[300px]">
            <Link href="#" className="flex-1 relative rounded-xl overflow-hidden group shadow-sm">
              <img src="/images/banner2.jpg" alt="Promo 1" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"/>
            </Link>
            <Link href="#" className="flex-1 relative rounded-xl overflow-hidden group shadow-sm">
              <img src="/images/banner3.jpg" alt="Promo 2" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"/>
            </Link>
          </div>
        </div>

        {/* --- KHỐI MỚI: FLASH SALE --- */}
        {!loading && flashSaleProducts.length > 0 && (
          <div className="bg-gradient-to-r from-[#d70018] via-red-500 to-orange-500 rounded-2xl p-1 shadow-lg shadow-red-500/20">
            <div className="bg-white/10 rounded-xl p-4 md:p-6 backdrop-blur-md border border-white/20">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <Zap className="w-8 h-8 text-yellow-300 fill-yellow-300 animate-pulse drop-shadow-md" />
                  <h2 className="text-2xl md:text-3xl font-black text-white italic tracking-wider drop-shadow-md">GIỜ VÀNG GIÁ SỐC</h2>
                </div>
                <div className="flex items-center gap-3 bg-black/30 px-4 py-2 rounded-xl border border-white/10">
                  <span className="text-white/90 font-bold text-sm uppercase tracking-wide">Kết thúc trong:</span>
                  <div className="flex gap-1.5 text-[#d70018] font-black items-center">
                    <span className="bg-white w-8 h-8 flex items-center justify-center rounded-md shadow-inner">{String(timeLeft.h).padStart(2, '0')}</span>
                    <span className="text-white text-lg font-bold animate-pulse">:</span>
                    <span className="bg-white w-8 h-8 flex items-center justify-center rounded-md shadow-inner">{String(timeLeft.m).padStart(2, '0')}</span>
                    <span className="text-white text-lg font-bold animate-pulse">:</span>
                    <span className="bg-white w-8 h-8 flex items-center justify-center rounded-md shadow-inner">{String(timeLeft.s).padStart(2, '0')}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {flashSaleProducts.map((product) => (
                  <div key={`flash-${product.id}`} className="bg-white dark:bg-[#18181b] rounded-xl shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* KHỐI 3: THƯƠNG HIỆU SẢN PHẨM */}
        <div>
          <h2 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-100 uppercase tracking-tight">Thương hiệu nổi bật</h2>
          <div className="flex flex-wrap gap-3">
            {brands.map((brand, index) => (
              <button 
                key={index} 
                onClick={() => {
                  setActiveBrand(activeBrand === brand ? null : brand);
                  scrollToProducts();
                }}
                className={`flex items-center justify-center h-10 px-5 border rounded-lg transition-all cursor-pointer min-w-[100px]
                  ${activeBrand === brand ? "border-red-600 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-black shadow-sm" : "bg-white dark:bg-[#18181b] border-gray-200 dark:border-gray-800 hover:border-red-600 dark:hover:border-red-500 hover:text-red-600 font-bold dark:text-gray-300"}`}
              >
                <span className="text-sm tracking-wide">{brand}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* KHỐI 4: SẢN PHẨM NỔI BẬT */}
        <div className="relative bg-[#e41e31] rounded-2xl p-4 md:p-6 shadow-lg bg-gradient-to-r from-[#d70018] to-[#ff4e50]">
          <div className="flex flex-col items-center justify-center mb-6 text-white text-center">
            <div className="flex items-center gap-3">
              <Flame className="w-8 h-8 md:w-10 md:h-10 animate-pulse text-yellow-300 fill-yellow-300" />
              <h2 className="text-2xl md:text-4xl font-black uppercase tracking-wider drop-shadow-md">Sản Phẩm Nổi Bật</h2>
              <Flame className="w-8 h-8 md:w-10 md:h-10 animate-pulse text-yellow-300 fill-yellow-300" />
            </div>
          </div>
          
          <button onClick={() => scroll('left', scrollRef)} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 hidden md:flex items-center justify-center w-12 h-12 bg-white dark:bg-[#18181b] dark:text-gray-200 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.2)] hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-gray-800">
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth">
            {loading ? (
              <div className="w-full text-center text-white py-10 font-bold">Đang tải sản phẩm từ Database...</div>
            ) : (
              products.filter(p => p.isFeatured).length > 0 ? (
                products.filter(p => p.isFeatured).map(product => (
                    <div key={`carousel-${product.id}`} className="min-w-[200px] md:min-w-[220px] lg:min-w-[230px] snap-start bg-white dark:bg-[#18181b] rounded-xl shadow-sm hover:shadow-md transition-shadow">
                      <ProductCard product={product} />
                    </div>
                  ))
              ) : (
                <div className="w-full text-center text-white py-10 font-bold">Chưa có sản phẩm nào được đánh dấu Nổi bật trong Database.</div>
              )
            )}
          </div>

          <button onClick={() => scroll('right', scrollRef)} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 hidden md:flex items-center justify-center w-12 h-12 bg-white dark:bg-[#18181b] dark:text-gray-200 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.2)] hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-gray-800">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* KHỐI 4.5: HÀNG CŨ / THANH LÝ GIÁ TỐT */}
        {!loading && oldProducts.length > 0 && (
          <div className="relative bg-white dark:bg-[#18181b] rounded-2xl p-4 md:p-6 shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Tags className="w-6 h-6 text-blue-600" /> Hàng Cũ Giá Tốt
              </h2>
              <Link href="/hangcu" className="text-sm font-bold text-red-600 hover:text-red-700 hover:underline flex items-center transition-colors">
                Xem tất cả <ChevronRight className="w-4 h-4 ml-0.5" />
              </Link>
            </div>
            
            <button onClick={() => scroll('left', scrollOldRef)} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 hidden md:flex items-center justify-center w-10 h-10 bg-white dark:bg-[#18181b] dark:text-gray-200 border border-gray-200 dark:border-gray-800 rounded-full shadow-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-gray-800">
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div ref={scrollOldRef} className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden scroll-smooth">
              {oldProducts.map(product => (
                <div key={`old-${product.id}`} className="min-w-[200px] md:min-w-[220px] lg:min-w-[230px] snap-start bg-white dark:bg-[#18181b] rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-800">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            <button onClick={() => scroll('right', scrollOldRef)} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 hidden md:flex items-center justify-center w-10 h-10 bg-white dark:bg-[#18181b] dark:text-gray-200 border border-gray-200 dark:border-gray-800 rounded-full shadow-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-gray-800">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        <div ref={productGridRef} className="scroll-mt-24"></div>

        {/* KHỐI 5: BỘ LỌC VÀ SẮP XẾP CHÍNH */}
        <div className="pt-4 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Chọn theo tiêu chí</h2>
            {(activeCategory || activeBrand || activePrice || activeSort !== "Phổ biến") && (
              <button onClick={clearFilters} className="text-xs font-bold text-red-600 flex items-center gap-1 hover:underline">
                <X className="w-3.5 h-3.5" /> Bỏ chọn tất cả
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 z-40 relative">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#18181b] border border-red-500 text-red-600 font-semibold rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shadow-sm">
              <Filter className="w-4 h-4" /> Bộ lọc
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:border-red-600 hover:text-red-600 transition-colors shadow-sm">
              <Truck className="w-4 h-4" /> Sẵn hàng
            </button>

            {filterOptions.map((filter, idx) => {
              let isActive = false;
              let displayText = filter.title;
              if (filter.type === "brand" && activeBrand) { isActive = true; displayText = activeBrand; }
              if (filter.type === "price" && activePrice) { isActive = true; displayText = activePrice; }

              return (
                <DropdownMenu key={idx}>
                  <DropdownMenuTrigger className={`flex items-center justify-between gap-2 px-4 py-2 border rounded-lg transition-all text-sm font-medium outline-none 
                    ${isActive ? "bg-red-50 dark:bg-red-900/20 border-red-500 text-red-600" : "bg-white dark:bg-[#18181b] border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-red-600"}`}>
                    {displayText} <ChevronDown className="w-4 h-4 opacity-70" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48 bg-white dark:bg-[#18181b] border-gray-200 dark:border-gray-800 shadow-xl rounded-xl p-1 z-50">
                    {filter.items.map((item, itemIdx) => {
                      const isSelected = (filter.type === "brand" && activeBrand === item) || (filter.type === "price" && activePrice === item);
                      return (
                        <DropdownMenuItem 
                          key={itemIdx} 
                          onClick={() => {
                            if (filter.type === "brand") setActiveBrand(activeBrand === item ? null : item);
                            if (filter.type === "price") setActivePrice(activePrice === item ? null : item);
                          }}
                          className={`cursor-pointer px-3 py-2 text-sm rounded-md font-medium transition-colors
                            ${isSelected ? "bg-red-600 text-white focus:bg-red-600 focus:text-white" : "text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 focus:bg-red-50 focus:text-red-600"}`}
                        >
                          {item}
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            <span className="font-bold text-gray-800 dark:text-gray-100">Sắp xếp theo</span>
            <button onClick={() => setActiveSort("Phổ biến")} className={`flex items-center gap-2 px-4 py-1.5 border rounded-lg transition-colors shadow-sm font-semibold
              ${activeSort === "Phổ biến" ? "bg-red-50 dark:bg-red-900/20 border-red-500 text-red-600" : "bg-white dark:bg-[#18181b] border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-red-600 hover:text-red-600"}`}>
              <Star className={`w-4 h-4 ${activeSort === "Phổ biến" ? "fill-red-600" : ""}`} /> Phổ biến
            </button>
            <button onClick={() => setActiveSort("Khuyến mãi HOT")} className={`flex items-center gap-2 px-4 py-1.5 border rounded-lg transition-colors font-semibold
              ${activeSort === "Khuyến mãi HOT" ? "bg-red-50 dark:bg-red-900/20 border-red-500 text-red-600" : "bg-white dark:bg-[#18181b] border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-red-600 hover:text-red-600"}`}>
              <Flame className={`w-4 h-4 ${activeSort === "Khuyến mãi HOT" ? "text-red-600" : "text-orange-500"}`} /> Khuyến mãi HOT
            </button>
            <button onClick={() => setActiveSort("Giá Thấp - Cao")} className={`flex items-center gap-2 px-4 py-1.5 border rounded-lg transition-colors font-semibold
              ${activeSort === "Giá Thấp - Cao" ? "bg-red-50 dark:bg-red-900/20 border-red-500 text-red-600" : "bg-white dark:bg-[#18181b] border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-red-600 hover:text-red-600"}`}>
              <TrendingUp className="w-4 h-4" /> Giá Thấp - Cao
            </button>
            <button onClick={() => setActiveSort("Giá Cao - Thấp")} className={`flex items-center gap-2 px-4 py-1.5 border rounded-lg transition-colors font-semibold
              ${activeSort === "Giá Cao - Thấp" ? "bg-red-50 dark:bg-red-900/20 border-red-500 text-red-600" : "bg-white dark:bg-[#18181b] border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-red-600 hover:text-red-600"}`}>
              <TrendingDown className="w-4 h-4" /> Giá Cao - Thấp
            </button>
          </div>
        </div>

        {/* KHỐI 6: LƯỚI SẢN PHẨM SAU KHI LỌC */}
        <div className="space-y-6 pt-4">
          {loading ? (
            <div className="text-center py-10 font-bold text-gray-500">Đang tải sản phẩm từ Database...</div>
          ) : displayProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {displayProducts.slice(0, visibleCount).map((product, idx) => (
                  <div key={`grid-${product.id}-${idx}`} className="bg-white dark:bg-[#18181b] rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-800">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
              
              {displayProducts.length > visibleCount && (
                <div className="flex justify-center pt-4">
                  <button 
                    onClick={() => setVisibleCount(prev => prev + 10)}
                    className="flex items-center gap-1 px-8 py-3 bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-300 rounded-xl hover:border-red-500 hover:text-red-600 shadow-sm transition-all hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Xem thêm {displayProducts.length - visibleCount} sản phẩm <ChevronDown className="w-4 h-4 ml-1" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-[#18181b] rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Không tìm thấy sản phẩm nào</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Vui lòng thử bỏ bớt bộ lọc hoặc chọn danh mục khác.</p>
              <button onClick={clearFilters} className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 transition">
                Xóa tất cả bộ lọc
              </button>
            </div>
          )}
        </div>

        {/* KHỐI 7: REVIEW SẢN PHẨM (YOUTUBE) */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 uppercase tracking-tight flex items-center gap-2">
              <Play className="h-5 w-5 text-red-600 fill-red-600" /> Review sản phẩm
            </h2>
            <Link href="https://www.youtube.com/@MixiGaming3con" target="_blank" className="text-sm text-red-600 hover:underline font-medium">
              Xem thêm video
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MOCK_REVIEWS.map((rev, idx) => (
              <a 
                key={idx} 
                href={rev.youtubeUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="relative aspect-[3/4] rounded-2xl overflow-hidden group cursor-pointer shadow-md block"
              >
                <img src={rev.imageUrl} alt={rev.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-between p-4">
                  <div className="bg-black/40 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] text-white font-medium w-max">
                    @{rev.channel}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-white text-sm font-bold leading-snug line-clamp-2 drop-shadow">
                      {rev.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-gray-300">
                      <Eye className="w-3.5 h-3.5" /> Mới cập nhật
                    </div>
                  </div>
                </div>

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                  <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                    <Play className="w-6 h-6 text-white fill-white ml-1" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

{/* KHỐI 8: SẢN PHẨM BẠN ĐÃ XEM LẠI */}
        {!loading && viewedProducts.length > 0 && (
          <div className="relative bg-white dark:bg-[#18181b] rounded-2xl p-4 md:p-6 shadow-sm border border-gray-200 dark:border-gray-800 mt-8 transition-colors duration-300">
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-gray-800 pb-3">
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Clock className="w-6 h-6 text-blue-600" /> Sản phẩm bạn đã xem
              </h2>
            </div>
            
            <button onClick={() => scroll('left', scrollViewedRef)} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 hidden md:flex items-center justify-center w-10 h-10 bg-white dark:bg-[#18181b] dark:text-gray-200 border border-gray-200 dark:border-gray-800 rounded-full shadow-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-gray-800">
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div ref={scrollViewedRef} className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden scroll-smooth">
              {viewedProducts.map((product, idx) => (
                <div 
                  key={`viewed-${product.id}-${idx}`} 
                  // ĐÃ FIX: Thêm flex-none và đổi min-w thành w cố định
                  className="flex-none w-[200px] md:w-[220px] lg:w-[230px] snap-start bg-white dark:bg-[#18181b] rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-800"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            <button onClick={() => scroll('right', scrollViewedRef)} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 hidden md:flex items-center justify-center w-10 h-10 bg-white dark:bg-[#18181b] dark:text-gray-200 border border-gray-200 dark:border-gray-800 rounded-full shadow-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-gray-800">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* KHỐI 9: LOYALTY BANNER */}
        <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-red-500 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group">
          <div className="space-y-2 z-10 text-center md:text-left">
            <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight">Trở Thành Khách Hàng Thân Thiết BlurSetup</h3>
            <p className="text-white/90 text-sm max-w-lg">Nhận ngay đặc quyền chiết khấu, tích lũy điểm thưởng và ngập tràn voucher công nghệ độc quyền hàng tháng.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 z-10 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20">
            <div className="text-center">
              <Percent className="h-6 w-6 text-yellow-300 mx-auto mb-1 animate-bounce" />
              <div className="text-xs font-medium opacity-80">Chiết khấu cao</div>
              <div className="text-lg font-black text-yellow-300">Lên đến 8%</div>
            </div>
            <div className="h-8 w-px bg-white/20 hidden sm:block" />
            <div className="text-center">
              <Gift className="h-6 w-6 text-yellow-300 mx-auto mb-1" />
              <div className="text-xs font-medium opacity-80">Voucher thành viên</div>
              <div className="text-sm font-bold">Tặng 200K</div>
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700" />
        </div>

        {/* KHỐI 10: TIN TỨC CÔNG NGHỆ BẰNG DỮ LIỆU THẬT */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 uppercase tracking-tight">Tin tức công nghệ</h2>
            <Link href="/tin-tuc" className="text-sm text-red-600 hover:underline font-medium">Xem tất cả tin tức</Link>
          </div>
          
          {newsList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {newsList.slice(0, 5).map((news) => (
                <Link key={news.id} href={`/tin-tuc/${news.slug}`} className="bg-white dark:bg-[#18181b] rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-red-500/30 transition-all flex flex-col group">
                  <div className="aspect-[16/10] overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img src={news.imageUrl || "/placeholder.jpg"} alt={news.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <h3 className="text-xs font-bold text-gray-800 dark:text-gray-100 line-clamp-3 leading-snug group-hover:text-red-600 transition-colors">
                      {news.title}
                    </h3>
                    <span className="text-[10px] text-muted-foreground mt-2 block font-medium">
                      {new Date(news.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic py-4">Chưa có bài viết nào được cập nhật.</div>
          )}
        </div>

        {/* KHỐI 11: NỘI DUNG SEO - ĐÃ BỎ TIN TỨC LIÊN QUAN */}
        <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 md:p-6 shadow-sm relative flex flex-col justify-between mt-6">
          <div className={`space-y-6 text-sm text-gray-600 dark:text-gray-300 leading-relaxed transition-all duration-300 pr-2
            ${isContentExpanded ? "max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200" : "max-h-[350px] overflow-hidden"}`}
          >
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">BlurSetup - Hệ thống cung cấp đồ công nghệ & Combo thiết kế không gian hàng đầu</h2>
              <p>Thiết bị công nghệ và phụ kiện setup ngày nay đã trở thành một phần không thể thiếu đối với lập trình viên, game thủ và những người làm việc sáng tạo tại nhà. Không chỉ hỗ trợ nâng cao hiệu suất công việc, mà các sản phẩm này còn góp phần thể hiện phong cách và cá tính riêng của mỗi người.</p>
              <br/>
              <p>Tại BlurSetup, chúng tôi không chỉ đơn thuần bán lẻ từng thiết bị. Chúng tôi mang đến cho bạn giải pháp "setup toàn diện" - từ những chiếc bàn phím cơ Custom cao cấp, chuột gaming siêu nhẹ, đến màn hình hiển thị chuẩn màu cho Designer. Tất cả đều được tuyển chọn kỹ lưỡng từ các thương hiệu hàng đầu thế giới như ASUS, Logitech, Dell, LG...</p>
            </div>
          </div>

          {!isContentExpanded && (
            <div className="absolute bottom-[52px] left-0 right-0 h-24 bg-gradient-to-t from-white dark:from-[#18181b] via-white/80 dark:via-[#18181b]/80 to-transparent pointer-events-none z-10" />
          )}

          <div className="relative flex justify-center mt-2 border-t border-gray-100 dark:border-gray-800 pt-3 z-20 bg-white dark:bg-[#18181b]">
            <button onClick={() => setIsContentExpanded(!isContentExpanded)} className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-800 transition-colors bg-white dark:bg-[#18181b] px-4 py-1.5 border dark:border-gray-800 rounded-full shadow-sm">
              {isContentExpanded ? <> Thu gọn nội dung <ChevronUp className="w-3.5 h-3.5" /> </> : <> Xem thêm nội dung <ChevronDown className="w-3.5 h-3.5" /> </>}
            </button>
          </div>
        </div>

        {/* KHỐI 12: HỎI ĐÁP Q&A (DỮ LIỆU THẬT) */}
        <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 md:p-6 shadow-sm space-y-6">
          <div className="border-b border-gray-100 dark:border-gray-800 pb-3">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 uppercase tracking-tight flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-red-600" /> Hỏi và đáp về sản phẩm & dịch vụ
            </h2>
          </div>
          
          {/* Ô Nhập câu hỏi */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start bg-gray-50/50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
            <div className="hidden md:flex flex-col items-center text-center space-y-1">
              <div className="w-16 h-16 rounded-full bg-red-100 border border-red-200 flex items-center justify-center text-red-600 text-2xl font-black shadow-inner animate-pulse">B</div>
              <span className="text-[11px] font-bold text-gray-500">BlurBot</span>
            </div>
            <div className="md:col-span-3 space-y-3">
              <div className="font-semibold text-sm text-gray-800 dark:text-gray-100">Hãy đặt câu hỏi cho chúng tôi</div>
              <div className="relative flex items-center bg-white dark:bg-[#09090b] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden focus-within:border-red-600 focus-within:ring-1 focus-within:ring-red-600/20 transition-all shadow-inner">
                <textarea 
                  rows={2} 
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  placeholder={session ? "Viết câu hỏi của bạn tại đây..." : "Vui lòng đăng nhập để đặt câu hỏi..."} 
                  className="w-full p-3 text-sm text-gray-900 dark:text-gray-100 bg-transparent outline-none resize-none placeholder:text-gray-400 pr-24" 
                />
                <button 
                  onClick={handleAskQuestion}
                  disabled={isSubmittingQ}
                  className="absolute right-3 bottom-3 p-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-1 text-xs font-bold shadow-sm"
                >
                  {isSubmittingQ ? "Đang gửi..." : "Gửi"} <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Danh sách Hỏi Đáp */}
          <div className="space-y-6 pt-2">
            {questions.length > 0 ? questions.map((q) => (
              <div key={q.id} className="space-y-4 border-b border-gray-50 dark:border-gray-800 pb-5 last:border-0 last:pb-0">
                
                {/* Người hỏi */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    {q.user?.name ? q.user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-gray-900 dark:text-gray-100">{q.user?.name || "Khách hàng"}</span>
                      <span className="text-[10px] text-gray-400 font-medium">{new Date(q.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50/70 dark:bg-gray-800/70 p-3 rounded-xl border border-gray-100/50 dark:border-gray-700/50">{q.content}</p>
                    
                    {q.replies.length > 0 && (
                      <div className="flex items-center gap-3 pt-1 text-xs font-semibold text-red-600">
                        <button onClick={() => toggleReply(q.id)} className="flex items-center gap-0.5 hover:text-red-800 transition-colors">
                          {expandedReplies[q.id] ? <>Thu gọn phản hồi <ChevronUp className="w-3.5 h-3.5" /></> : <>Xem {q.replies.length} phản hồi <ChevronDown className="w-3.5 h-3.5" /></>}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Phản hồi từ Admin */}
                {expandedReplies[q.id] && q.replies.map((r: any) => (
                  <div key={r.id} className="flex items-start gap-3 pl-12">
                    <div className="w-9 h-9 rounded-full bg-red-600 text-white font-black flex items-center justify-center text-[10px] shadow-md border border-red-200">BS</div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                          {r.user?.name || "Quản Trị Viên BlurSetup"} <ShieldCheck className="w-3 h-3 text-green-600" />
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-red-50/30 dark:bg-red-900/10 p-3 rounded-xl border border-red-100/50 dark:border-red-900/30">{r.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )) : (
              <div className="text-sm text-gray-500 italic text-center py-4">Chưa có câu hỏi nào. Hãy là người đầu tiên đặt câu hỏi!</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default dynamic(() => Promise.resolve(Home), { ssr: false });