/**
 * Product & Catalog Domain Service Implementation
 */

import {
  IProductService,
  ProductQueryParams,
  CreateProductDTO,
  UpdateProductDTO,
} from '../contracts/IProductService';
import { Product, Category, PaginatedResponse } from '@/types';
import { LocalStorageRepository } from '../mock/LocalStorageRepository';
import { STORAGE_KEYS } from '../storage/storageKeys';
import { seedProducts } from '../seed/productsSeed';
import { seedCategories } from '../seed/categoriesSeed';

export class ProductService implements IProductService {
  private productRepo: LocalStorageRepository<Product>;
  private categoryRepo: LocalStorageRepository<Category>;

  constructor() {
    this.productRepo = new LocalStorageRepository<Product>(
      STORAGE_KEYS.PRODUCTS,
      seedProducts
    );
    this.categoryRepo = new LocalStorageRepository<Category>(
      STORAGE_KEYS.CATEGORIES,
      seedCategories
    );
  }

  public getRepository(): LocalStorageRepository<Product> {
    return this.productRepo;
  }

  public async getProducts(params?: ProductQueryParams): Promise<PaginatedResponse<Product>> {
    return this.productRepo.getAll(params as any);
  }

  public async getProductById(id: string): Promise<Product | null> {
    return this.productRepo.getById(id);
  }

  public async getProductBySlug(slug: string): Promise<Product | null> {
    const products = await this.productRepo.findMany();
    const found = products.find((p) => p.slug === slug);
    return found ? { ...found } : null;
  }

  public async createProduct(data: CreateProductDTO): Promise<Product> {
    const slug =
      data.slug ||
      data.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return this.productRepo.create({
      ...data,
      slug,
      stock: data.stock ?? 0,
      lowStockThreshold: data.lowStockThreshold ?? 5,
      images: data.images ?? [],
      tags: data.tags ?? [],
      status: data.status ?? 'active',
      options: data.options ?? [],
      variants: data.variants ?? [],
      rating: data.rating ?? 5.0,
      reviewCount: data.reviewCount ?? 0,
      salesCount: data.salesCount ?? 0,
    } as any);
  }

  public async updateProduct(id: string, data: UpdateProductDTO): Promise<Product> {
    return this.productRepo.update(id, data as any);
  }

  public async deleteProduct(id: string): Promise<boolean> {
    return this.productRepo.delete(id);
  }

  public async getCategories(): Promise<Category[]> {
    return this.categoryRepo.findMany();
  }

  public async getFeaturedProducts(limit = 8): Promise<Product[]> {
    const products = await this.productRepo.findMany();
    return products.filter((p) => p.isFeatured || p.tags.includes('featured')).slice(0, limit);
  }

  public async getFlashSaleProducts(): Promise<Product[]> {
    const products = await this.productRepo.findMany();
    return products.filter((p) => p.isFlashSale);
  }

  public async getLowStockProducts(threshold = 5): Promise<Product[]> {
    const products = await this.productRepo.findMany();
    return products.filter((p) => p.stock <= (p.lowStockThreshold || threshold));
  }
}

export const productService = new ProductService();
