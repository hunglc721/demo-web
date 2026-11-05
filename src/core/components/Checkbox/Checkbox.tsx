import React, { forwardRef, useId } from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> {
  checked?: boolean;
  defaultChecked?: boolean;
  indeterminate?: boolean;
  onChange?: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      id: customId,
      checked,
      defaultChecked,
      indeterminate = false,
      onChange,
      label,
      description,
      error,
      disabled = false,
      size = 'md',
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const checkboxId = customId || generatedId;

    const sizeStyles = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    }[size];

    const iconSizes = {
      sm: 'w-3 h-3',
      md: 'w-3.5 h-3.5',
      lg: 'w-4 h-4',
    }[size];

    const isChecked = indeterminate || checked;

    return (
      <div className={cn('flex items-start gap-2.5 select-none', className)}>
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            disabled={disabled}
            checked={checked}
            defaultChecked={defaultChecked}
            aria-checked={indeterminate ? 'mixed' : checked}
            onChange={(e) => onChange?.(e.target.checked)}
            className="peer sr-only"
            {...props}
          />

          <label
            htmlFor={checkboxId}
            className={cn(
              'flex items-center justify-center rounded border transition-all duration-150 cursor-pointer',
              sizeStyles,
              isChecked
                ? 'bg-primary border-primary text-content-inverse'
                : 'bg-surface-card border-border-base hover:border-border-focus',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30 peer-focus-visible:ring-offset-1',
              disabled && 'bg-surface-subtle border-border-subtle cursor-not-allowed opacity-60'
            )}
          >
            {indeterminate ? (
              <Minus className={cn('stroke-[3]', iconSizes)} />
            ) : checked ? (
              <Check className={cn('stroke-[3]', iconSizes)} />
            ) : null}
          </label>
        </div>

        {(label || description) && (
          <div className="flex flex-col text-sm">
            {label && (
              <label
                htmlFor={checkboxId}
                className={cn(
                  'font-medium text-content-main cursor-pointer',
                  disabled && 'cursor-not-allowed opacity-60'
                )}
              >
                {label}
              </label>
            )}
            {description && <p className="text-xs text-content-muted mt-0.5">{description}</p>}
            {error && <span className="text-xs text-status-danger mt-1">{error}</span>}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
