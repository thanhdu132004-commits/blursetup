"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Search, ShoppingCart, User, LayoutGrid, ChevronDown,
  Monitor, Keyboard, Mouse, Headphones, Armchair, Zap, LogOut, Laptop, ShieldCheck, Bell, Loader2
} from "lucide-react";

import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator, DropdownMenuGroup, DropdownMenuLabel
} from "@/components/ui/dropdown-menu";

import { useSession, signOut } from "next-auth/react";
import { getCartCount } from "@/app/actions/cart"; 
import { getMyNotifications } from "@/app/admin/notifications/actions";
import { getProducts } from "@/app/admin/products/actions"; // <--- Thêm import này

export function Navbar() {
  const { data: session, status } = useSession(); 
  const isAdmin = (session?.user as any)?.role === 'admin';
  const router = useRouter(); 
  
  const [cartCount, setCartCount] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);

  // --- STATE CHO LIVE SEARCH ---
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Load Giỏ hàng
  useEffect(() => {
    async function loadCartCount() {
      if (status === "loading") return; 
      const userId = (session?.user as any)?.id || "6a0de954edad2fe7af807713"; 
      const count = await getCartCount(userId);
      setCartCount(count);
    }
    loadCartCount();
  }, [session, status]); 

  // Load Thông báo
  useEffect(() => {
    async function loadNotifications() {
      if (status === "authenticated" && session?.user) {
        const userId = (session.user as any).id;
        const data = await getMyNotifications(userId, isAdmin);
        setNotifications(data);
      }
    }
    loadNotifications();
  }, [status, session, isAdmin]);

  // --- LOGIC LIVE SEARCH (DEBOUNCE) ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchValue.trim().length > 1) {
        setIsSearching(true);
        setShowSearchDropdown(true);
        try {
          const allProds = await getProducts();
          const filtered = allProds.filter((p: any) => 
            p.name.toLowerCase().includes(searchValue.toLowerCase()) || 
            p.brand.toLowerCase().includes(searchValue.toLowerCase())
          ).slice(0, 5); // Lấy tối đa 5 kết quả gợi ý
          setSearchResults(filtered);
        } catch (error) {
          console.error("Lỗi tìm kiếm:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowSearchDropdown(false);
      }
    }, 400); // Đợi khách ngừng gõ 400ms mới bắt đầu tìm

    return () => clearTimeout(delayDebounceFn);
  }, [searchValue]);

  // Đóng dropdown tìm kiếm khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (status === "loading") {
    return <header className="sticky top-0 z-50 w-full bg-[#d70018] h-16 shadow-md" />;
  }

  const categories = [
    { name: "Laptop", slug: "laptop", icon: <Laptop className="w-4 h-4 mr-2" /> },
    { name: "Màn hình", slug: "man-hinh", icon: <Monitor className="w-4 h-4 mr-2" /> },
    { name: "Bàn phím", slug: "ban-phim", icon: <Keyboard className="w-4 h-4 mr-2" /> },
    { name: "Chuột", slug: "chuot", icon: <Mouse className="w-4 h-4 mr-2" /> },
    { name: "Tai nghe", slug: "tai-nghe", icon: <Headphones className="w-4 h-4 mr-2" /> },
    { name: "Ghế", slug: "ghe", icon: <Armchair className="w-4 h-4 mr-2" /> },
    { name: "Phụ kiện", slug: "phu-kien", icon: <Zap className="w-4 h-4 mr-2" /> },
  ];

  const handleSearchEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchValue.trim() !== "") {
      setShowSearchDropdown(false);
      router.push(`/search?q=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  const handleCategoryClick = (slug: string) => {
    router.push(`/category/${slug}`);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#d70018] text-white shadow-md">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 flex h-16 items-center justify-between gap-4 md:gap-6">
        
        {/* 1. Logo */}
        <Link href="/" className="flex-shrink-0 flex items-center hover:opacity-90 transition-opacity">
          <span className="font-black text-2xl tracking-tighter uppercase italic text-white drop-shadow-sm">BlurSetup</span>
        </Link>

        {/* 2. Danh mục */}
        <DropdownMenu>
          <DropdownMenuTrigger className="hidden md:flex h-10 items-center bg-white/20 hover:bg-white/30 text-white gap-2 px-3 rounded-xl cursor-pointer shadow-sm outline-none transition-colors data-[state=open]:bg-white/30 flex-shrink-0">
            <LayoutGrid className="h-5 w-5" />
            <span className="font-semibold text-sm">Danh mục</span>
            <ChevronDown className="h-4 w-4 opacity-70" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 bg-white border-gray-200 shadow-xl rounded-xl p-1 z-50 mt-1">
            {categories.map((cat, idx) => (
              <DropdownMenuItem 
                key={idx} 
                onClick={() => handleCategoryClick(cat.slug)} 
                className="cursor-pointer px-3 py-2.5 text-xs font-bold rounded-lg hover:bg-red-50 hover:text-red-600 text-gray-700 flex items-center transition-colors"
              >
                {cat.icon} {cat.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 3. Tìm kiếm Live Search */}
        <div className="flex-1 max-w-2xl relative hidden sm:block" ref={searchRef}>
          <div className="relative flex items-center w-full h-10 rounded-xl bg-white overflow-hidden shadow-sm border border-transparent focus-within:ring-2 focus-within:ring-black/10 transition-all">
            <Search className="absolute left-3 h-5 w-5 text-gray-400" />
            <input 
              type="text" 
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => { if(searchValue.trim().length > 1) setShowSearchDropdown(true) }}
              onKeyDown={handleSearchEnter}
              placeholder="Gõ từ khóa và ấn Enter để tìm kiếm..." 
              className="w-full h-full pl-10 pr-4 text-sm font-medium text-gray-900 bg-transparent outline-none placeholder:text-gray-400 placeholder:font-normal" 
            />
            {isSearching && <Loader2 className="absolute right-3 h-4 w-4 text-gray-400 animate-spin" />}
          </div>

          {/* DROPDOWN KẾT QUẢ TÌM KIẾM */}
          {showSearchDropdown && searchValue.trim().length > 1 && (
            <div className="absolute top-[110%] left-0 w-full bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 text-gray-900 flex flex-col">
              {searchResults.length > 0 ? (
                <>
                  <div className="px-4 py-2 text-[10px] font-bold text-gray-500 bg-gray-50/50 uppercase border-b border-gray-100">
                    Sản phẩm gợi ý
                  </div>
                  {searchResults.map(p => (
                    <Link 
                      key={p.id} 
                      href={`/product/${p.slug || p.id}`}
                      onClick={() => setShowSearchDropdown(false)}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                    >
                      <div className="w-12 h-12 bg-white rounded-lg border border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 p-1">
                        <img src={p.imageUrl} className="w-full h-full object-contain" alt={p.name} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-bold text-gray-900 line-clamp-1">{p.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-black text-[#d70018]">{p.price.toLocaleString("vi-VN")}₫</span>
                          {p.originalPrice && <span className="text-[10px] text-gray-400 line-through">{p.originalPrice.toLocaleString("vi-VN")}₫</span>}
                        </div>
                      </div>
                    </Link>
                  ))}
                  <button 
                    onClick={() => {
                      setShowSearchDropdown(false);
                      router.push(`/search?q=${encodeURIComponent(searchValue.trim())}`);
                    }}
                    className="w-full text-center py-3 text-xs font-bold text-blue-600 hover:bg-gray-50 hover:text-blue-700 transition-colors"
                  >
                    Xem tất cả kết quả cho "{searchValue}"
                  </button>
                </>
              ) : (
                !isSearching && (
                  <div className="p-6 text-center text-sm font-medium text-gray-500">
                    Không tìm thấy sản phẩm nào phù hợp.
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* 4. Cụm Hành động (Thông báo, Giỏ hàng, User) */}
        <div className="flex items-center gap-1 md:gap-3 flex-shrink-0 ml-auto">
          {/* NÚT CHUÔNG THÔNG BÁO */}
          {session && (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex flex-col items-center justify-center gap-0.5 h-auto py-1 px-3 bg-transparent hover:bg-white/20 text-white rounded-xl cursor-pointer transition-colors group outline-none">
                <div className="relative">
                  <Bell className="h-5 w-5 text-white transition-transform group-hover:scale-110" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-yellow-400 border border-red-600 animate-pulse"></span>
                  )}
                </div>
                <span className="text-[10px] font-bold hidden md:block mt-0.5">Thông báo</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-white border-gray-200 shadow-xl rounded-xl p-0 z-50 mt-1">
                <div className="p-3 border-b border-gray-100 bg-gray-50/80 rounded-t-xl flex items-center justify-between">
                  <h3 className="text-sm font-black text-gray-900">Thông báo mới</h3>
                </div>
                <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                  {notifications.length > 0 ? (
                    notifications.map(noti => (
                      <DropdownMenuItem 
                        key={noti.id} 
                        className="p-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 flex flex-col items-start gap-1 cursor-pointer outline-none rounded-none"
                      >
                        <p className="text-xs font-bold text-gray-900 line-clamp-1">{noti.title}</p>
                        <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">{noti.content}</p>
                        <p className="text-[9px] text-gray-400 font-medium mt-1">
                          {new Date(noti.createdAt).toLocaleDateString('vi-VN')} lúc {new Date(noti.createdAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-gray-400 font-medium">Bạn chưa có thông báo nào.</div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* GIỎ HÀNG */}
          <Link href="/cart">
            <div className="flex flex-col items-center justify-center gap-0.5 h-auto py-1 px-3 bg-transparent hover:bg-white/20 text-white rounded-xl cursor-pointer transition-colors group">
              <div className="relative">
                <ShoppingCart className="h-5 w-5 text-white transition-transform group-hover:scale-110" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-yellow-400 px-1 text-[9px] text-black font-black shadow-sm">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold hidden md:block mt-0.5">Giỏ hàng</span>
            </div>
          </Link>

          {/* USER MENU */}
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex flex-col items-center justify-center text-white hover:bg-white/20 py-1 px-3 rounded-xl transition-colors cursor-pointer outline-none">
                <User className="w-5 h-5" />
                <span className="text-[10px] font-bold mt-0.5 tracking-tight truncate max-w-[60px]">
                  {session.user?.name?.split(' ')[0] || "Tài khoản"}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white border-gray-200 shadow-xl rounded-xl p-1 z-50 mt-1">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="px-3 py-2 text-xs font-bold text-gray-500">Xin chào, {session.user?.name}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/profile")} className="cursor-pointer px-3 py-2 text-xs font-bold text-gray-700 flex items-center hover:bg-red-50 hover:text-red-600 transition-colors">
                    <User className="w-4 h-4 mr-2" /> Tài khoản của tôi
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => router.push("/admin/products")} className="cursor-pointer px-3 py-2 text-xs font-bold flex items-center text-red-600 hover:bg-red-50">
                      <ShieldCheck className="w-4 h-4 mr-2" /> Trang quản trị
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer px-3 py-2 text-xs font-bold text-gray-700 flex items-center hover:bg-gray-100">
                    <LogOut className="w-4 h-4 mr-2" /> Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth" className="flex flex-col items-center justify-center text-white hover:bg-white/20 py-1 px-3 rounded-xl transition-colors cursor-pointer group">
              <User className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span className="text-[10px] font-bold mt-0.5 tracking-tight">Đăng nhập</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}