import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, ArrowRight } from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  return (
    <div className="max-w-4xl w-full mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-content-main">Thanh Toán Đơn Hàng D2C</h1>
        <p className="text-xs text-content-muted">
          Điền thông tin nhận hàng và chọn phương thức thanh toán an toàn (Milestone M6).
        </p>
      </div>

      <div className="p-8 rounded-theme bg-surface-card border border-border-base shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-content-main flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary" />
              <span>1. Thông Tin Nhận Hàng</span>
            </h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Họ và tên người nhận *"
                className="w-full bg-surface-subtle border border-border-base rounded px-3 py-2 text-xs"
                readOnly
              />
              <input
                type="tel"
                placeholder="Số điện thoại *"
                className="w-full bg-surface-subtle border border-border-base rounded px-3 py-2 text-xs"
                readOnly
              />
              <input
                type="text"
                placeholder="Địa chỉ số nhà, tên đường *"
                className="w-full bg-surface-subtle border border-border-base rounded px-3 py-2 text-xs"
                readOnly
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-bold text-content-main flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>2. Phương Thức Thanh Toán</span>
            </h2>
            <div className="p-4 rounded bg-surface-subtle border border-border-base text-xs text-content-muted space-y-2">
              <label className="flex items-center gap-2 font-medium text-content-main">
                <input type="radio" name="payment" defaultChecked />
                <span>Thanh toán khi nhận hàng (COD)</span>
              </label>
              <label className="flex items-center gap-2 font-medium text-content-main">
                <input type="radio" name="payment" />
                <span>Chuyển khoản ngân hàng VietQR 24/7</span>
              </label>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border-base flex items-center justify-between">
          <Link to="/cart" className="text-xs font-semibold text-content-muted hover:text-content-main">
            Quay lại giỏ hàng
          </Link>
          <Link
            to="/order-success/demo_order_123"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-theme bg-primary text-white text-xs font-semibold hover:bg-primary-hover shadow-sm transition-all"
          >
            <span>Đặt Hàng (Xem Mẫu Xác Nhận)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
export default CheckoutPage;
