import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  MapPin,
  ShoppingBag,
  Award,
  Crown,
  Star,
  Sparkles,
  ExternalLink,
  Save,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Customer, CustomerTier } from '@/types/customer';
import { Order } from '@/types/order';
import { Drawer } from '@/core/components/Drawer';
import { Badge } from '@/core/components/Badge';
import { customerService } from '@/services/api/customerService';
import { orderService } from '@/services/api/orderService';
import { formatCurrencyVND } from '@/utils/formatters';
import { toast } from '@/stores/toastStore';

export interface CustomerDetailDrawerProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onCustomerUpdated?: (updated: Customer) => void;
}

export const CustomerDetailDrawer: React.FC<CustomerDetailDrawerProps> = ({
  customer,
  isOpen,
  onClose,
  onCustomerUpdated,
}) => {
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadCustomerHistory() {
      if (!customer) return;
      setNotes(customer.notes || '');
      setLoadingOrders(true);
      try {
        const res = await orderService.getOrders({ limit: 100 });
        if (isMounted) {
          // Filter orders for this customer (by ID or phone)
          const matched = res.data.filter(
            (o) =>
              (o.customerId && o.customerId === customer.id) ||
              o.customer.phone === customer.phone ||
              (o.customer.email && customer.email && o.customer.email.toLowerCase() === customer.email.toLowerCase())
          );
          setCustomerOrders(matched);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoadingOrders(false);
      }
    }

    if (isOpen && customer) {
      loadCustomerHistory();
    }

    return () => {
      isMounted = false;
    };
  }, [customer, isOpen]);

  if (!customer) return null;

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      const updated = await customerService.updateCustomer(customer.id, { notes });
      onCustomerUpdated?.(updated);
      toast.success('Đã lưu ghi chú khách hàng thành công!');
    } catch (err) {
      toast.error('Lỗi khi lưu ghi chú.');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleToggleStatus = async () => {
    const nextStatus = customer.status === 'active' ? 'blocked' : 'active';
    try {
      const updated = await customerService.updateCustomer(customer.id, {
        status: nextStatus,
      });
      onCustomerUpdated?.(updated);
      toast.info(
        `Đã ${nextStatus === 'active' ? 'mở khóa' : 'khóa'} tài khoản "${customer.name}"`
      );
    } catch (err) {
      toast.error('Lỗi khi thay đổi trạng thái tài khoản.');
    }
  };

  // Tier Badge Component
  const renderTierBadge = (tier: CustomerTier) => {
    switch (tier) {
      case 'vip_gold':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <Crown className="w-3.5 h-3.5" />
            <span>VIP Gold</span>
          </span>
        );
      case 'vip':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30">
            <Star className="w-3.5 h-3.5" />
            <span>VIP</span>
          </span>
        );
      case 'regular':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
            <Award className="w-3.5 h-3.5" />
            <span>Thân Thiết</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Khách Mới</span>
          </span>
        );
    }
  };

  const aov =
    customer.totalOrders > 0
      ? Math.round(customer.totalSpend / customer.totalOrders)
      : 0;

  // Initials
  const initials = customer.name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      placement="right"
      size="xl"
      title={`Hồ Sơ Khách Hàng: ${customer.name}`}
      description={`Mã khách hàng: ${customer.id} | Gia nhập: ${new Date(
        customer.createdAt
      ).toLocaleDateString('vi-VN')}`}
    >
      <div className="space-y-6 text-xs text-content-main p-1">
        {/* Profile Card Header */}
        <div className="p-5 rounded-theme bg-surface-subtle border border-border-base flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-base shadow-xs flex-shrink-0">
              {initials || <User className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-content-main">{customer.name}</h3>
                {renderTierBadge(customer.tier)}
              </div>
              <div className="text-[11px] text-content-muted mt-0.5">
                {customer.email} • {customer.phone}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleStatus}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-theme border text-xs font-semibold shadow-xs transition-colors ${
                customer.status === 'active'
                  ? 'border-status-danger/40 bg-status-danger/10 text-status-danger hover:bg-status-danger hover:text-white'
                  : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-600 hover:text-white'
              }`}
            >
              {customer.status === 'active' ? (
                <>
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Khóa tài khoản</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Kích hoạt lại</span>
                </>
              )}
            </button>
            <Link
              to={`/admin/customers/${customer.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-theme bg-surface-card hover:bg-border-base border border-border-base text-content-main font-semibold shadow-xs transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Trang riêng</span>
            </Link>
          </div>
        </div>

        {/* 3 Metric Stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3.5 rounded-theme bg-surface-card border border-border-base shadow-xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-content-muted">
              Tổng Chi Tiêu (LTV)
            </span>
            <div className="text-base font-black text-content-main">
              {formatCurrencyVND(customer.totalSpend)}
            </div>
          </div>

          <div className="p-3.5 rounded-theme bg-surface-card border border-border-base shadow-xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-content-muted">
              Tổng Số Đơn Hàng
            </span>
            <div className="text-base font-black text-content-main">
              {customer.totalOrders} <span className="text-xs font-normal text-content-muted">đơn</span>
            </div>
          </div>

          <div className="p-3.5 rounded-theme bg-surface-card border border-border-base shadow-xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-content-muted">
              Giá Trị TB / Đơn (AOV)
            </span>
            <div className="text-base font-black text-content-main">
              {formatCurrencyVND(aov)}
            </div>
          </div>
        </div>

        {/* Contact Info & Address Book */}
        <div className="p-5 rounded-theme bg-surface-card border border-border-base shadow-xs space-y-3">
          <h4 className="font-bold text-content-main uppercase text-[11px] tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span>Sổ Địa Chỉ Giao Hàng</span>
          </h4>

          {customer.addresses && customer.addresses.length > 0 ? (
            <div className="space-y-2">
              {customer.addresses.map((addr, idx) => (
                <div
                  key={addr.id || idx}
                  className="p-3 rounded-theme bg-surface-subtle border border-border-base space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-content-main">{addr.receiverName}</span>
                    {addr.isDefault && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
                        Mặc định
                      </span>
                    )}
                  </div>
                  <div className="text-content-muted">SĐT: {addr.phone}</div>
                  <div className="text-content-muted leading-relaxed">
                    {addr.fullAddress ||
                      `${addr.street}, ${addr.ward}, ${addr.district}, ${addr.province}`}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-content-muted py-2 italic">Chưa lưu địa chỉ nhận hàng nào.</div>
          )}
        </div>

        {/* Customer Tags */}
        {customer.tags && customer.tags.length > 0 && (
          <div className="p-4 rounded-theme bg-surface-card border border-border-base shadow-xs space-y-2">
            <h4 className="font-bold text-content-main uppercase text-[11px] tracking-wider">
              Thẻ Phân Khúc (Customer Tags)
            </h4>
            <div className="flex flex-wrap items-center gap-1.5">
              {customer.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded text-xs font-semibold bg-surface-subtle text-content-main border border-border-base"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Order History Table */}
        <div className="p-5 rounded-theme bg-surface-card border border-border-base shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-content-main uppercase text-[11px] tracking-wider flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-primary" />
              <span>Lịch Sử Đơn Hàng Gần Đây ({customerOrders.length})</span>
            </h4>
            <Link
              to="/admin/orders"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Xem tất cả đơn →
            </Link>
          </div>

          {loadingOrders ? (
            <div className="py-6 text-center text-content-muted">
              Đang tải lịch sử đơn hàng...
            </div>
          ) : customerOrders.length === 0 ? (
            <div className="py-6 text-center text-content-muted italic">
              Khách hàng chưa có đơn hàng nào trong hệ thống.
            </div>
          ) : (
            <div className="divide-y divide-border-base">
              {customerOrders.map((ord) => (
                <div key={ord.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div>
                    <Link
                      to={`/admin/orders/${ord.id}`}
                      className="font-bold text-primary hover:underline font-mono"
                    >
                      {ord.orderNumber}
                    </Link>
                    <div className="text-[11px] text-content-muted mt-0.5">
                      {new Date(ord.createdAt).toLocaleDateString('vi-VN')} •{' '}
                      {ord.items.reduce((s, i) => s + i.quantity, 0)} món
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 space-y-1">
                    <div className="font-bold text-content-main">
                      {formatCurrencyVND(ord.total)}
                    </div>
                    <Badge variant={ord.status === 'completed' ? 'success' : 'neutral'}>
                      {ord.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Admin Internal Notes */}
        <div className="p-5 rounded-theme bg-surface-card border border-border-base shadow-xs space-y-3">
          <h4 className="font-bold text-content-main uppercase text-[11px] tracking-wider">
            Ghi Chú Nội Bộ CSKH
          </h4>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ghi chú sở thích, thói quen mua sắm hoặc yêu cầu đặc biệt của khách hàng..."
            className="w-full bg-surface-subtle border border-border-base rounded-theme p-3 text-xs text-content-main focus:outline-none focus:ring-1 focus:ring-primary resize-y"
          />
          <div className="flex justify-end">
            <button
              type="button"
              disabled={isSavingNotes}
              onClick={handleSaveNotes}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-theme bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-xs transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingNotes ? 'Đang lưu...' : 'Lưu ghi chú CSKH'}</span>
            </button>
          </div>
        </div>
      </div>
    </Drawer>
  );
};

export default CustomerDetailDrawer;
