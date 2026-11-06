import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
} from 'lucide-react';
import { STORAGE_KEYS } from '@/services/storage/storageKeys';
import { toast } from '@/stores/toastStore';
import { cn } from '@/utils/cn';

export interface OrderTag {
  id: string;
  name: string;
  color: string; // emerald, indigo, rose, amber, purple, sky, slate
  description?: string;
  orderCount: number;
  createdAt: string;
  updatedAt: string;
}

const COLOR_OPTIONS: Array<{ key: string; name: string; bg: string; text: string; dot: string; border: string }> = [
  { key: 'emerald', name: 'Xanh lục', bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500', border: 'border-emerald-500/20' },
  { key: 'indigo', name: 'Chàm Indigo', bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', dot: 'bg-indigo-500', border: 'border-indigo-500/20' },
  { key: 'rose', name: 'Đỏ Rose', bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', dot: 'bg-rose-500', border: 'border-rose-500/20' },
  { key: 'amber', name: 'Vàng Amber', bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500', border: 'border-amber-500/20' },
  { key: 'purple', name: 'Tím Purple', bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', dot: 'bg-purple-500', border: 'border-purple-500/20' },
  { key: 'sky', name: 'Xanh da trời', bg: 'bg-sky-500/10', text: 'text-sky-600 dark:text-sky-400', dot: 'bg-sky-500', border: 'border-sky-500/20' },
  { key: 'slate', name: 'Xám Slate', bg: 'bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400', dot: 'bg-slate-500', border: 'border-slate-500/20' },
];

const SEED_ORDER_TAGS: OrderTag[] = [
  {
    id: 'tag_01',
    name: 'Khách VIP',
    color: 'rose',
    description: 'Khách hàng có tổng chi tiêu trên 5 triệu VNĐ',
    orderCount: 24,
    createdAt: '2026-01-15T08:00:00.000Z',
    updatedAt: '2026-03-01T10:30:00.000Z',
  },
  {
    id: 'tag_02',
    name: 'Giao gấp 2H',
    color: 'amber',
    description: 'Đơn hỏa tốc nội thành cần xuất kho ngay',
    orderCount: 8,
    createdAt: '2026-02-10T09:00:00.000Z',
    updatedAt: '2026-04-02T15:20:00.000Z',
  },
  {
    id: 'tag_03',
    name: 'Đã đối soát COD',
    color: 'emerald',
    description: 'Tiền thu hộ đã được đơn vị vận chuyển quyết toán',
    orderCount: 45,
    createdAt: '2026-01-20T11:00:00.000Z',
    updatedAt: '2026-04-10T18:00:00.000Z',
  },
  {
    id: 'tag_04',
    name: 'Khách gọi trước',
    color: 'sky',
    description: 'Shipper cần gọi điện thoại xác nhận trước khi đến',
    orderCount: 12,
    createdAt: '2026-02-18T14:00:00.000Z',
    updatedAt: '2026-03-25T11:15:00.000Z',
  },
  {
    id: 'tag_05',
    name: 'Đổi trả bảo hành',
    color: 'purple',
    description: 'Đơn hỗ trợ đổi size hoặc bảo hành chất lượng',
    orderCount: 3,
    createdAt: '2026-03-05T16:00:00.000Z',
    updatedAt: '2026-04-01T09:45:00.000Z',
  },
  {
    id: 'tag_06',
    name: 'Đơn sỉ',
    color: 'indigo',
    description: 'Khách mua số lượng lớn theo lô',
    orderCount: 5,
    createdAt: '2026-03-12T10:00:00.000Z',
    updatedAt: '2026-04-05T14:10:00.000Z',
  },
];

export const OrderTagsPage: React.FC = () => {
  const [tags, setTags] = useState<OrderTag[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<OrderTag | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState('emerald');
  const [formDescription, setFormDescription] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ORDER_TAGS);
      if (raw) {
        setTags(JSON.parse(raw));
      } else {
        localStorage.setItem(STORAGE_KEYS.ORDER_TAGS, JSON.stringify(SEED_ORDER_TAGS));
        setTags(SEED_ORDER_TAGS);
      }
    } catch {
      setTags(SEED_ORDER_TAGS);
    }
  }, []);

  const saveTags = (updated: OrderTag[]) => {
    setTags(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.ORDER_TAGS, JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTags = tags.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingTag(null);
    setFormName('');
    setFormColor('emerald');
    setFormDescription('');
    setModalOpen(true);
  };

  const handleOpenEdit = (tag: OrderTag) => {
    setEditingTag(tag);
    setFormName(tag.name);
    setFormColor(tag.color);
    setFormDescription(tag.description || '');
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.warning('Vui lòng nhập tên tag.');
      return;
    }

    if (editingTag) {
      const updated = tags.map((t) =>
        t.id === editingTag.id
          ? {
              ...t,
              name: formName.trim(),
              color: formColor,
              description: formDescription.trim(),
              updatedAt: new Date().toISOString(),
            }
          : t
      );
      saveTags(updated);
      toast.success(`Đã cập nhật tag "${formName}"!`);
    } else {
      const newTag: OrderTag = {
        id: `tag_${Date.now()}`,
        name: formName.trim(),
        color: formColor,
        description: formDescription.trim(),
        orderCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveTags([...tags, newTag]);
      toast.success(`Đã tạo mới tag "${formName}"!`);
    }

    setModalOpen(false);
  };

  const handleDelete = (tagId: string, tagName: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa tag "${tagName}"?`)) {
      const remaining = tags.filter((t) => t.id !== tagId);
      saveTags(remaining);
      toast.success(`Đã xóa tag "${tagName}"!`);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredTags.map((t) => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const getColorConfig = (colorKey: string) => {
    return COLOR_OPTIONS.find((c) => c.key === colorKey) || COLOR_OPTIONS[0];
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-base pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-content-main tracking-tight flex items-center gap-2">
            <Tag className="w-6 h-6 text-primary" />
            <span>Quản lý Tag đơn hàng</span>
          </h1>
          <p className="text-xs sm:text-sm text-content-muted mt-1">
            Gắn thẻ cho đơn hàng để phân loại và quản lý hiệu quả hơn.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-theme bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Tạo Tag mới</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-content-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-subtle border border-border-base rounded-theme pl-9 pr-3 py-2 text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      {/* Table matching screenshot */}
      {filteredTags.length === 0 ? (
        <div className="p-12 text-center rounded-theme bg-surface-card border border-border-base">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
            <Tag className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-content-main">Chưa có tag nào</h3>
          <p className="text-xs text-content-muted mt-1 max-w-md mx-auto">
            Tạo tag đầu tiên để bắt đầu phân loại và gán nhãn cho các đơn hàng.
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
                      filteredTags.length > 0 &&
                      selectedIds.length === filteredTags.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-border-base text-primary focus:ring-primary cursor-pointer"
                  />
                </th>
                <th className="p-3">TÊN TAG</th>
                <th className="p-3">SỐ LƯỢNG ĐƠN</th>
                <th className="p-3">NGÀY TẠO</th>
                <th className="p-3">NGÀY CẬP NHẬT</th>
                <th className="p-3 text-right">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base">
              {filteredTags.map((tag) => {
                const conf = getColorConfig(tag.color);
                const isSelected = selectedIds.includes(tag.id);
                return (
                  <tr
                    key={tag.id}
                    className={cn(
                      'hover:bg-surface-subtle/50 transition-colors',
                      isSelected && 'bg-primary/5'
                    )}
                  >
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(tag.id)}
                        className="rounded border-border-base text-primary focus:ring-primary cursor-pointer"
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border',
                            conf.bg,
                            conf.text,
                            conf.border
                          )}
                        >
                          <span className={cn('w-2 h-2 rounded-full', conf.dot)} />
                          <span>{tag.name}</span>
                        </span>
                      </div>
                      {tag.description && (
                        <p className="text-[11px] text-content-muted mt-0.5">{tag.description}</p>
                      )}
                    </td>
                    <td className="p-3 font-semibold text-content-main">
                      {tag.orderCount} đơn hàng
                    </td>
                    <td className="p-3 text-content-muted text-[11px]">
                      {new Date(tag.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="p-3 text-content-muted text-[11px]">
                      {new Date(tag.updatedAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="p-3 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEdit(tag)}
                        className="p-1.5 rounded hover:bg-surface-subtle text-content-muted hover:text-content-main transition-colors"
                        title="Chỉnh sửa tag"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(tag.id, tag.name)}
                        className="p-1.5 rounded hover:bg-surface-subtle text-content-muted hover:text-rose-600 transition-colors"
                        title="Xóa tag"
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

      {/* Create / Edit Tag Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <form
            onSubmit={handleSubmit}
            className="bg-surface-card border border-border-base rounded-theme shadow-2xl max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border-base pb-3">
              <h3 className="font-bold text-base text-content-main flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" />
                <span>{editingTag ? 'Chỉnh sửa Tag đơn hàng' : 'Tạo Tag đơn hàng mới'}</span>
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
                  Tên Tag <span className="text-status-danger">*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: Khách VIP, Đơn gấp, Khách sỉ..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="w-full bg-surface-subtle border border-border-base rounded-theme px-3.5 py-2 text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="block font-semibold text-content-main mb-1">
                  Màu sắc thẻ
                </label>
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setFormColor(c.key)}
                      className={cn(
                        'flex items-center gap-1.5 p-2 rounded-theme border text-[11px] font-semibold transition-all',
                        c.bg,
                        c.text,
                        formColor === c.key ? 'ring-2 ring-primary border-primary font-bold' : c.border
                      )}
                    >
                      <span className={cn('w-2.5 h-2.5 rounded-full', c.dot)} />
                      <span className="truncate">{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-content-main mb-1">
                  Mô tả mục đích
                </label>
                <textarea
                  rows={3}
                  placeholder="Ghi chú thêm về quy tắc gắn thẻ này..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-surface-subtle border border-border-base rounded-theme p-3 text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />
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
                {editingTag ? 'Lưu thay đổi' : 'Tạo Tag'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default OrderTagsPage;
