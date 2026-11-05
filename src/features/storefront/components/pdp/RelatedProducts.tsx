import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { productService } from '@/services/api/productService';
import { Product } from '@/types/product';
import { ProductCard } from '../ProductCard';
import { ProductCardSkeleton } from '../ProductCardSkeleton';

export interface RelatedProductsProps {
  currentProductId: string;
  categoryId: string;
}

export const RelatedProducts: React.FC<RelatedProductsProps> = ({
  currentProductId,
  categoryId,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchRelated = async () => {
      try {
        setLoading(true);
        const res = await productService.getProducts({ pageSize: 50 });
        let matched = res.items.filter(
          (p) => p.id !== currentProductId && p.categoryId === categoryId
        );

        // If not enough in category, supplement with other popular products
        if (matched.length < 4) {
          const others = res.items.filter(
            (p) => p.id !== currentProductId && p.categoryId !== categoryId
          );
          matched = [...matched, ...others];
        }

        if (isMounted) {
          setProducts(matched.slice(0, 4));
        }
      } catch {
        if (isMounted) setProducts([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRelated();
    return () => {
      isMounted = false;
    };
  }, [currentProductId, categoryId]);

  if (!loading && products.length === 0) return null;

  return (
    <section className="space-y-6 pt-6 border-t border-border-base">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-xl sm:text-2xl font-bold text-content-main tracking-tight">
            Sản Phẩm Cùng Bộ Sưu Tập
          </h2>
        </div>
        <Link
          to={`/catalog?category=${categoryId}`}
          className="text-xs sm:text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1 group"
        >
          <span>Xem thêm trong danh mục</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 4 }).map((_, idx) => (
            <ProductCardSkeleton key={idx} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {products.map((p) => (
            <div
              key={p.id}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
export default RelatedProducts;
