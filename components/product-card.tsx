"use client";

import Link from "next/link";
import { useState } from "react";
import { Star, ShoppingCart, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { addToCart } from "@/app/actions/cart"; // Import hàm thật từ Backend
import toast from "react-hot-toast";

export interface Product {
  id: string;
  slug?: string;
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl: string; // SỬA Ở ĐÂY: Dùng imageUrl cho khớp với MongoDB
  rating?: number;
  reviews?: number;
  isFeatured?: boolean;
  category?: string;
  brand?: string;
}

export function ProductCard({ product }: { product: Product }) {
  const { data: session } = useSession();
  const [isAdding, setIsAdding] = useState(false);
  
  const productUrl = `/product/${product.slug || product.id}`;
  
  const discountPercent = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

 const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); 
    setIsAdding(true);
    
    try {
      const userId = (session?.user as any)?.id || "6a0de954edad2fe7af807713"; 
      
      const res = await addToCart(userId, product.id, 1);
      
      if (res.success) {
        // Dùng Toast thay cho Alert
        toast.success("Đã thêm vào giỏ hàng!", {
          style: { borderRadius: '10px', background: '#333', color: '#fff' },
          duration: 2000,
        });
      } else {
        // Thông báo lỗi chuyên nghiệp
        toast.error(res.error || "Có lỗi xảy ra!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Không thể kết nối tới server!");
    } finally {
      setIsAdding(false);
    }
  };
  
  return (
    <div className="group flex flex-col h-full bg-white rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100 relative">
      
      {/* Badge Giảm giá */}
      {discountPercent > 0 && (
        <div className="absolute top-2 left-2 z-10 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-md shadow-sm">
          Giảm {discountPercent}%
        </div>
      )}

      {/* SỬA Ở ĐÂY: product.imageUrl thay vì product.image */}
      <Link href={productUrl} className="relative aspect-square w-full overflow-hidden bg-gray-50 flex items-center justify-center p-4">
        <img 
          src={product.imageUrl || "/placeholder.jpg"} 
          alt={product.name} 
          className="object-contain w-full h-full mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
        />
      </Link>

      <div className="p-3 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{product.brand || "BlurSetup"}</span>
          <div className="flex items-center gap-0.5 text-[10px] text-yellow-500 font-bold">
            <Star className="w-3 h-3 fill-yellow-500" /> {product.rating || "5.0"}
          </div>
        </div>

        <Link href={productUrl} className="block mb-auto">
          <h3 className="text-sm font-bold text-gray-800 line-clamp-2 leading-snug group-hover:text-red-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="mt-3 flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-sm md:text-base font-black text-red-600">
              {product.price.toLocaleString("vi-VN")}₫
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-[10px] md:text-xs font-medium text-gray-400 line-through">
                {product.originalPrice.toLocaleString("vi-VN")}₫
              </span>
            )}
          </div>
          
          <button 
            disabled={isAdding}
            className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors flex-shrink-0 disabled:opacity-50"
            onClick={handleAddToCart}
          >
            {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}