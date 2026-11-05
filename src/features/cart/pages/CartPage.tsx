import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { formatCurrencyVND } from '@/utils/formatters';

const SHIPPING_FEE = 30000;
const FREE_SHIPPING_THRESHOLD = 299000;

export const CartPage: React.FC = () => {
  const { items, getTotalItems, getSubtotal, updateQuantity, removeItem, couponCode, couponDiscount } = useCartStore();
  const [note, setNote] = useState('');
  const subtotal = getSubtotal();
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  return <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between border-b border-border-base pb-4"><h1 className="flex items-center gap-2 text-2xl font-bold text-content-main"><ShoppingBag className="h-6 w-6 text-primary" /> Giỏ hàng <span className="text-sm font-normal text-content-muted">({getTotalItems()} sản phẩm)</span></h1><Link to="/catalog" className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"><ArrowLeft className="h-3.5 w-3.5" /> Tiếp tục mua sắm</Link></div>
    {!items.length ? <div className="space-y-4 rounded-theme border border-border-base bg-surface-card p-12 text-center"><ShoppingBag className="mx-auto h-12 w-12 text-content-muted" /><h2 className="text-lg font-bold text-content-main">Giỏ hàng đang trống</h2><Link to="/catalog" className="inline-flex items-center gap-2 rounded-theme bg-primary px-5 py-2.5 text-xs font-semibold text-white">Mua sắm ngay <ArrowRight className="h-4 w-4" /></Link></div> : <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <section className="space-y-3 lg:col-span-2">{items.map(item => <article key={item.id} className="flex gap-4 rounded-theme border border-border-base bg-surface-card p-4"><img src={item.image} alt={item.title} className="h-28 w-24 rounded object-cover bg-surface-subtle" /><div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><div><h2 className="font-semibold text-content-main">{item.title}</h2>{item.variantName && <p className="mt-1 text-xs text-content-muted">{item.variantName}</p>}</div><button aria-label={`Xóa ${item.title}`} onClick={() => removeItem(item.id)} className="h-fit text-content-muted hover:text-status-danger"><Trash2 className="h-4 w-4" /></button></div><div className="mt-5 flex items-center justify-between"><div className="flex items-center rounded border border-border-base"><button aria-label="Giảm số lượng" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-2"><Minus className="h-3.5 w-3.5" /></button><span className="min-w-8 text-center text-sm">{item.quantity}</span><button aria-label="Tăng số lượng" disabled={item.stock !== undefined && item.quantity >= item.stock} onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-2 disabled:opacity-40"><Plus className="h-3.5 w-3.5" /></button></div><p className="font-bold text-content-main">{formatCurrencyVND(item.price * item.quantity)}</p></div></div></article>)}
      <label className="block space-y-2 text-sm font-semibold text-content-main">Ghi chú đơn hàng<textarea value={note} onChange={event => setNote(event.target.value)} rows={3} placeholder="Lời nhắn cho cửa hàng (không bắt buộc)" className="w-full rounded-theme border border-border-base bg-surface-card p-3 text-sm font-normal" /></label>
      </section>
      <aside className="h-fit space-y-4 rounded-theme border border-border-base bg-surface-card p-6"><h2 className="text-base font-bold text-content-main">Tóm tắt đơn hàng</h2><p className="text-xs text-content-muted">{remaining ? `Mua thêm ${formatCurrencyVND(remaining)} để được miễn phí vận chuyển` : 'Đơn hàng được miễn phí vận chuyển'}</p><div className="h-2 overflow-hidden rounded-full bg-surface-subtle"><div className="h-full bg-primary" style={{ width: `${Math.min(100, subtotal / FREE_SHIPPING_THRESHOLD * 100)}%` }} /></div><div className="space-y-2 border-t border-border-base pt-3 text-sm"><div className="flex justify-between text-content-muted"><span>Tạm tính</span><span>{formatCurrencyVND(subtotal)}</span></div><div className="flex justify-between text-content-muted"><span>Vận chuyển</span><span>{shippingFee ? formatCurrencyVND(shippingFee) : 'Miễn phí'}</span></div>{couponCode && couponDiscount > 0 && <div className="flex justify-between text-status-success"><span>Giảm giá ({couponCode})</span><span>-{formatCurrencyVND(couponDiscount)}</span></div>}<div className="flex justify-between border-t border-border-base pt-3 font-bold text-content-main"><span>Tổng cộng</span><span>{formatCurrencyVND(Math.max(0, subtotal + shippingFee - couponDiscount))}</span></div></div><Link to="/checkout" state={{ note }} className="inline-flex w-full items-center justify-center gap-2 rounded-theme bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-hover">Tiến hành thanh toán <ArrowRight className="h-4 w-4" /></Link></aside>
    </div>}
  </div>;
};
export default CartPage;
