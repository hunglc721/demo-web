import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layers, ArrowLeft } from 'lucide-react';

export const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link
        to="/catalog"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-content-muted hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Quay lại tất cả sản phẩm</span>
      </Link>

      <div className="p-8 rounded-theme bg-surface-card border border-border-base text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <Layers className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-content-main capitalize">
          Danh mục: {slug ? slug.replace(/-/g, ' ') : 'Chi tiết danh mục'}
        </h1>
        <p className="text-sm text-content-muted max-w-lg mx-auto">
          Trang hiển thị danh sách sản phẩm thuộc danh mục đã chọn với các bộ lọc phân cấp (Milestone M5).
        </p>
      </div>
    </div>
  );
};
export default CategoryPage;
