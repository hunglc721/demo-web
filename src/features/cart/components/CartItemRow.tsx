import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import type { CartItem } from '@/stores/cartStore';
import { formatCurrencyVND } from '@/utils/formatters';

export interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  compact?: boolean;
}

export const CartItemRow: React.FC<CartItemRowProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
  compact = false,
}) => {
  const isAtMaxStock = item.stock !== undefined && item.quantity >= item.stock;
  const hasDiscount = item.originalPrice && item.originalPrice > item.price;

  return (
    <div
      className={`flex gap-3 py-3.5 transition-colors ${
        compact ? 'items-start' : 'items-center sm:gap-4'
      }`}
    >
      {/* Product Image */}
      <img
        src={item.image || '/placeholder.png'}
        alt={item.title}
        className={`rounded-theme object-cover bg-surface-subtle border border-border-base/50 flex-shrink-0 ${
          compact ? 'h-18 w-16' : 'h-24 w-20 sm:h-28 sm:w-24'
        }`}
      />

      {/* Item Details */}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="line-clamp-2 text-xs font-semibold text-content-main sm:text-sm">
              {item.title}
            </h3>
            {item.variantName && (
              <span className="inline-block mt-0.5 rounded bg-surface-subtle px-1.5 py-0.5 text-[11px] font-medium text-content-muted">
                {item.variantName}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            aria-label={`Xóa ${item.title}`}
            title="Xóa khỏi giỏ hàng"
            className="p-1 text-content-muted hover:text-status-danger transition-colors flex-shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Pricing */}
        <div className="flex items-baseline gap-2 pt-0.5">
          <span className="text-xs font-bold text-content-main sm:text-sm">
            {formatCurrencyVND(item.price)}
          </span>
          {hasDiscount && (
            <span className="text-[11px] text-content-muted line-through">
              {formatCurrencyVND(item.originalPrice!)}
            </span>
          )}
        </div>

        {/* Quantity Controls & Line Total */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center">
            <div className="flex items-center rounded-theme border border-border-base bg-surface-card shadow-2xs">
              <button
                type="button"
                aria-label="Giảm số lượng"
                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                className="p-1.5 text-content-muted hover:text-content-main hover:bg-surface-subtle transition-colors"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="min-w-7 text-center font-semibold text-xs text-content-main select-none">
                {item.quantity}
              </span>
              <button
                type="button"
                aria-label="Tăng số lượng"
                disabled={isAtMaxStock}
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                className="p-1.5 text-content-muted hover:text-content-main hover:bg-surface-subtle disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>

            {isAtMaxStock && (
              <span className="ml-2 text-[10px] text-amber-600 font-medium hidden sm:inline">
                (Tối đa: {item.stock})
              </span>
            )}
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-primary sm:text-sm">
              {formatCurrencyVND(item.price * item.quantity)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
