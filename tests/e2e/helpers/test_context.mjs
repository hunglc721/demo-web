/**
 * E2E Isolated Test Environment & Mock Storage Context
 * Guarantees hermetic state across all test runs.
 */

export class MockLocalStorage {
  constructor(options = {}) {
    this._store = new Map();
    this.quotaBytes = options.quotaBytes || 5 * 1024 * 1024; // 5MB standard LocalStorage limit
    this.enforceQuota = options.enforceQuota ?? true;
  }

  get length() {
    return this._store.size;
  }

  key(index) {
    const keys = Array.from(this._store.keys());
    return keys[index] ?? null;
  }

  getItem(key) {
    const k = String(key);
    return this._store.has(k) ? this._store.get(k) : null;
  }

  setItem(key, value) {
    const k = String(key);
    const val = String(value);

    if (this.enforceQuota) {
      let currentBytes = 0;
      for (const [existingKey, existingVal] of this._store.entries()) {
        if (existingKey !== k) {
          currentBytes += (existingKey.length + existingVal.length) * 2;
        }
      }
      const newBytes = currentBytes + (k.length + val.length) * 2;
      if (newBytes > this.quotaBytes) {
        const error = new Error('DOMException: QuotaExceededError - LocalStorage quota exceeded');
        error.name = 'QuotaExceededError';
        throw error;
      }
    }

    this._store.set(k, val);
  }

  removeItem(key) {
    this._store.delete(String(key));
  }

  clear() {
    this._store.clear();
  }

  dump() {
    const obj = {};
    for (const [k, v] of this._store.entries()) {
      obj[k] = v;
    }
    return obj;
  }
}

export function createTestContext(options = {}) {
  const storage = new MockLocalStorage(options);

  // Install storage into global environment if running in node without DOM
  if (typeof globalThis.localStorage === 'undefined' || options.forceGlobalMock) {
    globalThis.localStorage = storage;
  }

  return {
    storage,
    reset() {
      storage.clear();
    },
    getNamespacedKeys(prefix = 'd2c_ecommerce:') {
      const keys = [];
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i);
        if (k && k.startsWith(prefix)) {
          keys.push(k);
        }
      }
      return keys;
    }
  };
}
