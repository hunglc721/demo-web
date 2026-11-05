import React from 'react';
import { CheckCircle2, Sparkles, Truck } from 'lucide-react';
import { SHIPPING_CONFIG } from '@/config/shipping';
import { formatCurrencyVND } from '@/utils/formatters';

export interface FreeShippingTrackerProps {
  subtotal: number;
  threshold?: number;
  className?: string;
  compact?: boolean;
}

export const FreeShippingTracker: React.FC<FreeShippingTrackerProps> = ({
  subtotal,
  threshold = SHIPPING_CONFIG.freeShippingThreshold,
  className = '',
  compact = false,
}) => {
  const effectiveThreshold = Math.max(1, threshold);
  const isQualified = subtotal >= effectiveThreshold && subtotal > 0;
  const remaining = Math.max(0, effectiveThreshold - subtotal);
  const percentage = subtotal <= 0 ? 0 : Math.min(100, Math.round((subtotal / effectiveThreshold) * 100));

  if (compact) {
    return (
      <div className={`space-y-1.5 ${className}`}>
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-content-muted">
            {isQualified ? (
              <span className="flex items-center gap-1 font-semibold text-status-success">
                <CheckCircle2 className="h-3.5 w-3.5 text-status-success" />
                Miễn phí vận chuyển toàn quốc
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Truck className="h-3.5 w-3.5 text-primary" />
                Mua thêm <strong className="text-primary">{formatCurrencyVND(remaining)}</strong> để freeship
              </span>
            )}
          </span>
          <span className={`font-semibold ${isQualified ? 'text-status-success' : 'text-primary'}`}>
            {percentage}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-subtle border border-border-base/40">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isQualified ? 'bg-status-success' : 'bg-primary'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-theme border p-4 transition-all duration-200 ${
        isQualified
          ? 'border-status-success/30 bg-status-success/5 shadow-xs'
          : 'border-border-base bg-surface-card'
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              isQualified ? 'bg-status-success/15 text-status-success' : 'bg-primary/10 text-primary'
            }`}
          >
            {isQualified ? <CheckCircle2 className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          </div>
          <div>
            <p className="text-xs font-bold text-content-main sm:text-sm">
              {isQualified ? (
                <span className="text-status-success">
                  🎉 Tuyệt vời! Bạn đã được MIỄN PHÍ VẬN CHUYỂN toàn quốc!
                </span>
              ) : (
                <span>
                  Mua thêm{' '}
                  <span className="text-primary font-bold">
                    {formatCurrencyVND(remaining)}
                  </span>{' '}
                  để được <strong className="uppercase">Miễn phí vận chuyển</strong>
                </span>
              )}
            </p>
            <p className="text-[11px] text-content-muted">
              {isQualified
                ? 'Đơn hàng của bạn đủ điều kiện áp dụng chính sách Freeship D2C.'
                : `Áp dụng cho đơn hàng có giá trị từ ${formatCurrencyVND(effectiveThreshold)}`}
            </p>
          </div>
        </div>
        <span
          className={`text-xs font-bold sm:text-sm ${
            isQualified ? 'text-status-success' : 'text-primary'
          }`}
        >
          {percentage}%
        </span>
      </div>

      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-surface-subtle">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isQualified ? 'bg-status-success' : 'bg-primary'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
