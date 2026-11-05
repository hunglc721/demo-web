import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Shirt, Sparkles, Watch, Heart } from 'lucide-react';
import { productService } from '@/services/api/productService';
import { Category } from '@/types/product';

export interface CategoryShowcaseBlockProps {
  settings?: {
    title?: string;
    subtitle?: string;
    categories?: Array<{
      id: string;
      name: string;
      slug: string;
      icon?: string;
      image?: string;
      count?: number;
    }>;
  };
}

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  Shirt,
  Sparkles,
  Watch,
  Heart,
  ShoppingBag,
};

export const CategoryShowcaseBlock: React.FC<CategoryShowcaseBlockProps> = ({ settings }) => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let isMounted = true;
    productService.getCategories().then((cats) => {
      if (isMounted && cats && cats.length > 0) {
        setCategories(cats);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const title = settings?.title || 'Danh Mục Nổi Bật';
  const subtitle = settings?.subtitle || 'Khám phá các bộ sưu tập được ưa chuộng nhất của D2C Store';

  // Fallback to settings categories or seeded categories
  const displayCategories =
    categories.length > 0
      ? categories
      : (settings?.categories as Category[]) || [];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-content-main tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-content-muted mt-1">{subtitle}</p>
        </div>
        <Link
          to="/catalog"
          className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1 group flex-shrink-0"
        >
          <span>Xem tất cả danh mục</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {displayCategories.slice(0, 4).map((cat) => {
          const IconComponent = (cat.icon && iconMap[cat.icon]) || ShoppingBag;
          return (
            <Link
              key={cat.id}
              to={`/category/${cat.slug}`}
              className="group relative overflow-hidden rounded-theme bg-surface-card border border-border-base hover:border-primary hover:shadow-lg transition-all duration-300 flex flex-col"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-subtle">
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary">
                    <IconComponent className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="text-[11px] font-medium opacity-90 block">
                    {cat.productCount ?? 6} sản phẩm
                  </span>
                  <h3 className="text-base sm:text-lg font-bold group-hover:text-primary-hover transition-colors">
                    {cat.name}
                  </h3>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
export default CategoryShowcaseBlock;
