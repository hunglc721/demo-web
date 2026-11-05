import React from 'react';
import { cn } from '@/utils/cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rounded',
  width,
  height,
  animate = true,
  style,
  ...props
}) => {
  const variantClasses = {
    text: 'h-4 w-full rounded-sm',
    circular: 'rounded-full aspect-square',
    rectangular: 'rounded-none',
    rounded: 'rounded-theme',
  }[variant];

  return (
    <div
      aria-hidden="true"
      className={cn(
        'bg-slate-200 dark:bg-slate-700/60',
        animate && 'animate-pulse',
        variantClasses,
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        ...style,
      }}
      {...props}
    />
  );
};
Skeleton.displayName = 'Skeleton';

export interface SkeletonTextProps {
  lines?: number;
  lineHeight?: string;
  gap?: string;
  lastLineWidth?: string;
  className?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  lineHeight = 'h-4',
  gap = 'gap-2.5',
  lastLineWidth = '65%',
  className,
}) => {
  return (
    <div className={cn('flex flex-col w-full', gap, className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(lineHeight, i === lines - 1 && 'max-w-[65%]')}
          style={i === lines - 1 && lastLineWidth ? { width: lastLineWidth } : undefined}
        />
      ))}
    </div>
  );
};
SkeletonText.displayName = 'SkeletonText';

export interface SkeletonAvatarProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
}

export const SkeletonAvatar: React.FC<SkeletonAvatarProps> = ({ size = 'md', className }) => {
  const sizeMap: Record<string, string> = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const isNamedSize = typeof size === 'string' && sizeMap[size];

  return (
    <Skeleton
      variant="circular"
      className={cn(isNamedSize ? sizeMap[size] : undefined, className)}
      style={typeof size === 'number' ? { width: size, height: size } : undefined}
    />
  );
};
SkeletonAvatar.displayName = 'SkeletonAvatar';

export interface SkeletonCardProps {
  hasImage?: boolean;
  imageHeight?: string;
  lines?: number;
  hasFooter?: boolean;
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  hasImage = true,
  imageHeight = 'h-48',
  lines = 2,
  hasFooter = true,
  className,
}) => {
  return (
    <div
      className={cn(
        'rounded-theme border border-border-base bg-surface-card overflow-hidden shadow-sm p-4 flex flex-col gap-3',
        className
      )}
      aria-hidden="true"
    >
      {hasImage && <Skeleton className={cn('w-full rounded-theme', imageHeight)} />}
      <Skeleton className="h-5 w-3/4" />
      <SkeletonText lines={lines} />
      {hasFooter && (
        <div className="flex items-center justify-between pt-2 border-t border-border-base mt-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-8 w-24 rounded-theme" />
        </div>
      )}
    </div>
  );
};
SkeletonCard.displayName = 'SkeletonCard';

export interface SkeletonTableProps {
  rows?: number;
  cols?: number;
  className?: string;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  cols = 4,
  className,
}) => {
  return (
    <div
      className={cn('w-full border border-border-base rounded-theme overflow-hidden', className)}
      aria-hidden="true"
    >
      <div className="flex items-center gap-4 p-4 bg-surface-subtle border-b border-border-base">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`head-${i}`} className="h-4 flex-1" />
        ))}
      </div>
      <div className="flex flex-col divide-y divide-border-base">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={`row-${r}`} className="flex items-center gap-4 p-4">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={`cell-${r}-${c}`} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
SkeletonTable.displayName = 'SkeletonTable';
