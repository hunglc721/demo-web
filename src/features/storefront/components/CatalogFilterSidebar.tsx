import React, { useState, useEffect } from 'react';
import { Filter, RotateCcw, Check, Star } from 'lucide-react';
import { Category } from '@/types/product';
import { cn } from '@/utils/cn';

export interface CatalogFilterState {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  minRating?: number;
  tag?: string;
}

export interface CatalogFilterSidebarProps {
  categories: Category[];
  categoryCounts: Record<string, number>;
  filters: CatalogFilterState;
  onFilterChange: (updates: Partial<CatalogFilterState>) => void;
  onReset: () => void;
  className?: string;
}

const pricePresets = [
  { label: 'Tất cả mức giá', min: undefined, max: undefined },
  { label: 'Dưới 200.000₫', min: 0, max: 200000 },
  { label: '200.000₫ - 500.000₫', min: 200000, max: 500000 },
  { label: '500.000₫ - 1.000.000₫', min: 500000, max: 1000000 },
  { label: 'Trên 1.000.000₫', min: 1000000, max: undefined },
];

const tagOptions = [
  { id: 'hot', label: 'Deal Hot' },
  { id: 'best-seller', label: 'Bán chạy' },
  { id: 'new', label: 'Hàng mới' },
  { id: 'sale', label: 'Giảm giá sâu' },
];

export const CatalogFilterSidebar: React.FC<CatalogFilterSidebarProps> = ({
  categories,
  categoryCounts,
  filters,
  onFilterChange,
  onReset,
  className = '',
}) => {
  const [customMin, setCustomMin] = useState<string>(
    filters.minPrice !== undefined ? String(filters.minPrice) : ''
  );
  const [customMax, setCustomMax] = useState<string>(
    filters.maxPrice !== undefined ? String(filters.maxPrice) : ''
  );

  useEffect(() => {
    setCustomMin(filters.minPrice !== undefined ? String(filters.minPrice) : '');
    setCustomMax(filters.maxPrice !== undefined ? String(filters.maxPrice) : '');
  }, [filters.minPrice, filters.maxPrice]);

  const handleApplyCustomPrice = (e: React.FormEvent) => {
    e.preventDefault();
    const minVal = customMin.trim() ? Math.max(0, parseInt(customMin, 10)) : undefined;
    const maxVal = customMax.trim() ? Math.max(0, parseInt(customMax, 10)) : undefined;
    onFilterChange({ minPrice: minVal, maxPrice: maxVal });
  };

  const hasActiveFilters = Boolean(
    filters.category ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    filters.inStock ||
    filters.minRating ||
    filters.tag
  );

  return (
    <div className={cn('space-y-6 text-content-main', className)}>
      {/* Header with Reset */}
      <div className="flex items-center justify-between pb-3 border-b border-border-base">
        <span className="font-bold text-sm flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          <span>Bộ Lọc Tìm Kiếm</span>
        </span>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-xs text-primary hover:text-primary-hover font-semibold flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Xóa bộ lọc</span>
          </button>
        )}
      </div>

      {/* 1. Category Filter */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-content-muted">
          Danh Mục Sản Phẩm
        </h4>
        <div className="space-y-1 text-sm max-h-56 overflow-y-auto pr-1">
          <button
            onClick={() => onFilterChange({ category: undefined })}
            className={cn(
              'w-full flex items-center justify-between px-2.5 py-1.5 rounded-theme text-xs font-medium transition-colors text-left',
              !filters.category
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-content-muted hover:bg-surface-subtle hover:text-content-main'
            )}
          >
            <span>Tất cả danh mục</span>
            <span className="text-[11px] opacity-75">
              ({Object.values(categoryCounts).reduce((a, b) => a + b, 0)})
            </span>
          </button>

          {categories.map((cat) => {
            const isSelected = filters.category === cat.slug || filters.category === cat.id;
            const count = categoryCounts[cat.slug] ?? categoryCounts[cat.id] ?? cat.productCount ?? 0;
            return (
              <button
                key={cat.id}
                onClick={() => onFilterChange({ category: isSelected ? undefined : cat.slug })}
                className={cn(
                  'w-full flex items-center justify-between px-2.5 py-1.5 rounded-theme text-xs font-medium transition-colors text-left',
                  isSelected
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-content-muted hover:bg-surface-subtle hover:text-content-main'
                )}
              >
                <span className="truncate pr-2">{cat.name}</span>
                <span className="text-[11px] opacity-75 flex-shrink-0">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Price Range Presets & Inputs */}
      <div className="space-y-3 pt-3 border-t border-border-base">
        <h4 className="text-xs font-bold uppercase tracking-wider text-content-muted">
          Khoảng Giá
        </h4>
        <div className="space-y-1.5 text-xs">
          {pricePresets.map((preset, idx) => {
            const isMatch =
              filters.minPrice === preset.min && filters.maxPrice === preset.max;
            return (
              <label
                key={idx}
                className={cn(
                  'flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors',
                  isMatch ? 'text-primary font-bold' : 'text-content-muted hover:text-content-main'
                )}
              >
                <input
                  type="radio"
                  name="pricePreset"
                  checked={isMatch}
                  onChange={() =>
                    onFilterChange({
                      minPrice: preset.min,
                      maxPrice: preset.max,
                    })
                  }
                  className="rounded-full text-primary focus:ring-primary h-3.5 w-3.5"
                />
                <span>{preset.label}</span>
              </label>
            );
          })}
        </div>

        {/* Custom Price Range Inputs */}
        <form onSubmit={handleApplyCustomPrice} className="pt-2 space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <input
              type="number"
              placeholder="Từ ₫"
              value={customMin}
              onChange={(e) => setCustomMin(e.target.value)}
              className="w-full bg-surface-subtle border border-border-base rounded px-2.5 py-1.5 text-xs text-content-main focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <span className="text-content-muted">-</span>
            <input
              type="number"
              placeholder="Đến ₫"
              value={customMax}
              onChange={(e) => setCustomMax(e.target.value)}
              className="w-full bg-surface-subtle border border-border-base rounded px-2.5 py-1.5 text-xs text-content-main focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            className="w-full py-1.5 rounded-theme bg-surface-subtle hover:bg-primary hover:text-white border border-border-base text-content-main text-xs font-semibold transition-colors"
          >
            Áp dụng giá
          </button>
        </form>
      </div>

      {/* 3. Availability Filter (In-stock toggle) */}
      <div className="space-y-3 pt-3 border-t border-border-base">
        <h4 className="text-xs font-bold uppercase tracking-wider text-content-muted">
          Tình Trạng Kho
        </h4>
        <label className="flex items-center justify-between cursor-pointer text-xs p-1">
          <span className="font-medium text-content-main">Chỉ hiện hàng còn kho</span>
          <input
            type="checkbox"
            checked={Boolean(filters.inStock)}
            onChange={(e) => onFilterChange({ inStock: e.target.checked || undefined })}
            className="h-4 w-4 rounded border-border-base text-primary focus:ring-primary"
          />
        </label>
      </div>

      {/* 4. Rating Filter */}
      <div className="space-y-3 pt-3 border-t border-border-base">
        <h4 className="text-xs font-bold uppercase tracking-wider text-content-muted">
          Đánh Giá Tối Thiểu
        </h4>
        <div className="space-y-1 text-xs">
          {[4, 3, 2].map((stars) => {
            const isSelected = filters.minRating === stars;
            return (
              <button
                key={stars}
                onClick={() =>
                  onFilterChange({ minRating: isSelected ? undefined : stars })
                }
                className={cn(
                  'w-full flex items-center justify-between p-1.5 rounded transition-colors text-left',
                  isSelected
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-content-muted hover:bg-surface-subtle hover:text-content-main'
                )}
              >
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'w-3.5 h-3.5',
                          i < stars
                            ? 'fill-amber-500 text-amber-500'
                            : 'text-border-base'
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-xs">từ {stars} sao</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Popular Tags */}
      <div className="space-y-3 pt-3 border-t border-border-base">
        <h4 className="text-xs font-bold uppercase tracking-wider text-content-muted">
          Nhãn Phổ Biến
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {tagOptions.map((t) => {
            const isSelected = filters.tag === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onFilterChange({ tag: isSelected ? undefined : t.id })}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium transition-colors border',
                  isSelected
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-surface-subtle text-content-muted border-border-base hover:border-primary/50'
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default CatalogFilterSidebar;
