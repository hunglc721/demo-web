import React, { InputHTMLAttributes, forwardRef, useId, useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputVariant = 'default' | 'filled';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: string;
  variant?: InputVariant;
  inputSize?: InputSize;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  prefixAddon?: React.ReactNode;
  suffixAddon?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  required?: boolean;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      wrapperClassName,
      id: customId,
      label,
      helperText,
      error,
      type = 'text',
      variant = 'default',
      inputSize = 'md',
      prefixIcon,
      suffixIcon,
      prefixAddon,
      suffixAddon,
      clearable = false,
      onClear,
      required,
      disabled,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = customId || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const isPasswordType = type === 'password';
    const [showPassword, setShowPassword] = useState(false);
    const resolvedType = isPasswordType ? (showPassword ? 'text' : 'password') : type;

    const sizeStyles: Record<InputSize, { container: string; input: string }> = {
      sm: { container: 'h-8 text-xs', input: 'py-1 text-xs' },
      md: { container: 'h-10 text-sm', input: 'py-2 text-sm' },
      lg: { container: 'h-12 text-base', input: 'py-2.5 text-base' },
    };

    const hasValue = value !== undefined && value !== null && String(value).length > 0;

    return (
      <div className={cn('w-full flex flex-col gap-1.5', wrapperClassName)}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-content-main flex items-center gap-1 select-none">
            {label}
            {required && <span className="text-status-danger" aria-hidden="true">*</span>}
          </label>
        )}

        <div
          className={cn(
            'group relative flex items-center w-full rounded-theme border transition-all duration-150',
            variant === 'filled' ? 'bg-surface-subtle' : 'bg-surface-card',
            error
              ? 'border-status-danger ring-1 ring-status-danger/30'
              : 'border-border-base focus-within:border-border-focus focus-within:ring-2 focus-within:ring-primary/20',
            disabled && 'bg-surface-subtle opacity-70 cursor-not-allowed',
            sizeStyles[inputSize].container,
            className
          )}
        >
          {prefixAddon && (
            <div className="flex items-center px-3 border-r border-border-base bg-surface-subtle text-content-muted select-none">
              {prefixAddon}
            </div>
          )}

          {prefixIcon && (
            <span className="pl-3 flex items-center text-content-muted pointer-events-none shrink-0" aria-hidden="true">
              {prefixIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            type={resolvedType}
            disabled={disabled}
            value={value}
            onChange={onChange}
            required={required}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={cn(
              'w-full bg-transparent px-3 text-content-main placeholder:text-content-subtle focus:outline-none disabled:cursor-not-allowed',
              sizeStyles[inputSize].input,
              prefixIcon && 'pl-2',
              (suffixIcon || isPasswordType || clearable) && 'pr-2'
            )}
            {...props}
          />

          {clearable && hasValue && !disabled && (
            <button
              type="button"
              onClick={onClear}
              tabIndex={-1}
              aria-label="Xóa nội dung"
              className="pr-2 text-content-subtle hover:text-content-main focus:outline-none transition-colors"
            >
              <span className="w-4 h-4 rounded-full bg-surface-subtle flex items-center justify-center text-xs">✕</span>
            </button>
          )}

          {isPasswordType && (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              tabIndex={-1}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              className="pr-3 text-content-muted hover:text-content-main focus:outline-none transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}

          {!isPasswordType && suffixIcon && (
            <span className="pr-3 flex items-center text-content-muted pointer-events-none shrink-0" aria-hidden="true">
              {suffixIcon}
            </span>
          )}

          {suffixAddon && (
            <div className="flex items-center px-3 border-l border-border-base bg-surface-subtle text-content-muted select-none">
              {suffixAddon}
            </div>
          )}
        </div>

        {error ? (
          <div id={errorId} role="alert" className="flex items-center gap-1.5 text-xs text-status-danger animate-in fade-in duration-150">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : helperText ? (
          <p id={helperId} className="text-xs text-content-muted">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
