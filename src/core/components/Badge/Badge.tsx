import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export type BadgeSize = 'sm' | 'md' | 'lg';
export type BadgeAppearance = 'subtle' | 'solid' | 'outline';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  appearance?: BadgeAppearance;
  pulse?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRemove?: () => void;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  size = 'md',
  appearance = 'subtle',
  pulse = false,
  leftIcon,
  rightIcon,
  onRemove,
  children,
  ...props
}) => {
  const variantStyles: Record<BadgeVariant, Record<BadgeAppearance, string>> = {
    primary: {
      subtle: 'bg-primary-subtle text-primary border-primary/20',
      solid: 'bg-primary text-content-inverse border-transparent',
      outline: 'bg-transparent text-primary border-primary',
    },
    success: {
      subtle: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      solid: 'bg-status-success text-white border-transparent',
      outline: 'bg-transparent text-status-success border-status-success',
    },
    warning: {
      subtle: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      solid: 'bg-status-warning text-white border-transparent',
      outline: 'bg-transparent text-status-warning border-status-warning',
    },
    danger: {
      subtle: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
      solid: 'bg-status-danger text-white border-transparent',
      outline: 'bg-transparent text-status-danger border-status-danger',
    },
    info: {
      subtle: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
      solid: 'bg-status-info text-white border-transparent',
      outline: 'bg-transparent text-status-info border-status-info',
    },
    neutral: {
      subtle: 'bg-surface-subtle text-content-main border-border-base',
      solid: 'bg-content-muted text-content-inverse border-transparent',
      outline: 'bg-transparent text-content-main border-border-base',
    },
  };

  const sizeStyles: Record<BadgeSize, string> = {
    sm: 'text-[10px] px-1.5 py-0.5 leading-tight gap-1',
    md: 'text-xs px-2.5 py-0.5 gap-1.5',
    lg: 'text-sm px-3 py-1 gap-2',
  };

  const pulseColors: Record<BadgeVariant, string> = {
    primary: 'bg-primary',
    success: 'bg-status-success',
    warning: 'bg-status-warning',
    danger: 'bg-status-danger',
    info: 'bg-status-info',
    neutral: 'bg-content-muted',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border select-none transition-colors duration-150',
        variantStyles[variant][appearance],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {pulse && (
        <span className="relative flex h-2 w-2 mr-0.5">
          <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', pulseColors[variant])} />
          <span className={cn('relative inline-flex rounded-full h-2 w-2', pulseColors[variant])} />
        </span>
      )}

      {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
      <span>{children}</span>
      {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="hover:opacity-75 focus:outline-none rounded-full p-0.5 -mr-1 transition-opacity cursor-pointer"
          aria-label="Xóa"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
};

Badge.displayName = 'Badge';
