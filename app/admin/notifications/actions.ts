"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 1. LẤY TẤT CẢ THÔNG BÁO (Dành cho trang quản lý của Admin)
export async function getNotifications() {
  try {
    return await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Lỗi lấy lịch sử thông báo:", error);
    return [];
  }
}

// 2. LẤY THÔNG BÁO CHO NAVBAR (Dùng cho cả Admin và User)
export async function getMyNotifications(userId?: string, isAdmin: boolean = false) {
  try {
    if (isAdmin) {
      return await prisma.notification.findMany({
        orderBy: { createdAt: "desc" },
        take: 20, // Chỉ lấy 20 cái mới nhất cho Navbar
      });
    }

    if (userId) {
      return await prisma.notification.findMany({
        where: {
          OR: [
            { target: "all" },
            { target: "Tất cả" }, // Đề phòng UI gửi chữ tiếng Việt
            { target: "Tất cả khách hàng" },
            { type: "broadcast" }, // TẤT CẢ bản tin phát sóng đều sẽ hiển thị cho User
            { target: userId }
          ]
        },
        orderBy: { createdAt: "desc" },
        take: 20
      });
    }
    
    // Nếu khách vãng lai chưa đăng nhập
    return await prisma.notification.findMany({
      where: { 
        OR: [
          { target: "all" },
          { target: "Tất cả" },
          { type: "broadcast" }
        ]
      },
      orderBy: { createdAt: "desc" },
      take: 20
    });
  } catch (error) {
    console.error("Lỗi lấy thông báo cho Navbar:", error);
    return [];
  }
}

// 3. TẠO THÔNG BÁO MỚI (Dùng cho Admin phát sóng)
export async function createNotification(data: { title: string; content: string; type: string; target?: string; userId?: string }) {
  try {
    const newNoti = await prisma.notification.create({
      data: {
        title: data.title,
        content: data.content,
        type: data.type,
        target: data.target || "all",
      },
    });
    
    revalidatePath("/admin");
    revalidatePath("/admin/notifications");
    revalidatePath('/', 'layout'); // Ép Next.js xóa cache để mọi User nhận thông báo ngay
    
    return { success: true, data: newNoti };
  } catch (error) {
    console.error("Lỗi tạo thông báo:", error);
    return { success: false, error: "Không thể lưu thông báo vào hệ thống." };
  }
}

// 4. XÓA THÔNG BÁO
export async function deleteNotification(id: string) {
  try {
    await prisma.notification.delete({
      where: { id },
    });
    
    revalidatePath("/admin/notifications");
    revalidatePath('/', 'layout'); 
    return { success: true };
  } catch (error) {
    console.error("Lỗi xóa thông báo:", error);
    return { success: false, error: "Không thể xóa thông báo." };
  }
}