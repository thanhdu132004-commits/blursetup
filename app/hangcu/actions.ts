"use server";

import { prisma } from "@/lib/prisma";

export async function getUsedProducts() {
  try {
    const products = await prisma.product.findMany({
      where: { 
        condition: "Cũ", // Chỉ lấy sản phẩm Cũ
        stock: { gt: 0 } // Chỉ lấy sản phẩm còn hàng
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Format dữ liệu trước khi gửi xuống Client
    return products.map(p => ({
      ...p,
      id: p.id,
      price: Number(p.price),
      originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
      stock: Number(p.stock),
      rating: Number(p.rating || 5)
    }));
  } catch (error) {
    console.error("Lỗi lấy danh sách hàng cũ:", error);
    return [];
  }
}