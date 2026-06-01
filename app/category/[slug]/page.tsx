"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams as useNextParams } from "next/navigation";
import { ChevronRight, AlertCircle, LayoutGrid, Filter, X } from "lucide-react";
import { ProductCard, type Product } from "@/components/product-card";
import { getProducts } from "@/app/admin/products/actions";

const categoryMap: Record<string, string> = {
  "laptop": "Laptop",
  "man-hinh": "Màn hình",
  "ban-phim": "Bàn phím",
  "chuot": "Chuột",
  "tai-nghe": "Tai nghe",
  "ghe": "Ghế",
  "phu-kien": "Phụ kiện",
};

export default function CategoryPage() {
  const params = useNextParams();
  const slug = params.slug as string;
  const categoryName = categoryMap[slug];

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- STATE CHO BỘ LỌC SIDEBAR ---
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await getProducts();
        
        // Lấy toàn bộ sản phẩm đúng Danh mục hiện tại
        const filtered = data.filter((p: any) => p.category?.toLowerCase().trim() === categoryName?.toLowerCase().trim());
        setAllProducts(filtered);

        // Trích xuất TỰ ĐỘNG danh sách thương hiệu CHỈ từ các sản phẩm thuộc danh mục này
        const brands = Array.from(new Set(filtered.map(p => p.brand))).filter(Boolean) as string[];
        setAvailableBrands(brands);
        
      } catch (error) {
        console.error("Lỗi khi tải:", error);
      } finally {
        setLoading(false); 
      }
    }
    
    if (categoryName) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [categoryName]);

  // LOGIC LỌC SẢN PHẨM Ở FRONTEND
  const displayedProducts = useMemo(() => {
    let result = [...allProducts];

    // 1. Lọc theo Thương hiệu
    if (selectedBrands.length > 0) {
      result = result.filter(p => selectedBrands.includes(p.brand));
    }

    // 2. Lọc theo Tình trạng (Mới/Cũ)
    if (selectedCondition) {
      result = result.filter(p => p.condition === selectedCondition);
    }

    // 3. Lọc theo Khoảng giá
    if (selectedPrice) {
      result = result.filter(p => {
        if (selectedPrice === "under-10") return p.price < 10000000;
        if (selectedPrice === "10-15") return p.price >= 10000000 && p.price <= 15000000;
        if (selectedPrice === "15-20") return p.price >= 15000000 && p.price <= 20000000;
        if (selectedPrice === "20-25") return p.price >= 20000000 && p.price <= 25000000;
        if (selectedPrice === "above-25") return p.price > 25000000;
        return true;
      });
    }

    return result;
  }, [allProducts, selectedBrands, selectedCondition, selectedPrice]);

  const handleBrandToggle = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const clearAllFilters = () => {
    setSelectedBrands([]);
    setSelectedCondition(null);
    setSelectedPrice(null);
  };

  return (
    <div className="bg-[#f4f6f8] dark:bg-[#09090b] min-h-screen pb-12 transition-colors duration-300">
      {/* Breadcrumb */}
      <div className="bg-white dark:bg-[#18181b] border-b border-gray-200 dark:border-gray-800 mb-6 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-3 flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
          <Link href="/" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">Trang chủ</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-900 dark:text-gray-200 font-bold">{categoryName}</span>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        <div className="flex items-center gap-3 mb-6">
          <LayoutGrid className="w-6 h-6 text-red-600" />
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 uppercase">Sản phẩm {categoryName}</h1>
          <span className="text-sm font-bold text-[#d70018] dark:text-red-400 bg-red-100 dark:bg-red-900/20 px-2.5 py-0.5 rounded-md border border-red-200 dark:border-red-900/30">
            {displayedProducts.length}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-10 font-bold text-gray-500 dark:text-gray-400">Đang tải dữ liệu...</div>
        ) : allProducts.length > 0 ? (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            
            {/* CỘT TRÁI: SIDEBAR FILTER */}
            <div className="w-full lg:w-[260px] bg-white dark:bg-[#18181b] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 flex-shrink-0 lg:sticky lg:top-24">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
                <h3 className="text-base font-black uppercase text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-red-600" /> Bộ lọc
                </h3>
                {(selectedBrands.length > 0 || selectedCondition || selectedPrice) && (
                  <button onClick={clearAllFilters} className="text-xs font-bold text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition flex items-center">
                    <X className="w-3 h-3 mr-0.5" /> Bỏ lỡ
                  </button>
                )}
              </div>

              {/* Lọc Hãng */}
              <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">Thương hiệu</h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                  {availableBrands.map(brand => (
                    <label key={brand} className="flex items-center gap-2.5 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={selectedBrands.includes(brand)}
                        onChange={() => handleBrandToggle(brand)}
                        className="w-4 h-4 text-red-600 border-gray-300 dark:border-gray-700 rounded focus:ring-red-500 accent-[#d70018] cursor-pointer"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">{brand}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Lọc Khoảng giá */}
              <div className="mb-6 border-t border-gray-100 dark:border-gray-800 pt-4">
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">Khoảng giá</h4>
                <div className="space-y-2">
                  {[
                    { val: "under-10", label: "Dưới 10 triệu" },
                    { val: "10-15", label: "Từ 10 - 15 triệu" },
                    { val: "15-20", label: "Từ 15 - 20 triệu" },
                    { val: "20-25", label: "Từ 20 - 25 triệu" },
                    { val: "above-25", label: "Trên 25 triệu" },
                  ].map(price => (
                    <label key={price.val} className="flex items-center gap-2.5 cursor-pointer group">
                      <input 
                        type="radio" name="priceFilter" value={price.val}
                        checked={selectedPrice === price.val}
                        onChange={() => setSelectedPrice(price.val)}
                        className="w-4 h-4 text-red-600 border-gray-300 dark:border-gray-700 focus:ring-red-500 accent-[#d70018] cursor-pointer"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">{price.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Lọc Độ mới cũ */}
              <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">Tình trạng</h4>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setSelectedCondition(selectedCondition === "Mới" ? null : "Mới")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                      selectedCondition === "Mới" ? "border-red-600 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 shadow-sm" : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >Hàng Mới</button>
                  <button 
                    onClick={() => setSelectedCondition(selectedCondition === "Cũ" ? null : "Cũ")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                      selectedCondition === "Cũ" ? "border-red-600 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 shadow-sm" : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >Hàng Cũ</button>
                </div>
              </div>
            </div>

            {/* CỘT PHẢI: LƯỚI SẢN PHẨM */}
            <div className="flex-1 w-full">
              {displayedProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {displayedProducts.map(product => (
                    <div key={product.id} className="bg-white dark:bg-[#18181b] rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-800">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-[#18181b] rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-800 flex flex-col items-center">
                  <AlertCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Không tìm thấy sản phẩm</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Không có sản phẩm nào phù hợp với bộ lọc của bạn.</p>
                  <button onClick={clearAllFilters} className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 transition shadow-sm">
                    Xóa tất cả bộ lọc
                  </button>
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="bg-white dark:bg-[#18181b] rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-800 flex flex-col items-center shadow-sm">
            <AlertCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Chưa có sản phẩm nào</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Hiện tại danh mục {categoryName} đang được cập nhật sản phẩm.</p>
            <Link href="/" className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-bold text-sm hover:bg-black transition shadow-sm">
              Quay lại trang chủ
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}