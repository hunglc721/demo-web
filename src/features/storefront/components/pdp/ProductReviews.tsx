import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, ThumbsUp, MessageSquarePlus, AlertCircle, X } from 'lucide-react';
import { z } from 'zod';
import { ProductReview } from '@/types/review';
import { reviewService, RatingSummary } from '@/services/api/reviewService';
import { formatDateVN } from '@/utils/formatters';
import { toast } from '@/stores/toastStore';
import { cn } from '@/utils/cn';

export interface ProductReviewsProps {
  productId: string;
  productName: string;
}

const reviewSchema = z.object({
  userName: z.string().trim().min(2, 'Họ và tên tối thiểu 2 ký tự').max(50, 'Tối đa 50 ký tự'),
  email: z.string().trim().email('Email không đúng định dạng').or(z.literal('')),
  rating: z.number().min(1, 'Vui lòng chọn số sao đánh giá (1-5 sao)').max(5),
  fitFeedback: z.string().optional(),
  content: z.string().trim().min(10, 'Nội dung nhận xét tối thiểu 10 ký tự').max(1000, 'Tối đa 1000 ký tự'),
});

export const ProductReviews: React.FC<ProductReviewsProps> = ({ productId, productName }) => {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [summary, setSummary] = useState<RatingSummary>({
    average: 5.0,
    count: 0,
    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRating, setFormRating] = useState(5);
  const [formHoverRating, setFormHoverRating] = useState(0);
  const [formFit, setFormFit] = useState('Vừa vặn đúng size');
  const [formContent, setFormContent] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const [list, sum] = await Promise.all([
        reviewService.getReviewsByProductId(productId),
        reviewService.getRatingSummary(productId),
      ]);
      setReviews(list);
      setSummary(sum);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();

    const handleUpdate = (e: any) => {
      if (e.detail?.productId === productId) {
        loadReviews();
      }
    };
    window.addEventListener('d2c:reviews-updated', handleUpdate);
    return () => window.removeEventListener('d2c:reviews-updated', handleUpdate);
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const parseResult = reviewSchema.safeParse({
      userName: formName,
      email: formEmail,
      rating: formRating,
      fitFeedback: formFit,
      content: formContent,
    });

    if (!parseResult.success) {
      const errMap: Record<string, string> = {};
      parseResult.error.issues.forEach((err) => {
        const path = err.path[0] as string;
        errMap[path] = err.message;
      });
      setFormErrors(errMap);
      return;
    }

    try {
      setSubmitting(true);
      const newRev = await reviewService.addReview({
        productId,
        userName: formName.trim(),
        rating: formRating,
        fitFeedback: formFit,
        content: formContent.trim(),
        verifiedPurchase: true,
      });

      setReviews((prev) => [newRev, ...prev]);
      setShowForm(false);
      setFormName('');
      setFormEmail('');
      setFormContent('');
      setFormRating(5);
      toast.success('Cảm ơn bạn đã gửi đánh giá sản phẩm!');
      loadReviews();
    } catch {
      toast.error('Có lỗi xảy ra khi lưu đánh giá.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Rating Summary Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-surface-subtle border border-border-base grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Score & Stars */}
        <div className="md:col-span-4 text-center md:text-left space-y-2 border-b md:border-b-0 md:border-r border-border-base pb-6 md:pb-0 md:pr-6">
          <div className="text-4xl sm:text-5xl font-black text-content-main leading-tight">
            {summary.average.toFixed(1)}
            <span className="text-lg font-normal text-content-muted"> / 5.0</span>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-1 text-amber-500">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'w-5 h-5',
                  i < Math.round(summary.average)
                    ? 'fill-amber-500 text-amber-500'
                    : 'text-border-base'
                )}
              />
            ))}
          </div>

          <p className="text-xs text-content-muted">
            Dựa trên {summary.count} lượt đánh giá từ khách hàng đã mua
          </p>

          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-4 py-2 mt-2 rounded-theme bg-primary text-white text-xs font-semibold hover:bg-primary-hover active:scale-95 transition-all shadow-sm"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Viết Đánh Giá</span>
          </button>
        </div>

        {/* 5-Star Distribution Bars */}
        <div className="md:col-span-8 space-y-2 text-xs">
          {[5, 4, 3, 2, 1].map((stars) => {
            const starCount = summary.breakdown[stars] || 0;
            const pct = summary.count > 0 ? Math.round((starCount / summary.count) * 100) : 0;
            return (
              <div key={stars} className="flex items-center gap-3">
                <span className="w-12 text-content-muted font-medium flex items-center gap-1 justify-end">
                  {stars} <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                </span>
                <div className="flex-1 h-2 rounded-full bg-surface-card border border-border-base overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-10 text-content-muted text-right font-medium">
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Review Submission Form (Inline or Collapsible) */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="p-6 rounded-2xl bg-surface-card border border-primary/30 shadow-md space-y-5 animate-in fade-in slide-in-from-top-2"
        >
          <div className="flex items-center justify-between pb-3 border-b border-border-base">
            <h4 className="font-bold text-sm text-content-main flex items-center gap-2">
              <MessageSquarePlus className="w-4 h-4 text-primary" />
              <span>Đánh giá sản phẩm: "{productName}"</span>
            </h4>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-content-muted hover:text-content-main p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Star Rating Picker */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-content-main">
              Mức độ hài lòng của bạn <span className="text-status-danger">*</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = (formHoverRating || formRating) >= star;
                  return (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setFormRating(star)}
                      onMouseEnter={() => setFormHoverRating(star)}
                      onMouseLeave={() => setFormHoverRating(0)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={cn(
                          'w-6 h-6',
                          filled ? 'fill-amber-500 text-amber-500' : 'text-border-base'
                        )}
                      />
                    </button>
                  );
                })}
              </div>
              <span className="text-xs font-semibold text-amber-600">
                {formRating === 5
                  ? 'Tuyệt vời'
                  : formRating === 4
                  ? 'Rất tốt'
                  : formRating === 3
                  ? 'Bình thường'
                  : formRating === 2
                  ? 'Tạm được'
                  : 'Rất tệ'}
              </span>
            </div>
            {formErrors.rating && (
              <p className="text-xs text-status-danger flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {formErrors.rating}
              </p>
            )}
          </div>

          {/* User Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-content-main">
                Họ và tên của bạn <span className="text-status-danger">*</span>
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Nguyễn Văn A"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className={`w-full bg-surface-subtle border rounded px-3 py-2 text-xs text-content-main focus:outline-none focus:ring-1 focus:ring-primary ${
                  formErrors.userName ? 'border-status-danger' : 'border-border-base'
                }`}
              />
              {formErrors.userName && (
                <p className="text-[11px] text-status-danger flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {formErrors.userName}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-content-main">
                Email (tùy chọn)
              </label>
              <input
                type="email"
                placeholder="email@example.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="w-full bg-surface-subtle border border-border-base rounded px-3 py-2 text-xs text-content-main focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Fit Feedback */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-content-main">
              Đánh giá độ vừa vặn / size
            </label>
            <div className="flex flex-wrap gap-2">
              {['Chật hơn bình thường', 'Vừa vặn đúng size', 'Rộng rãi thoải mái'].map((fit) => (
                <button
                  type="button"
                  key={fit}
                  onClick={() => setFormFit(fit)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                    formFit === fit
                      ? 'bg-primary text-white border-primary'
                      : 'bg-surface-subtle text-content-muted border-border-base hover:border-primary/50'
                  )}
                >
                  {fit}
                </button>
              ))}
            </div>
          </div>

          {/* Review Content */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-content-main">
              Nhận xét chi tiết <span className="text-status-danger">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Chia sẻ cảm nhận về chất liệu, đường may, trải nghiệm sử dụng sản phẩm..."
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              className={`w-full bg-surface-subtle border rounded px-3 py-2 text-xs text-content-main focus:outline-none focus:ring-1 focus:ring-primary ${
                formErrors.content ? 'border-status-danger' : 'border-border-base'
              }`}
            />
            {formErrors.content && (
              <p className="text-[11px] text-status-danger flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {formErrors.content}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border-base">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-theme border border-border-base text-xs font-semibold text-content-muted hover:bg-surface-subtle transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-theme bg-primary text-white text-xs font-bold hover:bg-primary-hover active:scale-95 transition-all shadow"
            >
              {submitting ? 'Đang gửi...' : 'Gửi Đánh Giá'}
            </button>
          </div>
        </form>
      )}

      {/* 3. Review List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="p-5 rounded-theme bg-surface-card border border-border-base animate-pulse space-y-3"
              >
                <div className="h-4 w-32 bg-surface-subtle rounded" />
                <div className="h-3 w-full bg-surface-subtle rounded" />
                <div className="h-3 w-3/4 bg-surface-subtle rounded" />
              </div>
            ))}
          </div>
        ) : reviews.length > 0 ? (
          <div className="divide-y divide-border-base/70">
            {reviews.map((rev) => (
              <div key={rev.id} className="py-5 space-y-2.5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {/* User Avatar */}
                    {rev.userAvatar ? (
                      <img
                        src={rev.userAvatar}
                        alt={rev.userName}
                        className="w-10 h-10 rounded-full object-cover bg-surface-subtle border border-border-base flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {rev.userName.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-content-main">
                          {rev.userName}
                        </span>
                        {rev.verifiedPurchase && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            Đã mua hàng
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-content-muted">
                        {formatDateVN(rev.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Stars */}
                  <div className="flex items-center text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'w-4 h-4',
                          i < rev.rating
                            ? 'fill-amber-500 text-amber-500'
                            : 'text-border-base'
                        )}
                      />
                    ))}
                  </div>
                </div>

                {/* Fit Badge (if present) */}
                {rev.fitFeedback && (
                  <div className="text-xs">
                    <span className="text-content-muted">Độ vừa vặn: </span>
                    <span className="font-semibold text-content-main">
                      {rev.fitFeedback}
                    </span>
                  </div>
                )}

                {/* Review Text */}
                <p className="text-xs sm:text-sm text-content-muted leading-relaxed">
                  {rev.content}
                </p>

                {/* Helpful Likes */}
                <div className="flex items-center gap-4 text-xs text-content-muted pt-1">
                  <button
                    type="button"
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Hữu ích ({rev.likes ?? 0})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-content-muted bg-surface-card rounded-theme border border-border-base space-y-2">
            <p>Chưa có đánh giá nào cho sản phẩm này.</p>
            <p className="text-xs">Hãy là người đầu tiên chia sẻ cảm nhận của bạn!</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default ProductReviews;
