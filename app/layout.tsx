// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import ClientLayoutWrapper from "./client-layout-wrapper";
import { FloatingContact } from "@/components/floating-contact"; // 1. IMPORT COMPONENT CHAT

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BlurSetup - Điểm đến lý tưởng cho combo setup & đồ công nghệ",
  description: "Website thương mại điện tử chuyên đồ công nghệ, gear, phụ kiện và combo setup cá nhân.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ClientLayoutWrapper>
            {children}
        </ClientLayoutWrapper>
        
        {/* 2. CHÈN NÚT CHAT VÀO ĐÂY */}
        <FloatingContact />
        
        {/* Toast Notification */}
        <Toaster position="top-right" reverseOrder={false} />
      </body>
    </html>
  );
}