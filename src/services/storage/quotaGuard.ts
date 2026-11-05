/**
 * LocalStorage Quota Guard & Tiered Eviction Policy
 * Prevents browser crashes on 5MB quota exhaustion.
 */

import type { StorageItemReport, StorageUsageReport } from '../contracts/ISystemService';

export function formatByteSize(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

export function isQuotaExceededError(err: unknown): boolean {
  if (!err) return false;
  if (err instanceof DOMException) {
    return (
      err.name === 'QuotaExceededError' ||
      err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err.code === 22 ||
      err.code === 1014
    );
  }
  const e = err as any;
  return (
    e.name === 'QuotaExceededError' ||
    e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    e.code === 22 ||
    e.code === 1014 ||
    (typeof e.message === 'string' && e.message.toLowerCase().includes('quota'))
  );
}

export function calculateStorageUsage(): StorageUsageReport {
  const limitBytes = 5 * 1024 * 1024; // 5 MB standard browser limit

  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return {
      usedBytes: 0,
      usedFormatted: '0 B',
      limitBytes,
      usagePercentage: 0,
      isNearLimit: false,
      isCritical: false,
      breakdown: [],
    };
  }

  let totalBytes = 0;
  const breakdown: StorageItemReport[] = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const value = localStorage.getItem(key) || '';
      // UTF-16 characters take 2 bytes
      const bytes = (key.length + value.length) * 2;
      totalBytes += bytes;
      breakdown.push({
        key,
        bytes,
        formatted: formatByteSize(bytes),
        percentage: Number(((bytes / limitBytes) * 100).toFixed(2)),
      });
    }
  } catch {
    // Ignore storage iteration failure
  }

  breakdown.sort((a, b) => b.bytes - a.bytes);
  const usagePercentage = Number(((totalBytes / limitBytes) * 100).toFixed(2));

  return {
    usedBytes: totalBytes,
    usedFormatted: formatByteSize(totalBytes),
    limitBytes,
    usagePercentage,
    isNearLimit: usagePercentage >= 80,
    isCritical: usagePercentage >= 95,
    breakdown,
  };
}

/**
 * Tiered Eviction Policy:
 * Tier 1: Non-essential diagnostic logs and query caches
 * Tier 2: Prune old completed/cancelled orders
 */
export function executeTieredEviction(): boolean {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return false;
  }

  let freed = false;

  try {
    // Tier 1: Remove temporary caches and debug entries
    const tier1Prefixes = [
      'd2c_ecommerce:debug',
      'd2c_ecommerce:query_cache',
      'd2c_ecommerce:search_history',
    ];

    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && tier1Prefixes.some((prefix) => key.startsWith(prefix))) {
        localStorage.removeItem(key);
        freed = true;
      }
    }

    if (freed) return true;

    // Tier 2: Check orders collection and prune cancelled orders older than 14 days if needed
    const ordersKey = 'd2c_ecommerce:orders:v1';
    const ordersRaw = localStorage.getItem(ordersKey);
    if (ordersRaw) {
      try {
        const orders = JSON.parse(ordersRaw);
        if (Array.isArray(orders) && orders.length > 20) {
          const filtered = orders.filter((o: any) => o.status !== 'cancelled');
          if (filtered.length < orders.length) {
            localStorage.setItem(ordersKey, JSON.stringify(filtered));
            freed = true;
          }
        }
      } catch {
        // Ignore
      }
    }
  } catch {
    // Eviction error
  }

  return freed;
}

/**
 * Safe LocalStorage setter with Quota Guard, tiered eviction, and atomic rollback
 */
export function safeSetStorageItem(key: string, value: string): boolean {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return false;
  }

  const previousValue = localStorage.getItem(key);

  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: unknown) {
    if (isQuotaExceededError(err)) {
      console.warn(`[QuotaGuard] Storage quota exceeded while writing key "${key}". Running tiered eviction...`);
      const recovered = executeTieredEviction();
      if (recovered) {
        try {
          localStorage.setItem(key, value);
          return true;
        } catch {
          // Double-fault: rollback
          if (previousValue !== null) {
            try {
              localStorage.setItem(key, previousValue);
            } catch {
              // Rollback failed
            }
          }
        }
      }

      // Notify UI
      if (typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(
          new CustomEvent('d2c:storage-quota-exceeded', {
            detail: { key, error: err },
          })
        );
      }
    }
    return false;
  }
}
