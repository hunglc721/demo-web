import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { SlidersHorizontal, Filter, Home, ChevronRight } from 'lucide-react';
import { productService } from '@/services/api/productService';
import { Product, Category } from '@/types/product';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/ProductCardSkeleton';
import { CatalogFilterSidebar, CatalogFilterState } from '../components/CatalogFilterSidebar';
import { CatalogActiveFilters } from '../components/CatalogActiveFilters';
import { Drawer } from '@/core/components/Drawer';
import { Pagination } from '@/core/components/Pagination';
import { EmptyState } from '@/core/components/Feedback/EmptyState';

const normalizeVn = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
};

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL Query State
  const query = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || undefined;
  const minPriceParam = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxPriceParam = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
  const inStockParam = searchParams.get('inStock') === 'true';
  const minRatingParam = searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined;
  const tagParam = searchParams.get('tag') || undefined;
  const sort = searchParams.get('sort') || 'popular';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '12', 10);

  // Data State
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        productService.getProducts({ pageSize: 100 }),
        productService.getCategories(),
      ]);
      setAllProducts(prodRes.items);
      setCategories(catRes);
    } catch {
      setAllProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const handleUpdate = () => fetchData();
    window.addEventListener('d2c:products-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('d2c:products-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [fetchData]);

  // Compute category counts across all inventory
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of allProducts) {
      if (p.categoryId) {
        counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
      }
    }
    return counts;
  }, [allProducts]);

  // Active filters object
  const filters: CatalogFilterState = useMemo(
    () => ({
      category: categoryParam,
      minPrice: minPriceParam,
      maxPrice: maxPriceParam,
      inStock: inStockParam || undefined,
      minRating: minRatingParam,
      tag: tagParam,
    }),
    [categoryParam, minPriceParam, maxPriceParam, inStockParam, minRatingParam, tagParam]
  );

  // Count number of active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (query) count++;
    if (filters.category) count++;
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) count++;
    if (filters.inStock) count++;
    if (filters.minRating) count++;
    if (filters.tag) count++;
    return count;
  }, [query, filters]);

  // Helper to update search params
  const updateParams = (updates: Record<string, string | null | undefined>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (val === undefined || val === null || val === '') {
        next.delete(key);
      } else {
        next.set(key, val);
      }
    });
    // Reset to page 1 on filter modification unless page is explicitly updated
    if (!('page' in updates)) {
      next.delete('page');
    }
    setSearchParams(next);
  };

  const handleFilterChange = (updates: Partial<CatalogFilterState>) => {
    const paramUpdates: Record<string, string | null | undefined> = {};
    if ('category' in updates) paramUpdates.category = updates.category;
    if ('minPrice' in updates)
      paramUpdates.minPrice = updates.minPrice !== undefined ? String(updates.minPrice) : null;
    if ('maxPrice' in updates)
      paramUpdates.maxPrice = updates.maxPrice !== undefined ? String(updates.maxPrice) : null;
    if ('inStock' in updates)
      paramUpdates.inStock = updates.inStock ? 'true' : null;
    if ('minRating' in updates)
      paramUpdates.minRating = updates.minRating !== undefined ? String(updates.minRating) : null;
    if ('tag' in updates) paramUpdates.tag = updates.tag;

    updateParams(paramUpdates);
  };

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  // Filter and sort items
  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // 1. Text Search (Vietnamese accent-insensitive)
    if (query.trim()) {
      const qNorm = normalizeVn(query);
      result = result.filter((p) => {
        const nameNorm = normalizeVn(p.name);
        const descNorm = normalizeVn(p.shortDescription || p.description || '');
        const skuNorm = normalizeVn(p.sku);
        const catNorm = normalizeVn(p.categoryName || '');
        return (
          nameNorm.includes(qNorm) ||
          descNorm.includes(qNorm) ||
          skuNorm.includes(qNorm) ||
          catNorm.includes(qNorm)
        );
      });
    }

    // 2. Category
    if (filters.category) {
      result = result.filter(
        (p) => p.categoryId === filters.category || p.categoryName === filters.category
      );
    }

    // 3. Price range
    if (filters.minPrice !== undefined) {
      result = result.filter((p) => p.price >= filters.minPrice!);
    }
    if (filters.maxPrice !== undefined) {
      result = result.filter((p) => p.price <= filters.maxPrice!);
    }

    // 4. In Stock
    if (filters.inStock) {
      result = result.filter((p) => p.stock > 0);
    }

    // 5. Rating
    if (filters.minRating) {
      result = result.filter((p) => (p.rating || 5) >= filters.minRating!);
    }

    // 6. Tag
    if (filters.tag) {
      result = result.filter((p) => p.tags.includes(filters.tag!));
    }

    // 7. Sort
    result.sort((a, b) => {
      if (sort === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sort === 'price-asc') {
        return a.price - b.price;
      }
      if (sort === 'price-desc') {
        return b.price - a.price;
      }
      if (sort === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      }
      // 'popular' default: by salesCount desc, then rating
      return (b.salesCount || 0) - (a.salesCount || 0);
    });

    return result;
  }, [allProducts, query, filters, sort]);

  // Paginated items slice
  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // Active Category Name
  const activeCategory = categories.find(
    (c) => c.slug === filters.category || c.id === filters.category
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-content-muted">
        <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          <span>Trang chủ</span>
        </Link>
        <ChevronRight className="w-3 h-3 text-border-base" />
        <Link to="/catalog" className="hover:text-primary transition-colors font-medium">
          Danh mục sản phẩm
        </Link>
        {activeCategory && (
          <>
            <ChevronRight className="w-3 h-3 text-border-base" />
            <span className="text-content-main font-semibold">{activeCategory.name}</span>
          </>
        )}
      </nav>

      {/* PLP Header & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-base pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-content-main tracking-tight">
            {query
              ? `Kết quả tìm kiếm cho: "${query}"`
              : activeCategory
              ? activeCategory.name
              : 'Tất Cả Sản Phẩm'}
          </h1>
          <p className="text-sm text-content-muted mt-1">
            Hiển thị {paginatedItems.length} trong tổng số {totalItems} sản phẩm D2C cao cấp
          </p>
        </div>

        {/* Controls: Mobile Filter Trigger & Sort Dropdown */}
        <div className="flex items-center gap-3">
          {/* Mobile Filter Button */}
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden inline-flex items-center gap-2 px-3.5 py-2 rounded-theme bg-surface-card border border-border-base text-xs font-semibold text-content-main hover:border-primary shadow-sm"
          >
            <Filter className="w-4 h-4 text-primary" />
            <span>Bộ lọc</span>
            {activeFiltersCount > 0 && (
              <span className="bg-primary text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 text-xs text-content-muted">
            <SlidersHorizontal className="w-4 h-4 hidden sm:inline" />
            <span className="hidden sm:inline font-medium">Sắp xếp:</span>
            <select
              value={sort}
              onChange={(e) => updateParams({ sort: e.target.value })}
              className="bg-surface-card border border-border-base rounded-theme px-3 py-2 text-xs font-medium text-content-main focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="popular">Phổ biến nhất (Bán chạy)</option>
              <option value="newest">Hàng mới về</option>
              <option value="price-asc">Giá: Thấp đến cao</option>
              <option value="price-desc">Giá: Cao đến thấp</option>
              <option value="rating">Đánh giá cao nhất</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Chips Bar */}
      <CatalogActiveFilters
        searchQuery={query}
        filters={filters}
        categories={categories}
        onRemoveSearch={() => updateParams({ q: null })}
        onRemoveCategory={() => updateParams({ category: null })}
        onRemovePrice={() => updateParams({ minPrice: null, maxPrice: null })}
        onRemoveInStock={() => updateParams({ inStock: null })}
        onRemoveRating={() => updateParams({ minRating: null })}
        onRemoveTag={() => updateParams({ tag: null })}
        onClearAll={handleResetFilters}
      />

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Desktop Sticky Filter Sidebar */}
        <aside className="hidden lg:block lg:col-span-1 sticky top-20 p-5 rounded-theme bg-surface-card border border-border-base shadow-sm">
          <CatalogFilterSidebar
            categories={categories}
            categoryCounts={categoryCounts}
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
          />
        </aside>

        {/* Product Cards Grid & Empty State */}
        <div className="lg:col-span-3 space-y-8">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <ProductCardSkeleton key={idx} />
              ))}
            </div>
          ) : paginatedItems.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
              {paginatedItems.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="py-12 bg-surface-card rounded-theme border border-border-base">
              <EmptyState
                preset="no-search"
                title="Không tìm thấy sản phẩm phù hợp"
                description="Hãy thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh khoảng giá / bộ lọc danh mục."
                action={{
                  label: 'Xóa toàn bộ bộ lọc',
                  onClick: handleResetFilters,
                  variant: 'primary',
                }}
              />
            </div>
          )}

          {/* Bottom Pagination Controls */}
          {totalItems > 0 && (
            <div className="pt-6 border-t border-border-base">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                pageSizeOptions={[12, 24, 48]}
                onPageChange={(p) => updateParams({ page: String(p) })}
                onPageSizeChange={(size) => updateParams({ pageSize: String(size), page: '1' })}
                showTotal={true}
                showPageSizeSelector={true}
              />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer Filter Sidebar */}
      <Drawer
        isOpen={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        placement="left"
        size="md"
        title="Bộ Lọc Tìm Kiếm"
      >
        <div className="p-4">
          <CatalogFilterSidebar
            categories={categories}
            categoryCounts={categoryCounts}
            filters={filters}
            onFilterChange={(u) => {
              handleFilterChange(u);
              setMobileFilterOpen(false);
            }}
            onReset={() => {
              handleResetFilters();
              setMobileFilterOpen(false);
            }}
          />
        </div>
      </Drawer>
    </div>
  );
};
export default CatalogPage;
