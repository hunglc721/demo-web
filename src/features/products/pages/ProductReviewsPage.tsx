import React, { useState, useEffect } from 'react';
import {
  Star,
  Search,
  MessageSquare,
  Trash2,
  EyeOff,
  Eye,
  CheckCircle2,
  X,
  Send,
} from 'lucide-react';
import { reviewService } from '@/services/api/reviewService';
import { productService } from '@/services/api/productService';
import { ProductReview } from '@/types/review';
import { Product } from '@/types';
import { STORAGE_KEYS } from '@/services/storage/storageKeys';
import { toast } from '@/stores/toastStore';
import { cn } from '@/utils/cn';

interface EnrichedReview extends ProductReview {
  productName?: string;
  isHidden?: boolean;
  storeReply?: string;
  storeReplyAt?: string;
}

export const ProductReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<EnrichedReview[]>([]);
  const [starFilter, setStarFilter] = useState<'all' | number>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyModalReview, setReplyModalReview] = useState<EnrichedReview | null>(null);
  const [replyText, setReplyText] = useState('');

  const loadData = async () => {
    try {
      const [allReviews, allProds] = await Promise.all([
        reviewService.getRepository().findMany(),
        productService.getProducts(),
      ]);

      const prodMap = new Map<string, string>(
        (allProds.data || []).map((p: Product) => [p.id, p.name])
      );

      const enriched: EnrichedReview[] = allReviews.map((r) => ({
        ...r,
        productName: prodMap.get(r.productId) || 'Sản phẩm D2C',
      }));

      // Sort newest first
      enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setReviews(enriched);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải danh sách đánh giá.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const saveReviews = (updated: EnrichedReview[]) => {
    setReviews(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleHide = async (review: EnrichedReview) => {
    const updated = reviews.map((r) =>
      r.id === review.id ? { ...r, isHidden: !r.isHidden } : r
    );
    await saveReviews(updated);
    toast.success(
      review.isHidden
        ? `Đã mở hiển thị lại đánh giá của ${review.userName}.`
        : `Đã tạm ẩn đánh giá của ${review.userName}.`
    );
  };

  const handleDelete = async (review: EnrichedReview) => {
    if (window.confirm(`Bạn có chắc muốn xóa đánh giá của "${review.userName}"?`)) {
      const updated = reviews.filter((r) => r.id !== review.id);
      await saveReviews(updated);
      toast.success('Đã xóa đánh giá thành công.');
    }
  };

  const handleOpenReply = (review: EnrichedReview) => {
    setReplyModalReview(review);
    setReplyText(review.storeReply || '');
  };

  const handleSaveReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyModalReview) return;

    const updated = reviews.map((r) =>
      r.id === replyModalReview.id
        ? {
            ...r,
            storeReply: replyText.trim(),
            storeReplyAt: new Date().toISOString(),
          }
        : r
    );
    await saveReviews(updated);
    toast.success('Đã gửi phản hồi của cửa hàng tới khách hàng!');
    setReplyModalReview(null);
  };

  const filteredReviews = reviews.filter((r) => {
    if (starFilter !== 'all' && Math.round(r.rating) !== starFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = r.userName.toLowerCase().includes(q);
      const matchContent = r.content.toLowerCase().includes(q);
      const matchProd = (r.productName || '').toLowerCase().includes(q);
      if (!matchName && !matchContent && !matchProd) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-base pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-content-main tracking-tight flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
            <span>Quản lý Đánh giá sản phẩm</span>
          </h1>
          <p className="text-xs sm:text-sm text-content-muted mt-1">
            Duyệt nhận xét của khách hàng, phản hồi chính thức từ cửa hàng và kiểm duyệt nội dung.
          </p>
        </div>
      </div>

      {/* Filter Tabs by Stars */}
      <div className="flex items-center gap-2 border-b border-border-base pb-1 overflow-x-auto">
        <button
          onClick={() => setStarFilter('all')}
          className={cn(
            'px-4 py-2 text-xs font-semibold rounded-t-theme transition-colors border-b-2 whitespace-nowrap',
            starFilter === 'all'
              ? 'border-primary text-primary bg-primary/5 font-bold'
              : 'border-transparent text-content-muted hover:text-content-main'
          )}
        >
          Tất cả ({reviews.length})
        </button>
        {[5, 4, 3, 2, 1].map((stars) => {
          const count = reviews.filter((r) => Math.round(r.rating) === stars).length;
          return (
            <button
              key={stars}
              onClick={() => setStarFilter(stars)}
              className={cn(
                'px-3 py-2 text-xs font-semibold rounded-t-theme transition-colors border-b-2 whitespace-nowrap flex items-center gap-1',
                starFilter === stars
                  ? 'border-amber-500 text-amber-600 bg-amber-500/5 font-bold'
                  : 'border-transparent text-content-muted hover:text-content-main'
              )}
            >
              <span>{stars}</span>
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>({count})</span>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-content-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên khách, nội dung đánh giá hoặc sản phẩm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-subtle border border-border-base rounded-theme pl-9 pr-3 py-2 text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      {/* Table or Empty State */}
      {filteredReviews.length === 0 ? (
        <div className="p-12 text-center rounded-theme bg-surface-card border border-border-base">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-3">
            <Star className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-content-main">Chưa có đánh giá phù hợp</h3>
          <p className="text-xs text-content-muted mt-1 max-w-md mx-auto">
            Không tìm thấy nhận xét nào với tiêu chí lọc đã chọn.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-theme border border-border-base bg-surface-card shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-subtle/80 border-b border-border-base text-content-muted font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3">KHÁCH HÀNG</th>
                <th className="p-3">SẢN PHẨM</th>
                <th className="p-3">ĐÁNH GIÁ (SAO)</th>
                <th className="p-3">NỘI DUNG NHẬN XÉT</th>
                <th className="p-3">PHẢN HỒI CỦA SHOP</th>
                <th className="p-3">NGÀY ĐĂNG</th>
                <th className="p-3 text-right">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base">
              {filteredReviews.map((r) => (
                <tr
                  key={r.id}
                  className={cn(
                    'hover:bg-surface-subtle/50 transition-colors',
                    r.isHidden && 'opacity-60 bg-slate-500/5'
                  )}
                >
                  <td className="p-3">
                    <div className="font-semibold text-content-main">{r.userName}</div>
                    {r.verifiedPurchase && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Đã mua hàng</span>
                      </span>
                    )}
                  </td>
                  <td className="p-3 max-w-[200px]">
                    <span className="font-medium text-content-main truncate block">
                      {r.productName}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'w-3.5 h-3.5',
                            i < Math.round(r.rating) ? 'fill-amber-400' : 'text-border-base'
                          )}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="p-3 max-w-sm">
                    {r.title && <div className="font-bold text-content-main">{r.title}</div>}
                    <p className="text-content-muted line-clamp-2">{r.content}</p>
                    {r.fitFeedback && (
                      <span className="inline-block mt-1 text-[10px] bg-surface-subtle px-1.5 py-0.5 rounded text-content-muted border border-border-base">
                        Độ vừa vặn: {r.fitFeedback}
                      </span>
                    )}
                  </td>
                  <td className="p-3 max-w-xs">
                    {r.storeReply ? (
                      <div className="p-2 rounded bg-primary/5 border border-primary/20 text-[11px] text-content-main">
                        <span className="font-bold text-primary block">Shop phản hồi:</span>
                        <p className="line-clamp-2">{r.storeReply}</p>
                      </div>
                    ) : (
                      <span className="text-content-muted text-[11px] italic">Chưa phản hồi</span>
                    )}
                  </td>
                  <td className="p-3 text-content-muted text-[11px] whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="p-3 text-right space-x-1 whitespace-nowrap">
                    <button
                      onClick={() => handleOpenReply(r)}
                      className="p-1.5 rounded hover:bg-surface-subtle text-content-muted hover:text-primary transition-colors"
                      title="Phản hồi đánh giá"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleHide(r)}
                      className={cn(
                        'p-1.5 rounded hover:bg-surface-subtle transition-colors',
                        r.isHidden ? 'text-amber-500' : 'text-content-muted hover:text-content-main'
                      )}
                      title={r.isHidden ? 'Mở lại hiển thị' : 'Tạm ẩn đánh giá này'}
                    >
                      {r.isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(r)}
                      className="p-1.5 rounded hover:bg-surface-subtle text-content-muted hover:text-rose-600 transition-colors"
                      title="Xóa đánh giá"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reply Modal */}
      {replyModalReview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <form
            onSubmit={handleSaveReply}
            className="bg-surface-card border border-border-base rounded-theme shadow-2xl max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border-base pb-3">
              <h3 className="font-bold text-base text-content-main flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <span>Phản hồi đánh giá của {replyModalReview.userName}</span>
              </h3>
              <button
                type="button"
                onClick={() => setReplyModalReview(null)}
                className="p-1 rounded text-content-muted hover:text-content-main hover:bg-surface-subtle"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded bg-surface-subtle border border-border-base text-xs space-y-1">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'w-3 h-3',
                      i < Math.round(replyModalReview.rating) ? 'fill-amber-400' : 'text-border-base'
                    )}
                  />
                ))}
              </div>
              <p className="text-content-main italic">"{replyModalReview.content}"</p>
            </div>

            <div className="space-y-1 text-xs">
              <label className="block font-semibold text-content-main">
                Nội dung phản hồi chính thức từ cửa hàng <span className="text-status-danger">*</span>
              </label>
              <textarea
                rows={4}
                required
                placeholder="D2C Store xin cảm ơn bạn đã tin tưởng và ủng hộ..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full bg-surface-subtle border border-border-base rounded-theme p-3 text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-base">
              <button
                type="button"
                onClick={() => setReplyModalReview(null)}
                className="px-3 py-1.5 rounded-theme border border-border-base text-xs font-semibold text-content-main hover:bg-surface-subtle"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-theme bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Lưu phản hồi</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProductReviewsPage;
