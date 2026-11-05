/**
 * System Service & Factory Reset (Reset Demo Data)
 */

import { ISystemService, ResetDemoDataResult, StorageUsageReport } from './contracts/ISystemService';
import { STORAGE_KEYS, STORAGE_PREFIX } from './storage/storageKeys';
import { calculateStorageUsage } from './storage/quotaGuard';
import { seedProducts } from './seed/productsSeed';
import { seedCategories } from './seed/categoriesSeed';
import { seedOrders } from './seed/ordersSeed';
import { seedCustomers } from './seed/customersSeed';
import { seedCoupons } from './seed/couponsSeed';
import { defaultStorefrontBlocks } from './seed/blocksSeed';
import { seedReviews } from './seed/reviewsSeed';
import { productService } from './api/productService';
import { orderService } from './api/orderService';
import { customerService } from './api/customerService';
import { couponService } from './api/couponService';
import { blockService } from './api/blockService';
import { reviewService } from './api/reviewService';
import { defaultAdminUser, useAuthStore } from '@/stores/authStore';
import { defaultAppConfig } from '@/config/appConfig';
import { useThemeStore } from '@/stores/themeStore';
import { useCartStore } from '@/stores/cartStore';

export class SystemService implements ISystemService {
  /**
   * Resets all demo data to initial seed baseline.
   * Cleanses namespaced keys, rehydrates storage, resets in-memory repos and Zustand stores,
   * and broadcasts global events.
   */
  public async resetDemoData(): Promise<ResetDemoDataResult> {
    const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
    const clearedKeys: string[] = [];

    if (isBrowser) {
      // 1. Scan and clear all application namespaced keys
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith(STORAGE_PREFIX) || key.startsWith('d2c_'))) {
          localStorage.removeItem(key);
          clearedKeys.push(key);
        }
      }

      // 2. Rehydrate baseline seed collections into localStorage
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(seedProducts));
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(seedCategories));
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(seedOrders));
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(seedCustomers));
      localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(seedCoupons));
      localStorage.setItem(STORAGE_KEYS.BLOCKS, JSON.stringify(defaultStorefrontBlocks));

      // Rehydrate auth, cart, theme
      localStorage.setItem(
        STORAGE_KEYS.AUTH,
        JSON.stringify({ user: defaultAdminUser, isAuthenticated: true })
      );
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify([]));
      localStorage.setItem(
        STORAGE_KEYS.THEME,
        JSON.stringify({
          mode: defaultAppConfig.theme.mode,
          preset: defaultAppConfig.theme.preset,
          radius: defaultAppConfig.theme.radius,
        })
      );
    }

    // 3. Reset in-memory repository caches
    try {
      productService.getRepository().resetToSeed();
      orderService.getRepository().resetToSeed();
      customerService.getRepository().resetToSeed();
      couponService.getRepository().resetToSeed();
      blockService.getRepository().resetToSeed();
      reviewService.getRepository().resetToSeed();
    } catch {
      // Repositories might not be loaded yet
    }

    // 4. Synchronize in-memory Zustand stores
    try {
      useThemeStore.getState().setMode(defaultAppConfig.theme.mode);
      useThemeStore.getState().setPreset(defaultAppConfig.theme.preset);
      useThemeStore.getState().setRadius(defaultAppConfig.theme.radius);
      useAuthStore.getState().initAuth();
      useCartStore.getState().clearCart();
    } catch {
      // Ignore store sync errors
    }

    const seededCollections: Record<string, number> = {
      products: seedProducts.length,
      categories: seedCategories.length,
      orders: seedOrders.length,
      customers: seedCustomers.length,
      coupons: seedCoupons.length,
      blocks: defaultStorefrontBlocks.length,
      reviews: seedReviews.length,
    };

    // 5. Broadcast reset events
    if (isBrowser && typeof window.dispatchEvent === 'function') {
      const resetEvent = new CustomEvent('d2c:demo-data-reset', {
        detail: {
          timestamp: Date.now(),
          clearedKeys,
          seededCollections,
        },
      });
      window.dispatchEvent(resetEvent);

      try {
        window.dispatchEvent(new Event('storage'));
      } catch {
        // Ignore
      }
    }

    return {
      success: true,
      clearedKeys,
      seededCollections,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Auto-boot check: hydrates seed data if keys are missing from storage.
   */
  public initSeedIfEmpty(): void {
    if (typeof localStorage === 'undefined') return;

    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(seedProducts));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(seedCategories));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(seedOrders));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(seedCustomers));
    }
    if (!localStorage.getItem(STORAGE_KEYS.COUPONS)) {
      localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(seedCoupons));
    }
    if (!localStorage.getItem(STORAGE_KEYS.BLOCKS)) {
      localStorage.setItem(STORAGE_KEYS.BLOCKS, JSON.stringify(defaultStorefrontBlocks));
    }
    if (!localStorage.getItem(STORAGE_KEYS.REVIEWS)) {
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(seedReviews));
    }
  }

  /**
   * Generates a real-time storage usage report across all browser storage keys.
   */
  public getStorageReport(): StorageUsageReport {
    return calculateStorageUsage();
  }
}

export const systemService = new SystemService();
