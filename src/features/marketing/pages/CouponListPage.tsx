import React, { useState, useEffect, useMemo } from 'react';
import {
  Ticket,
  Plus,
  Search,
  Copy,
  Check,
  Edit,
  Trash2,
  RefreshCw,
  Percent,
  DollarSign,
  Truck,
} from 'lucide-react';
import { couponService } from '@/services/api/couponService';
import { Coupon, CouponDiscountType } from '@/types/coupon';
import { Modal } from '@/core/components/Modal';
import { Switch } from '@/core/components/Switch';
import { formatCurrencyVND } from '@/utils/formatters';
import { matchesVietnameseSearch } from '@/utils/vietnameseSearch';
import { CouponModal } from '../components/CouponModal';
import { toast } from '@/stores/toastStore';

export const CouponListPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [couponToDelete, setProductToDelete] = useState<Coupon | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Load coupons from DAL
  useEffect(() => {
    let isMounted = true;
    async function loadCoupons() {
      setLoading(true);
      try {
        const res = await couponService.getCoupons({ limit: 100 });
        if (isMounted) {
          setCoupons(res.data);
        }
      } catch (err) {
        console.error('Lỗi tải mã ưu đãi:', err);
        toast.error('Không thể tải danh sách mã giảm giá.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadCoupons();
    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  // Filtering
  const filteredCoupons = useMemo(() => {
    const now = new Date();

    return coupons.filter((c) => {
      // 1. Discount Type
      if (selectedType !== 'all' && c.discountType !== selectedType) {
        return false;
      }

      // 2. Status
      const isExpired = new Date(c.endDate) < now;
      if (selectedStatus === 'active' && (!c.isActive || isExpired)) return false;
      if (selectedStatus === 'inactive' && c.isActive) return false;
      if (selectedStatus === 'expired' && !isExpired) return false;

      // 3. Search
      if (searchQuery.trim()) {
        const matched = matchesVietnameseSearch(
          [c.code, c.title, c.description || ''],
          searchQuery
        );
        if (!matched) return false;
      }

      return true;
    });
  }, [coupons, selectedType, selectedStatus, searchQuery]);

  // Toggle active switch
  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const nextActive = !coupon.isActive;
      const updated = await couponService.updateCoupon(coupon.id, { isActive: nextActive });
      setCoupons((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      toast.info(
        `Đã ${nextActive ? 'kích hoạt' : 'tạm dừng'} mã ưu đãi "${coupon.code}"`
      );
    } catch (err) {
      toast.error('Lỗi khi cập nhật trạng thái mã.');
    }
  };

  // Copy code with feedback
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast.success(`Đã sao chép mã: ${code}`);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!couponToDelete) return;
    try {
      await couponService.deleteCoupon(couponToDelete.id);
      setCoupons((prev) => prev.filter((c) => c.id !== couponToDelete.id));
      toast.success(`Đã xóa mã ưu đãi "${couponToDelete.code}".`);
      setProductToDelete(null);
    } catch (err) {
      toast.error('Lỗi khi xóa mã ưu đãi.');
    }
  };

  // Render Discount Type Badge
  const renderDiscountTypeBadge = (type: CouponDiscountType) => {
    switch (type) {
      case 'percentage':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Percent className="w-3 h-3" />
            <span>Phần trăm (%)</span>
          </span>
        );
      case 'fixed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <DollarSign className="w-3 h-3" />
            <span>Tiền mặt (₫)</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Truck className="w-3 h-3" />
            <span>Miễn phí VC</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-content-main tracking-tight">
            Quản Lý Mã Giảm Giá & Khuyến Mãi (Coupons)
          </h1>
          <p className="text-sm text-content-muted mt-0.5">
            Tạo voucher chiết khấu theo %, tiền mặt hoặc freeship với điều kiện giá trị đơn hàng tối thiểu.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-theme border border-border-base bg-surface-card hover:bg-surface-subtle text-xs font-semibold text-content-main shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-primary' : ''}`} />
            <span>Làm mới</span>
          </button>
          <button
            onClick={() => {
              setEditingCoupon(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-theme bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Mã Mới</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-theme bg-surface-card border border-border-base flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Tìm theo mã coupon (VD: CHAOBAN), tiêu đề chương trình, mô tả..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-subtle border border-border-base rounded-theme pl-9 pr-8 py-2 text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <Search className="w-4 h-4 text-content-muted absolute left-3 top-2.5" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-content-muted hover:text-content-main text-xs font-bold"
            >
              ×
            </button>
          )}
        </div>

        <div className="w-full md:w-52">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full bg-surface-subtle border border-border-base rounded-theme px-3 py-2 text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="all">Loại chiết khấu: Tất cả</option>
            <option value="percentage">Giảm theo % (Phần trăm)</option>
            <option value="fixed">Giảm số tiền cố định (₫)</option>
            <option value="free_shipping">Miễn phí vận chuyển</option>
          </select>
        </div>

        <div className="w-full md:w-48">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-surface-subtle border border-border-base rounded-theme px-3 py-2 text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="all">Trạng thái: Tất cả</option>
            <option value="active">Đang kích hoạt</option>
            <option value="inactive">Đã tạm dừng</option>
            <option value="expired">Đã hết hạn</option>
          </select>
        </div>

        {(searchQuery || selectedType !== 'all' || selectedStatus !== 'all') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedType('all');
              setSelectedStatus('all');
            }}
            className="px-3 py-2 rounded-theme border border-border-base hover:bg-surface-subtle text-xs font-semibold text-content-muted hover:text-content-main transition-colors whitespace-nowrap"
          >
            Đặt lại
          </button>
        )}
      </div>

      {/* Coupons Table */}
      <div className="rounded-theme border border-border-base bg-surface-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border-base bg-surface-subtle text-content-muted font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3.5">Mã Voucher</th>
                <th className="py-3 px-3">Chương Trình & Loại</th>
                <th className="py-3 px-3">Mức Giảm Giá</th>
                <th className="py-3 px-3">Đơn Tối Thiểu</th>
                <th className="py-3 px-3">Lượt Đã Dùng</th>
                <th className="py-3 px-3">Thời Hạn</th>
                <th className="py-3 px-3">Kích Hoạt</th>
                <th className="py-3 px-3.5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-content-muted">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent mb-2" />
                    <p>Đang tải danh sách mã giảm giá...</p>
                  </td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-content-muted">
                    <Ticket className="w-10 h-10 text-border-base mx-auto mb-2" />
                    <p className="text-xs font-semibold text-content-main">
                      Không tìm thấy mã giảm giá nào
                    </p>
                    <p className="text-[11px] text-content-muted mt-0.5">
                      Thử thay đổi từ khóa tìm kiếm hoặc bấm &quot;Tạo Mã Mới&quot; ở trên.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((c) => {
                  const isExpired = new Date(c.endDate) < new Date();
                  const isExhausted = c.usedCount >= c.usageLimit;
                  const usagePercent = Math.min(
                    100,
                    Math.round(((c.usedCount || 0) / (c.usageLimit || 1)) * 100)
                  );

                  return (
                    <tr key={c.id} className="hover:bg-surface-subtle transition-colors">
                      {/* Code Pill + 1-Click Copy */}
                      <td className="py-3.5 px-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-black tracking-wider px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20">
                            {c.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(c.code)}
                            className="p-1 rounded text-content-muted hover:text-content-main hover:bg-surface-subtle transition-colors"
                            title="Sao chép mã"
                          >
                            {copiedCode === c.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Title & Type Badge */}
                      <td className="py-3.5 px-3 min-w-[200px]">
                        <div className="font-bold text-content-main">{c.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          {renderDiscountTypeBadge(c.discountType)}
                          {isExpired && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600">
                              Hết hạn
                            </span>
                          )}
                          {isExhausted && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600">
                              Hết lượt
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Discount Value */}
                      <td className="py-3.5 px-3 font-bold text-content-main">
                        {c.discountType === 'percentage' ? (
                          <div>
                            <span>Giảm {c.discountValue}%</span>
                            {c.maxDiscount && (
                              <span className="block text-[10px] text-content-muted font-normal">
                                Tối đa {formatCurrencyVND(c.maxDiscount)}
                              </span>
                            )}
                          </div>
                        ) : c.discountType === 'fixed' ? (
                          formatCurrencyVND(c.discountValue)
                        ) : (
                          <span>Miễn phí giao hàng</span>
                        )}
                      </td>

                      {/* Min Order Value */}
                      <td className="py-3.5 px-3 text-content-muted">
                        {c.minOrderValue > 0 ? (
                          <span>Từ {formatCurrencyVND(c.minOrderValue)}</span>
                        ) : (
                          <span className="text-emerald-600 font-semibold">Mọi đơn hàng</span>
                        )}
                      </td>

                      {/* Usage Progress */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-medium text-content-muted">
                            <span>{c.usedCount}</span>
                            <span>{c.usageLimit} lượt</span>
                          </div>
                          <div className="w-24 bg-surface-subtle rounded-full h-1.5 overflow-hidden">
                            <div
                              style={{ width: `${usagePercent}%` }}
                              className={`h-full rounded-full transition-all ${
                                usagePercent >= 100 ? 'bg-amber-500' : 'bg-primary'
                              }`}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Validity Dates */}
                      <td className="py-3.5 px-3 text-content-muted text-[11px]">
                        <div>{new Date(c.startDate).toLocaleDateString('vi-VN')}</div>
                        <div className="text-[10px]">
                          đến {new Date(c.endDate).toLocaleDateString('vi-VN')}
                        </div>
                      </td>

                      {/* Active Switch */}
                      <td className="py-3.5 px-3">
                        <Switch
                          checked={c.isActive && !isExpired}
                          disabled={isExpired}
                          onChange={() => handleToggleActive(c)}
                          size="sm"
                        />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCoupon(c);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 rounded-theme text-content-muted hover:text-primary hover:bg-surface-subtle transition-colors"
                            title="Chỉnh sửa mã"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setProductToDelete(c)}
                            className="p-1.5 rounded-theme text-content-muted hover:text-status-danger hover:bg-surface-subtle transition-colors"
                            title="Xóa mã này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Coupon Modal */}
      <CouponModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCoupon(null);
        }}
        editingCoupon={editingCoupon}
        onSaved={(saved) => {
          setCoupons((prev) => {
            const exists = prev.some((c) => c.id === saved.id);
            if (exists) {
              return prev.map((c) => (c.id === saved.id ? saved : c));
            }
            return [saved, ...prev];
          });
        }}
      />

      {/* Delete Coupon Confirmation Modal */}
      <Modal
        isOpen={Boolean(couponToDelete)}
        onClose={() => setProductToDelete(null)}
        title="Xác Nhận Xóa Mã Giảm Giá"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-content-muted">
            Bạn có chắc chắn muốn xóa mã ưu đãi{' '}
            <strong className="text-content-main font-semibold">
              &quot;{couponToDelete?.code}&quot;
            </strong>{' '}
            ({couponToDelete?.title})? Khách hàng sẽ không thể nhập mã này tại giỏ hàng nữa.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setProductToDelete(null)}
              className="px-4 py-2 rounded-theme border border-border-base bg-surface-card hover:bg-surface-subtle text-xs font-semibold text-content-main transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              className="px-4 py-2 rounded-theme bg-status-danger text-white text-xs font-bold hover:bg-red-700 transition-colors"
            >
              Xác nhận xóa
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CouponListPage;
