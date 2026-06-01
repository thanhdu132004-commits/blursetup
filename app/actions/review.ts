// app/actions/review.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 1. Lấy danh sách đánh giá
export async function getReviewsByProductId(productId: string) {
  try {
    const reviews = await prisma.review.findMany({
      where: { productId },
      include: { user: true }, 
      orderBy: { createdAt: 'desc' }
    });
    return reviews;
  } catch (error) {
    console.error("Lỗi lấy danh sách đánh giá:", error);
    return [];
  }
}

// 2. Gửi đánh giá mới (Đã hỗ trợ lưu Mảng hình ảnh)
export async function submitReview(
  productId: string, 
  userId: string, 
  rating: number, 
  comment: string, 
  images: string[] // Thêm mảng hình ảnh vào tham số
) {
  try {
    // 1. Tạo đánh giá mới (bao gồm cả mảng hình ảnh)
    await prisma.review.create({
      data: { 
        productId, 
        userId, 
        rating, 
        comment,
        images // Lưu mảng hình ảnh vào Database
      }
    });

    // 2. Tính toán lại Rating trung bình và Cập nhật vào Product
    const allReviews = await prisma.review.findMany({ where: { productId } });
    const reviewCount = allReviews.length;
    const totalRating = allReviews.reduce((acc, rev) => acc + rev.rating, 0);
    const averageRating = reviewCount > 0 ? Number((totalRating / reviewCount).toFixed(1)) : 5;

    await prisma.product.update({
      where: { id: productId },
      data: { rating: averageRating, reviewCount }
    });

    // 3. Xóa cache trang để hiển thị đánh giá mới ngay lập tức
    revalidatePath(`/product/[slug]`); 
    return { success: true };
  } catch (error) {
    console.error("Lỗi gửi đánh giá:", error);
    return { success: false, error: "Lỗi hệ thống, vui lòng thử lại sau!" };
  }
}