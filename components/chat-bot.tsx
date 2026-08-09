// components/chat-bot.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User, Loader2, ShoppingCart, CheckCircle2, Truck, Clock, Search, PlusCircle, ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { addToCart } from "@/app/actions/cart";

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: "bot" | "user";
  text?: string;
  widget?: "order-form" | "product-recommend"; 
  widgetData?: any; 
}

const DEFAULT_GREETING: Message[] = [{ 
  role: "bot", 
  text: "Xin chào! Mình là BlurBot 🤖. Hệ thống AI đã sẵn sàng. Bạn cần tư vấn sản phẩm hay kiểm tra đơn hàng?" 
}];

export function ChatBot({ isOpen, onClose }: ChatBotProps) {
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id || session?.user?.email || null;
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>(DEFAULT_GREETING);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [orderCode, setOrderCode] = useState("");
  const [isCheckingOrder, setIsCheckingOrder] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);

  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [fullHistory, setFullHistory] = useState<Message[]>([]);

  const quickReplies = [
    "💻 Tư vấn laptop",
    "📦 Kiểm tra đơn",
    "📜 Chính sách của cửa hàng",
    "🕹️ Build góc setup"
  ];

  useEffect(() => {
    if (!currentUserId) return;
    const savedSessionChat = sessionStorage.getItem(`blurbot_active_chat_${currentUserId}`);
    if (savedSessionChat) {
      setMessages(JSON.parse(savedSessionChat));
    } else {
      setMessages(DEFAULT_GREETING);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (currentUserId && messages.length > 0) {
      sessionStorage.setItem(`blurbot_active_chat_${currentUserId}`, JSON.stringify(messages));
    }
  }, [messages, currentUserId]);

  useEffect(() => {
    if (!isSearchMode) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, orderResult, isSearchMode]);

  const getOrderStep = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("thành công") || s.includes("đã giao")) return 3;
    if (s.includes("đang giao") || s.includes("vận chuyển")) return 2;
    return 1;
  };

  const saveAuxMessage = async (role: string, text: string, widget?: string, widgetData?: any) => {
    if (!currentUserId) return;
    try {
      await fetch("/api/chat/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId, role, text, widget, widgetData }),
      });
    } catch (e) {
      console.error("Lỗi lưu tin nhắn:", e);
    }
  };

  const handleNewChat = () => {
    setMessages(DEFAULT_GREETING);
    if (currentUserId) {
      sessionStorage.setItem(`blurbot_active_chat_${currentUserId}`, JSON.stringify(DEFAULT_GREETING));
    }
    setIsSearchMode(false);
    setSearchQuery("");
  };

  const handleToggleSearch = async () => {
    if (isSearchMode) {
      setIsSearchMode(false);
      setSearchQuery("");
    } else {
      setIsSearchMode(true);
      try {
        const res = await fetch(`/api/chat/history?userId=${currentUserId}`);
        const result = await res.json();
        if (result.success) setFullHistory(result.data);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSend = async (textToSend: string = input) => {
    if (!textToSend.trim() || !currentUserId) return;

    const userMsg = textToSend.trim();
    
    const recentHistory = messages
      .filter(m => m.text)
      .slice(-4) 
      .map(m => ({
        role: m.role === "bot" ? "assistant" : "user",
        content: m.text
      }));

    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setIsLoading(true);
    setOrderResult(null); 

    const runConsultation = async (segmentedText: string) => {
      setMessages(prev => [...prev, { role: "bot", text: "Đợi mình một chút, mình đang tìm sản phẩm phù hợp nhất cho bạn..." }]);
      try {
        const consultRes = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            userId: currentUserId, 
            message: userMsg, 
            segmentedText: segmentedText,
            history: recentHistory 
          }),
        });
        
        const consultData = await consultRes.json();
        
        if (consultRes.ok && consultData.success) {
          setMessages(prev => {
            const newMsgs = [...prev];
            newMsgs.pop(); 
            return [
              ...newMsgs, 
              { role: "bot", text: consultData.reply }, 
              { role: "bot", widget: "product-recommend", widgetData: consultData.products } 
            ];
          });
        } else {
           throw new Error("Lỗi từ API Chat");
        }
      } catch (err) {
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs.pop();
          return [...newMsgs, { role: "bot", text: "Xin lỗi, hệ thống tư vấn đang bận. Bạn vui lòng liên hệ Zalo nhé!" }];
        });
      }
    };

    try {
      const res = await fetch("http://127.0.0.1:8000/api/nlp/preprocess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });

      if (!res.ok) throw new Error("Không thể kết nối với máy chủ AI");
      const aiData = await res.json();

      const msgLower = userMsg.toLowerCase();
      
      const orderMatch = userMsg.match(/blur[\s-_]?\d+/i);
      const isComboKeyword = ["combo", "setup", "build", "bộ", "chọn lại"].some(k => msgLower.includes(k));
      const isAskingOrder = !isComboKeyword && (aiData.intent === "kiểm tra đơn hàng" || msgLower.includes("tra đơn") || msgLower.includes("đơn hàng") || msgLower.includes("kiểm tra đơn") || orderMatch !== null);

      const productKeywords = [
        "laptop", "lap top", "laptap", "màn hình", "man hinh", "màn ", "bàn phím", "ban phim", "phím",
        "chuột", "chuot", "mouse", "tai nghe", "tai nge", "headphone", "ghế", "ghe", "chair",
        "webcam", "balo", "ba lo", "giá đỡ", "gia do", "bàn di", "lot chuot", "lót chuột", "pad", "phụ kiện", "phu kien",
        "bán gì", "gồm những gì", "mặt hàng", "có những gì", "bán những gì", "sản phẩm gì", "sản phẩm nào",
        "setup", "build", "bộ máy tính", "pc", "so sánh" 
      ];
      const isProductInquiry = productKeywords.some(k => msgLower.includes(k));

      if (aiData.intent === "chính sách" && !isProductInquiry) {
        const policyText = `Dạ, dưới đây là chi tiết **Chính sách ưu đãi và bảo hành** của BlurSetup ạ:\n\n🛡️ **Chính sách Bảo hành:**\n- Cam kết hàng chính hãng 100%, bảo hành từ 12 - 24 tháng tùy theo quy định của nhà sản xuất.\n- Hỗ trợ gửi bảo hành nhanh chóng, cập nhật tiến độ liên tục.\n\n🔄 **Chính sách Đổi trả:**\n- Hỗ trợ lỗi 1 đổi 1 trong vòng 7 ngày đầu tiên nếu phát sinh lỗi phần cứng từ NSX.\n- Sản phẩm đổi trả phải còn nguyên vẹn vỏ hộp và phụ kiện.\n\n🚚 **Giao hàng & Thanh toán:**\n- Miễn phí vận chuyển (Freeship) toàn quốc cho đơn từ 1.000.000đ.\n- Giao hàng hỏa tốc trong 2h đối với khu vực nội thành.\n- Hỗ trợ thanh toán khi nhận hàng (COD), quẹt thẻ và trả góp.\n\nBạn cần mình tư vấn cụ thể về sản phẩm nào không ạ? 😊`;
        setMessages(prev => [...prev, { role: "bot", text: policyText }]);
        saveAuxMessage("user", userMsg);
        saveAuxMessage("bot", policyText);
      }
      else if (aiData.intent === "chào hỏi" && !isProductInquiry && !isAskingOrder) {
        const greetings = ["Chào bạn! BlurSetup chúc bạn một ngày tốt lành. Mình có thể giúp gì cho bạn? 😊", "Hi bạn! BlurBot ở đây để giúp bạn chốt deal công nghệ xịn nhất đây! 🔥"];
        const replyText = greetings[Math.floor(Math.random() * greetings.length)];
        setMessages(prev => [...prev, { role: "bot", text: replyText }]);
        saveAuxMessage("user", userMsg);
        saveAuxMessage("bot", replyText);
      }
      else if (isProductInquiry || (!isAskingOrder && aiData.intent !== "chính sách" && aiData.intent !== "chào hỏi")) {
        await runConsultation(aiData.segmented_text);
      }

      if (isAskingOrder) {
        if (orderMatch) {
           setOrderCode(orderMatch[0].toUpperCase().replace(/[\s-_]/g, ""));
        }
        
        saveAuxMessage("user", userMsg);

        setTimeout(() => {
            const botText = orderMatch ? "Mình thấy bạn có kèm mã đơn, bạn bấm **Tra cứu** ở form dưới đây luôn nhé:" : "Dạ, để kiểm tra tình trạng đơn hàng, bạn nhập mã vào khung dưới đây nhé:";
            setMessages(prev => [
                ...prev, 
                { 
                  role: "bot", 
                  text: botText, 
                  widget: "order-form" 
                }
            ]);
            saveAuxMessage("bot", botText, "order-form");
        }, 500);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: "bot", text: "Xin lỗi, không thể kết nối đến AI Server. Bạn hãy kiểm tra lại kết nối nhé!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckOrder = async () => {
    if (!orderCode.trim()) return;
    setIsCheckingOrder(true);
    setOrderResult(null);

    try {
      const response = await fetch("/api/orders/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderCode: orderCode.trim() }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setOrderResult(result.data); 
      } else {
        setOrderResult({ error: result.message || "Không tìm thấy đơn hàng." });
      }
    } catch (error) {
      setOrderResult({ error: "Lỗi kết nối. Vui lòng thử lại sau." });
    } finally {
      setIsCheckingOrder(false);
      setOrderCode("");
    }
  };

  const handleAddToCart = async (e: React.MouseEvent, product: any) => {
    e.preventDefault(); 
    e.stopPropagation();

    if (!product.id) {
        const errorText = "Xin lỗi, dữ liệu sản phẩm bị lỗi (Thiếu ID). Hệ thống đang được fix, bạn vui lòng tìm sản phẩm trực tiếp nhé!";
        setMessages(prev => [...prev, { role: "bot", text: errorText }]);
        return;
    }

    // ĐÃ THÊM BƯỚC CHẶN LOGIC: KIỂM TRA STOCK TRƯỚC KHI GỌI API GIỎ HÀNG
    if (product.stock <= 0) {
        const outOfStockText = `Dạ, rất tiếc sản phẩm **${product.name}** hiện đang tạm hết hàng ạ. Bạn vui lòng bấm trực tiếp vào hình sản phẩm để đi đến trang Đăng ký nhận thông tin nhé!`;
        setMessages(prev => [...prev, { role: "bot", text: outOfStockText }]);
        saveAuxMessage("bot", outOfStockText);
        return;
    }

    const pendingText = `Đang thêm **${product.name}** vào giỏ hàng...`;
    setMessages(prev => [...prev, { role: "bot", text: pendingText }]);

    try {
      const result = await addToCart(currentUserId, product.id, 1);

      if (result && result.error) throw new Error(result.error);

      const replyText = `Dạ, mình đã bỏ **${product.name}** vào giỏ hàng cho bạn rồi nhé. Bấm vào biểu tượng 🛒 ở góc trên màn hình để thanh toán ạ! 🥰`;
      
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs.pop();
        return [...newMsgs, { role: "bot", text: replyText }];
      });
      
      saveAuxMessage("bot", replyText);
      router.refresh();

    } catch (error: any) {
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs.pop();
        return [...newMsgs, { role: "bot", text: `Xin lỗi, không thể thêm vào giỏ hàng: ${error.message || 'Lỗi kết nối'}. Bạn thử lại sau nhé!` }];
      });
    }
  };

  if (!isOpen) return null;

  const displayedMessages = isSearchMode 
    ? fullHistory.filter(m => m.text?.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  return (
    <div className="fixed bottom-24 right-4 md:bottom-28 md:right-8 w-[350px] max-w-[calc(100vw-2rem)] h-[550px] bg-white rounded-2xl shadow-[0_5px_25px_rgba(0,0,0,0.15)] border border-gray-100 flex flex-col z-[100] overflow-hidden animate-in slide-in-from-bottom-5">
      
      <div className="bg-gradient-to-r from-red-600 to-[#d70018] p-3 flex items-center justify-between text-white shadow-md z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight">{isSearchMode ? "Tìm kiếm lịch sử" : "BlurBot AI"}</h3>
            <div className="flex items-center gap-1 text-[10px] text-red-100">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Hoạt Động
            </div>
          </div>
        </div>

        <div className="flex items-center gap-0.5">
          <button onClick={handleToggleSearch} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors" title={isSearchMode ? "Quay lại Chat" : "Tìm kiếm lịch sử"}>
            {isSearchMode ? <ArrowLeft className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </button>
          {!isSearchMode && (
            <button onClick={handleNewChat} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors" title="Cuộc trò chuyện mới">
              <PlusCircle className="w-4 h-4" />
            </button>
          )}
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors" title="Đóng Chatbot">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {!currentUserId ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-gray-50/50">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600 shadow-sm">
            <User className="w-8 h-8" />
          </div>
          <h3 className="font-black text-lg mb-2 text-gray-900">Vui lòng đăng nhập</h3>
          <p className="text-sm text-gray-500 mb-6">Bạn cần đăng nhập để trò chuyện với chuyên viên AI và đồng bộ lịch sử tư vấn.</p>
          <a href="/auth" className="bg-red-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-red-700 transition-colors">
            Đăng nhập ngay
          </a>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 relative">
            
            {isSearchMode && (
              <div className="bg-white border border-gray-200 rounded-xl p-2.5 mb-2 flex items-center gap-2 shadow-sm sticky top-0 z-10">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input 
                  type="text" 
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nhập nội dung cần tìm..."
                  className="flex-1 bg-transparent text-sm outline-none text-gray-800"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")}><X className="w-3.5 h-3.5 text-gray-400 hover:text-red-500 transition-colors"/></button>
                )}
              </div>
            )}

            {isSearchMode && displayedMessages.length === 0 && (
              <div className="text-center text-xs text-gray-400 mt-10">
                {searchQuery ? `Không có tin nhắn nào chứa "${searchQuery}"` : "Hãy gõ từ khóa để bắt đầu tìm kiếm"}
              </div>
            )}

            {displayedMessages.map((msg, idx) => (
              <div key={idx} className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "user" ? "bg-gray-800 text-white" : "bg-red-100 text-red-600 shadow-sm"}`}>
                  {msg.role === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div className={`max-w-[85%] p-3 text-sm rounded-2xl whitespace-pre-wrap shadow-sm ${msg.role === "user" ? "bg-gray-900 text-white rounded-tr-sm" : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm"} min-w-0`}>
                  
                  {msg.text && (
                    <div className="
                      overflow-x-auto custom-scrollbar
                      [&_img]:max-w-full [&_img]:rounded-md [&_img]:mt-2 [&_strong]:font-bold [&_p]:mb-1 last:[&_p]:mb-0
                      [&_table]:w-full [&_table]:min-w-[280px] [&_table]:mt-2 [&_table]:text-[11px] [&_table]:border-collapse [&_table]:rounded-lg [&_table]:overflow-hidden
                      [&_th]:border [&_th]:border-gray-200 [&_th]:p-1.5 [&_th]:bg-red-50 [&_th]:text-red-700 [&_th]:whitespace-nowrap
                      [&_td]:border [&_td]:border-gray-200 [&_td]:p-1.5
                    ">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{ img: () => null }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  )}

                  {!isSearchMode && idx === 0 && displayedMessages.length === 1 && msg.role === "bot" && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {quickReplies.map((reply, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(reply)}
                          className="bg-white border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-300 text-[11px] px-2 py-2 rounded-xl transition-all font-medium text-center truncate shadow-sm"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  )}

                  {msg.widget === "order-form" && (
                    <div className="mt-2 border-t pt-3 border-gray-100">
                      <div className="flex items-center gap-2 w-full">
                        <input 
                          type="text" 
                          value={orderCode}
                          onChange={(e) => setOrderCode(e.target.value)}
                          placeholder="Nhập mã (VD: BLUR123)" 
                          className="flex-1 min-w-0 text-xs p-2 border border-gray-200 rounded-md outline-none focus:border-red-500 transition-colors"
                        />
                        <button 
                          onClick={handleCheckOrder}
                          disabled={isCheckingOrder || !orderCode.trim()}
                          className="flex-shrink-0 bg-gray-900 text-white text-xs px-3 py-2 rounded-md font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center gap-1 transition-colors"
                        >
                          {isCheckingOrder ? <Loader2 className="w-3 h-3 animate-spin" /> : "Tra cứu"}
                        </button>
                      </div>

                      {orderResult && (
                        <div className={`mt-4 p-3 rounded-xl border text-xs bg-white shadow-sm ${orderResult.error ? "border-red-200" : "border-gray-100"}`}>
                          {orderResult.error ? (
                            <div className="text-red-600 font-medium text-center py-2">{orderResult.error}</div>
                          ) : (
                            <div>
                              <div className="flex justify-between items-center mb-4 border-b pb-2">
                                <span className="font-bold text-gray-800">Mã: {orderResult.code}</span>
                                <span className="font-medium text-gray-500">{orderResult.date}</span>
                              </div>
                              
                              <div className="relative flex justify-between items-center mb-4 px-2">
                                <div className="absolute top-1/2 left-4 right-4 h-[2px] bg-gray-100 -translate-y-1/2 z-0"></div>
                                <div className={`absolute top-1/2 left-4 h-[2px] bg-green-500 -translate-y-1/2 z-0 transition-all duration-500`} style={{ width: getOrderStep(orderResult.status) === 1 ? '0%' : getOrderStep(orderResult.status) === 2 ? '50%' : '100%' }}></div>
                                
                                {[
                                  { step: 1, icon: Clock, label: "Xác nhận" },
                                  { step: 2, icon: Truck, label: "Đang giao" },
                                  { step: 3, icon: CheckCircle2, label: "Thành công" }
                                ].map((item) => {
                                  const isActive = getOrderStep(orderResult.status) >= item.step;
                                  return (
                                    <div key={item.step} className="flex flex-col items-center gap-1.5 z-10 bg-white px-1">
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isActive ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"}`}>
                                        <item.icon className="w-3.5 h-3.5" />
                                      </div>
                                      <span className={`text-[9px] font-semibold whitespace-nowrap ${isActive ? "text-green-600" : "text-gray-400"}`}>{item.label}</span>
                                    </div>
                                  )
                                })}
                              </div>

                              <div className="bg-gray-50 p-2 rounded-lg mt-2">
                                <span className="text-gray-500 block mb-0.5 text-[10px]">Sản phẩm:</span>
                                <span className="font-semibold text-gray-800 line-clamp-1">{orderResult.product}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {msg.widget === "product-recommend" && msg.widgetData && (
                    <div className="mt-3 pt-3 border-t border-gray-100 w-full">
                      <div className="flex flex-row flex-nowrap overflow-x-auto gap-3 pb-3 w-full snap-x scroll-smooth [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-50">
                        {msg.widgetData.map((prod: any, i: number) => (
                          <a 
                            key={i} 
                            href={`/product/${prod.slug}`} 
                            className="flex flex-col flex-shrink-0 w-[140px] bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-red-400 transition-all snap-start min-w-[140px]"
                          >
                            <div className="aspect-square bg-gray-50 relative p-1.5 border-b border-gray-100 flex items-center justify-center">
                              <img 
                                src={prod.imageUrl} 
                                alt={prod.name} 
                                className="w-full h-full object-contain hover:scale-105 transition-transform duration-300" 
                              />
                              {prod.originalPrice && prod.originalPrice > prod.price && (
                                <div className="absolute top-1.5 left-1.5 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm shadow-sm">
                                  -{Math.round(((prod.originalPrice - prod.price) / prod.originalPrice) * 100)}%
                                </div>
                              )}
                            </div>
                            
                            <div className="p-2 flex flex-col flex-1 justify-between bg-white">
                              <div>
                                <h4 className="text-[11px] font-bold text-gray-800 line-clamp-2 leading-tight h-[28px]">
                                  {prod.name}
                                </h4>
                                <div className="font-bold text-red-600 text-[12px] mt-1.5">
                                  {prod.price.toLocaleString('vi-VN')}đ
                                </div>
                              </div>
                              
                              {/* ĐÃ SỬA CẬP NHẬT GIAO DIỆN (UI): Biến đổi nút bấm nếu sản phẩm hết hàng */}
                              {prod.stock > 0 ? (
                                <button 
                                  onClick={(e) => handleAddToCart(e, prod)}
                                  className="mt-3 flex items-center justify-center gap-1.5 w-full bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-100 hover:border-red-600 text-[10px] font-bold py-1.5 rounded-lg transition-all duration-200"
                                >
                                  <ShoppingCart className="w-3.5 h-3.5" /> Mua ngay
                                </button>
                              ) : (
                                <button 
                                  onClick={(e) => handleAddToCart(e, prod)}
                                  className="mt-3 flex items-center justify-center gap-1.5 w-full bg-gray-100 text-gray-500 border border-gray-200 text-[10px] font-bold py-1.5 rounded-lg transition-all duration-200 hover:bg-gray-200"
                                >
                                  Tạm hết hàng
                                </button>
                              )}
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && !isSearchMode && (
              <div className="flex items-end gap-2">
                <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center"><Bot className="w-3.5 h-3.5" /></div>
                <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {!isSearchMode && (
            <div className="p-3 bg-white border-t border-gray-100">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-2 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500/20 transition-all shadow-sm">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Hỏi mua sản phẩm, tra đơn..." 
                  className="flex-1 min-w-0 p-2 bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400"
                />
                <button 
                  onClick={() => handleSend(input)}
                  disabled={isLoading || !input.trim()}
                  className="flex-shrink-0 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}