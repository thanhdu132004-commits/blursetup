"use server";

import { prisma } from "@/lib/prisma";

export async function getAnalyticsData() {
  try {
    // 1. Kéo toàn bộ dữ liệu cần thiết từ Database
    const products = await prisma.product.findMany();
    const usersCount = await prisma.user.count();
    
    // Lấy tất cả đơn hàng để phân tích (bao gồm cả đơn đã hủy để vẽ biểu đồ tròn)
    const allOrders = await prisma.order.findMany({
      orderBy: { createdAt: 'asc' } // Sắp xếp cũ nhất -> mới nhất
    });

    // Chỉ lấy những đơn hàng KHÔNG BỊ HỦY để tính doanh thu
    const validOrders = allOrders.filter(o => o.status !== "cancelled");

    // 2. TÍNH TOÁN CÁC CHỈ SỐ TỔNG QUAN (KPIs)
    const totalProducts = products.length;
    const totalInventoryValue = products.reduce((acc, p) => acc + (p.price * p.stock), 0);
    const totalOrders = validOrders.length;
    const totalRevenue = validOrders.reduce((acc, o) => acc + o.totalAmount, 0);

    // 3. DATA BIỂU ĐỒ 1: TĂNG TRƯỞNG DOANH THU & ĐƠN HÀNG (THEO THÁNG)
    const monthlyDataMap: Record<string, { doanh_thu: number, don_hang: number }> = {};
    
    validOrders.forEach(o => {
      const date = new Date(o.createdAt);
      const monthStr = `Tháng ${date.getMonth() + 1}`; // VD: "Tháng 5"
      
      if (!monthlyDataMap[monthStr]) {
        monthlyDataMap[monthStr] = { doanh_thu: 0, don_hang: 0 };
      }
      monthlyDataMap[monthStr].doanh_thu += o.totalAmount;
      monthlyDataMap[monthStr].don_hang += 1;
    });

    // Chuyển Object thành Array và sắp xếp theo tháng
    const revenueChartData = Object.keys(monthlyDataMap)
      .sort((a, b) => parseInt(a.replace("Tháng ", "")) - parseInt(b.replace("Tháng ", "")))
      .map(key => ({
        name: key,
        doanh_thu: monthlyDataMap[key].doanh_thu,
        don_hang: monthlyDataMap[key].don_hang
      }));

    // 4. DATA BIỂU ĐỒ 2: TỶ TRỌNG SẢN PHẨM (THEO DANH MỤC)
    const categoryCountMap: Record<string, number> = {};
    products.forEach((p) => {
      const cat = p.category || "Khác";
      categoryCountMap[cat] = (categoryCountMap[cat] || 0) + 1;
    });
    const productChartData = Object.keys(categoryCountMap).map((key) => ({
      name: key,
      so_luong: categoryCountMap[key],
    }));

    // 5. DATA BIỂU ĐỒ 3: TRẠNG THÁI ĐƠN HÀNG (PIE CHART)
    const statusMap: Record<string, number> = { "pending": 0, "processing": 0, "shipped": 0, "completed": 0, "cancelled": 0 };
    allOrders.forEach(o => { if (statusMap[o.status] !== undefined) statusMap[o.status]++; });
    
    const statusChartData = [
      { name: "Chờ xử lý", value: statusMap["pending"] + statusMap["processing"], color: "#3b82f6" }, // Blue
      { name: "Đang giao", value: statusMap["shipped"], color: "#f59e0b" }, // Amber
      { name: "Thành công", value: statusMap["completed"], color: "#10b981" }, // Green
      { name: "Đã hủy", value: statusMap["cancelled"], color: "#ef4444" }, // Red
    ].filter(item => item.value > 0); // Chỉ lấy những trạng thái có dữ liệu

    return {
      success: true,
      stats: { totalProducts, totalInventoryValue, usersCount, totalOrders, totalRevenue },
      revenueChartData,
      productChartData,
      statusChartData
    };

  } catch (error) {
    console.error("Lỗi lấy dữ liệu thống kê:", error);
    return { success: false, stats: null, revenueChartData: [], productChartData: [], statusChartData: [] };
  }
}