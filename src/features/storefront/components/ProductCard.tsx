import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingBag, Eye, Flame } from 'lucide-react';
import { Product } from '@/types/product';
import { formatCurrencyVND } from '@/utils/formatters';
import { useCartStore } from '@/stores/cartStore';
import { toast } from '@/stores/toastStore';
import { cn } from '@/utils/cn';

export interface ProductCardProps {
  product: Product;
  showStockProgress?: boolean;
  flashSaleSold?: number;
  flashSaleTotal?: number;
  onAddToCart?: (product: Product) => void;
  className?: string;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80';

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  showStockProgress = false,
  flashSaleSold,
  flashSaleTotal,
  onAddToCart,
  className = '',
}) => {
  const [imgSrc, setImgSrc] = useState<string>(product.images?.[0] || FALLBACK_IMAGE);
  const { addItem, openCart } = useCartStore();

  const originalPrice = product.compareAtPrice ?? product.originalPrice;
  const hasDiscount = originalPrice && originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - product.price) / originalPrice) * 100)
    : 0;

  const isOutOfStock = product.stock <= 0;
  const isLowStock = !isOutOfStock && product.stock <= (product.lowStockThreshold || 5);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) return;

    if (onAddToCart) {
      onAddToCart(product);
      return;
    }

    const firstVariant = product.variants?.find((variant) => variant.stock > 0);
    addItem({
      productId: product.id,
      variantId: firstVariant?.id,
      title: product.name,
      variantName: firstVariant?.title,
      price: firstVariant?.price ?? product.price,
      originalPrice: firstVariant?.compareAtPrice ?? firstVariant?.originalPrice ?? originalPrice,
      quantity: 1,
      image: firstVariant?.image || product.images?.[0] || FALLBACK_IMAGE,
      sku: firstVariant?.sku ?? product.sku,
      stock: firstVariant?.stock ?? product.stock,
    });

    toast.success(`Đã thêm "${product.name}" vào giỏ hàng`);
    openCart();
  };

  // Sold calculation for flash sale progress
  const sold = flashSaleSold ?? Math.min(product.salesCount || 12, 100);
  const total = flashSaleTotal ?? Math.max(sold + product.stock, 20);
  const progressPercent = Math.min(Math.round((sold / total) * 100), 100);

  return (
    <div
      data-testid={`product-card-${product.id}`}
      className={cn(
        'group relative flex flex-col rounded-theme bg-surface-card border border-border-base overflow-hidden hover:shadow-lg hover:border-primary/50 transition-all duration-300',
        className
      )}
    >
      {/* 1. Image Container */}
      <Link
        to={`/product/${product.slug}`}
        className="relative block aspect-[4/5] overflow-hidden bg-surface-subtle"
      >
        <img
          src={imgSrc}
          alt={product.name}
          onError={() => setImgSrc(FALLBACK_IMAGE)}
          loading="lazy"
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
        />

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {hasDiscount && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-status-danger text-white shadow-sm">
              -{discountPercent}%
            </span>
          )}
          {product.tags?.includes('hot') && (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-sm">
              <Flame className="w-3 h-3" /> HOT
            </span>
          )}
          {product.tags?.includes('new') && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white shadow-sm">
              MỚI
            </span>
          )}
        </div>

        {/* Stock Status Badge Overlay */}
        <div className="absolute top-2.5 right-2.5 z-10">
          {isOutOfStock ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900/90 text-white backdrop-blur-sm">
              Hết hàng
            </span>
          ) : isLowStock ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/95 text-white animate-pulse shadow-sm">
              Chỉ còn {product.stock}
            </span>
          ) : null}
        </div>

        {/* Hover Quick Actions Bar */}
        <div className="absolute inset-x-2 bottom-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:flex items-center justify-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-theme bg-surface-card/90 backdrop-blur-md border border-border-base text-content-main text-xs font-semibold shadow-md hover:text-primary">
            <Eye className="w-3.5 h-3.5" /> Xem chi tiết
          </span>
        </div>
      </Link>

      {/* 2. Product Details */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between gap-3">
        <div className="space-y-1.5">
          {/* Category & Rating */}
          <div className="flex items-center justify-between text-xs">
            <Link
              to={`/catalog?category=${product.categoryId}`}
              className="text-content-muted font-medium hover:text-primary hover:underline truncate max-w-[65%]"
            >
              {product.categoryName || 'Sản phẩm D2C'}
            </Link>
            <div className="flex items-center gap-1 text-amber-500 font-semibold text-[11px]">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>{product.rating ? product.rating.toFixed(1) : '5.0'}</span>
              <span className="text-content-muted text-[10px]">
                ({product.reviewCount || 0})
              </span>
            </div>
          </div>

          {/* Product Title */}
          <h3 className="font-semibold text-sm text-content-main line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            <Link to={`/product/${product.slug}`}>{product.name}</Link>
          </h3>
        </div>

        {/* Flash Sale Stock Progress (if enabled) */}
        {showStockProgress && (
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-[11px] text-content-muted">
              <span className="flex items-center gap-1 text-rose-500 font-semibold">
                <Flame className="w-3 h-3 fill-rose-500" /> Đã bán {sold}
              </span>
              <span>Còn {product.stock}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-surface-subtle overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Pricing & Add to Cart */}
        <div className="pt-2 border-t border-border-base/60 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-bold text-primary leading-tight">
              {formatCurrencyVND(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-content-muted line-through">
                {formatCurrencyVND(originalPrice!)}
              </span>
            )}
          </div>

          <button
            onClick={handleQuickAdd}
            disabled={isOutOfStock}
            title={isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ hàng'}
            aria-label={isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
            className={cn(
              'p-2.5 rounded-theme transition-all duration-200 flex items-center justify-center flex-shrink-0',
              isOutOfStock
                ? 'bg-surface-subtle text-content-muted cursor-not-allowed border border-border-base'
                : 'bg-primary text-white hover:bg-primary-hover shadow-sm hover:shadow active:scale-95'
            )}
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
export default ProductCard;
