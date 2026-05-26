"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export async function getNews() {
  try {
    return await prisma.news.findMany({ orderBy: { createdAt: 'desc' } });
  } catch (error) {
    return [];
  }
}

export async function getNewsBySlug(slug: string) {
  try {
    return await prisma.news.findUnique({ where: { slug } });
  } catch (error) {
    return null;
  }
}

export async function createNews(data: any) {
  try {
    const slug = generateSlug(data.title);
    const newArticle = await prisma.news.create({
      data: { ...data, slug }
    });
    revalidatePath("/admin/news");
    revalidatePath("/tin-tuc");
    return { success: true, data: newArticle };
  } catch (error) {
    console.error("Lỗi tạo bài viết:", error);
    return { success: false, error: "Không thể thêm bài viết." };
  }
}

export async function updateNews(id: string, data: any) {
  try {
    // Tách bỏ id, createdAt, updatedAt ra khỏi data gửi lên để tránh lỗi Prisma
    const { id: _id, createdAt, updatedAt, slug, ...updateData } = data;

    // Cập nhật lại bài viết
    await prisma.news.update({
      where: { id },
      data: updateData
    });
    
    revalidatePath("/admin/news");
    revalidatePath("/tin-tuc");
    revalidatePath(`/tin-tuc/${slug}`);
    
    return { success: true };
  } catch (error) {
    console.error("Lỗi cập nhật bài viết:", error);
    return { success: false, error: "Lỗi cập nhật bài viết." };
  }
}

export async function deleteNews(id: string) {
  try {
    await prisma.news.delete({ where: { id } });
    revalidatePath("/admin/news");
    revalidatePath("/tin-tuc");
    return { success: true };
  } catch (error) {
    console.error("Lỗi xóa bài viết:", error);
    return { success: false, error: "Lỗi xóa bài viết." };
  }
}