import React, { useId } from 'react';
import { cn } from '@/utils/cn';

export interface SwitchProps {
  id?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: React.ReactNode;
  description?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  id: customId,
  checked: controlledChecked,
  defaultChecked = false,
  onChange,
  disabled = false,
  label,
  description,
  size = 'md',
  className,
}) => {
  const generatedId = useId();
  const switchId = customId || generatedId;

  const [internalChecked, setInternalChecked] = React.useState(defaultChecked);
  const isChecked = controlledChecked !== undefined ? controlledChecked : internalChecked;

  const handleToggle = () => {
    if (disabled) return;
    const next = !isChecked;
    if (controlledChecked === undefined) setInternalChecked(next);
    onChange?.(next);
  };

  const trackSizes = {
    sm: 'w-8 h-4',
    md: 'w-11 h-6',
    lg: 'w-14 h-7',
  }[size];

  return (
    <div className={cn('flex items-start gap-3 select-none', className)}>
      <button
        type="button"
        id={switchId}
        role="switch"
        aria-checked={isChecked}
        disabled={disabled}
        onClick={handleToggle}
        className={cn(
          'relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          trackSizes,
          isChecked ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700',
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out',
            size === 'sm' && (isChecked ? 'translate-x-4' : 'translate-x-0.5'),
            size === 'md' && (isChecked ? 'translate-x-5' : 'translate-x-0.5'),
            size === 'lg' && (isChecked ? 'translate-x-7' : 'translate-x-0.5'),
            size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'
          )}
        />
      </button>

      {(label || description) && (
        <div className="flex flex-col text-sm cursor-pointer" onClick={handleToggle}>
          {label && <span className={cn('font-medium text-content-main', disabled && 'opacity-60')}>{label}</span>}
          {description && <span className="text-xs text-content-muted mt-0.5">{description}</span>}
        </div>
      )}
    </div>
  );
};

Switch.displayName = 'Switch';
