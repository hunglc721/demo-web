import { Coupon, CouponValidationResult, PaginatedResponse, BaseFilter } from '@/types';

export interface CouponQueryParams extends BaseFilter<Coupon> {
  isActive?: boolean;
}

export type CreateCouponDTO = Omit<Coupon, 'id'> & Partial<Pick<Coupon, 'id'>>;
export type UpdateCouponDTO = Partial<Omit<Coupon, 'id'>>;

export interface ICouponService {
  getCoupons(params?: CouponQueryParams): Promise<PaginatedResponse<Coupon>>;
  getCouponByCode(code: string): Promise<Coupon | null>;
  validateCoupon(code: string, subtotal: number, shippingFee?: number): Promise<CouponValidationResult>;
  applyCoupon(code: string, subtotal: number, shippingFee?: number): Promise<CouponValidationResult>;
  createCoupon(data: CreateCouponDTO): Promise<Coupon>;
  updateCoupon(id: string, data: UpdateCouponDTO): Promise<Coupon>;
  deleteCoupon(id: string): Promise<boolean>;
}
