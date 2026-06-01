"use server";

import { prisma } from "@/lib/prisma";

export async function getUserNotificationHistory(userId?: string) {
  try {
    if (userId) {
      // Nếu đã đăng nhập: Lấy thông báo chung (all, broadcast) VÀ thông báo cá nhân (target: userId)
      return await prisma.notification.findMany({
        where: {
          OR: [
            { target: "all" },
            { target: "Tất cả" },
            { target: "Tất cả khách hàng (Toàn hệ thống)" },
            { type: "broadcast" },
            { target: userId }
          ]
        },
        orderBy: { createdAt: "desc" },
      });
    }
    
    // Nếu chưa đăng nhập (khách vãng lai): Chỉ lấy các thông báo chung
    return await prisma.notification.findMany({
      where: { 
        OR: [
          { target: "all" },
          { target: "Tất cả" },
          { target: "Tất cả khách hàng (Toàn hệ thống)" },
          { type: "broadcast" }
        ]
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Lỗi lấy lịch sử thông báo user:", error);
    return [];
  }
}