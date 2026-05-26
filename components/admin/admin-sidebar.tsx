// components/admin/admin-sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingBag, Users, Settings, LogOut, Package, TrendingUp } from "lucide-react";

export function AdminSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { href: "/admin", label: "Tổng quan", icon: <LayoutDashboard className="w-5 h-5" /> },
    { href: "/admin/orders", label: "Đơn hàng", icon: <ShoppingBag className="w-5 h-5" /> },
    { href: "/admin/products", label: "Sản phẩm", icon: <Package className="w-5 h-5" /> },
    { href: "/admin/customers", label: "Khách hàng", icon: <Users className="w-5 h-5" /> },
    { href: "/admin/analytics", label: "Thống kê", icon: <TrendingUp className="w-5 h-5" /> },
    { href: "/admin/settings", label: "Cài đặt", icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex z-20 shadow-sm">
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="font-black text-xl tracking-tighter uppercase italic text-red-600">BlurSetup</span>
          <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Admin</span>
        </Link>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-1.5">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">Quản lý hệ thống</div>
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              pathname === item.href 
                ? "bg-red-50 text-red-600" 
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            {item.icon} {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
          <LogOut className="w-5 h-5" /> Đăng xuất
        </button>
      </div>
    </aside>
  );
}