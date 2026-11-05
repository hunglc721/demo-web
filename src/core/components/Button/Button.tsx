import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon-sm' | 'icon-md' | 'icon-lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-content-inverse hover:bg-primary-hover shadow-sm active:translate-y-px focus-visible:ring-primary',
  secondary:
    'bg-surface-subtle text-content-main hover:bg-border-base border border-border-base active:translate-y-px focus-visible:ring-border-focus',
  outline:
    'border border-border-base bg-transparent text-content-main hover:bg-surface-subtle active:translate-y-px focus-visible:ring-primary',
  ghost:
    'bg-transparent text-content-muted hover:text-content-main hover:bg-surface-subtle focus-visible:ring-border-focus',
  danger:
    'bg-status-danger text-white hover:bg-red-600 shadow-sm active:translate-y-px focus-visible:ring-status-danger',
  link:
    'bg-transparent text-primary hover:underline underline-offset-4 p-0 h-auto shadow-none focus-visible:ring-primary',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 py-1.5 text-xs font-medium gap-1.5',
  md: 'h-10 px-4 py-2 text-sm font-medium gap-2',
  lg: 'h-12 px-5 py-2.5 text-base font-semibold gap-2.5',
  'icon-sm': 'h-8 w-8 p-0 flex items-center justify-center',
  'icon-md': 'h-10 w-10 p-0 flex items-center justify-center',
  'icon-lg': 'h-12 w-12 p-0 flex items-center justify-center',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      disabled,
      fullWidth = false,
      type = 'button',
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading}
        aria-disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center rounded-theme transition-all duration-150 select-none cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:active:translate-y-0',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
        ) : (
          leftIcon && <span className="inline-flex shrink-0 items-center">{leftIcon}</span>
        )}

        {isLoading && loadingText ? (
          <span>{loadingText}</span>
        ) : (
          children && <span>{children}</span>
        )}

        {!isLoading && rightIcon && (
          <span className="inline-flex shrink-0 items-center">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
