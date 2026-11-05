/**
 * Coupon Domain Models
 */

export type CouponDiscountType = 'percentage' | 'fixed' | 'free_shipping';

export interface Coupon {
  id: string; // e.g. "cpn_chaoban"
  code: string; // e.g. "CHAOBAN"
  title: string;
  description: string;
  discountType: CouponDiscountType;
  discountValue: number; // % (1-100) or amount in VND
  minOrderValue: number; // in VND
  maxDiscount?: number; // max cap for percentage discounts
  usageLimit: number;
  usedCount: number;
  perCustomerLimit: number;
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  isActive: boolean;
  applicableCategories?: string[];
}

export interface CouponValidationResult {
  isValid: boolean;
  discountAmount: number;
  message: string;
  coupon?: Coupon;
}
