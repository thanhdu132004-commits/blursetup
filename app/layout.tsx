// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import ClientLayoutWrapper from "./client-layout-wrapper";
import { FloatingContact } from "@/components/floating-contact";
import { ThemeProvider } from "@/components/theme-provider"; // Đã import ThemeProvider

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BlurSetup - Điểm đến lý tưởng cho combo setup & đồ công nghệ",
  description: "Website thương mại điện tử chuyên đồ công nghệ, gear, phụ kiện và combo setup cá nhân.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning cần thiết khi sử dụng next-themes để tránh cảnh báo console
    <html lang="vi" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {/* Bọc toàn bộ ứng dụng bằng ThemeProvider */}
        <ThemeProvider 
          attribute="class" 
          defaultTheme="system" 
          enableSystem
        >
          <ClientLayoutWrapper>
            {children}
          </ClientLayoutWrapper>
          
          {/* Nút Chat nổi */}
          <FloatingContact />
          
          {/* Toast Notification */}
          <Toaster position="top-right" reverseOrder={false} />
        </ThemeProvider>
      </body>
    </html>
  );
}