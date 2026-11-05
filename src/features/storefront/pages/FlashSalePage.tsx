import React from 'react';
import { Flame, Clock, Sparkles } from 'lucide-react';

export const FlashSalePage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="p-8 rounded-theme bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-primary/10 border border-border-base text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500 text-white text-xs font-bold uppercase tracking-wider">
          <Flame className="w-4 h-4 animate-bounce" />
          Giờ Vàng Giá Sốc
        </div>
        <h1 className="text-3xl font-extrabold text-content-main">Sự Kiện Flash Sale Hôm Nay</h1>
        <div className="flex items-center justify-center gap-2 text-sm text-content-muted">
          <Clock className="w-4 h-4 text-rose-500" />
          <span>Thời gian kết thúc: <strong>02:45:18</strong></span>
        </div>
        <p className="text-xs text-content-muted max-w-md mx-auto pt-2">
          Các sản phẩm giảm giá chớp nhoáng với số lượng giới hạn theo thời gian thực (Milestone M5).
        </p>
      </div>

      <div className="p-12 rounded-theme bg-surface-card border border-border-base text-center text-content-muted text-sm flex flex-col items-center justify-center gap-3">
        <Sparkles className="w-8 h-8 text-primary" />
        <span>Hệ thống Flash Sale countdown và thanh tiến trình bán hàng đang chuẩn bị ra mắt.</span>
      </div>
    </div>
  );
};
export default FlashSalePage;
