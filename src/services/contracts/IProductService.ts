import { Product, Category, PaginatedResponse, BaseFilter } from '@/types';

export interface ProductQueryParams extends BaseFilter<Product> {
  category?: string | string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  tags?: string[];
  isFeatured?: boolean;
  isFlashSale?: boolean;
}

export type CreateProductDTO = Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<Product, 'id'>>;
export type UpdateProductDTO = Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>;

export interface IProductService {
  getProducts(params?: ProductQueryParams): Promise<PaginatedResponse<Product>>;
  getProductById(id: string): Promise<Product | null>;
  getProductBySlug(slug: string): Promise<Product | null>;
  createProduct(data: CreateProductDTO): Promise<Product>;
  updateProduct(id: string, data: UpdateProductDTO): Promise<Product>;
  deleteProduct(id: string): Promise<boolean>;
  getCategories(): Promise<Category[]>;
  getFeaturedProducts(limit?: number): Promise<Product[]>;
  getFlashSaleProducts(): Promise<Product[]>;
  getLowStockProducts(threshold?: number): Promise<Product[]>;
}
