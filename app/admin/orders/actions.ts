"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ==========================================
// 1. LẤY DANH SÁCH ĐƠN HÀNG
// ==========================================
export async function getOrders() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: true, 
      },
      orderBy: { createdAt: 'desc' }
    });

    return orders.map(order => {
      const statusMap: Record<string, string> = {
        "pending": "Đang xử lý",
        "confirmed": "Đã xác nhận",
        "shipping": "Đang giao",
        "completed": "Đã giao",
        "cancelled": "Đã hủy"
      };

      return {
        id: order.id,
        customer: order.customerName || order.user?.name || "Khách vãng lai",
        total: order.totalAmount.toLocaleString("vi-VN") + " ₫",
        status: statusMap[order.status] || "Đang xử lý",
        statusRaw: order.status, 
        date: new Date(order.createdAt).toLocaleDateString("vi-VN"),
      };
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách đơn hàng:", error);
    return [];
  }
}

// ==========================================
// 2. CẬP NHẬT TRẠNG THÁI
// ==========================================
export async function updateOrderStatus(orderId: string, newStatus: string) {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus }
    });
    
    revalidatePath("/admin/orders");
    return { success: true };
  } catch (error) {
    console.error("Lỗi cập nhật trạng thái đơn hàng:", error);
    return { success: false, error: "Không thể cập nhật trạng thái." };
  }
}

// ==========================================
// 3. XÓA ĐƠN HÀNG
// ==========================================
export async function deleteOrder(orderId: string) {
  try {
    await prisma.orderItem.deleteMany({
      where: { orderId: orderId }
    });
    
    await prisma.order.delete({
      where: { id: orderId }
    });

    revalidatePath("/admin/orders");
    return { success: true };
  } catch (error) {
    console.error("Lỗi xóa đơn hàng:", error);
    return { success: false, error: "Không thể xóa đơn hàng." };
  }
}

// ==========================================
// 4. LẤY CHI TIẾT ĐƠN HÀNG
// ==========================================
export async function getOrderDetails(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { product: true }
        },
        user: true
      }
    });
    return order;
  } catch (error) {
    console.error("Lỗi lấy chi tiết đơn hàng:", error);
    return null;
  }
}

// ==========================================
// 5. TẠO 25 ĐƠN HÀNG MẪU (HÀM BỊ THIẾU)
// ==========================================
export async function generateMockOrders() {
  try {
    const products = await prisma.product.findMany();
    
    if (products.length === 0) {
      return { success: false, error: "Bạn cần có ít nhất 1 sản phẩm trong kho để tạo đơn hàng mẫu." };
    }

    const firstNames = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Đặng", "Bùi", "Đỗ", "Hồ"];
    const middleNames = ["Văn", "Thị", "Hoàng", "Tuấn", "Mai", "Đức", "Thu", "Ngọc", "Hải", "Quang"];
    const lastNames = ["Anh", "Bình", "Cường", "Dũng", "Em", "Phong", "Giang", "Hà", "Minh", "Kiên"];
    const statuses = ["pending", "processing", "shipped", "completed", "completed", "completed", "cancelled"];
    const paymentMethods = ["COD", "BANKING", "MOMO", "VNPAY"];
    const cities = ["TP.HCM", "Hà Nội", "Đà Nẵng", "Cần Thơ", "Hải Phòng"];

    let createdCount = 0;

    for (let i = 0; i < 25; i++) {
      const numItems = Math.floor(Math.random() * 3) + 1;
      const orderItemsData = [];
      let totalAmount = 0;

      for (let j = 0; j < numItems; j++) {
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 2) + 1; 
        const price = randomProduct.price;

        totalAmount += price * quantity;
        orderItemsData.push({
          productId: randomProduct.id,
          quantity: quantity,
          price: price,
        });
      }

      const randomDaysAgo = Math.floor(Math.random() * 90);
      const randomDate = new Date();
      randomDate.setDate(randomDate.getDate() - randomDaysAgo);

      const fullName = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${middleNames[Math.floor(Math.random() * middleNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
      const phone = `09${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
      const address = `${Math.floor(Math.random() * 999)} Đường số ${Math.floor(Math.random() * 20)}, ${cities[Math.floor(Math.random() * cities.length)]}`;
      
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      const paymentStatus = status === "completed" ? "paid" : "pending";

      await prisma.order.create({
        data: {
          customerName: fullName,
          phone: phone,
          address: address,
          totalAmount: totalAmount + 30000, 
          shippingFee: 30000,
          discountAmount: 0,
          paymentMethod: paymentMethod,
          paymentStatus: paymentStatus,
          status: status,
          createdAt: randomDate, 
          updatedAt: randomDate,
          items: {
            create: orderItemsData 
          }
        }
      });
      createdCount++;
    }

    revalidatePath("/admin");
    revalidatePath("/admin/analytics");
    revalidatePath("/admin/orders");
    return { success: true, message: `Thành công! Đã bơm ${createdCount} đơn hàng vào Database.` };
  } catch (error) {
    console.error("Lỗi Seed Order:", error);
    return { success: false, error: "Đã xảy ra lỗi khi tạo dữ liệu mẫu." };
  }
}