/**
 * Product Review Domain Service
 */

import { ProductReview } from '@/types/review';
import { LocalStorageRepository } from '../mock/LocalStorageRepository';
import { STORAGE_KEYS } from '../storage/storageKeys';
import { seedReviews } from '../seed/reviewsSeed';
import { productService } from './productService';

export interface RatingSummary {
  average: number;
  count: number;
  breakdown: Record<number, number>; // star (1..5) -> count
}

export class ReviewService {
  private repo: LocalStorageRepository<ProductReview>;

  constructor() {
    this.repo = new LocalStorageRepository<ProductReview>(
      STORAGE_KEYS.REVIEWS,
      seedReviews
    );
  }

  public getRepository(): LocalStorageRepository<ProductReview> {
    return this.repo;
  }

  public async getReviewsByProductId(productId: string): Promise<ProductReview[]> {
    const all = await this.repo.findMany();
    return all
      .filter((r) => r.productId === productId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async getRatingSummary(productId: string): Promise<RatingSummary> {
    const reviews = await this.getReviewsByProductId(productId);
    const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    if (reviews.length === 0) {
      return { average: 5.0, count: 0, breakdown };
    }

    let totalScore = 0;
    for (const r of reviews) {
      const star = Math.min(Math.max(1, Math.round(r.rating)), 5);
      breakdown[star] = (breakdown[star] || 0) + 1;
      totalScore += r.rating;
    }

    const average = parseFloat((totalScore / reviews.length).toFixed(1));
    return {
      average,
      count: reviews.length,
      breakdown,
    };
  }

  public async addReview(
    data: Omit<ProductReview, 'id' | 'createdAt'>
  ): Promise<ProductReview> {
    const created = await this.repo.create({
      ...data,
      likes: data.likes ?? 0,
      verifiedPurchase: data.verifiedPurchase ?? true,
    } as any);

    // Sync rating & reviewCount back to product
    try {
      const summary = await this.getRatingSummary(created.productId);
      await productService.updateProduct(created.productId, {
        rating: summary.average,
        reviewCount: summary.count,
      } as any);
    } catch {
      // Non-blocking if product update fails
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('d2c:reviews-updated', { detail: { productId: created.productId, review: created } })
      );
    }

    return created;
  }
}

export const reviewService = new ReviewService();
