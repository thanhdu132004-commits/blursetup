import Link from "next/link";
import { 
  Monitor, 
  Keyboard, 
  Mouse, 
  Headphones, 
  Armchair, 
  Zap,
  Gamepad2,
  Code,
  Briefcase,
  Coffee
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function HeroSection() {
  // 1. Dữ liệu cho Menu ngang (Sub-categories)
  const menuItems = [
    { name: "Màn hình", icon: <Monitor className="w-5 h-5 text-red-500" /> },
    { name: "Bàn phím cơ", icon: <Keyboard className="w-5 h-5 text-blue-500" /> },
    { name: "Chuột & Lót chuột", icon: <Mouse className="w-5 h-5 text-orange-500" /> },
    { name: "Âm thanh", icon: <Headphones className="w-5 h-5 text-purple-500" /> },
    { name: "Bàn ghế công thái học", icon: <Armchair className="w-5 h-5 text-green-500" /> },
    { name: "Phụ kiện Setup", icon: <Zap className="w-5 h-5 text-yellow-500" /> },
  ];

  // 2. Dữ liệu cho phần "Chọn theo nhu cầu"
  const needs = [
    { name: "Góc Gaming", desc: "Hiệu năng cao", icon: <Gamepad2 className="w-8 h-8 text-red-500" /> },
    { name: "Góc Lập trình", desc: "Đa màn hình", icon: <Code className="w-8 h-8 text-blue-500" /> },
    { name: "Làm việc tại nhà", desc: "Công thái học", icon: <Briefcase className="w-8 h-8 text-teal-500" /> },
    { name: "Minimalist", desc: "Tối giản, không dây", icon: <Coffee className="w-8 h-8 text-stone-600" /> },
  ];

  return (
    <section className="container py-4 space-y-4">
      
      {/* KHỐI 1: MENU NGANG (Sub-categories) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-between overflow-x-auto scrollbar-hide p-2">
        {menuItems.map((item, index) => (
          <Link 
            key={index} 
            href="#" 
            className="flex flex-col md:flex-row items-center gap-2 px-4 py-2 hover:bg-gray-50 rounded-lg min-w-max transition-colors text-gray-700 hover:text-primary"
          >
            {item.icon}
            <span className="text-sm font-semibold">{item.name}</span>
          </Link>
        ))}
      </div>

      {/* KHỐI 2: BANNER GRID */}
      {/* Sử dụng CSS Grid: Màn hình lớn chia 3 cột, màn hình nhỏ 1 cột */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-auto lg:h-[300px]">
        
        {/* Main Banner (Chiếm 2 cột) */}
        <Link href="#" className="lg:col-span-2 relative rounded-xl overflow-hidden group">
          <img 
            src="https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=1200&auto=format&fit=crop" 
            alt="Main Banner BlurSetup" 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
            <h2 className="text-white text-2xl font-bold mb-2">Build Setup Mơ Ước</h2>
            <p className="text-white/80">Giảm thêm 10% khi mua combo Màn hình + Bàn phím</p>
          </div>
        </Link>

        {/* Side Banners (2 banner nhỏ xếp dọc chiếm 1 cột) */}
        <div className="flex flex-col gap-4 h-[300px]">
          <Link href="#" className="flex-1 relative rounded-xl overflow-hidden group">
            <img 
              src="https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=600&auto=format&fit=crop" 
              alt="Promo 1" 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
             <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
          </Link>
          <Link href="#" className="flex-1 relative rounded-xl overflow-hidden group">
            <img 
              src="https://images.unsplash.com/photo-1615663245857-ac1eeb536fa0?q=80&w=600&auto=format&fit=crop" 
              alt="Promo 2" 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
          </Link>
        </div>
      </div>

      {/* KHỐI 3: CHỌN THEO NHU CẦU */}
      <div className="pt-4">
        <h3 className="text-xl font-bold mb-4 uppercase tracking-tight text-gray-800">
          Khám Phá Theo Không Gian
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {needs.map((item, index) => (
            <Card key={index} className="group cursor-pointer hover:border-primary hover:shadow-md transition-all">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-3">
                <div className="p-3 bg-gray-50 rounded-full group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">{item.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

    </section>
  );
}