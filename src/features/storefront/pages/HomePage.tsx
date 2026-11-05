import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Sparkles, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import { defaultAppConfig } from '@/config/appConfig';

export const HomePage: React.FC = () => {
  return (
    <div className="space-y-12 pb-16">
      {/* Hero Banner Section Placeholder */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-surface-card to-surface-subtle border-b border-border-base py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Nền Tảng E-Commerce D2C Khởi Nghiệp
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-content-main tracking-tight max-w-3xl mx-auto leading-tight">
            Xây Dựng Thương Hiệu Độc Lập — Tự Do Tăng Trưởng Doanh Thu
          </h1>
          <p className="text-base sm:text-lg text-content-muted max-w-2xl mx-auto">
            {defaultAppConfig.store.brandSlogan}. Giải pháp tối ưu cho nhà bán hàng rời sàn thương mại điện tử với trải nghiệm mua sắm hiện đại, mượt mà.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-theme bg-primary text-white font-semibold hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Khám Phá Sản Phẩm</span>
            </Link>
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-theme bg-surface-card border border-border-base text-content-main font-semibold hover:bg-surface-subtle transition-all"
            >
              <span>Vào Quản Trị Admin</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-theme bg-surface-card border border-border-base flex items-start gap-4">
            <div className="p-3 rounded-theme bg-primary/10 text-primary">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-content-main text-sm">Giao Hàng Miễn Phí</h3>
              <p className="text-xs text-content-muted mt-1">Đơn từ 299K giao tận nơi toàn quốc nhanh chóng.</p>
            </div>
          </div>
          <div className="p-6 rounded-theme bg-surface-card border border-border-base flex items-start gap-4">
            <div className="p-3 rounded-theme bg-primary/10 text-primary">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-content-main text-sm">Chính Hãng 100%</h3>
              <p className="text-xs text-content-muted mt-1">Cam kết chất lượng chuẩn D2C từ nhà sản xuất.</p>
            </div>
          </div>
          <div className="p-6 rounded-theme bg-surface-card border border-border-base flex items-start gap-4">
            <div className="p-3 rounded-theme bg-primary/10 text-primary">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-content-main text-sm">Đổi Trả 7 Ngày</h3>
              <p className="text-xs text-content-muted mt-1">Hỗ trợ đổi trả miễn phí nếu không vừa ý.</p>
            </div>
          </div>
          <div className="p-6 rounded-theme bg-surface-card border border-border-base flex items-start gap-4">
            <div className="p-3 rounded-theme bg-primary/10 text-primary">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-content-main text-sm">Ưu Đãi Độc Quyền</h3>
              <p className="text-xs text-content-muted mt-1">Tích điểm thành viên và nhận voucher mỗi tuần.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Collections Placeholder */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-content-main">Danh Mục Nổi Bật</h2>
            <p className="text-sm text-content-muted mt-1">Khám phá các bộ sưu tập được ưa chuộng nhất</p>
          </div>
          <Link to="/catalog" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
            <span>Xem tất cả</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {defaultAppConfig.storefrontNav.categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/category/${cat.slug}`}
              className="group p-6 rounded-theme bg-surface-card border border-border-base hover:border-primary transition-all text-center flex flex-col items-center justify-center space-y-3"
            >
              <div className="w-14 h-14 rounded-full bg-surface-subtle group-hover:bg-primary/10 group-hover:text-primary flex items-center justify-center transition-colors text-content-muted">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <span className="font-semibold text-sm text-content-main group-hover:text-primary transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};
export default HomePage;
