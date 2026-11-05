import React from 'react';
import { PackageOpen, SearchX, ShoppingBag, Receipt, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

export type EmptyStatePreset = 'no-data' | 'no-search' | 'empty-cart' | 'no-orders' | 'error';

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
}

export interface EmptyStateProps {
  preset?: EmptyStatePreset;
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: EmptyStateAction | React.ReactNode;
  secondaryAction?: EmptyStateAction | React.ReactNode;
  compact?: boolean;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  preset = 'no-data',
  icon,
  title,
  description,
  action,
  secondaryAction,
  compact = false,
  className,
}) => {
  const defaultIcons: Record<EmptyStatePreset, React.ReactNode> = {
    'no-data': <PackageOpen className="w-8 h-8" />,
    'no-search': <SearchX className="w-8 h-8" />,
    'empty-cart': <ShoppingBag className="w-8 h-8" />,
    'no-orders': <Receipt className="w-8 h-8" />,
    error: <AlertCircle className="w-8 h-8" />,
  };

  const presetColorClasses: Record<EmptyStatePreset, string> = {
    'no-data': 'bg-primary-subtle text-primary ring-primary/20',
    'no-search': 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20',
    'empty-cart': 'bg-primary-subtle text-primary ring-primary/20',
    'no-orders': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/20',
    error: 'bg-status-danger/10 text-status-danger ring-status-danger/20',
  };

  const renderedIcon = icon || defaultIcons[preset];

  const renderActionNode = (act: EmptyStateAction | React.ReactNode, defaultVariant: 'primary' | 'secondary') => {
    if (!act) return null;

    if (React.isValidElement(act)) return act;

    const actionObj = act as EmptyStateAction;
    const variant = actionObj.variant || defaultVariant;

    const btnClasses = {
      primary: 'bg-primary text-content-inverse hover:bg-primary-hover shadow-sm',
      secondary: 'bg-surface-subtle text-content-main hover:bg-border-base border border-border-base',
      outline: 'border border-border-base bg-transparent text-content-main hover:bg-surface-subtle',
    }[variant];

    return (
      <button
        type="button"
        onClick={actionObj.onClick}
        className={cn(
          'inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-theme gap-2 transition-colors cursor-pointer',
          btnClasses,
          actionObj.className
        )}
      >
        {actionObj.icon}
        <span>{actionObj.label}</span>
      </button>
    );
  };

  return (
    <div
      role="status"
      className={cn(
        'flex flex-col items-center justify-center text-center w-full animate-in fade-in duration-200',
        compact ? 'py-8 px-4' : 'py-12 sm:py-16 px-6',
        className
      )}
    >
      <div
        className={cn(
          'rounded-full flex items-center justify-center ring-8 mb-4 transition-transform duration-200 hover:scale-105',
          compact ? 'w-12 h-12 [&>svg]:w-6 [&>svg]:h-6' : 'w-16 h-16',
          presetColorClasses[preset]
        )}
      >
        {renderedIcon}
      </div>

      <h3 className={cn('font-semibold text-content-main', compact ? 'text-sm' : 'text-base sm:text-lg')}>
        {title}
      </h3>

      {description && (
        <p className={cn('text-content-muted max-w-sm mt-1.5', compact ? 'text-xs' : 'text-sm')}>
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className={cn('flex flex-wrap items-center justify-center gap-3 mt-6', compact && 'mt-4')}>
          {renderActionNode(action, 'primary')}
          {renderActionNode(secondaryAction, 'secondary')}
        </div>
      )}
    </div>
  );
};

EmptyState.displayName = 'EmptyState';
