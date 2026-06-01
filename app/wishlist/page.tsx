"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, HeartCrack, Heart, Trash2, Loader2, ShoppingCart } from "lucide-react";
import { ProductCard, type Product } from "@/components/product-card";
import { useSession } from "next-auth/react";
import { getWishlistProducts, toggleWishlist } from "@/app/actions/wishlist";
import toast from "react-hot-toast";

export default function WishlistPage() {
  const { data: session, status } = useSession();
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWishlist() {
      // Đợi session load xong
      if (status === "loading") return;
      
      // Nếu chưa đăng nhập, dừng load
      if (status === "unauthenticated" || !session?.user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const userId = (session.user as any).id;
        const res = await getWishlistProducts(userId);
        
        if (res.success) {
          setWishlist(res.products as unknown as Product[]);
        } else {
          toast.error("Không thể tải danh sách yêu thích!");
        }
      } catch (error) {
        console.error("Lỗi:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadWishlist();
  }, [session, status]);

  // Hàm xóa sản phẩm khỏi Wishlist
  const handleRemoveItem = async (productId: string) => {
    if (!session?.user) return;
    const userId = (session.user as any).id;
    
    // Optimistic UI update (Cập nhật giao diện trước cho mượt)
    const previousWishlist = [...wishlist];
    setWishlist(prev => prev.filter(item => item.id !== productId));

    // Gọi API xóa dưới DB
    const res = await toggleWishlist(userId, productId);
    if (res.success) {
      toast.success("Đã xóa khỏi danh sách yêu thích");
    } else {
      // Nếu lỗi, hoàn tác lại giao diện
      setWishlist(previousWishlist);
      toast.error("Có lỗi xảy ra khi xóa!");
    }
  };

  const handleAddAllToCart = () => {
    // Logic thêm tất cả vào giỏ hàng (Bạn có thể map qua hàm addToCart sau)
    alert("Đã thêm toàn bộ sản phẩm yêu thích vào giỏ hàng!");
  };

  return (
    <div className="bg-gray-50 dark:bg-[#09090b] min-h-screen pb-16 transition-colors duration-300">
      {/* Breadcrumb */}
      <div className="bg-white dark:bg-[#18181b] border-b border-gray-200 dark:border-gray-800 mb-8 shadow-sm transition-colors duration-300">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-3 flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
          <Link href="/" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">Trang chủ</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/profile" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">Tài khoản</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-900 dark:text-gray-200 font-bold">Sản phẩm yêu thích</span>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        
        {/* Header Mục */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-500 rounded-xl">
              <Heart className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Danh sách yêu thích</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Bạn đang có <strong className="text-red-600 dark:text-red-400">{wishlist.length}</strong> sản phẩm được lưu.
              </p>
            </div>
          </div>
        </div>

        {/* Nội dung chính */}
        {loading || status === "loading" ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-600">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-red-500" />
            <p className="font-bold text-sm">Đang tải bộ sưu tập của bạn...</p>
          </div>
        ) : status === "unauthenticated" ? (
          <div className="bg-white dark:bg-[#18181b] rounded-3xl p-16 text-center border border-gray-200 dark:border-gray-800 flex flex-col items-center shadow-sm transition-colors duration-300">
            <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-6">
              <HeartCrack className="w-12 h-12 text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Vui lòng đăng nhập!</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 max-w-md leading-relaxed">
              Bạn cần đăng nhập vào tài khoản để xem và quản lý danh sách sản phẩm yêu thích của mình.
            </p>
            <Link 
              href="/login" 
              className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors shadow-md shadow-red-200 dark:shadow-none inline-flex items-center gap-2"
            >
              Đăng nhập ngay <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : wishlist.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {wishlist.map(product => (
              <div key={product.id} className="relative group h-full">
                {/* 
                  Wrapper div với h-full giúp ProductCard dãn đều chiều cao.
                  Bọc thẻ h-full cho nội dung bên trong để tránh lỗi chiều cao không đồng đều
                */}
                <div className="h-full">
                  <ProductCard product={product} />
                </div>
                
                {/* Nút Xóa Khỏi Wishlist */}
                <button 
                  onClick={() => handleRemoveItem(product.id)}
                  className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-black/60 backdrop-blur-sm hover:bg-red-50 dark:hover:bg-red-900/50 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all shadow-sm border border-gray-100 dark:border-gray-700 z-10"
                  title="Xóa khỏi danh sách"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-[#18181b] rounded-3xl p-16 text-center border border-gray-200 dark:border-gray-800 flex flex-col items-center shadow-sm transition-colors duration-300">
            <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-6">
              <HeartCrack className="w-12 h-12 text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Danh sách yêu thích trống!</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 max-w-md leading-relaxed">
              Bạn chưa lưu sản phẩm nào. Hãy dạo quanh cửa hàng và thả tim những món đồ bạn ưng ý để dễ dàng tìm lại sau nhé.
            </p>
            <Link 
              href="/" 
              className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors shadow-md shadow-red-200 dark:shadow-none inline-flex items-center gap-2"
            >
              Tiếp tục mua sắm <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}