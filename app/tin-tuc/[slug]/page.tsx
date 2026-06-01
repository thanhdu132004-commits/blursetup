// app/tin-tuc/[slug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Calendar, User } from "lucide-react";
import { getNewsBySlug } from "@/app/admin/news/actions";

// Thay đổi 1: Định nghĩa params là một Promise
export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  
  // Thay đổi 2: BẮT BUỘC "await" params trước khi sử dụng trong Next.js 15+
  const { slug } = await params;
  
  const article = await getNewsBySlug(slug);

  if (!article) return notFound();

  return (
    <div className="bg-white dark:bg-[#09090b] min-h-screen pb-16 transition-colors duration-300">
      <div className="bg-gray-50 dark:bg-[#18181b] border-b border-gray-200 dark:border-gray-800 mb-8 transition-colors duration-300">
        <div className="max-w-[900px] mx-auto px-4 py-3 flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
          <Link href="/" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">Trang chủ</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/tin-tuc" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">Tin tức</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-900 dark:text-gray-200 font-bold truncate max-w-[200px]">{article.title}</span>
        </div>
      </div>

      <article className="max-w-[900px] mx-auto px-4">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white leading-tight mb-4">
          {article.title}
        </h1>
        
        <div className="flex items-center gap-4 text-sm font-medium text-gray-500 dark:text-gray-400 mb-8 pb-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg text-gray-700 dark:text-gray-300">
            <User className="w-4 h-4" /> {article.author}
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" /> {new Date(article.createdAt).toLocaleDateString("vi-VN")}
          </div>
        </div>

        {article.summary && (
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 leading-relaxed mb-8 italic border-l-4 border-gray-300 dark:border-gray-600 pl-4 bg-gray-50 dark:bg-[#18181b] p-4 rounded-r-xl">
            {article.summary}
          </p>
        )}

        {/* Render nội dung HTML an toàn */}
        <div 
          className="prose prose-lg dark:prose-invert max-w-none w-full 
                     prose-img:rounded-xl prose-img:shadow-md prose-img:mx-auto 
                     prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white 
                     prose-a:text-red-600 dark:prose-a:text-red-400"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </article>
    </div>
  );
}