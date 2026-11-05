/**
 * In-Memory Query Engine Pipeline
 * Provides multi-faceted filtering, Vietnamese locale-aware sorting, and boundary-clamped pagination.
 */

import { PaginatedResponse } from '@/types/dal';
import {
  tokenizeQuery,
  matchesVietnameseSearch,
  calculateRelevanceScore,
} from '@/utils/vietnameseSearch';

export type SortDirection = 'asc' | 'desc';

export interface SortCriteria<T = any> {
  field: keyof T | string;
  direction?: SortDirection;
}

export interface RangeCriteria<V = number | Date | string> {
  min?: V;
  max?: V;
}

export interface QueryFilterOptions<T = any> {
  /** Full-text search term using Vietnamese accent-insensitive matching */
  search?: string;

  /** Fields to search over. If not specified, inspects common text fields or all string values */
  searchFields?: (keyof T | string)[];

  /** Category ID or array of category IDs */
  category?: string | string[];

  /** Price range filter */
  minPrice?: number;
  maxPrice?: number;

  /** Stock availability filter (checks item.stock || item.stockQuantity || variants) */
  inStock?: boolean;

  /** Status filter (single string or multiple status keys) */
  status?: string | string[];

  /** Tags filter (checks if item.tags includes any or all of these) */
  tags?: string[];

  /** Date range bounds for createdAt or date fields */
  dateFrom?: string | Date;
  dateTo?: string | Date;
  dateField?: keyof T | string;

  /** Arbitrary key-value exact match map */
  where?: Partial<{
    [K in keyof T]: T[K] | T[K][] | RangeCriteria<any>;
  }>;

  /** Custom predicate for complex domain queries */
  predicate?: (item: T) => boolean;
}

export interface QueryPaginationOptions {
  page?: number;     // 1-indexed, default: 1
  pageSize?: number; // default: 10, max: 100
}

export interface QueryOptions<T = any> extends QueryPaginationOptions, QueryFilterOptions<T> {
  sortBy?: keyof T | string;
  sortOrder?: SortDirection;
  multiSort?: SortCriteria<T>[];
}

/**
 * Safely extracts a nested property value using dot-notation (e.g. 'category.id')
 */
export function getNestedProperty(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, part) => (acc != null ? acc[part] : undefined), obj);
}

/**
 * Stage 1: Filters items according to faceted criteria
 */
export function filterItems<T extends Record<string, any>>(
  items: T[],
  filters: QueryFilterOptions<T>
): T[] {
  const {
    search,
    searchFields,
    category,
    minPrice,
    maxPrice,
    inStock,
    status,
    tags,
    dateFrom,
    dateTo,
    dateField = 'createdAt',
    where,
    predicate,
  } = filters;

  const searchTokens = search ? tokenizeQuery(search) : [];

  return items.filter((item) => {
    // 1. Vietnamese Search Filter
    if (searchTokens.length > 0) {
      let haystackStrings: (string | null | undefined)[] = [];
      if (searchFields && searchFields.length > 0) {
        haystackStrings = searchFields.map((f) => String(getNestedProperty(item, String(f)) ?? ''));
      } else {
        // Default searchable fields
        haystackStrings = [
          item.name,
          item.title,
          item.sku,
          item.orderNumber,
          item.code,
          item.description,
          item.shortDescription,
          item.categoryName,
          item.email,
          item.phone,
          item.customer?.name,
          item.customer?.phone,
          item.customer?.email,
          item.customerName,
          Array.isArray(item.tags) ? item.tags.join(' ') : undefined,
          Array.isArray(item.variants)
            ? item.variants.map((v: any) => `${v.title || ''} ${v.sku || ''}`).join(' ')
            : undefined,
        ];
      }
      const matches = matchesVietnameseSearch(haystackStrings, search!);
      if (!matches) return false;
    }

    // 2. Category Filter
    if (category) {
      const itemCat = item.categoryId ?? item.category ?? (item.category && item.category.id);
      if (Array.isArray(category)) {
        if (!category.includes(String(itemCat))) return false;
      } else if (String(itemCat) !== String(category)) {
        return false;
      }
    }

    // 3. Price Range Filter
    const price = typeof item.price === 'number' ? item.price : Number(item.price);
    if (!isNaN(price)) {
      if (minPrice !== undefined && price < minPrice) return false;
      if (maxPrice !== undefined && price > maxPrice) return false;
    }

    // 4. Stock Availability Filter
    if (inStock !== undefined) {
      const stock =
        item.stock ??
        item.stockQuantity ??
        (Array.isArray(item.variants)
          ? item.variants.reduce((acc: number, v: any) => acc + (v.stock || 0), 0)
          : 0);
      if (inStock && stock <= 0) return false;
      if (!inStock && stock > 0) return false;
    }

    // 5. Status Filter
    if (status) {
      const itemStatus = item.status;
      if (Array.isArray(status)) {
        if (!status.includes(String(itemStatus))) return false;
      } else if (String(itemStatus) !== String(status)) {
        return false;
      }
    }

    // 6. Tags Filter
    if (tags && tags.length > 0) {
      const itemTags: string[] = Array.isArray(item.tags) ? item.tags : [];
      const hasMatchingTag = tags.some((t) => itemTags.includes(t));
      if (!hasMatchingTag) return false;
    }

    // 7. Date Range Filter
    if (dateFrom || dateTo) {
      const itemDateRaw = getNestedProperty(item, String(dateField));
      if (itemDateRaw) {
        const itemTime = new Date(itemDateRaw).getTime();
        if (dateFrom && itemTime < new Date(dateFrom).getTime()) return false;
        if (dateTo && itemTime > new Date(dateTo).getTime()) return false;
      }
    }

    // 8. Where Clauses
    if (where) {
      for (const [key, expectedVal] of Object.entries(where)) {
        const actualVal = getNestedProperty(item, key);
        if (expectedVal !== undefined) {
          if (Array.isArray(expectedVal)) {
            if (!expectedVal.includes(actualVal)) return false;
          } else if (
            typeof expectedVal === 'object' &&
            expectedVal !== null &&
            ('min' in expectedVal || 'max' in expectedVal)
          ) {
            const range = expectedVal as RangeCriteria<any>;
            if (range.min !== undefined && actualVal < range.min) return false;
            if (range.max !== undefined && actualVal > range.max) return false;
          } else if (actualVal !== expectedVal) {
            return false;
          }
        }
      }
    }

    // 9. Custom Predicate
    if (predicate && !predicate(item)) {
      return false;
    }

    return true;
  });
}

/**
 * Stage 2: Sorts items with Vietnamese locale awareness, numbers, dates, and null-safety
 */
export function sortItems<T extends Record<string, any>>(
  items: T[],
  options: {
    sortBy?: keyof T | string;
    sortOrder?: SortDirection;
    multiSort?: SortCriteria<T>[];
    searchQuery?: string;
  }
): T[] {
  const { sortBy, sortOrder = 'asc', multiSort, searchQuery } = options;

  const sorted = [...items];

  // If no sort specified, but search query is present: sort by relevance score descending
  if (!sortBy && (!multiSort || multiSort.length === 0) && searchQuery) {
    return sorted.sort((a, b) => {
      const scoreA = calculateRelevanceScore(a.name || a.title || '', [a.sku, a.description], searchQuery);
      const scoreB = calculateRelevanceScore(b.name || b.title || '', [b.sku, b.description], searchQuery);
      return scoreB - scoreA;
    });
  }

  const sortSpecs: SortCriteria<T>[] =
    multiSort && multiSort.length > 0
      ? multiSort
      : sortBy
      ? [{ field: sortBy, direction: sortOrder }]
      : [{ field: 'createdAt', direction: 'desc' }];

  return sorted.sort((a, b) => {
    for (const spec of sortSpecs) {
      const field = String(spec.field);
      const dir = spec.direction === 'desc' ? -1 : 1;

      const valA = getNestedProperty(a, field);
      const valB = getNestedProperty(b, field);

      // Always sort null or undefined values to the bottom
      if (valA == null && valB == null) continue;
      if (valA == null) return 1;
      if (valB == null) return -1;

      // Number comparison
      if (typeof valA === 'number' && typeof valB === 'number') {
        if (valA !== valB) return (valA - valB) * dir;
        continue;
      }

      // Date comparison
      const isDateA = valA instanceof Date || (typeof valA === 'string' && !isNaN(Date.parse(valA)) && (field.includes('At') || field.includes('Date')));
      const isDateB = valB instanceof Date || (typeof valB === 'string' && !isNaN(Date.parse(valB)) && (field.includes('At') || field.includes('Date')));

      if (isDateA && isDateB) {
        const timeA = new Date(valA).getTime();
        const timeB = new Date(valB).getTime();
        if (timeA !== timeB) return (timeA - timeB) * dir;
        continue;
      }

      // Vietnamese Locale-Aware String comparison
      const strA = String(valA);
      const strB = String(valB);
      const comp = strA.localeCompare(strB, 'vi', { sensitivity: 'base', numeric: true });
      if (comp !== 0) return comp * dir;
    }
    return 0;
  });
}

/**
 * Stage 3: Clamps pagination boundaries and slices dataset
 * Returns dual `items` and `data` properties referencing the identical array slice.
 */
export function paginateItems<T>(
  items: T[],
  options?: QueryPaginationOptions
): PaginatedResponse<T> {
  const total = items.length;
  const rawPageSize = options?.pageSize ?? (options as any)?.limit ?? 10;
  const pageSize = Math.min(Math.max(1, rawPageSize), 500); // 1 <= pageSize <= 500
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const rawPage = options?.page ?? 1;
  const page = total === 0 ? 1 : Math.min(Math.max(1, rawPage), totalPages);

  const startIndex = (page - 1) * pageSize;
  const sliced = total === 0 ? [] : items.slice(startIndex, startIndex + pageSize);

  return {
    items: sliced,
    data: sliced,
    total,
    page,
    pageSize,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * Comprehensive Pipeline Executor
 * Combines filtering, sorting, and pagination in a single call.
 */
export function applyQueryPipeline<T extends Record<string, any>>(
  items: T[],
  options?: QueryOptions<T>
): PaginatedResponse<T> {
  if (!items || items.length === 0) {
    const rawSize = options?.pageSize ?? (options as any)?.limit ?? 10;
    return {
      items: [],
      data: [],
      total: 0,
      page: 1,
      pageSize: rawSize,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    };
  }

  const opts = options || {};

  // 1. Filter
  const filtered = filterItems(items, opts);

  // 2. Sort
  const sorted = sortItems(filtered, {
    sortBy: opts.sortBy,
    sortOrder: opts.sortOrder,
    multiSort: opts.multiSort,
    searchQuery: opts.search,
  });

  // 3. Paginate
  return paginateItems(sorted, {
    page: opts.page,
    pageSize: opts.pageSize ?? (opts as any)?.limit,
  });
}
