import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, PackageOpen } from 'lucide-react';

export const CatalogPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const sort = searchParams.get('sort') || 'popular';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-base pb-6">
        <div>
          <h1 className="text-2xl font-bold text-content-main">
            {query ? `Kết quả tìm kiếm cho: "${query}"` : 'Tất cả sản phẩm'}
          </h1>
          <p className="text-sm text-content-muted mt-1">
            Hiển thị danh mục sản phẩm D2C chất lượng cao (Sắp có bộ lọc đầy đủ trong M5)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-content-muted">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Sắp xếp:</span>
            <select
              defaultValue={sort}
              className="bg-surface-card border border-border-base rounded-theme px-3 py-1.5 text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="popular">Phổ biến nhất</option>
              <option value="newest">Mới nhất</option>
              <option value="price-asc">Giá tăng dần</option>
              <option value="price-desc">Giá giảm dần</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid Layout Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filter Sidebar Placeholder */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="p-4 rounded-theme bg-surface-card border border-border-base space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border-base">
              <span className="font-semibold text-sm flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" />
                Bộ lọc tìm kiếm
              </span>
            </div>
            <div className="space-y-3 text-xs text-content-muted">
              <div>
                <span className="font-medium text-content-main block mb-2">Khoảng giá</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full bg-surface-subtle border border-border-base rounded px-2 py-1 text-xs"
                    readOnly
                  />
                  <span>-</span>
                  <input
                    type="number"
                    placeholder="5.000.000"
                    className="w-full bg-surface-subtle border border-border-base rounded px-2 py-1 text-xs"
                    readOnly
                  />
                </div>
              </div>
              <div>
                <span className="font-medium text-content-main block mb-2">Tình trạng kho</span>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded border-border-base" />
                  <span>Còn hàng</span>
                </label>
              </div>
            </div>
          </div>
        </aside>

        {/* Product Cards Placeholder */}
        <div className="lg:col-span-3">
          <div className="p-12 rounded-theme bg-surface-card border border-border-base text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <PackageOpen className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-content-main">Danh Mục Sản Phẩm (Catalog PLP)</h2>
            <p className="text-sm text-content-muted max-w-md mx-auto">
              Kho sản phẩm D2C đầy đủ với bộ lọc đa tiêu chí (danh mục, khoảng giá, màu sắc, kích thước) và phân trang sẽ được tích hợp trong Milestone M5 cùng Mock Service Engine.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CatalogPage;
