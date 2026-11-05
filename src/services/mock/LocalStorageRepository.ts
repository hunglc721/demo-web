/**
 * Generic LocalStorage Repository Implementation
 * Provides in-memory caching, cross-tab synchronization, query pipeline integration,
 * mock latency, chaos error injection, and QuotaGuard persistence.
 */

import { IRepository, BaseFilter, PaginatedResponse, DalApiError } from '@/types/dal';
import { mockEngine } from './mockEngine';
import { safeSetStorageItem } from '../storage/quotaGuard';
import { applyQueryPipeline, filterItems, sortItems } from '../queryEngine';

export class LocalStorageRepository<
  T extends { id: string; createdAt?: string; updatedAt?: string },
  TFilter extends BaseFilter<T> = BaseFilter<T>
> implements IRepository<T, string, TFilter> {
  protected readonly storageKey: string;
  protected readonly initialSeed: T[];
  private cache: T[] | null = null;
  private isBrowser: boolean;

  constructor(storageKey: string, initialSeed: T[] = []) {
    this.storageKey = storageKey;
    this.initialSeed = initialSeed;
    this.isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
    this.initStorage();
    this.setupCrossTabSync();
  }

  private initStorage(): void {
    if (!this.isBrowser) {
      this.cache = this.deepClone(this.initialSeed);
      return;
    }

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        this.cache = this.deepClone(this.initialSeed);
        this.persist(this.cache);
      } else {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.cache = parsed;
        } else if (Array.isArray(parsed) && parsed.length === 0 && this.initialSeed.length > 0) {
          // If stored is empty array but seed data exists, hydrate seed
          this.cache = this.deepClone(this.initialSeed);
          this.persist(this.cache);
        } else if (Array.isArray(parsed)) {
          this.cache = parsed;
        } else {
          this.cache = this.deepClone(this.initialSeed);
          this.persist(this.cache);
        }
      }
    } catch {
      this.cache = this.deepClone(this.initialSeed);
    }
  }

  private setupCrossTabSync(): void {
    if (!this.isBrowser) return;

    window.addEventListener('storage', (e: StorageEvent) => {
      if (e.key === this.storageKey) {
        if (!e.newValue) {
          this.cache = [];
          return;
        }
        try {
          const updated = JSON.parse(e.newValue);
          if (Array.isArray(updated)) {
            this.cache = updated;
          }
        } catch {
          // Ignore parse errors from other tabs
        }
      } else if (e.key === null) {
        // localStorage.clear() occurred in another tab
        this.cache = [];
      }
    });
  }

  private deepClone<V>(data: V): V {
    return JSON.parse(JSON.stringify(data));
  }

  protected getRecords(): T[] {
    if (!this.cache) {
      this.initStorage();
    }
    return this.cache ? [...this.cache] : [];
  }

  protected persist(records: T[]): boolean {
    this.cache = [...records];
    if (!this.isBrowser) return true;
    return safeSetStorageItem(this.storageKey, JSON.stringify(records));
  }

  protected generateId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `id_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  public async getAll(filter?: TFilter): Promise<PaginatedResponse<T>> {
    await mockEngine.simulateDelay();
    mockEngine.maybeInjectError(`${this.storageKey}.getAll`);

    const records = this.getRecords();
    const result = applyQueryPipeline(records, filter as any);

    mockEngine.log(`${this.storageKey}.getAll returned ${result.items.length} items (total: ${result.total})`);
    return result;
  }

  public async getById(id: string): Promise<T | null> {
    await mockEngine.simulateDelay();
    mockEngine.maybeInjectError(`${this.storageKey}.getById`);

    const records = this.getRecords();
    const item = records.find((r) => r.id === id);
    return item ? this.deepClone(item) : null;
  }

  public async findMany(filter?: Omit<TFilter, 'page' | 'pageSize'>): Promise<T[]> {
    await mockEngine.simulateDelay();
    mockEngine.maybeInjectError(`${this.storageKey}.findMany`);

    let items = this.getRecords();
    if (filter) {
      items = filterItems(items, filter as any);
      items = sortItems(items, {
        sortBy: filter.sortBy as any,
        sortOrder: filter.sortOrder,
        searchQuery: filter.search,
      });
    }
    return this.deepClone(items);
  }

  public async exists(id: string): Promise<boolean> {
    const records = this.getRecords();
    return records.some((r) => r.id === id);
  }

  public async count(filter?: Omit<TFilter, 'page' | 'pageSize'>): Promise<number> {
    const items = await this.findMany(filter);
    return items.length;
  }

  public async create(
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<T, 'id'>>
  ): Promise<T> {
    await mockEngine.simulateDelay();
    mockEngine.maybeInjectError(`${this.storageKey}.create`);

    const now = new Date().toISOString();
    const id = data.id || this.generateId();
    const newRecord = {
      ...data,
      id,
      createdAt: (data as any).createdAt || now,
      updatedAt: now,
    } as unknown as T;

    const records = this.getRecords();
    records.unshift(newRecord);
    this.persist(records);

    mockEngine.log(`${this.storageKey}.create added id: ${id}`);
    return this.deepClone(newRecord);
  }

  public async update(id: string, data: Partial<T>): Promise<T> {
    await mockEngine.simulateDelay();
    mockEngine.maybeInjectError(`${this.storageKey}.update`);

    const records = this.getRecords();
    const index = records.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new DalApiError(
        `Record with ID "${id}" was not found in ${this.storageKey}.`,
        404,
        'RECORD_NOT_FOUND'
      );
    }

    const updatedRecord: T = {
      ...records[index],
      ...data,
      id, // Immutable ID
      updatedAt: new Date().toISOString(),
    };

    records[index] = updatedRecord;
    this.persist(records);

    mockEngine.log(`${this.storageKey}.update modified id: ${id}`);
    return this.deepClone(updatedRecord);
  }

  public async delete(id: string): Promise<boolean> {
    await mockEngine.simulateDelay();
    mockEngine.maybeInjectError(`${this.storageKey}.delete`);

    const records = this.getRecords();
    const filtered = records.filter((r) => r.id !== id);
    if (filtered.length === records.length) {
      return false;
    }

    this.persist(filtered);
    mockEngine.log(`${this.storageKey}.delete removed id: ${id}`);
    return true;
  }

  public async bulkCreate(
    items: Array<Omit<T, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<T, 'id'>>>
  ): Promise<T[]> {
    await mockEngine.simulateDelay();
    mockEngine.maybeInjectError(`${this.storageKey}.bulkCreate`);

    const now = new Date().toISOString();
    const createdList: T[] = items.map((item) => ({
      ...item,
      id: item.id || this.generateId(),
      createdAt: (item as any).createdAt || now,
      updatedAt: now,
    })) as unknown as T[];

    const records = this.getRecords();
    const nextRecords = [...createdList, ...records];
    this.persist(nextRecords);

    return this.deepClone(createdList);
  }

  public async bulkDelete(ids: string[]): Promise<number> {
    await mockEngine.simulateDelay();
    mockEngine.maybeInjectError(`${this.storageKey}.bulkDelete`);

    const idSet = new Set(ids);
    const records = this.getRecords();
    const remaining = records.filter((r) => !idSet.has(r.id));
    const deletedCount = records.length - remaining.length;

    this.persist(remaining);
    return deletedCount;
  }

  public async clear(): Promise<void> {
    this.persist([]);
  }

  public resetToSeed(): void {
    this.persist(this.deepClone(this.initialSeed));
  }
}

export const BaseLocalStorageRepository = LocalStorageRepository;
