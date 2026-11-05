import React from 'react';
import { cn } from '@/utils/cn';

export type CardVariant = 'default' | 'bordered' | 'elevated' | 'ghost' | 'interactive';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'none', children, ...props }, ref) => {
    const variantStyles: Record<CardVariant, string> = {
      default: 'bg-surface-card border border-border-base rounded-theme shadow-sm',
      bordered: 'bg-surface-card border-2 border-border-base rounded-theme',
      elevated: 'bg-surface-card border border-border-base rounded-theme shadow-md',
      ghost: 'bg-transparent border-none shadow-none',
      interactive:
        'bg-surface-card border border-border-base rounded-theme shadow-sm hover:shadow-md hover:border-primary/40 cursor-pointer transition-all duration-200 active:scale-[0.99]',
    };

    const paddingStyles = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    }[padding];

    return (
      <div ref={ref} className={cn('overflow-hidden', variantStyles[variant], paddingStyles, className)} {...props}>
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  bordered?: boolean;
}
export const CardHeader: React.FC<CardHeaderProps> = ({ className, bordered = false, children, ...props }) => (
  <div className={cn('p-6 flex items-center justify-between gap-4', bordered && 'border-b border-border-base', className)} {...props}>
    {children}
  </div>
);
CardHeader.displayName = 'CardHeader';

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div';
}
export const CardTitle: React.FC<CardTitleProps> = ({ as: Component = 'h3', className, children, ...props }) => (
  <Component className={cn('text-lg font-semibold text-content-main tracking-tight leading-snug', className)} {...props}>
    {children}
  </Component>
);
CardTitle.displayName = 'CardTitle';

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, children, ...props }) => (
  <p className={cn('text-sm text-content-muted mt-1', className)} {...props}>
    {children}
  </p>
);
CardDescription.displayName = 'CardDescription';

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('p-6 pt-0', className)} {...props}>
    {children}
  </div>
);
CardContent.displayName = 'CardContent';

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  bordered?: boolean;
}
export const CardFooter: React.FC<CardFooterProps> = ({ className, bordered = false, children, ...props }) => (
  <div
    className={cn(
      'p-6 pt-0 flex items-center justify-between gap-3',
      bordered && 'border-t border-border-base bg-surface-subtle/30 px-6 py-3.5',
      className
    )}
    {...props}
  >
    {children}
  </div>
);
CardFooter.displayName = 'CardFooter';
