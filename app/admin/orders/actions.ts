// app/admin/oders/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Hàm tiện ích hỗ trợ chuẩn hóa trạng thái về tiếng Việt để hiển thị chính xác lên các thẻ Tab
const mapStatusToVietnamese = (status: string): string => {
  const statusMap: Record<string, string> = {
    "pending": "Chờ xác nhận",
    "processing": "Đang xử lý",
    "shipped": "Đang giao",
    "completed": "Đã giao",
    "cancelled": "Đã hủy",
    // Hỗ trợ nếu dữ liệu gốc đã lưu sẵn tiếng Việt
    "Chờ xác nhận": "Chờ xác nhận",
    "Đang xử lý": "Đang xử lý",
    "Đang giao": "Đang giao",
    "Đã giao": "Đã giao",
    "Đã hủy": "Đã hủy"
  };
  return statusMap[status] || "Chờ xác nhận";
};

// ==========================================
// 1. LẤY DANH SÁCH ĐƠN HÀNG (RICH DATA)
// ==========================================
export async function getOrders() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: true,
        items: {
          include: {
            product: true // Ép kèm dữ liệu sản phẩm để hiển thị ảnh/tên trong hộp thoại chi tiết
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Chuẩn hóa cấu trúc dữ liệu trả về tương thích hoàn hảo với giao diện Admin Orders mới
    return orders.map(order => ({
      ...order,
      id: order.id,
      status: mapStatusToVietnamese(order.status), // Đồng bộ chuỗi ký tự khớp với bộ lọc UI
    }));
  } catch (error) {
    console.error("Lỗi lấy danh sách đơn hàng:", error);
    return [];
  }
}

// ==========================================
// 2. CẬP NHẬT TRẠNG THÁI & ĐIỀU PHỐI TỒN KHO (TRANSACTION)
// ==========================================
export async function updateOrderStatus(orderId: string, newStatus: string) {
  try {
    // Tìm nạp thông tin đơn hàng hiện tại kèm danh sách sản phẩm liên kết
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!currentOrder) {
      return { success: false, error: "Không tìm thấy đơn hàng trên hệ thống." };
    }

    const oldStatus = mapStatusToVietnamese(currentOrder.status);
    const targetStatus = mapStatusToVietnamese(newStatus);

    // Chạy cơ chế Transaction bảo toàn dữ liệu: Đảm bảo đổi trạng thái và xử lý số lượng kho luôn đi liền nhau
    await prisma.$transaction(async (tx) => {
      // THÀNH PHẦN A: Cập nhật text trạng thái đơn hàng trong bảng Order
      await tx.order.update({
        where: { id: orderId },
        data: { status: targetStatus }
      });

      // THÀNH PHẦN B: LUỒNG TRỪ TỒN KHO KHI XÁC NHẬN ĐƠN
      // Điều kiện: Chuyển từ "Chờ xác nhận" sang "Đang xử lý"
      if (oldStatus === "Chờ xác nhận" && targetStatus === "Đang xử lý") {
        for (const item of currentOrder.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { decrement: item.quantity }, // Trừ kho hàng thực tế
              sold: { increment: item.quantity }   // Tăng chỉ số lượt bán
            }
          });
        }
      }

      // THÀNH PHẦN C: LUỒNG CỘNG HOÀN KHO KHI HỦY ĐƠN HÀNG
      // Điều kiện: Đơn hàng trước đó đã được xác nhận (đã trừ kho) và giờ chuyển sang trạng thái "Đã hủy"
      if (targetStatus === "Đã hủy" && ["Đang xử lý", "Đang giao", "Đã giao"].includes(oldStatus)) {
        for (const item of currentOrder.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { increment: item.quantity }, // Trả hàng lại về kho kho
              sold: { decrement: item.quantity }   // Hạ lượt bán ảo xuống
            }
          });
        }
      }
    });

    revalidatePath("/admin/orders");
    return { success: true };
  } catch (error: any) {
    console.error("Lỗi cập nhật trạng thái đơn hàng:", error);
    return { success: false, error: error.message || "Không thể cập nhật trạng thái." };
  }
}

// ==========================================
// 3. XÓA ĐƠN HÀNG (CASCADING DELETION)
// ==========================================
export async function deleteOrder(orderId: string) {
  try {
    // Sử dụng Transaction để đảm bảo xóa sạch các item liên kết trước rồi mới xóa đơn hàng gốc
    await prisma.$transaction([
      prisma.orderItem.deleteMany({ where: { orderId: orderId } }),
      prisma.order.delete({ where: { id: orderId } })
    ]);

    revalidatePath("/admin/orders");
    return { success: true };
  } catch (error) {
    console.error("Lỗi xóa đơn hàng:", error);
    return { success: false, error: "Không thể xóa đơn hàng." };
  }
}

// ==========================================
// 4. BƠM 25 ĐƠN HÀNG MẪU CHUẨN ĐỒNG BỘ TIẾNG VIỆT
// ==========================================
export async function generateMockOrders() {
  try {
    const products = await prisma.product.findMany();
    
    if (products.length === 0) {
      return { success: false, error: "Bạn cần có ít nhất 1 sản phẩm trong kho để tạo đơn hàng mẫu." };
    }

    const firstNames = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Đặng", "Bùi", "Đỗ", "Hồ"];
    const middleNames = ["Văn", "Thị", "Hoàng", "Tuấn", "Mai", "Đức", "Thu", "Ngọc", "Hải", "Quang"];
    const lastNames = ["Anh", "Bình", "Cường", "Dũng", "Sơn", "Phong", "Giang", "Hà", "Minh", "Kiên"];
    
    // Đồng bộ trực tiếp trạng thái tiếng Việt ngay từ khâu tạo dữ liệu giả lập mẫu để hiển thị chuẩn lên các Tab
    const statuses = ["Chờ xác nhận", "Đang xử lý", "Đang giao", "Đã giao", "Đã giao", "Đã hủy"];
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
      const phone = `03${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
      const address = `${Math.floor(Math.random() * 299) + 1} Đường số ${Math.floor(Math.random() * 20) + 1}, ${cities[Math.floor(Math.random() * cities.length)]}`;
      
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const paymentStatus = status === "Đã giao" ? "paid" : "pending";

      await prisma.order.create({
        data: {
          customerName: fullName,
          phone: phone,
          address: address,
          totalAmount: totalAmount + 30000, 
          shippingFee: 30000,
          discountAmount: 0,
          paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
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

    revalidatePath("/admin/orders");
    return { success: true, message: `Thành công! Đã bơm ${createdCount} đơn hàng vào Database.` };
  } catch (error) {
    console.error("Lỗi Seed Order:", error);
    return { success: false, error: "Đã xảy ra lỗi khi tạo dữ liệu mẫu." };
  }
}