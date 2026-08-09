// app/admin/qa/page.tsx
"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { MessageSquare, Reply, Trash2, Search, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import { getQuestions, adminReplyToQuestion, deleteQuestion } from "@/app/actions/qa";
import toast from "react-hot-toast";

function AdminQAPage() {
  const { data: session } = useSession();
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});
  const [isReplying, setIsReplying] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("Tất cả");

  useEffect(() => {
    setIsMounted(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await getQuestions();
      setQuestions(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminReply = async (questionId: string) => {
    const content = replyContent[questionId];
    if (!content?.trim()) return toast.error("Vui lòng nhập nội dung câu trả lời!");

    setIsReplying(questionId);
    const adminId = (session?.user as any)?.id || "6a0de954edad2fe7af807713";

    const res = await adminReplyToQuestion(questionId, adminId, content);
    if (res.success) {
      toast.success("Đã trả lời khách hàng thành công!");
      setReplyContent(prev => ({ ...prev, [questionId]: "" }));
      fetchData(); 
    } else {
      // ĐÃ SỬA LỖI TYPESCRIPT Ở ĐÂY
      toast.error(res.error || "Có lỗi xảy ra khi gửi câu trả lời.");
    }
    setIsReplying(null);
  };

  const handleDeleteQuestion = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa câu hỏi này? Hành động này không thể hoàn tác.")) {
      const res = await deleteQuestion(id);
      if (res.success) {
        toast.success("Đã xóa câu hỏi.");
        fetchData();
      } else {
        toast.error(res.error || "Có lỗi xảy ra khi xóa.");
      }
    }
  };

  // Lọc dữ liệu
  const filteredQuestions = questions.filter(q => {
    const matchFilter = 
      filter === "Tất cả" ? true : 
      filter === "Chưa đáp" ? q.replies.length === 0 : 
      q.replies.length > 0;
    
    const matchSearch = 
      q.content.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (q.user?.name || "").toLowerCase().includes(searchTerm.toLowerCase());
      
    return matchFilter && matchSearch;
  });

  if (!isMounted) return null;

  return (
    <div className="p-6 md:p-8 space-y-6 bg-gray-50 dark:bg-[#09090b] min-h-screen transition-colors duration-300">
      
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Quản lý Hỏi đáp (Q&A)</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">Trả lời thắc mắc và quản lý bình luận của khách hàng.</p>
      </div>

      {/* TOOLBAR */}
      <div className="bg-white dark:bg-[#18181b] p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-wrap gap-3 items-center justify-between shadow-sm">
        <div className="flex gap-2 flex-wrap">
          {["Tất cả", "Chưa đáp", "Đã trả lời"].map((tab) => (
            <button key={tab} onClick={() => setFilter(tab)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                filter === tab 
                  ? "bg-blue-600 text-white shadow-md" 
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-[#09090b] border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-blue-500 w-64 dark:text-white transition-all" 
            placeholder="Tìm nội dung, tên KH..." />
        </div>
      </div>

      {/* NỘI DUNG */}
      <div className="bg-white dark:bg-[#18181b] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden transition-colors duration-300">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-blue-50/30 dark:bg-blue-900/10">
          <h2 className="text-sm font-black text-gray-900 dark:text-gray-100 uppercase flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Danh sách câu hỏi
          </h2>
          <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold px-2 py-1 rounded-md">
            {filteredQuestions.length} kết quả
          </span>
        </div>
        
        <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {isLoading ? (
             <div className="flex flex-col items-center justify-center py-20">
               <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
             </div>
          ) : filteredQuestions.length > 0 ? filteredQuestions.map(q => (
            <div key={q.id} className="p-5 space-y-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="font-bold text-sm text-gray-900 dark:text-gray-100">{q.user?.name || "Khách hàng ẩn danh"}</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">{new Date(q.createdAt).toLocaleString("vi-VN")}</div>
                </div>
                <div className="flex items-center gap-2">
                  {q.replies?.length > 0 ? (
                    <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-[10px] font-bold px-2.5 py-1 rounded-md border border-green-200 dark:border-green-800">Đã trả lời</span>
                  ) : (
                    <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-[10px] font-bold px-2.5 py-1 rounded-md border border-orange-200 dark:border-orange-800">Chờ xử lý</span>
                  )}
                  {/* NÚT XÓA CÂU HỎI */}
                  <button onClick={() => handleDeleteQuestion(q.id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors" title="Xóa câu hỏi rác">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="text-sm text-gray-800 dark:text-gray-200 bg-gray-100/70 dark:bg-gray-800 p-3 rounded-xl border border-gray-200/50 dark:border-gray-700">
                <span className="font-bold text-red-600 dark:text-red-400 mr-1">Hỏi:</span>{q.content}
              </div>

              {q.replies?.map((r: any) => (
                <div key={r.id} className="ml-4 pl-4 border-l-2 border-green-400 space-y-1">
                  <div className="font-bold text-[11px] text-green-700 dark:text-green-400 flex items-center gap-1">
                    {r.user?.name || "Admin"} đã trả lời lúc {new Date(r.createdAt).toLocaleString("vi-VN")}:
                    <ShieldCheck className="w-3 h-3" />
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-green-50 dark:bg-green-900/20 p-3 rounded-xl border border-green-100 dark:border-green-800">{r.content}</p>
                </div>
              ))}

              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Gõ câu trả lời của bạn..."
                  value={replyContent[q.id] || ""}
                  onChange={e => setReplyContent({...replyContent, [q.id]: e.target.value})}
                  className="flex-1 text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all bg-white dark:bg-[#09090b] dark:text-white"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAdminReply(q.id);
                  }}
                />
                <button
                  onClick={() => handleAdminReply(q.id)}
                  disabled={isReplying === q.id}
                  className="bg-gray-900 dark:bg-white hover:bg-black dark:hover:bg-gray-200 text-white dark:text-gray-900 px-5 py-2.5 rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  <Reply className="w-3.5 h-3.5" /> {isReplying === q.id ? "Đang gửi..." : "Trả lời"}
                </button>
              </div>
            </div>
          )) : (
            <div className="p-10 text-center flex flex-col items-center justify-center">
              <MessageSquare className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
              <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Không tìm thấy câu hỏi nào.</div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

export default dynamic(() => Promise.resolve(AdminQAPage), { ssr: false });