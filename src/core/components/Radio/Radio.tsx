import React, { useContext, useId } from 'react';
import { cn } from '@/utils/cn';
import { RadioContext } from './RadioGroup';

export interface RadioProps {
  value: string;
  label?: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const Radio: React.FC<RadioProps> = ({
  value,
  label,
  description,
  disabled: itemDisabled = false,
  className,
  id: customId,
}) => {
  const ctx = useContext(RadioContext);
  if (!ctx) throw new Error('Radio must be used within a RadioGroup');

  const generatedId = useId();
  const inputId = customId || generatedId;

  const isChecked = ctx.value === value;
  const isDisabled = ctx.disabled || itemDisabled;

  return (
    <label
      htmlFor={inputId}
      className={cn(
        'flex items-start gap-2.5 cursor-pointer select-none',
        isDisabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <input
        id={inputId}
        type="radio"
        name={ctx.name}
        value={value}
        checked={isChecked}
        disabled={isDisabled}
        onChange={() => ctx.onChange?.(value)}
        className="sr-only peer"
      />
      <div
        className={cn(
          'w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-150 mt-0.5',
          isChecked
            ? 'border-primary bg-primary'
            : 'border-border-base bg-surface-card hover:border-border-focus',
          'peer-focus-visible:ring-2 peer-focus-visible:ring-primary/30'
        )}
      >
        {isChecked && <div className="w-2 h-2 rounded-full bg-white" />}
      </div>
      {(label || description) && (
        <div className="flex flex-col text-sm">
          {label && <span className="font-medium text-content-main">{label}</span>}
          {description && <span className="text-xs text-content-muted mt-0.5">{description}</span>}
        </div>
      )}
    </label>
  );
};

Radio.displayName = 'Radio';
