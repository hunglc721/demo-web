import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Eye,
  Printer,
  ExternalLink,
  Download,
  RefreshCw,
  ShoppingCart,
  CheckCircle2,
  Package,
  Truck,
  XCircle,
  Copy,
  Check,
} from 'lucide-react';
import { orderService } from '@/services/api/orderService';
import { Order, OrderStatus } from '@/types/order';
import { Badge } from '@/core/components/Badge';
import { Pagination } from '@/core/components/Pagination';
import { formatCurrencyVND } from '@/utils/formatters';
import { matchesVietnameseSearch } from '@/utils/vietnameseSearch';
import { OrderDetailDrawer } from '../components/OrderDetailDrawer';
import { InvoiceModal } from '../components/InvoiceModal';
import { toast } from '@/stores/toastStore';

export const OrderListPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<'all' | OrderStatus>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all');
  const [selectedDatePreset, setSelectedDatePreset] = useState<string>('all');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [refreshKey, setRefreshKey] = useState(0);

  // Drawer & Modal State
  const [drawerOrder, setDrawerOrder] = useState<Order | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  // Load orders from DAL
  useEffect(() => {
    let isMounted = true;
    async function loadOrders() {
      setLoading(true);
      try {
        const res = await orderService.getOrders({
          limit: 200,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        });
        if (isMounted) {
          setOrders(res.data);
        }
      } catch (err) {
        console.error('Lỗi tải danh sách đơn hàng:', err);
        toast.error('Không thể nạp dữ liệu đơn hàng.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadOrders();
    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  // Status Tab Counts
  const statusCounts = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter((o) => o.status === 'pending').length,
      confirmed: orders.filter((o) => o.status === 'confirmed').length,
      processing: orders.filter((o) => o.status === 'processing').length,
      shipping: orders.filter((o) => o.status === 'shipping').length,
      completed: orders.filter((o) => o.status === 'completed').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
    };
  }, [orders]);

  // Filtering
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      // 1. Status Tab
      if (selectedStatusTab !== 'all' && ord.status !== selectedStatusTab) {
        return false;
      }

      // 2. Payment Method
      if (selectedPaymentMethod !== 'all' && ord.paymentMethod !== selectedPaymentMethod) {
        return false;
      }

      // 3. Payment Status
      if (selectedPaymentStatus !== 'all' && ord.paymentStatus !== selectedPaymentStatus) {
        return false;
      }

      // 4. Date Preset
      if (selectedDatePreset !== 'all') {
        const orderTime = new Date(ord.createdAt).getTime();
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;

        if (selectedDatePreset === 'today' && now - orderTime > oneDay) return false;
        if (selectedDatePreset === '7d' && now - orderTime > 7 * oneDay) return false;
        if (selectedDatePreset === '30d' && now - orderTime > 30 * oneDay) return false;
      }

      // 5. Accent-insensitive Search
      if (searchQuery.trim()) {
        const matched = matchesVietnameseSearch(
          [
            ord.orderNumber,
            ord.id,
            ord.customer.name,
            ord.customer.phone,
            ord.customer.email,
            ord.customer.address?.fullAddress || '',
          ],
          searchQuery
        );
        if (!matched) return false;
      }

      return true;
    });
  }, [
    orders,
    selectedStatusTab,
    selectedPaymentMethod,
    selectedPaymentStatus,
    selectedDatePreset,
    searchQuery,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  // Master Checkbox
  const allCurrentPageSelected =
    paginatedOrders.length > 0 &&
    paginatedOrders.every((o) => selectedOrderIds.includes(o.id));

  const toggleSelectAllPage = () => {
    if (allCurrentPageSelected) {
      const pageIds = paginatedOrders.map((o) => o.id);
      setSelectedOrderIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      const pageIds = paginatedOrders.map((o) => o.id);
      setSelectedOrderIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  // Batch Status Transition
  const handleBatchStatus = async (status: OrderStatus) => {
    if (selectedOrderIds.length === 0) return;
    try {
      await Promise.all(
        selectedOrderIds.map((id) =>
          orderService.updateOrderStatus(
            id,
            status,
            `Cập nhật hàng loạt sang [${status.toUpperCase()}]`,
            'Quản trị viên'
          )
        )
      );
      toast.success(`Đã cập nhật ${selectedOrderIds.length} đơn hàng sang trạng thái mới!`);
      setSelectedOrderIds([]);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error('Lỗi khi cập nhật trạng thái hàng loạt.');
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      toast.warning('Không có dữ liệu đơn hàng để xuất.');
      return;
    }

    const headers = [
      'Mã đơn hàng',
      'Ngày đặt',
      'Khách hàng',
      'Số điện thoại',
      'Địa chỉ',
      'Số lượng SP',
      'Tổng tiền (VND)',
      'Phương thức thanh toán',
      'Trạng thái thanh toán',
      'Trạng thái đơn hàng',
    ];

    const rows = filteredOrders.map((o) => [
      o.orderNumber,
      `"${new Date(o.createdAt).toLocaleDateString('vi-VN')}"`,
      `"${o.customer.name}"`,
      `"${o.customer.phone}"`,
      `"${o.customer.address?.fullAddress || ''}"`,
      o.items.reduce((s, i) => s + i.quantity, 0),
      o.total,
      o.paymentMethod.toUpperCase(),
      o.paymentStatus,
      o.status,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `d2c_orders_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Đã tải xuống file CSV đơn hàng thành công!');
  };

  // Status Badge Mapper
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Hoàn thành</Badge>;
      case 'shipping':
        return <Badge variant="primary">Đang giao</Badge>;
      case 'processing':
        return <Badge variant="warning">Đang đóng gói</Badge>;
      case 'confirmed':
        return <Badge variant="info">Đã xác nhận</Badge>;
      case 'cancelled':
        return <Badge variant="danger">Đã hủy</Badge>;
      default:
        return <Badge variant="warning" pulse>Chờ xác nhận</Badge>;
    }
  };

  // Copy Order Number
  const handleCopyOrderNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedOrderId(num);
    setTimeout(() => setCopiedOrderId(null), 2000);
    toast.success(`Đã sao chép mã đơn #${num}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-content-main tracking-tight">
            Quản Lý Đơn Hàng (Order Pipeline)
          </h1>
          <p className="text-sm text-content-muted mt-0.5">
            Theo dõi tiến độ đơn hàng từ tiếp nhận, đóng gói, giao vận đến hoàn thành và in phiếu.
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
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-theme bg-surface-card hover:bg-surface-subtle border border-border-base text-content-main text-xs font-bold shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất file CSV</span>
          </button>
        </div>
      </div>

      {/* Status Pipeline Tabs with Count Pills */}
      <div className="flex items-center gap-2 border-b border-border-base overflow-x-auto pb-px">
        {[
          { key: 'all', label: 'Tất cả đơn', count: statusCounts.all },
          { key: 'pending', label: 'Chờ xác nhận', count: statusCounts.pending },
          { key: 'confirmed', label: 'Đã xác nhận', count: statusCounts.confirmed },
          { key: 'processing', label: 'Đang đóng gói', count: statusCounts.processing },
          { key: 'shipping', label: 'Đang giao hàng', count: statusCounts.shipping },
          { key: 'completed', label: 'Hoàn thành', count: statusCounts.completed },
          { key: 'cancelled', label: 'Đã hủy', count: statusCounts.cancelled },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setSelectedStatusTab(tab.key as any);
              setCurrentPage(1);
            }}
            className={`inline-flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-xs whitespace-nowrap transition-colors ${
              selectedStatusTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-content-muted hover:text-content-main'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                selectedStatusTab === tab.key
                  ? 'bg-primary/10 text-primary'
                  : 'bg-surface-subtle text-content-muted'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Multi-Filters Toolbar */}
      <div className="p-4 rounded-theme bg-surface-card border border-border-base flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Tìm theo mã đơn (#ORD-...), tên khách, số điện thoại, địa chỉ..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-surface-subtle border border-border-base rounded-theme pl-9 pr-8 py-2 text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <Search className="w-4 h-4 text-content-muted absolute left-3 top-2.5" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-content-muted hover:text-content-main text-xs font-bold"
            >
              ×
            </button>
          )}
        </div>

        {/* Payment Method Filter */}
        <div className="w-full md:w-44">
          <select
            value={selectedPaymentMethod}
            onChange={(e) => {
              setSelectedPaymentMethod(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-surface-subtle border border-border-base rounded-theme px-3 py-2 text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="all">Phương thức: Tất cả</option>
            <option value="cod">Tiền mặt (COD)</option>
            <option value="vietqr">Chuyển khoản VietQR</option>
            <option value="momo">Ví MoMo</option>
            <option value="card">Thẻ tín dụng</option>
          </select>
        </div>

        {/* Payment Status Filter */}
        <div className="w-full md:w-44">
          <select
            value={selectedPaymentStatus}
            onChange={(e) => {
              setSelectedPaymentStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-surface-subtle border border-border-base rounded-theme px-3 py-2 text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="all">Thanh toán: Tất cả</option>
            <option value="pending">Chờ thanh toán</option>
            <option value="paid">Đã thanh toán</option>
            <option value="refunded">Đã hoàn tiền</option>
          </select>
        </div>

        {/* Date Filter */}
        <div className="w-full md:w-40">
          <select
            value={selectedDatePreset}
            onChange={(e) => {
              setSelectedDatePreset(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-surface-subtle border border-border-base rounded-theme px-3 py-2 text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="all">Thời gian: Tất cả</option>
            <option value="today">Hôm nay</option>
            <option value="7d">7 ngày qua</option>
            <option value="30d">Tháng này (30d)</option>
          </select>
        </div>

        {(searchQuery ||
          selectedPaymentMethod !== 'all' ||
          selectedPaymentStatus !== 'all' ||
          selectedDatePreset !== 'all') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedPaymentMethod('all');
              setSelectedPaymentStatus('all');
              setSelectedDatePreset('all');
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-theme border border-border-base hover:bg-surface-subtle text-xs font-semibold text-content-muted hover:text-content-main transition-colors whitespace-nowrap"
          >
            Đặt lại
          </button>
        )}
      </div>

      {/* Batch Action Toolbar */}
      {selectedOrderIds.length > 0 && (
        <div className="p-3.5 rounded-theme bg-primary/10 border border-primary/20 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <span className="text-xs font-bold text-primary">
            Đã chọn {selectedOrderIds.length} đơn hàng
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleBatchStatus('confirmed')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold bg-surface-card hover:bg-surface-subtle border border-border-base text-content-main"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
              <span>Xác nhận ({selectedOrderIds.length})</span>
            </button>
            <button
              onClick={() => handleBatchStatus('processing')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold bg-surface-card hover:bg-surface-subtle border border-border-base text-content-main"
            >
              <Package className="w-3.5 h-3.5 text-amber-500" />
              <span>Đóng gói ({selectedOrderIds.length})</span>
            </button>
            <button
              onClick={() => handleBatchStatus('shipping')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold bg-surface-card hover:bg-surface-subtle border border-border-base text-content-main"
            >
              <Truck className="w-3.5 h-3.5 text-purple-500" />
              <span>Giao hàng ({selectedOrderIds.length})</span>
            </button>
            <button
              onClick={() => handleBatchStatus('cancelled')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold bg-status-danger text-white hover:bg-red-700"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Hủy đơn ({selectedOrderIds.length})</span>
            </button>
            <button
              onClick={() => setSelectedOrderIds([])}
              className="px-2.5 py-1.5 rounded text-xs text-content-muted hover:text-content-main"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="rounded-theme border border-border-base bg-surface-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border-base bg-surface-subtle text-content-muted font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={allCurrentPageSelected}
                    onChange={toggleSelectAllPage}
                    className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3">Mã Đơn Hàng</th>
                <th className="py-3 px-3">Ngày Đặt</th>
                <th className="py-3 px-3">Khách Hàng</th>
                <th className="py-3 px-3">Sản Phẩm</th>
                <th className="py-3 px-3">Tổng Tiền</th>
                <th className="py-3 px-3">Thanh Toán</th>
                <th className="py-3 px-3">Trạng Thái</th>
                <th className="py-3 px-3.5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-content-muted">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent mb-2" />
                    <p>Đang tải danh sách đơn hàng...</p>
                  </td>
                </tr>
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-content-muted">
                    <ShoppingCart className="w-10 h-10 text-border-base mx-auto mb-2" />
                    <p className="text-xs font-semibold text-content-main">
                      Không tìm thấy đơn hàng nào
                    </p>
                    <p className="text-[11px] text-content-muted mt-0.5">
                      Thử thay đổi bộ lọc tìm kiếm hoặc trạng thái đơn hàng.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((ord) => {
                  const isChecked = selectedOrderIds.includes(ord.id);
                  const totalItems = ord.items.reduce((sum, it) => sum + it.quantity, 0);

                  return (
                    <tr
                      key={ord.id}
                      className={`hover:bg-surface-subtle transition-colors ${
                        isChecked ? 'bg-primary/5' : ''
                      }`}
                    >
                      <td className="py-3.5 px-3.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOrder(ord.id)}
                          className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                        />
                      </td>

                      {/* Order Number */}
                      <td className="py-3.5 px-3 font-mono font-bold text-primary">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setDrawerOrder(ord);
                              setIsDrawerOpen(true);
                            }}
                            className="hover:underline font-bold"
                          >
                            {ord.orderNumber}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyOrderNumber(ord.orderNumber)}
                            className="text-content-muted hover:text-content-main p-0.5"
                            title="Sao chép mã"
                          >
                            {copiedOrderId === ord.orderNumber ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-3 text-content-muted text-[11px]">
                        <div>{new Date(ord.createdAt).toLocaleDateString('vi-VN')}</div>
                        <div className="text-[10px]">
                          {new Date(ord.createdAt).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-3 min-w-[160px]">
                        <div className="font-semibold text-content-main">
                          {ord.customer.name}
                        </div>
                        <div className="text-[11px] text-content-muted">{ord.customer.phone}</div>
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={
                              ord.items?.[0]?.image ||
                              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80'
                            }
                            alt=""
                            className="w-8 h-8 rounded object-cover flex-shrink-0 bg-surface-subtle border border-border-base"
                          />
                          <span className="font-medium text-content-muted">
                            {totalItems} sản phẩm
                          </span>
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-3 font-bold text-content-main">
                        {formatCurrencyVND(ord.total)}
                      </td>

                      {/* Payment */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-0.5">
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-surface-subtle border border-border-base uppercase text-content-main">
                            {ord.paymentMethod}
                          </span>
                          <div>
                            <span
                              className={`text-[10px] font-semibold ${
                                ord.paymentStatus === 'paid'
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-amber-600 dark:text-amber-400'
                              }`}
                            >
                              {ord.paymentStatus === 'paid' ? '● Đã thanh toán' : '○ Chưa thanh toán'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">{getStatusBadge(ord.status)}</td>

                      {/* Actions */}
                      <td className="py-3.5 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setDrawerOrder(ord);
                              setIsDrawerOpen(true);
                            }}
                            className="p-1.5 rounded-theme text-content-muted hover:text-primary hover:bg-surface-subtle transition-colors"
                            title="Xem nhanh trong ngăn kéo"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <Link
                            to={`/admin/orders/${ord.id}`}
                            className="p-1.5 rounded-theme text-content-muted hover:text-content-main hover:bg-surface-subtle transition-colors"
                            title="Xem chi tiết toàn màn hình"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              setInvoiceOrder(ord);
                              setIsInvoiceOpen(true);
                            }}
                            className="p-1.5 rounded-theme text-content-muted hover:text-primary hover:bg-surface-subtle transition-colors"
                            title="In phiếu giao hàng / Hóa đơn"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        {filteredOrders.length > itemsPerPage && (
          <div className="p-4 border-t border-border-base flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-content-muted">
              Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{' '}
              {Math.min(currentPage * itemsPerPage, filteredOrders.length)} trên tổng số{' '}
              {filteredOrders.length} đơn hàng
            </span>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={itemsPerPage}
              totalItems={filteredOrders.length}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}
      </div>

      {/* Order Detail Drawer */}
      <OrderDetailDrawer
        order={drawerOrder}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onOrderUpdated={(updated) => {
          setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
          setDrawerOrder(updated);
        }}
        onOpenInvoice={(ord) => {
          setInvoiceOrder(ord);
          setIsInvoiceOpen(true);
        }}
      />

      {/* Invoice Printable Modal */}
      <InvoiceModal
        order={invoiceOrder}
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
      />
    </div>
  );
};

export default OrderListPage;
