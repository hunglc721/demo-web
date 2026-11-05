import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { productService } from '@/services/api/productService';
import { couponService } from '@/services/api/couponService';
import { Product } from '@/types';
import { toast } from '@/stores/toastStore';
import { formatCurrencyVND } from '@/utils/formatters';

const FREE_SHIPPING_THRESHOLD = 299000;
const SHIPPING_FEE = 30000;

export const CartDrawer: React.FC = () => {
  const navigate = useNavigate();
  const { items, isOpen, closeCart, updateQuantity, removeItem, couponCode, setCouponCode, couponDiscount, setCouponDiscount } = useCartStore();
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [couponInput, setCouponInput] = useState(couponCode);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponBusy, setCouponBusy] = useState(false);
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  useEffect(() => {
    if (!isOpen || items.length) return;
    productService.getFeaturedProducts(4).then(setSuggestions).catch(() => setSuggestions([]));
  }, [isOpen, items.length]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') closeCart(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, closeCart]);

  useEffect(() => {
    setCouponInput(couponCode);
    setCouponMessage('');
  }, [couponCode]);

  useEffect(() => {
    if (!couponCode) {
      setCouponDiscount(0);
      return;
    }
    let active = true;
    couponService.validateCoupon(couponCode, subtotal, SHIPPING_FEE).then(result => {
      if (active) setCouponDiscount(result.isValid ? result.discountAmount : 0);
    }).catch(() => { if (active) setCouponDiscount(0); });
    return () => { active = false; };
  }, [couponCode, subtotal, setCouponDiscount]);

  const applyCoupon = async () => {
    if (!couponInput.trim()) {
      setCouponCode('');
      setCouponDiscount(0);
      setCouponMessage('Đã bỏ mã giảm giá.');
      return;
    }
    setCouponBusy(true);
    try {
      const result = await couponService.validateCoupon(couponInput, subtotal, SHIPPING_FEE);
      setCouponMessage(result.message);
      setCouponDiscount(result.isValid ? result.discountAmount : 0);
      if (result.isValid) {
        setCouponCode(result.coupon?.code || couponInput.trim().toUpperCase());
        toast.success('Đã áp dụng mã giảm giá.');
      } else {
        setCouponCode(couponInput.trim().toUpperCase());
      }
    } catch {
      setCouponMessage('Chưa kiểm tra được mã, thử lại nhé.');
      setCouponDiscount(0);
    } finally {
      setCouponBusy(false);
    }
  };

  const goToCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70]" role="presentation">
      <button aria-label="Đóng giỏ hàng" className="absolute inset-0 bg-black/40" onClick={closeCart} />
      <aside role="dialog" aria-modal="true" aria-label="Giỏ hàng" className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-surface-card shadow-2xl animate-in slide-in-from-right duration-200">
        <header className="flex items-center justify-between border-b border-border-base px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-content-main"><ShoppingBag className="h-5 w-5 text-primary" /> Giỏ hàng <span className="text-sm font-normal text-content-muted">({items.reduce((n, item) => n + item.quantity, 0)})</span></h2>
          <button onClick={closeCart} className="rounded p-2 text-content-muted hover:bg-surface-subtle" aria-label="Đóng"><X className="h-5 w-5" /></button>
        </header>

        <div className="flex-1 overflow-y-auto px-5">
          <div className="py-4">
            <div className="mb-2 flex justify-between text-xs"><span className="text-content-muted">{remainingForFreeShipping ? `Mua thêm ${formatCurrencyVND(remainingForFreeShipping)} để được freeship` : 'Đơn hàng đã được miễn phí vận chuyển'}</span><span className="font-semibold text-primary">{Math.min(100, Math.round(subtotal / FREE_SHIPPING_THRESHOLD * 100))}%</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-subtle"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, subtotal / FREE_SHIPPING_THRESHOLD * 100)}%` }} /></div>
          </div>

          {items.length ? <ul className="divide-y divide-border-base">
            {items.map(item => <li key={item.id} className="flex gap-3 py-4">
              <img src={item.image || '/placeholder.png'} alt={item.title} className="h-20 w-16 rounded object-cover bg-surface-subtle" />
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2"><p className="line-clamp-2 text-sm font-semibold text-content-main">{item.title}</p><button onClick={() => removeItem(item.id)} aria-label={`Xóa ${item.title}`} className="h-fit text-content-muted hover:text-status-danger"><Trash2 className="h-4 w-4" /></button></div>
                {item.variantName && <p className="mt-1 text-xs text-content-muted">{item.variantName}</p>}
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center rounded border border-border-base"><button aria-label="Giảm số lượng" className="p-1.5" onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus className="h-3.5 w-3.5" /></button><span className="min-w-7 text-center text-xs">{item.quantity}</span><button aria-label="Tăng số lượng" className="p-1.5 disabled:opacity-40" disabled={item.stock !== undefined && item.quantity >= item.stock} onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus className="h-3.5 w-3.5" /></button></div>
                  <span className="text-sm font-bold text-content-main">{formatCurrencyVND(item.price * item.quantity)}</span>
                </div>
              </div>
            </li>)}
          </ul> : <div className="py-7 text-center"><p className="font-semibold text-content-main">Giỏ hàng đang trống</p><p className="mt-1 text-xs text-content-muted">Thử mấy món khách đang thích nè</p><div className="mt-4 grid grid-cols-2 gap-3 text-left">{suggestions.map(product => <button key={product.id} onClick={() => { useCartStore.getState().addItem({ productId: product.id, title: product.name, price: product.price, originalPrice: product.compareAtPrice ?? product.originalPrice, quantity: 1, image: product.images[0] || '', sku: product.sku, stock: product.stock }); toast.success('Đã thêm vào giỏ.'); }} className="overflow-hidden rounded border border-border-base text-xs"><img src={product.images[0]} alt={product.name} className="aspect-square w-full object-cover" /><span className="block p-2">{product.name}</span></button>)}</div></div>}
        </div>

        {items.length > 0 && <footer className="space-y-3 border-t border-border-base p-5">
          <div className="flex gap-2"><input value={couponInput} onChange={e => setCouponInput(e.target.value)} placeholder="Nhập mã giảm giá" aria-label="Mã giảm giá" className="min-w-0 flex-1 rounded border border-border-base bg-surface-subtle px-3 py-2 text-sm" /><button disabled={couponBusy} onClick={applyCoupon} className="rounded border border-primary px-3 text-sm font-semibold text-primary disabled:opacity-50">{couponBusy ? 'Đang kiểm tra' : 'Áp dụng'}</button></div>
          {couponMessage && <p role="status" className="text-xs text-content-muted">{couponMessage}</p>}
          <div className="space-y-1 text-sm"><div className="flex justify-between text-content-muted"><span>Tạm tính</span><span>{formatCurrencyVND(subtotal)}</span></div>{couponDiscount > 0 && <div className="flex justify-between text-status-success"><span>Giảm giá</span><span>-{formatCurrencyVND(couponDiscount)}</span></div>}<div className="flex justify-between text-content-muted"><span>Vận chuyển</span><span>{shippingFee ? formatCurrencyVND(shippingFee) : 'Miễn phí'}</span></div><div className="flex justify-between border-t border-border-base pt-2 font-bold text-content-main"><span>Tổng cộng</span><span>{formatCurrencyVND(Math.max(0, subtotal + shippingFee - couponDiscount))}</span></div></div>
          <button onClick={goToCheckout} className="w-full rounded-theme bg-primary py-3 text-sm font-bold text-white hover:bg-primary-hover">Tiến hành thanh toán</button>
          <Link to="/catalog" onClick={closeCart} className="block text-center text-xs text-content-muted hover:text-primary">Tiếp tục mua sắm</Link>
        </footer>}
      </aside>
    </div>
  );
};
