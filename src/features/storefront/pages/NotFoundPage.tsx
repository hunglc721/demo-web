import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-md w-full mx-auto text-center p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
      <div className="text-8xl font-black text-primary/20 tracking-widest select-none">
        404
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-content-main">Không Tìm Thấy Trang</h1>
        <p className="text-sm text-content-muted">
          Đường dẫn bạn truy cập có thể đã bị xóa, thay đổi tên hoặc tạm thời không khả dụng.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        <Link
          to="/"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-theme bg-primary text-white text-sm font-semibold hover:bg-primary-hover shadow-sm transition-all"
        >
          <Home className="w-4 h-4" />
          <span>Về trang chủ</span>
        </Link>
        <Link
          to="/catalog"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-theme bg-surface-subtle border border-border-base text-content-main text-sm font-semibold hover:bg-border-base transition-all"
        >
          <Search className="w-4 h-4" />
          <span>Khám phá sản phẩm</span>
        </Link>
      </div>
    </div>
  );
};
export default NotFoundPage;
