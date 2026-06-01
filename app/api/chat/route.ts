import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Khởi tạo Gemini bằng API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ reply: "Lỗi: Chưa cấu hình GEMINI_API_KEY trong file .env" }, { status: 500 });
    }

    // Sử dụng model gemini-1.5-flash (Nhanh và tối ưu nhất hiện tại)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Cài đặt "Nhân cách" cho Bot
    const systemInstruction = `
      Bạn là BlurBot, nhân viên tư vấn xuất sắc của cửa hàng công nghệ BlurSetup.
      Cửa hàng chuyên bán: Laptop, Màn hình, Bàn phím cơ, Chuột gaming, Tai nghe và ghế Công thái học.
      Quy tắc trả lời:
      1. Luôn xưng hô là "BlurBot" và gọi khách hàng là "bạn".
      2. Trả lời ngắn gọn, súc tích, thân thiện, có dùng emoji.
      3. Nếu khách hỏi giá ship, trả lời: "Freeship toàn quốc cho đơn từ 1 triệu, giao hỏa tốc 2H tại HN và HCM ạ!".
      4. Nếu không biết câu trả lời, hãy khuyên khách hàng nhắn tin qua Zalo (0328275837).
    `;

    const prompt = `${systemInstruction}\n\nKhách hàng hỏi: ${message}\nBlurBot trả lời:`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return NextResponse.json({ reply: responseText });

  } catch (error) {
    console.error("Lỗi AI Chat:", error);
    return NextResponse.json({ reply: "Xin lỗi, hệ thống AI đang quá tải. Bạn vui lòng liên hệ Zalo nhé!" }, { status: 500 });
  }
}