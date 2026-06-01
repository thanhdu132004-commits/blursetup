"use server";

import { prisma } from "@/lib/prisma";

// Hàm Lấy danh sách ID yêu thích của User (Bạn đã có)
export async function getUserWishlist(userId: string) {
  if (!userId) return [];
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { wishlist: true }
    });
    return user?.wishlist || [];
  } catch (error) {
    console.error("Lỗi tải wishlist:", error);
    return [];
  }
}

// Hàm Bật/Tắt (Toggle) Yêu thích (Bạn đã có)
export async function toggleWishlist(userId: string, productId: string) {
  if (!userId) return { success: false, message: "Vui lòng đăng nhập!" };

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, message: "Không tìm thấy User" };

    let currentWishlist = user.wishlist || [];
    let isLiked = false;

    if (currentWishlist.includes(productId)) {
      currentWishlist = currentWishlist.filter(id => id !== productId);
      isLiked = false;
    } else {
      currentWishlist.push(productId);
      isLiked = true;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { wishlist: currentWishlist }
    });

    return { success: true, isLiked, wishlist: currentWishlist };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// ==========================================
// THÊM HÀM MỚI NÀY VÀO DƯỚI CÙNG
// Hàm lấy chi tiết toàn bộ sản phẩm trong Wishlist
// ==========================================
export async function getWishlistProducts(userId: string) {
  if (!userId) return { success: false, products: [] };
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { wishlist: true }
    });

    if (!user || !user.wishlist || user.wishlist.length === 0) {
      return { success: true, products: [] };
    }

    // Truy vấn lấy danh sách sản phẩm dựa vào mảng ID
    const products = await prisma.product.findMany({
      where: {
        id: { in: user.wishlist }
      }
    });

    return { success: true, products };
  } catch (error) {
    console.error("Lỗi lấy chi tiết sản phẩm wishlist:", error);
    return { success: false, products: [] };
  }
}