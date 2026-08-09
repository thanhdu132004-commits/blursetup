// app/actions/restock.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function submitRestockRequest(data: { productId: string, name: string, phone: string, email?: string, location?: string }) {
  try {
    await prisma.restockRequest.create({
      data: {
        productId: data.productId,
        name: data.name,
        phone: data.phone,
        email: data.email || "",
        location: data.location || "",
      }
    });
    revalidatePath(`/product/[slug]`);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Lỗi hệ thống khi đăng ký." };
  }
}

export async function getRestockRequestsByProduct(productId: string) {
  try {
    const requests = await prisma.restockRequest.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' }
    });
    return requests;
  } catch (error) {
    return [];
  }
}