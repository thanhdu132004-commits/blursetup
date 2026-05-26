"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface ProductInput {
  name: string;
  description?: string | null;
  price: number;
  originalPrice?: number | null;
  stock: number;
  category: string;
  brand: string;
  imageUrl: string;
  gallery?: string[];          
  condition: string;
  isNew?: boolean;             
  isFeatured?: boolean;        
  tags?: string[];             
  highlights?: string[];       // Tính năng nổi bật
  specs?: any;                 // Thông số kỹ thuật (Object JSON)
}

const generateSlug = (name: string) => {
  return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
};

export async function getProducts() {
  try {
    const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
    return products.map(p => ({
      ...p,
      price: Number(p.price),
      originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
      stock: Number(p.stock),
      rating: Number(p.rating),
      specs: p.specs || {}, // Trả về object rỗng nếu không có
      highlights: p.highlights || []
    }));
  } catch { return []; }
}

export async function createProduct(data: ProductInput) {
  try {
    const newProduct = await prisma.product.create({
      data: {
        name: data.name,
        slug: generateSlug(data.name),
        description: data.description,
        price: Number(data.price),
        originalPrice: data.originalPrice ? Number(data.originalPrice) : null,
        stock: Number(data.stock),
        category: data.category,
        brand: data.brand,
        imageUrl: data.imageUrl,
        gallery: data.gallery || [],
        condition: data.condition,
        isNew: data.isNew || false,
        isFeatured: data.isFeatured || false,
        tags: data.tags || [],
        highlights: data.highlights || [],
        specs: data.specs || {}, // Lưu JSON
      },
    });
    revalidatePath("/admin/products");
    return { success: true, data: newProduct };
  } catch (error) { return { success: false, error: "Lỗi thêm sản phẩm. Có thể do trùng tên!" }; }
}

export async function updateProduct(id: string, data: ProductInput) {
  try {
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        price: Number(data.price),
        originalPrice: data.originalPrice ? Number(data.originalPrice) : null,
        stock: Number(data.stock),
        category: data.category,
        brand: data.brand,
        imageUrl: data.imageUrl,
        gallery: data.gallery || [],
        condition: data.condition,
        isNew: data.isNew ?? false,
        isFeatured: data.isFeatured ?? false,
        tags: data.tags || [],
        highlights: data.highlights || [],
        specs: data.specs || {},
      },
    });
    revalidatePath("/admin/products");
    return { success: true, data: updatedProduct };
  } catch (error) { return { success: false, error: "Không thể cập nhật." }; }
}

export async function deleteProduct(id: string) {
  try {
    await prisma.product.delete({ where: { id } });
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) { return { success: false, error: "Lỗi khi xóa." }; }
}

export async function getProductBySlug(slug: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: slug },
    });
    return product;
  } catch (error) {
    console.error("Lỗi lấy chi tiết sản phẩm:", error);
    return null;
  }
}