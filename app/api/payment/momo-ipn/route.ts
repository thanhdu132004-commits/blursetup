import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const secretKey = process.env.MOMO_SECRET_KEY || "at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa";
    const accessKey = process.env.MOMO_ACCESS_KEY || "klm05TvNBzhg7h7j";

    const { partnerCode, orderId, requestId, amount, orderInfo, orderType, transId, resultCode, message, payType, responseTime, extraData, signature } = body;

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
    const mySignature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

    if (mySignature !== signature) {
      return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
    }

    if (resultCode === 0) {
      // INCLUDE items ĐỂ BIẾT SP NÀO MÀ TRỪ KHO
      const existingOrder = await prisma.order.findUnique({ 
        where: { id: orderId },
        include: { items: true } 
      });
      
      if (existingOrder) {
         // ==========================================
         // TÍNH NĂNG MỚI: IDEMPOTENCY (CHỐNG KẸT/TRÙNG ĐƠN)
         // ==========================================
         if (existingOrder.paymentStatus === "paid") {
             console.log("MoMo IPN: Đơn hàng này đã được xử lý trước đó rồi.");
             return NextResponse.json({ status: 200, message: "Acknowledge" });
         }

         // ==========================================
         // TÍNH NĂNG MỚI: TRỪ TỒN KHO & CẬP NHẬT TRẠNG THÁI (TRANSACTION)
         // ==========================================
         await prisma.$transaction(async (tx) => {
             // 1. Cập nhật trạng thái đơn hàng
             await tx.order.update({
                 where: { id: orderId },
                 data: { paymentStatus: "paid", status: "Đang xử lý" }
             });

             // 2. Vòng lặp trừ Tồn kho và tăng Lượt bán cho từng sản phẩm
             for (const item of existingOrder.items) {
                 await tx.product.update({
                     where: { id: item.productId },
                     data: {
                         stock: { decrement: item.quantity }, // Trừ số lượng kho
                         sold: { increment: item.quantity }   // Tăng lượt bán
                     }
                 });
             }
         });
         console.log("✅ MoMo IPN: Đã cập nhật trạng thái & trừ tồn kho thành công!");
      }
    }

    return NextResponse.json({ status: 200, message: "Acknowledge" });
  } catch (error) {
    console.error("MoMo IPN Lỗi Server:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}