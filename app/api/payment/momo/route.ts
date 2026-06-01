// app/api/payment/momo/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { orderId, amount, orderInfo } = await req.json();

    const partnerCode = "MOMOBKUN20180529";
    const accessKey = "klm05TvNBzhg7h7j";
    const secretKey = "at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa";
    const endpoint = "https://test-payment.momo.vn/v2/gateway/api/create";

    // ĐÃ THÊM .trim() ĐỂ XÓA MỌI KHOẢNG TRẮNG DƯ THỪA TRƯỚC/SAU LINK
    const domain = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").trim().replace(/\/$/, "");
    
    const redirectUrl = `${domain}/oder`; 
    const ipnUrl = `${domain}/api/payment/momo-ipn`; 

    const requestType = "captureWallet";
    const extraData = "";
    const requestId = orderId + "_" + new Date().getTime(); 

    const amountStr = String(amount);

    // TẠO CHỮ KÝ
    const rawSignature = `accessKey=${accessKey}&amount=${amountStr}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    
    // Mã hóa HMAC SHA256
    const signature = crypto.createHmac("sha256", secretKey).update(rawSignature).digest("hex");

    // Gửi yêu cầu sang hệ thống MoMo
    const requestBody = JSON.stringify({
      partnerCode, 
      accessKey, 
      requestId, 
      amount: Number(amount), 
      orderId, 
      orderInfo, 
      redirectUrl, 
      ipnUrl, 
      extraData, 
      requestType, 
      signature, 
      lang: "vi"
    });

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: requestBody
    });

    const data = await response.json();
    
    if (data.resultCode !== 0) {
        console.log("MoMo API Error:", data.message);
        console.log("Raw Signature:", rawSignature); // In ra chuỗi để dễ debug
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error("Lỗi Server gọi cổng MoMo:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}