import React, { useEffect, useState } from 'react';
import { CheckCircle2, LoaderCircle, Tag, X } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { couponService } from '@/services/api/couponService';
import { formatCurrencyVND } from '@/utils/formatters';
import { toast } from '@/stores/toastStore';

export interface CartCouponSectionProps {
  subtotal: number;
  shippingFee: number;
  compact?: boolean;
  className?: string;
}

const QUICK_COUPONS = ['CHAOBAN', 'FREESHIP', 'SALE50K', 'VIP15'];

export const CartCouponSection: React.FC<CartCouponSectionProps> = ({
  subtotal,
  shippingFee,
  compact = false,
  className = '',
}) => {
  const { couponCode, couponDiscount, setCouponCode, setCouponDiscount } = useCartStore();
  const [inputCode, setInputCode] = useState(couponCode);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Sync input when store couponCode changes externally
  useEffect(() => {
    setInputCode(couponCode);
    if (!couponCode) {
      setMessage('');
      setIsError(false);
    }
  }, [couponCode]);

  // Reactive revalidation: if subtotal or shippingFee changes while a coupon is active
  useEffect(() => {
    if (!couponCode) {
      setCouponDiscount(0);
      return;
    }

    let isMounted = true;
    couponService
      .validateCoupon(couponCode, subtotal, shippingFee)
      .then((res) => {
        if (!isMounted) return;
        if (res.isValid) {
          setCouponDiscount(res.discountAmount);
          setIsError(false);
          setMessage(res.message);
        } else {
          setCouponDiscount(0);
          setIsError(true);
          setMessage(res.message || 'Mã giảm giá không còn đủ điều kiện.');
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setCouponDiscount(0);
        setIsError(true);
      });

    return () => {
      isMounted = false;
    };
  }, [couponCode, subtotal, shippingFee, setCouponDiscount]);

  const handleApplyCoupon = async (codeToApply?: string) => {
    const raw = (codeToApply ?? inputCode).trim().toUpperCase();
    if (!raw) {
      setCouponCode('');
      setCouponDiscount(0);
      setMessage('Vui lòng nhập mã giảm giá.');
      setIsError(true);
      return;
    }

    setIsBusy(true);
    setIsError(false);
    setMessage('');

    try {
      const result = await couponService.validateCoupon(raw, subtotal, shippingFee);
      setMessage(result.message);
      setIsError(!result.isValid);

      if (result.isValid) {
        const validatedCode = result.coupon?.code || raw;
        setCouponCode(validatedCode);
        setCouponDiscount(result.discountAmount);
        setInputCode(validatedCode);
        toast.success(`Đã áp dụng mã ${validatedCode}! Giảm ${formatCurrencyVND(result.discountAmount)}`);
      } else {
        setCouponDiscount(0);
        toast.error(result.message || 'Mã giảm giá không hợp lệ.');
      }
    } catch {
      setMessage('Không thể xác thực mã giảm giá lúc này.');
      setIsError(true);
      setCouponDiscount(0);
    } finally {
      setIsBusy(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponDiscount(0);
    setInputCode('');
    setMessage('Đã gỡ mã giảm giá.');
    setIsError(false);
    toast.info('Đã gỡ mã giảm giá.');
  };

  return (
    <div className={`space-y-3 ${compact ? 'text-xs' : ''} ${className}`}>
      {/* Active Coupon Badge (1-click removal) */}
      {couponCode && couponDiscount > 0 ? (
        <div className="flex items-center justify-between rounded-theme border border-status-success/40 bg-status-success/10 p-3 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-status-success" />
            <div>
              <span className="font-bold text-status-success">{couponCode}</span>
              <span className="text-content-muted ml-1.5">
                (Tiết kiệm {formatCurrencyVND(couponDiscount)})
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemoveCoupon}
            className="flex items-center gap-1 rounded px-2 py-1 text-content-muted hover:bg-status-success/20 hover:text-content-main transition-colors"
            title="Gỡ mã giảm giá"
            aria-label="Gỡ mã giảm giá"
          >
            <X className="h-3.5 w-3.5" />
            <span className="text-[11px] font-medium">Gỡ</span>
          </button>
        </div>
      ) : (
        /* Coupon Input Field */
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleApplyCoupon();
                }
              }}
              placeholder="Nhập mã ưu đãi..."
              aria-label="Mã giảm giá"
              className="w-full rounded-theme border border-border-base bg-surface-subtle px-3 py-2 text-xs uppercase text-content-main placeholder:normal-case placeholder:text-content-muted focus:border-primary focus:outline-none sm:text-sm"
            />
          </div>
          <button
            type="button"
            disabled={isBusy || !inputCode.trim()}
            onClick={() => handleApplyCoupon()}
            className="flex items-center justify-center rounded-theme border border-primary bg-primary/10 px-3.5 py-2 text-xs font-bold text-primary hover:bg-primary hover:text-white disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {isBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : 'Áp dụng'}
          </button>
        </div>
      )}

      {/* Message feedback */}
      {message && (
        <p
          role="status"
          className={`text-xs ${isError ? 'text-status-danger' : 'text-status-success font-medium'}`}
        >
          {message}
        </p>
      )}

      {/* Quick Suggestion Chips */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-[11px] text-content-muted">
          <Tag className="h-3 w-3 text-primary" />
          <span>Mã ưu đãi gợi ý:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_COUPONS.map((code) => {
            const isCurrent = couponCode === code && couponDiscount > 0;
            return (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setInputCode(code);
                  handleApplyCoupon(code);
                }}
                disabled={isBusy || isCurrent}
                className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors ${
                  isCurrent
                    ? 'border-status-success bg-status-success/15 text-status-success cursor-default'
                    : 'border-border-base bg-surface-card text-content-main hover:border-primary hover:text-primary'
                }`}
              >
                {code}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
