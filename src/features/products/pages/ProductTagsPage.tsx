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
import { slugify } from '@/utils/formatters';
import { cn } from '@/utils/cn';

export interface ProductTag {
  id: string;
  name: string;
  slug: string;
  color: string;
  productCount: number;
  description?: string;
  updatedAt: string;
}

const COLOR_OPTIONS: Array<{ key: string; name: string; bg: string; text: string; dot: string; border: string }> = [
  { key: 'emerald', name: 'Xanh lục', bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500', border: 'border-emerald-500/20' },
  { key: 'indigo', name: 'Chàm Indigo', bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', dot: 'bg-indigo-500', border: 'border-indigo-500/20' },
  { key: 'rose', name: 'Đỏ Rose', bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', dot: 'bg-rose-500', border: 'border-rose-500/20' },
  { key: 'amber', name: 'Vàng Amber', bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500', border: 'border-amber-500/20' },
  { key: 'purple', name: 'Tím Purple', bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', dot: 'bg-purple-500', border: 'border-purple-500/20' },
  { key: 'sky', name: 'Xanh da trời', bg: 'bg-sky-500/10', text: 'text-sky-600 dark:text-sky-400', dot: 'bg-sky-500', border: 'border-sky-500/20' },
];

const SEED_PRODUCT_TAGS: ProductTag[] = [
  {
    id: 'ptag_01',
    name: 'Bán chạy nhất (Best-Seller)',
    slug: 'best-seller',
    color: 'rose',
    productCount: 18,
    description: 'Sản phẩm có doanh số cao trong 30 ngày',
    updatedAt: '2026-03-01T10:00:00.000Z',
  },
  {
    id: 'ptag_02',
    name: 'Hàng mới về (New Arrivals)',
    slug: 'hang-moi',
    color: 'sky',
    productCount: 12,
    description: 'Bộ sưu tập mùa hè mới ra mắt',
    updatedAt: '2026-03-15T09:30:00.000Z',
  },
  {
    id: 'ptag_03',
    name: 'Hot Deal Khuyến Mãi',
    slug: 'hot-deal',
    color: 'amber',
    productCount: 9,
    description: 'Sản phẩm giảm giá sâu cho chương trình Flash Sale',
    updatedAt: '2026-03-22T14:10:00.000Z',
  },
  {
    id: 'ptag_04',
    name: 'Cotton 100% Tự Nhiên',
    slug: 'cotton-100',
    color: 'emerald',
    productCount: 15,
    description: 'Chất liệu thoáng mát thấm hút mồ hôi',
    updatedAt: '2026-04-01T11:45:00.000Z',
  },
  {
    id: 'ptag_05',
    name: 'Freesize Dễ Mặc',
    slug: 'freesize',
    color: 'indigo',
    productCount: 7,
    description: 'Form dáng rộng rãi phù hợp mọi vóc dáng',
    updatedAt: '2026-04-04T16:20:00.000Z',
  },
];

export const ProductTagsPage: React.FC = () => {
  const [tags, setTags] = useState<ProductTag[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<ProductTag | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [color, setColor] = useState('rose');
  const [description, setDescription] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PRODUCT_TAGS);
      if (raw) {
        setTags(JSON.parse(raw));
      } else {
        localStorage.setItem(STORAGE_KEYS.PRODUCT_TAGS, JSON.stringify(SEED_PRODUCT_TAGS));
        setTags(SEED_PRODUCT_TAGS);
      }
    } catch {
      setTags(SEED_PRODUCT_TAGS);
    }
  }, []);

  const saveTags = (updated: ProductTag[]) => {
    setTags(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCT_TAGS, JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTags = tags.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingTag(null);
    setName('');
    setSlug('');
    setColor('rose');
    setDescription('');
    setModalOpen(true);
  };

  const handleOpenEdit = (t: ProductTag) => {
    setEditingTag(t);
    setName(t.name);
    setSlug(t.slug);
    setColor(t.color);
    setDescription(t.description || '');
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning('Vui lòng nhập tên tag sản phẩm.');
      return;
    }

    const finalSlug = slug.trim() || slugify(name);

    if (editingTag) {
      const updated = tags.map((t) =>
        t.id === editingTag.id
          ? {
              ...t,
              name: name.trim(),
              slug: finalSlug,
              color,
              description: description.trim(),
              updatedAt: new Date().toISOString(),
            }
          : t
      );
      saveTags(updated);
      toast.success(`Đã cập nhật tag "${name}"!`);
    } else {
      const newTag: ProductTag = {
        id: `ptag_${Date.now()}`,
        name: name.trim(),
        slug: finalSlug,
        color,
        description: description.trim(),
        productCount: 0,
        updatedAt: new Date().toISOString(),
      };
      saveTags([...tags, newTag]);
      toast.success(`Đã tạo mới tag sản phẩm "${name}"!`);
    }

    setModalOpen(false);
  };

  const handleDelete = (id: string, tagName: string) => {
    if (window.confirm(`Bạn có chắc muốn xóa tag "${tagName}"?`)) {
      const remaining = tags.filter((t) => t.id !== id);
      saveTags(remaining);
      toast.success(`Đã xóa tag "${tagName}"!`);
    }
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
            <span>Tag sản phẩm</span>
          </h1>
          <p className="text-xs sm:text-sm text-content-muted mt-1">
            Gắn nhãn tìm kiếm và phân loại sản phẩm nổi bật cho các chiến dịch bán hàng.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-theme bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Tạo Tag sản phẩm</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-content-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm tag hoặc slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-subtle border border-border-base rounded-theme pl-9 pr-3 py-2 text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      {/* Table */}
      {filteredTags.length === 0 ? (
        <div className="p-12 text-center rounded-theme bg-surface-card border border-border-base">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
            <Tag className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-content-main">Chưa có tag sản phẩm nào</h3>
          <p className="text-xs text-content-muted mt-1 max-w-md mx-auto">
            Tạo tag đầu tiên để gán cho các sản phẩm trong kho.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-theme border border-border-base bg-surface-card shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-subtle/80 border-b border-border-base text-content-muted font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3">TÊN TAG</th>
                <th className="p-3">MÃ SLUG</th>
                <th className="p-3">SỐ SẢN PHẨM GẮN THẺ</th>
                <th className="p-3">CẬP NHẬT LẦN CUỐI</th>
                <th className="p-3 text-right">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base">
              {filteredTags.map((tag) => {
                const conf = getColorConfig(tag.color);
                return (
                  <tr key={tag.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3">
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
                      {tag.description && (
                        <p className="text-[11px] text-content-muted mt-1">{tag.description}</p>
                      )}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-primary">
                      #{tag.slug}
                    </td>
                    <td className="p-3 font-semibold text-content-main">
                      {tag.productCount} sản phẩm
                    </td>
                    <td className="p-3 text-content-muted text-[11px]">
                      {new Date(tag.updatedAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="p-3 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEdit(tag)}
                        className="p-1.5 rounded hover:bg-surface-subtle text-content-muted hover:text-content-main transition-colors"
                        title="Sửa tag"
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <form
            onSubmit={handleSubmit}
            className="bg-surface-card border border-border-base rounded-theme shadow-2xl max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border-base pb-3">
              <h3 className="font-bold text-base text-content-main flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" />
                <span>{editingTag ? 'Chỉnh sửa Tag sản phẩm' : 'Tạo Tag sản phẩm mới'}</span>
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
                  placeholder="VD: Bán chạy nhất, Hot Deal..."
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingTag) setSlug(slugify(e.target.value));
                  }}
                  required
                  className="w-full bg-surface-subtle border border-border-base rounded-theme px-3.5 py-2 text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="block font-semibold text-content-main mb-1">
                  Mã Slug
                </label>
                <input
                  type="text"
                  placeholder="best-seller"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full bg-surface-subtle border border-border-base rounded-theme px-3.5 py-2 text-content-main font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="block font-semibold text-content-main mb-1">
                  Màu sắc thẻ
                </label>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setColor(c.key)}
                      className={cn(
                        'flex items-center gap-1.5 p-2 rounded-theme border text-[11px] font-semibold transition-all',
                        c.bg,
                        c.text,
                        color === c.key ? 'ring-2 ring-primary border-primary font-bold' : c.border
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
                  Mô tả tag
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú chi tiết mục đích hiển thị của tag này..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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

export default ProductTagsPage;
