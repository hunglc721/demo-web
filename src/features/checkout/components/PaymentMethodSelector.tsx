import React from 'react';
import { CreditCard, QrCode, ShieldCheck, Smartphone, Truck } from 'lucide-react';
import type { PaymentMethod } from '@/types/order';

export interface PaymentMethodSelectorProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  onPreviewVietQR?: () => void;
  error?: string;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  value,
  onChange,
  onPreviewVietQR,
  error,
}) => {
  const methods = [
    {
      id: 'cod' as PaymentMethod,
      title: 'Thanh toán khi nhận hàng (COD)',
      description: 'Thanh toán tiền mặt cho nhân viên giao hàng khi nhận kiện hàng.',
      badge: 'Tiện lợi',
      badgeColor: 'bg-surface-subtle text-content-main',
      icon: <Truck className="h-5 w-5 text-primary flex-shrink-0" />,
    },
    {
      id: 'vietqr' as PaymentMethod,
      title: 'Chuyển khoản VietQR 24/7',
      description: 'Quét mã QR qua ứng dụng ngân hàng bất kỳ (MB, Vietcombank, Techcombank...).',
      badge: 'Khuyên dùng',
      badgeColor: 'bg-primary/10 text-primary',
      icon: <QrCode className="h-5 w-5 text-primary flex-shrink-0" />,
    },
    {
      id: 'momo' as PaymentMethod,
      title: 'Ví điện tử MoMo',
      description: 'Quét mã QR hoặc chuyển tiền qua ứng dụng ví MoMo siêu tốc.',
      badge: 'Tự động',
      badgeColor: 'bg-pink-500/10 text-pink-600',
      icon: <Smartphone className="h-5 w-5 text-pink-600 flex-shrink-0" />,
    },
    {
      id: 'card' as PaymentMethod,
      title: 'Thẻ quốc tế (Visa / Master / JCB)',
      description: 'Cổng thanh toán thẻ quốc tế mô phỏng sandbox bảo mật.',
      badge: 'Bảo mật',
      badgeColor: 'bg-emerald-500/10 text-emerald-600',
      icon: <CreditCard className="h-5 w-5 text-emerald-600 flex-shrink-0" />,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-content-main">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>Phương thức thanh toán</span>
        </h3>
        <span className="text-xs text-content-muted">Bảo mật giao dịch 100%</span>
      </div>

      {error && (
        <p role="alert" className="text-xs text-status-danger font-medium">
          {error}
        </p>
      )}

      {/* Grid of Radio Cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {methods.map((method) => {
          const isSelected = value === method.id;
          return (
            <label
              key={method.id}
              className={`relative flex cursor-pointer items-start gap-3 rounded-theme border p-3.5 transition-all duration-150 ${
                isSelected
                  ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-xs'
                  : 'border-border-base bg-surface-card hover:bg-surface-subtle'
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method.id}
                checked={isSelected}
                onChange={() => onChange(method.id)}
                className="mt-1 h-4 w-4 text-primary focus:ring-primary"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-content-main">
                    {method.icon}
                    <span>{method.title}</span>
                  </div>
                  {method.badge && (
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${method.badgeColor}`}
                    >
                      {method.badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-content-muted leading-relaxed">
                  {method.description}
                </p>
              </div>
            </label>
          );
        })}
      </div>

      {/* Contextual Information Panels */}
      {value === 'vietqr' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-theme border border-primary/20 bg-primary/5 p-3.5 text-xs text-content-main">
          <span>
            Sau khi bấm <strong>Đặt hàng</strong>, mã QR VietQR kèm cú pháp chuyển khoản chính xác
            sẽ hiển thị ngay để bạn quét qua app ngân hàng.
          </span>
          {onPreviewVietQR && (
            <button
              type="button"
              onClick={onPreviewVietQR}
              className="font-bold text-primary hover:underline whitespace-nowrap self-start sm:self-auto"
            >
              Xem trước QR
            </button>
          )}
        </div>
      )}

      {value === 'momo' && (
        <div className="rounded-theme border border-pink-500/20 bg-pink-500/5 p-3.5 text-xs text-content-main space-y-1">
          <p className="font-semibold text-pink-700">Thông tin chuyển Ví MoMo:</p>
          <p className="text-content-muted">
            Số điện thoại nhận: <strong className="text-content-main">0918.889.999</strong> (D2C STORE
            VIETNAM). Hệ thống tự động xác nhận sau khi nhận được chuyển khoản.
          </p>
        </div>
      )}

      {value === 'card' && (
        <div className="rounded-theme border border-border-base bg-surface-subtle p-3.5 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-content-main">
              Thông tin thẻ thanh toán (Demo Sandbox)
            </span>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
              Mô phỏng Sandbox
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="block text-[10px] text-content-muted mb-1">Số thẻ</label>
              <input
                placeholder="4242 4242 4242 4242"
                defaultValue="4242 4242 4242 4242"
                readOnly
                className="w-full rounded border border-border-base bg-surface-card px-2.5 py-1.5 text-xs font-mono text-content-main outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] text-content-muted mb-1">Tên chủ thẻ</label>
              <input
                placeholder="NGUYEN VAN A"
                defaultValue="NGUYEN VAN A"
                readOnly
                className="w-full rounded border border-border-base bg-surface-card px-2.5 py-1.5 text-xs text-content-main uppercase outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] text-content-muted mb-1">Hạn dùng</label>
              <input
                placeholder="12/28"
                defaultValue="12/28"
                readOnly
                className="w-full rounded border border-border-base bg-surface-card px-2.5 py-1.5 text-xs text-content-main outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] text-content-muted mb-1">CVV/CVC</label>
              <input
                placeholder="888"
                defaultValue="888"
                readOnly
                className="w-full rounded border border-border-base bg-surface-card px-2.5 py-1.5 text-xs text-content-main outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
