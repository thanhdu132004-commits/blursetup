"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Plus, Trash2, X, Pencil, Search, ChevronLeft, ChevronRight, CheckCircle2, SlidersHorizontal } from "lucide-react";
import { getProducts, createProduct, updateProduct, deleteProduct } from "./actions";

// TEMPLATE THÔNG SỐ ĐỘNG THEO DANH MỤC (Đã cập nhật theo ý bạn)
const getDynamicSpecsTemplate = (category: string) => {
  switch (category) {
    case "Laptop": return ["CPU", "RAM", "Ổ cứng", "Loại card đồ họa", "Màn hình", "Pin", "Dung lượng RAM", "Công nghệ màn hình", "Hệ điều hành", "Cổng giao tiếp"];
    case "Màn hình": return ["Kích thước", "Độ phân giải", "Tấm nền", "Tần số quét", "Cổng kết nối", "Thời gian phản hồi", "Trọng lượng"];
    case "Bàn phím": return ["Số phím", "Tương thích", "Kết nối", "Khoảng cách kết nối (Độ dài dây)", "Đèn LED", "Thời gian dùng"];
    case "Chuột": return ["Tương thích", "Độ phân giải", "Kết nối", "Thời gian dùng", "Đèn LED", "Khoảng cách kết nối (Độ dài dây)"];
    case "Tai nghe": return ["Kích thước", "Kết nối", "Trọng lượng", "Microphone", "Thời lượng sử dụng Pin", "Tính năng khác", "Phạm vi kết nối", "Công nghệ âm thanh"];
    case "Ghế": return ["Chất liệu", "Kê tay", "Trọng tải tối đa", "Ngả lưng"];
    default: return ["Đặc điểm 1", "Đặc điểm 2", "Bảo hành"];
  }
};

function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const emptyForm = { 
    name: "", description: "", price: 0, originalPrice: 0, stock: 0, category: "Laptop", 
    imageUrl: "", brand: "Apple", condition: "Mới", gallery: "", tags: "", isNew: false, isFeatured: false,
    highlightsText: "", 
    specsObj: {} as Record<string, string> 
  };
  const [formData, setFormData] = useState(emptyForm);

  // Sinh ra template rỗng khi người dùng đổi category (Chỉ chạy khi Thêm Mới)
  useEffect(() => {
    if (!editingId && isDrawerOpen) {
      const template = getDynamicSpecsTemplate(formData.category);
      const initialSpecs: Record<string, string> = {};
      template.forEach(key => initialSpecs[key] = "");
      setFormData(prev => ({ ...prev, specsObj: initialSpecs }));
    }
  }, [formData.category, isDrawerOpen, editingId]);

  const fetchData = async () => {
    setLoading(true);
    const data = await getProducts();
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const handleEditClick = (product: any) => {
    setEditingId(product.id);
    
    // --- XỬ LÝ FIX LỖI THÔNG SỐ (SPECS) CHO HÀNG CŨ / UPDATE TEMPLATE MỚI ---
    // Lấy specs hiện tại trong DB của sản phẩm này (nếu null thì là {})
    const existingSpecs = product.specs || {};
    
    // Lấy khung template mới nhất dựa trên category
    const template = getDynamicSpecsTemplate(product.category);
    
    // Tạo ra một bộ specs kết hợp: Giữ lại data cũ (nếu có) và thêm các ô mới bị thiếu
    const mergedSpecs: Record<string, string> = {};
    template.forEach(key => {
      mergedSpecs[key] = existingSpecs[key] || ""; 
    });

    // Gom các keys cũ không có trong template mới (tránh mất mát dữ liệu do đổi tên template)
    Object.keys(existingSpecs).forEach(key => {
        if(!template.includes(key)) {
            mergedSpecs[key] = existingSpecs[key];
        }
    });

    setFormData({
      ...product,
      gallery: product.gallery ? product.gallery.join(", ") : "",
      tags: product.tags ? product.tags.join(", ") : "",
      highlightsText: product.highlights ? product.highlights.join("\n") : "",
      description: product.description || "",
      specsObj: mergedSpecs // Sử dụng mảng specs đã được merge
    });
    
    setIsDrawerOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa?")) {
      const result = await deleteProduct(id);
      if (result.success) await fetchData(); else alert("Lỗi: " + result.error);
    }
  };

  const handleSave = async () => {
    if (!formData.name || formData.price <= 0 || !formData.brand || !formData.category) return alert("Vui lòng nhập đầy đủ: Tên, Giá, Thương hiệu và Danh mục!");
    setIsSubmitting(true);
    
    // Loại bỏ các specs bị rỗng
    const cleanSpecs: Record<string, string> = {};
    Object.entries(formData.specsObj).forEach(([k, v]) => {
      if (v && String(v).trim() !== "") cleanSpecs[k] = String(v).trim();
    });

    const submitData = {
        ...formData,
        price: Number(formData.price),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : null,
        stock: Number(formData.stock),
        gallery: formData.gallery ? formData.gallery.split(',').map(s => s.trim()).filter(s => s) : [],
        tags: formData.tags ? formData.tags.split(',').map(s => s.trim()).filter(s => s) : [],
        highlights: formData.highlightsText ? formData.highlightsText.split('\n').filter(s => s.trim() !== '') : [],
        specs: cleanSpecs,
        isNew: Boolean(formData.isNew),
        isFeatured: Boolean(formData.isFeatured)
    };

    const result = editingId ? await updateProduct(editingId, submitData) : await createProduct(submitData);
    if (result.success) { setIsDrawerOpen(false); setEditingId(null); await fetchData(); } 
    else alert("Lỗi: " + result.error);
    setIsSubmitting(false);
  };

  if (loading && products.length === 0) return <div className="p-8">Đang tải dữ liệu...</div>;

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-2xl font-black text-gray-900">Quản lý sản phẩm</h1>
        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Tìm tên sản phẩm..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 border rounded-xl text-sm outline-none focus:border-red-500" />
          </div>
          <button onClick={() => { setEditingId(null); setFormData(emptyForm); setIsDrawerOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition">
            <Plus className="w-5 h-5" /> Thêm SP
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 text-[10px] uppercase font-black text-gray-500 border-b border-gray-100">
              <th className="px-6 py-4">Sản phẩm</th>
              <th className="px-6 py-4">Thương hiệu</th>
              <th className="px-6 py-4">Danh mục</th>
              <th className="px-6 py-4">Giá</th>
              <th className="px-6 py-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {currentProducts.length > 0 ? currentProducts.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-sm flex items-center gap-3">
                    <img src={p.imageUrl || "/placeholder.jpg"} className="w-10 h-10 rounded-lg object-cover border" alt={p.name} />
                    <div>
                      <p className="line-clamp-2 leading-tight">{p.name}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[10px] font-bold text-gray-500 px-1.5 py-0.5 bg-gray-100 rounded-md">{p.condition}</span>
                        {p.isFeatured && <span className="text-[10px] font-bold text-red-600 px-1.5 py-0.5 bg-red-50 rounded-md">Nổi bật</span>}
                      </div>
                    </div>
                </td>
                <td className="px-6 py-4 text-sm font-semibold">{p.brand}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{p.category}</td>
                <td className="px-6 py-4"><span className="font-black text-red-600">{p.price.toLocaleString("vi-VN")} ₫</span></td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleEditClick(p)} className="p-2 text-gray-400 hover:text-blue-600"><Pencil className="w-4 h-4"/></button>
                  <button onClick={() => handleDeleteClick(p.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">Không tìm thấy sản phẩm.</td></tr>
            )}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <span className="text-xs text-gray-500">
              Hiển thị {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredProducts.length)} / {filteredProducts.length} sản phẩm
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border bg-white disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1.5 text-xs font-bold bg-white border rounded-lg">
                {currentPage} / {totalPages || 1}
              </span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg border bg-white disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {isDrawerOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />
          <div className="relative w-full max-w-[600px] bg-white h-full p-6 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-xl font-black text-gray-900">{editingId ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}</h2>
              <button onClick={() => setIsDrawerOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            
            <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10">
              
              {/* KHỐI 1: THÔNG TIN CƠ BẢN */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Tên sản phẩm (*)</label>
                  <input className="w-full p-3 border rounded-xl text-sm outline-none focus:border-red-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Danh mục (*)</label>
                    <select className="w-full p-3 border rounded-xl text-sm outline-none focus:border-red-500" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                      <option value="Laptop">Laptop</option><option value="Màn hình">Màn hình</option><option value="Bàn phím">Bàn phím</option><option value="Chuột">Chuột</option><option value="Tai nghe">Tai nghe</option><option value="Ghế">Ghế</option><option value="Phụ kiện">Phụ kiện</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Thương hiệu (*)</label>
                    <select className="w-full p-3 border rounded-xl text-sm outline-none focus:border-red-500" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})}>
                      <option value="Apple">Apple</option><option value="ASUS">ASUS</option><option value="Lenovo">Lenovo</option><option value="Dell">Dell</option><option value="HP">HP</option><option value="MSI">MSI</option><option value="Acer">Acer</option><option value="Logitech">Logitech</option><option value="LG">LG</option><option value="Samsung">Samsung</option><option value="Razer">Razer</option><option value="Corsair">Corsair</option><option value="Khác">Khác</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Tình trạng (*)</label>
                  <select className="w-full p-3 border border-gray-200 bg-white rounded-xl text-sm outline-none focus:border-red-500" value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})}>
                    <option value="Mới">Hàng Mới</option>
                    <option value="Cũ">Hàng Cũ</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 uppercase">Giá bán (VNĐ)</label><input type="number" className="w-full p-2.5 border rounded-lg text-sm" value={formData.price || ""} onChange={e => setFormData({...formData, price: Number(e.target.value)})} /></div>
                  <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 uppercase">Giá gốc (VNĐ)</label><input type="number" className="w-full p-2.5 border rounded-lg text-sm" value={formData.originalPrice || ""} onChange={e => setFormData({...formData, originalPrice: Number(e.target.value)})} /></div>
                  <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 uppercase">Tồn kho</label><input type="number" className="w-full p-2.5 border rounded-lg text-sm" value={formData.stock || ""} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} /></div>
                </div>

                {/* --- MỚI THÊM: Checkbox Mác sản phẩm --- */}
                <div className="flex gap-6 p-4 bg-red-50/50 border border-red-100 rounded-xl">
                  <label className="flex items-center gap-2.5 text-sm font-bold text-gray-700 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-red-600" checked={formData.isNew} onChange={e => setFormData({...formData, isNew: e.target.checked})} /> 
                    Gắn mác "Sản phẩm mới"
                  </label>
                  <label className="flex items-center gap-2.5 text-sm font-bold text-gray-700 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-red-600" checked={formData.isFeatured} onChange={e => setFormData({...formData, isFeatured: e.target.checked})} /> 
                    Gắn mác "Nổi bật"
                  </label>
                </div>
              </div>

              {/* KHỐI 2: ẢNH VÀ NỘI DUNG */}
              <div className="space-y-4">
                <div className="space-y-1"><label className="text-xs font-bold text-gray-700">Link ảnh chính</label><input className="w-full p-3 border rounded-xl text-sm" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} /></div>
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">
                    Link ảnh phụ (Gallery) 
                    <span className="text-[10px] text-gray-400 font-normal ml-1">(Dán các link cách nhau bằng dấu phẩy)</span>
                  </label>
                  <textarea 
                    rows={3}
                    className="w-full p-3 border rounded-xl text-sm outline-none focus:border-red-500 transition resize-none custom-scrollbar" 
                    placeholder="https://anh1.jpg, https://anh2.jpg, https://anh3.jpg..." 
                    value={formData.gallery} 
                    onChange={e => setFormData({...formData, gallery: e.target.value})} 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-red-600"/> Tính năng nổi bật</label>
                  <textarea rows={4} placeholder="Mỗi dòng 1 tính năng (Bấm Enter để xuống dòng)..." className="w-full p-3 border rounded-xl text-sm outline-none focus:border-red-500 resize-none" value={formData.highlightsText} onChange={e => setFormData({...formData, highlightsText: e.target.value})} />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Bài viết / Thông tin chi tiết (Hỗ trợ HTML)</label>
                  <textarea rows={5} className="w-full p-3 border rounded-xl text-sm outline-none focus:border-red-500 custom-scrollbar" value={formData.description || ""} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
              </div>

              {/* KHỐI 3: THÔNG SỐ KỸ THUẬT (ĐỘNG THEO DANH MỤC) */}
              <div className="bg-red-50/50 p-4 rounded-xl border border-red-100 space-y-4">
                <div className="flex items-center gap-2 border-b border-red-100 pb-2">
                  <SlidersHorizontal className="w-5 h-5 text-red-600" />
                  <h3 className="text-sm font-black text-gray-900">Thông số kỹ thuật ({formData.category})</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {Object.keys(formData.specsObj).map((key) => (
                    <div key={key} className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500">{key}</label>
                      <input 
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:border-red-500 outline-none" 
                        value={formData.specsObj[key] || ""} 
                        onChange={(e) => setFormData(prev => ({...prev, specsObj: {...prev.specsObj, [key]: e.target.value}}))}
                      />
                    </div>
                  ))}
                </div>
                <div className="text-[10px] text-gray-500 italic mt-2">* Thông số nào bỏ trống sẽ tự động bị ẩn ở ngoài trang khách hàng.</div>
              </div>

            </div>

            <div className="pt-4 border-t mt-auto">
              <button onClick={handleSave} disabled={isSubmitting} className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-sm uppercase transition-all shadow-md disabled:opacity-70">
                {isSubmitting ? "Đang xử lý..." : (editingId ? "Cập nhật thay đổi" : "Lưu sản phẩm")}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default dynamic(() => Promise.resolve(AdminProductsPage), { ssr: false });