import React, { useState, useRef, useId, useMemo } from 'react';
import { ChevronDown, Check, Search, SearchX, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useClickOutside } from '@/hooks/useClickOutside';
import { SelectOption, SelectSize } from './types';

export interface MultiSelectProps {
  options: SelectOption[];
  value?: string[];
  defaultValue?: string[];
  onChange?: (values: string[]) => void;
  placeholder?: string;
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  maxDisplayTags?: number;
  size?: SelectSize;
  className?: string;
  wrapperClassName?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value: controlledValue,
  defaultValue = [],
  onChange,
  placeholder = 'Chọn các mục...',
  label,
  helperText,
  error,
  disabled = false,
  required = false,
  searchable = true,
  clearable = true,
  maxDisplayTags = 3,
  size = 'md',
  className,
  wrapperClassName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<string[]>(defaultValue);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectId = useId();
  const listboxId = `${selectId}-listbox`;

  const activeValues = controlledValue !== undefined ? controlledValue : internalValue;

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

  const handleToggleOption = (val: string) => {
    const nextValues = activeValues.includes(val)
      ? activeValues.filter((v) => v !== val)
      : [...activeValues, val];

    if (controlledValue === undefined) setInternalValue(nextValues);
    onChange?.(nextValues);
  };

  const handleRemoveTag = (e: React.MouseEvent, val: string) => {
    e.stopPropagation();
    const nextValues = activeValues.filter((v) => v !== val);
    if (controlledValue === undefined) setInternalValue(nextValues);
    onChange?.(nextValues);
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (controlledValue === undefined) setInternalValue([]);
    onChange?.([]);
  };

  const handleToggle = () => {
    if (disabled) return;
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState && searchable) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  };

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
          handleToggleOption(option.value);
        }
      }
    }
  };

  const minHeightClasses: Record<SelectSize, string> = {
    sm: 'min-h-8 text-xs py-1 px-2.5',
    md: 'min-h-10 text-sm py-1.5 px-3',
    lg: 'min-h-12 text-base py-2 px-3.5',
  };

  const visibleValues = activeValues.slice(0, maxDisplayTags);
  const hiddenCount = activeValues.length - maxDisplayTags;

  return (
    <div ref={containerRef} className={cn('w-full flex flex-col gap-1.5 relative', wrapperClassName)}>
      {label && (
        <label id={`${selectId}-label`} className="text-sm font-medium text-content-main flex items-center gap-1 select-none">
          {label}
          {required && <span className="text-status-danger">*</span>}
        </label>
      )}

      {/* Trigger Box */}
      <div
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        tabIndex={disabled ? -1 : 0}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={cn(
          'w-full rounded-theme border bg-surface-card flex items-center justify-between text-left transition-all duration-150 cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-primary/20',
          error
            ? 'border-status-danger ring-1 ring-status-danger/30'
            : 'border-border-base focus:border-border-focus',
          disabled && 'bg-surface-subtle opacity-70 cursor-not-allowed pointer-events-none',
          minHeightClasses[size],
          className
        )}
      >
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0 pr-2">
          {activeValues.length === 0 ? (
            <span className="text-content-subtle truncate">{placeholder}</span>
          ) : (
            <>
              {visibleValues.map((val) => {
                const opt = options.find((o) => o.value === val);
                const tagLabel = opt ? opt.label : val;

                return (
                  <span
                    key={val}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-subtle text-primary text-xs font-medium border border-primary/20"
                  >
                    <span className="truncate max-w-[120px]">{tagLabel}</span>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveTag(e, val)}
                      className="hover:opacity-75 focus:outline-none p-0.5"
                      aria-label={`Xóa ${tagLabel}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}

              {hiddenCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-subtle text-content-muted text-xs font-medium">
                  +{hiddenCount} khác
                </span>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-content-muted">
          {clearable && activeValues.length > 0 && !disabled && (
            <button
              type="button"
              onClick={handleClearAll}
              className="p-0.5 hover:text-content-main rounded-full"
              aria-label="Xóa tất cả"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={cn('w-4 h-4 transition-transform duration-200', isOpen && 'rotate-180')}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          aria-multiselectable="true"
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
              const isSelected = activeValues.includes(opt.value);
              const isHighlighted = idx === highlightedIndex;

              return (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={opt.disabled}
                  onClick={() => !opt.disabled && handleToggleOption(opt.value)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={cn(
                    'px-3.5 py-2 text-sm flex items-center justify-between cursor-pointer select-none transition-colors',
                    isHighlighted && 'bg-surface-subtle text-content-main',
                    isSelected && 'font-medium text-primary bg-primary-subtle/40',
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
