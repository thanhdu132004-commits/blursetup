// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // 1. Nếu là Admin, ép họ vào trang quản trị (trừ khi họ đang ở trong đó)
    if (path === "/" && token?.role === "admin") {
      return NextResponse.redirect(new URL("/admin/products", req.url));
    }

    // 2. Bảo mật: Nếu không phải Admin mà cố vào trang admin, đá về trang chủ
    if (path.startsWith("/admin") && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // Yêu cầu phải đăng nhập
    },
  }
);

// Chỉ áp dụng cho trang chủ và các trang admin
export const config = { matcher: ["/", "/admin/:path*"] };