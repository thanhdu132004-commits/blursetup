// app/qa/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { getQuestions, submitQuestion } from "@/app/actions/qa";
import toast from "react-hot-toast"; 
import { 
  ChevronLeft, Send, HelpCircle, ChevronDown, ChevronUp, ShieldCheck, Search
} from "lucide-react";

export default function QAPage() {
  const { data: session } = useSession();
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [questionInput, setQuestionInput] = useState("");
  const [isSubmittingQ, setIsSubmittingQ] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadData() {
      try {
        const qaData = await getQuestions();
        setQuestions(qaData || []);
        
        // Mặc định mở hết các phản hồi
        const initExpanded: Record<string, boolean> = {};
        qaData?.forEach((q: any) => initExpanded[q.id] = true);
        setExpandedReplies(initExpanded);
      } catch (error) {
        console.error("Lỗi tải dữ liệu QA:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAskQuestion = async () => {
    if (!session?.user) return toast.error("Vui lòng đăng nhập để đặt câu hỏi!");
    if (!questionInput.trim()) return toast.error("Vui lòng nhập nội dung câu hỏi!");
    
    setIsSubmittingQ(true);
    const userId = (session.user as any).id || "6a0de954edad2fe7af807713";
    
    const res = await submitQuestion(userId, questionInput);
    if (res.success) {
      toast.success("Đã gửi câu hỏi thành công! Chúng tôi sẽ phản hồi sớm nhất.");
      setQuestionInput("");
      const updatedQ = await getQuestions();
      setQuestions(updatedQ);
    } else {
      toast.error((res as any).error);
    }
    setIsSubmittingQ(false);
  };

  const toggleReply = (id: string) => setExpandedReplies(prev => ({ ...prev, [id]: !prev[id] }));

  const filteredQuestions = questions.filter(q => 
    q.content.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (q.user?.name || "Khách hàng").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-gray-100 dark:bg-[#09090b] min-h-screen py-10 transition-colors duration-300">
      <div className="max-w-[1000px] mx-auto px-4 md:px-8 space-y-6">
        
        {/* Nút quay lại */}
        <Link href="/">
          <button className="flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-red-600 transition-colors mb-4">
            <ChevronLeft className="w-4 h-4" /> Quay lại trang chủ
          </button>
        </Link>

        {/* Tiêu đề & Input */}
        <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 md:p-8 shadow-sm space-y-6">
          <div className="border-b border-gray-100 dark:border-gray-800 pb-4">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight flex items-center gap-3">
              <HelpCircle className="h-8 w-8 text-red-600" /> Hỏi và đáp (Q&A)
            </h1>
            <p className="text-gray-500 text-sm mt-2 font-medium">Tất cả câu hỏi và thắc mắc của khách hàng liên quan đến sản phẩm, dịch vụ và chính sách của BlurSetup.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start bg-gray-50/50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
            <div className="hidden md:flex flex-col items-center text-center space-y-1">
              <div className="w-16 h-16 rounded-full bg-red-100 border border-red-200 flex items-center justify-center text-red-600 text-2xl font-black shadow-inner animate-pulse">B</div>
              <span className="text-[11px] font-bold text-gray-500">BlurBot</span>
            </div>
            <div className="md:col-span-3 space-y-3">
              <div className="font-semibold text-sm text-gray-800 dark:text-gray-100">Hãy đặt câu hỏi cho chúng tôi</div>
              <div className="relative flex items-center bg-white dark:bg-[#09090b] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden focus-within:border-red-600 focus-within:ring-1 focus-within:ring-red-600/20 transition-all shadow-inner">
                <textarea 
                  rows={3} 
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  placeholder={session ? "Viết câu hỏi của bạn tại đây..." : "Vui lòng đăng nhập để đặt câu hỏi..."} 
                  className="w-full p-4 text-sm text-gray-900 dark:text-gray-100 bg-transparent outline-none resize-none placeholder:text-gray-400 pr-24" 
                />
                <button 
                  onClick={handleAskQuestion}
                  disabled={isSubmittingQ}
                  className="absolute right-3 bottom-3 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-bold shadow-md"
                >
                  {isSubmittingQ ? "Đang gửi..." : "Gửi"} <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Danh sách & Tìm kiếm */}
        <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 md:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Tất cả câu hỏi ({filteredQuestions.length})</h2>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm câu hỏi, tên khách hàng..." 
                className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#09090b] rounded-xl text-sm outline-none focus:border-red-500 dark:text-white transition-all" 
              />
            </div>
          </div>

          <div className="space-y-6 pt-2">
            {loading ? (
               <div className="text-center text-gray-500 font-bold py-10">Đang tải dữ liệu...</div>
            ) : filteredQuestions.length > 0 ? filteredQuestions.map((q) => (
              <div key={q.id} className="space-y-4 border-b border-gray-50 dark:border-gray-800 pb-6 last:border-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center text-base shadow-sm flex-shrink-0">
                    {q.user?.name ? q.user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-gray-900 dark:text-gray-100">{q.user?.name || "Khách hàng"}</span>
                      <span className="text-[10px] text-gray-400 font-medium">{new Date(q.createdAt).toLocaleString('vi-VN')}</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50/70 dark:bg-gray-800/70 p-4 rounded-xl border border-gray-100/50 dark:border-gray-700/50">{q.content}</p>
                    
                    {q.replies.length > 0 && (
                      <div className="flex items-center gap-3 pt-2 text-xs font-semibold text-red-600">
                        <button onClick={() => toggleReply(q.id)} className="flex items-center gap-1 hover:text-red-800 transition-colors">
                          {expandedReplies[q.id] ? <>Thu gọn phản hồi <ChevronUp className="w-4 h-4" /></> : <>Xem {q.replies.length} phản hồi <ChevronDown className="w-4 h-4" /></>}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {expandedReplies[q.id] && q.replies.map((r: any) => (
                  <div key={r.id} className="flex items-start gap-3 pl-10 md:pl-14">
                    <div className="w-9 h-9 rounded-full bg-red-600 text-white font-black flex items-center justify-center text-xs shadow-md border border-red-200 flex-shrink-0">BS</div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                          {r.user?.name || "Quản Trị Viên BlurSetup"} <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">{new Date(r.createdAt).toLocaleString('vi-VN')}</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-red-50/30 dark:bg-red-900/10 p-4 rounded-xl border border-red-100/50 dark:border-red-900/30">{r.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )) : (
              <div className="text-sm text-gray-500 italic text-center py-10">Không tìm thấy câu hỏi nào.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}