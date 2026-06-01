"use server";

import { PrismaClient } from "@prisma/client";

// Khởi tạo Prisma Client
const prisma = new PrismaClient();

// 1. Hàm lấy dữ liệu Cài đặt
export async function getSettings() {
  try {
    let settings = await prisma.setting.findFirst({
      where: { isGlobal: true }
    });

    // Nếu chưa có (lần đầu vào trang), tự động tạo 1 bản ghi mặc định
    if (!settings) {
      settings = await prisma.setting.create({
        data: { 
          isGlobal: true,
          defaultFee: 30000,
          freeshipThreshold: 1000000,
          vouchers: []
        }
      });
    }
    
    return { success: true, data: settings };
  } catch (error: any) {
    console.error("Lỗi getSettings:", error);
    return { success: false, message: error.message };
  }
}

// 2. Hàm cập nhật dữ liệu Cài đặt
export async function updateSettings(data: any) {
  try {
    const settings = await prisma.setting.upsert({
      where: { isGlobal: true },
      update: data,
      create: { isGlobal: true, ...data }
    });
    
    return { success: true, data: settings };
  } catch (error: any) {
    console.error("Lỗi updateSettings:", error);
    return { success: false, message: error.message };
  }
}