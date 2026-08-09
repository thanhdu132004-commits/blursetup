// app/api/chat/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function removeAccents(str: string) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
}

function hasExactWord(str: string, words: string[]) {
  return words.some(w => new RegExp(`\\b${w}\\b`).test(str));
}

function checkNegation(keyword: string, text: string) {
  const regex = new RegExp(`(khong|tru|dung|tranh|bo qua|loai bo|ngoai tru)(?:\\s+\\w+){0,4}\\s+${keyword}`, 'i');
  return regex.test(text);
}

export async function POST(req: Request) {
  try {
    const { message, history = [], userId } = await req.json();
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) return NextResponse.json({ success: false, reply: "Lỗi GROQ_API_KEY" }, { status: 500 });

    if (!userId) {
      return NextResponse.json({ success: false, reply: "Vui lòng đăng nhập để sử dụng AI và lưu lịch sử tư vấn." }, { status: 401 });
    }

    await prisma.chatMessage.create({
      data: {
        userId: userId,
        role: "user",
        text: message
      }
    });

    const lastUserMsg = history.length > 0 ? history.slice().reverse().find((m: any) => m.role === "user")?.content || "" : "";
    const searchContext = `${lastUserMsg} ${message}`.toLowerCase();
    const currentMsgLower = message.toLowerCase();
    
    const normalizedContext = removeAccents(searchContext);
    const normalizedCurrent = removeAccents(currentMsgLower);
    const words = searchContext.split(/[\s,!?]+/); 

    let budgetLimit = null;
    const budgetMatch = searchContext.match(/(\d+)\s*(triệu|trieu|tr|củ|nghìn|ngan|k)\b/i);
    if (budgetMatch) {
      const amount = parseInt(budgetMatch[1]);
      const unit = budgetMatch[2].toLowerCase();
      if (["triệu", "trieu", "tr", "củ"].includes(unit)) {
        budgetLimit = amount * 1000000;
      } else if (["nghìn", "ngan", "k"].includes(unit)) {
        budgetLimit = amount * 1000;
      }
    }

    const allBasicProducts = await prisma.product.findMany({
      select: { id: true, name: true, price: true, category: true, imageUrl: true, slug: true, originalPrice: true, brand: true, specs: true, stock: true }
    });

    let suggestedProducts: any[] = [];
    
    // TÌM KIẾM ĐÍCH DANH
    let exactMatchProducts = allBasicProducts.filter(p => {
       const pNameNorm = removeAccents(p.name.toLowerCase());
       if (normalizedCurrent.includes(pNameNorm) && pNameNorm.length > 5) return true;
       
       const pWords = pNameNorm.split(/\s+/).filter(w => w.length > 1);
       const mWords = normalizedCurrent.split(/\s+/).filter(w => w.length > 1);
       
       let matchCount = 0;
       for (let w of pWords) {
           if (mWords.includes(w)) matchCount++;
       }
       
       const hasModelNumberMatch = pWords.some(w => /[a-z]/.test(w) && /[0-9]/.test(w) && mWords.includes(w) && w.length >= 3);
       
       if (hasModelNumberMatch && matchCount >= 2) return true;
       if (pWords.length > 3 && matchCount >= pWords.length * 0.85) return true;

       return false;
    });

    if (exactMatchProducts.length > 0) {
       suggestedProducts = exactMatchProducts.slice(0, 4);
    } 
    else {
      const isGeneralInquiry = ["ban gi", "gom nhung gi", "co nhung gi", "mat hang", "san pham nao", "san pham gi"].some(k => normalizedContext.includes(k));

      let targetCategories: string[] = [];
      let excludedCategories: string[] = [];
      let targetAccessories: string[] = [];
      let excludedAccessories: string[] = [];

      if (isGeneralInquiry) {
        suggestedProducts = await prisma.product.findMany({
          take: 4, where: { stock: { gt: 0 } }, orderBy: { rating: 'desc' },
          select: { id: true, name: true, price: true, category: true, imageUrl: true, slug: true, originalPrice: true, brand: true, specs: true, stock: true }
        });
      } else {
        const categoryMap = [
          { keys: ["laptop", "lap top", "laptap"], cat: "Laptop" },
          { keys: ["man hinh", "man "], cat: "Màn hình" },
          { keys: ["ban phim", "phim", "keyboard"], cat: "Bàn phím" },
          { keys: ["chuot", "mouse"], cat: "Chuột" },
          { keys: ["tai nghe", "tai nge", "headphone"], cat: "Tai nghe" },
          { keys: ["ghe", "chair"], cat: "Ghế" }
        ];

        const accessoryMap = [
          { keys: ["webcam", "web cam"], name: "webcam" },
          { keys: ["balo", "ba lo"], name: "balo" },
          { keys: ["gia do", "de tan nhiet"], name: "giá đỡ" },
          { keys: ["ban di", "lot chuot", "pad"], name: "bàn di" }
        ];

        categoryMap.forEach(item => {
          const foundKey = item.keys.find(k => normalizedContext.includes(k));
          if (foundKey) {
            if (checkNegation(foundKey, normalizedContext)) excludedCategories.push(item.cat); 
            else targetCategories.push(item.cat);
          }
        });

        accessoryMap.forEach(item => {
          const foundKey = item.keys.find(k => normalizedContext.includes(k));
          if (foundKey) {
            if (checkNegation(foundKey, normalizedContext)) excludedAccessories.push(item.name);
            else targetAccessories.push(item.name);
          }
        });

        const isCombo = ["combo", "setup", "build", "bo may", "bo pc", "bo may tinh", "full bo", "tron bo", "full goc", "bo"].some(k => normalizedContext.includes(k));
        const isPC = ["pc", "may ban", "desktop", "may tinh ban"].some(k => normalizedContext.includes(k));

        if ((isCombo || isPC) && targetCategories.length === 0 && targetAccessories.length === 0) {
          targetCategories = ["Màn hình", "Bàn phím", "Chuột"].filter(c => !excludedCategories.includes(c)); 
        } else if (isCombo && targetCategories.length === 1 && targetCategories[0] === "Laptop" && targetAccessories.length === 0) {
          targetCategories = ["Laptop", "Bàn phím", "Chuột", "Tai nghe"].filter(c => !excludedCategories.includes(c)); 
        }

        const isAskingExtremePrice = hasExactWord(normalizedCurrent, ["cao", "dat", "mac", "thap", "re", "nhat"]);
        const isAskingDiscount = ["giam gia", "sale", "khuyen mai", "giam"].some(k => normalizedCurrent.includes(k));

        let currentHasCategory = false;
        categoryMap.forEach(item => { if (item.keys.some(k => normalizedCurrent.includes(k))) currentHasCategory = true; });
        accessoryMap.forEach(item => { if (item.keys.some(k => normalizedCurrent.includes(k))) currentHasCategory = true; });

        if (!currentHasCategory && !isCombo && !isPC && (isAskingExtremePrice || isAskingDiscount)) {
          targetCategories = [];
          targetAccessories = [];
        }

        const specKeywords = [
          "144hz", "165hz", "240hz", "60hz", "2k", "4k", "fhd", "ips", "oled", "cong", "phang",
          "16gb", "32gb", "8gb", "i5", "i7", "i9", "ryzen", 
          "red switch", "blue switch", "brown switch", "co", 
          "khong day", "bluetooth", "chong on", "anc", "silent"
        ];
        
        let requiredSpecs: string[] = [];
        let excludedSpecs: string[] = [];

        specKeywords.forEach(spec => {
          if (normalizedContext.includes(spec)) {
            if (checkNegation(spec, normalizedContext)) excludedSpecs.push(spec);
            else requiredSpecs.push(spec);
          }
        });

        const brands = ["apple", "asus", "lenovo", "dell", "hp", "msi", "acer", "lg", "logitech", "razer"];
        let includedBrand: string | null = null;
        let excludedBrand: string | null = null;

        brands.forEach(b => {
          if (normalizedContext.includes(b)) {
            if (checkNegation(b, normalizedContext)) excludedBrand = b;
            else includedBrand = b;
          }
        });

        let NOT_conditions: any[] = [];
        if (excludedBrand) NOT_conditions.push({ brand: { contains: excludedBrand, mode: "insensitive" } });
        if (checkNegation("gaming", normalizedContext)) NOT_conditions.push({ name: { contains: "gaming", mode: "insensitive" } });
        if (excludedCategories.length > 0) NOT_conditions.push({ category: { in: excludedCategories } });
        if (excludedAccessories.length > 0) {
          excludedAccessories.forEach(acc => NOT_conditions.push({ name: { contains: acc, mode: "insensitive" } }));
        }

        // =========================================================================
        // ĐÃ BỔ SUNG: LOGIC LỌC TỪ KHÓA "COMBO" KHI KHÁCH HỎI MUA NHIỀU MÓN
        // Nếu khách hỏi mua cả Bàn phím VÀ Chuột (hoặc build full bộ) -> Loại trừ các sản phẩm có chữ "combo" ở tên
        // Để tránh AI lấy 1 cái bàn phím (nhưng tên là combo phím chuột) rồi lấy thêm 1 con chuột rời nữa.
        // =========================================================================
        const isAskingBothKeyboardAndMouse = targetCategories.includes("Bàn phím") && targetCategories.includes("Chuột");
        if (isAskingBothKeyboardAndMouse || isCombo || isPC) {
            // Không áp dụng lọc này nếu khách chủ động có từ khóa "combo" trực tiếp trong tên muốn mua
            if (!normalizedCurrent.includes("combo")) {
                 NOT_conditions.push({ name: { contains: "combo", mode: "insensitive" } });
            }
        }
        // =========================================================================

        if (targetCategories.length === 0 && targetAccessories.length === 0 && !isCombo && !isPC && (isAskingExtremePrice || isAskingDiscount)) {
          
          let queryCondition: any = { stock: { gt: 0 } };
          if (isAskingDiscount) queryCondition.originalPrice = { not: null };
          if (NOT_conditions.length > 0) queryCondition.NOT = NOT_conditions;
          if (budgetLimit) queryCondition.price = { lte: budgetLimit };
          if (includedBrand) queryCondition.brand = { equals: includedBrand, mode: "insensitive" };

          let items = await prisma.product.findMany({
            where: queryCondition,
            select: { id: true, name: true, price: true, category: true, imageUrl: true, slug: true, originalPrice: true, brand: true, specs: true, stock: true }
          });

          items = items.filter((p: any) => {
            const productDataString = removeAccents((p.name + " " + JSON.stringify(p.specs || {})).toLowerCase());
            return requiredSpecs.every(s => productDataString.includes(s)) && excludedSpecs.every(s => !productDataString.includes(s));
          });

          if (isAskingDiscount) {
            items.sort((a: any, b: any) => {
              const pA = (a.originalPrice && a.originalPrice > a.price) ? (a.originalPrice - a.price) / a.originalPrice : 0;
              const pB = (b.originalPrice && b.originalPrice > b.price) ? (b.originalPrice - b.price) / b.originalPrice : 0;
              return pB - pA; 
            });
          } else if (isAskingExtremePrice) {
            items.sort((a: any, b: any) => {
              if (hasExactWord(normalizedCurrent, ["re", "thap", "min"])) return a.price - b.price; 
              return b.price - a.price; 
            });
          }

          suggestedProducts = items.slice(0, 3);

        } 
        else if (targetCategories.length > 1 || targetAccessories.length > 1 || (targetCategories.length > 0 && targetAccessories.length > 0)) {
          const isAskingDifferent = ["khac", "chon lai", "doi"].some(k => normalizedCurrent.includes(k));
          const skipCount = isAskingDifferent ? Math.floor(Math.random() * 2) + 1 : 0; 
          const perItemLimit = budgetLimit ? Math.floor(budgetLimit / (targetCategories.length + targetAccessories.length)) * 1.5 : null;

          const processItems = async (whereClause: any, orderLogic: any, isDiscountQuery: boolean) => {
            let items = await prisma.product.findMany({
              where: whereClause, orderBy: isDiscountQuery ? undefined : orderLogic, take: 20, 
              select: { id: true, name: true, price: true, category: true, imageUrl: true, slug: true, originalPrice: true, brand: true, specs: true, stock: true }
            });

            let validItems = items.filter((p: any) => {
              const productDataString = removeAccents((p.name + " " + JSON.stringify(p.specs || {})).toLowerCase());
              return requiredSpecs.every(s => productDataString.includes(s)) && excludedSpecs.every(s => !productDataString.includes(s));
            });

            if (isDiscountQuery) {
              validItems.sort((a: any, b: any) => {
                const percentA = (a.originalPrice && a.originalPrice > a.price) ? ((a.originalPrice - a.price) / a.originalPrice) : 0;
                const percentB = (b.originalPrice && b.originalPrice > b.price) ? ((b.originalPrice - b.price) / b.originalPrice) : 0;
                return percentB - percentA; 
              });
            } else if (isAskingExtremePrice) {
              validItems.sort((a: any, b: any) => {
                if (hasExactWord(normalizedCurrent, ["re", "thap", "min"])) return a.price - b.price;
                return b.price - a.price;
              });
            }

            if (validItems.length === 0 && perItemLimit) {
              delete whereClause.price;
              items = await prisma.product.findMany({
                where: whereClause, orderBy: { price: 'asc' }, take: 10, 
                select: { id: true, name: true, price: true, category: true, imageUrl: true, slug: true, originalPrice: true, brand: true, specs: true, stock: true }
              });
              validItems = items.filter((p: any) => {
                const productDataString = removeAccents((p.name + " " + JSON.stringify(p.specs || {})).toLowerCase());
                return requiredSpecs.every(s => productDataString.includes(s)) && excludedSpecs.every(s => !productDataString.includes(s));
              });
            }

            return validItems.length > skipCount ? validItems[skipCount] : (validItems[0] || null);
          };

          const promises = targetCategories.map(cat => {
            let whereClause: any = { category: cat, stock: { gt: 0 } };
            if (perItemLimit) whereClause.price = { lte: perItemLimit };
            if (NOT_conditions.length > 0) whereClause.NOT = NOT_conditions;
            if (isAskingDiscount) whereClause.originalPrice = { not: null };

            let orderLogic: any = { rating: 'desc' };
            if (hasExactWord(normalizedCurrent, ["re", "thap", "min"])) orderLogic = { price: 'asc' };
            else if (hasExactWord(normalizedCurrent, ["dat", "cao", "mac", "nhat"])) orderLogic = { price: 'desc' };

            return processItems(whereClause, orderLogic, isAskingDiscount);
          });

          const accPromises = targetAccessories.map(acc => {
            let whereClause: any = { category: "Phụ kiện", name: { contains: acc, mode: "insensitive" }, stock: { gt: 0 } };
            if (perItemLimit) whereClause.price = { lte: perItemLimit };
            if (NOT_conditions.length > 0) whereClause.NOT = NOT_conditions;
            if (isAskingDiscount) whereClause.originalPrice = { not: null };

            let orderLogic: any = { rating: 'desc' };
            if (hasExactWord(normalizedCurrent, ["re", "thap", "min"])) orderLogic = { price: 'asc' };
            else if (hasExactWord(normalizedCurrent, ["dat", "cao", "mac", "nhat"])) orderLogic = { price: 'desc' };

            return processItems(whereClause, orderLogic, isAskingDiscount);
          });

          const results = await Promise.all([...promises, ...accPromises]);
          suggestedProducts = results.filter(p => p !== null);

        } 
        else {
          let queryCondition: any = { stock: { gt: 0 } };
          
          if (includedBrand) queryCondition.brand = { equals: includedBrand, mode: "insensitive" };
          if (NOT_conditions.length > 0) queryCondition.NOT = NOT_conditions;
          if (isAskingDiscount) queryCondition.originalPrice = { not: null };

          if (targetCategories.length === 1) {
            queryCondition.category = targetCategories[0];
          } else if (targetAccessories.length === 1) {
            queryCondition.category = "Phụ kiện";
            queryCondition.name = { contains: targetAccessories[0], mode: "insensitive" };
          }

          const isCu = ["cu", "qua su dung", "like new"].some(k => normalizedContext.includes(k));
          if (isCu) queryCondition.condition = { contains: "cũ", mode: "insensitive" };
          
          if (budgetLimit) queryCondition.price = { lte: budgetLimit };

          let orderByClause: any = { rating: 'desc' };
          if (hasExactWord(normalizedCurrent, ["re", "thap", "min"])) orderByClause = { price: 'asc' };
          else if (hasExactWord(normalizedCurrent, ["dat", "cao", "mac", "nhat"])) orderByClause = { price: 'desc' };

          let rawProducts = await prisma.product.findMany({
            take: 20, where: queryCondition, orderBy: isAskingDiscount ? undefined : orderByClause,
            select: { id: true, name: true, price: true, category: true, imageUrl: true, slug: true, originalPrice: true, brand: true, specs: true, stock: true }
          });

          if (isAskingDiscount) {
              rawProducts.sort((a: any, b: any) => {
                const percentA = (a.originalPrice && a.originalPrice > a.price) ? ((a.originalPrice - a.price) / a.originalPrice) : 0;
                const percentB = (b.originalPrice && b.originalPrice > b.price) ? ((b.originalPrice - b.price) / b.originalPrice) : 0;
                return percentB - percentA; 
              });
          } else if (isAskingExtremePrice) {
              rawProducts.sort((a: any, b: any) => {
                if (hasExactWord(normalizedCurrent, ["re", "thap", "min"])) return a.price - b.price;
                return b.price - a.price;
              });
          }

          if (requiredSpecs.length > 0 || excludedSpecs.length > 0) {
            suggestedProducts = rawProducts.filter((p: any) => {
              const productDataString = removeAccents((p.name + " " + JSON.stringify(p.specs || {})).toLowerCase());
              const hasRequired = requiredSpecs.every(s => productDataString.includes(s));
              const hasNoExcluded = excludedSpecs.every(s => !productDataString.includes(s));
              return hasRequired && hasNoExcluded;
            }).slice(0, 4);
          } else {
            suggestedProducts = rawProducts.slice(0, 4);
          }
        }
      }
    }

    const isAskingRestock = ["het hang", "sap ve", "dang ky", "dat truoc", "nhan thong tin"].some(k => normalizedCurrent.includes(k));
    let productContextText = "Hiện tại kho hàng KHÔNG CÓ sản phẩm nào khớp với yêu cầu."; 
    
    if (suggestedProducts.length > 0) {
      productContextText = suggestedProducts.map((p, index) => {
        let discountText = "";
        if (p.originalPrice && p.originalPrice > p.price) {
           const percent = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
           discountText = `| ĐANG GIẢM GIÁ: ${percent}% `;
        }
        const stockStatus = p.stock > 0 ? "Còn hàng" : "HẾT HÀNG (Hãy báo khách hàng là sản phẩm đang tạm hết, và hướng dẫn khách bấm vào xem chi tiết để dùng form 'Đăng ký nhận thông tin')";
        return `- Danh mục: ${p.category} | Tên: ${p.name} | Giá: ${p.price.toLocaleString('vi-VN')}đ | Tình trạng: ${stockStatus} ${discountText}`;
      }).join("\n");
    } else if (isAskingRestock || suggestedProducts.length === 0) {
      productContextText += " HƯỚNG DẪN KHÁCH: Nếu khách đang hỏi về một sản phẩm tạm hết hàng, hãy tư vấn khách hàng nhấn vào sản phẩm đó và dùng tính năng 'Đăng ký nhận thông tin' để lại (Họ tên, SĐT, Email, Khu vực) để cửa hàng liên hệ ưu tiên ngay khi có đợt hàng mới.";
    }

    const cleanHistory = history.map((m: any) => ({
      role: m.role,
      content: m.content.replace(/[\{\}\[\]]/g, "") 
    }));

    const systemPrompt = `Bạn là BlurBot, nhân viên tư vấn nhiệt tình của cửa hàng máy tính BlurSetup.

[KIẾN THỨC NỀN CỦA CỬA HÀNG - DÙNG ĐỂ TRẢ LỜI CÁC CÂU HỎI TỔNG QUAN VÀ CHÍNH SÁCH]
- Ngành hàng: Laptop, Màn hình, Bàn phím, Chuột, Tai nghe, Ghế công thái học, Balo, Webcam, Giá đỡ, Bàn di chuột.
- Thương hiệu: Apple, ASUS, Lenovo, Dell, HP, MSI, Acer, LG, Logitech, Razer...
- Địa chỉ cửa hàng (Mua trực tiếp): 123 Trường Chinh, Tân Bình, TP. Hồ Chí Minh.
- Vận chuyển: Freeship toàn quốc cho đơn từ 1.000.000đ, giao hỏa tốc nội thành 2h.
- Thanh toán: Hỗ trợ thanh toán tiền mặt khi nhận hàng (COD), quẹt thẻ, chuyển khoản ngân hàng và trả góp.
- Bảo hành: Hỗ trợ lỗi 1 đổi 1 trong 7 ngày đầu, bảo hành chính hãng từ 12 - 24 tháng tùy hãng.
- Ưu đãi học sinh/sinh viên: Vui lòng mang theo Thẻ sinh viên khi đến mua trực tiếp để được tư vấn gói giảm giá riêng (nếu có chương trình).
- HƯỚNG DẪN ĐẶC BIỆT KHI SẢN PHẨM HẾT HÀNG: Nếu trong phần [KẾT QUẢ TỪ KHO HÀNG] có báo tình trạng "HẾT HÀNG", TUYỆT ĐỐI KHÔNG nói là sản phẩm không có trong danh mục. Hãy xin lỗi khách vì hàng đang tạm hết, gợi ý một vài tính năng tốt của nó, HOẶC hướng dẫn khách bấm vào xem chi tiết, kéo xuống điền form "Đăng ký nhận thông tin" để được ưu tiên nhận hàng sớm nhất.

[KẾT QUẢ TỪ KHO HÀNG CHO CÂU HỎI HIỆN TẠI]
${productContextText}

QUY TẮC TRẢ LỜI SỐNG CÒN (KHÔNG ĐƯỢC VI PHẠM):
1. TƯ VẤN SẢN PHẨM: CHỈ TƯ VẤN CÁC MÓN TRONG [KẾT QUẢ TỪ KHO HÀNG]. BẠN BỊ CẤM tự sáng tạo, tự bịa tên sản phẩm. BẠN CẤM KHÔNG ĐƯỢC NHÂN BẢN (lặp lại) sản phẩm nhiều lần.
2. TƯ VẤN CHÍNH SÁCH/ĐỊA CHỈ: CHỈ ĐƯỢC trả lời dựa trên [KIẾN THỨC NỀN CỦA CỬA HÀNG]. TUYỆT ĐỐI KHÔNG tự bịa ra các chương trình giảm giá sinh viên ảo, không bịa tên ngân hàng, không bịa hãng vận chuyển.
3. XỬ LÝ KHI KHÁCH ĐƯA NGÂN SÁCH DƯ THỪA: Nếu khách yêu cầu mua các món rẻ (như chuột, lót chuột, phím) với số tiền RẤT LỚN (ví dụ: đúng 20 triệu), BẠN TUYỆT ĐỐI KHÔNG ĐƯỢC nhét thêm Laptop, Ghế... hay bất cứ món nào ngoài yêu cầu của khách để cho đủ tiền. Bạn CHỈ ĐƯỢC liệt kê các món khách nhờ có trong [KẾT QUẢ TỪ KHO HÀNG], sau đó nhẹ nhàng giải thích: "Dạ, với các món anh/chị chọn thì dù lấy loại xịn nhất bên em cũng chưa đến mức ngân sách đó ạ. Anh/chị tham khảo bộ cực chất này nhé!"
4. ĐỊNH DẠNG: Dùng văn bản bình thường. BẠN BỊ CẤM sử dụng định dạng JSON, cấm dùng dấu ngoặc nhọn { } hoặc ngoặc vuông [ ].`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "system", content: systemPrompt }, ...cleanHistory, { role: "user", content: message }],
        temperature: 0.1, 
        max_tokens: 512 
      })
    });

    if (!response.ok) {
      throw new Error("Lỗi API Groq");
    }

    const data = await response.json();
    const botReply = data.choices?.[0]?.message?.content || "Xin lỗi, mình chưa thể trả lời.";

    await prisma.chatMessage.create({
      data: {
        userId: userId,
        role: "bot",
        text: botReply,
        widget: suggestedProducts.length > 0 ? "product-recommend" : null,
        widgetData: suggestedProducts.length > 0 ? suggestedProducts : null
      }
    });
    
    return NextResponse.json({ 
      success: true,
      reply: botReply,
      products: suggestedProducts
    });

  } catch (error: any) {
    console.error("⛔ LỖI CRASH BACKEND CHAT:", error);
    return NextResponse.json({ success: false, reply: "Hệ thống bảo trì. Bạn liên hệ Zalo nhé!" }, { status: 500 });
  }
}