import { useState, useMemo, useRef, useEffect } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './Table';
import { DataTableProps, SortState } from './types';

export function DataTable<T>({
  data = [],
  columns,
  rowKey = 'id' as keyof T,
  sortState: controlledSortState,
  onSortChange,
  defaultSortState = null,
  selectable = false,
  selectedRowKeys: controlledSelectedKeys,
  onSelectionChange,
  stickyHeader = false,
  maxHeight,
  bulkActions,
  isLoading = false,
  loadingRowCount = 5,
  emptyState,
  bordered = false,
  striped = false,
  compact = false,
  onRowClick,
  rowClassName,
  className,
}: DataTableProps<T>) {
  // Sort State
  const [internalSortState, setInternalSortState] = useState<SortState | null>(defaultSortState);
  const isSortControlled = controlledSortState !== undefined;
  const currentSort = isSortControlled ? controlledSortState : internalSortState;

  const handleSortToggle = (columnKey: string) => {
    let nextSort: SortState | null = null;
    if (!currentSort || currentSort.columnKey !== columnKey) {
      nextSort = { columnKey, direction: 'asc' };
    } else if (currentSort.direction === 'asc') {
      nextSort = { columnKey, direction: 'desc' };
    } else {
      nextSort = null;
    }

    if (!isSortControlled) setInternalSortState(nextSort);
    onSortChange?.(nextSort);
  };

  // Selection State
  const [internalSelectedKeys, setInternalSelectedKeys] = useState<(string | number)[]>([]);
  const isSelectionControlled = controlledSelectedKeys !== undefined;
  const selectedKeys = isSelectionControlled ? controlledSelectedKeys : internalSelectedKeys;

  const masterCheckboxRef = useRef<HTMLInputElement>(null);

  const getRowId = (row: T, index: number): string | number => {
    if (typeof rowKey === 'function') return rowKey(row, index);
    if (typeof rowKey === 'string' && row && (row as any)[rowKey] !== undefined) {
      return (row as any)[rowKey];
    }
    return (row as any)?.id !== undefined ? (row as any).id : index;
  };

  const allRowKeys = useMemo(() => data.map((item, idx) => getRowId(item, idx)), [data, rowKey]);

  const isAllSelected = data.length > 0 && selectedKeys.length === data.length;
  const isIndeterminate = selectedKeys.length > 0 && selectedKeys.length < data.length;

  useEffect(() => {
    if (masterCheckboxRef.current) {
      masterCheckboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  const handleSelectAll = (checked: boolean) => {
    const nextKeys = checked ? allRowKeys : [];
    const nextRows = checked ? [...data] : [];
    if (!isSelectionControlled) setInternalSelectedKeys(nextKeys);
    onSelectionChange?.(nextKeys, nextRows);
  };

  const handleSelectRow = (key: string | number) => {
    const nextKeys = selectedKeys.includes(key)
      ? selectedKeys.filter((k) => k !== key)
      : [...selectedKeys, key];

    const nextRows = data.filter((item, idx) => nextKeys.includes(getRowId(item, idx)));

    if (!isSelectionControlled) setInternalSelectedKeys(nextKeys);
    onSelectionChange?.(nextKeys, nextRows);
  };

  const clearSelection = () => {
    if (!isSelectionControlled) setInternalSelectedKeys([]);
    onSelectionChange?.([], []);
  };

  const selectedRows = useMemo(
    () => data.filter((item, idx) => selectedKeys.includes(getRowId(item, idx))),
    [data, selectedKeys]
  );

  // Sorting Process (for uncontrolled mode)
  const processedData = useMemo(() => {
    if (isSortControlled || !currentSort) return data;

    const column = columns.find((c) => c.key === currentSort.columnKey);
    if (!column) return data;

    const copy = [...data];
    copy.sort((a, b) => {
      let valA: any;
      let valB: any;

      if (column.accessorFn) {
        valA = column.accessorFn(a, 0);
        valB = column.accessorFn(b, 0);
      } else if (column.accessorKey) {
        valA = (a as any)[column.accessorKey];
        valB = (b as any)[column.accessorKey];
      } else {
        valA = (a as any)[column.key];
        valB = (b as any)[column.key];
      }

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      let comp = 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        comp = valA - valB;
      } else {
        comp = String(valA).localeCompare(String(valB), 'vi', { numeric: true, sensitivity: 'base' });
      }

      return currentSort.direction === 'asc' ? comp : -comp;
    });

    return copy;
  }, [data, columns, currentSort, isSortControlled]);

  return (
    <div className={cn('w-full flex flex-col', className)}>
      {/* Bulk actions toolbar */}
      {selectable && selectedKeys.length > 0 && bulkActions && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-primary-subtle border border-primary/20 rounded-theme mb-3 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary text-white">
              {selectedKeys.length}
            </span>
            <span className="text-sm font-medium text-content-main">
              Đã chọn {selectedKeys.length} mục
            </span>
            <button
              type="button"
              onClick={clearSelection}
              className="text-xs text-primary hover:underline font-medium ml-2 cursor-pointer"
            >
              Bỏ chọn tất cả
            </button>
          </div>
          <div className="flex items-center gap-2">
            {bulkActions({
              selectedCount: selectedKeys.length,
              selectedKeys,
              selectedRows,
              clearSelection,
            })}
          </div>
        </div>
      )}

      {/* Table Container */}
      <Table
        maxHeight={maxHeight}
        containerClassName={cn(
          'rounded-theme bg-surface-card',
          bordered && 'border border-border-base',
          'shadow-sm'
        )}
      >
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead isSticky={stickyHeader} className="w-10 px-3">
                <input
                  ref={masterCheckboxRef}
                  type="checkbox"
                  checked={isAllSelected}
                  aria-checked={isIndeterminate ? 'mixed' : isAllSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  aria-label="Chọn tất cả dòng"
                  className="rounded border-border-base text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                />
              </TableHead>
            )}

            {columns.map((col) => {
              const isSorted = currentSort?.columnKey === col.key;
              const direction = isSorted ? currentSort.direction : null;

              return (
                <TableHead
                  key={col.key}
                  isSticky={stickyHeader}
                  style={{
                    width: col.width,
                    minWidth: col.minWidth,
                    maxWidth: col.maxWidth,
                  }}
                  className={cn(
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right',
                    col.sortable && 'cursor-pointer select-none group hover:text-content-main',
                    col.headerClassName
                  )}
                  onClick={() => col.sortable && handleSortToggle(col.key)}
                  onKeyDown={(e) => {
                    if (col.sortable && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      handleSortToggle(col.key);
                    }
                  }}
                  tabIndex={col.sortable ? 0 : undefined}
                  role={col.sortable ? 'columnheader' : undefined}
                  aria-sort={
                    col.sortable
                      ? direction === 'asc'
                        ? 'ascending'
                        : direction === 'desc'
                        ? 'descending'
                        : 'none'
                      : undefined
                  }
                >
                  <div
                    className={cn(
                      'inline-flex items-center gap-1.5',
                      col.align === 'center' && 'justify-center',
                      col.align === 'right' && 'justify-end'
                    )}
                  >
                    <span>
                      {typeof col.header === 'function'
                        ? col.header({ column: col, sortDirection: direction })
                        : col.header}
                    </span>

                    {col.sortable && (
                      <span className="shrink-0 text-content-muted">
                        {direction === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-primary" />
                        ) : direction === 'desc' ? (
                          <ArrowDown className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                        )}
                      </span>
                    )}
                  </div>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading ? (
            Array.from({ length: loadingRowCount }).map((_, rIdx) => (
              <TableRow key={`skeleton-row-${rIdx}`}>
                {selectable && (
                  <TableCell className="w-10 px-3">
                    <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  </TableCell>
                )}
                {columns.map((_, cIdx) => (
                  <TableCell key={`skeleton-cell-${cIdx}`}>
                    <div className="h-4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse w-3/4" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : processedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + (selectable ? 1 : 0)} className="h-48 text-center p-8">
                {emptyState || (
                  <div className="flex flex-col items-center justify-center text-content-muted py-6">
                    <p className="text-sm">Không có dữ liệu hiển thị</p>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ) : (
            processedData.map((row, index) => {
              const rowId = getRowId(row, index);
              const isSelected = selectedKeys.includes(rowId);

              const rowClassResult =
                typeof rowClassName === 'function' ? rowClassName(row, index) : rowClassName;

              return (
                <TableRow
                  key={String(rowId)}
                  isSelected={isSelected}
                  onClick={() => onRowClick?.(row, index)}
                  className={cn(
                    striped && index % 2 === 1 && 'bg-surface-subtle/30',
                    onRowClick && 'cursor-pointer',
                    rowClassResult
                  )}
                >
                  {selectable && (
                    <TableCell
                      className="w-10 px-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectRow(rowId)}
                        aria-label={`Chọn dòng ${index + 1}`}
                        className="rounded border-border-base text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                      />
                    </TableCell>
                  )}

                  {columns.map((col) => {
                    let cellValue: any;
                    if (col.accessorFn) {
                      cellValue = col.accessorFn(row, index);
                    } else if (col.accessorKey) {
                      cellValue = (row as any)[col.accessorKey];
                    } else {
                      cellValue = (row as any)[col.key];
                    }

                    return (
                      <TableCell
                        key={col.key}
                        className={cn(
                          compact ? 'py-2 px-3 text-xs' : 'p-4 text-sm',
                          col.align === 'center' && 'text-center',
                          col.align === 'right' && 'text-right',
                          col.className
                        )}
                      >
                        {col.cell
                          ? col.cell({ row, value: cellValue, index })
                          : cellValue !== undefined && cellValue !== null
                          ? String(cellValue)
                          : '-'}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

DataTable.displayName = 'DataTable';
