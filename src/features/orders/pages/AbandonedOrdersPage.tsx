import React, { useState, useEffect } from 'react';
import {
  Clock,
  Search,
  Send,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Eye,
  RefreshCw,
  X,
  Mail,
  User,
  Phone,
} from 'lucide-react';
import { formatCurrencyVND } from '@/utils/formatters';
import { STORAGE_KEYS } from '@/services/storage/storageKeys';
import { toast } from '@/stores/toastStore';
import { orderService } from '@/services/api/orderService';
import { cn } from '@/utils/cn';

export interface AbandonedOrder {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: Array<{
    title: string;
    quantity: number;
    price: number;
    image: string;
    variantTitle?: string;
  }>;
  totalAmount: number;
  reminderStatus: 'unsent' | 'sent';
  lastReminderAt?: string;
  createdAt: string;
  note?: string;
}

const SEED_ABANDONED_ORDERS: AbandonedOrder[] = [
  {
    id: 'abn_01',
    code: 'ABN-2026-081',
    customerName: 'Hoàng Văn Thắng',
    customerPhone: '0912345678',
    customerEmail: 'thang.hoang@gmail.com',
    items: [
      {
        title: 'Áo Polo Thể Thao Phối Viền Active Pro',
        quantity: 2,
        price: 299000,
        image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=200',
        variantTitle: 'Đen / L',
      },
    ],
    totalAmount: 598000,
    reminderStatus: 'unsent',
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    note: 'Khách dừng ở bước nhập mã giảm giá',
  },
  {
    id: 'abn_02',
    code: 'ABN-2026-082',
    customerName: 'Trần Thị Mai',
    customerPhone: '0987654321',
    customerEmail: 'mai.tran92@yahoo.com',
    items: [
      {
        title: 'Đầm Xòe Linen Cổ Vuông Dạo Phố',
        quantity: 1,
        price: 450000,
        image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=200',
        variantTitle: 'Be / M',
      },
      {
        title: 'Ví Cầm Tay Mini Da Thật Cao Cấp',
        quantity: 1,
        price: 250000,
        image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=200',
      },
    ],
    totalAmount: 700000,
    reminderStatus: 'sent',
    lastReminderAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    note: 'Đã gửi Zalo ZNS nhắc giỏ hàng lúc 14:00',
  },
  {
    id: 'abn_03',
    code: 'ABN-2026-083',
    customerName: 'Lê Quang Huy',
    customerPhone: '0903112233',
    customerEmail: 'quanghuy.le@outlook.com',
    items: [
      {
        title: 'Giày Sneaker Da Nam Phối Da Lộn Classic',
        quantity: 1,
        price: 890000,
        image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=200',
        variantTitle: 'Trắng / 42',
      },
    ],
    totalAmount: 890000,
    reminderStatus: 'unsent',
    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
  },
];

export const AbandonedOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<AbandonedOrder[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'unsent' | 'sent'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailOrder, setDetailOrder] = useState<AbandonedOrder | null>(null);

  // Load from LocalStorage or seed
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ABANDONED_ORDERS);
      if (raw) {
        setOrders(JSON.parse(raw));
      } else {
        localStorage.setItem(STORAGE_KEYS.ABANDONED_ORDERS, JSON.stringify(SEED_ABANDONED_ORDERS));
        setOrders(SEED_ABANDONED_ORDERS);
      }
    } catch {
      setOrders(SEED_ABANDONED_ORDERS);
    }
  }, []);

  const saveOrders = (updated: AbandonedOrder[]) => {
    setOrders(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.ABANDONED_ORDERS, JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'unsent' && o.reminderStatus !== 'unsent') return false;
    if (activeTab === 'sent' && o.reminderStatus !== 'sent') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = o.code.toLowerCase().includes(q);
      const matchName = o.customerName.toLowerCase().includes(q);
      const matchPhone = o.customerPhone.includes(q);
      if (!matchCode && !matchName && !matchPhone) return false;
    }

    if (timeFilter !== 'all') {
      const createdDate = new Date(o.createdAt);
      const now = new Date();
      if (timeFilter === 'today') {
        if (createdDate.toDateString() !== now.toDateString()) return false;
      } else if (timeFilter === '7days') {
        const diffDays = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
        if (diffDays > 7) return false;
      } else if (timeFilter === '30days') {
        const diffDays = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
        if (diffDays > 30) return false;
      }
    }

    return true;
  });

  const unsentCount = orders.filter((o) => o.reminderStatus === 'unsent').length;
  const sentCount = orders.filter((o) => o.reminderStatus === 'sent').length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredOrders.map((o) => o.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Send single reminder
  const handleSendReminder = (order: AbandonedOrder) => {
    const updated = orders.map((o) =>
      o.id === order.id
        ? {
            ...o,
            reminderStatus: 'sent' as const,
            lastReminderAt: new Date().toISOString(),
          }
        : o
    );
    saveOrders(updated);
    toast.success(`Đã gửi tin nhắn nhắc nhở Zalo/SMS tới khách hàng ${order.customerName}!`);
  };

  // Bulk send reminder
  const handleBulkSendReminder = () => {
    if (selectedIds.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một đơn bỏ dở.');
      return;
    }
    const updated = orders.map((o) =>
      selectedIds.includes(o.id)
        ? {
            ...o,
            reminderStatus: 'sent' as const,
            lastReminderAt: new Date().toISOString(),
          }
        : o
    );
    saveOrders(updated);
    toast.success(`Đã gửi nhắc nhở thành công cho ${selectedIds.length} khách hàng!`);
    setSelectedIds([]);
  };

  // Recover abandoned cart into confirmed order
  const handleConvertToOrder = async (order: AbandonedOrder) => {
    try {
      await orderService.createOrder({
        customer: {
          name: order.customerName,
          phone: order.customerPhone,
          email: order.customerEmail,
          address: {
            id: `addr_${Date.now()}`,
            receiverName: order.customerName,
            phone: order.customerPhone,
            street: '123 Hai Bà Trưng',
            ward: 'Phường Bến Nghé',
            district: 'Quận 1',
            province: 'TP. Hồ Chí Minh',
            fullAddress: '123 Hai Bà Trưng, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
          },
        },
        items: order.items.map((it, idx) => ({
          id: `item_${idx}_${Date.now()}`,
          productId: 'prod_recovered',
          title: it.title,
          sku: 'SKU-RECOVERED',
          price: it.price,
          quantity: it.quantity,
          totalPrice: it.price * it.quantity,
          image: it.image,
          variantName: it.variantTitle,
        })),
        subtotal: order.totalAmount,
        shippingFee: 30000,
        discount: 0,
        total: order.totalAmount + 30000,
        status: 'pending',
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        notes: `Khôi phục từ đơn chưa hoàn tất ${order.code}`,
      });

      // Remove from abandoned
      const remaining = orders.filter((o) => o.id !== order.id);
      saveOrders(remaining);
      toast.success(`Đã khôi phục thành công đơn hàng mới từ mã ${order.code}!`);
      if (detailOrder?.id === order.id) setDetailOrder(null);
    } catch (err: any) {
      console.error(err);
      toast.error('Có lỗi xảy ra khi khôi phục đơn hàng.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-base pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-content-main tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-primary" />
            <span>Đơn hàng chưa hoàn tất</span>
          </h1>
          <p className="text-xs sm:text-sm text-content-muted mt-1">
            Quản lý các đơn bị bỏ dở ở bước cuối — chủ động liên hệ để giúp khách hoàn thành đơn.
          </p>
        </div>

        {selectedIds.length > 0 && (
          <button
            onClick={handleBulkSendReminder}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-theme bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-sm transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Gửi nhắc nhở hàng loạt ({selectedIds.length})</span>
          </button>
        )}
      </div>

      {/* Tabs matching screenshot */}
      <div className="flex items-center gap-2 border-b border-border-base pb-1">
        <button
          onClick={() => setActiveTab('all')}
          className={cn(
            'px-4 py-2 text-xs font-semibold rounded-t-theme transition-colors border-b-2',
            activeTab === 'all'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-content-muted hover:text-content-main'
          )}
        >
          Tất cả ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('unsent')}
          className={cn(
            'px-4 py-2 text-xs font-semibold rounded-t-theme transition-colors border-b-2 flex items-center gap-1.5',
            activeTab === 'unsent'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-content-muted hover:text-content-main'
          )}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Chưa gửi ({unsentCount})</span>
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={cn(
            'px-4 py-2 text-xs font-semibold rounded-t-theme transition-colors border-b-2 flex items-center gap-1.5',
            activeTab === 'sent'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-content-muted hover:text-content-main'
          )}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Đã gửi ({sentCount})</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-content-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm đơn hàng theo mã hoặc tên khách hàng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-subtle border border-border-base rounded-theme pl-9 pr-3 py-2 text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 bg-surface-subtle border border-border-base rounded-theme px-3 py-1.5 text-xs text-content-muted">
            <Calendar className="w-3.5 h-3.5" />
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="bg-transparent text-content-main font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">Thời gian: Tất cả</option>
              <option value="today">Hôm nay</option>
              <option value="7days">7 ngày qua</option>
              <option value="30days">30 ngày qua</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table or Empty State */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center rounded-theme bg-surface-card border border-border-base">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
            <Mail className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-content-main">Chưa có đơn hàng nào</h3>
          <p className="text-xs text-content-muted mt-1 max-w-md mx-auto">
            Khi khách rời đi giữa chừng ở bước thanh toán, đơn chưa hoàn tất sẽ được tự động ghi lại ở đây để bạn tiện hỗ trợ.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-theme border border-border-base bg-surface-card shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-subtle/80 border-b border-border-base text-content-muted font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredOrders.length > 0 &&
                      selectedIds.length === filteredOrders.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-border-base text-primary focus:ring-primary cursor-pointer"
                  />
                </th>
                <th className="p-3">MÃ ĐƠN BỎ DỞ</th>
                <th className="p-3">KHÁCH HÀNG</th>
                <th className="p-3">SẢN PHẨM TRONG GIỎ</th>
                <th className="p-3">GIÁ TRỊ GIỎ</th>
                <th className="p-3">TRẠNG THÁI NHẮC</th>
                <th className="p-3">THỜI GIAN</th>
                <th className="p-3 text-right">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base">
              {filteredOrders.map((order) => {
                const isSelected = selectedIds.includes(order.id);
                return (
                  <tr
                    key={order.id}
                    className={cn(
                      'hover:bg-surface-subtle/50 transition-colors',
                      isSelected && 'bg-primary/5'
                    )}
                  >
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(order.id)}
                        className="rounded border-border-base text-primary focus:ring-primary cursor-pointer"
                      />
                    </td>
                    <td className="p-3 font-mono font-bold text-content-main">
                      {order.code}
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-content-main">{order.customerName}</div>
                      <div className="text-[11px] text-content-muted font-mono">{order.customerPhone}</div>
                      <div className="text-[10px] text-content-muted">{order.customerEmail}</div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {order.items[0]?.image && (
                          <img
                            src={order.items[0].image}
                            alt=""
                            className="w-8 h-8 rounded object-cover border border-border-base flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-content-main truncate max-w-[200px]">
                            {order.items[0]?.title}
                          </p>
                          <p className="text-[10px] text-content-muted">
                            SL: {order.items[0]?.quantity}
                            {order.items.length > 1 && ` (+${order.items.length - 1} món khác)`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-bold text-primary">
                      {formatCurrencyVND(order.totalAmount)}
                    </td>
                    <td className="p-3">
                      {order.reminderStatus === 'sent' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Đã gửi tin</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <AlertCircle className="w-3 h-3" />
                          <span>Chưa gửi</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-content-muted text-[11px]">
                      {new Date(order.createdAt).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="p-3 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => handleSendReminder(order)}
                        className="p-1.5 rounded hover:bg-surface-subtle text-content-muted hover:text-primary transition-colors"
                        title="Gửi tin nhắc (Zalo/SMS)"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleConvertToOrder(order)}
                        className="p-1.5 rounded hover:bg-surface-subtle text-content-muted hover:text-emerald-600 transition-colors"
                        title="Khôi phục thành đơn hàng chính thức"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDetailOrder(order)}
                        className="p-1.5 rounded hover:bg-surface-subtle text-content-muted hover:text-content-main transition-colors"
                        title="Xem chi tiết giỏ hàng"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {detailOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface-card border border-border-base rounded-theme shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border-base pb-3">
              <div>
                <h3 className="font-bold text-base text-content-main">
                  Chi tiết đơn bỏ dở: {detailOrder.code}
                </h3>
                <p className="text-xs text-content-muted">
                  Thời điểm tạo: {new Date(detailOrder.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
              <button
                onClick={() => setDetailOrder(null)}
                className="p-1 rounded text-content-muted hover:text-content-main hover:bg-surface-subtle"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded bg-surface-subtle border border-border-base space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-content-main">
                  <User className="w-3.5 h-3.5 text-primary" />
                  <span>{detailOrder.customerName}</span>
                </div>
                <div className="flex items-center gap-1.5 text-content-muted font-mono">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{detailOrder.customerPhone}</span>
                </div>
                <div className="flex items-center gap-1.5 text-content-muted">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{detailOrder.customerEmail}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-content-main mb-2">Sản phẩm trong giỏ:</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {detailOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded bg-surface-subtle/50 border border-border-base"
                    >
                      <div className="flex items-center gap-2">
                        {item.image && (
                          <img
                            src={item.image}
                            alt=""
                            className="w-10 h-10 rounded object-cover border border-border-base"
                          />
                        )}
                        <div>
                          <p className="font-medium text-content-main">{item.title}</p>
                          {item.variantTitle && (
                            <p className="text-[10px] text-content-muted">{item.variantTitle}</p>
                          )}
                          <p className="text-[11px] text-content-muted">SL: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-bold text-primary">
                        {formatCurrencyVND(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-border-base text-sm font-bold">
                <span>Tổng giá trị giỏ:</span>
                <span className="text-primary">{formatCurrencyVND(detailOrder.totalAmount)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-base">
              <button
                type="button"
                onClick={() => setDetailOrder(null)}
                className="px-3 py-1.5 rounded-theme border border-border-base text-xs font-semibold text-content-main hover:bg-surface-subtle"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => handleConvertToOrder(detailOrder)}
                className="px-4 py-1.5 rounded-theme bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-sm"
              >
                Tạo thành đơn hàng chính thức
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AbandonedOrdersPage;
