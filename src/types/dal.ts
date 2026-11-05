/**
 * Data Access Layer (DAL) Core Contracts & Interfaces
 */

export type SortOrder = 'asc' | 'desc';

export interface PaginationParams {
  page?: number;     // 1-indexed, default 1
  pageSize?: number; // default 10 or 20
}

export interface SortParams<T = any> {
  sortBy?: keyof T | string;
  sortOrder?: SortOrder;
}

export interface BaseFilter<T = any> extends PaginationParams, SortParams<T> {
  search?: string;        // Accent-insensitive text query
  ids?: string[];         // Batch ID filtering
  status?: string | string[];
  dateFrom?: string;      // ISO Date
  dateTo?: string;        // ISO Date
  [key: string]: any;     // Custom domain facet filters
}

export type FilterParams<T = any> = BaseFilter<T>;

/**
 * Standardized Paginated Response Envelope
 * Provides dual `items` and `data` properties for universal component compatibility.
 */
export interface PaginatedResponse<T> {
  items: T[];           // Primary standard field
  data: T[];            // Canonical alias pointing to the identical array slice
  total: number;        // Total records matching filter
  page: number;         // Current 1-indexed page
  pageSize: number;     // Number of items per page
  totalPages: number;   // Total calculated pages: Math.ceil(total / pageSize)
  hasNextPage: boolean; // Helper flag: page < totalPages
  hasPrevPage: boolean; // Helper flag: page > 1
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  field?: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiErrorDetail;
  message?: string;
  statusCode?: number;
  timestamp?: string;
}

/**
 * Generic DAL repository interface contract
 */
export interface IRepository<
  T extends { id: TId },
  TId = string,
  TFilter extends PaginationParams = BaseFilter<T>
> {
  /** Retrieves paginated records matching the provided filter */
  getAll(filter?: TFilter): Promise<PaginatedResponse<T>>;

  /** Retrieves a single record by its primary key ID */
  getById(id: TId): Promise<T | null>;

  /** Retrieves all records matching filter without pagination (for dropdowns, exports) */
  findMany(filter?: Omit<TFilter, 'page' | 'pageSize'>): Promise<T[]>;

  /** Checks if a record exists by primary key */
  exists(id: TId): Promise<boolean>;

  /** Returns total count of records matching filter */
  count(filter?: Omit<TFilter, 'page' | 'pageSize'>): Promise<number>;

  /** Creates and persists a new record */
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<T, 'id'>>): Promise<T>;

  /** Updates an existing record by ID */
  update(id: TId, data: Partial<T>): Promise<T>;

  /** Deletes a record by ID */
  delete(id: TId): Promise<boolean>;

  /** Bulk inserts or seeds records */
  bulkCreate(items: Array<Omit<T, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<T, 'id'>>>): Promise<T[]>;

  /** Bulk deletes records by an array of IDs */
  bulkDelete(ids: TId[]): Promise<number>;

  /** Clears all records for this repository */
  clear(): Promise<void>;
}

/**
 * Standard typed DAL API Error
 */
export class DalApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly timestamp: string;
  readonly details?: unknown;

  get status(): number {
    return this.statusCode;
  }

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', details?: unknown) {
    super(message);
    this.name = 'DalApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.timestamp = new Date().toISOString();
    this.details = details;
    Object.setPrototypeOf(this, DalApiError.prototype);
  }
}
