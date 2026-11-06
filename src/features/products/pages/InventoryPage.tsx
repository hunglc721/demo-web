import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Minus,
  RefreshCw,
} from 'lucide-react';
import { productService } from '@/services/api/productService';
import { Product, Category } from '@/types';
import { toast } from '@/stores/toastStore';
import { formatCurrencyVND } from '@/utils/formatters';
import { cn } from '@/utils/cn';

export const InventoryPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'low' | 'out' | 'in_stock'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        productService.getProducts(),
        productService.getCategories(),
      ]);
      setProducts(prods.data || []);
      setCategories(cats);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải dữ liệu tồn kho.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStock = async (product: Product, delta: number) => {
    const newStock = Math.max(0, (product.stock ?? 0) + delta);
    try {
      await productService.updateProduct(product.id, {
        stock: newStock,
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, stock: newStock } : p))
      );
      toast.success(`Đã cập nhật tồn kho "${product.name}": ${newStock} cái.`);
    } catch (err) {
      console.error(err);
      toast.error('Không thể cập nhật tồn kho.');
    }
  };

  const handleSetExactStock = async (product: Product, exactStock: number) => {
    if (isNaN(exactStock) || exactStock < 0) return;
    try {
      await productService.updateProduct(product.id, {
        stock: exactStock,
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, stock: exactStock } : p))
      );
      toast.success(`Đã đặt tồn kho "${product.name}": ${exactStock} cái.`);
    } catch (err) {
      console.error(err);
      toast.error('Không thể cập nhật tồn kho.');
    }
  };

  const filteredProducts = products.filter((p) => {
    const threshold = p.lowStockThreshold ?? 5;
    const stock = p.stock ?? 0;

    if (activeTab === 'low' && (stock > threshold || stock === 0)) return false;
    if (activeTab === 'out' && stock > 0) return false;
    if (activeTab === 'in_stock' && stock <= threshold) return false;

    if (selectedCat !== 'all' && p.categoryId !== selectedCat) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchSku = (p.sku || '').toLowerCase().includes(q);
      if (!matchName && !matchSku) return false;
    }

    return true;
  });

  const allCount = products.length;
  const outCount = products.filter((p) => (p.stock ?? 0) === 0).length;
  const lowCount = products.filter(
    (p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= (p.lowStockThreshold ?? 5)
  ).length;
  const inStockCount = products.filter(
    (p) => (p.stock ?? 0) > (p.lowStockThreshold ?? 5)
  ).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-base pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-content-main tracking-tight flex items-center gap-2">
            <Boxes className="w-6 h-6 text-primary" />
            <span>Quản lý Tồn kho sản phẩm</span>
          </h1>
          <p className="text-xs sm:text-sm text-content-muted mt-1">
            Theo dõi lượng hàng thực tế, cảnh báo sắp hết và cập nhật nhanh số lượng sản phẩm.
          </p>
        </div>

        <button
          onClick={loadData}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-theme border border-border-base bg-surface-card hover:bg-surface-subtle text-xs font-semibold text-content-main transition-colors"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          <span>Làm mới dữ liệu</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border-base pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={cn(
            'px-4 py-2 text-xs font-semibold rounded-t-theme transition-colors border-b-2 whitespace-nowrap',
            activeTab === 'all'
              ? 'border-primary text-primary bg-primary/5 font-bold'
              : 'border-transparent text-content-muted hover:text-content-main'
          )}
        >
          Tất cả tồn kho ({allCount})
        </button>
        <button
          onClick={() => setActiveTab('low')}
          className={cn(
            'px-4 py-2 text-xs font-semibold rounded-t-theme transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5',
            activeTab === 'low'
              ? 'border-amber-500 text-amber-600 bg-amber-500/5 font-bold'
              : 'border-transparent text-content-muted hover:text-content-main'
          )}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Sắp hết hàng ({lowCount})</span>
        </button>
        <button
          onClick={() => setActiveTab('out')}
          className={cn(
            'px-4 py-2 text-xs font-semibold rounded-t-theme transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5',
            activeTab === 'out'
              ? 'border-rose-500 text-rose-600 bg-rose-500/5 font-bold'
              : 'border-transparent text-content-muted hover:text-content-main'
          )}
        >
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span>Hết hàng ({outCount})</span>
        </button>
        <button
          onClick={() => setActiveTab('in_stock')}
          className={cn(
            'px-4 py-2 text-xs font-semibold rounded-t-theme transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5',
            activeTab === 'in_stock'
              ? 'border-emerald-500 text-emerald-600 bg-emerald-500/5 font-bold'
              : 'border-transparent text-content-muted hover:text-content-main'
          )}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Còn hàng dồi dào ({inStockCount})</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-content-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên sản phẩm hoặc mã SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-subtle border border-border-base rounded-theme pl-9 pr-3 py-2 text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="bg-surface-subtle border border-border-base rounded-theme px-3 py-2 text-xs text-content-main focus:outline-none cursor-pointer"
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {filteredProducts.length === 0 ? (
        <div className="p-12 text-center rounded-theme bg-surface-card border border-border-base">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
            <Boxes className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-content-main">Không tìm thấy sản phẩm phù hợp</h3>
          <p className="text-xs text-content-muted mt-1 max-w-md mx-auto">
            Thử thay đổi bộ lọc hoặc điều chỉnh từ khóa tìm kiếm.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-theme border border-border-base bg-surface-card shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-subtle/80 border-b border-border-base text-content-muted font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3">SẢN PHẨM & SKU</th>
                <th className="p-3">DANH MỤC</th>
                <th className="p-3">GIÁ BÁN</th>
                <th className="p-3">TRẠNG THÁI KHO</th>
                <th className="p-3">NGƯỠNG CẢNH BÁO</th>
                <th className="p-3">TỒN KHO HIỆN TẠI</th>
                <th className="p-3 text-right">ĐIỀU CHỈNH NHANH</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base">
              {filteredProducts.map((p) => {
                const stock = p.stock ?? 0;
                const threshold = p.lowStockThreshold ?? 5;
                const isOut = stock === 0;
                const isLow = stock > 0 && stock <= threshold;

                return (
                  <tr key={p.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                          alt=""
                          className="w-10 h-10 rounded object-cover border border-border-base flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-content-main truncate max-w-xs">{p.name}</p>
                          <p className="font-mono text-[11px] text-content-muted">{p.sku || 'CHƯA CÓ SKU'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-content-muted">{p.categoryName}</td>
                    <td className="p-3 font-semibold text-content-main">
                      {formatCurrencyVND(p.price)}
                    </td>
                    <td className="p-3">
                      {isOut ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          <XCircle className="w-3 h-3" />
                          <span>Hết hàng</span>
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Sắp hết hàng ({stock})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Còn hàng ({stock})</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-content-muted">
                      &le; {threshold} cái
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          value={stock}
                          onChange={(e) => handleSetExactStock(p, parseInt(e.target.value, 10))}
                          className={cn(
                            'w-20 px-2 py-1 text-center font-bold text-xs rounded border bg-surface-subtle focus:outline-none focus:ring-1 focus:ring-primary',
                            isOut
                              ? 'border-rose-500/50 text-rose-600'
                              : isLow
                              ? 'border-amber-500/50 text-amber-600'
                              : 'border-border-base text-content-main'
                          )}
                        />
                      </div>
                    </td>
                    <td className="p-3 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => handleUpdateStock(p, -1)}
                        disabled={stock <= 0}
                        className="p-1 rounded bg-surface-subtle border border-border-base hover:bg-border-base text-content-main disabled:opacity-30 transition-colors"
                        title="Giảm 1"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleUpdateStock(p, 1)}
                        className="p-1 rounded bg-surface-subtle border border-border-base hover:bg-border-base text-content-main transition-colors"
                        title="Tăng 1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleUpdateStock(p, 10)}
                        className="px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 text-[11px] font-bold transition-colors"
                        title="Nhập thêm 10 cái"
                      >
                        +10
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
