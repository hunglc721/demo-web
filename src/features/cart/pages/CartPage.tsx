import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Home,
  ShieldCheck,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { productService } from '@/services/api/productService';
import { SHIPPING_CONFIG, calculateShippingFee } from '@/config/shipping';
import { Product } from '@/types';
import { formatCurrencyVND } from '@/utils/formatters';
import { toast } from '@/stores/toastStore';
import { Modal } from '@/core/components/Modal';
import { FreeShippingTracker } from '../components/FreeShippingTracker';
import { CartCouponSection } from '../components/CartCouponSection';
import { CartItemRow } from '../components/CartItemRow';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    couponCode,
    couponDiscount,
    note,
    setNote,
  } = useCartStore();

  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [localNote, setLocalNote] = useState(note || '');

  // Calculate financials
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );
  const shippingFee = calculateShippingFee(subtotal);
  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );
  const grandTotal = Math.max(0, subtotal + shippingFee - couponDiscount);

  // Load featured products when empty
  useEffect(() => {
    if (items.length === 0) {
      productService
        .getFeaturedProducts(4)
        .then(setFeaturedProducts)
        .catch(() => setFeaturedProducts([]));
    }
  }, [items.length]);

  // Sync note to store
  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value.slice(0, 300);
    setLocalNote(val);
    setNote(val);
  };

  const handleConfirmClearCart = () => {
    clearCart();
    setIsClearModalOpen(false);
    toast.success('Đã làm trống giỏ hàng thành công.');
  };

  const handleCheckout = () => {
    if (!items.length) {
      toast.warning('Giỏ hàng trống. Hãy chọn sản phẩm trước khi thanh toán.');
      return;
    }
    navigate('/checkout', { state: { note: localNote } });
  };

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

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* 1. Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-content-muted">
        <Link to="/" className="flex items-center gap-1 hover:text-primary transition-colors">
          <Home className="h-3.5 w-3.5" />
          <span>Trang chủ</span>
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-semibold text-content-main">Giỏ hàng ({totalItems})</span>
      </nav>

      {/* 2. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border-base pb-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-content-main">
            <ShoppingBag className="h-6 w-6 text-primary" />
            <span>Giỏ hàng của bạn</span>
            <span className="text-sm font-normal text-content-muted">
              ({totalItems} sản phẩm)
            </span>
          </h1>
          <p className="text-xs text-content-muted mt-1">
            Kiểm tra lại số lượng và áp dụng mã giảm giá trước khi hoàn tất đặt hàng.
          </p>
        </div>

        {items.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsClearModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-status-danger hover:underline p-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Xóa tất cả</span>
            </button>
            <Link
              to="/catalog"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Tiếp tục mua sắm</span>
            </Link>
          </div>
        )}
      </div>

      {/* 3. Free Shipping Tracker Banner */}
      <FreeShippingTracker
        subtotal={subtotal}
        threshold={SHIPPING_CONFIG.freeShippingThreshold}
      />

      {/* 4. Main Body: Cart Items & Sidebar Summary */}
      {items.length === 0 ? (
        /* Empty State */
        <div className="space-y-8">
          <div className="rounded-theme border border-border-base bg-surface-card p-12 text-center shadow-xs">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface-subtle text-content-muted mb-4">
              <ShoppingBag className="h-8 w-8 text-primary/60" />
            </div>
            <h2 className="text-lg font-bold text-content-main">Giỏ hàng của bạn đang trống</h2>
            <p className="mt-1 text-sm text-content-muted max-w-md mx-auto">
              Chưa có sản phẩm nào trong giỏ hàng. Hãy khám phá bộ sưu tập sản phẩm mới nhất của chúng tôi ngay nhé!
            </p>
            <div className="mt-6">
              <Link
                to="/catalog"
                className="inline-flex items-center gap-2 rounded-theme bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-hover shadow-xs transition-colors"
              >
                <span>Khám phá sản phẩm ngay</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Featured products recommendations */}
          {featuredProducts.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-content-main">
                Sản phẩm nổi bật đề xuất cho bạn:
              </h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {featuredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex flex-col justify-between rounded-theme border border-border-base bg-surface-card p-3 shadow-2xs hover:shadow-xs transition-shadow"
                  >
                    <div>
                      <img
                        src={product.images[0] || '/placeholder.png'}
                        alt={product.name}
                        className="aspect-square w-full rounded-theme object-cover mb-2.5 bg-surface-subtle"
                      />
                      <h4 className="line-clamp-2 text-xs font-semibold text-content-main sm:text-sm">
                        {product.name}
                      </h4>
                      <p className="mt-1 text-xs font-bold text-primary sm:text-sm">
                        {formatCurrencyVND(product.price)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddSuggestion(product)}
                      className="mt-3 w-full rounded-theme border border-primary bg-primary/10 py-1.5 text-xs font-bold text-primary hover:bg-primary hover:text-white transition-colors"
                    >
                      + Thêm vào giỏ
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Populated Cart Layout */
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column: Item List & Note */}
          <div className="space-y-6 lg:col-span-2">
            {/* Item List Container */}
            <div className="rounded-theme border border-border-base bg-surface-card divide-y divide-border-base px-5">
              {items.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
            </div>

            {/* Order Note Card */}
            <div className="rounded-theme border border-border-base bg-surface-card p-5 space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="cart-note"
                  className="text-xs font-bold text-content-main uppercase tracking-wider"
                >
                  Ghi chú đơn hàng (tuỳ chọn)
                </label>
                <span className="text-[11px] text-content-muted">
                  {localNote.length} / 300 ký tự
                </span>
              </div>
              <textarea
                id="cart-note"
                rows={3}
                value={localNote}
                onChange={handleNoteChange}
                maxLength={300}
                placeholder="Ví dụ: Giao hàng giờ hành chính, gọi trước khi đến..."
                className="w-full rounded-theme border border-border-base bg-surface-subtle p-3 text-xs sm:text-sm text-content-main placeholder:text-content-muted focus:border-primary focus:outline-none"
              />
              <p className="text-[11px] text-content-muted">
                Ghi chú này sẽ được chuyển trực tiếp cho bên vận chuyển và nhân viên đóng gói.
              </p>
            </div>
          </div>

          {/* Right Column: Order Summary & Coupon */}
          <div className="space-y-6">
            <div className="sticky top-20 rounded-theme border border-border-base bg-surface-card p-5 space-y-5 shadow-xs">
              <h2 className="text-base font-bold text-content-main border-b border-border-base pb-3">
                Tóm tắt đơn hàng
              </h2>

              {/* Coupon Section */}
              <div className="border-b border-border-base pb-4">
                <CartCouponSection subtotal={subtotal} shippingFee={shippingFee} />
              </div>

              {/* Financial Breakdown */}
              <div className="space-y-2.5 text-xs sm:text-sm text-content-muted">
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <span className="font-semibold text-content-main">
                    {formatCurrencyVND(subtotal)}
                  </span>
                </div>

                {couponDiscount > 0 && (
                  <div className="flex justify-between text-status-success font-semibold">
                    <span>Voucher ({couponCode})</span>
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

                <div className="flex justify-between border-t border-border-base pt-3 text-base font-bold text-content-main">
                  <span>Tổng thanh toán</span>
                  <span className="text-lg text-primary">{formatCurrencyVND(grandTotal)}</span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                type="button"
                onClick={handleCheckout}
                className="flex w-full items-center justify-center gap-2 rounded-theme bg-primary py-3.5 text-sm font-bold text-white hover:bg-primary-hover shadow-xs transition-colors"
              >
                <span>Tiến hành thanh toán</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              {/* Trust Badges */}
              <div className="rounded-theme bg-surface-subtle p-3 space-y-1.5 text-[11px] text-content-muted border border-border-base/50">
                <div className="flex items-center gap-1.5 text-content-main font-semibold">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span>Cam kết mua sắm an tâm</span>
                </div>
                <p>• Hỗ trợ đổi trả trong vòng 7 ngày kể từ khi nhận hàng.</p>
                <p>• Bảo mật thanh toán và kiểm tra hàng trước khi nhận (COD).</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear Cart Confirmation Modal */}
      <Modal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        title="Xác nhận xóa giỏ hàng"
        description="Bạn có chắc chắn muốn xóa toàn bộ sản phẩm khỏi giỏ hàng không?"
        size="sm"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-content-muted">
            Hành động này sẽ xóa tất cả {totalItems} sản phẩm hiện tại và gỡ mã giảm giá đã áp dụng.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsClearModalOpen(false)}
              className="rounded-theme border border-border-base px-4 py-2 text-xs font-semibold text-content-main hover:bg-surface-subtle transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleConfirmClearCart}
              className="rounded-theme bg-status-danger px-4 py-2 text-xs font-bold text-white hover:opacity-90 transition-opacity"
            >
              Xóa tất cả
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CartPage;
