import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface QuantityStepperProps {
  quantity: number;
  maxStock: number;
  onChange: (quantity: number) => void;
  disabled?: boolean;
  className?: string;
}

export const QuantityStepper: React.FC<QuantityStepperProps> = ({
  quantity,
  maxStock,
  onChange,
  disabled = false,
  className = '',
}) => {
  const isOutOfStock = maxStock <= 0;
  const isLowStock = !isOutOfStock && maxStock <= 5;

  const handleDecrement = () => {
    if (quantity > 1 && !disabled && !isOutOfStock) {
      onChange(quantity - 1);
    }
  };

  const handleIncrement = () => {
    if (quantity < maxStock && !disabled && !isOutOfStock) {
      onChange(quantity + 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val)) return;
    const clamped = Math.max(1, Math.min(val, maxStock));
    onChange(clamped);
  };

  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center gap-3', className)}>
      <div className="flex items-center border border-border-base rounded-theme overflow-hidden bg-surface-card w-32 shadow-sm">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || quantity <= 1 || isOutOfStock}
          className="p-2.5 text-content-muted hover:text-content-main hover:bg-surface-subtle disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Giảm số lượng"
        >
          <Minus className="w-4 h-4" />
        </button>

        <input
          type="number"
          min={1}
          max={maxStock}
          value={isOutOfStock ? 0 : quantity}
          disabled={disabled || isOutOfStock}
          onChange={handleInputChange}
          className="w-full text-center text-sm font-bold bg-transparent text-content-main focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />

        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || quantity >= maxStock || isOutOfStock}
          className="p-2.5 text-content-muted hover:text-content-main hover:bg-surface-subtle disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Tăng số lượng"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Stock Availability Telemetry */}
      <div className="text-xs">
        {isOutOfStock ? (
          <span className="font-bold text-status-danger">Hết hàng</span>
        ) : isLowStock ? (
          <span className="font-semibold text-amber-500 flex items-center gap-1 animate-pulse">
            Chỉ còn {maxStock} sản phẩm trong kho!
          </span>
        ) : (
          <span className="text-content-muted">Còn {maxStock} sản phẩm</span>
        )}
      </div>
    </div>
  );
};
export default QuantityStepper;
