import { NextResponse } from "next/server";
import crypto from "crypto";
import moment from "moment"; // Cần chạy lệnh: npm install moment

export async function POST(req: Request) {
  try {
    const { orderId, amount, orderInfo } = await req.json();

    // CÁC THÔNG SỐ NÀY LẤY TỪ ZALOPAY MERCHANT PORTAL
    const config = {
      app_id: process.env.ZALO_APP_ID || "2553",
      key1: process.env.ZALO_KEY1 || "PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL",
      key2: process.env.ZALO_KEY2 || "kLtgPl8YEStV6210fX11u1105121012w",
      endpoint: "https://sb-openapi.zalopay.vn/v2/create"
    };

    const embed_data = { redirecturl: "http://localhost:3000/orders" };
    const items = [{}];
    const transID = Math.floor(Math.random() * 1000000);
    const app_time = Date.now();

    const order = {
      app_id: config.app_id,
      app_trans_id: `${moment().format("YYMMDD")}_${transID}`,
      app_user: "BlurSetup_User",
      app_time: app_time,
      item: JSON.stringify(items),
      embed_data: JSON.stringify(embed_data),
      amount: amount,
      description: `Thanh toan don hang #${orderId}`,
      bank_code: "",
      mac: ""
    };

    // Tạo chữ ký MAC cho ZaloPay
    const data = config.app_id + "|" + order.app_trans_id + "|" + order.app_user + "|" + order.amount + "|" + order.app_time + "|" + order.embed_data + "|" + order.item;
    order.mac = crypto.createHmac("sha256", config.key1).update(data).digest("hex");

    // Gửi yêu cầu sang ZaloPay
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    });

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}