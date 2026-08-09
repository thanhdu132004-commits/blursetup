import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderCode } = body;

    if (!orderCode) {
      return NextResponse.json(
        { success: false, message: "Vui lòng nhập mã đơn hàng." },
        { status: 400 }
      );
    }

    // Làm sạch chuỗi người dùng nhập (xóa khoảng trắng, chuyển thành chữ thường)
    const cleanCode = orderCode.trim().toLowerCase();

    // 1. Lấy danh sách các đơn hàng (Giới hạn 1000 đơn gần nhất để tối ưu hiệu suất)
    // Bao gồm cả thông tin sản phẩm bên trong OrderItem
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 1000,
      include: {
        items: {
          include: {
            product: {
              select: { name: true }
            }
          }
        }
      }
    });

    // 2. TÌM KIẾM THEO ĐUÔI ID: Tìm đơn hàng có ID kết thúc bằng chuỗi khách hàng nhập
    const order = orders.find(o => o.id.toLowerCase().endsWith(cleanCode));

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Mã đơn hàng không hợp lệ hoặc không tồn tại." },
        { status: 404 }
      );
    }

    // 3. Xử lý logic hiển thị
    const firstProductName = order.items[0]?.product?.name || "Sản phẩm đã bị xóa";
    const moreItemsCount = order.items.length > 1 ? ` và ${order.items.length - 1} sp khác` : "";

    // Format ngày giờ Việt Nam
    const orderDate = new Date(order.createdAt).toLocaleDateString("vi-VN");
    
    // Giả lập ngày dự kiến giao (cộng thêm 3 ngày từ lúc đặt)
    const estimateDate = new Date(order.createdAt);
    estimateDate.setDate(estimateDate.getDate() + 3);

    // Chuẩn bị dữ liệu trả về cho Chatbot
    const formattedData = {
      code: order.id.substring(order.id.length - 8).toUpperCase(), // Hiển thị 8 số cuối
      status: mapStatus(order.status),
      date: orderDate,
      estimate: estimateDate.toLocaleDateString("vi-VN"),
      product: firstProductName + moreItemsCount
    };

    return NextResponse.json({ success: true, data: formattedData });

  } catch (error) {
    console.error("Lỗi API check order:", error);
    return NextResponse.json(
      { success: false, message: "Hệ thống đang bận, vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}

// Hàm phụ trợ: Chuyển đổi status tiếng Anh sang tiếng Việt (Cập nhật)
function mapStatus(status: string) {
  if (!status) return "Không xác định";
  
  const s = status.toLowerCase().trim();
  
  // Xử lý các từ khóa tiếng Anh phổ biến
  if (s === "pending" || s === "chờ xác nhận") return "Chờ xác nhận";
  if (s === "processing" || s === "đang xử lý") return "Đang xử lý";
  if (s === "shipping" || s === "đang giao" || s === "đang giao hàng") return "Đang giao hàng";
  if (s === "completed" || s === "delivered" || s === "đã giao" || s === "đã giao hàng") return "Đã giao hàng";
  if (s === "cancelled" || s === "canceled" || s === "đã hủy") return "Đã hủy";
  
  // Nếu không khớp từ nào ở trên, hệ thống sẽ trả về chính chuỗi đang lưu trong Database (In hoa)
  // Thay vì trả về "Không xác định"
  return status.toUpperCase(); 
}