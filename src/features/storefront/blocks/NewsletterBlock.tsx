import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { z } from 'zod';
import { toast } from '@/stores/toastStore';

export interface NewsletterBlockProps {
  settings?: {
    title?: string;
    subtitle?: string;
    placeholder?: string;
    buttonText?: string;
  };
}

const newsletterSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập email của bạn')
    .email('Địa chỉ email không đúng định dạng (ví dụ: name@domain.com)'),
});

export const NewsletterBlock: React.FC<NewsletterBlockProps> = ({ settings }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const title = settings?.title || 'Đăng Ký Nhận Bản Tin Ưu Đãi';
  const subtitle =
    settings?.subtitle ||
    'Nhận thông tin bộ sưu tập mới và các mã giảm giá bí mật độc quyền hàng tuần.';
  const placeholder = settings?.placeholder || 'Nhập email của bạn...';
  const buttonText = settings?.buttonText || 'Đăng Ký Ngay';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = newsletterSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.issues[0]?.message || 'Email không hợp lệ');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setIsSubmitted(true);
      toast.success('Đăng ký nhận bản tin thành công! Kiểm tra hộp thư của bạn nhé.');
      setEmail('');
    }, 400);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-surface-card to-surface-subtle border border-border-base p-8 sm:p-12 text-center max-w-4xl mx-auto shadow-sm space-y-6">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner">
          <Mail className="w-6 h-6" />
        </div>

        <div className="space-y-2 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-content-main tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-content-muted leading-relaxed">
            {subtitle}
          </p>
        </div>

        {isSubmitted ? (
          <div className="p-4 rounded-theme bg-primary/10 border border-primary/30 max-w-md mx-auto flex items-center justify-center gap-2 text-primary font-semibold text-sm animate-in zoom-in-95">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>Bạn đã đăng ký nhận bản tin thành công!</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-2">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder={placeholder}
                  className={`w-full bg-surface-card border rounded-theme px-4 py-3 text-sm text-content-main placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all ${
                    error ? 'border-status-danger' : 'border-border-base focus:border-primary'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3 rounded-theme bg-primary text-white font-semibold text-sm hover:bg-primary-hover active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 flex-shrink-0 disabled:opacity-70"
              >
                {loading ? (
                  <span>Đang gửi...</span>
                ) : (
                  <>
                    <span>{buttonText}</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {error && (
              <p className="text-xs text-status-danger font-medium flex items-center justify-center gap-1.5 pt-1 text-left sm:text-center">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{error}</span>
              </p>
            )}
          </form>
        )}

        <p className="text-[11px] text-content-muted">
          Chúng tôi tôn trọng quyền riêng tư của bạn. Có thể hủy đăng ký bất kỳ lúc nào chỉ với 1 click.
        </p>
      </div>
    </section>
  );
};
export default NewsletterBlock;
