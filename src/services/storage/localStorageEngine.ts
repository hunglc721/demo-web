/**
 * LocalStorage Engine with In-Memory Fallback and Safe Serialization
 */

import { safeSetStorageItem } from './quotaGuard';

export class MemoryStorageFallback {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }

  get length(): number {
    return this.store.size;
  }
}

export const memoryStorage = new MemoryStorageFallback();

export function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return false;
  }
  try {
    const testKey = '__d2c_storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function safeJsonStringify<T>(value: T, fallback = '[]'): string {
  try {
    return JSON.stringify(value);
  } catch {
    return fallback;
  }
}

export class LocalStorageEngine {
  private useMemory: boolean;

  constructor() {
    this.useMemory = !isLocalStorageAvailable();
  }

  public getItem(key: string): string | null {
    if (this.useMemory) {
      return memoryStorage.getItem(key);
    }
    try {
      return localStorage.getItem(key);
    } catch {
      return memoryStorage.getItem(key);
    }
  }

  public setItem(key: string, value: string): boolean {
    if (this.useMemory) {
      memoryStorage.setItem(key, value);
      return true;
    }
    const success = safeSetStorageItem(key, value);
    if (!success) {
      // Fallback to in-memory to prevent app disruption
      memoryStorage.setItem(key, value);
    }
    return success;
  }

  public removeItem(key: string): void {
    if (this.useMemory) {
      memoryStorage.removeItem(key);
      return;
    }
    try {
      localStorage.removeItem(key);
    } catch {
      memoryStorage.removeItem(key);
    }
  }

  public clear(): void {
    if (this.useMemory) {
      memoryStorage.clear();
      return;
    }
    try {
      localStorage.clear();
    } catch {
      memoryStorage.clear();
    }
  }
}

export const storageEngine = new LocalStorageEngine();
