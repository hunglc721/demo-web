import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Clock, ArrowRight } from 'lucide-react';
import { productService } from '@/services/api/productService';
import { Product } from '@/types/product';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/ProductCardSkeleton';

export interface FlashSaleBlockProps {
  settings?: {
    title?: string;
    subtitle?: string;
    durationHours?: number;
    productIds?: string[];
    badgeText?: string;
  };
}

export const FlashSaleBlock: React.FC<FlashSaleBlockProps> = ({ settings }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Countdown timer state in seconds (defaults to ~12 hours or 43200s)
  const initialSeconds = (settings?.durationHours || 12) * 3600;
  const [timeLeft, setTimeLeft] = useState(initialSeconds);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const flashItems = await productService.getFlashSaleProducts();
      if (flashItems.length > 0) {
        setProducts(flashItems.slice(0, 4));
      } else {
        // Fallback: pick products with compareAtPrice or top products
        const allRes = await productService.getProducts({ pageSize: 12 });
        const saleItems = allRes.items.filter(
          (p) => (p.compareAtPrice && p.compareAtPrice > p.price) || p.tags.includes('sale')
        );
        setProducts(saleItems.slice(0, 4));
      }
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();

    const handleUpdate = () => fetchProducts();
    window.addEventListener('d2c:products-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('d2c:products-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : initialSeconds));
    }, 1000);
    return () => clearInterval(timer);
  }, [initialSeconds]);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const pad = (num: number) => num.toString().padStart(2, '0');

  const title = settings?.title || 'Giờ Vàng Giá Sốc';
  const subtitle =
    settings?.subtitle || 'Cơ hội săn deal hot giảm giá sâu lên tới 50% chỉ trong hôm nay';

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="rounded-2xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-primary/10 border border-rose-500/20 p-6 sm:p-8 space-y-6">
        {/* Header & Live Countdown */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-rose-500/20 pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500 text-white text-xs font-bold uppercase tracking-wider shadow-sm">
              <Flame className="w-4 h-4 animate-bounce" />
              <span>FLASH SALE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-content-main tracking-tight">
              {title}
            </h2>
            <p className="text-sm text-content-muted">{subtitle}</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-content-muted flex items-center gap-1">
                <Clock className="w-4 h-4 text-rose-500" />
                Kết thúc sau:
              </span>
              <div className="flex items-center gap-1.5 font-mono text-sm sm:text-base font-bold">
                <span className="bg-slate-900 text-white px-2 py-1 rounded-theme shadow">
                  {pad(hours)}
                </span>
                <span className="text-rose-500 font-black">:</span>
                <span className="bg-slate-900 text-white px-2 py-1 rounded-theme shadow">
                  {pad(minutes)}
                </span>
                <span className="text-rose-500 font-black">:</span>
                <span className="bg-slate-900 text-white px-2 py-1 rounded-theme shadow">
                  {pad(seconds)}
                </span>
              </div>
            </div>

            <Link
              to="/flash-sale"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline"
            >
              <span>Xem tất cả deal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 4 }).map((_, idx) => (
              <ProductCardSkeleton key={idx} />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                showStockProgress={true}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-content-muted bg-surface-card rounded-theme border border-border-base">
            Không có sản phẩm Flash Sale nào đang hoạt động.
          </div>
        )}

        <div className="sm:hidden text-center pt-2">
          <Link
            to="/flash-sale"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:underline"
          >
            <span>Xem tất cả deal Flash Sale</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};
export default FlashSaleBlock;
