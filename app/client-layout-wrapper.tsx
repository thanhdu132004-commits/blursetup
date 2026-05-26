// app/client-layout-wrapper.tsx
"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { SessionProvider } from "next-auth/react"; // 1. Import này

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHiddenPage = pathname?.startsWith("/auth") || pathname?.startsWith("/admin");

  return (
    // 2. Bọc toàn bộ nội dung vào SessionProvider
    <SessionProvider>
      {!isHiddenPage && <Navbar />}
      {children}
      {!isHiddenPage && <Footer />}
    </SessionProvider>
  );
}