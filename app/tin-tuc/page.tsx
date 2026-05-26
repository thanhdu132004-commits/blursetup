// app/tin-tuc/page.tsx
import Link from "next/link";
import { ChevronRight, Calendar, User } from "lucide-react";
import { getNews } from "@/app/admin/news/actions";

export default async function NewsListingPage() {
  const newsList = await getNews();

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      <div className="bg-white border-b border-gray-200 mb-6">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-3 flex items-center gap-2 text-xs font-medium text-gray-500">
          <Link href="/" className="hover:text-red-600 transition-colors">Trang chủ</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-900 font-bold">Tin công nghệ</span>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-8 border-l-4 border-red-600 pl-4">
          Tin tức & Đánh giá
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newsList.map((article) => (
            <Link key={article.id} href={`/tin-tuc/${article.slug}`} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all group flex flex-col">
              <div className="aspect-[16/9] overflow-hidden relative">
                <img src={article.imageUrl || "/placeholder.jpg"} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-sm">
                  Mới nhất
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h2 className="text-base font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-red-600 transition-colors mb-2">
                  {article.title}
                </h2>
                <p className="text-sm text-gray-500 line-clamp-3 mb-4 flex-1">
                  {article.summary}
                </p>
                <div className="flex items-center gap-4 text-[11px] font-medium text-gray-400 pt-4 border-t border-gray-50">
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(article.createdAt).toLocaleDateString("vi-VN")}</span>
                  <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {article.author}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}