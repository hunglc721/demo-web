/**
 * Product & Category Domain Models
 */

export type ProductStatus = 'active' | 'draft' | 'archived';
export type ProductTag = 'hot' | 'new' | 'sale' | 'best-seller' | 'featured' | (string & {});

export interface ProductOption {
  name: string; // e.g. "Màu sắc", "Kích cỡ"
  values: string[]; // e.g. ["Đen", "Trắng", "Xanh Navy"]
}

export interface ProductVariant {
  id: string; // e.g. "var_prod_01_blk_s"
  sku: string; // e.g. "POLO-01-BLK-S"
  title?: string; // e.g. "Đen / S"
  price: number;
  originalPrice?: number;
  compareAtPrice?: number;
  stock: number;
  options: Record<string, string>; // e.g. { "Màu sắc": "Đen", "Kích cỡ": "S" }
  image?: string;
}

export interface Product {
  id: string; // e.g. "prod_01"
  name: string;
  slug: string;
  sku: string;
  shortDescription?: string;
  description: string;
  categoryId: string;
  categoryName?: string;
  price: number;
  originalPrice?: number;
  compareAtPrice?: number;
  stock: number;
  lowStockThreshold?: number; // default 5
  images: string[];
  tags: (ProductTag | string)[];
  status: ProductStatus;
  options: ProductOption[];
  variants: ProductVariant[];
  rating?: number; // e.g. 4.9
  reviewCount?: number; // e.g. 142
  salesCount?: number; // e.g. 850
  isFeatured?: boolean;
  isFlashSale?: boolean;
  flashSalePrice?: number;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface Category {
  id: string; // e.g. "thoi-trang-nam"
  name: string;
  slug: string;
  description: string;
  icon: string; // Lucide icon name, e.g. "Shirt", "Sparkles", "Watch"
  image: string;
  productCount: number;
  order: number;
}
