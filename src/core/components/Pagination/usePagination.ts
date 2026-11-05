import { PaginationItem, UsePaginationOptions } from './types';

/**
 * Generates an array of page numbers and ellipsis tokens based on current page and total pages.
 */
export function usePagination({
  currentPage,
  totalPages,
  siblingCount = 1,
}: UsePaginationOptions): PaginationItem[] {
  if (totalPages <= 0) return [];

  const totalNumbers = siblingCount * 2 + 3; // current + first + last + siblings
  const totalBlocks = totalNumbers + 2; // total numbers + 2 ellipses

  if (totalPages <= totalBlocks) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const shouldShowLeftDots = leftSiblingIndex > 2;
  const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

  if (!shouldShowLeftDots && shouldShowRightDots) {
    const leftItemCount = 3 + 2 * siblingCount;
    const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
    return [...leftRange, 'ellipsis-right', totalPages];
  }

  if (shouldShowLeftDots && !shouldShowRightDots) {
    const rightItemCount = 3 + 2 * siblingCount;
    const rightRange = Array.from(
      { length: rightItemCount },
      (_, i) => totalPages - rightItemCount + i + 1
    );
    return [1, 'ellipsis-left', ...rightRange];
  }

  if (shouldShowLeftDots && shouldShowRightDots) {
    const middleRange = Array.from(
      { length: rightSiblingIndex - leftSiblingIndex + 1 },
      (_, i) => leftSiblingIndex + i
    );
    return [1, 'ellipsis-left', ...middleRange, 'ellipsis-right', totalPages];
  }

  return [];
}
