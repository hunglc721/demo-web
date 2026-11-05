import React, { forwardRef } from 'react';
import { cn } from '@/utils/cn';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  containerClassName?: string;
  maxHeight?: string | number;
}

export const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ className, containerClassName, maxHeight, ...props }, ref) => (
    <div
      className={cn('relative w-full overflow-x-auto', containerClassName)}
      style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}
    >
      <table
        ref={ref}
        className={cn('w-full caption-bottom text-sm border-collapse text-left', className)}
        {...props}
      />
    </div>
  )
);
Table.displayName = 'Table';

export const TableHeader = forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('[&_tr]:border-b border-border-base bg-surface-subtle/60', className)} {...props} />
));
TableHeader.displayName = 'TableHeader';

export const TableBody = forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('[&_tr:last-child]:border-0 divide-y divide-border-base', className)}
    {...props}
  />
));
TableBody.displayName = 'TableBody';

export const TableFooter = forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn('border-t border-border-base bg-surface-subtle/50 font-medium text-content-muted', className)}
    {...props}
  />
));
TableFooter.displayName = 'TableFooter';

export const TableRow = forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & { isSelected?: boolean }
>(({ className, isSelected, ...props }, ref) => (
  <tr
    ref={ref}
    data-state={isSelected ? 'selected' : undefined}
    aria-selected={isSelected}
    className={cn(
      'border-b border-border-base transition-colors hover:bg-surface-subtle/50',
      'data-[state=selected]:bg-primary-subtle/25',
      className
    )}
    {...props}
  />
));
TableRow.displayName = 'TableRow';

export const TableHead = forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement> & { isSticky?: boolean }
>(({ className, isSticky, ...props }, ref) => (
  <th
    ref={ref}
    scope="col"
    className={cn(
      'h-11 px-4 text-left align-middle font-semibold text-content-muted text-xs uppercase tracking-wider select-none',
      isSticky && 'sticky top-0 z-20 bg-surface-card shadow-sm border-b border-border-base',
      '[&:has([role=checkbox])]:pr-0',
      className
    )}
    {...props}
  />
));
TableHead.displayName = 'TableHead';

export const TableCell = forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn('p-4 align-middle text-content-main [&:has([role=checkbox])]:pr-0', className)}
    {...props}
  />
));
TableCell.displayName = 'TableCell';

export const TableCaption = forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn('mt-4 text-xs text-content-muted text-center', className)}
    {...props}
  />
));
TableCaption.displayName = 'TableCaption';
