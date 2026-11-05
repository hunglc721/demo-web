import React, { useState } from 'react';
import { Tag, Copy, Check } from 'lucide-react';
import { toast } from '@/stores/toastStore';

export interface PromoBannerBlockProps {
  settings?: {
    title?: string;
    description?: string;
    couponCode?: string;
    buttonText?: string;
    bgGradient?: string;
  };
}

export const PromoBannerBlock: React.FC<PromoBannerBlockProps> = ({ settings }) => {
  const [copied, setCopied] = useState(false);

  const title = settings?.title || 'Gia Nhập Cộng Đồng D2C Starter — Nhận Ngay Voucher 50K';
  const description =
    settings?.description || 'Nhập mã CHAOBAN khi thanh toán đơn hàng đầu tiên từ 100K.';
  const couponCode = settings?.couponCode || 'CHAOBAN';
  const buttonText = settings?.buttonText || 'Sao Chép Mã';

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(couponCode);
      }
      setCopied(true);
      toast.success(`Đã sao chép mã voucher "${couponCode}" vào bộ nhớ tạm!`);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.info(`Mã voucher của bạn: ${couponCode}`);
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/15 via-primary/10 to-surface-card border border-primary/25 p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2 text-center md:text-left max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
            <Tag className="w-3.5 h-3.5" />
            <span>Ưu Đãi Đặc Biệt</span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-content-main tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-content-muted leading-relaxed">
            {description}
          </p>
        </div>

        {/* Voucher Code Box & Copy Button */}
        <div className="flex items-center gap-2 bg-surface-card border-2 border-dashed border-primary/40 rounded-theme p-2 px-3 shadow-md">
          <div className="flex flex-col pr-2">
            <span className="text-[10px] uppercase font-bold text-content-muted tracking-wider">
              Mã Voucher
            </span>
            <span className="font-mono font-black text-lg sm:text-xl text-primary tracking-widest">
              {couponCode}
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-theme bg-primary text-white text-xs font-bold hover:bg-primary-hover active:scale-95 transition-all shadow"
            title="Sao chép mã"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Đã Chép</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>{buttonText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
};
export default PromoBannerBlock;
