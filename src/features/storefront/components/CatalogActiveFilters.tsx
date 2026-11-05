import React from 'react';
import { X } from 'lucide-react';
import { Category } from '@/types/product';
import { formatCurrencyVND } from '@/utils/formatters';
import { CatalogFilterState } from './CatalogFilterSidebar';

export interface CatalogActiveFiltersProps {
  searchQuery?: string;
  filters: CatalogFilterState;
  categories: Category[];
  onRemoveSearch?: () => void;
  onRemoveCategory?: () => void;
  onRemovePrice?: () => void;
  onRemoveInStock?: () => void;
  onRemoveRating?: () => void;
  onRemoveTag?: () => void;
  onClearAll: () => void;
}

export const CatalogActiveFilters: React.FC<CatalogActiveFiltersProps> = ({
  searchQuery,
  filters,
  categories,
  onRemoveSearch,
  onRemoveCategory,
  onRemovePrice,
  onRemoveInStock,
  onRemoveRating,
  onRemoveTag,
  onClearAll,
}) => {
  const activeChips: Array<{ label: string; onRemove?: () => void }> = [];

  if (searchQuery) {
    activeChips.push({
      label: `Tìm kiếm: "${searchQuery}"`,
      onRemove: onRemoveSearch,
    });
  }

  if (filters.category) {
    const matched = categories.find(
      (c) => c.slug === filters.category || c.id === filters.category
    );
    activeChips.push({
      label: `Danh mục: ${matched ? matched.name : filters.category}`,
      onRemove: onRemoveCategory,
    });
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    let priceLabel = 'Giá: ';
    if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
      priceLabel += `${formatCurrencyVND(filters.minPrice)} - ${formatCurrencyVND(filters.maxPrice)}`;
    } else if (filters.minPrice !== undefined) {
      priceLabel += `Từ ${formatCurrencyVND(filters.minPrice)}`;
    } else if (filters.maxPrice !== undefined) {
      priceLabel += `Dưới ${formatCurrencyVND(filters.maxPrice)}`;
    }
    activeChips.push({
      label: priceLabel,
      onRemove: onRemovePrice,
    });
  }

  if (filters.inStock) {
    activeChips.push({
      label: 'Còn hàng',
      onRemove: onRemoveInStock,
    });
  }

  if (filters.minRating) {
    activeChips.push({
      label: `Đánh giá: ≥ ${filters.minRating} sao`,
      onRemove: onRemoveRating,
    });
  }

  if (filters.tag) {
    const tagLabels: Record<string, string> = {
      hot: 'Deal Hot',
      'best-seller': 'Bán chạy',
      new: 'Hàng mới',
      sale: 'Giảm giá',
    };
    activeChips.push({
      label: `Nhãn: ${tagLabels[filters.tag] || filters.tag}`,
      onRemove: onRemoveTag,
    });
  }

  if (activeChips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2">
      <span className="text-xs font-semibold text-content-muted">Đang lọc:</span>

      {activeChips.map((chip, idx) => (
        <span
          key={idx}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
        >
          <span>{chip.label}</span>
          {chip.onRemove && (
            <button
              onClick={chip.onRemove}
              className="hover:text-status-danger p-0.5 rounded-full transition-colors"
              aria-label="Xóa bộ lọc này"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </span>
      ))}

      <button
        onClick={onClearAll}
        className="text-xs text-status-danger hover:underline font-semibold ml-2"
      >
        Xóa tất cả
      </button>
    </div>
  );
};
export default CatalogActiveFilters;
