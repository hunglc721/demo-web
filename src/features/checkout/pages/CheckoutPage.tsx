import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ArrowLeft, LoaderCircle, ShieldCheck, Truck } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { PaymentMethod } from '@/types';
import { createCheckoutOrder } from '../services/checkoutService';
import { loadVietnamLocations } from '../data/vietnamLocations';
import type { VietnamDivision } from '../data/vietnamLocations';
import { formatCurrencyVND } from '@/utils/formatters';
import { toast } from '@/stores/toastStore';

const SHIPPING_FEE = 30000;
const FREE_SHIPPING_THRESHOLD = 299000;

const schema = z.object({
  receiverName: z.string().trim().min(2, 'Nhập tên người nhận.'),
  phone: z.string().trim().regex(/^(\+?84|0)[0-9]{9,10}$/, 'Số điện thoại chưa đúng.'),
  email: z.string().trim().email('Email chưa đúng.').or(z.literal('')),
  street: z.string().trim().min(5, 'Nhập số nhà và tên đường.'),
  province: z.string().min(1, 'Chọn tỉnh/thành.'),
  ward: z.string().min(1, 'Chọn phường/xã.'),
  paymentMethod: z.enum(['cod', 'vietqr']),
  note: z.string().max(300, 'Ghi chú tối đa 300 ký tự.'),
});
type CheckoutForm = z.infer<typeof schema>;

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, couponCode, couponDiscount, clearCart, setCouponCode, setCouponDiscount } = useCartStore();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [provinces, setProvinces] = useState<VietnamDivision[]>([]);
  const [allWards, setAllWards] = useState<VietnamDivision[]>([]);
  const [locationError, setLocationError] = useState('');
  const cartNote = (location.state as { note?: string } | null)?.note || '';
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CheckoutForm>({
    resolver: zodResolver(schema),
    defaultValues: { receiverName: '', phone: '', email: '', street: '', province: '', ward: '', paymentMethod: 'cod', note: cartNote },
  });
  const province = watch('province');
  const wards = useMemo(() => allWards.filter(ward => ward.parent?.name.local === province), [allWards, province]);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

  React.useEffect(() => {
    loadVietnamLocations().then(data => {
      setProvinces(data.provinces);
      setAllWards(data.wards);
    }).catch(() => setLocationError('Không tải được danh mục tỉnh/thành và xã/phường. Hãy tải lại trang.'));
  }, []);

  const submit = async (values: CheckoutForm) => {
    if (!items.length || submitting) return;
    setSubmitting(true);
    setFormError('');
    try {
      const created = await createCheckoutOrder(items, { ...values, paymentMethod: values.paymentMethod as PaymentMethod }, couponCode);
      clearCart();
      setCouponCode('');
      setCouponDiscount(0);
      navigate(`/order-success/${created.id}`, { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Đặt hàng chưa thành công. Thử lại nhé.';
      setFormError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!items.length) return <div className="mx-auto max-w-xl px-4 py-16 text-center"><h1 className="text-xl font-bold">Chưa có sản phẩm để thanh toán</h1><Link to="/catalog" className="mt-4 inline-block text-primary">Quay lại mua sắm</Link></div>;

  return <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
    <div className="text-center"><h1 className="text-2xl font-bold text-content-main">Thanh toán đơn hàng</h1><p className="mt-2 text-sm text-content-muted">Điền thông tin nhận hàng và chọn phương thức thanh toán.</p></div>
    {formError && <p role="alert" className="rounded border border-status-danger/30 bg-status-danger/10 p-3 text-sm text-status-danger">{formError}</p>}
    <form onSubmit={handleSubmit(submit)} className="grid gap-6 lg:grid-cols-3">
      <section className="space-y-6 rounded-theme border border-border-base bg-surface-card p-6 lg:col-span-2">
        <div className="space-y-4"><h2 className="flex items-center gap-2 font-bold"><Truck className="h-4 w-4 text-primary" /> Thông tin nhận hàng</h2><div className="grid gap-3 sm:grid-cols-2">
          <Field label="Họ và tên" error={errors.receiverName?.message}><input {...register('receiverName')} autoComplete="name" placeholder="Nguyễn Văn A" className={inputClass} /></Field>
          <Field label="Số điện thoại" error={errors.phone?.message}><input {...register('phone')} autoComplete="tel" placeholder="09xxxxxxxx" className={inputClass} /></Field>
          <Field label="Email (không bắt buộc)" error={errors.email?.message}><input {...register('email')} autoComplete="email" placeholder="ban@email.com" className={inputClass} /></Field>
          <Field label="Tỉnh / Thành phố" error={errors.province?.message}><select {...register('province', { onChange: () => setValue('ward', '') })} disabled={!provinces.length} className={inputClass}><option value="">Chọn tỉnh/thành</option>{provinces.map(region => <option key={region.id} value={region.name.local}>{region.name.local}</option>)}</select></Field>
          <Field label="Xã / Phường" error={errors.ward?.message}><select {...register('ward')} disabled={!province || !wards.length} className={inputClass}><option value="">Chọn xã/phường</option>{wards.map(ward => <option key={ward.id} value={ward.name.local}>{ward.name.local}</option>)}</select></Field>
          {locationError && <p role="alert" className="text-xs text-status-danger sm:col-span-2">{locationError}</p>}
          <Field label="Số nhà, tên đường" error={errors.street?.message} className="sm:col-span-2"><input {...register('street')} autoComplete="street-address" placeholder="Số nhà, tên đường" className={inputClass} /></Field>
          <Field label="Ghi chú" error={errors.note?.message} className="sm:col-span-2"><textarea {...register('note')} rows={2} placeholder="Lời nhắn cho cửa hàng" className={inputClass} /></Field>
        </div></div>
        <div className="space-y-3 border-t border-border-base pt-5"><h2 className="flex items-center gap-2 font-bold"><ShieldCheck className="h-4 w-4 text-primary" /> Phương thức thanh toán</h2><label className="flex cursor-pointer items-center gap-3 rounded border border-border-base p-3 text-sm"><input type="radio" value="cod" {...register('paymentMethod')} /> Thanh toán khi nhận hàng (COD)</label><label className="flex cursor-pointer items-center gap-3 rounded border border-border-base p-3 text-sm"><input type="radio" value="vietqr" {...register('paymentMethod')} /> Chuyển khoản VietQR (mã demo)</label></div>
      </section>
      <aside className="h-fit space-y-4 rounded-theme border border-border-base bg-surface-card p-5"><h2 className="font-bold">Đơn hàng ({items.length})</h2><div className="max-h-64 space-y-3 overflow-auto">{items.map(item => <div key={item.id} className="flex justify-between gap-3 text-sm"><span className="text-content-muted">{item.title}{item.variantName && ` · ${item.variantName}`} × {item.quantity}</span><span className="whitespace-nowrap font-medium">{formatCurrencyVND(item.price * item.quantity)}</span></div>)}</div><div className="space-y-2 border-t border-border-base pt-3 text-sm"><div className="flex justify-between"><span>Tạm tính</span><span>{formatCurrencyVND(subtotal)}</span></div><div className="flex justify-between"><span>Vận chuyển</span><span>{shippingFee ? formatCurrencyVND(shippingFee) : 'Miễn phí'}</span></div>{couponCode && couponDiscount > 0 && <div className="flex justify-between text-status-success"><span>Giảm giá ({couponCode})</span><span>-{formatCurrencyVND(couponDiscount)}</span></div>}<div className="flex justify-between border-t border-border-base pt-3 text-base font-bold"><span>Tổng cộng</span><span>{formatCurrencyVND(Math.max(0, subtotal + shippingFee - couponDiscount))}</span></div></div><button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-theme bg-primary px-4 py-3 font-bold text-white disabled:opacity-60">{submitting ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Đang tạo đơn...</> : 'Đặt hàng'}</button><Link to="/cart" className="flex items-center justify-center gap-1 text-xs text-content-muted"><ArrowLeft className="h-3 w-3" /> Quay lại giỏ hàng</Link></aside>
    </form>
  </div>;
};

const inputClass = 'w-full rounded border border-border-base bg-surface-subtle px-3 py-2 text-sm text-content-main outline-none focus:border-primary disabled:opacity-50';
const Field: React.FC<{ label: string; error?: string; className?: string; children: React.ReactNode }> = ({ label, error, className = '', children }) => <label className={`block space-y-1.5 text-xs font-medium text-content-main ${className}`}><span>{label}</span>{children}{error && <span className="block text-status-danger">{error}</span>}</label>;
export default CheckoutPage;
