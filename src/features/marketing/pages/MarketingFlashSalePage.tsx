import React from 'react';
import { Flame, Plus } from 'lucide-react';

export const MarketingFlashSalePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content-main">Quản Lý Chiến Dịch Flash Sale</h1>
          <p className="text-sm text-content-muted mt-1">
            Cài đặt khung giờ flash sale, lựa chọn sản phẩm và tỷ lệ chiết khấu (Milestone M4).
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-theme bg-primary text-white text-xs font-semibold hover:bg-primary-hover shadow-sm transition-all">
          <Plus className="w-4 h-4" />
          <span>Thêm Khung Giờ Mới</span>
        </button>
      </div>

      <div className="p-8 rounded-theme bg-surface-card border border-border-base text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
          <Flame className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-content-main">Chưa có khung giờ Flash Sale nào</h2>
        <p className="text-xs text-content-muted max-w-sm mx-auto">
          Tạo khung giờ Flash Sale mới để kích thích tỷ lệ chuyển đổi đơn hàng của khách hàng.
        </p>
      </div>
    </div>
  );
};
export default MarketingFlashSalePage;
