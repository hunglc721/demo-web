import React from 'react';
import { Ticket, Flame, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MarketingPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-content-main">Trung Tâm Marketing & Khuyến Mãi</h1>
        <p className="text-sm text-content-muted mt-1">
          Quản lý chiến dịch mã giảm giá (Vouchers), Flash Sale và chương trình khách hàng thân thiết.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-theme bg-surface-card border border-border-base space-y-4">
          <div className="p-3 rounded-theme bg-primary/10 text-primary w-fit">
            <Ticket className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-content-main">Mã Giảm Giá & Voucher</h2>
          <p className="text-xs text-content-muted">
            Tạo mã coupon giảm theo %, giảm cố định tiền mặt hoặc miễn phí vận chuyển kèm điều kiện đơn hàng tối thiểu.
          </p>
          <Link
            to="/admin/marketing/coupons"
            className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
          >
            <span>Quản lý mã giảm giá</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="p-6 rounded-theme bg-surface-card border border-border-base space-y-4">
          <div className="p-3 rounded-theme bg-rose-500/10 text-rose-500 w-fit">
            <Flame className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-content-main">Chiến Dịch Flash Sale</h2>
          <p className="text-xs text-content-muted">
            Cài đặt khung giờ vàng giảm giá sốc, giới hạn số lượng và đếm ngược tự động kích hoạt ngoài trang chủ.
          </p>
          <Link
            to="/admin/marketing/flash-sale"
            className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
          >
            <span>Thiết lập Flash Sale</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
export default MarketingPage;
