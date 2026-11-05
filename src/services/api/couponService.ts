/**
 * Coupon & Promotion Domain Service Implementation
 */

import {
  ICouponService,
  CouponQueryParams,
  CreateCouponDTO,
  UpdateCouponDTO,
} from '../contracts/ICouponService';
import { Coupon, CouponValidationResult, PaginatedResponse } from '@/types';
import { LocalStorageRepository } from '../mock/LocalStorageRepository';
import { STORAGE_KEYS } from '../storage/storageKeys';
import { seedCoupons, calculateCouponDiscount } from '../seed/couponsSeed';

export class CouponService implements ICouponService {
  private couponRepo: LocalStorageRepository<Coupon>;

  constructor() {
    this.couponRepo = new LocalStorageRepository<Coupon>(
      STORAGE_KEYS.COUPONS,
      seedCoupons
    );
  }

  public getRepository(): LocalStorageRepository<Coupon> {
    return this.couponRepo;
  }

  public async getCoupons(params?: CouponQueryParams): Promise<PaginatedResponse<Coupon>> {
    return this.couponRepo.getAll(params as any);
  }

  public async getCouponByCode(code: string): Promise<Coupon | null> {
    const coupons = await this.couponRepo.findMany();
    const cleanCode = code.trim().toUpperCase();
    const found = coupons.find((c) => c.code.toUpperCase() === cleanCode);
    return found ? { ...found } : null;
  }

  public async validateCoupon(
    code: string,
    subtotal: number,
    shippingFee = 30000
  ): Promise<CouponValidationResult> {
    const coupon = await this.getCouponByCode(code);
    if (!coupon) {
      return {
        isValid: false,
        discountAmount: 0,
        message: `Mã giảm giá "${code.toUpperCase()}" không tồn tại hoặc đã bị xóa.`,
      };
    }

    return calculateCouponDiscount(coupon, subtotal, shippingFee);
  }

  public async applyCoupon(
    code: string,
    subtotal: number,
    shippingFee = 30000
  ): Promise<CouponValidationResult> {
    const validation = await this.validateCoupon(code, subtotal, shippingFee);
    if (validation.isValid && validation.coupon) {
      // Increment used count
      await this.couponRepo.update(validation.coupon.id, {
        usedCount: (validation.coupon.usedCount || 0) + 1,
      });
    }
    return validation;
  }

  public async createCoupon(data: CreateCouponDTO): Promise<Coupon> {
    const code = data.code.trim().toUpperCase();
    return this.couponRepo.create({
      ...data,
      code,
      usedCount: 0,
      isActive: data.isActive !== undefined ? data.isActive : true,
    } as any);
  }

  public async updateCoupon(id: string, data: UpdateCouponDTO): Promise<Coupon> {
    const updateData = { ...data };
    if (updateData.code) {
      updateData.code = updateData.code.trim().toUpperCase();
    }
    return this.couponRepo.update(id, updateData as any);
  }

  public async deleteCoupon(id: string): Promise<boolean> {
    return this.couponRepo.delete(id);
  }
}

export const couponService = new CouponService();
