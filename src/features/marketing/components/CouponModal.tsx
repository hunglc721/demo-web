import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Percent,
  DollarSign,
  Truck,
  Save,
} from 'lucide-react';
import { Coupon, CouponDiscountType } from '@/types/coupon';
import { Modal } from '@/core/components/Modal';
import { Switch } from '@/core/components/Switch';
import { couponService } from '@/services/api/couponService';
import { toast } from '@/stores/toastStore';

export interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCoupon: Coupon | null;
  onSaved: (coupon: Coupon) => void;
}

export const CouponModal: React.FC<CouponModalProps> = ({
  isOpen,
  onClose,
  editingCoupon,
  onSaved,
}) => {
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<CouponDiscountType>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(15);
  const [minOrderValue, setMinOrderValue] = useState<number>(200000);
  const [maxDiscount, setMaxDiscount] = useState<number | undefined>(50000);
  const [usageLimit, setUsageLimit] = useState<number>(100);
  const [perCustomerLimit, setPerCustomerLimit] = useState<number>(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Initialize or reset form values
  useEffect(() => {
    if (editingCoupon) {
      setCode(editingCoupon.code);
      setTitle(editingCoupon.title);
      setDescription(editingCoupon.description || '');
      setDiscountType(editingCoupon.discountType);
      setDiscountValue(editingCoupon.discountValue);
      setMinOrderValue(editingCoupon.minOrderValue || 0);
      setMaxDiscount(editingCoupon.maxDiscount);
      setUsageLimit(editingCoupon.usageLimit || 100);
      setPerCustomerLimit(editingCoupon.perCustomerLimit || 1);
      setStartDate(editingCoupon.startDate.slice(0, 10));
      setEndDate(editingCoupon.endDate.slice(0, 10));
      setIsActive(editingCoupon.isActive);
    } else {
      const now = new Date();
      const nextMonth = new Date();
      nextMonth.setDate(now.getDate() + 30);

      setCode(generateRandomCode());
      setTitle('Ưu đãi mua sắm D2C Store');
      setDescription('Giảm giá đặc biệt dành cho khách hàng mua sắm trực tuyến.');
      setDiscountType('percentage');
      setDiscountValue(15);
      setMinOrderValue(200000);
      setMaxDiscount(50000);
      setUsageLimit(100);
      setPerCustomerLimit(1);
      setStartDate(now.toISOString().slice(0, 10));
      setEndDate(nextMonth.toISOString().slice(0, 10));
      setIsActive(true);
    }
  }, [editingCoupon, isOpen]);

  // Helper to generate a realistic random coupon code
  function generateRandomCode(): string {
    const prefixes = ['SALE', 'D2C', 'VOUCHER', 'DISCOUNT', 'VIP', 'FLASH', 'TIETKIEM'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randNum = Math.floor(10 + Math.random() * 90);
    return `${prefix}${randNum}`;
  }

  const handleGenerateCode = () => {
    setCode(generateRandomCode());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode || cleanCode.length < 3) {
      toast.error('Mã giảm giá phải có ít nhất 3 ký tự.');
      return;
    }
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề chương trình.');
      return;
    }
    if (discountValue <= 0) {
      toast.error('Giá trị giảm giá phải lớn hơn 0.');
      return;
    }
    if (discountType === 'percentage' && discountValue > 100) {
      toast.error('Giảm theo phần trăm không được vượt quá 100%.');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      toast.error('Ngày kết thúc không được sớm hơn ngày bắt đầu.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        code: cleanCode,
        title: title.trim(),
        description: description.trim(),
        discountType,
        discountValue: Number(discountValue),
        minOrderValue: Number(minOrderValue),
        maxDiscount: discountType === 'percentage' && maxDiscount ? Number(maxDiscount) : undefined,
        usageLimit: Number(usageLimit),
        perCustomerLimit: Number(perCustomerLimit),
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        isActive,
      };

      if (editingCoupon) {
        const updated = await couponService.updateCoupon(editingCoupon.id, payload);
        toast.success(`Đã cập nhật mã ưu đãi "${cleanCode}"!`);
        onSaved(updated);
      } else {
        const created = await couponService.createCoupon(payload as any);
        toast.success(`Đã tạo mã ưu đãi "${cleanCode}" thành công!`);
        onSaved(created);
      }

      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Có lỗi xảy ra khi lưu mã giảm giá.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingCoupon ? `Chỉnh Sửa Mã: ${editingCoupon.code}` : 'Tạo Mã Giảm Giá Mới'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-xs text-content-main">
        {/* Code & Random Generator */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-content-main">
                Mã Voucher / Coupon <span className="text-status-danger">*</span>
              </label>
              <button
                type="button"
                onClick={handleGenerateCode}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
              >
                <Sparkles className="w-3 h-3" />
                <span>Tạo ngẫu nhiên</span>
              </button>
            </div>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="VD: D2C15OFF"
              className="w-full bg-surface-subtle border border-border-base rounded-theme px-3.5 py-2 text-xs font-mono font-bold tracking-wider text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40 uppercase"
            />
          </div>

          <div>
            <label className="block font-semibold text-content-main mb-1">
              Tiêu đề chương trình <span className="text-status-danger">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Giảm 15% chào hè"
              className="w-full bg-surface-subtle border border-border-base rounded-theme px-3.5 py-2 text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block font-semibold text-content-main mb-1">Mô tả điều kiện</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Áp dụng cho đơn từ 200.000 ₫, tối đa giảm 50.000 ₫"
            className="w-full bg-surface-subtle border border-border-base rounded-theme px-3.5 py-2 text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Discount Type 3-Way Selector */}
        <div>
          <label className="block font-semibold text-content-main mb-2">
            Hình thức chiết khấu <span className="text-status-danger">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'percentage', label: 'Theo Phần Trăm (%)', icon: Percent },
              { id: 'fixed', label: 'Số Tiền Cố Định (₫)', icon: DollarSign },
              { id: 'free_shipping', label: 'Miễn Phí Vận Chuyển', icon: Truck },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setDiscountType(t.id as CouponDiscountType)}
                className={`flex flex-col items-center justify-center p-3 rounded-theme border text-xs font-semibold gap-1.5 transition-all text-center ${
                  discountType === t.id
                    ? 'border-primary bg-primary/10 text-primary shadow-xs'
                    : 'border-border-base bg-surface-subtle text-content-muted hover:text-content-main'
                }`}
              >
                <t.icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Value & Caps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-content-main mb-1">
              {discountType === 'percentage'
                ? 'Phần trăm giảm (%)'
                : discountType === 'fixed'
                ? 'Số tiền giảm (VND)'
                : 'Giảm tối đa phí ship (VND)'}
            </label>
            <input
              type="number"
              required
              min={1}
              max={discountType === 'percentage' ? 100 : undefined}
              value={discountValue}
              onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
              className="w-full bg-surface-subtle border border-border-base rounded-theme px-3.5 py-2 text-xs font-semibold text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="block font-semibold text-content-main mb-1">
              Đơn hàng tối thiểu (VND)
            </label>
            <input
              type="number"
              min={0}
              value={minOrderValue}
              onChange={(e) => setMinOrderValue(Number(e.target.value) || 0)}
              className="w-full bg-surface-subtle border border-border-base rounded-theme px-3.5 py-2 text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {discountType === 'percentage' && (
          <div>
            <label className="block font-semibold text-content-main mb-1">
              Mức giảm tối đa (VND) (Để trống nếu không giới hạn trần)
            </label>
            <input
              type="number"
              min={0}
              placeholder="VD: 50000"
              value={maxDiscount ?? ''}
              onChange={(e) =>
                setMaxDiscount(e.target.value === '' ? undefined : Number(e.target.value))
              }
              className="w-full bg-surface-subtle border border-border-base rounded-theme px-3.5 py-2 text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        )}

        {/* Usage Limits & Date Validity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-content-main mb-1">
              Tổng lượt sử dụng tối đa
            </label>
            <input
              type="number"
              min={1}
              value={usageLimit}
              onChange={(e) => setUsageLimit(Number(e.target.value) || 1)}
              className="w-full bg-surface-subtle border border-border-base rounded-theme px-3.5 py-2 text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="block font-semibold text-content-main mb-1">
              Giới hạn lượt / khách hàng
            </label>
            <input
              type="number"
              min={1}
              value={perCustomerLimit}
              onChange={(e) => setPerCustomerLimit(Number(e.target.value) || 1)}
              className="w-full bg-surface-subtle border border-border-base rounded-theme px-3.5 py-2 text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-content-main mb-1">Ngày bắt đầu</label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-surface-subtle border border-border-base rounded-theme px-3.5 py-2 text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="block font-semibold text-content-main mb-1">Ngày kết thúc</label>
            <input
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-surface-subtle border border-border-base rounded-theme px-3.5 py-2 text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {/* Active Toggle */}
        <div className="pt-2 border-t border-border-base">
          <Switch
            checked={isActive}
            onChange={setIsActive}
            label="Kích hoạt mã ưu đãi này"
            description="Cho phép khách hàng áp dụng mã tại giỏ hàng và thanh toán"
            size="sm"
          />
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-border-base">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-theme border border-border-base bg-surface-card hover:bg-surface-subtle text-xs font-semibold text-content-main transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-theme bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-xs transition-all disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{submitting ? 'Đang lưu...' : editingCoupon ? 'Lưu thay đổi' : 'Tạo mã mới'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CouponModal;
