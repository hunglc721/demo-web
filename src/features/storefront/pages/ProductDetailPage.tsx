import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Star, ShieldCheck, Truck, RefreshCw } from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Link
        to="/catalog"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-content-muted hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Quay lại danh mục sản phẩm</span>
      </Link>

      <div className="p-8 rounded-theme bg-surface-card border border-border-base grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Gallery Placeholder */}
        <div className="aspect-square rounded-theme bg-surface-subtle border border-border-base flex flex-col items-center justify-center p-6 text-center text-content-muted">
          <ShoppingBag className="w-16 h-16 text-primary/40 mb-2" />
          <span className="text-sm font-semibold">Khung hình ảnh sản phẩm (Gallery PDP)</span>
          <span className="text-xs mt-1">Hỗ trợ đa ảnh, zoom chi tiết, chọn biến thể màu sắc</span>
        </div>

        {/* Info Placeholder */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-1 text-amber-500 text-xs mb-2">
              <Star className="w-4 h-4 fill-amber-500" />
              <span className="font-semibold text-content-main">4.9 / 5.0</span>
              <span className="text-content-muted">(128 đánh giá)</span>
            </div>
            <h1 className="text-2xl font-bold text-content-main">
              Chi tiết sản phẩm: {slug || 'Sản phẩm demo'}
            </h1>
            <p className="text-2xl font-extrabold text-primary mt-2">350.000 ₫</p>
          </div>

          <div className="p-4 rounded-theme bg-surface-subtle text-xs text-content-muted space-y-2">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary" />
              <span>Giao hàng toàn quốc trong 2-3 ngày làm việc</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Bảo hành chính hãng 12 tháng</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-primary" />
              <span>Đổi size/màu miễn phí trong 7 ngày</span>
            </div>
          </div>

          <div className="pt-4 border-t border-border-base">
            <span className="text-xs text-content-muted block mb-3">
              Giao diện chi tiết PDP với bộ chọn biến thể (Size/Color) và giỏ hàng thời gian thực sẽ hoàn thiện trong M5.
            </span>
            <Link
              to="/cart"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-theme bg-primary text-white font-semibold hover:bg-primary-hover shadow-md transition-all"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Thêm Vào Giỏ Hàng (Mẫu)</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProductDetailPage;
