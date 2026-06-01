import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, formData, cartItems, totalAmount, shippingFee, discountAmount, paymentMethod } = body;
    const fullAddress = `${formData.address}, ${formData.ward}, ${formData.district}, ${formData.city}`;

    const newOrder = await prisma.order.create({
      data: {
        userId: userId || undefined,
        customerName: formData.name,
        phone: formData.phone,
        address: fullAddress,
        totalAmount: totalAmount,
        shippingFee: shippingFee || 0,
        discountAmount: discountAmount || 0,
        paymentMethod: paymentMethod,
        paymentStatus: "pending",
        status: "Chờ xác nhận",
        note: "",
        items: {
          create: cartItems.map((item: any) => ({
            productId: item.product.id || item.product._id,
            quantity: item.quantity,
            price: item.product.price
          }))
        }
      }
    });

    // ==========================================
    // TÍNH NĂNG MỚI: XÓA SẢN PHẨM KHỎI GIỎ HÀNG
    // ==========================================
    // Lấy ra danh sách ID của các CartItem vừa được đặt
    const cartItemIds = cartItems.map((item: any) => item.id);
    
    if (cartItemIds.length > 0) {
      await prisma.cartItem.deleteMany({
        where: {
          id: { in: cartItemIds } // Chỉ xóa những item đã được đặt (hữu ích khi mua ngay 1 SP)
        }
      });
    }

    return NextResponse.json({ success: true, order: newOrder });

  } catch (error) {
    console.error("Lỗi khi tạo đơn hàng mới:", error);
    return NextResponse.json({ success: false, message: "Lỗi Server khi tạo đơn hàng" }, { status: 500 });
  }
}