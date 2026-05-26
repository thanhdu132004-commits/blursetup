"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Định nghĩa kiểu dữ liệu đầu vào để bảo mật và rõ ràng hơn
export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
  city?: string;
  district?: string;
  ward?: string;
}

export async function registerUser(data: RegisterInput) {
  try {
    // 1. Kiểm tra email đã tồn tại chưa
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      return { success: false, error: "Email này đã được sử dụng!" };
    }

    // 2. Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 3. Lưu vào database
    // Với Schema mới, chúng ta đưa thêm các trường địa chỉ vào
    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        password: hashedPassword,
        
        // Thông tin địa chỉ (nếu có)
        address: data.address || null,
        city: data.city || null,
        district: data.district || null,
        ward: data.ward || null,

        // CHUẨN MÔI TRƯỜNG THỰC TẾ: 
        // - Role luôn là "user"
        // - Tài khoản mặc định Active
        role: "user",
        isActive: true, 
      }
    });

    return { success: true, message: "Đăng ký thành công!" };
  } catch (error) {
    console.error("Lỗi đăng ký:", error);
    return { success: false, error: "Có lỗi xảy ra khi tạo tài khoản." };
  }
}