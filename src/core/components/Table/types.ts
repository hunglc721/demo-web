import React from 'react';

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  columnKey: string;
  direction: SortDirection;
}

export interface ColumnDef<T> {
  key: string;
  header: React.ReactNode | ((props: { column: ColumnDef<T>; sortDirection: SortDirection | null }) => React.ReactNode);
  accessorKey?: keyof T | string;
  accessorFn?: (row: T, index: number) => any;
  cell?: (props: { row: T; value: any; index: number }) => React.ReactNode;
  sortable?: boolean;
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  align?: 'left' | 'center' | 'right';
  className?: string;
  headerClassName?: string;
}

export interface BulkActionsContext<T> {
  selectedCount: number;
  selectedKeys: (string | number)[];
  selectedRows: T[];
  clearSelection: () => void;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  rowKey?: keyof T | ((row: T, index: number) => string | number);

  // Sorting
  sortState?: SortState | null;
  onSortChange?: (sortState: SortState | null) => void;
  defaultSortState?: SortState | null;

  // Row Selection
  selectable?: boolean;
  selectedRowKeys?: (string | number)[];
  onSelectionChange?: (selectedKeys: (string | number)[], selectedRows: T[]) => void;

  // Sticky Header & Scrolling
  stickyHeader?: boolean;
  maxHeight?: string | number;

  // Bulk Actions Slot
  bulkActions?: (context: BulkActionsContext<T>) => React.ReactNode;

  // States
  isLoading?: boolean;
  loadingRowCount?: number;
  emptyState?: React.ReactNode;

  // Visual Customization
  bordered?: boolean;
  striped?: boolean;
  compact?: boolean;
  onRowClick?: (row: T, index: number) => void;
  rowClassName?: string | ((row: T, index: number) => string);
  className?: string;
}
