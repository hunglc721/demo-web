import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Home, QrCode, ShoppingBag } from 'lucide-react';

export const OrderSuccessPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();

  return (
    <div className="max-w-md w-full mx-auto p-8 rounded-theme bg-surface-card border border-border-base shadow-sm text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-status-success/10 text-status-success flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div className="space-y-2">
        <h1 className="text-xl font-bold text-content-main">Đặt Hàng Thành Công!</h1>
        <p className="text-xs text-content-muted">
          Cảm ơn bạn đã tin tưởng mua sắm tại cửa hàng. Mã đơn hàng của bạn là:
        </p>
        <span className="inline-block px-3 py-1 rounded bg-surface-subtle font-mono text-sm font-bold text-primary">
          {orderId || 'ORD-998822'}
        </span>
      </div>

      <div className="p-4 rounded-theme bg-surface-subtle border border-border-base text-left text-xs text-content-muted space-y-2">
        <div className="flex items-center gap-2 font-semibold text-content-main">
          <QrCode className="w-4 h-4 text-primary" />
          <span>Thanh toán VietQR tiện lợi</span>
        </div>
        <p>Mã QR tự động tạo kèm số tiền và nội dung chuyển khoản sẽ hiển thị tại đây trong M6.</p>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-theme bg-primary text-white text-xs font-semibold hover:bg-primary-hover shadow-sm transition-all"
        >
          <Home className="w-4 h-4" />
          <span>Về trang chủ</span>
        </Link>
        <Link
          to="/catalog"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-theme bg-surface-subtle border border-border-base text-content-main text-xs font-semibold hover:bg-border-base transition-all"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Tiếp tục mua hàng</span>
        </Link>
      </div>
    </div>
  );
};
export default OrderSuccessPage;
