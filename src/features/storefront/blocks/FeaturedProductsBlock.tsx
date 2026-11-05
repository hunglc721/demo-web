import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { productService } from '@/services/api/productService';
import { Product } from '@/types/product';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/ProductCardSkeleton';
import { cn } from '@/utils/cn';

export interface TabConfig {
  id: string;
  title: string;
}

export interface FeaturedProductsBlockProps {
  settings?: {
    title?: string;
    subtitle?: string;
    tabs?: TabConfig[];
    limit?: number;
  };
}

export const FeaturedProductsBlock: React.FC<FeaturedProductsBlockProps> = ({ settings }) => {
  const tabs: TabConfig[] = settings?.tabs || [
    { id: 'all', title: 'Tất cả' },
    { id: 'best-seller', title: 'Bán chạy nhất' },
    { id: 'new', title: 'Hàng mới về' },
    { id: 'sale', title: 'Đang giảm giá' },
  ];

  const [activeTab, setActiveTab] = useState<string>(tabs[0]?.id || 'all');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const limit = settings?.limit || 8;

  const loadProducts = useCallback(async (tabId: string) => {
    try {
      setLoading(true);
      // Query 24 items to have full candidate pool
      const res = await productService.getProducts({ pageSize: 50 });
      let filtered = res.items;

      if (tabId === 'best-seller') {
        filtered = filtered.filter(
          (p) => p.tags.includes('best-seller') || p.tags.includes('hot') || (p.salesCount || 0) > 20
        );
      } else if (tabId === 'new') {
        filtered = filtered.filter(
          (p) => p.tags.includes('new') || p.tags.includes('moi')
        );
      } else if (tabId === 'sale') {
        filtered = filtered.filter(
          (p) =>
            (p.compareAtPrice && p.compareAtPrice > p.price) ||
            (p.originalPrice && p.originalPrice > p.price) ||
            p.tags.includes('sale') ||
            p.isFlashSale
        );
      }

      // If specific filter resulted in too few items, fall back to top items
      if (filtered.length === 0 && tabId !== 'all') {
        filtered = res.items;
      }

      setProducts(filtered.slice(0, limit));
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    loadProducts(activeTab);

    const handleProductsUpdated = () => {
      loadProducts(activeTab);
    };

    window.addEventListener('d2c:products-updated', handleProductsUpdated);
    window.addEventListener('storage', handleProductsUpdated);
    return () => {
      window.removeEventListener('d2c:products-updated', handleProductsUpdated);
      window.removeEventListener('storage', handleProductsUpdated);
    };
  }, [activeTab, loadProducts]);

  const title = settings?.title || 'Sản Phẩm Đang Được Yêu Thích';
  const subtitle = settings?.subtitle || 'Top sản phẩm được mua nhiều nhất tuần này';

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border-base pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Bộ Sưu Tập Tuyển Chọn</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-content-main tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-content-muted mt-1">{subtitle}</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200',
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface-subtle text-content-muted hover:text-content-main hover:bg-surface-card border border-border-base'
                )}
              >
                {tab.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: limit }).map((_, idx) => (
            <ProductCardSkeleton key={idx} />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center text-sm text-content-muted bg-surface-card rounded-theme border border-border-base">
          Không có sản phẩm nào trong mục này.
        </div>
      )}

      {/* Bottom CTA */}
      <div className="text-center pt-4">
        <Link
          to="/catalog"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-theme bg-surface-card border border-border-base hover:border-primary text-content-main hover:text-primary font-semibold text-sm transition-all shadow-sm group"
        >
          <span>Khám phá toàn bộ {products.length}+ sản phẩm D2C</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </section>
  );
};
export default FeaturedProductsBlock;
