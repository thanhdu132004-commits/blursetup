"use server";

import { prisma } from "@/lib/prisma";

export async function getUserOrders(userId: string) {
  try {
    const orders = await prisma.order.findMany({
      where: { 
        userId: userId 
      },
      orderBy: { 
        createdAt: 'desc' // Sắp xếp đơn hàng mới nhất lên đầu
      },
      include: {
        // Lấy luôn thông tin chi tiết các sản phẩm trong đơn hàng
        items: {
          include: {
            product: true 
          }
        }
      }
    });

    return { success: true, data: orders };
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đơn hàng:", error);
    return { success: false, data: [] };
  }
}