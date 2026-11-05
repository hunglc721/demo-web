import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Copy, Home, LoaderCircle, QrCode, ShoppingBag } from 'lucide-react';
import { orderService } from '@/services/api/orderService';
import { Order } from '@/types';
import { formatCurrencyVND } from '@/utils/formatters';
import { toast } from '@/stores/toastStore';

export const OrderSuccessPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!orderId) { setMissing(true); setLoading(false); return; }
    orderService.getOrderById(orderId).then(result => {
      setOrder(result);
      setMissing(!result);
    }).catch(() => setMissing(true)).finally(() => setLoading(false));
  }, [orderId]);

  const transferContent = order?.orderNumber || orderId || '';
  const accountNumber = order?.paymentDetails?.accountNumber || '9999888826';
  const accountName = order?.paymentDetails?.accountName || 'D2C STORE VIETNAM';
  const qrUrl = useMemo(() => {
    if (!order || order.paymentMethod !== 'vietqr') return '';
    const params = new URLSearchParams({ amount: String(order.total), addInfo: transferContent, accountName });
    return `https://img.vietqr.io/image/MB-${accountNumber}-compact2.png?${params.toString()}`;
  }, [accountName, accountNumber, order, transferContent]);

  const copyText = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`Đã sao chép ${label}.`);
    } catch {
      toast.info(value);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><LoaderCircle className="h-7 w-7 animate-spin text-primary" /></div>;
  if (missing || !order) return <div className="mx-auto max-w-md space-y-4 px-4 py-16 text-center"><h1 className="text-xl font-bold">Không tìm thấy đơn hàng</h1><Link to="/order-lookup" className="text-primary">Tra cứu đơn hàng</Link></div>;

  return <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-10">
    <section className="space-y-4 rounded-theme border border-border-base bg-surface-card p-7 text-center shadow-sm"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-status-success/10 text-status-success"><CheckCircle2 className="h-10 w-10" /></div><div><h1 className="text-2xl font-bold text-content-main">Đặt hàng thành công!</h1><p className="mt-2 text-sm text-content-muted">Cảm ơn bạn đã mua sắm. Mã đơn hàng của bạn:</p><button onClick={() => copyText(order.orderNumber, 'mã đơn hàng')} className="mt-2 inline-flex items-center gap-2 rounded bg-surface-subtle px-3 py-1.5 font-mono text-base font-bold text-primary">{order.orderNumber}<Copy className="h-3.5 w-3.5" /></button></div>
      <div className="space-y-1 text-sm text-content-muted"><p>Người nhận: <span className="font-medium text-content-main">{order.customer.name}</span></p><p>Số điện thoại: <span className="font-medium text-content-main">{order.customer.phone}</span></p><p>Địa chỉ: <span className="font-medium text-content-main">{order.customer.address.fullAddress}</span></p></div>
    </section>
    {order.paymentMethod === 'vietqr' ? <section className="grid gap-5 rounded-theme border border-border-base bg-surface-card p-5 sm:grid-cols-2"><div className="space-y-3 text-sm"><h2 className="flex items-center gap-2 font-bold"><QrCode className="h-4 w-4 text-primary" /> Chuyển khoản VietQR</h2><p className="text-xs text-content-muted">Đây là tài khoản demo của dự án UI-only. Không chuyển tiền thật.</p><InfoRow label="Ngân hàng" value="MB Bank" /><InfoRow label="Số tài khoản" value={accountNumber} copy={() => copyText(accountNumber, 'số tài khoản')} /><InfoRow label="Chủ tài khoản" value={accountName} /><InfoRow label="Số tiền" value={formatCurrencyVND(order.total)} copy={() => copyText(String(order.total), 'số tiền')} /><InfoRow label="Nội dung" value={transferContent} copy={() => copyText(transferContent, 'nội dung chuyển khoản')} /></div><div className="flex flex-col items-center justify-center rounded border border-border-base bg-white p-3"><img src={qrUrl} alt={`VietQR cho đơn ${order.orderNumber}`} className="aspect-square w-full max-w-56" /><span className="text-[10px] text-gray-500">Mã QR demo • MB Bank</span></div></section> : <section className="rounded-theme border border-border-base bg-surface-card p-5"><h2 className="font-bold">Thanh toán khi nhận hàng</h2><p className="mt-1 text-sm text-content-muted">Bạn thanh toán {formatCurrencyVND(order.total)} khi đơn hàng được giao tới.</p></section>}
    <section className="rounded-theme border border-border-base bg-surface-card p-5"><h2 className="mb-3 font-bold">Chi tiết đơn hàng</h2><div className="space-y-2">{order.items.map(item => <div key={item.id} className="flex justify-between gap-3 text-sm"><span className="text-content-muted">{item.title}{item.variantName ? ` · ${item.variantName}` : ''} × {item.quantity}</span><span className="whitespace-nowrap">{formatCurrencyVND(item.totalPrice)}</span></div>)}</div><div className="mt-3 space-y-1 border-t border-border-base pt-3 text-sm"><div className="flex justify-between"><span>Tạm tính</span><span>{formatCurrencyVND(order.subtotal)}</span></div><div className="flex justify-between"><span>Vận chuyển</span><span>{order.shippingFee ? formatCurrencyVND(order.shippingFee) : 'Miễn phí'}</span></div>{order.discount > 0 && <div className="flex justify-between text-status-success"><span>Giảm giá</span><span>-{formatCurrencyVND(order.discount)}</span></div>}<div className="flex justify-between font-bold"><span>Tổng cộng</span><span>{formatCurrencyVND(order.total)}</span></div></div></section>
    <div className="grid gap-3 sm:grid-cols-2"><Link to="/" className="inline-flex items-center justify-center gap-2 rounded-theme bg-primary px-4 py-3 text-sm font-semibold text-white"><Home className="h-4 w-4" /> Về trang chủ</Link><Link to="/order-lookup" state={{ orderNumber: order.orderNumber }} className="inline-flex items-center justify-center gap-2 rounded-theme border border-border-base bg-surface-card px-4 py-3 text-sm font-semibold text-content-main"><ShoppingBag className="h-4 w-4" /> Tra cứu đơn hàng</Link></div>
  </div>;
};

const InfoRow: React.FC<{ label: string; value: string; copy?: () => void }> = ({ label, value, copy }) => <div className="flex items-start justify-between gap-2"><span className="text-content-muted">{label}</span><span className="flex items-center gap-1 text-right font-semibold">{value}{copy && <button aria-label={`Sao chép ${label}`} onClick={copy} className="text-primary"><Copy className="h-3.5 w-3.5" /></button>}</span></div>;
export default OrderSuccessPage;
