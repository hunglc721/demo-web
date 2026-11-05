import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Package,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { formatCurrencyVND } from '@/utils/formatters';
import { orderService } from '@/services/api/orderService';
import { productService } from '@/services/api/productService';
import { customerService } from '@/services/api/customerService';
import { Order, Product, OrderStatus } from '@/types';
import { Badge } from '@/core/components/Badge';
import { Skeleton } from '@/core/components/Feedback';

export const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [customerStats, setCustomerStats] = useState({
    totalCustomers: 0,
    vipCustomers: 0,
    newCustomers: 0,
    totalRevenue: 0,
  });
  const [chartTimeframe, setChartTimeframe] = useState<'7d' | '30d' | '1y'>('7d');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [ordersRes, lowStockRes, statsRes] = await Promise.all([
          orderService.getOrders({ limit: 50, sortBy: 'createdAt', sortOrder: 'desc' }),
          productService.getLowStockProducts(5),
          customerService.getCustomerStats(),
        ]);

        if (isMounted) {
          setOrders(ordersRes.data);
          setLowStockProducts(lowStockRes.slice(0, 5));
          setCustomerStats(statsRes);
        }
      } catch (err) {
        console.error('Lỗi tải dữ liệu dashboard:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  // Compute Metrics
  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const totalOrdersCount = orders.length;
  const aov = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;

  // Recent 5 orders
  const recentOrders = orders.slice(0, 5);

  // Status Badge Map
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Hoàn thành</Badge>;
      case 'shipping':
        return <Badge variant="primary">Đang giao</Badge>;
      case 'processing':
      case 'confirmed':
        return <Badge variant="warning">Đang xử lý</Badge>;
      case 'cancelled':
        return <Badge variant="danger">Đã hủy</Badge>;
      default:
        return <Badge variant="neutral">Chờ xác nhận</Badge>;
    }
  };

  // Chart Data Generator based on timeframe
  const chartPoints =
    chartTimeframe === '7d'
      ? [
          { label: 'T2', val: 3200000, orders: 8 },
          { label: 'T3', val: 4500000, orders: 12 },
          { label: 'T4', val: 3800000, orders: 9 },
          { label: 'T5', val: 6200000, orders: 16 },
          { label: 'T6', val: 8900000, orders: 22 },
          { label: 'T7', val: 12400000, orders: 31 },
          { label: 'CN', val: 9500000, orders: 25 },
        ]
      : chartTimeframe === '30d'
      ? [
          { label: 'Tuần 1', val: 24500000, orders: 62 },
          { label: 'Tuần 2', val: 31200000, orders: 78 },
          { label: 'Tuần 3', val: 28900000, orders: 70 },
          { label: 'Tuần 4', val: 42600000, orders: 104 },
        ]
      : [
          { label: 'Q1', val: 115000000, orders: 280 },
          { label: 'Q2', val: 142000000, orders: 345 },
          { label: 'Q3', val: 168000000, orders: 410 },
          { label: 'Q4', val: 220000000, orders: 540 },
        ];

  const maxVal = Math.max(...chartPoints.map((p) => p.val));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-content-main tracking-tight">
            Tổng Quan Kinh Doanh
          </h1>
          <p className="text-sm text-content-muted mt-0.5">
            Báo cáo thời gian thực về doanh số, đơn hàng và kho vận D2C Store.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-theme border border-border-base bg-surface-card hover:bg-surface-subtle text-xs font-semibold text-content-main shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-primary' : ''}`} />
            <span>Làm mới</span>
          </button>
          <Link
            to="/admin/products/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-theme bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-sm transition-all"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Thêm sản phẩm</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-5 rounded-theme bg-surface-card border border-border-base space-y-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-36" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))
        ) : (
          <>
            {/* Metric 1: Doanh thu */}
            <div className="p-5 rounded-theme bg-surface-card border border-border-base shadow-sm space-y-2 hover:border-primary/40 transition-all">
              <div className="flex items-center justify-between text-content-muted">
                <span className="text-xs font-bold uppercase tracking-wider text-content-muted">
                  Doanh thu thực nhận
                </span>
                <div className="p-2 rounded-theme bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-content-main tracking-tight">
                {formatCurrencyVND(totalRevenue)}
              </div>
              <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+24.8% so với cùng kỳ</span>
              </div>
            </div>

            {/* Metric 2: Tổng đơn hàng */}
            <div className="p-5 rounded-theme bg-surface-card border border-border-base shadow-sm space-y-2 hover:border-primary/40 transition-all">
              <div className="flex items-center justify-between text-content-muted">
                <span className="text-xs font-bold uppercase tracking-wider text-content-muted">
                  Tổng số đơn hàng
                </span>
                <div className="p-2 rounded-theme bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <ShoppingCart className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-content-main tracking-tight">
                {totalOrdersCount} <span className="text-xs font-normal text-content-muted">đơn</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+12.5% tỷ lệ chuyển đổi</span>
              </div>
            </div>

            {/* Metric 3: AOV */}
            <div className="p-5 rounded-theme bg-surface-card border border-border-base shadow-sm space-y-2 hover:border-primary/40 transition-all">
              <div className="flex items-center justify-between text-content-muted">
                <span className="text-xs font-bold uppercase tracking-wider text-content-muted">
                  Giá trị TB / đơn (AOV)
                </span>
                <div className="p-2 rounded-theme bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-content-main tracking-tight">
                {formatCurrencyVND(aov)}
              </div>
              <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Tối ưu combo & freeship</span>
              </div>
            </div>

            {/* Metric 4: Khách hàng */}
            <div className="p-5 rounded-theme bg-surface-card border border-border-base shadow-sm space-y-2 hover:border-primary/40 transition-all">
              <div className="flex items-center justify-between text-content-muted">
                <span className="text-xs font-bold uppercase tracking-wider text-content-muted">
                  Tổng số khách hàng
                </span>
                <div className="p-2 rounded-theme bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-content-main tracking-tight">
                {customerStats.totalCustomers ?? 0}{' '}
                <span className="text-xs font-normal text-content-muted">khách</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>
                  {customerStats.vipCustomers ?? 0} khách VIP thân thiết
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Charts & Low-Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Revenue Chart */}
        <div className="lg:col-span-2 p-6 rounded-theme bg-surface-card border border-border-base shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-content-main">
                Xu Hướng Doanh Thu & Số Lượng Đơn
              </h2>
              <p className="text-xs text-content-muted mt-0.5">
                Biểu đồ thống kê tăng trưởng doanh số theo chu kỳ
              </p>
            </div>
            {/* Timeframe switch */}
            <div className="flex items-center p-1 rounded-theme bg-surface-subtle border border-border-base text-xs font-semibold self-start sm:self-auto">
              {(['7d', '30d', '1y'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setChartTimeframe(tf)}
                  className={`px-3 py-1 rounded transition-colors ${
                    chartTimeframe === tf
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-content-muted hover:text-content-main'
                  }`}
                >
                  {tf === '7d' ? '7 Ngày' : tf === '30d' ? '30 Ngày' : '1 Năm'}
                </button>
              ))}
            </div>
          </div>

          {/* Bar Chart Visualization */}
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Skeleton className="w-full h-48 rounded" />
            </div>
          ) : (
            <div className="h-64 pt-6 flex items-end justify-between gap-2 sm:gap-4 px-2">
              {chartPoints.map((pt, idx) => {
                const heightPct = Math.max(12, Math.round((pt.val / maxVal) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-12 bg-gray-900 text-white text-[11px] font-medium py-1 px-2.5 rounded shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      <div>{formatCurrencyVND(pt.val)}</div>
                      <div className="text-[10px] text-gray-300 font-normal">{pt.orders} đơn hàng</div>
                    </div>

                    {/* Bar */}
                    <div className="w-full max-w-[42px] bg-surface-subtle rounded-t-theme h-48 flex items-end overflow-hidden">
                      <div
                        style={{ height: `${heightPct}%` }}
                        className="w-full bg-primary/80 group-hover:bg-primary transition-all rounded-t-theme duration-500"
                      />
                    </div>

                    {/* Label */}
                    <span className="text-[11px] font-semibold text-content-muted group-hover:text-primary transition-colors">
                      {pt.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Low-Stock Inventory Alerts */}
        <div className="p-6 rounded-theme bg-surface-card border border-border-base shadow-sm space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-content-main flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Cảnh Báo Tồn Kho</span>
            </h2>
            <Link
              to="/admin/products?stock=low_stock"
              className="text-xs text-primary font-semibold hover:underline"
            >
              Xem tất cả
            </Link>
          </div>

          <div className="space-y-3 flex-1">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-3 rounded-theme bg-surface-subtle border border-border-base flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="w-9 h-9 rounded" />
                    <div className="space-y-1">
                      <Skeleton className="w-24 h-3" />
                      <Skeleton className="w-16 h-2.5" />
                    </div>
                  </div>
                  <Skeleton className="w-16 h-6 rounded" />
                </div>
              ))
            ) : lowStockProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-content-muted">
                Kho hàng đang ổn định, không có sản phẩm sắp hết hàng.
              </div>
            ) : (
              lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-theme bg-surface-subtle border border-border-base flex items-center justify-between gap-3 text-xs hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                      alt={p.name}
                      className="w-9 h-9 rounded object-cover flex-shrink-0 bg-surface-card"
                    />
                    <div className="min-w-0">
                      <div className="font-semibold text-content-main truncate">{p.name}</div>
                      <div className="text-[11px] text-content-muted">SKU: {p.sku}</div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                      Còn {p.stock} sp
                    </span>
                    <Link
                      to={`/admin/products/${p.id}/edit`}
                      className="block text-[11px] text-primary font-semibold hover:underline mt-0.5"
                    >
                      Nhập thêm
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="p-6 rounded-theme bg-surface-card border border-border-base shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-content-main">Đơn Hàng Gần Đây</h2>
            <p className="text-xs text-content-muted mt-0.5">
              Danh sách các đơn hàng mới nhất cần xử lý và xuất kho
            </p>
          </div>
          <Link
            to="/admin/orders"
            className="text-xs text-primary font-semibold hover:underline"
          >
            Quản lý đơn hàng ({orders.length}) →
          </Link>
        </div>

        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border-base text-content-muted font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3">Mã Đơn</th>
                <th className="py-3 px-3">Khách Hàng</th>
                <th className="py-3 px-3">Số SP</th>
                <th className="py-3 px-3">Tổng Tiền</th>
                <th className="py-3 px-3">Thanh Toán</th>
                <th className="py-3 px-3">Trạng Thái</th>
                <th className="py-3 px-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="py-3 px-3">
                      <Skeleton className="h-6 w-full" />
                    </td>
                  </tr>
                ))
              ) : recentOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-surface-subtle transition-colors">
                  <td className="py-3.5 px-3 font-bold text-primary">
                    <Link to={`/admin/orders/${ord.id}`} className="hover:underline">
                      {ord.orderNumber}
                    </Link>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="font-semibold text-content-main">{ord.customer.name}</div>
                    <div className="text-[11px] text-content-muted">{ord.customer.phone}</div>
                  </td>
                  <td className="py-3.5 px-3 text-content-muted">
                    {ord.items.reduce((s, i) => s + i.quantity, 0)} món
                  </td>
                  <td className="py-3.5 px-3 font-bold text-content-main">
                    {formatCurrencyVND(ord.total)}
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-surface-subtle text-content-main border border-border-base uppercase">
                      {ord.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">{getStatusBadge(ord.status)}</td>
                  <td className="py-3.5 px-3 text-right">
                    <Link
                      to={`/admin/orders/${ord.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-theme bg-surface-subtle hover:bg-border-base text-content-main font-semibold transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
