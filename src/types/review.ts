/**
 * Product Review Domain Model
 */

export interface ProductReview {
  id: string;
  productId: string;
  userName: string;
  userAvatar?: string;
  rating: number; // 1 to 5
  title?: string;
  content: string;
  verifiedPurchase: boolean;
  createdAt: string; // ISO 8601
  likes?: number;
  fitFeedback?: string; // 'Chật' | 'Vừa vặn đúng size' | 'Rộng'
}
