import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  Truck,
  Package,
  AlertCircle,
  Check,
  Printer,
  User,
  MapPin,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { Order, OrderStatus } from '@/types/order';
import { Drawer } from '@/core/components/Drawer';
import { Badge } from '@/core/components/Badge';
import { orderService } from '@/services/api/orderService';
import { formatCurrencyVND } from '@/utils/formatters';
import { toast } from '@/stores/toastStore';

export interface OrderDetailDrawerProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdated: (updatedOrder: Order) => void;
  onOpenInvoice?: (order: Order) => void;
}

export const OrderDetailDrawer: React.FC<OrderDetailDrawerProps> = ({
  order,
  isOpen,
  onClose,
  onOrderUpdated,
  onOpenInvoice,
}) => {
  const [internalNote, setInternalNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  if (!order) return null;

  // Pipeline lifecycle steps
  const steps: Array<{ status: OrderStatus; label: string; icon: React.ElementType }> = [
    { status: 'pending', label: 'Đặt hàng', icon: Clock },
    { status: 'confirmed', label: 'Xác nhận', icon: CheckCircle2 },
    { status: 'processing', label: 'Đóng gói', icon: Package },
    { status: 'shipping', label: 'Giao hàng', icon: Truck },
    { status: 'completed', label: 'Hoàn thành', icon: Check },
  ];

  const currentStepIndex = steps.findIndex((s) => s.status === order.status);

  // Status transition handlers
  const handleTransitionStatus = async (nextStatus: OrderStatus, noteText?: string) => {
    setIsUpdating(true);
    try {
      const updated = await orderService.updateOrderStatus(
        order.id,
        nextStatus,
        noteText,
        'Quản trị viên'
      );
      onOrderUpdated(updated);
      toast.success(`Đã chuyển trạng thái đơn hàng sang [${nextStatus.toUpperCase()}]`);
    } catch (err: any) {
      toast.error(err?.message || 'Lỗi khi cập nhật trạng thái đơn hàng.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkPaymentPaid = async () => {
    setIsUpdating(true);
    try {
      const updated = await orderService.updatePaymentStatus(order.id, 'paid');
      onOrderUpdated(updated);
      toast.success('Đã xác nhận thanh toán đơn hàng thành công!');
    } catch (err: any) {
      toast.error('Lỗi khi cập nhật thanh toán.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddTimelineNote = async () => {
    if (!internalNote.trim()) return;
    setIsUpdating(true);
    try {
      const updated = await orderService.updateOrderStatus(
        order.id,
        order.status,
        `Ghi chú nội bộ: ${internalNote.trim()}`,
        'Quản trị viên'
      );
      onOrderUpdated(updated);
      setInternalNote('');
      toast.success('Đã thêm ghi chú vào lịch sử đơn hàng!');
    } catch (err: any) {
      toast.error('Lỗi khi thêm ghi chú.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Hoàn thành</Badge>;
      case 'shipping':
        return <Badge variant="primary">Đang giao hàng</Badge>;
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

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      placement="right"
      size="xl"
      title={`Chi Tiết Đơn Hàng #${order.orderNumber}`}
      description={`Ngày đặt: ${new Date(order.createdAt).toLocaleDateString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })}`}
    >
      <div className="space-y-6 text-xs text-content-main p-1">
        {/* Top Badges & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-theme bg-surface-subtle border border-border-base">
          <div className="flex flex-wrap items-center gap-2">
            {getStatusBadge(order.status)}
            <Badge
              variant={order.paymentStatus === 'paid' ? 'success' : 'warning'}
              appearance="outline"
            >
              {order.paymentStatus === 'paid'
                ? 'Đã thanh toán'
                : 'Chưa thanh toán'}
            </Badge>
            <span className="text-content-muted font-medium">
              PT: <strong className="uppercase text-content-main">{order.paymentMethod}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenInvoice && (
              <button
                type="button"
                onClick={() => onOpenInvoice(order)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-theme bg-surface-card hover:bg-border-base border border-border-base text-content-main font-semibold shadow-xs transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In Hóa Đơn</span>
              </button>
            )}
            <Link
              to={`/admin/orders/${order.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-theme bg-surface-card hover:bg-border-base border border-border-base text-content-main font-semibold shadow-xs transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Trang riêng</span>
            </Link>
          </div>
        </div>

        {/* Visual Lifecycle Stepper */}
        {order.status === 'cancelled' ? (
          <div className="p-4 rounded-theme bg-rose-500/10 border border-rose-500/20 text-rose-600 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Đơn hàng này đã bị hủy</h4>
              <p className="text-xs text-rose-600/90 mt-0.5">
                {order.timeline?.find((t) => t.status === 'cancelled')?.description ||
                  'Đơn hàng đã được quản trị viên hoặc khách hàng hủy bỏ.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-theme bg-surface-card border border-border-base">
            <div className="flex items-center justify-between relative">
              {/* Stepper background line */}
              <div className="absolute left-4 right-4 top-4 h-0.5 bg-border-base -z-0" />
              {steps.map((st, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div key={st.status} className="flex flex-col items-center gap-1.5 z-10">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-xs ${
                        isPassed
                          ? 'bg-primary text-white ring-4 ring-primary/20'
                          : 'bg-surface-subtle text-content-muted border border-border-base'
                      }`}
                    >
                      <st.icon className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-[11px] font-semibold ${
                        isCurrent
                          ? 'text-primary'
                          : isPassed
                          ? 'text-content-main'
                          : 'text-content-muted'
                      }`}
                    >
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Contextual Status Action Buttons */}
        <div className="p-4 rounded-theme bg-surface-subtle border border-border-base space-y-2">
          <div className="font-bold text-content-muted uppercase tracking-wider text-[11px]">
            Thao Tác Chuyển Trạng Thái
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {order.status === 'pending' && (
              <>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleTransitionStatus('confirmed')}
                  className="px-3 py-1.5 rounded-theme bg-primary text-white font-semibold hover:bg-primary-hover shadow-xs transition-colors"
                >
                  Xác nhận đơn hàng
                </button>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleTransitionStatus('cancelled', 'Quản trị viên hủy đơn.')}
                  className="px-3 py-1.5 rounded-theme bg-status-danger text-white font-semibold hover:bg-red-700 shadow-xs transition-colors"
                >
                  Hủy đơn
                </button>
              </>
            )}

            {order.status === 'confirmed' && (
              <>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleTransitionStatus('processing')}
                  className="px-3 py-1.5 rounded-theme bg-primary text-white font-semibold hover:bg-primary-hover shadow-xs transition-colors"
                >
                  Bắt đầu đóng gói
                </button>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleTransitionStatus('cancelled', 'Khách đổi ý hủy đơn.')}
                  className="px-3 py-1.5 rounded-theme bg-status-danger text-white font-semibold hover:bg-red-700 shadow-xs transition-colors"
                >
                  Hủy đơn
                </button>
              </>
            )}

            {order.status === 'processing' && (
              <>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleTransitionStatus('shipping')}
                  className="px-3 py-1.5 rounded-theme bg-primary text-white font-semibold hover:bg-primary-hover shadow-xs transition-colors"
                >
                  Bàn giao vận chuyển
                </button>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleTransitionStatus('cancelled', 'Hết hàng / sự cố kho.')}
                  className="px-3 py-1.5 rounded-theme bg-status-danger text-white font-semibold hover:bg-red-700 shadow-xs transition-colors"
                >
                  Hủy đơn
                </button>
              </>
            )}

            {order.status === 'shipping' && (
              <>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleTransitionStatus('completed')}
                  className="px-3 py-1.5 rounded-theme bg-emerald-600 text-white font-semibold hover:bg-emerald-700 shadow-xs transition-colors"
                >
                  Xác nhận giao thành công
                </button>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleTransitionStatus('cancelled', 'Giao thất bại / hoàn hàng.')}
                  className="px-3 py-1.5 rounded-theme bg-status-danger text-white font-semibold hover:bg-red-700 shadow-xs transition-colors"
                >
                  Hủy / Giao thất bại
                </button>
              </>
            )}

            {/* Quick Payment update if unpaid */}
            {order.paymentStatus === 'pending' && (
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleMarkPaymentPaid}
                className="px-3 py-1.5 rounded-theme bg-emerald-600 text-white font-semibold hover:bg-emerald-700 shadow-xs transition-colors"
              >
                Xác nhận đã thanh toán
              </button>
            )}
          </div>
        </div>

        {/* Customer & Shipping Information Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-theme bg-surface-card border border-border-base space-y-2">
            <h4 className="font-bold text-content-main uppercase text-[11px] tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-primary" />
              <span>Khách Hàng</span>
            </h4>
            <div className="font-semibold text-content-main text-sm">{order.customer.name}</div>
            <div>SĐT: <strong className="text-content-main">{order.customer.phone}</strong></div>
            <div>Email: {order.customer.email || 'N/A'}</div>
            {order.customerId && (
              <Link
                to={`/admin/customers/${order.customerId}`}
                className="inline-flex items-center gap-1 text-[11px] text-primary font-semibold hover:underline pt-1"
              >
                <span>Hồ sơ CRM khách hàng</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>

          <div className="p-4 rounded-theme bg-surface-card border border-border-base space-y-2">
            <h4 className="font-bold text-content-main uppercase text-[11px] tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>Địa Chỉ Giao Hàng</span>
            </h4>
            <p className="text-content-muted leading-relaxed">
              {order.customer.address?.fullAddress ||
                `${order.customer.address?.street}, ${order.customer.address?.ward}, ${order.customer.address?.district}, ${order.customer.address?.province}`}
            </p>
            {order.notes && (
              <p className="text-[11px] italic text-content-muted pt-1">
                Ghi chú: {order.notes}
              </p>
            )}
          </div>
        </div>

        {/* Itemized Table */}
        <div className="p-4 rounded-theme bg-surface-card border border-border-base space-y-3">
          <h4 className="font-bold text-content-main uppercase text-[11px] tracking-wider">
            Sản Phẩm Trong Đơn ({order.items.length} mặt hàng)
          </h4>
          <div className="divide-y divide-border-base">
            {order.items.map((it, idx) => (
              <div key={it.id || idx} className="py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={it.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                    alt={it.title}
                    className="w-10 h-10 rounded object-cover flex-shrink-0 bg-surface-subtle border border-border-base"
                  />
                  <div className="min-w-0">
                    <div className="font-semibold text-content-main truncate">{it.title}</div>
                    <div className="text-[11px] text-content-muted">
                      SKU: {it.sku || 'N/A'}{' '}
                      {it.variantName && <span>| {it.variantName}</span>}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-content-main">
                    {formatCurrencyVND(it.totalPrice || it.price * it.quantity)}
                  </div>
                  <div className="text-[11px] text-content-muted">
                    {formatCurrencyVND(it.price)} × {it.quantity}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Financial Breakdown */}
          <div className="border-t border-border-base pt-3 space-y-1.5 text-xs text-content-muted">
            <div className="flex justify-between">
              <span>Tạm tính tiền hàng:</span>
              <span className="font-semibold text-content-main">
                {formatCurrencyVND(order.subtotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Phí giao hàng:</span>
              <span className="font-semibold text-content-main">
                {order.shippingFee > 0 ? formatCurrencyVND(order.shippingFee) : 'Miễn phí'}
              </span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Giảm giá ({order.couponCode || 'Voucher'}):</span>
                <span className="font-semibold">-{formatCurrencyVND(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black text-content-main pt-1 border-t border-border-base">
              <span>Tổng tiền thanh toán:</span>
              <span className="text-primary text-base">{formatCurrencyVND(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Timeline Audit Log */}
        <div className="p-4 rounded-theme bg-surface-card border border-border-base space-y-3">
          <h4 className="font-bold text-content-main uppercase text-[11px] tracking-wider flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-primary" />
            <span>Lịch Sử Thao Tác & Timeline Sự Kiện</span>
          </h4>

          {/* Internal Note Input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Thêm ghi chú nội bộ cho đơn hàng này..."
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTimelineNote();
                }
              }}
              className="flex-1 bg-surface-subtle border border-border-base rounded px-3 py-1.5 text-xs text-content-main focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              disabled={!internalNote.trim() || isUpdating}
              onClick={handleAddTimelineNote}
              className="px-3 py-1.5 rounded bg-primary text-white font-semibold text-xs hover:bg-primary-hover disabled:opacity-40 transition-colors"
            >
              + Ghi chú
            </button>
          </div>

          {/* Timeline Events List */}
          <div className="space-y-3 pt-2">
            {(order.timeline || []).map((tl, idx) => (
              <div key={tl.id || idx} className="flex items-start gap-3 text-xs">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-content-main">{tl.title}</span>
                    <span className="text-[10px] text-content-muted">
                      {new Date(tl.timestamp).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      {new Date(tl.timestamp).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <p className="text-content-muted mt-0.5">{tl.description}</p>
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-surface-subtle text-content-muted border border-border-base">
                    {tl.actor || 'Hệ thống'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Drawer>
  );
};

export default OrderDetailDrawer;
