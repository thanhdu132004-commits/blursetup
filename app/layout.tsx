// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import ClientLayoutWrapper from "./client-layout-wrapper";
import { FloatingContact } from "@/components/floating-contact";
import { ThemeProvider } from "@/components/theme-provider";
// ĐÃ THÊM: Import SessionWrapper chuẩn theo đường dẫn thư mục của bạn
import { SessionWrapper } from "@/components/SessionWrapper";

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
        {/* ĐÃ THÊM: Bọc toàn bộ ứng dụng bằng SessionWrapper để cấp quyền sử dụng NextAuth */}
        <SessionWrapper>
          {/* Bọc toàn bộ ứng dụng bằng ThemeProvider */}
          <ThemeProvider 
            attribute="class" 
            defaultTheme="system" 
            enableSystem
          >
            <ClientLayoutWrapper>
              {children}
            </ClientLayoutWrapper>
            
            {/* Nút Chat nổi bây giờ đã nằm an toàn trong vùng phủ sóng của NextAuth */}
            <FloatingContact />
            
            {/* Toast Notification */}
            <Toaster position="top-right" reverseOrder={false} />
          </ThemeProvider>
        </SessionWrapper>
      </body>
    </html>
  );
}