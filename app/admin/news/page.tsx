"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Plus, Trash2, X, Pencil, FileText } from "lucide-react";
import { getNews, createNews, updateNews, deleteNews } from "./actions";

function AdminNewsPage() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const emptyForm = { title: "", summary: "", content: "", imageUrl: "", author: "Admin", isPublished: true };
  const [formData, setFormData] = useState(emptyForm);

  const fetchData = async () => {
    setLoading(true);
    const data = await getNews();
    setNews(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleEditClick = (article: any) => {
    setEditingId(article.id);
    setFormData(article);
    setIsDrawerOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa bài viết này?")) {
      await deleteNews(id);
      await fetchData();
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.content) return alert("Vui lòng nhập Tiêu đề và Nội dung!");
    setIsSubmitting(true);
    
    const result = editingId ? await updateNews(editingId, formData) : await createNews(formData);
    
    if (result.success) {
      setIsDrawerOpen(false);
      setEditingId(null);
      setFormData(emptyForm);
      await fetchData();
    } else alert(result.error);
    
    setIsSubmitting(false);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black text-gray-900">Quản lý Tin tức</h1>
        <button onClick={() => setIsDrawerOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition shadow-sm">
          <Plus className="w-5 h-5" /> Viết bài mới
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 text-[10px] uppercase font-black text-gray-500 border-b border-gray-100">
              <th className="px-6 py-4">Bài viết</th>
              <th className="px-6 py-4">Tác giả</th>
              <th className="px-6 py-4">Ngày đăng</th>
              <th className="px-6 py-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {news.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4 flex items-center gap-3">
                  <img src={item.imageUrl || "/placeholder.jpg"} className="w-16 h-10 rounded-lg object-cover border border-gray-100" alt="cover" />
                  <div className="font-bold text-sm text-gray-800 line-clamp-1">{item.title}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{item.author}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(item.createdAt).toLocaleDateString("vi-VN")}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleEditClick(item)} className="p-2 text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4"/></button>
                  <button onClick={() => handleDeleteClick(item.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Drawer Thêm/Sửa Bài Viết */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white h-full p-6 shadow-2xl flex flex-col">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-xl font-black text-gray-900">{editingId ? "Sửa bài viết" : "Viết bài mới"}</h2>
              <button onClick={() => setIsDrawerOpen(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            
            <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Tiêu đề bài viết (*)</label>
                <input className="w-full p-3 border rounded-xl text-sm outline-none focus:border-red-500" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Ảnh bìa (URL) (*)</label>
                <input className="w-full p-3 border rounded-xl text-sm outline-none focus:border-red-500" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Mô tả ngắn (Summary)</label>
                <textarea rows={2} className="w-full p-3 border rounded-xl text-sm outline-none focus:border-red-500 resize-none" value={formData.summary} onChange={e => setFormData({...formData, summary: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Nội dung chi tiết (Hỗ trợ HTML)</label>
                <textarea rows={10} className="w-full p-3 border rounded-xl text-sm outline-none focus:border-red-500" placeholder="<p>Nhập nội dung ở đây...</p>" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
              </div>
            </div>

            <div className="pt-4 border-t mt-4">
              <button onClick={handleSave} disabled={isSubmitting} className="w-full py-4 bg-red-600 text-white rounded-xl font-black uppercase transition-all disabled:opacity-70">
                {isSubmitting ? "Đang lưu..." : "Lưu bài viết"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default dynamic(() => Promise.resolve(AdminNewsPage), { ssr: false });