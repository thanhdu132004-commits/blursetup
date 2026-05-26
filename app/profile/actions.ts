"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Lấy thông tin user hiện tại
export async function getUserProfile(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, phone: true,
        address: true, city: true, district: true, ward: true,
        avatar: true, createdAt: true, role: true
      }
    });
    return user;
  } catch (error) {
    console.error("Lỗi lấy thông tin user:", error);
    return null;
  }
}

// Cập nhật thông tin user
export async function updateUserProfile(userId: string, data: any) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        phone: data.phone,
        address: data.address,
        city: data.city,
        district: data.district,
        ward: data.ward,
        avatar: data.avatar,
      }
    });
    revalidatePath("/profile");
    return { success: true, message: "Cập nhật hồ sơ thành công!" };
  } catch (error) {
    console.error("Lỗi cập nhật user:", error);
    return { success: false, error: "Không thể cập nhật thông tin." };
  }
}