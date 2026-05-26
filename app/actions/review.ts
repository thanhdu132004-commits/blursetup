// app/actions/review.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getReviewsByProductId(productId: string) {
  try {
    const reviews = await prisma.review.findMany({
      where: { productId },
      include: { user: true }, // Lấy luôn thông tin người đánh giá (Tên, Avatar...)
      orderBy: { createdAt: 'desc' } // Mới nhất lên đầu
    });
    return reviews;
  } catch (error) {
    console.error("Lỗi lấy danh sách đánh giá:", error);
    return [];
  }
}

export async function submitReview(productId: string, userId: string, rating: number, comment: string) {
  try {
    // 1. Tạo đánh giá mới
    await prisma.review.create({
      data: { productId, userId, rating, comment }
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
    revalidatePath(`/`); 
    return { success: true };
  } catch (error) {
    console.error("Lỗi gửi đánh giá:", error);
    return { success: false, error: "Lỗi hệ thống, vui lòng thử lại sau!" };
  }
}