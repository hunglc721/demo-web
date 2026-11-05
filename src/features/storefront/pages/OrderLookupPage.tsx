import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, PackageCheck, LoaderCircle } from 'lucide-react';
import { orderService } from '@/services/api/orderService';
import { Order, OrderStatus } from '@/types';
import { formatCurrencyVND } from '@/utils/formatters';

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', processing: 'Đang chuẩn bị hàng',
  shipping: 'Đang giao hàng', completed: 'Đã giao thành công', cancelled: 'Đơn hàng đã hủy',
};

export const OrderLookupPage: React.FC = () => {
  const location = useLocation();
  const [orderCode, setOrderCode] = useState((location.state as { orderNumber?: string } | null)?.orderNumber || '');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const orderNumber = (location.state as { orderNumber?: string } | null)?.orderNumber;
    if (orderNumber) {
      orderService.getOrderByNumber(orderNumber).then(result => { if (result) setPhone(result.customer.phone); }).catch(() => undefined);
    }
  }, [location.state]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const found = await orderService.getOrderByNumber(orderCode.trim().toUpperCase());
      if (!found || found.customer.phone.replace(/\D/g, '').slice(-9) !== phone.replace(/\D/g, '').slice(-9)) {
        setError('Không tìm thấy đơn hàng phù hợp với mã đơn và số điện thoại này.');
      } else setOrder(found);
    } catch {
      setError('Chưa tra cứu được đơn hàng. Thử lại nhé.');
    } finally {
      setLoading(false);
    }
  };

  return <div className="mx-auto max-w-3xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
    <div className="space-y-3 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"><PackageCheck className="h-6 w-6" /></div><h1 className="text-2xl font-bold text-content-main">Tra cứu đơn hàng</h1><p className="text-sm text-content-muted">Nhập mã đơn hàng và số điện thoại nhận hàng để xem trạng thái.</p></div>
    <form onSubmit={handleSubmit} className="space-y-4 rounded-theme border border-border-base bg-surface-card p-6 shadow-sm"><Field label="Mã đơn hàng"><input required value={orderCode} onChange={event => setOrderCode(event.target.value)} placeholder="VD: ORD-2026-123" className={inputClass} /></Field><Field label="Số điện thoại nhận hàng"><input type="tel" required value={phone} onChange={event => setPhone(event.target.value)} placeholder="0912345678" className={inputClass} /></Field>{error && <p role="alert" className="text-sm text-status-danger">{error}</p>}<button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-theme bg-primary px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Tra cứu trạng thái</button></form>
    {order && <section className="space-y-4 rounded-theme border border-border-base bg-surface-card p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs text-content-muted">Mã đơn hàng</p><h2 className="font-mono font-bold text-primary">{order.orderNumber}</h2></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{statusLabels[order.status]}</span></div><div className="grid gap-2 text-sm sm:grid-cols-2"><p>Người nhận: <b>{order.customer.name}</b></p><p>Tổng tiền: <b>{formatCurrencyVND(order.total)}</b></p><p className="sm:col-span-2">Địa chỉ: {order.customer.address.fullAddress}</p></div><ol className="space-y-3 border-l-2 border-border-base pl-4">{order.timeline.slice().reverse().map(event => <li key={event.id} className="relative"><span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary" /><p className="text-sm font-semibold">{event.title}</p><p className="text-xs text-content-muted">{new Date(event.timestamp).toLocaleString('vi-VN')} · {event.description}</p></li>)}</ol></section>}
    <div className="text-center"><Link to="/catalog" className="text-sm font-semibold text-primary hover:underline">Tiếp tục mua sắm</Link></div>
  </div>;
};

const inputClass = 'w-full rounded-theme border border-border-base bg-surface-subtle px-3.5 py-2.5 text-sm text-content-main outline-none focus:border-primary';
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => <label className="block space-y-1.5 text-xs font-semibold text-content-main">{label}{children}</label>;
export default OrderLookupPage;
