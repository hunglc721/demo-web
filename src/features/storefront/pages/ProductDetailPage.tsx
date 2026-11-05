import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Home,
  ChevronRight,
  Star,
  ShoppingBag,
  Zap,
  Truck,
  ShieldCheck,
  RefreshCw,
  Flame,
  PackageX,
  Share2,
  Heart,
} from 'lucide-react';
import { productService } from '@/services/api/productService';
import { Product, ProductVariant } from '@/types/product';
import { formatCurrencyVND } from '@/utils/formatters';
import { useCartStore } from '@/stores/cartStore';
import { toast } from '@/stores/toastStore';
import { ProductGallery } from '../components/pdp/ProductGallery';
import { ProductVariantPicker } from '../components/pdp/ProductVariantPicker';
import { QuantityStepper } from '../components/pdp/QuantityStepper';
import { ProductTabs } from '../components/pdp/ProductTabs';
import { RelatedProducts } from '../components/pdp/RelatedProducts';
import { EmptyState } from '@/core/components/Feedback/EmptyState';
import { cn } from '@/utils/cn';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem, openCart } = useCartStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // 1. Dual-lookup: Fetch product by slug or ID
  const fetchProduct = useCallback(async () => {
    if (!slug) return;
    try {
      setLoading(true);
      let found = await productService.getProductBySlug(slug);
      if (!found) {
        found = await productService.getProductById(slug);
      }
      setProduct(found);

      // Initialize selected options to first in-stock variant or first variant
      if (found && found.variants && found.variants.length > 0) {
        const inStockVariant =
          found.variants.find((v) => v.stock > 0) || found.variants[0];
        setSelectedOptions({ ...inStockVariant.options });
      } else {
        setSelectedOptions({});
      }
    } catch {
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchProduct();

    const handleUpdate = () => fetchProduct();
    window.addEventListener('d2c:products-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('d2c:products-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [fetchProduct]);

  // 2. Resolve selected variant based on selectedOptions
  const selectedVariant: ProductVariant | null = useMemo(() => {
    if (!product?.variants || product.variants.length === 0) return null;
    return (
      product.variants.find((v) =>
        Object.entries(selectedOptions).every(([name, val]) => v.options[name] === val)
      ) || null
    );
  }, [product?.variants, selectedOptions]);

  // Effective price, compareAtPrice, stock, and SKU
  const effectivePrice = selectedVariant ? selectedVariant.price : product?.price ?? 0;
  const effectiveCompareAtPrice = selectedVariant
    ? (selectedVariant.compareAtPrice ?? selectedVariant.originalPrice)
    : (product?.compareAtPrice ?? product?.originalPrice);
  const effectiveStock = selectedVariant ? selectedVariant.stock : product?.stock ?? 0;
  const effectiveSku = selectedVariant ? selectedVariant.sku : product?.sku ?? '';

  const hasDiscount = Boolean(
    effectiveCompareAtPrice && effectiveCompareAtPrice > effectivePrice
  );
  const discountPercent = hasDiscount
    ? Math.round(((effectiveCompareAtPrice! - effectivePrice) / effectiveCompareAtPrice!) * 100)
    : 0;

  const isOutOfStock = effectiveStock <= 0;

  const handleOptionChange = (name: string, value: string) => {
    setSelectedOptions((prev) => ({ ...prev, [name]: value }));
    setQuantity(1); // Reset quantity on variant change
  };

  const handleAddToCart = () => {
    if (!product || isOutOfStock) return;

    addItem({
      productId: product.id,
      variantId: selectedVariant?.id,
      title: product.name,
      variantName: selectedVariant?.title,
      price: effectivePrice,
      originalPrice: effectiveCompareAtPrice,
      quantity,
      image: selectedVariant?.image || product.images[0] || '',
      sku: effectiveSku,
      stock: effectiveStock,
    });

    toast.success(`Đã thêm ${quantity}x "${product.name}" vào giỏ hàng!`);
    openCart();
  };

  const handleBuyNow = () => {
    if (!product || isOutOfStock) return;

    addItem({
      productId: product.id,
      variantId: selectedVariant?.id,
      title: product.name,
      variantName: selectedVariant?.title,
      price: effectivePrice,
      originalPrice: effectiveCompareAtPrice,
      quantity,
      image: selectedVariant?.image || product.images[0] || '',
      sku: effectiveSku,
      stock: effectiveStock,
    });

    navigate('/checkout');
  };

  const handleShare = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Đã sao chép liên kết sản phẩm vào bộ nhớ tạm!');
      }
    } catch {
      toast.info(window.location.href);
    }
  };

  // 3. Loading skeleton state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse">
        <div className="h-4 w-64 bg-surface-subtle rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-6 aspect-square bg-surface-subtle rounded-2xl" />
          <div className="lg:col-span-6 space-y-5">
            <div className="h-5 w-32 bg-surface-subtle rounded" />
            <div className="h-8 w-full bg-surface-subtle rounded" />
            <div className="h-6 w-48 bg-surface-subtle rounded" />
            <div className="h-10 w-40 bg-surface-subtle rounded" />
            <div className="h-24 w-full bg-surface-subtle rounded-theme" />
            <div className="h-12 w-full bg-surface-subtle rounded-theme" />
          </div>
        </div>
      </div>
    );
  }

  // 4. Product 404 Empty State
  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <EmptyState
          preset="no-data"
          icon={<PackageX className="w-12 h-12" />}
          title="Không Tìm Thấy Sản Phẩm"
          description="Sản phẩm bạn đang tìm kiếm không tồn tại hoặc đã ngừng kinh doanh."
          action={{
            label: 'Quay lại danh mục sản phẩm',
            onClick: () => navigate('/catalog'),
            variant: 'primary',
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Breadcrumbs Trail */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-content-muted">
        <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          <span>Trang chủ</span>
        </Link>
        <ChevronRight className="w-3 h-3 text-border-base" />
        <Link to="/catalog" className="hover:text-primary transition-colors font-medium">
          Danh mục sản phẩm
        </Link>
        {product.categoryId && (
          <>
            <ChevronRight className="w-3 h-3 text-border-base" />
            <Link
              to={`/catalog?category=${product.categoryId}`}
              className="hover:text-primary transition-colors font-medium"
            >
              {product.categoryName || 'Danh mục'}
            </Link>
          </>
        )}
        <ChevronRight className="w-3 h-3 text-border-base" />
        <span className="text-content-main font-semibold truncate max-w-[200px] sm:max-w-sm">
          {product.name}
        </span>
      </nav>

      {/* Main PDP 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Media Gallery (6 cols) */}
        <div className="lg:col-span-6">
          <ProductGallery
            images={product.images}
            selectedVariantImage={selectedVariant?.image}
            productName={product.name}
          />
        </div>

        {/* Right Column: Product Info & Variant Picker (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Header & Badges */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Link
                to={`/catalog?category=${product.categoryId}`}
                className="text-xs font-bold text-primary uppercase tracking-wider hover:underline"
              >
                {product.categoryName || 'D2C Exclusive'}
              </Link>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className="p-1.5 rounded-full hover:bg-surface-subtle text-content-muted hover:text-rose-500 transition-colors"
                  title="Yêu thích"
                >
                  <Heart
                    className={cn('w-4 h-4', isWishlisted && 'fill-rose-500 text-rose-500')}
                  />
                </button>
                <button
                  onClick={handleShare}
                  className="p-1.5 rounded-full hover:bg-surface-subtle text-content-muted hover:text-primary transition-colors"
                  title="Chia sẻ liên kết"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-content-main tracking-tight leading-tight">
              {product.name}
            </h1>

            {/* SKU & Rating */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-content-muted pt-1">
              <span>
                Mã SKU: <strong className="font-mono text-content-main">{effectiveSku}</strong>
              </span>
              <span>•</span>
              <div className="flex items-center gap-1 text-amber-500 font-semibold">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span>{product.rating ? product.rating.toFixed(1) : '5.0'}</span>
                <span className="text-content-muted font-normal">
                  ({product.reviewCount || 0} đánh giá)
                </span>
              </div>
              {product.salesCount && product.salesCount > 0 && (
                <>
                  <span>•</span>
                  <span>Đã bán: <strong className="text-content-main">{product.salesCount}</strong></span>
                </>
              )}
            </div>
          </div>

          {/* Pricing Box with Discount Pill */}
          <div className="p-4 rounded-theme bg-surface-subtle border border-border-base flex items-baseline gap-3 flex-wrap">
            <span className="text-2xl sm:text-3xl font-black text-primary">
              {formatCurrencyVND(effectivePrice)}
            </span>

            {hasDiscount && (
              <>
                <span className="text-sm sm:text-base text-content-muted line-through">
                  {formatCurrencyVND(effectiveCompareAtPrice!)}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-status-danger text-white text-xs font-bold">
                  Tiết kiệm {discountPercent}%
                </span>
              </>
            )}

            {product.isFlashSale && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 text-xs font-bold">
                <Flame className="w-3.5 h-3.5 fill-rose-500" />
                Flash Sale
              </span>
            )}
          </div>

          {/* Short Description */}
          {product.shortDescription && (
            <p className="text-xs sm:text-sm text-content-muted leading-relaxed">
              {product.shortDescription}
            </p>
          )}

          {/* Interactive Variant Picker */}
          {product.options && product.options.length > 0 && (
            <div className="pt-2 border-t border-border-base">
              <ProductVariantPicker
                options={product.options}
                variants={product.variants || []}
                selectedOptions={selectedOptions}
                onChangeOption={handleOptionChange}
              />
            </div>
          )}

          {/* Quantity Stepper & Stock Telemetry */}
          <div className="space-y-2 pt-2 border-t border-border-base">
            <span className="block text-xs font-bold uppercase tracking-wider text-content-muted">
              Số Lượng
            </span>
            <QuantityStepper
              quantity={quantity}
              maxStock={effectiveStock}
              onChange={setQuantity}
              disabled={isOutOfStock}
            />
          </div>

          {/* CTAs: Add to Cart & Buy Now */}
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={cn(
                  'w-full py-3.5 px-6 rounded-theme font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 border shadow-sm',
                  isOutOfStock
                    ? 'bg-surface-subtle text-content-muted border-border-base cursor-not-allowed'
                    : 'bg-primary/10 text-primary border-primary hover:bg-primary hover:text-white active:scale-95'
                )}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{isOutOfStock ? 'Hết Hàng' : 'Thêm Vào Giỏ Hàng'}</span>
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className={cn(
                  'w-full py-3.5 px-6 rounded-theme font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md',
                  isOutOfStock
                    ? 'bg-surface-subtle text-content-muted cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-primary-hover active:scale-95 shadow-primary/25 hover:shadow-primary/40'
                )}
              >
                <Zap className="w-4 h-4" />
                <span>Mua Ngay</span>
              </button>
            </div>
          </div>

          {/* Value Propositions Micro Badges */}
          <div className="p-4 rounded-theme bg-surface-card border border-border-base divide-y divide-border-base/60 text-xs text-content-muted space-y-2.5">
            <div className="flex items-center gap-3 pt-1 first:pt-0">
              <Truck className="w-4 h-4 text-primary flex-shrink-0" />
              <span>Giao hàng toàn quốc từ 2-3 ngày, miễn phí đơn từ 299K</span>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
              <span>Cam kết 100% chính hãng D2C, bảo hành 12 tháng</span>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <RefreshCw className="w-4 h-4 text-primary flex-shrink-0" />
              <span>Đổi size/màu miễn phí tận nhà trong 7 ngày nếu không vừa</span>
            </div>
          </div>
        </div>
      </div>

      {/* PDP Information Tabs (Description, Specifications, Customer Reviews) */}
      <ProductTabs product={product} />

      {/* Cross-Sell Related Products */}
      <RelatedProducts
        currentProductId={product.id}
        categoryId={product.categoryId}
      />
    </div>
  );
};

export default ProductDetailPage;
