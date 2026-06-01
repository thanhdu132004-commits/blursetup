import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const key2 = process.env.ZALO_KEY2 || "kLtgPl8YEStV6210fX11u1105121012w"; 
    
    const dataStr = body.data;
    const reqMac = body.mac;
    const mac = crypto.createHmac("sha256", key2).update(dataStr).digest("hex");

    if (reqMac !== mac) {
      return NextResponse.json({ return_code: -1, return_message: "mac not equal" });
    }

    const dataJson = JSON.parse(dataStr);
    const embedData = JSON.parse(dataJson.embed_data);
    const dbOrderId = embedData.orderId; 

    if (dbOrderId) {
        // INCLUDE items ĐỂ LẤY THÔNG TIN TRỪ KHO
        const existingOrder = await prisma.order.findUnique({
            where: { id: dbOrderId },
            include: { items: true }
        });

        if (existingOrder) {
             // ==========================================
             // TÍNH NĂNG MỚI: IDEMPOTENCY
             // ==========================================
             if (existingOrder.paymentStatus === "paid") {
                 console.log("ZaloPay Callback: Đơn hàng này đã được xử lý trước đó rồi.");
                 return NextResponse.json({ return_code: 1, return_message: "success" });
             }

             // ==========================================
             // TÍNH NĂNG MỚI: TRỪ TỒN KHO (TRANSACTION)
             // ==========================================
             await prisma.$transaction(async (tx) => {
                 // 1. Cập nhật đơn hàng
                 await tx.order.update({
                     where: { id: dbOrderId },
                     data: { paymentStatus: "paid", status: "Đang xử lý" }
                 });

                 // 2. Trừ tồn kho & tăng lượt bán
                 for (const item of existingOrder.items) {
                     await tx.product.update({
                         where: { id: item.productId },
                         data: {
                             stock: { decrement: item.quantity },
                             sold: { increment: item.quantity }
                         }
                     });
                 }
             });
             console.log("✅ ZaloPay: Đã cập nhật trạng thái & trừ tồn kho thành công!");
        }
    }

    return NextResponse.json({ return_code: 1, return_message: "success" });

  } catch (error) {
    console.error("ZaloPay Callback Lỗi Server:", error);
    return NextResponse.json({ return_code: 0, return_message: "Server error" });
  }
}