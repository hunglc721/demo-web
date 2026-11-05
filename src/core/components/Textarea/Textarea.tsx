import React, { TextareaHTMLAttributes, forwardRef, useId, useRef, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: string;
  autoResize?: boolean;
  showCount?: boolean;
  maxLength?: number;
  required?: boolean;
  wrapperClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      wrapperClassName,
      id: customId,
      label,
      helperText,
      error,
      autoResize = false,
      showCount = false,
      maxLength,
      required,
      disabled,
      rows = 4,
      value,
      defaultValue,
      onChange,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const textareaId = customId || generatedId;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;

    const internalRef = useRef<HTMLTextAreaElement | null>(null);

    // Synchronize forwarded ref and internal ref for auto-resize
    const handleRef = (node: HTMLTextAreaElement | null) => {
      internalRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
    };

    const adjustHeight = () => {
      if (autoResize && internalRef.current) {
        internalRef.current.style.height = 'auto';
        internalRef.current.style.height = `${internalRef.current.scrollHeight}px`;
      }
    };

    useEffect(() => {
      adjustHeight();
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      adjustHeight();
      onChange?.(e);
    };

    const currentLength = typeof value === 'string' ? value.length : typeof defaultValue === 'string' ? defaultValue.length : 0;
    const isAtLimit = maxLength !== undefined && currentLength >= maxLength;

    return (
      <div className={cn('w-full flex flex-col gap-1.5', wrapperClassName)}>
        <div className="flex items-center justify-between">
          {label && (
            <label htmlFor={textareaId} className="text-sm font-medium text-content-main flex items-center gap-1 select-none">
              {label}
              {required && <span className="text-status-danger" aria-hidden="true">*</span>}
            </label>
          )}

          {showCount && maxLength !== undefined && (
            <span
              className={cn(
                'text-xs tabular-nums',
                isAtLimit ? 'text-status-danger font-semibold' : 'text-content-muted'
              )}
            >
              {currentLength} / {maxLength}
            </span>
          )}
        </div>

        <div className="relative w-full">
          <textarea
            ref={handleRef}
            id={textareaId}
            rows={rows}
            disabled={disabled}
            maxLength={maxLength}
            value={value}
            defaultValue={defaultValue}
            onChange={handleChange}
            required={required}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={cn(
              'w-full rounded-theme border bg-surface-card p-3 text-sm text-content-main placeholder:text-content-subtle',
              'transition-all duration-150 focus:outline-none resize-y',
              error
                ? 'border-status-danger ring-1 ring-status-danger/30'
                : 'border-border-base focus:border-border-focus focus:ring-2 focus:ring-primary/20',
              disabled && 'bg-surface-subtle opacity-70 cursor-not-allowed resize-none',
              autoResize && 'resize-none overflow-hidden',
              className
            )}
            {...props}
          />
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

Textarea.displayName = 'Textarea';
