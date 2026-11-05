import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  ChevronRight,
  Home,
  LoaderCircle,
  Lock,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { SHIPPING_CONFIG, calculateShippingFee } from '@/config/shipping';
import { formatCurrencyVND } from '@/utils/formatters';
import { toast } from '@/stores/toastStore';
import { createCheckoutOrder } from '../services/checkoutService';
import { checkoutFormSchema, CheckoutFormData } from '../schemas/checkoutSchema';
import { VietnamAddressCascader } from '../components/VietnamAddressCascader';
import { PaymentMethodSelector } from '../components/PaymentMethodSelector';
import { VietQRModal } from '../components/VietQRModal';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    items,
    couponCode,
    couponDiscount,
    clearCart,
    setCouponCode,
    setCouponDiscount,
    note: storeNote,
  } = useCartStore();

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [isVietQRPreviewOpen, setIsVietQRPreviewOpen] = useState(false);
  const isSubmittingRef = useRef(false);

  // Prepopulate note from router state or cartStore
  const initialNote = (location.state as { note?: string } | null)?.note || storeNote || '';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      receiverName: '',
      phone: '',
      email: '',
      province: '',
      district: '',
      ward: '',
      street: '',
      paymentMethod: 'cod',
      note: initialNote,
    },
    mode: 'onTouched',
  });

  const watchedProvince = watch('province');
  const watchedDistrict = watch('district');
  const watchedWard = watch('ward');
  const watchedStreet = watch('street');
  const watchedPaymentMethod = watch('paymentMethod');

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );
  const shippingFee = calculateShippingFee(subtotal);
  const grandTotal = Math.max(0, subtotal + shippingFee - couponDiscount);

  // Empty cart protection & automatic redirect
  useEffect(() => {
    if (items.length === 0 && !isSubmittingRef.current) {
      toast.info('Giỏ hàng trống. Vui lòng chọn sản phẩm trước khi thanh toán.');
      navigate('/cart', { replace: true });
    }
  }, [items.length, navigate]);

  const onSubmit = async (values: CheckoutFormData) => {
    if (!items.length || submitting) return;
    setSubmitting(true);
    isSubmittingRef.current = true;
    setFormError('');

    try {
      const created = await createCheckoutOrder(items, values, couponCode);
      clearCart();
      setCouponCode('');
      setCouponDiscount(0);
      toast.success('Đặt hàng thành công! Đang chuyển hướng...');
      navigate(`/order-success/${created.id}`, { replace: true });
    } catch (error) {
      isSubmittingRef.current = false;
      const message =
        error instanceof Error ? error.message : 'Đặt hàng chưa thành công. Vui lòng thử lại.';
      setFormError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!items.length) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <ShoppingBag className="mx-auto h-12 w-12 text-content-muted mb-3" />
        <h1 className="text-xl font-bold text-content-main">Chưa có sản phẩm để thanh toán</h1>
        <p className="mt-1 text-xs text-content-muted">Đang chuyển bạn về giỏ hàng...</p>
        <Link
          to="/cart"
          className="mt-4 inline-flex items-center gap-1.5 rounded-theme bg-primary px-4 py-2 text-xs font-semibold text-white"
        >
          Quay lại giỏ hàng
        </Link>
      </div>
    );
  }

  const inputClass =
    'w-full rounded-theme border border-border-base bg-surface-subtle px-3 py-2 text-xs sm:text-sm text-content-main outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50 transition-all';

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 space-y-6">
      {/* 1. Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-content-muted">
        <Link to="/" className="flex items-center gap-1 hover:text-primary transition-colors">
          <Home className="h-3.5 w-3.5" />
          <span>Trang chủ</span>
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/cart" className="hover:text-primary transition-colors">
          Giỏ hàng
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-semibold text-content-main">Thanh toán</span>
      </nav>

      {/* 2. Page Title */}
      <div className="border-b border-border-base pb-3">
        <h1 className="text-2xl font-bold text-content-main flex items-center gap-2">
          <span>Thông tin đặt hàng & Thanh toán</span>
        </h1>
        <p className="text-xs text-content-muted mt-1">
          Hoàn tất các bước dưới đây để đặt hàng nhanh chóng.
        </p>
      </div>

      {formError && (
        <div
          role="alert"
          className="rounded-theme border border-status-danger/30 bg-status-danger/10 p-3.5 text-xs sm:text-sm text-status-danger font-medium"
        >
          {formError}
        </div>
      )}

      {/* 3. Main Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-3">
        {/* Left Column (2 cols): Customer info, VN Address cascader, Payment method */}
        <div className="space-y-6 rounded-theme border border-border-base bg-surface-card p-5 sm:p-6 lg:col-span-2 shadow-xs">
          {/* Section 1: Customer Contact Info */}
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-content-main border-b border-border-base pb-2">
              <Truck className="h-4 w-4 text-primary" />
              <span>1. Thông tin người nhận hàng</span>
            </h2>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-content-main">
                  Họ và tên người nhận <span className="text-status-danger">*</span>
                </label>
                <input
                  {...register('receiverName')}
                  autoComplete="name"
                  placeholder="Nguyễn Văn A"
                  className={`${inputClass} ${errors.receiverName ? 'border-status-danger' : ''}`}
                />
                {errors.receiverName && (
                  <p role="alert" className="text-[11px] text-status-danger">
                    {errors.receiverName.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-content-main">
                  Số điện thoại <span className="text-status-danger">*</span>
                </label>
                <input
                  {...register('phone')}
                  type="tel"
                  autoComplete="tel"
                  placeholder="0912345678"
                  className={`${inputClass} ${errors.phone ? 'border-status-danger' : ''}`}
                />
                {errors.phone && (
                  <p role="alert" className="text-[11px] text-status-danger">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="block text-xs font-semibold text-content-main">
                  Email (nhận hóa đơn điện tử & cập nhật đơn hàng)
                </label>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="email@example.com (không bắt buộc)"
                  className={`${inputClass} ${errors.email ? 'border-status-danger' : ''}`}
                />
                {errors.email && (
                  <p role="alert" className="text-[11px] text-status-danger">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Shipping Address Hierarchy */}
          <div className="space-y-4 pt-2">
            <h2 className="flex items-center gap-2 text-sm font-bold text-content-main border-b border-border-base pb-2">
              <span>2. Địa chỉ nhận hàng</span>
            </h2>

            {/* Cascader: Province -> District -> Ward */}
            <VietnamAddressCascader
              province={watchedProvince}
              district={watchedDistrict}
              ward={watchedWard}
              street={watchedStreet}
              errors={{
                province: errors.province?.message,
                district: errors.district?.message,
                ward: errors.ward?.message,
              }}
              onProvinceChange={(val) => {
                setValue('province', val, { shouldValidate: true });
                setValue('district', '');
                setValue('ward', '');
              }}
              onDistrictChange={(val) => {
                setValue('district', val, { shouldValidate: true });
                setValue('ward', '');
              }}
              onWardChange={(val) => {
                setValue('ward', val, { shouldValidate: true });
              }}
            />

            {/* Specific street address */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-content-main">
                Địa chỉ cụ thể: số nhà, tên đường, tòa nhà{' '}
                <span className="text-status-danger">*</span>
              </label>
              <input
                {...register('street')}
                autoComplete="street-address"
                placeholder="Ví dụ: 12 Nguyễn Huệ, Tòa nhà Vincom"
                className={`${inputClass} ${errors.street ? 'border-status-danger' : ''}`}
              />
              {errors.street && (
                <p role="alert" className="text-[11px] text-status-danger">
                  {errors.street.message}
                </p>
              )}
            </div>

            {/* Order Note */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold text-content-main">
                  Ghi chú giao hàng (tuỳ chọn)
                </label>
                <span className="text-[10px] text-content-muted">Tối đa 300 ký tự</span>
              </div>
              <textarea
                {...register('note')}
                rows={2}
                maxLength={300}
                placeholder="Lời nhắn cho shipper hoặc cửa hàng..."
                className={inputClass}
              />
              {errors.note && (
                <p role="alert" className="text-[11px] text-status-danger">
                  {errors.note.message}
                </p>
              )}
            </div>
          </div>

          {/* Section 3: Payment Method Selector */}
          <div className="pt-2">
            <PaymentMethodSelector
              value={watchedPaymentMethod}
              onChange={(method) => setValue('paymentMethod', method, { shouldValidate: true })}
              onPreviewVietQR={() => setIsVietQRPreviewOpen(true)}
              error={errors.paymentMethod?.message}
            />
          </div>
        </div>

        {/* Right Column (1 col): Order Items Review & Financial Summary */}
        <aside className="space-y-5">
          <div className="sticky top-20 rounded-theme border border-border-base bg-surface-card p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-border-base pb-3">
              <h2 className="font-bold text-sm text-content-main">
                Đơn hàng ({items.length} mặt hàng)
              </h2>
              <Link to="/cart" className="text-xs text-primary hover:underline">
                Sửa
              </Link>
            </div>

            {/* Compact items list */}
            <div className="max-h-64 space-y-3 overflow-y-auto divide-y divide-border-base/50 pr-1">
              {items.map((item) => (
                <div key={item.id} className="flex gap-2.5 pt-2.5 first:pt-0 text-xs">
                  <img
                    src={item.image || '/placeholder.png'}
                    alt={item.title}
                    className="h-12 w-10 rounded object-cover bg-surface-subtle border border-border-base/40 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 font-semibold text-content-main">{item.title}</p>
                    {item.variantName && (
                      <p className="text-[11px] text-content-muted">{item.variantName}</p>
                    )}
                    <p className="text-[11px] text-content-muted">SL: {item.quantity}</p>
                  </div>
                  <span className="font-semibold text-content-main whitespace-nowrap">
                    {formatCurrencyVND(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="space-y-2 border-t border-border-base pt-3 text-xs sm:text-sm">
              <div className="flex justify-between text-content-muted">
                <span>Tạm tính</span>
                <span className="font-semibold text-content-main">
                  {formatCurrencyVND(subtotal)}
                </span>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-status-success font-semibold">
                  <span>Voucher giảm giá ({couponCode})</span>
                  <span>-{formatCurrencyVND(couponDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between text-content-muted">
                <span>Phí vận chuyển</span>
                <span className="font-semibold text-content-main">
                  {shippingFee === 0 ? (
                    <span className="text-status-success font-semibold">Miễn phí</span>
                  ) : (
                    formatCurrencyVND(shippingFee)
                  )}
                </span>
              </div>

              {shippingFee === 0 && subtotal >= SHIPPING_CONFIG.freeShippingThreshold && (
                <div className="rounded bg-status-success/10 p-2 text-[11px] text-status-success font-medium flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>Đã áp dụng Miễn phí vận chuyển D2C</span>
                </div>
              )}

              <div className="flex justify-between border-t border-border-base pt-3 text-base font-bold text-content-main">
                <span>Tổng thanh toán</span>
                <span className="text-lg text-primary">{formatCurrencyVND(grandTotal)}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-theme bg-primary py-3.5 text-sm font-bold text-white hover:bg-primary-hover shadow-xs disabled:opacity-60 transition-colors"
            >
              {submitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  <span>Đang xử lý đơn hàng...</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Đặt hàng ({formatCurrencyVND(grandTotal)})</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-center text-[11px] text-content-muted pt-1">
              <Link
                to="/cart"
                className="inline-flex items-center gap-1 text-content-muted hover:text-primary transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>Quay lại giỏ hàng</span>
              </Link>
            </div>
          </div>
        </aside>
      </form>

      {/* VietQR Preview Modal */}
      <VietQRModal
        isOpen={isVietQRPreviewOpen}
        onClose={() => setIsVietQRPreviewOpen(false)}
        orderNumber={`ORD-${new Date().getFullYear()}-DEMO`}
        amount={grandTotal}
      />
    </div>
  );
};

export default CheckoutPage;
