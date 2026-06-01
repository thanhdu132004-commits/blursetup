// app/api/payment/zalopay/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import moment from "moment";

export async function POST(req: Request) {
  try {
    const { orderId, amount } = await req.json();

    // 1. ÉP KIỂU SỐ (NUMBER) CHO APP_ID (Rất hay lỗi nếu để dạng String)
    const appId = process.env.ZALO_APP_ID ? parseInt(process.env.ZALO_APP_ID) : 2553;
    const key1 = process.env.ZALO_KEY1 || "PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL";
    const endpoint = "https://sb-openapi.zalopay.vn/v2/create";

    const embed_data = { redirecturl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/orders/${orderId}` };
    const items = [{}]; 
    const transID = Math.floor(Math.random() * 1000000);
    const app_time = Date.now();

    const order: any = {
      app_id: appId, // Đã là số nguyên
      app_trans_id: `${moment().format("YYMMDD")}_${transID}`,
      app_user: "BlurSetup_User",
      app_time: app_time,
      item: JSON.stringify(items),
      embed_data: JSON.stringify(embed_data),
      amount: Number(amount), // Đảm bảo amount luôn là số nguyên
      description: `Thanh toan don hang #${orderId}`,
      bank_code: "",
    };

    // 2. TẠO CHỮ KÝ MAC
    const data = order.app_id + "|" + order.app_trans_id + "|" + order.app_user + "|" + order.amount + "|" + order.app_time + "|" + order.embed_data + "|" + order.item;
    order.mac = crypto.createHmac("sha256", key1).update(data).digest("hex");

    // 3. GỬI REQUEST SANG ZALOPAY
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    });

    const result = await response.json();

    // ==========================================
    // IN LOG ĐỂ BẮT BỆNH CHÍNH XÁC
    // ==========================================
    console.log("=== PHẢN HỒI TỪ ZALOPAY ===");
    console.log(result);
    console.log("===========================");

    if (result.return_code === 1) {
        return NextResponse.json({ success: true, order_url: result.order_url });
    } else {
        return NextResponse.json({ 
            success: false, 
            message: result.return_message || "Giao dịch thất bại",
            sub_message: result.sub_return_message // Gửi thêm chi tiết lỗi về Frontend
        }, { status: 400 });
    }

  } catch (error) {
    console.error("Lỗi Server khi gọi ZaloPay:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}