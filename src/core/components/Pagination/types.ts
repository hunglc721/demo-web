export type PaginationItem = number | 'ellipsis-left' | 'ellipsis-right';

export interface UsePaginationOptions {
  currentPage: number;
  totalPages: number;
  siblingCount?: number;
}

export interface PaginationProps {
  currentPage: number;
  totalPages?: number;
  totalItems?: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  showPageSizeSelector?: boolean;
  showTotal?: boolean;
  siblingCount?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
