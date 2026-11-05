import React, { useState, useRef, useId, useMemo } from 'react';
import { ChevronDown, Check, Search, SearchX, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useClickOutside } from '@/hooks/useClickOutside';
import { SelectOption, SelectSize } from './types';

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  size?: SelectSize;
  className?: string;
  wrapperClassName?: string;
}

export const Select: React.FC<SelectProps> = ({
  options,
  value: controlledValue,
  defaultValue = '',
  onChange,
  placeholder = 'Chọn một mục...',
  label,
  helperText,
  error,
  disabled = false,
  required = false,
  searchable = false,
  clearable = false,
  size = 'md',
  className,
  wrapperClassName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectId = useId();
  const listboxId = `${selectId}-listbox`;

  const activeValue = controlledValue !== undefined ? controlledValue : internalValue;
  const selectedOption = options.find((opt) => opt.value === activeValue);

  // Vietnamese accent-insensitive query filtering (NFD normalization)
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const normQuery = searchQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return options.filter((opt) => {
      const normLabel = opt.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return normLabel.includes(normQuery);
    });
  }, [options, searchQuery]);

  useClickOutside(containerRef, () => {
    if (isOpen) {
      setIsOpen(false);
      setSearchQuery('');
    }
  });

  const handleSelect = (val: string) => {
    if (controlledValue === undefined) setInternalValue(val);
    onChange?.(val);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleSelect('');
  };

  const handleToggle = () => {
    if (disabled) return;
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState && searchable) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
      e.preventDefault();
      setIsOpen(true);
      if (searchable) setTimeout(() => searchInputRef.current?.focus(), 50);
      return;
    }

    if (isOpen) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % Math.max(1, filteredOptions.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + filteredOptions.length) % Math.max(1, filteredOptions.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const option = filteredOptions[highlightedIndex];
        if (option && !option.disabled) {
          handleSelect(option.value);
        }
      }
    }
  };

  const sizeClasses: Record<SelectSize, string> = {
    sm: 'h-8 text-xs px-2.5',
    md: 'h-10 text-sm px-3.5',
    lg: 'h-12 text-base px-4',
  };

  return (
    <div ref={containerRef} className={cn('w-full flex flex-col gap-1.5 relative', wrapperClassName)}>
      {label && (
        <label id={`${selectId}-label`} className="text-sm font-medium text-content-main flex items-center gap-1 select-none">
          {label}
          {required && <span className="text-status-danger">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-labelledby={label ? `${selectId}-label` : undefined}
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={cn(
          'w-full rounded-theme border bg-surface-card flex items-center justify-between text-left transition-all duration-150 cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-primary/20',
          error
            ? 'border-status-danger ring-1 ring-status-danger/30'
            : 'border-border-base focus:border-border-focus',
          disabled && 'bg-surface-subtle opacity-70 cursor-not-allowed',
          sizeClasses[size],
          className
        )}
      >
        <span className={cn('truncate', !selectedOption && 'text-content-subtle')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <div className="flex items-center gap-1.5 shrink-0 ml-2 text-content-muted">
          {clearable && activeValue && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="p-0.5 hover:text-content-main rounded-full"
              aria-label="Xóa lựa chọn"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={cn('w-4 h-4 transition-transform duration-200', isOpen && 'rotate-180')}
            aria-hidden="true"
          />
        </div>
      </button>

      {/* Floating Popover Dropdown */}
      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          className="absolute z-50 left-0 right-0 top-full mt-1.5 rounded-theme border border-border-base bg-surface-card shadow-lg py-1 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
        >
          {searchable && (
            <div className="p-2 border-b border-border-base sticky top-0 bg-surface-card z-10">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 absolute left-2.5 text-content-muted pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-theme border border-border-base bg-surface-subtle text-content-main placeholder:text-content-subtle focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {filteredOptions.length === 0 ? (
            <div className="p-4 text-center text-xs text-content-muted flex flex-col items-center gap-1.5">
              <SearchX className="w-5 h-5 text-content-subtle" />
              <span>Không tìm thấy kết quả phù hợp</span>
            </div>
          ) : (
            filteredOptions.map((opt, idx) => {
              const isSelected = opt.value === activeValue;
              const isHighlighted = idx === highlightedIndex;

              return (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={opt.disabled}
                  onClick={() => !opt.disabled && handleSelect(opt.value)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={cn(
                    'px-3.5 py-2 text-sm flex items-center justify-between cursor-pointer select-none transition-colors',
                    isHighlighted && 'bg-surface-subtle text-content-main',
                    isSelected && 'font-medium text-primary bg-primary-subtle/50',
                    opt.disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
                  )}
                >
                  <div className="flex flex-col">
                    <span className="flex items-center gap-2">
                      {opt.icon && <span>{opt.icon}</span>}
                      <span>{opt.label}</span>
                      {opt.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-subtle text-content-muted">
                          {opt.badge}
                        </span>
                      )}
                    </span>
                    {opt.description && <span className="text-xs text-content-muted">{opt.description}</span>}
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-primary shrink-0 ml-2" />}
                </div>
              );
            })
          )}
        </div>
      )}

      {error ? (
        <span className="text-xs text-status-danger">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-content-muted">{helperText}</span>
      ) : null}
    </div>
  );
};
