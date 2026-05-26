"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Lấy danh sách câu hỏi kèm theo câu trả lời
export async function getQuestions() {
  try {
    return await prisma.question.findMany({
      include: {
        user: true, // Lấy thông tin người hỏi
        replies: {
          include: { user: true }, // Lấy thông tin Admin trả lời
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' } // Câu hỏi mới nhất lên đầu
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách hỏi đáp:", error);
    return [];
  }
}

// Người dùng gửi câu hỏi mới
export async function submitQuestion(userId: string, content: string) {
  try {
    if (!content.trim()) return { success: false, error: "Nội dung không được để trống" };
    
    await prisma.question.create({
      data: { userId, content }
    });
    
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Lỗi gửi câu hỏi:", error);
    return { success: false, error: "Không thể gửi câu hỏi lúc này." };
  }
}

// Admin trả lời câu hỏi
export async function adminReplyToQuestion(questionId: string, adminId: string, content: string) {
  try {
    if (!content.trim()) return { success: false, error: "Nội dung trả lời không được để trống" };

    await prisma.reply.create({
      data: { 
        questionId, 
        userId: adminId, 
        content 
      }
    });
    
    revalidatePath("/");
    revalidatePath("/admin"); // Cập nhật lại trang admin
    return { success: true };
  } catch (error) {
    console.error("Lỗi trả lời câu hỏi:", error);
    return { success: false, error: "Không thể gửi câu trả lời lúc này." };
  }
}