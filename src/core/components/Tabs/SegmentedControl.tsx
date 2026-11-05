import React from 'react';
import { cn } from '@/utils/cn';
import { SegmentedControlProps } from './types';

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  value,
  onChange,
  size = 'md',
  fullWidth = false,
  className,
}) => {
  const sizeClasses = {
    sm: 'p-0.5 text-xs',
    md: 'p-1 text-sm',
    lg: 'p-1.5 text-base',
  }[size];

  const buttonSizeClasses = {
    sm: 'px-2.5 py-1',
    md: 'px-3.5 py-1.5',
    lg: 'px-4 py-2',
  }[size];

  return (
    <div
      role="radiogroup"
      className={cn(
        'inline-flex bg-surface-subtle border border-border-base rounded-theme select-none',
        sizeClasses,
        fullWidth && 'w-full flex',
        className
      )}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-theme font-medium transition-all flex items-center justify-center gap-2 outline-none cursor-pointer',
              buttonSizeClasses,
              fullWidth && 'flex-1',
              isSelected
                ? 'bg-surface-card text-content-main shadow-xs font-semibold'
                : 'text-content-muted hover:text-content-main',
              option.disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
            )}
          >
            {option.icon && <span className="w-4 h-4">{option.icon}</span>}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};

SegmentedControl.displayName = 'SegmentedControl';
