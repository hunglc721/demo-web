import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Home,
  LoaderCircle,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Truck,
} from 'lucide-react';
import { orderService } from '@/services/api/orderService';
import { Order } from '@/types';
import { formatCurrencyVND } from '@/utils/formatters';
import { toast } from '@/stores/toastStore';
import { VietQRModal } from '../components/VietQRModal';

export const OrderSuccessPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const effectiveOrderId = orderId || searchParams.get('orderId') || searchParams.get('id');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [qrImageError, setQrImageError] = useState(false);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);

  useEffect(() => {
    if (!effectiveOrderId) {
      setMissing(true);
      setLoading(false);
      return;
    }

    orderService
      .getOrderById(effectiveOrderId)
      .then((result) => {
        if (result) {
          setOrder(result);
          setMissing(false);
        } else {
          // Fallback: check by orderNumber
          return orderService.getOrderByNumber(effectiveOrderId);
        }
      })
      .then((byNumber) => {
        if (byNumber) {
          setOrder(byNumber);
          setMissing(false);
        } else if (!order) {
          setMissing(true);
        }
      })
      .catch(() => setMissing(true))
      .finally(() => setLoading(false));
  }, [effectiveOrderId]);

  const transferContent = order?.orderNumber || effectiveOrderId || '';
  const accountNumber = order?.paymentDetails?.accountNumber || '9999888826';
  const accountName = order?.paymentDetails?.accountName || 'D2C STORE VIETNAM';
  const bankName = order?.paymentDetails?.bankName || 'MB Bank';

  const qrUrl = useMemo(() => {
    if (!order || order.paymentMethod !== 'vietqr') return '';
    const params = new URLSearchParams({
      amount: String(order.total),
      addInfo: transferContent,
      accountName,
    });
    return `https://img.vietqr.io/image/MB-${accountNumber}-compact2.png?${params.toString()}`;
  }, [accountName, accountNumber, order, transferContent]);

  const copyText = async (value: string, key: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      toast.success(`Đã sao chép ${label}.`);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast.info(value);
    }
  };

  const handleSimulatePaymentSuccess = async () => {
    if (!order || isUpdatingPayment) return;
    setIsUpdatingPayment(true);
    try {
      const updated = await orderService.updatePaymentStatus(
        order.id,
        'paid',
        `TX_DEMO_${Date.now().toString().slice(-6)}`
      );
      setOrder(updated);
      toast.success('Xác nhận thanh toán mô phỏng thành công!');
    } catch {
      toast.error('Lỗi khi cập nhật trạng thái thanh toán.');
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-content-muted">Đang tải thông tin đơn hàng...</p>
      </div>
    );
  }

  if (missing || !order) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-status-danger/10 text-status-danger">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold text-content-main">Không tìm thấy đơn hàng</h1>
        <p className="text-xs text-content-muted">
          Mã đơn hàng &quot;{effectiveOrderId}&quot; không tồn tại hoặc đã được tạo trong phiên làm việc khác.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link
            to="/order-lookup"
            className="rounded-theme bg-primary px-4 py-2 text-xs font-semibold text-white"
          >
            Tra cứu đơn hàng
          </Link>
          <Link
            to="/"
            className="rounded-theme border border-border-base px-4 py-2 text-xs font-semibold text-content-main"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const isPaid = order.paymentStatus === 'paid';

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      {/* 1. Success Notification Hero Banner */}
      <section className="space-y-4 rounded-theme border border-border-base bg-surface-card p-6 sm:p-8 text-center shadow-xs">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-status-success/10 text-status-success">
          <CheckCircle2 className="h-10 w-10" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-content-main sm:text-3xl">Đặt hàng thành công!</h1>
          <p className="mt-2 text-xs sm:text-sm text-content-muted">
            Cảm ơn bạn đã tin tưởng mua sắm tại D2C Store. Đơn hàng của bạn đã được ghi nhận vào hệ thống.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-theme bg-surface-subtle border border-border-base px-4 py-2">
            <span className="text-xs text-content-muted">Mã đơn hàng:</span>
            <span className="font-mono text-base font-bold text-primary">{order.orderNumber}</span>
            <button
              type="button"
              onClick={() => copyText(order.orderNumber, 'ord', 'mã đơn hàng')}
              className="text-primary hover:opacity-80 p-0.5"
              title="Sao chép mã đơn hàng"
              aria-label="Sao chép mã đơn hàng"
            >
              {copiedKey === 'ord' ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Customer & Shipping Summary */}
        <div className="rounded-theme bg-surface-subtle p-4 text-xs text-content-muted space-y-1.5 text-left border border-border-base/50">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span>
              Người nhận: <strong className="text-content-main">{order.customer.name}</strong>
            </span>
            <span>
              Số điện thoại: <strong className="text-content-main">{order.customer.phone}</strong>
            </span>
          </div>
          <div>
            Địa chỉ nhận hàng:{' '}
            <strong className="text-content-main">{order.customer.address.fullAddress}</strong>
          </div>
          {order.notes && (
            <div>
              Ghi chú đơn hàng: <span className="italic text-content-main">&quot;{order.notes}&quot;</span>
            </div>
          )}
        </div>
      </section>

      {/* 2. Direct Link to Admin Backoffice (MANDATORY REQUIREMENT) */}
      <section className="rounded-theme border border-primary/25 bg-primary/5 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="space-y-0.5 text-center sm:text-left">
          <div className="font-bold text-sm text-content-main flex items-center justify-center sm:justify-start gap-1.5">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>Xem đơn hàng trong Quản trị (Admin Backoffice)</span>
          </div>
          <p className="text-xs text-content-muted">
            Truy cập giao diện quản trị để duyệt trạng thái, cập nhật vận đơn và in phiếu giao hàng.
          </p>
        </div>
        <Link
          to={`/admin/orders/${order.id}`}
          className="inline-flex items-center justify-center gap-1.5 rounded-theme bg-primary px-4 py-2.5 text-xs font-bold text-white hover:bg-primary-hover shadow-xs transition-colors whitespace-nowrap"
        >
          <span>Mở Backoffice</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </section>

      {/* 3. Payment Method Section */}
      {order.paymentMethod === 'vietqr' && (
        <section className="space-y-4 rounded-theme border border-border-base bg-surface-card p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-border-base pb-3">
            <h2 className="flex items-center gap-2 text-sm font-bold text-content-main">
              <QrCode className="h-4 w-4 text-primary" />
              <span>Thanh toán chuyển khoản VietQR</span>
            </h2>
            <span
              className={`rounded px-2 py-0.5 text-xs font-bold ${
                isPaid ? 'bg-status-success/15 text-status-success' : 'bg-amber-500/15 text-amber-700'
              }`}
            >
              {isPaid ? '✓ Đã thanh toán' : 'Chờ chuyển khoản'}
            </span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 items-center">
            {/* Account Details */}
            <div className="space-y-2.5 text-xs">
              <p className="text-content-muted">
                Quét mã QR bằng ứng dụng ngân hàng bất kỳ để chuyển khoản chính xác:
              </p>

              <div className="rounded-theme bg-surface-subtle p-3 space-y-2 border border-border-base">
                <div className="flex justify-between items-center">
                  <span className="text-content-muted">Ngân hàng:</span>
                  <span className="font-semibold text-content-main">{bankName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-content-muted">Số tài khoản:</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-content-main">
                    <span>{accountNumber}</span>
                    <button
                      type="button"
                      onClick={() => copyText(accountNumber, 'acc', 'số tài khoản')}
                      className="text-primary hover:opacity-80 p-0.5"
                    >
                      {copiedKey === 'acc' ? (
                        <Check className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-content-muted">Chủ tài khoản:</span>
                  <span className="font-semibold text-content-main uppercase">{accountName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-content-muted">Số tiền:</span>
                  <div className="flex items-center gap-1.5 font-bold text-primary text-sm">
                    <span>{formatCurrencyVND(order.total)}</span>
                    <button
                      type="button"
                      onClick={() => copyText(String(order.total), 'amt', 'số tiền')}
                      className="text-primary hover:opacity-80 p-0.5"
                    >
                      {copiedKey === 'amt' ? (
                        <Check className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-content-muted">Nội dung:</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-content-main">
                    <span>{transferContent}</span>
                    <button
                      type="button"
                      onClick={() => copyText(transferContent, 'memo', 'nội dung chuyển')}
                      className="text-primary hover:opacity-80 p-0.5"
                    >
                      {copiedKey === 'memo' ? (
                        <Check className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {!isPaid && (
                <button
                  type="button"
                  disabled={isUpdatingPayment}
                  onClick={handleSimulatePaymentSuccess}
                  className="w-full rounded-theme bg-status-success/10 border border-status-success/30 py-2.5 text-xs font-bold text-status-success hover:bg-status-success hover:text-white transition-colors"
                >
                  {isUpdatingPayment
                    ? 'Đang cập nhật...'
                    : '✓ Tôi đã chuyển khoản xong (Mô phỏng)'}
                </button>
              )}
            </div>

            {/* QR Code Graphic */}
            <div className="flex flex-col items-center justify-center rounded-theme border border-border-base bg-white p-4">
              {!qrImageError ? (
                <img
                  src={qrUrl}
                  alt={`VietQR cho đơn hàng ${order.orderNumber}`}
                  className="aspect-square w-full max-w-48 object-contain"
                  onError={() => setQrImageError(true)}
                />
              ) : (
                <div className="aspect-square w-full max-w-48 flex flex-col items-center justify-center p-3 text-center bg-gray-50 text-gray-500 rounded">
                  <QrCode className="h-10 w-10 text-primary mb-1 opacity-60" />
                  <span className="text-[11px] font-semibold">Chế độ ngoại tuyến</span>
                  <span className="text-[10px] mt-0.5">Chuyển theo số tài khoản bên cạnh</span>
                </div>
              )}
              <span className="text-[10px] text-gray-500 mt-2 font-medium">
                Mã QR chuẩn Napas 247 • MB Bank
              </span>
              <button
                type="button"
                onClick={() => setIsQRModalOpen(true)}
                className="mt-2 text-xs font-semibold text-primary hover:underline"
              >
                Xem mã QR phóng to
              </button>
            </div>
          </div>
        </section>
      )}

      {order.paymentMethod === 'momo' && (
        <section className="space-y-3 rounded-theme border border-border-base bg-surface-card p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-border-base pb-3">
            <h2 className="flex items-center gap-2 text-sm font-bold text-content-main">
              <Smartphone className="h-4 w-4 text-pink-600" />
              <span>Thanh toán Ví MoMo</span>
            </h2>
            <span
              className={`rounded px-2 py-0.5 text-xs font-bold ${
                isPaid ? 'bg-status-success/15 text-status-success' : 'bg-pink-500/15 text-pink-700'
              }`}
            >
              {isPaid ? '✓ Đã thanh toán' : 'Chờ xác nhận MoMo'}
            </span>
          </div>

          <p className="text-xs text-content-muted">
            Vui lòng mở ứng dụng Ví MoMo và chuyển số tiền{' '}
            <strong className="text-primary">{formatCurrencyVND(order.total)}</strong> đến số điện thoại:{' '}
            <strong className="text-content-main">0918.889.999</strong> (D2C STORE VIETNAM) với lời nhắn{' '}
            <strong className="text-content-main">{order.orderNumber}</strong>.
          </p>

          {!isPaid && (
            <button
              type="button"
              disabled={isUpdatingPayment}
              onClick={handleSimulatePaymentSuccess}
              className="mt-2 rounded-theme bg-pink-500/10 border border-pink-500/30 px-4 py-2 text-xs font-bold text-pink-700 hover:bg-pink-600 hover:text-white transition-colors"
            >
              {isUpdatingPayment ? 'Đang cập nhật...' : '✓ Xác nhận đã chuyển MoMo (Mô phỏng)'}
            </button>
          )}
        </section>
      )}

      {order.paymentMethod === 'card' && (
        <section className="rounded-theme border border-border-base bg-surface-card p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between border-b border-border-base pb-3">
            <h2 className="flex items-center gap-2 text-sm font-bold text-content-main">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Thanh toán Thẻ quốc tế (Visa / MasterCard)</span>
            </h2>
            <span className="rounded bg-status-success/15 px-2 py-0.5 text-xs font-bold text-status-success">
              ✓ Đã thanh toán thành công
            </span>
          </div>
          <p className="text-xs text-content-muted">
            Giao dịch sandbox{' '}
            <span className="font-mono font-semibold text-content-main">
              {order.paymentDetails?.transactionId || 'TX_APPROVED'}
            </span>{' '}
            đã được xác thực an toàn.
          </p>
        </section>
      )}

      {order.paymentMethod === 'cod' && (
        <section className="rounded-theme border border-border-base bg-surface-card p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between border-b border-border-base pb-3">
            <h2 className="flex items-center gap-2 text-sm font-bold text-content-main">
              <Truck className="h-4 w-4 text-primary" />
              <span>Thanh toán khi nhận hàng (COD)</span>
            </h2>
            <span className="rounded bg-surface-subtle px-2 py-0.5 text-xs font-bold text-content-main">
              Thu tiền mặt khi giao
            </span>
          </div>
          <p className="text-xs text-content-muted">
            Bạn vui lòng thanh toán chính xác{' '}
            <strong className="text-primary">{formatCurrencyVND(order.total)}</strong> bằng tiền mặt
            cho nhân viên bưu tá khi nhận được kiện hàng.
          </p>
        </section>
      )}

      {/* 4. Order Items & Financial Recap */}
      <section className="rounded-theme border border-border-base bg-surface-card p-5 shadow-xs space-y-4">
        <h2 className="font-bold text-sm text-content-main border-b border-border-base pb-2">
          Chi tiết sản phẩm đã đặt ({order.items.length})
        </h2>

        <div className="space-y-2 divide-y divide-border-base/50">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between gap-3 pt-2 text-xs sm:text-sm">
              <div className="min-w-0 flex-1">
                <span className="font-medium text-content-main">{item.title}</span>
                {item.variantName && (
                  <span className="ml-1 text-content-muted text-xs">({item.variantName})</span>
                )}
                <span className="ml-2 text-content-muted">× {item.quantity}</span>
              </div>
              <span className="font-semibold text-content-main whitespace-nowrap">
                {formatCurrencyVND(item.totalPrice)}
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-1.5 border-t border-border-base pt-3 text-xs sm:text-sm text-content-muted">
          <div className="flex justify-between">
            <span>Tạm tính</span>
            <span className="font-semibold text-content-main">
              {formatCurrencyVND(order.subtotal)}
            </span>
          </div>

          <div className="flex justify-between">
            <span>Phí vận chuyển</span>
            <span className="font-semibold text-content-main">
              {order.shippingFee === 0 ? (
                <span className="text-status-success">Miễn phí</span>
              ) : (
                formatCurrencyVND(order.shippingFee)
              )}
            </span>
          </div>

          {order.discount > 0 && (
            <div className="flex justify-between text-status-success font-semibold">
              <span>Voucher giảm giá {order.couponCode ? `(${order.couponCode})` : ''}</span>
              <span>-{formatCurrencyVND(order.discount)}</span>
            </div>
          )}

          <div className="flex justify-between border-t border-border-base pt-2 text-base font-bold text-content-main">
            <span>Tổng cộng</span>
            <span className="text-lg text-primary">{formatCurrencyVND(order.total)}</span>
          </div>
        </div>
      </section>

      {/* 5. Next Action Navigation */}
      <div className="grid gap-3 sm:grid-cols-2 pt-2">
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 rounded-theme bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-hover transition-colors shadow-xs"
        >
          <Home className="h-4 w-4" />
          <span>Về trang chủ</span>
        </Link>
        <Link
          to="/order-lookup"
          state={{ orderNumber: order.orderNumber }}
          className="inline-flex items-center justify-center gap-2 rounded-theme border border-border-base bg-surface-card px-4 py-3 text-sm font-semibold text-content-main hover:bg-surface-subtle transition-colors shadow-2xs"
        >
          <ShoppingBag className="h-4 w-4" />
          <span>Tra cứu đơn hàng</span>
        </Link>
      </div>

      {/* VietQR enlarged modal */}
      <VietQRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        orderNumber={order.orderNumber}
        amount={order.total}
        bankName={bankName}
        accountNumber={accountNumber}
        accountName={accountName}
      />
    </div>
  );
};

export default OrderSuccessPage;
