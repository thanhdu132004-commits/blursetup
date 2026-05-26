import { Button } from "@/components/ui/button";
import { Filter, Monitor, Keyboard, Mouse, Headphones, ArrowDownUp } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function QuickFilterBar() {
  // Mock data cho danh mục nhu cầu (Áp dụng cho BlurSetup)
  const categories = [
    { name: "Lập trình", icon: <Monitor className="h-6 w-6 text-blue-500" /> },
    { name: "Gaming FPS", icon: <Mouse className="h-6 w-6 text-red-500" /> },
    { name: "Minimalist", icon: <Keyboard className="h-6 w-6 text-gray-700" /> },
    { name: "Audio", icon: <Headphones className="h-6 w-6 text-purple-500" /> },
  ];

  return (
    <div className="w-full space-y-8 my-8">
      {/* 1. Khu vực: Chọn theo nhu cầu (Giống ảnh 1) */}
      <div>
        <h3 className="text-lg font-bold mb-4">Chọn setup theo nhu cầu</h3>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat, index) => (
            <div 
              key={index} 
              className="flex flex-col items-center justify-center min-w-[120px] p-4 bg-secondary/30 rounded-2xl border border-transparent hover:border-primary hover:shadow-md cursor-pointer transition-all"
            >
              <div className="mb-2">{cat.icon}</div>
              <span className="text-sm font-medium">{cat.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Khu vực: Thanh Bộ lọc (Giống ảnh 3) */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border p-4 rounded-xl bg-card shadow-sm">
        {/* Nhóm Lọc */}
        <div className="flex flex-wrap gap-2 items-center">
          <Button variant="outline" className="gap-2 font-semibold">
            <Filter className="h-4 w-4" />
            Bộ lọc
          </Button>
          
          <Select>
            <SelectTrigger className="w-[140px] bg-secondary/50">
              <SelectValue placeholder="Thương hiệu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lg">LG</SelectItem>
              <SelectItem value="dell">Dell</SelectItem>
              <SelectItem value="logitech">Logitech</SelectItem>
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger className="w-[140px] bg-secondary/50">
              <SelectValue placeholder="Mức giá" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="under-5">Dưới 5 triệu</SelectItem>
              <SelectItem value="5-to-10">Từ 5 - 10 triệu</SelectItem>
              <SelectItem value="above-10">Trên 10 triệu</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Nhóm Sắp xếp */}
        <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-muted-foreground mr-2 font-medium">Sắp xếp theo:</span>
            <Button variant="secondary" size="sm" className="bg-primary/10 text-primary hover:bg-primary/20">
                ⭐ Phổ biến
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
                <ArrowDownUp className="h-4 w-4" /> Giá Thấp - Cao
            </Button>
        </div>
      </div>
    </div>
  );
}