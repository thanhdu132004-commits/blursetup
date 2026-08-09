// app/api/chat/history/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// API TẢI LỊCH SỬ
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) return NextResponse.json({ success: false, message: "Missing userId" }, { status: 401 });

    const history = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    const formatted = history.map((msg: any) => ({
      role: msg.role,
      text: msg.text,
      widget: msg.widget || undefined,
      widgetData: msg.widgetData || undefined
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Lỗi Server" }, { status: 500 });
  }
}

// API LƯU TIN NHẮN THỦ CÔNG
export async function POST(req: Request) {
  try {
    const { userId, role, text, widget, widgetData } = await req.json();
    if (!userId) return NextResponse.json({ success: false }, { status: 401 });

    await prisma.chatMessage.create({
      data: { userId, role, text, widget, widgetData }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}