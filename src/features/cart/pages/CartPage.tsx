import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { formatCurrencyVND } from '@/utils/formatters';

export const CartPage: React.FC = () => {
  const { items, getTotalItems, getSubtotal } = useCartStore();
  const totalItems = getTotalItems();
  const subtotal = getSubtotal();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between border-b border-border-base pb-4">
        <h1 className="text-2xl font-bold text-content-main flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-primary" />
          <span>Giỏ Hàng Của Bạn</span>
          <span className="text-sm font-normal text-content-muted">({totalItems} sản phẩm)</span>
        </h1>
        <Link
          to="/catalog"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Tiếp tục mua sắm</span>
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="p-12 rounded-theme bg-surface-card border border-border-base text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-surface-subtle text-content-muted flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-content-main">Giỏ hàng đang trống</h2>
          <p className="text-xs text-content-muted max-w-sm mx-auto">
            Bạn chưa chọn món hàng nào. Hãy khám phá các bộ sưu tập của chúng tôi để tìm món đồ ưng ý nhé!
          </p>
          <Link
            to="/catalog"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-theme bg-primary text-white text-xs font-semibold hover:bg-primary-hover shadow-sm transition-all"
          >
            <span>Mua sắm ngay</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {/* Items list placeholder */}
          </div>
          <div className="p-6 rounded-theme bg-surface-card border border-border-base space-y-4">
            <h2 className="text-base font-bold text-content-main">Tóm Tắt Đơn Hàng</h2>
            <div className="space-y-2 text-sm text-content-muted">
              <div className="flex justify-between">
                <span>Tạm tính</span>
                <span className="font-semibold text-content-main">{formatCurrencyVND(subtotal)}</span>
              </div>
            </div>
            <Link
              to="/checkout"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-theme bg-primary text-white font-semibold hover:bg-primary-hover shadow-sm transition-all text-sm"
            >
              <span>Tiến Hành Đặt Hàng</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
export default CartPage;
