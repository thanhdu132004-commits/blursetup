// components/product-card.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Star, ShoppingCart, Loader2, Heart } from "lucide-react";
import { useSession } from "next-auth/react";
import { addToCart } from "@/app/actions/cart"; 
import { toggleWishlist, getUserWishlist } from "@/app/actions/wishlist";
import toast from "react-hot-toast";

// === KỸ THUẬT TỐI ƯU (PROMISE CACHING VỚI STATIC CACHE) ===
const WishlistCache = {
  promise: null as Promise<string[]> | null,
  cachedUserId: null as string | null,
};

const getSharedWishlist = (userId: string) => {
  if (WishlistCache.promise && WishlistCache.cachedUserId === userId) {
    return WishlistCache.promise;
  }
  WishlistCache.cachedUserId = userId;
  WishlistCache.promise = getUserWishlist(userId).catch(() => []);
  return WishlistCache.promise;
};
// ==========================================

export interface Product {
  id: string;
  slug?: string;
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl: string; 
  rating?: number;
  reviews?: number;
  isFeatured?: boolean;
  category?: string;
  brand?: string;
  condition?: string;
  stock?: number;
}

export function ProductCard({ product }: { product: Product }) {
  const { data: session } = useSession();
  const [isAdding, setIsAdding] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  const productUrl = `/product/${product.slug || product.id}`;
  
  const discountPercent = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const isOutOfStock = product.stock !== undefined && product.stock <= 0;

  useEffect(() => {
    let isMounted = true;
    async function checkWishlist() {
      if (session?.user) {
        const userId = (session.user as any).id;
        const wishlist = await getSharedWishlist(userId);
        if (isMounted) {
          setIsLiked(wishlist.includes(product.id));
        }
      }
    }
    checkWishlist();
    return () => { isMounted = false };
  }, [session, product.id]);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); 
    if (isOutOfStock) return;
    setIsAdding(true);
    try {
      const userId = (session?.user as any)?.id || "6a0de954edad2fe7af807713"; 
      const res = await addToCart(userId, product.id, 1);
      if (res.success) {
        toast.success("Đã thêm vào giỏ hàng!", {
          style: { borderRadius: '10px', background: '#333', color: '#fff' },
        });
      } else {
        toast.error(res.error || "Có lỗi xảy ra!");
      }
    } catch (error) {
      toast.error("Không thể kết nối tới server!");
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleHeart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!session?.user) {
      toast.error("Vui lòng đăng nhập để yêu thích!");
      return;
    }
    const userId = (session.user as any).id;
    const previousState = isLiked;
    setIsLiked(!isLiked); 

    const res = await toggleWishlist(userId, product.id);
    if (!res.success) {
      setIsLiked(previousState); 
      toast.error("Lỗi khi cập nhật yêu thích!");
    } else {
      WishlistCache.promise = Promise.resolve(res.wishlist as string[]);
      if (!previousState) toast.success("Đã thêm vào danh sách yêu thích ♥️");
    }
  };
  
  return (
    <div className="group flex flex-col h-full bg-white dark:bg-[#18181b] rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-800 relative">
      
      {discountPercent > 0 && (
        <div className="absolute top-2 left-2 z-10 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-md shadow-sm">
          Giảm {discountPercent}%
        </div>
      )}

      {/* NÚT THẢ TIM */}
      <button 
        onClick={handleToggleHeart}
        className={`absolute top-2 right-2 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
          isLiked 
            ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-500" 
            : "bg-white dark:bg-gray-800 text-gray-300 dark:text-gray-500 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
        }`}
      >
        <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
      </button>

      <Link href={productUrl} className="relative aspect-square w-full overflow-hidden bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center p-4">
        <img 
          src={product.imageUrl || "/placeholder.jpg"} 
          alt={product.name} 
          className="object-contain w-full h-full mix-blend-multiply dark:mix-blend-normal group-hover:scale-110 transition-transform duration-500"
        />
      </Link>

      <div className="p-3 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{product.brand || "BlurSetup"}</span>
          <div className="flex items-center gap-0.5 text-[10px] text-yellow-500 font-bold">
            <Star className="w-3 h-3 fill-yellow-500" /> {product.rating || "5.0"}
          </div>
        </div>

        <Link href={productUrl} className="block mb-auto">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 line-clamp-2 leading-snug group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
            {product.name}
          </h3>
        </Link>

        {isOutOfStock && (
          <div className="mt-1.5">
            <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 px-2 py-0.5 rounded">
              Sắp về hàng
            </span>
          </div>
        )}

        <div className="mt-3 flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-sm md:text-base font-black text-red-600 dark:text-red-500">
              {product.price.toLocaleString("vi-VN")}₫
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-[10px] md:text-xs font-medium text-gray-400 dark:text-gray-500 line-through">
                {product.originalPrice.toLocaleString("vi-VN")}₫
              </span>
            )}
          </div>
          
          <button 
            disabled={isAdding || isOutOfStock}
            className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-500 flex items-center justify-center hover:bg-red-600 dark:hover:bg-red-600 hover:text-white dark:hover:text-white transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleAddToCart}
          >
            {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}