import React, { useState } from 'react';
import { Plus, Trash2, RefreshCw, Tag, X } from 'lucide-react';
import { ProductOption, ProductVariant } from '@/types/product';
import { Badge } from '@/core/components/Badge';

export interface VariantMatrixBuilderProps {
  options: ProductOption[];
  onOptionsChange: (options: ProductOption[]) => void;
  variants: ProductVariant[];
  onVariantsChange: (variants: ProductVariant[]) => void;
  basePrice: number;
  baseStock: number;
  baseSku: string;
}

export const VariantMatrixBuilder: React.FC<VariantMatrixBuilderProps> = ({
  options,
  onOptionsChange,
  variants,
  onVariantsChange,
  basePrice,
  baseStock,
  baseSku,
}) => {
  const [newOptionName, setNewOptionName] = useState('');
  const [newValueInputs, setNewValueInputs] = useState<Record<number, string>>({});
  const [bulkPrice, setBulkPrice] = useState<number | ''>('');
  const [bulkStock, setBulkStock] = useState<number | ''>('');

  // Helper to slugify option values for SKU suffix
  const slugifyValue = (val: string) => {
    return val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 4)
      .toUpperCase();
  };

  // Generate Cartesian combinations
  const generateCartesianVariants = (opts: ProductOption[]): ProductVariant[] => {
    const validOpts = opts.filter((o) => o.name.trim() && o.values.length > 0);
    if (validOpts.length === 0) return [];

    // Helper to cartesian product
    const cartesian = (arrays: string[][]): string[][] => {
      return arrays.reduce<string[][]>(
        (acc, curr) => acc.flatMap((c) => curr.map((n) => [...c, n])),
        [[]]
      );
    };

    const valueArrays = validOpts.map((o) => o.values);
    const combos = cartesian(valueArrays);

    const prefixSku = (baseSku || 'SKU').trim().toUpperCase();

    // Map existing variants by their option key to preserve existing prices and stocks
    const existingMap = new Map<string, ProductVariant>();
    for (const v of variants) {
      const key = Object.entries(v.options)
        .sort(([k1], [k2]) => k1.localeCompare(k2))
        .map(([k, val]) => `${k}:${val}`)
        .join('|');
      existingMap.set(key, v);
    }

    return combos.map((combo) => {
      const optMap: Record<string, string> = {};
      validOpts.forEach((o, idx) => {
        optMap[o.name] = combo[idx];
      });

      const key = Object.entries(optMap)
        .sort(([k1], [k2]) => k1.localeCompare(k2))
        .map(([k, val]) => `${k}:${val}`)
        .join('|');

      const existing = existingMap.get(key);
      const skuSuffix = combo.map(slugifyValue).join('-');
      const generatedSku = `${prefixSku}-${skuSuffix}`;

      if (existing) {
        return {
          ...existing,
          title: combo.join(' / '),
          options: optMap,
          sku: existing.sku || generatedSku,
        };
      }

      return {
        id: `var_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        sku: generatedSku,
        title: combo.join(' / '),
        price: basePrice > 0 ? basePrice : 100000,
        stock: baseStock >= 0 ? baseStock : 10,
        options: optMap,
      };
    });
  };

  // Add a standard or custom option group
  const handleAddOptionGroup = (nameToAdd: string) => {
    const trimmed = nameToAdd.trim();
    if (!trimmed) return;
    if (options.some((o) => o.name.toLowerCase() === trimmed.toLowerCase())) return;

    const newOpts = [...options, { name: trimmed, values: [] }];
    onOptionsChange(newOpts);
    setNewOptionName('');
  };

  // Remove an option group
  const handleRemoveOptionGroup = (idx: number) => {
    const newOpts = options.filter((_, i) => i !== idx);
    onOptionsChange(newOpts);
    onVariantsChange(generateCartesianVariants(newOpts));
  };

  // Add a value tag into an option group
  const handleAddValue = (optIdx: number) => {
    const val = (newValueInputs[optIdx] || '').trim();
    if (!val) return;

    const currentOpt = options[optIdx];
    if (currentOpt.values.includes(val)) return;

    const updatedOpts = options.map((opt, i) => {
      if (i === optIdx) {
        return { ...opt, values: [...opt.values, val] };
      }
      return opt;
    });

    onOptionsChange(updatedOpts);
    setNewValueInputs((prev) => ({ ...prev, [optIdx]: '' }));
    onVariantsChange(generateCartesianVariants(updatedOpts));
  };

  // Remove a value tag from an option group
  const handleRemoveValue = (optIdx: number, valIdx: number) => {
    const updatedOpts = options.map((opt, i) => {
      if (i === optIdx) {
        return { ...opt, values: opt.values.filter((_, vi) => vi !== valIdx) };
      }
      return opt;
    });

    onOptionsChange(updatedOpts);
    onVariantsChange(generateCartesianVariants(updatedOpts));
  };

  // Regenerate matrix manually
  const handleRegenerateMatrix = () => {
    onVariantsChange(generateCartesianVariants(options));
  };

  // Bulk Apply Price
  const handleBulkApplyPrice = () => {
    if (typeof bulkPrice !== 'number' || bulkPrice < 0) return;
    const updated = variants.map((v) => ({ ...v, price: bulkPrice }));
    onVariantsChange(updated);
  };

  // Bulk Apply Stock
  const handleBulkApplyStock = () => {
    if (typeof bulkStock !== 'number' || bulkStock < 0) return;
    const updated = variants.map((v) => ({ ...v, stock: bulkStock }));
    onVariantsChange(updated);
  };

  // Update a single variant field
  const handleUpdateVariant = (
    vIdx: number,
    field: 'sku' | 'price' | 'stock',
    value: string | number
  ) => {
    const updated = variants.map((v, idx) => {
      if (idx === vIdx) {
        return { ...v, [field]: value };
      }
      return v;
    });
    onVariantsChange(updated);
  };

  // Delete a single variant row
  const handleDeleteVariant = (vIdx: number) => {
    const updated = variants.filter((_, idx) => idx !== vIdx);
    onVariantsChange(updated);
  };

  const totalVariantStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);

  return (
    <div className="space-y-6">
      {/* Option Groups Config */}
      <div className="p-5 rounded-theme bg-surface-subtle border border-border-base space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-content-main flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-primary" />
              <span>Thuộc Tính Biến Thể (Kích cỡ, Màu sắc, Chất liệu...)</span>
            </h4>
            <p className="text-[11px] text-content-muted mt-0.5">
              Thêm các nhóm thuộc tính và giá trị tương ứng để tự động sinh ma trận biến thể sản phẩm.
            </p>
          </div>
          {/* Quick preset buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {['Kích cỡ', 'Màu sắc', 'Chất liệu'].map((presetName) => (
              <button
                key={presetName}
                type="button"
                onClick={() => handleAddOptionGroup(presetName)}
                disabled={options.some((o) => o.name === presetName)}
                className="px-2.5 py-1 rounded text-xs font-semibold bg-surface-card border border-border-base hover:border-primary text-content-main disabled:opacity-40 transition-colors"
              >
                + {presetName}
              </button>
            ))}
          </div>
        </div>

        {/* Existing Option Groups */}
        <div className="space-y-3">
          {options.map((opt, optIdx) => (
            <div
              key={optIdx}
              className="p-3 rounded-theme bg-surface-card border border-border-base space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-content-main">{opt.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveOptionGroup(optIdx)}
                  className="p-1 rounded text-content-muted hover:text-status-danger transition-colors"
                  title="Xóa nhóm thuộc tính"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tag chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                {opt.values.map((val, valIdx) => (
                  <span
                    key={valIdx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                  >
                    <span>{val}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveValue(optIdx, valIdx)}
                      className="hover:text-status-danger"
                      title="Xóa giá trị"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {/* Add value tag input */}
                <div className="inline-flex items-center gap-1">
                  <input
                    type="text"
                    placeholder={`Thêm ${opt.name.toLowerCase()}...`}
                    value={newValueInputs[optIdx] || ''}
                    onChange={(e) =>
                      setNewValueInputs({ ...newValueInputs, [optIdx]: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddValue(optIdx);
                      }
                    }}
                    className="w-32 bg-surface-subtle border border-border-base rounded px-2 py-1 text-xs text-content-main focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddValue(optIdx)}
                    className="p-1 rounded bg-primary text-white hover:bg-primary-hover text-xs font-medium"
                    title="Thêm"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add Custom Option Group Row */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              placeholder="Tên thuộc tính mới (VD: Dung lượng, Trọng lượng...)"
              value={newOptionName}
              onChange={(e) => setNewOptionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddOptionGroup(newOptionName);
                }
              }}
              className="flex-1 bg-surface-card border border-border-base rounded-theme px-3 py-1.5 text-xs text-content-main focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => handleAddOptionGroup(newOptionName)}
              disabled={!newOptionName.trim()}
              className="px-3 py-1.5 rounded-theme bg-surface-card border border-border-base hover:bg-surface-subtle text-xs font-semibold text-content-main disabled:opacity-40 transition-colors"
            >
              + Thêm nhóm thuộc tính
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Edit Toolbar & Summary */}
      {variants.length > 0 && (
        <div className="p-4 rounded-theme bg-surface-card border border-border-base flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="primary" appearance="subtle">
              {variants.length} biến thể
            </Badge>
            <Badge variant="neutral" appearance="subtle">
              Tổng tồn kho: {totalVariantStock} sp
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Bulk Price */}
            <div className="flex items-center gap-1">
              <input
                type="number"
                placeholder="Giá chung"
                value={bulkPrice}
                onChange={(e) =>
                  setBulkPrice(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="w-24 bg-surface-subtle border border-border-base rounded px-2 py-1 text-xs text-content-main"
              />
              <button
                type="button"
                onClick={handleBulkApplyPrice}
                className="px-2.5 py-1 rounded bg-surface-subtle hover:bg-border-base border border-border-base text-xs font-semibold text-content-main transition-colors"
              >
                Gán giá
              </button>
            </div>

            {/* Bulk Stock */}
            <div className="flex items-center gap-1">
              <input
                type="number"
                placeholder="Tồn kho"
                value={bulkStock}
                onChange={(e) =>
                  setBulkStock(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="w-20 bg-surface-subtle border border-border-base rounded px-2 py-1 text-xs text-content-main"
              />
              <button
                type="button"
                onClick={handleBulkApplyStock}
                className="px-2.5 py-1 rounded bg-surface-subtle hover:bg-border-base border border-border-base text-xs font-semibold text-content-main transition-colors"
              >
                Gán kho
              </button>
            </div>

            {/* Regenerate Button */}
            <button
              type="button"
              onClick={handleRegenerateMatrix}
              className="inline-flex items-center gap-1 px-3 py-1 rounded bg-surface-subtle hover:bg-border-base border border-border-base text-xs font-semibold text-content-muted hover:text-content-main transition-colors"
              title="Tạo lại mã SKU và phân loại"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Sinh lại</span>
            </button>
          </div>
        </div>
      )}

      {/* Per-Variant Editable Table */}
      {variants.length > 0 ? (
        <div className="overflow-x-auto rounded-theme border border-border-base bg-surface-card">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border-base bg-surface-subtle text-content-muted font-bold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Phân Loại Biến Thể</th>
                <th className="py-2.5 px-3">Mã SKU</th>
                <th className="py-2.5 px-3">Giá Bán (₫)</th>
                <th className="py-2.5 px-3">Tồn Kho</th>
                <th className="py-2.5 px-3 text-right">Xóa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base">
              {variants.map((v, vIdx) => (
                <tr key={v.id || vIdx} className="hover:bg-surface-subtle/50 transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="flex flex-wrap items-center gap-1">
                      {Object.entries(v.options).map(([k, val]) => (
                        <span
                          key={k}
                          className="px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-subtle border border-border-base text-content-main"
                        >
                          <span className="text-content-muted">{k}:</span> {val}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={v.sku}
                      onChange={(e) => handleUpdateVariant(vIdx, 'sku', e.target.value)}
                      className="w-36 bg-surface-subtle border border-border-base rounded px-2 py-1 text-xs text-content-main font-mono"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      value={v.price}
                      min={0}
                      onChange={(e) =>
                        handleUpdateVariant(vIdx, 'price', Number(e.target.value) || 0)
                      }
                      className="w-28 bg-surface-subtle border border-border-base rounded px-2 py-1 text-xs text-content-main font-semibold"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      value={v.stock}
                      min={0}
                      onChange={(e) =>
                        handleUpdateVariant(vIdx, 'stock', Number(e.target.value) || 0)
                      }
                      className="w-20 bg-surface-subtle border border-border-base rounded px-2 py-1 text-xs text-content-main"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteVariant(vIdx)}
                      className="p-1 rounded text-content-muted hover:text-status-danger transition-colors"
                      title="Xóa biến thể này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center text-xs text-content-muted rounded-theme border border-dashed border-border-base bg-surface-subtle">
          Sản phẩm chưa có biến thể phân loại. Hãy thêm giá trị cho Kích cỡ hoặc Màu sắc ở trên để tạo biến thể.
        </div>
      )}
    </div>
  );
};

export default VariantMatrixBuilder;
