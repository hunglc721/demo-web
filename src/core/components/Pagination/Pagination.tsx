import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { usePagination } from './usePagination';
import { PaginationProps } from './types';

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages: propTotalPages,
  totalItems = 0,
  pageSize,
  pageSizeOptions = [10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
  showPageSizeSelector = true,
  showTotal = true,
  siblingCount = 1,
  size = 'md',
  className,
}) => {
  const calculatedTotalPages = Math.ceil(totalItems / (pageSize || 10));
  const totalPages = propTotalPages !== undefined ? propTotalPages : calculatedTotalPages || 1;

  const paginationRange = usePagination({
    currentPage,
    totalPages,
    siblingCount,
  });

  const from = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = totalItems === 0 ? 0 : Math.min(currentPage * pageSize, totalItems);

  const isPrevDisabled = currentPage <= 1;
  const isNextDisabled = currentPage >= totalPages;

  const sizeClasses = {
    sm: 'text-xs h-7 min-w-7 px-2',
    md: 'text-sm h-8 min-w-8 px-2.5',
    lg: 'text-base h-10 min-w-10 px-3',
  }[size];

  return (
    <nav
      role="navigation"
      aria-label="Điều hướng phân trang"
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-4 py-3 select-none',
        className
      )}
    >
      {/* Left: Total Records Info */}
      {showTotal && (
        <div className="text-xs sm:text-sm text-content-muted">
          Hiển thị <span className="font-medium text-content-main">{from}</span> -{' '}
          <span className="font-medium text-content-main">{to}</span> trong{' '}
          <span className="font-medium text-content-main">{totalItems}</span> bản ghi
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap justify-center">
        {/* Middle: Page Size Selector */}
        {showPageSizeSelector && onPageSizeChange && (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-content-muted">
            <span>Số dòng:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label="Số bản ghi mỗi trang"
              className="h-8 px-2 rounded-theme border border-border-base bg-surface-card text-content-main text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / trang
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Right: Page Navigation Pills */}
        <div className="flex items-center gap-1">
          {/* Previous Page */}
          <button
            type="button"
            disabled={isPrevDisabled}
            onClick={() => onPageChange(currentPage - 1)}
            aria-label="Trang trước"
            className={cn(
              'inline-flex items-center justify-center rounded-theme border border-border-base transition-colors cursor-pointer',
              sizeClasses,
              isPrevDisabled
                ? 'opacity-40 cursor-not-allowed pointer-events-none'
                : 'hover:bg-surface-subtle text-content-main'
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline-block ml-1">Trước</span>
          </button>

          {/* Page Number Pills */}
          {paginationRange.map((pageItem, index) => {
            if (pageItem === 'ellipsis-left' || pageItem === 'ellipsis-right') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  aria-hidden="true"
                  className="px-2 py-1 text-content-subtle select-none"
                >
                  ...
                </span>
              );
            }

            const isActive = pageItem === currentPage;

            return (
              <button
                key={pageItem}
                type="button"
                onClick={() => onPageChange(pageItem)}
                aria-label={`Đến trang ${pageItem}`}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'inline-flex items-center justify-center rounded-theme font-medium transition-all cursor-pointer',
                  sizeClasses,
                  isActive
                    ? 'bg-primary text-content-inverse shadow-sm font-semibold'
                    : 'text-content-muted hover:text-content-main hover:bg-surface-subtle border border-border-base'
                )}
              >
                {pageItem}
              </button>
            );
          })}

          {/* Next Page */}
          <button
            type="button"
            disabled={isNextDisabled}
            onClick={() => onPageChange(currentPage + 1)}
            aria-label="Trang tiếp theo"
            className={cn(
              'inline-flex items-center justify-center rounded-theme border border-border-base transition-colors cursor-pointer',
              sizeClasses,
              isNextDisabled
                ? 'opacity-40 cursor-not-allowed pointer-events-none'
                : 'hover:bg-surface-subtle text-content-main'
            )}
          >
            <span className="hidden sm:inline-block mr-1">Tiếp</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
};

Pagination.displayName = 'Pagination';
