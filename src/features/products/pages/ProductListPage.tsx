import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Package,
  Edit,
  Trash2,
  RefreshCw,
  MoreVertical,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { productService } from '@/services/api/productService';
import { Product, Category, ProductStatus } from '@/types';
import { formatCurrencyVND } from '@/utils/formatters';
import { matchesVietnameseSearch } from '@/utils/vietnameseSearch';
import { Badge } from '@/core/components/Badge';
import { Modal } from '@/core/components/Modal';
import { DropdownMenu } from '@/core/components/Dropdown';
import { Pagination } from '@/core/components/Pagination';
import { toast } from '@/stores/toastStore';

type SortColumn = 'name' | 'price' | 'stock' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export const ProductListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStockParam = searchParams.get('stock') || 'all';

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | ProductStatus>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStockStatus, setSelectedStockStatus] = useState<string>(initialStockParam);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [refreshKey, setRefreshKey] = useState(0);

  // Sorting state
  const [sortBy, setSortBy] = useState<SortColumn>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Sync URL query param if changed
  useEffect(() => {
    const stockParam = searchParams.get('stock');
    setSelectedStockStatus(stockParam || 'all');
  }, [searchParams]);

  // Load products and categories
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [prodRes, cats] = await Promise.all([
          productService.getProducts({ limit: 200, sortBy: 'createdAt', sortOrder: 'desc' }),
          productService.getCategories(),
        ]);
        if (isMounted) {
          setProducts(prodRes.data);
          setCategories(cats);
        }
      } catch (err) {
        console.error('Lỗi tải sản phẩm:', err);
        toast.error('Không thể tải danh sách sản phẩm.', { title: 'Lỗi' });
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  // Status Tab Counts
  const statusCounts = useMemo(() => {
    return {
      all: products.length,
      active: products.filter((p) => p.status === 'active').length,
      draft: products.filter((p) => p.status === 'draft').length,
      archived: products.filter((p) => p.status === 'archived').length,
    };
  }, [products]);

  // Sort handler
  const handleSort = (column: SortColumn) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Status toggle handler
  const handleToggleStatus = async (product: Product) => {
    const nextStatus: ProductStatus = product.status === 'active' ? 'draft' : 'active';
    try {
      await productService.updateProduct(product.id, { status: nextStatus });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, status: nextStatus } : p))
      );
      toast.success(
        `Đã chuyển trạng thái "${product.name}" sang [${nextStatus === 'active' ? 'Đang kinh doanh' : 'Bản nháp'}]`
      );
    } catch (err) {
      toast.error('Lỗi khi đổi trạng thái sản phẩm.');
    }
  };

  // Delete product handler
  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      await productService.deleteProduct(productToDelete.id);
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
      setSelectedProductIds((prev) => prev.filter((id) => id !== productToDelete.id));
      toast.success(`Đã xóa sản phẩm "${productToDelete.name}".`);
      setProductToDelete(null);
    } catch (err) {
      toast.error('Lỗi khi xóa sản phẩm.');
    }
  };

  // Bulk delete handler
  const confirmBulkDelete = async () => {
    if (selectedProductIds.length === 0) return;
    try {
      await Promise.all(selectedProductIds.map((id) => productService.deleteProduct(id)));
      setProducts((prev) => prev.filter((p) => !selectedProductIds.includes(p.id)));
      toast.success(`Đã xóa thành công ${selectedProductIds.length} sản phẩm.`);
      setSelectedProductIds([]);
      setIsBulkDeleteModalOpen(false);
    } catch (err) {
      toast.error('Lỗi khi xóa hàng loạt sản phẩm.');
    }
  };

  // Filtering & Sorting
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // 1. Status Tab Filter
        if (selectedStatus !== 'all' && p.status !== selectedStatus) {
          return false;
        }

        // 2. Category filter
        if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) {
          return false;
        }

        // 3. Stock filter
        if (selectedStockStatus === 'in_stock' && (p.stock ?? 0) <= 5) return false;
        if (
          selectedStockStatus === 'low_stock' &&
          ((p.stock ?? 0) > (p.lowStockThreshold || 5) || (p.stock ?? 0) === 0)
        )
          return false;
        if (selectedStockStatus === 'out_of_stock' && (p.stock ?? 0) > 0) return false;

        // 4. Accent-insensitive Search
        if (searchQuery.trim()) {
          const matched = matchesVietnameseSearch(
            [p.name, p.sku, p.categoryName || '', ...(p.tags || [])],
            searchQuery
          );
          if (!matched) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let valA: any = a[sortBy];
        let valB: any = b[sortBy];

        if (sortBy === 'name') {
          valA = (valA || '').toLowerCase();
          valB = (valB || '').toLowerCase();
          return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }

        if (sortBy === 'createdAt') {
          valA = new Date(valA).getTime();
          valB = new Date(valB).getTime();
        } else {
          valA = Number(valA) || 0;
          valB = Number(valB) || 0;
        }

        return sortOrder === 'asc' ? valA - valB : valB - valA;
      });
  }, [
    products,
    selectedStatus,
    selectedCategory,
    selectedStockStatus,
    searchQuery,
    sortBy,
    sortOrder,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  // Master Checkbox
  const allCurrentPageSelected =
    paginatedProducts.length > 0 &&
    paginatedProducts.every((p) => selectedProductIds.includes(p.id));

  const toggleSelectAllPage = () => {
    if (allCurrentPageSelected) {
      const pageIds = paginatedProducts.map((p) => p.id);
      setSelectedProductIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      const pageIds = paginatedProducts.map((p) => p.id);
      setSelectedProductIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const toggleSelectProduct = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const renderSortIcon = (column: SortColumn) => {
    if (sortBy !== column) return <ArrowUpDown className="w-3.5 h-3.5 text-content-muted" />;
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-primary" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-primary" />
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-content-main tracking-tight">
            Quản Lý Sản Phẩm
          </h1>
          <p className="text-sm text-content-muted mt-0.5">
            Danh mục sản phẩm, biến thể phân loại và theo dõi tồn kho thời gian thực.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-theme border border-border-base bg-surface-card hover:bg-surface-subtle text-xs font-semibold text-content-main shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-primary' : ''}`} />
            <span>Làm mới</span>
          </button>
          <Link
            to="/admin/products/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-theme bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm sản phẩm</span>
          </Link>
        </div>
      </div>

      {/* Status Tabs with Count Pills */}
      <div className="flex items-center gap-2 border-b border-border-base overflow-x-auto pb-px">
        {[
          { key: 'all', label: 'Tất cả sản phẩm', count: statusCounts.all },
          { key: 'active', label: 'Đang kinh doanh', count: statusCounts.active },
          { key: 'draft', label: 'Bản nháp', count: statusCounts.draft },
          { key: 'archived', label: 'Đã lưu trữ', count: statusCounts.archived },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setSelectedStatus(tab.key as any);
              setCurrentPage(1);
            }}
            className={`inline-flex items-center gap-2 py-3 px-4 border-b-2 font-semibold text-xs whitespace-nowrap transition-colors ${
              selectedStatus === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-content-muted hover:text-content-main'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                selectedStatus === tab.key
                  ? 'bg-primary/10 text-primary'
                  : 'bg-surface-subtle text-content-muted'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filters & Search Bar */}
      <div className="p-4 rounded-theme bg-surface-card border border-border-base flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên sản phẩm, mã SKU, danh mục, thẻ tag..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-surface-subtle border border-border-base rounded-theme pl-9 pr-8 py-2 text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <Search className="w-4 h-4 text-content-muted absolute left-3 top-2.5" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-content-muted hover:text-content-main text-xs font-bold"
            >
              ×
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="w-full md:w-52">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-surface-subtle border border-border-base rounded-theme px-3 py-2 text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.productCount || 0})
              </option>
            ))}
          </select>
        </div>

        {/* Stock Filter */}
        <div className="w-full md:w-48">
          <select
            value={selectedStockStatus}
            onChange={(e) => {
              setSelectedStockStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-surface-subtle border border-border-base rounded-theme px-3 py-2 text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="all">Tất cả tồn kho</option>
            <option value="in_stock">Còn hàng (&gt; 5 sp)</option>
            <option value="low_stock">Sắp hết hàng (1 - 5 sp)</option>
            <option value="out_of_stock">Hết hàng (0 sp)</option>
          </select>
        </div>

        {(searchQuery || selectedCategory !== 'all' || selectedStockStatus !== 'all') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedStockStatus('all');
              setSearchParams({});
              setCurrentPage(1);
            }}
            className="px-3 py-2 rounded-theme border border-border-base hover:bg-surface-subtle text-xs font-semibold text-content-muted hover:text-content-main transition-colors whitespace-nowrap"
          >
            Đặt lại bộ lọc
          </button>
        )}
      </div>

      {/* Bulk Action Bar */}
      {selectedProductIds.length > 0 && (
        <div className="p-3.5 rounded-theme bg-primary/10 border border-primary/20 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
          <span className="text-xs font-bold text-primary">
            Đã chọn {selectedProductIds.length} sản phẩm trên trang
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedProductIds([])}
              className="px-3 py-1.5 rounded text-xs font-semibold bg-surface-card hover:bg-surface-subtle border border-border-base text-content-main"
            >
              Bỏ chọn
            </button>
            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold bg-status-danger text-white hover:bg-red-700 shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa {selectedProductIds.length} mục đã chọn</span>
            </button>
          </div>
        </div>
      )}

      {/* Product Table */}
      <div className="rounded-theme border border-border-base bg-surface-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border-base bg-surface-subtle text-content-muted font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={allCurrentPageSelected}
                    onChange={toggleSelectAllPage}
                    className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                  />
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-3 cursor-pointer hover:text-content-main select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Sản Phẩm</span>
                    {renderSortIcon('name')}
                  </div>
                </th>
                <th className="py-3 px-3">Danh Mục</th>
                <th
                  onClick={() => handleSort('price')}
                  className="py-3 px-3 cursor-pointer hover:text-content-main select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Giá Bán</span>
                    {renderSortIcon('price')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('stock')}
                  className="py-3 px-3 cursor-pointer hover:text-content-main select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Tồn Kho</span>
                    {renderSortIcon('stock')}
                  </div>
                </th>
                <th className="py-3 px-3">Trạng Thái</th>
                <th
                  onClick={() => handleSort('createdAt')}
                  className="py-3 px-3 cursor-pointer hover:text-content-main select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Ngày Tạo</span>
                    {renderSortIcon('createdAt')}
                  </div>
                </th>
                <th className="py-3 px-3.5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-content-muted">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent mb-2" />
                    <p>Đang tải danh sách sản phẩm...</p>
                  </td>
                </tr>
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-content-muted">
                    <Package className="w-10 h-10 text-border-base mx-auto mb-2" />
                    <p className="text-xs font-semibold text-content-main">
                      Không tìm thấy sản phẩm nào
                    </p>
                    <p className="text-[11px] text-content-muted mt-0.5">
                      Thử thay đổi từ khóa tìm kiếm hoặc đặt lại các bộ lọc hiện tại.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  const isChecked = selectedProductIds.includes(p.id);
                  const isLowStock = (p.stock ?? 0) <= (p.lowStockThreshold || 5) && (p.stock ?? 0) > 0;
                  const isOutOfStock = (p.stock ?? 0) <= 0;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-surface-subtle transition-colors ${
                        isChecked ? 'bg-primary/5' : ''
                      }`}
                    >
                      <td className="py-3.5 px-3.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectProduct(p.id)}
                          className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                        />
                      </td>

                      {/* Product Name & Thumb */}
                      <td className="py-3.5 px-3 min-w-[240px]">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              p.images?.[0] ||
                              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120'
                            }
                            alt={p.name}
                            className="w-10 h-10 rounded object-cover flex-shrink-0 bg-surface-subtle border border-border-base"
                          />
                          <div className="min-w-0">
                            <Link
                              to={`/admin/products/${p.id}/edit`}
                              className="font-bold text-content-main hover:text-primary transition-colors block truncate"
                            >
                              {p.name}
                            </Link>
                            <div className="text-[11px] text-content-muted font-mono flex items-center gap-2 mt-0.5">
                              <span>SKU: {p.sku || 'N/A'}</span>
                              {p.variants && p.variants.length > 0 && (
                                <span className="text-primary font-sans font-semibold">
                                  ({p.variants.length} phân loại)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3 text-content-muted">
                        {p.categoryName || 'Sản phẩm'}
                      </td>

                      {/* Pricing */}
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-content-main">
                          {formatCurrencyVND(p.price)}
                        </div>
                        {p.compareAtPrice && p.compareAtPrice > p.price && (
                          <div className="text-[10px] text-content-muted line-through">
                            {formatCurrencyVND(p.compareAtPrice)}
                          </div>
                        )}
                      </td>

                      {/* Stock Badge */}
                      <td className="py-3.5 px-3">
                        {isOutOfStock ? (
                          <Badge variant="danger" appearance="subtle">
                            Hết hàng (0)
                          </Badge>
                        ) : isLowStock ? (
                          <Badge variant="warning" appearance="subtle" pulse>
                            Sắp hết ({p.stock})
                          </Badge>
                        ) : (
                          <Badge variant="success" appearance="subtle">
                            Còn {p.stock} sp
                          </Badge>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        {p.status === 'active' ? (
                          <Badge variant="success">Kinh doanh</Badge>
                        ) : p.status === 'draft' ? (
                          <Badge variant="neutral">Bản nháp</Badge>
                        ) : (
                          <Badge variant="danger">Đã lưu trữ</Badge>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-3 text-content-muted text-[11px]">
                        {new Date(p.createdAt).toLocaleDateString('vi-VN')}
                      </td>

                      {/* Action Dropdown Menu */}
                      <td className="py-3.5 px-3.5 text-right">
                        <DropdownMenu>
                          <DropdownMenu.Trigger asChild>
                            <button
                              type="button"
                              className="p-1.5 rounded-theme text-content-muted hover:text-content-main hover:bg-surface-subtle transition-colors"
                              title="Tùy chọn thao tác"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </DropdownMenu.Trigger>
                          <DropdownMenu.Content placement="bottom-end" className="w-44">
                            <DropdownMenu.Item
                              onClick={() => navigate(`/admin/products/${p.id}/edit`)}
                              icon={<Edit className="w-3.5 h-3.5" />}
                            >
                              Chỉnh sửa
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              onClick={() => window.open(`/product/${p.slug}`, '_blank')}
                              icon={<ExternalLink className="w-3.5 h-3.5" />}
                            >
                              Xem trên web
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              onClick={() => handleToggleStatus(p)}
                              icon={
                                p.status === 'active' ? (
                                  <ToggleLeft className="w-3.5 h-3.5 text-amber-500" />
                                ) : (
                                  <ToggleRight className="w-3.5 h-3.5 text-emerald-500" />
                                )
                              }
                            >
                              {p.status === 'active' ? 'Chuyển sang Nháp' : 'Bật Kinh doanh'}
                            </DropdownMenu.Item>
                            <DropdownMenu.Separator />
                            <DropdownMenu.Item
                              variant="danger"
                              onClick={() => setProductToDelete(p)}
                              icon={<Trash2 className="w-3.5 h-3.5" />}
                            >
                              Xóa sản phẩm
                            </DropdownMenu.Item>
                          </DropdownMenu.Content>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        {filteredProducts.length > itemsPerPage && (
          <div className="p-4 border-t border-border-base flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-content-muted">
              Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{' '}
              {Math.min(currentPage * itemsPerPage, filteredProducts.length)} trên tổng số{' '}
              {filteredProducts.length} sản phẩm
            </span>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={itemsPerPage}
              totalItems={filteredProducts.length}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}
      </div>

      {/* Delete Single Product Confirmation Modal */}
      <Modal
        isOpen={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        title="Xác Nhận Xóa Sản Phẩm"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-content-muted">
            Bạn có chắc chắn muốn xóa sản phẩm{' '}
            <strong className="text-content-main font-semibold">
              &quot;{productToDelete?.name}&quot;
            </strong>{' '}
            (SKU: {productToDelete?.sku})? Hành động này sẽ xóa dữ liệu khỏi LocalStorage và không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setProductToDelete(null)}
              className="px-4 py-2 rounded-theme border border-border-base bg-surface-card hover:bg-surface-subtle text-xs font-semibold text-content-main transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={confirmDeleteProduct}
              className="px-4 py-2 rounded-theme bg-status-danger text-white text-xs font-bold hover:bg-red-700 transition-colors"
            >
              Xác nhận xóa
            </button>
          </div>
        </div>
      </Modal>

      {/* Bulk Delete Confirmation Modal */}
      <Modal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        title="Xác Nhận Xóa Hàng Loạt"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-content-muted">
            Bạn đang chuẩn bị xóa{' '}
            <strong className="text-status-danger font-semibold">
              {selectedProductIds.length} sản phẩm
            </strong>{' '}
            đã chọn. Dữ liệu sẽ bị gỡ bỏ hoàn toàn khỏi hệ thống lưu trữ.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsBulkDeleteModalOpen(false)}
              className="px-4 py-2 rounded-theme border border-border-base bg-surface-card hover:bg-surface-subtle text-xs font-semibold text-content-main transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={confirmBulkDelete}
              className="px-4 py-2 rounded-theme bg-status-danger text-white text-xs font-bold hover:bg-red-700 transition-colors"
            >
              Xóa {selectedProductIds.length} sản phẩm
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProductListPage;
