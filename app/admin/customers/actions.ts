"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs"; // Dùng để mã hóa mật khẩu mới

// 1. LẤY DANH SÁCH KHÁCH HÀNG
export async function getCustomers() {
  try {
    const users = await prisma.user.findMany({
      where: { role: "user" },
      orderBy: { createdAt: 'desc' }
    });
    
    return users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || "Chưa cập nhật",
      address: user.address || "",
      city: user.city || "",
      district: user.district || "",
      ward: user.ward || "",
      joined: new Date(user.createdAt).toLocaleDateString("vi-VN"), 
      isActive: user.isActive,
      status: user.isActive ? "Hoạt động" : "Bị khóa"
    }));
  } catch (error) {
    console.error("Lỗi lấy danh sách khách hàng:", error);
    return [];
  }
}

// 2. KHÓA / MỞ KHÓA TÀI KHOẢN
export async function toggleCustomerStatus(id: string, currentStatus: boolean) {
  try {
    await prisma.user.update({
      where: { id },
      data: { isActive: !currentStatus } // Đảo ngược trạng thái hiện tại
    });
    revalidatePath("/admin/customers");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Không thể cập nhật trạng thái!" };
  }
}

// 3. CẬP NHẬT THÔNG TIN CÁ NHÂN
export async function updateCustomerProfile(id: string, data: any) {
  try {
    await prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        address: data.address,
        city: data.city,
        district: data.district,
        ward: data.ward,
      }
    });
    revalidatePath("/admin/customers");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Không thể cập nhật thông tin!" };
  }
}

// 4. ĐẶT LẠI MẬT KHẨU
export async function resetCustomerPassword(id: string, newPassword: string) {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Lỗi khi đổi mật khẩu!" };
  }
}

// 5. XÓA TÀI KHOẢN VĨNH VIỄN
export async function deleteCustomer(id: string) {
  try {
    // Đảm bảo an toàn: Chắc chắn tài khoản này là "user" mới cho xóa
    const user = await prisma.user.findUnique({ where: { id } });
    if (user?.role === "admin") {
      return { success: false, error: "Không thể xóa tài khoản Admin!" };
    }

    await prisma.user.delete({ where: { id } });
    revalidatePath("/admin/customers");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Không thể xóa. Có thể khách hàng này đang có đơn hàng!" };
  }
}