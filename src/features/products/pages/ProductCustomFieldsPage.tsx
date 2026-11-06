import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
} from 'lucide-react';
import { STORAGE_KEYS } from '@/services/storage/storageKeys';
import { toast } from '@/stores/toastStore';
import { cn } from '@/utils/cn';

export type ProductFieldDataType = 'text' | 'number' | 'select' | 'boolean';

export interface ProductCustomField {
  id: string;
  displayName: string;
  fieldName: string; // snake_case
  dataType: ProductFieldDataType;
  isRequired: boolean;
  options?: string[];
  placeholder?: string;
  updatedAt: string;
}

const FIELD_TYPE_LABELS: Record<ProductFieldDataType, { label: string; badge: string }> = {
  text: { label: 'Văn bản (Text)', badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  number: { label: 'Số (Number)', badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  select: { label: 'Lựa chọn (Select)', badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
  boolean: { label: 'Hộp chọn (Boolean)', badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' },
};

const SEED_PRODUCT_FIELDS: ProductCustomField[] = [
  {
    id: 'pfield_01',
    displayName: 'Chất liệu vải / Da',
    fieldName: 'fabric_material',
    dataType: 'select',
    isRequired: true,
    options: ['100% Cotton Compact', 'Vải Linen tự nhiên', 'Da bò sáp thật', 'Vải Kaki Spandex', 'Lụa Satin cao cấp'],
    placeholder: 'Chọn chất liệu chính',
    updatedAt: '2026-02-15T09:00:00.000Z',
  },
  {
    id: 'pfield_02',
    displayName: 'Xuất xứ sản xuất',
    fieldName: 'origin_country',
    dataType: 'select',
    isRequired: false,
    options: ['Việt Nam', 'Hàn Quốc', 'Nhật Bản', 'Thái Lan', 'Ý (Italy)'],
    placeholder: 'Chọn quốc gia sản xuất',
    updatedAt: '2026-03-01T14:30:00.000Z',
  },
  {
    id: 'pfield_03',
    displayName: 'Thời gian bảo hành (tháng)',
    fieldName: 'warranty_period_months',
    dataType: 'number',
    isRequired: false,
    placeholder: 'VD: 12',
    updatedAt: '2026-03-12T10:15:00.000Z',
  },
  {
    id: 'pfield_04',
    displayName: 'Hướng dẫn giặt là & Bảo quản',
    fieldName: 'care_instructions',
    dataType: 'text',
    isRequired: false,
    placeholder: 'Giặt máy chế độ nhẹ, không sấy nhiệt độ cao...',
    updatedAt: '2026-03-25T16:00:00.000Z',
  },
];

export const ProductCustomFieldsPage: React.FC = () => {
  const [fields, setFields] = useState<ProductCustomField[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<ProductCustomField | null>(null);

  // Form State
  const [displayName, setDisplayName] = useState('');
  const [fieldName, setFieldName] = useState('');
  const [dataType, setDataType] = useState<ProductFieldDataType>('text');
  const [isRequired, setIsRequired] = useState(false);
  const [optionsStr, setOptionsStr] = useState('');
  const [placeholder, setPlaceholder] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PRODUCT_CUSTOM_FIELDS);
      if (raw) {
        setFields(JSON.parse(raw));
      } else {
        localStorage.setItem(STORAGE_KEYS.PRODUCT_CUSTOM_FIELDS, JSON.stringify(SEED_PRODUCT_FIELDS));
        setFields(SEED_PRODUCT_FIELDS);
      }
    } catch {
      setFields(SEED_PRODUCT_FIELDS);
    }
  }, []);

  const saveFields = (updated: ProductCustomField[]) => {
    setFields(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCT_CUSTOM_FIELDS, JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredFields = fields.filter((f) => {
    const q = searchQuery.toLowerCase();
    return f.displayName.toLowerCase().includes(q) || f.fieldName.toLowerCase().includes(q);
  });

  const handleOpenCreate = () => {
    setEditingField(null);
    setDisplayName('');
    setFieldName('');
    setDataType('text');
    setIsRequired(false);
    setOptionsStr('');
    setPlaceholder('');
    setModalOpen(true);
  };

  const handleOpenEdit = (f: ProductCustomField) => {
    setEditingField(f);
    setDisplayName(f.displayName);
    setFieldName(f.fieldName);
    setDataType(f.dataType);
    setIsRequired(f.isRequired);
    setOptionsStr((f.options || []).join(', '));
    setPlaceholder(f.placeholder || '');
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !fieldName.trim()) {
      toast.warning('Vui lòng nhập Tên hiển thị và Mã trường.');
      return;
    }

    const cleanFieldName = fieldName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_');

    const options =
      dataType === 'select'
        ? optionsStr
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

    if (editingField) {
      const updated = fields.map((f) =>
        f.id === editingField.id
          ? {
              ...f,
              displayName: displayName.trim(),
              fieldName: cleanFieldName,
              dataType,
              isRequired,
              options,
              placeholder: placeholder.trim(),
              updatedAt: new Date().toISOString(),
            }
          : f
      );
      saveFields(updated);
      toast.success(`Đã cập nhật thuộc tính "${displayName}"!`);
    } else {
      const newField: ProductCustomField = {
        id: `pfield_${Date.now()}`,
        displayName: displayName.trim(),
        fieldName: cleanFieldName,
        dataType,
        isRequired,
        options,
        placeholder: placeholder.trim(),
        updatedAt: new Date().toISOString(),
      };
      saveFields([...fields, newField]);
      toast.success(`Đã tạo mới thuộc tính "${displayName}"!`);
    }

    setModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc muốn xóa trường "${name}"?`)) {
      const remaining = fields.filter((f) => f.id !== id);
      saveFields(remaining);
      toast.success(`Đã xóa trường "${name}"!`);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredFields.map((f) => f.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-base pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-content-main tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-primary" />
            <span>Trường tuỳ chỉnh sản phẩm</span>
          </h1>
          <p className="text-xs sm:text-sm text-content-muted mt-1">
            Định nghĩa các thông số kỹ thuật và thuộc tính mở rộng cho sản phẩm.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-theme bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Tạo trường mới</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-content-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên hiển thị hoặc mã thuộc tính..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-subtle border border-border-base rounded-theme pl-9 pr-3 py-2 text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      {/* Table */}
      {filteredFields.length === 0 ? (
        <div className="p-12 text-center rounded-theme bg-surface-card border border-border-base">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-content-main">Chưa có trường tuỳ chỉnh nào</h3>
          <p className="text-xs text-content-muted mt-1 max-w-md mx-auto">
            Tạo trường thông số đầu tiên (ví dụ: Chất liệu, Xuất xứ, Bảo hành...) cho sản phẩm.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-theme border border-border-base bg-surface-card shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-subtle/80 border-b border-border-base text-content-muted font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredFields.length > 0 &&
                      selectedIds.length === filteredFields.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-border-base text-primary focus:ring-primary cursor-pointer"
                  />
                </th>
                <th className="p-3">TÊN THUỘC TÍNH</th>
                <th className="p-3">MÃ TRƯỜNG</th>
                <th className="p-3">LOẠI DỮ LIỆU</th>
                <th className="p-3">BẮT BUỘC</th>
                <th className="p-3">NGÀY CẬP NHẬT</th>
                <th className="p-3 text-right">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base">
              {filteredFields.map((field) => {
                const typeConf = FIELD_TYPE_LABELS[field.dataType];
                const isSelected = selectedIds.includes(field.id);
                return (
                  <tr
                    key={field.id}
                    className={cn(
                      'hover:bg-surface-subtle/50 transition-colors',
                      isSelected && 'bg-primary/5'
                    )}
                  >
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(field.id)}
                        className="rounded border-border-base text-primary focus:ring-primary cursor-pointer"
                      />
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-content-main">{field.displayName}</div>
                      {field.placeholder && (
                        <div className="text-[10px] text-content-muted italic">
                          Gợi ý: "{field.placeholder}"
                        </div>
                      )}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-primary font-bold">
                      {field.fieldName}
                    </td>
                    <td className="p-3">
                      <span
                        className={cn(
                          'inline-block px-2 py-0.5 rounded text-[10px] font-bold border',
                          typeConf.badge
                        )}
                      >
                        {typeConf.label}
                      </span>
                    </td>
                    <td className="p-3">
                      {field.isRequired ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 dark:text-red-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Có</span>
                        </span>
                      ) : (
                        <span className="text-content-muted text-[11px]">Không</span>
                      )}
                    </td>
                    <td className="p-3 text-content-muted text-[11px]">
                      {new Date(field.updatedAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="p-3 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEdit(field)}
                        className="p-1.5 rounded hover:bg-surface-subtle text-content-muted hover:text-content-main transition-colors"
                        title="Sửa trường"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(field.id, field.displayName)}
                        className="p-1.5 rounded hover:bg-surface-subtle text-content-muted hover:text-rose-600 transition-colors"
                        title="Xóa trường"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <form
            onSubmit={handleSubmit}
            className="bg-surface-card border border-border-base rounded-theme shadow-2xl max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border-base pb-3">
              <h3 className="font-bold text-base text-content-main flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                <span>{editingField ? 'Chỉnh sửa trường thông số' : 'Tạo trường thông số mới'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded text-content-muted hover:text-content-main hover:bg-surface-subtle"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-content-main mb-1">
                  Tên hiển thị <span className="text-status-danger">*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: Chất liệu vải, Xuất xứ..."
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    if (!editingField) {
                      setFieldName(
                        e.target.value
                          .toLowerCase()
                          .normalize('NFD')
                          .replace(/[\u0300-\u036f]/g, '')
                          .replace(/[^a-z0-9]/g, '_')
                          .replace(/_+/g, '_')
                      );
                    }
                  }}
                  required
                  className="w-full bg-surface-subtle border border-border-base rounded-theme px-3 py-2 text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="block font-semibold text-content-main mb-1">
                  Mã trường (snake_case) <span className="text-status-danger">*</span>
                </label>
                <input
                  type="text"
                  placeholder="fabric_material"
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  required
                  className="w-full bg-surface-subtle border border-border-base rounded-theme px-3 py-2 text-content-main font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="block font-semibold text-content-main mb-1">
                  Loại dữ liệu
                </label>
                <select
                  value={dataType}
                  onChange={(e) => setDataType(e.target.value as ProductFieldDataType)}
                  className="w-full bg-surface-subtle border border-border-base rounded-theme px-3 py-2 text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                >
                  <option value="text">Văn bản (Text)</option>
                  <option value="number">Số (Number)</option>
                  <option value="select">Lựa chọn (Select)</option>
                  <option value="boolean">Hộp chọn (Checkbox / Boolean)</option>
                </select>
              </div>

              {dataType === 'select' && (
                <div>
                  <label className="block font-semibold text-content-main mb-1">
                    Các lựa chọn (cách nhau bởi dấu phẩy)
                  </label>
                  <input
                    type="text"
                    placeholder="Cotton, Linen, Da thật, Kaki..."
                    value={optionsStr}
                    onChange={(e) => setOptionsStr(e.target.value)}
                    className="w-full bg-surface-subtle border border-border-base rounded-theme px-3 py-2 text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-content-main mb-1">
                  Gợi ý placeholder (không bắt buộc)
                </label>
                <input
                  type="text"
                  placeholder="VD: Chọn chất liệu chính của sản phẩm..."
                  value={placeholder}
                  onChange={(e) => setPlaceholder(e.target.value)}
                  className="w-full bg-surface-subtle border border-border-base rounded-theme px-3 py-2 text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="pt-1 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isRequiredProductField"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                  className="rounded border-border-base text-primary focus:ring-primary cursor-pointer"
                />
                <label htmlFor="isRequiredProductField" className="font-semibold text-content-main cursor-pointer">
                  Bắt buộc nhập khi đăng sản phẩm
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-base">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-3 py-1.5 rounded-theme border border-border-base text-xs font-semibold text-content-main hover:bg-surface-subtle"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-theme bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-sm"
              >
                {editingField ? 'Lưu thay đổi' : 'Tạo trường'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProductCustomFieldsPage;

