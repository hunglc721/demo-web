import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ShoppingBag, X } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { productService } from '@/services/api/productService';
import { SHIPPING_CONFIG, calculateShippingFee } from '@/config/shipping';
import { Product } from '@/types';
import { toast } from '@/stores/toastStore';
import { formatCurrencyVND } from '@/utils/formatters';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { FreeShippingTracker } from './FreeShippingTracker';
import { CartCouponSection } from './CartCouponSection';
import { CartItemRow } from './CartItemRow';

export const CartDrawer: React.FC = () => {
  const navigate = useNavigate();
  const { items, isOpen, closeCart, updateQuantity, removeItem, couponDiscount } = useCartStore();
  const [suggestions, setSuggestions] = useState<Product[]>([]);

  // Prevent background scrolling while drawer is active
  useBodyScrollLock(isOpen);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );
  const shippingFee = calculateShippingFee(subtotal);
  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  useEffect(() => {
    if (!isOpen || items.length) return;
    productService
      .getFeaturedProducts(4)
      .then(setSuggestions)
      .catch(() => setSuggestions([]));
  }, [isOpen, items.length]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeCart();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, closeCart]);

  const handleAddSuggestion = (product: Product) => {
    const variant = product.variants?.find((v) => v.stock > 0);
    const variantTitle = variant?.title || (variant?.options ? Object.values(variant.options).join(' / ') : undefined);
    useCartStore.getState().addItem({
      productId: product.id,
      variantId: variant?.id,
      variantName: variantTitle,
      title: product.name,
      price: variant?.price ?? product.price,
      originalPrice: product.compareAtPrice ?? product.originalPrice,
      quantity: 1,
      image: product.images[0] || '',
      sku: variant?.sku || product.sku,
      stock: variant?.stock ?? product.stock,
    });
    toast.success(`Đã thêm ${product.name} vào giỏ hàng.`);
  };

  const handleGoToCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  const handleGoToCart = () => {
    closeCart();
    navigate('/cart');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70]" role="presentation">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Đóng giỏ hàng"
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
        onClick={closeCart}
      />

      {/* Slide-out Aside Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Giỏ hàng"
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-surface-card shadow-2xl animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border-base px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-bold text-content-main sm:text-lg">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <span>Giỏ hàng</span>
            <span className="text-xs font-normal text-content-muted">
              ({totalItems} sản phẩm)
            </span>
          </h2>
          <button
            type="button"
            onClick={closeCart}
            className="rounded-theme p-1.5 text-content-muted hover:bg-surface-subtle hover:text-content-main transition-colors"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 divide-y divide-border-base">
          {/* Free Shipping Tracker */}
          <div className="py-3">
            <FreeShippingTracker
              subtotal={subtotal}
              threshold={SHIPPING_CONFIG.freeShippingThreshold}
              compact
            />
          </div>

          {/* Cart Items or Empty State */}
          {items.length > 0 ? (
            <div className="divide-y divide-border-base py-1">
              {items.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                  compact
                />
              ))}
            </div>
          ) : (
            <div className="py-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface-subtle text-content-muted mb-3">
                <ShoppingBag className="h-7 w-7" />
              </div>
              <p className="font-bold text-sm text-content-main">Giỏ hàng của bạn đang trống</p>
              <p className="mt-1 text-xs text-content-muted">
                Hãy khám phá các sản phẩm nổi bật của chúng tôi nhé!
              </p>

              {suggestions.length > 0 && (
                <div className="mt-5 text-left">
                  <p className="text-xs font-semibold text-content-main mb-2">
                    Gợi ý dành cho bạn:
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {suggestions.map((product) => (
                      <div
                        key={product.id}
                        className="rounded-theme border border-border-base bg-surface-subtle/50 p-2 text-xs flex flex-col justify-between"
                      >
                        <img
                          src={product.images[0] || '/placeholder.png'}
                          alt={product.name}
                          className="aspect-square w-full rounded object-cover mb-1.5"
                        />
                        <p className="line-clamp-1 font-medium text-content-main">
                          {product.name}
                        </p>
                        <p className="font-bold text-primary mt-0.5">
                          {formatCurrencyVND(product.price)}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleAddSuggestion(product)}
                          className="mt-2 w-full rounded bg-surface-card border border-border-base py-1 text-[11px] font-semibold text-content-main hover:bg-primary hover:text-white transition-colors"
                        >
                          + Thêm
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Integrated Coupon Section in Drawer */}
          {items.length > 0 && (
            <div className="py-4">
              <CartCouponSection
                subtotal={subtotal}
                shippingFee={shippingFee}
                compact
              />
            </div>
          )}
        </div>

        {/* Footer Summary & CTAs */}
        {items.length > 0 && (
          <footer className="space-y-3 border-t border-border-base p-5 bg-surface-card">
            {/* Financial Breakdown */}
            <div className="space-y-1.5 text-xs text-content-muted">
              <div className="flex justify-between">
                <span>Tạm tính</span>
                <span className="font-semibold text-content-main">
                  {formatCurrencyVND(subtotal)}
                </span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-status-success font-medium">
                  <span>Voucher giảm giá</span>
                  <span>-{formatCurrencyVND(couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Phí vận chuyển</span>
                <span className="font-semibold text-content-main">
                  {shippingFee === 0 ? (
                    <span className="text-status-success">Miễn phí</span>
                  ) : (
                    formatCurrencyVND(shippingFee)
                  )}
                </span>
              </div>
              <div className="flex justify-between border-t border-border-base pt-2 text-sm font-bold text-content-main">
                <span>Tổng cộng</span>
                <span className="text-base text-primary">
                  {formatCurrencyVND(Math.max(0, subtotal + shippingFee - couponDiscount))}
                </span>
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleGoToCheckout}
                className="flex w-full items-center justify-center gap-2 rounded-theme bg-primary py-3 text-xs sm:text-sm font-bold text-white hover:bg-primary-hover shadow-xs transition-colors"
              >
                <span>Tiến hành thanh toán</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={handleGoToCart}
                className="w-full rounded-theme border border-border-base py-2.5 text-xs font-semibold text-content-main hover:bg-surface-subtle transition-colors"
              >
                Xem chi tiết giỏ hàng
              </button>

              <Link
                to="/catalog"
                onClick={closeCart}
                className="block text-center text-xs text-content-muted hover:text-primary transition-colors pt-1"
              >
                Tiếp tục mua sắm
              </Link>
            </div>
          </footer>
        )}
      </aside>
    </div>
  );
};
