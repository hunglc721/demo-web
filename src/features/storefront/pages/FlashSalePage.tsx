import React, { useState, useEffect } from 'react';
import { Flame, Clock, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { productService } from '@/services/api/productService';
import { Product } from '@/types/product';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/ProductCardSkeleton';

export const FlashSalePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(14 * 3600 + 45 * 60 + 18); // 14h 45m 18s

  const loadSaleProducts = async () => {
    try {
      setLoading(true);
      const flashItems = await productService.getFlashSaleProducts();
      if (flashItems.length > 0) {
        setProducts(flashItems);
      } else {
        const all = await productService.getProducts({ pageSize: 50 });
        const discounted = all.items.filter(
          (p) =>
            (p.compareAtPrice && p.compareAtPrice > p.price) ||
            (p.originalPrice && p.originalPrice > p.price) ||
            p.tags.includes('sale')
        );
        setProducts(discounted);
      }
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSaleProducts();

    const handleUpdate = () => loadSaleProducts();
    window.addEventListener('d2c:products-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('d2c:products-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 12 * 3600));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;
  const pad = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb back */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-content-muted hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Quay lại trang chủ</span>
      </Link>

      {/* Hero Header */}
      <div className="p-8 sm:p-12 rounded-2xl bg-gradient-to-r from-rose-500/15 via-amber-500/15 to-primary/10 border border-rose-500/30 text-center space-y-5 shadow-sm">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500 text-white text-xs font-bold uppercase tracking-wider shadow">
          <Flame className="w-4 h-4 animate-bounce" />
          <span>Giờ Vàng Giá Sốc</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-content-main tracking-tight">
          Sự Kiện Flash Sale Hôm Nay
        </h1>

        {/* Live Countdown */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <span className="text-sm font-semibold text-content-muted flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-rose-500" />
            Thời gian còn lại:
          </span>
          <div className="flex items-center gap-2 font-mono text-lg font-bold">
            <div className="flex flex-col items-center">
              <span className="bg-slate-900 text-white px-3 py-1.5 rounded-theme shadow min-w-10 text-center">
                {pad(hours)}
              </span>
              <span className="text-[10px] text-content-muted mt-1 uppercase font-normal">Giờ</span>
            </div>
            <span className="text-rose-500 font-black text-xl mb-4">:</span>
            <div className="flex flex-col items-center">
              <span className="bg-slate-900 text-white px-3 py-1.5 rounded-theme shadow min-w-10 text-center">
                {pad(minutes)}
              </span>
              <span className="text-[10px] text-content-muted mt-1 uppercase font-normal">Phút</span>
            </div>
            <span className="text-rose-500 font-black text-xl mb-4">:</span>
            <div className="flex flex-col items-center">
              <span className="bg-slate-900 text-white px-3 py-1.5 rounded-theme shadow min-w-10 text-center">
                {pad(seconds)}
              </span>
              <span className="text-[10px] text-content-muted mt-1 uppercase font-normal">Giây</span>
            </div>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-content-muted max-w-lg mx-auto leading-relaxed">
          Ưu đãi độc quyền có hạn. Số lượng sản phẩm giảm giá sẽ tự động khóa khi hết tồn kho của sự kiện.
        </p>
      </div>

      {/* Grid of Flash Sale Products */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, idx) => (
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
        <div className="p-16 rounded-theme bg-surface-card border border-border-base text-center space-y-3">
          <Flame className="w-12 h-12 text-content-muted mx-auto opacity-50" />
          <h3 className="font-bold text-content-main">Chưa có sản phẩm Flash Sale</h3>
          <p className="text-sm text-content-muted max-w-md mx-auto">
            Các ưu đãi Flash Sale sẽ sớm được kích hoạt trong khung giờ tiếp theo.
          </p>
          <Link
            to="/catalog"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-theme bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors"
          >
            Khám phá danh mục sản phẩm
          </Link>
        </div>
      )}
    </div>
  );
};
export default FlashSalePage;
