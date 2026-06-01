"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Laptop, ChevronRight, Filter, ShieldCheck, Wrench, RefreshCcw } from "lucide-react";
import { ProductCard, type Product } from "@/components/product-card";
import { getUsedProducts } from "./actions";

function UsedProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // STATE MỚI: Quản lý tiêu chí sắp xếp
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getUsedProducts();
      setProducts(data);
      setLoading(false);
    }
    loadData();
  }, []);

  // LOGIC LỌC/SẮP XẾP DỮ LIỆU THẬT
  const sortedProducts = useMemo(() => {
    let result = [...products]; 

    if (sortBy === "price-asc") {
      result.sort((a, b) => a.price - b.price); // Giá thấp đến cao
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.price - a.price); // Giá cao đến thấp
    }
    
    return result;
  }, [products, sortBy]);

  return (
    <div className="bg-gray-50 dark:bg-[#09090b] min-h-screen pb-12 transition-colors duration-300">
      {/* BREADCRUMB */}
      <div className="bg-white dark:bg-[#18181b] border-b border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-300">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-3 flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
          <Link href="/" className="hover:text-[#d70018] dark:hover:text-red-400 transition-colors">Trang chủ</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-900 dark:text-gray-200 font-bold">Hàng cũ giá tốt</span>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-8 space-y-8">
        
        {/* BANNER HÀNG CŨ */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-black dark:to-gray-900 rounded-2xl p-6 md:p-10 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative transition-colors duration-300">
          <div className="space-y-3 z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                <Laptop className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tight">Hàng Cũ Giá Tốt</h1>
            </div>
            <p className="text-gray-300 dark:text-gray-400 max-w-xl text-sm md:text-base">
              Tiết kiệm chi phí tối đa với các sản phẩm công nghệ đã qua sử dụng. 100% sản phẩm được kiểm định chất lượng nghiêm ngặt bởi đội ngũ kỹ thuật viên BlurSetup.
            </p>
          </div>
          
          <div className="flex gap-4 z-10">
            <div className="flex flex-col items-center justify-center p-3 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm w-28 text-center">
              <ShieldCheck className="w-6 h-6 mb-1 text-green-400" />
              <span className="text-[10px] uppercase font-bold text-gray-300">Bảo hành 6 tháng</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm w-28 text-center">
              <RefreshCcw className="w-6 h-6 mb-1 text-blue-400" />
              <span className="text-[10px] uppercase font-bold text-gray-300">1 Đổi 1 trong 30 ngày</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm w-28 text-center">
              <Wrench className="w-6 h-6 mb-1 text-amber-400" />
              <span className="text-[10px] uppercase font-bold text-gray-300">Bao test kỹ thuật</span>
            </div>
          </div>

          <div className="absolute right-0 top-0 w-96 h-96 bg-[#d70018]/20 blur-[100px] rounded-full pointer-events-none" />
        </div>

        {/* BỘ LỌC CƠ BẢN */}
        <div className="flex items-center justify-between bg-white dark:bg-[#18181b] p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 transition-colors duration-300">
          <div className="flex items-center gap-2 font-bold text-gray-800 dark:text-gray-200">
            <Filter className="w-5 h-5 text-[#d70018]" /> 
            <span>Lọc sản phẩm ({sortedProducts.length})</span>
          </div>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#09090b] text-sm font-medium text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg outline-none focus:border-[#d70018] cursor-pointer transition-colors"
          >
            <option value="newest">Mới cập nhật</option>
            <option value="price-asc">Giá từ thấp đến cao</option>
            <option value="price-desc">Giá từ cao đến thấp</option>
          </select>
        </div>

        {/* LƯỚI SẢN PHẨM */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-gray-200 dark:bg-gray-800 animate-pulse aspect-[3/4] rounded-xl" />
            ))}
          </div>
        ) : sortedProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {/* SỬ DỤNG sortedProducts THAY VÌ products */}
            {sortedProducts.map((product) => (
              <div key={product.id} className="bg-white dark:bg-[#18181b] rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-800">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-[#18181b] rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center transition-colors duration-300">
            <Laptop className="w-16 h-16 text-gray-300 dark:text-gray-700 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Chưa có sản phẩm cũ nào</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md">
              Hiện tại kho hàng cũ đang tạm hết. Bạn vui lòng quay lại sau hoặc tham khảo các sản phẩm mới đang có khuyến mãi HOT nhé!
            </p>
            <Link href="/" className="mt-6 px-6 py-2 bg-[#d70018] text-white font-bold rounded-lg hover:bg-red-700 transition">
              Về trang chủ
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(UsedProductsPage), { ssr: false });