"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Search, Frown } from "lucide-react";
import { ProductCard, type Product } from "@/components/product-card";
import { getProducts } from "@/app/admin/products/actions";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || ""; // Lấy từ khóa từ URL

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await getProducts();
        // Lọc sản phẩm có tên chứa từ khóa (không phân biệt hoa thường)
        const filtered = data
          .filter((p: any) => p.name.toLowerCase().includes(query.toLowerCase()))
          .map((p: any) => ({ ...p, id: p.id || p._id?.toString() }));
        setProducts(filtered);
      } catch (error) {
        console.error("Lỗi:", error);
      } finally {
        setLoading(false);
      }
    }
    
    if (query) loadData();
    else setLoading(false);
  }, [query]);

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 mb-6">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-3 flex items-center gap-2 text-xs font-medium text-gray-500">
          <Link href="/" className="hover:text-red-600 transition-colors">Trang chủ</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-900 font-bold">Tìm kiếm</span>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        <div className="flex flex-col gap-1 mb-8 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
            <Search className="w-4 h-4" /> Kết quả tìm kiếm cho từ khóa:
          </div>
          <h1 className="text-2xl font-black text-red-600">"{query}"</h1>
          <p className="text-sm text-gray-500 mt-1">Tìm thấy <strong>{products.length}</strong> sản phẩm phù hợp.</p>
        </div>

        {loading ? (
          <div className="text-center py-10 font-bold text-gray-500">Đang tìm kiếm...</div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map(product => (
              <div key={product.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-16 text-center border border-gray-200 flex flex-col items-center">
            <Frown className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Rất tiếc, không tìm thấy sản phẩm nào!</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-md">
              Chúng tôi không tìm thấy kết quả nào phù hợp với từ khóa <strong className="text-gray-800">"{query}"</strong>. Vui lòng kiểm tra lại lỗi chính tả hoặc dùng từ khóa chung chung hơn.
            </p>
            <Link href="/" className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 transition shadow-md">
              Tiếp tục mua sắm
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}