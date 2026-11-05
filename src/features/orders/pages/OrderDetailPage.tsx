import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  AlertCircle,
  Check,
  User,
  MapPin,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { orderService } from '@/services/api/orderService';
import { Order, OrderStatus } from '@/types/order';
import { Badge } from '@/core/components/Badge';
import { formatCurrencyVND } from '@/utils/formatters';
import { InvoiceModal } from '../components/InvoiceModal';
import { toast } from '@/stores/toastStore';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [internalNote, setInternalNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadOrder() {
      if (!id) return;
      setLoading(true);
      try {
        let found = await orderService.getOrderById(id);
        if (!found) {
          found = await orderService.getOrderByNumber(id);
        }
        if (isMounted) {
          if (found) {
            setOrder(found);
          } else {
            toast.error('Không tìm thấy đơn hàng.', { title: 'Lỗi' });
            navigate('/admin/orders');
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadOrder();
    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="py-20 text-center text-content-muted">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-3" />
        <p className="text-xs font-semibold">Đang tải chi tiết đơn hàng...</p>
      </div>
    );
  }

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
      setOrder(updated);
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
      setOrder(updated);
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
      setOrder(updated);
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
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-base pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/orders"
            className="p-2 rounded-theme border border-border-base hover:bg-surface-subtle text-content-muted hover:text-content-main transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-content-main tracking-tight">
              Đơn Hàng #{order.orderNumber}
            </h1>
            <p className="text-xs text-content-muted mt-0.5">
              Ngày đặt: {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsInvoiceOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-theme bg-surface-card hover:bg-surface-subtle border border-border-base text-content-main text-xs font-semibold shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In Phiếu Giao Hàng</span>
          </button>
        </div>
      </div>

      {/* Top Badges & Lifecycle Stepper */}
      <div className="p-6 rounded-theme bg-surface-card border border-border-base shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-base pb-4">
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
            <span className="text-xs text-content-muted font-medium">
              Phương thức: <strong className="uppercase text-content-main">{order.paymentMethod}</strong>
            </span>
          </div>
        </div>

        {/* Stepper */}
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
          <div className="p-4 rounded-theme bg-surface-subtle border border-border-base">
            <div className="flex items-center justify-between relative max-w-2xl mx-auto">
              <div className="absolute left-6 right-6 top-4 h-0.5 bg-border-base -z-0" />
              {steps.map((st, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div key={st.status} className="flex flex-col items-center gap-1.5 z-10">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-xs ${
                        isPassed
                          ? 'bg-primary text-white ring-4 ring-primary/20'
                          : 'bg-surface-card text-content-muted border border-border-base'
                      }`}
                    >
                      <st.icon className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-xs font-semibold ${
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
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {order.status === 'pending' && (
            <>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleTransitionStatus('confirmed')}
                className="px-4 py-2 rounded-theme bg-primary text-white font-semibold text-xs hover:bg-primary-hover shadow-xs transition-colors"
              >
                Xác nhận đơn hàng
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleTransitionStatus('cancelled', 'Quản trị viên hủy đơn.')}
                className="px-4 py-2 rounded-theme bg-status-danger text-white font-semibold text-xs hover:bg-red-700 shadow-xs transition-colors"
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
                className="px-4 py-2 rounded-theme bg-primary text-white font-semibold text-xs hover:bg-primary-hover shadow-xs transition-colors"
              >
                Bắt đầu đóng gói
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleTransitionStatus('cancelled', 'Khách đổi ý hủy đơn.')}
                className="px-4 py-2 rounded-theme bg-status-danger text-white font-semibold text-xs hover:bg-red-700 shadow-xs transition-colors"
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
                className="px-4 py-2 rounded-theme bg-primary text-white font-semibold text-xs hover:bg-primary-hover shadow-xs transition-colors"
              >
                Bàn giao vận chuyển
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleTransitionStatus('cancelled', 'Hết hàng / sự cố kho.')}
                className="px-4 py-2 rounded-theme bg-status-danger text-white font-semibold text-xs hover:bg-red-700 shadow-xs transition-colors"
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
                className="px-4 py-2 rounded-theme bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 shadow-xs transition-colors"
              >
                Xác nhận giao thành công
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleTransitionStatus('cancelled', 'Giao thất bại / hoàn hàng.')}
                className="px-4 py-2 rounded-theme bg-status-danger text-white font-semibold text-xs hover:bg-red-700 shadow-xs transition-colors"
              >
                Hủy / Giao thất bại
              </button>
            </>
          )}

          {order.paymentStatus === 'pending' && (
            <button
              type="button"
              disabled={isUpdating}
              onClick={handleMarkPaymentPaid}
              className="px-4 py-2 rounded-theme bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 shadow-xs transition-colors"
            >
              Xác nhận đã thanh toán
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Items & Customer (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Shipping Card */}
          <div className="p-6 rounded-theme bg-surface-card border border-border-base shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-content-main uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <span>Thông Tin Khách Hàng & Giao Nhận</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5 p-3 rounded-theme bg-surface-subtle">
                <div className="font-semibold text-content-main text-sm">{order.customer.name}</div>
                <div>Điện thoại: <strong className="text-content-main">{order.customer.phone}</strong></div>
                <div>Email: {order.customer.email || 'N/A'}</div>
                {order.customerId && (
                  <Link
                    to={`/admin/customers/${order.customerId}`}
                    className="inline-flex items-center gap-1 text-[11px] text-primary font-semibold hover:underline pt-1"
                  >
                    <span>Xem CRM khách hàng</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>

              <div className="space-y-1.5 p-3 rounded-theme bg-surface-subtle">
                <div className="font-semibold text-content-main flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span>Địa chỉ giao hàng</span>
                </div>
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
          </div>

          {/* Items Table */}
          <div className="p-6 rounded-theme bg-surface-card border border-border-base shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-content-main uppercase tracking-wider">
              Sản Phẩm Trong Đơn Hàng ({order.items.length} món)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border-base text-content-muted font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3">Sản Phẩm</th>
                    <th className="py-2.5 px-3 text-center">SL</th>
                    <th className="py-2.5 px-3 text-right">Đơn Giá</th>
                    <th className="py-2.5 px-3 text-right">Thành Tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-base">
                  {order.items.map((it, idx) => (
                    <tr key={it.id || idx}>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={it.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                            alt={it.title}
                            className="w-10 h-10 rounded object-cover flex-shrink-0 bg-surface-subtle border border-border-base"
                          />
                          <div>
                            <div className="font-bold text-content-main">{it.title}</div>
                            <div className="text-[11px] text-content-muted font-mono">
                              SKU: {it.sku || 'N/A'}{' '}
                              {it.variantName && <span>| {it.variantName}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-content-main">
                        {it.quantity}
                      </td>
                      <td className="py-3 px-3 text-right text-content-muted">
                        {formatCurrencyVND(it.price)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-content-main">
                        {formatCurrencyVND(it.totalPrice || it.price * it.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="border-t border-border-base pt-4 space-y-2 text-xs text-content-muted max-w-sm ml-auto">
              <div className="flex justify-between">
                <span>Tạm tính tiền hàng:</span>
                <span className="font-semibold text-content-main">
                  {formatCurrencyVND(order.subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Phí vận chuyển:</span>
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
              <div className="flex justify-between text-base font-black text-content-main pt-2 border-t border-border-base">
                <span>Tổng cộng:</span>
                <span className="text-primary">{formatCurrencyVND(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Timeline Audit Log (1 col) */}
        <div className="space-y-6">
          <div className="p-6 rounded-theme bg-surface-card border border-border-base shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-content-main uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span>Nhật Ký & Timeline Đơn</span>
            </h3>

            {/* Add note */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ghi chú nội bộ..."
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
                Lưu
              </button>
            </div>

            {/* Event list */}
            <div className="space-y-3 pt-2">
              {(order.timeline || []).map((tl, idx) => (
                <div key={tl.id || idx} className="flex items-start gap-3 text-xs border-l-2 border-primary/30 pl-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-content-main">{tl.title}</div>
                    <p className="text-content-muted mt-0.5">{tl.description}</p>
                    <div className="flex items-center justify-between text-[10px] text-content-muted mt-1">
                      <span>{tl.actor || 'Hệ thống'}</span>
                      <span>
                        {new Date(tl.timestamp).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        {new Date(tl.timestamp).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Modal */}
      <InvoiceModal
        order={order}
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
      />
    </div>
  );
};

export default OrderDetailPage;
