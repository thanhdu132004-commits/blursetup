import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { orderId, amount, orderInfo } = await req.json();

    // CÁC THÔNG SỐ NÀY LẤY TỪ PORTAL DOANH NGHIỆP MOMO (File .env)
    const partnerCode = process.env.MOMO_PARTNER_CODE || "MOMOBKUN20180529";
    const accessKey = process.env.MOMO_ACCESS_KEY || "klm05TvNCzjOaHU1";
    const secretKey = process.env.MOMO_SECRET_KEY || "at67qH6mk8g5N1v2eb3yH28pM5J3p5d6";
    const endpoint = "https://test-payment.momo.vn/v2/gateway/api/create";

    const redirectUrl = "http://localhost:3000/orders"; // URL trả về sau khi thanh toán
    const ipnUrl = "http://localhost:3000/api/payment/momo-ipn"; // URL Server nhận thông báo ngầm
    const requestType = "captureWallet";
    const extraData = "";
    const requestId = partnerCode + new Date().getTime();

    // Tạo chuỗi ký tự theo chuẩn MoMo yêu cầu
    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    
    // Ký thuật toán HMAC SHA256
    const signature = crypto.createHmac("sha256", secretKey).update(rawSignature).digest("hex");

    // Gửi yêu cầu sang MoMo
    const requestBody = JSON.stringify({
      partnerCode, accessKey, requestId, amount, orderId, orderInfo, redirectUrl, ipnUrl, extraData, requestType, signature, lang: "vi"
    });

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: requestBody
    });

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}