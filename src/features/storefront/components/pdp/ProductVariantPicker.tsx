import React from 'react';
import { Check } from 'lucide-react';
import { ProductOption, ProductVariant } from '@/types/product';
import { cn } from '@/utils/cn';

export interface ProductVariantPickerProps {
  options: ProductOption[];
  variants: ProductVariant[];
  selectedOptions: Record<string, string>;
  onChangeOption: (optionName: string, value: string) => void;
}

const colorHexMap: Record<string, string> = {
  Đen: '#18181B',
  Trắng: '#FFFFFF',
  Xám: '#71717A',
  'Xám Đậm': '#3F3F46',
  'Xám Nhạt': '#D4D4D8',
  'Xanh Navy': '#1E3A8A',
  'Xanh Coban': '#1D4ED8',
  'Xanh Dương': '#3B82F6',
  'Xanh Rêu': '#3F6212',
  'Xanh Lá': '#16A34A',
  Be: '#F5F5DC',
  Kem: '#FFFDD0',
  Nâu: '#78350F',
  'Nâu Bò': '#B45309',
  Đỏ: '#DC2626',
  Hồng: '#EC4899',
  Vàng: '#EAB308',
  Cam: '#F97316',
  Tím: '#9333EA',
};

const getColorHex = (value: string): string => {
  if (colorHexMap[value]) return colorHexMap[value];

  const normalized = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (normalized.includes('trang') || normalized.includes('white')) return '#F8FAFC';
  if (normalized.includes('bac') || normalized.includes('silver')) return '#CBD5E1';
  if (normalized.includes('den') || normalized.includes('black')) return '#18181B';
  if (normalized.includes('reu') || normalized.includes('olive') || normalized.includes('la')) return '#3F6212';
  if (normalized.includes('xanh') || normalized.includes('blue') || normalized.includes('navy')) return '#2563EB';
  if (normalized.includes('xam') || normalized.includes('gray') || normalized.includes('grey')) return '#71717A';
  if (normalized.includes('beige') || normalized.includes('be')) return '#F5F5DC';
  if (normalized.includes('kem') || normalized.includes('cream')) return '#FFFDD0';
  if (normalized.includes('nau') || normalized.includes('brown')) return '#78350F';
  if (normalized.includes('do') || normalized.includes('red')) return '#DC2626';
  if (normalized.includes('hong') || normalized.includes('pink')) return '#EC4899';
  if (normalized.includes('vang') || normalized.includes('yellow')) return '#EAB308';
  if (normalized.includes('cam') || normalized.includes('orange')) return '#F97316';
  if (normalized.includes('tim') || normalized.includes('purple')) return '#9333EA';
  return '#9CA3AF';
};

export const ProductVariantPicker: React.FC<ProductVariantPickerProps> = ({
  options,
  variants,
  selectedOptions,
  onChangeOption,
}) => {
  if (!options || options.length === 0) return null;

  // Check if option value candidate is out of stock in combination
  const isOutOfStockCombination = (optionName: string, val: string): boolean => {
    if (!variants || variants.length === 0) return false;
    const candidate = { ...selectedOptions, [optionName]: val };
    const matched = variants.find((v) =>
      Object.entries(candidate).every(([k, cVal]) => v.options[k] === cVal)
    );
    return Boolean(matched && matched.stock <= 0);
  };

  return (
    <div className="space-y-5">
      {options.map((option) => {
        const isColor = option.name.toLowerCase().includes('màu');
        const selectedValue = selectedOptions[option.name];

        return (
          <div key={option.name} className="space-y-2.5">
            {/* Option Label & Selected Value */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-content-main uppercase tracking-wider">
                {option.name}:{' '}
                <span className="font-semibold text-primary normal-case">
                  {selectedValue || 'Chưa chọn'}
                </span>
              </span>
            </div>

            {/* Values / Swatches */}
            <div className="flex flex-wrap items-center gap-2">
              {option.values.map((val) => {
                const isSelected = selectedValue === val;
                const isOOS = isOutOfStockCombination(option.name, val);
                const hex = isColor ? getColorHex(val) : null;

                if (isColor) {
                  const isWhite = val.toLowerCase().includes('trắng');
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => onChangeOption(option.name, val)}
                      title={`${val}${isOOS ? ' (Hết hàng)' : ''}`}
                      aria-label={`Chọn màu ${val}${isOOS ? ', hết hàng' : ''}`}
                      aria-pressed={isSelected}
                      className={cn(
                        'relative w-8 h-8 rounded-full transition-all duration-150 flex items-center justify-center shadow-sm',
                        isSelected
                          ? 'ring-2 ring-primary ring-offset-2 scale-110'
                          : 'hover:scale-105 border border-border-base',
                        isOOS && 'opacity-40 cursor-not-allowed'
                      )}
                      style={{ backgroundColor: hex || undefined }}
                    >
                      {/* Check icon if selected */}
                      {isSelected && (
                        <Check
                          className={cn(
                            'w-4 h-4',
                            isWhite ? 'text-slate-900' : 'text-white drop-shadow'
                          )}
                        />
                      )}
                      {/* Diagonal line if out of stock */}
                      {isOOS && !isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-full h-0.5 bg-rose-500 rotate-45" />
                        </div>
                      )}
                    </button>
                  );
                }

                // Text / Size pill button
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => onChangeOption(option.name, val)}
                    className={cn(
                      'relative min-w-10 px-3.5 py-2 rounded-theme text-xs font-semibold transition-all border text-center',
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : isOOS
                        ? 'bg-surface-subtle text-content-muted/60 border-border-base line-through hover:border-border-base'
                        : 'bg-surface-card text-content-main border-border-base hover:border-primary/60 hover:bg-surface-subtle'
                    )}
                  >
                    <span>{val}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
export default ProductVariantPicker;
