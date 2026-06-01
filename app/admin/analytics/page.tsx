"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from "recharts";
import { Users, Package, DollarSign, Database, ShoppingCart, TrendingUp, Activity } from "lucide-react";
import { getAnalyticsData } from "./actions";

// Format tiền tệ chuẩn VNĐ
const formatCurrency = (value: number) => new Intl.NumberFormat("vi-VN").format(value) + " ₫";
// Format số lớn (Rút gọn hàng triệu) cho cột Y-Axis
const formatCompactYAxis = (value: number) => value >= 1000000 ? (value / 1000000) + "Tr" : value;

function AnalyticsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({ totalProducts: 0, totalInventoryValue: 0, usersCount: 0, totalOrders: 0, totalRevenue: 0 });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [productData, setProductData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);

  useEffect(() => {
    setIsMounted(true);
    async function loadData() {
      const result = await getAnalyticsData();
      if (result.success && result.stats) {
        setStats(result.stats);
        setRevenueData(result.revenueChartData);
        setProductData(result.productChartData);
        setStatusData(result.statusChartData);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (!isMounted) return null;

  return (
    <div className="p-6 md:p-8 bg-gray-50 dark:bg-[#09090b] min-h-screen space-y-8 transition-colors duration-300">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Báo cáo & Phân tích</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Cập nhật trực tiếp (Real-time) từ hệ thống Database</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Activity className="w-10 h-10 animate-spin mb-4 text-red-500" />
          <p className="font-bold text-sm">Đang đồng bộ dữ liệu hệ thống...</p>
        </div>
      ) : (
        <>
          {/* ROW 1: TỔNG QUAN CHỈ SỐ (KPI CARDS) */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-[#18181b] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl text-green-600 dark:text-green-400"><DollarSign className="w-6 h-6" /></div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">Tổng Doanh Thu</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{formatCurrency(stats.totalRevenue)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#18181b] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400"><ShoppingCart className="w-6 h-6" /></div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">Đơn hàng thành công</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{stats.totalOrders} <span className="text-sm font-bold text-gray-500 dark:text-gray-400">đơn</span></p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#18181b] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl text-orange-600 dark:text-orange-400"><Package className="w-6 h-6" /></div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">Mặt hàng trong kho</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{stats.totalProducts} <span className="text-sm font-bold text-gray-500 dark:text-gray-400">sản phẩm</span></p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#18181b] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400"><Users className="w-6 h-6" /></div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">Tài khoản User</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{stats.usersCount} <span className="text-sm font-bold text-gray-500 dark:text-gray-400">người</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* ROW 2: BIỂU ĐỒ DIỄN BIẾN DOANH THU & ĐƠN HÀNG */}
          <div className="bg-white dark:bg-[#18181b] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm w-full">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-red-600 dark:text-red-500" />
                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Tăng trưởng Doanh thu & Lượng đơn hàng</h2>
              </div>
            </div>
            
            {revenueData.length > 0 ? (
              <div className="w-full h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorDoanhThu" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d70018" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#d70018" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorDonHang" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-800" />
                    <XAxis dataKey="name" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
                    <YAxis yAxisId="left" fontSize={11} tickFormatter={formatCompactYAxis} axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
                    <YAxis yAxisId="right" orientation="right" fontSize={11} axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
                    
                    <RechartsTooltip 
                      formatter={(value: any, name: string) => [
                        name === "doanh_thu" ? formatCurrency(value) : value + " đơn", 
                        name === "doanh_thu" ? "Doanh thu" : "Số đơn hàng"
                      ]}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#fff' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '10px' }} />
                    
                    <Area yAxisId="left" type="monotone" dataKey="doanh_thu" name="doanh_thu" stroke="#d70018" strokeWidth={3} fillOpacity={1} fill="url(#colorDoanhThu)" />
                    <Area yAxisId="right" type="monotone" dataKey="don_hang" name="don_hang" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorDonHang)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-sm text-gray-400 italic text-center py-20 bg-gray-50 dark:bg-[#09090b] rounded-xl">Hệ thống chưa ghi nhận đơn hàng nào.</div>
            )}
          </div>

          {/* ROW 3: BIỂU ĐỒ PHỤ (BAR CHART & PIE CHART) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Phân bổ sản phẩm (Bar Chart) */}
            <div className="bg-white dark:bg-[#18181b] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Database className="w-5 h-5 text-gray-500" />
                <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase">Sản phẩm theo Danh mục</h2>
              </div>
              {productData.length > 0 ? (
                <div className="w-full h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-800" />
                      <XAxis dataKey="name" fontSize={11} tickMargin={10} axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
                      <YAxis fontSize={11} allowDecimals={false} axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
                      <RechartsTooltip cursor={{fill: '#f3f4f6', opacity: 0.5}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="so_luong" name="Số lượng (cái)" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-xs text-gray-400 text-center py-10">Kho hàng trống.</div>
              )}
            </div>

            {/* Tỷ lệ trạng thái đơn hàng (Pie Chart) */}
            <div className="bg-white dark:bg-[#18181b] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-gray-500" />
                <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase">Tỷ lệ Trạng thái Đơn hàng</h2>
              </div>
              {statusData.length > 0 ? (
                <div className="w-full flex-1 min-h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value: number) => [value + " đơn hàng", "Số lượng"]}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-xs text-gray-400 text-center py-20 flex-1">Chưa có giao dịch nào được ghi nhận.</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default dynamic(() => Promise.resolve(AnalyticsPage), { ssr: false });