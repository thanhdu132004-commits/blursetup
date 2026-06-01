"use server";

import { prisma } from "@/lib/prisma";

export async function getDashboardStats() {
  try {
    // 1. Tính tổng doanh thu (Chỉ tính các đơn hàng đã thanh toán hoặc hoàn thành, ở đây tạm tính tất cả trừ 'cancelled')
    const orders = await prisma.order.findMany({
      where: { status: { not: "cancelled" } },
      select: { totalAmount: true }
    });
    const totalRevenue = orders.reduce((acc, order) => acc + order.totalAmount, 0);

    // 2. Đếm tổng số lượng
    const totalOrders = await prisma.order.count();
    const totalProducts = await prisma.product.count();
    const totalNews = await prisma.news.count();

    // 3. Lấy 5 bài viết tin tức mới nhất
    const recentNews = await prisma.news.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { title: true, author: true, createdAt: true, slug: true }
    });

    // 4. Lấy 5 sản phẩm bán chạy nhất (dựa vào trường 'sold')
    const topProducts = await prisma.product.findMany({
      orderBy: { sold: 'desc' },
      take: 5,
      select: { name: true, sold: true, price: true }
    });

    return {
      success: true,
      data: {
        revenue: totalRevenue,
        orders: totalOrders,
        products: totalProducts,
        news: totalNews,
        recentNews,
        topProducts
      }
    };
  } catch (error) {
    console.error("Lỗi lấy dữ liệu Dashboard:", error);
    return { success: false, error: "Lỗi hệ thống" };
  }
}