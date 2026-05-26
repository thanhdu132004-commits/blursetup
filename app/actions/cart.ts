"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 1. LẤY GIỎ HÀNG VÀ TỔNG SỐ LƯỢNG
export async function getCart(userId: string) {
  try {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: { items: { include: { product: true } } }
      });
    }
    return { success: true, data: cart };
  } catch (error) {
    return { success: false, error: "Không thể tải giỏ hàng" };
  }
}

export async function getCartCount(userId: string | undefined) {
  if (!userId) return 0;
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: { select: { quantity: true } } },
    });
    if (!cart) return 0;
    return cart.items.reduce((acc, item) => acc + item.quantity, 0);
  } catch (error) { return 0; }
}

// 2. THÊM VÀO GIỎ HÀNG
export async function addToCart(userId: string, productId: string, quantity: number = 1) {
  if (!userId) return { success: false, error: "Vui lòng đăng nhập" };

  try {
    const cart = await prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId },
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: { increment: quantity } },
      });
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity },
      });
    }

    revalidatePath("/cart");
    revalidatePath("/"); 
    return { success: true };
  } catch (error) {
    console.error("Lỗi thêm vào giỏ:", error);
    return { success: false, error: "Lỗi hệ thống" };
  }
}

// 3. CẬP NHẬT SỐ LƯỢNG
export async function updateCartItemQuantity(cartItemId: string, newQuantity: number) {
  try {
    if (newQuantity <= 0) {
      await prisma.cartItem.delete({ where: { id: cartItemId } });
    } else {
      await prisma.cartItem.update({
        where: { id: cartItemId },
        data: { quantity: newQuantity }
      });
    }
    revalidatePath("/cart");
    return { success: true };
  } catch (error) { return { success: false, error: "Lỗi cập nhật" }; }
}

// 4. XÓA SẢN PHẨM KHỎI GIỎ
export async function removeCartItem(cartItemId: string) {
  try {
    await prisma.cartItem.delete({ where: { id: cartItemId } });
    revalidatePath("/cart");
    return { success: true };
  } catch (error) { return { success: false, error: "Lỗi xóa sản phẩm" }; }
}