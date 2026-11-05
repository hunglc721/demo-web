import React from 'react';

export const ProductCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`rounded-theme bg-surface-card border border-border-base overflow-hidden flex flex-col animate-pulse ${className}`}
    >
      {/* Image Skeleton */}
      <div className="aspect-[4/5] bg-surface-subtle w-full" />

      {/* Content Skeleton */}
      <div className="p-4 flex flex-col flex-1 space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-3 w-16 bg-surface-subtle rounded" />
          <div className="h-3 w-12 bg-surface-subtle rounded" />
        </div>
        <div className="space-y-1.5 flex-1">
          <div className="h-4 w-full bg-surface-subtle rounded" />
          <div className="h-4 w-3/4 bg-surface-subtle rounded" />
        </div>
        <div className="flex items-baseline justify-between pt-2">
          <div className="h-5 w-24 bg-surface-subtle rounded" />
          <div className="h-4 w-16 bg-surface-subtle rounded" />
        </div>
        <div className="h-9 w-full bg-surface-subtle rounded-theme pt-1" />
      </div>
    </div>
  );
};
