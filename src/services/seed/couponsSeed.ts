import { Coupon, CouponValidationResult } from '@/types/coupon';

export const seedCoupons: Coupon[] = [
  {
    id: 'cpn_chaoban',
    code: 'CHAOBAN',
    title: 'Chào Bạn Mới - Giảm 10%',
    description: 'Giảm ngay 10% tối đa 50.000₫ cho đơn hàng từ 200.000₫',
    discountType: 'percentage',
    discountValue: 10,
    minOrderValue: 200000,
    maxDiscount: 50000,
    usageLimit: 1000,
    usedCount: 142,
    perCustomerLimit: 1,
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
    isActive: true,
  },
  {
    id: 'cpn_freeship',
    code: 'FREESHIP',
    title: 'Miễn Phí Vận Chuyển',
    description: 'Hỗ trợ tối đa 30.000₫ phí giao hàng cho đơn từ 200.000₫',
    discountType: 'free_shipping',
    discountValue: 30000,
    minOrderValue: 200000,
    usageLimit: 2000,
    usedCount: 486,
    perCustomerLimit: 3,
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
    isActive: true,
  },
  {
    id: 'cpn_sale50k',
    code: 'SALE50K',
    title: 'Giảm Trực Tiếp 50.000₫',
    description: 'Giảm ngay 50.000₫ tiền mặt cho đơn hàng giá trị từ 300.000₫',
    discountType: 'fixed',
    discountValue: 50000,
    minOrderValue: 300000,
    usageLimit: 500,
    usedCount: 88,
    perCustomerLimit: 1,
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
    isActive: true,
  },
  {
    id: 'cpn_vip15',
    code: 'VIP15',
    title: 'Tri Ân Khách Hàng Thân Thiết VIP',
    description: 'Giảm 15% tối đa 150.000₫ cho đơn hàng từ 500.000₫',
    discountType: 'percentage',
    discountValue: 15,
    minOrderValue: 500000,
    maxDiscount: 150000,
    usageLimit: 300,
    usedCount: 75,
    perCustomerLimit: 2,
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
    isActive: true,
  },
  {
    id: 'cpn_d2c15off',
    code: 'D2C15OFF',
    title: 'Ưu Đãi Đặc Biệt D2C',
    description: 'Giảm 15% tối đa 50.000₫ cho đơn từ 200.000₫ (Hiển thị mẫu tại trang Marketing)',
    discountType: 'percentage',
    discountValue: 15,
    minOrderValue: 200000,
    maxDiscount: 50000,
    usageLimit: 1000,
    usedCount: 312,
    perCustomerLimit: 1,
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
    isActive: true,
  },
  {
    id: 'cpn_expired',
    code: 'EXPIRED10',
    title: 'Mã Hết Hạn Thử Nghiệm',
    description: 'Mã thử nghiệm đã hết hạn sử dụng để test thông báo lỗi',
    discountType: 'percentage',
    discountValue: 10,
    minOrderValue: 50000,
    usageLimit: 100,
    usedCount: 40,
    perCustomerLimit: 1,
    startDate: '2025-01-01T00:00:00Z',
    endDate: '2025-12-31T23:59:59Z', // Hết hạn
    isActive: true,
  },
  {
    id: 'cpn_soldout',
    code: 'SOLDOUT',
    title: 'Mã Hết Lượt Thử Nghiệm',
    description: 'Mã thử nghiệm đã đạt giới hạn lượt sử dụng',
    discountType: 'fixed',
    discountValue: 100000,
    minOrderValue: 100000,
    usageLimit: 50,
    usedCount: 50, // Hết lượt
    perCustomerLimit: 1,
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
    isActive: true,
  },
];

/**
 * Validates a coupon and calculates the exact discount amount according to business rules.
 */
export function calculateCouponDiscount(
  coupon: Coupon,
  subtotal: number,
  shippingFee: number = 30000
): CouponValidationResult {
  const now = new Date();
  const start = new Date(coupon.startDate);
  const end = new Date(coupon.endDate);

  if (!coupon.isActive) {
    return { isValid: false, discountAmount: 0, message: 'Mã giảm giá hiện đang bị vô hiệu hóa.' };
  }
  if (now < start || now > end) {
    return { isValid: false, discountAmount: 0, message: 'Mã giảm giá đã hết hạn hoặc chưa đến đợt áp dụng.' };
  }
  if (coupon.usedCount >= coupon.usageLimit) {
    return { isValid: false, discountAmount: 0, message: 'Mã giảm giá đã hết lượt sử dụng.' };
  }
  if (subtotal < coupon.minOrderValue) {
    return {
      isValid: false,
      discountAmount: 0,
      message: `Đơn hàng tối thiểu phải từ ${coupon.minOrderValue.toLocaleString('vi-VN')}₫ để dùng mã này.`,
    };
  }

  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = Math.round((subtotal * coupon.discountValue) / 100);
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else if (coupon.discountType === 'fixed') {
    discount = Math.min(coupon.discountValue, subtotal);
  } else if (coupon.discountType === 'free_shipping') {
    discount = Math.min(coupon.discountValue, shippingFee);
  }

  return {
    isValid: true,
    discountAmount: discount,
    message: `Áp dụng thành công! Bạn được giảm ${discount.toLocaleString('vi-VN')}₫.`,
    coupon,
  };
}
