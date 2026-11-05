/**
 * Storage Namespacing & Key Constants
 * Schema: d2c_ecommerce:<entity>:v1
 */

export const STORAGE_PREFIX = 'd2c_ecommerce';
export const STORAGE_VERSION = 'v1';

export const STORAGE_KEYS = {
  PRODUCTS: `${STORAGE_PREFIX}:products:${STORAGE_VERSION}`,
  CATEGORIES: `${STORAGE_PREFIX}:categories:${STORAGE_VERSION}`,
  ORDERS: `${STORAGE_PREFIX}:orders:${STORAGE_VERSION}`,
  CUSTOMERS: `${STORAGE_PREFIX}:customers:${STORAGE_VERSION}`,
  COUPONS: `${STORAGE_PREFIX}:coupons:${STORAGE_VERSION}`,
  SETTINGS: `${STORAGE_PREFIX}:settings:${STORAGE_VERSION}`,
  AUTH: `${STORAGE_PREFIX}:auth:${STORAGE_VERSION}`,
  THEME: `${STORAGE_PREFIX}:theme:${STORAGE_VERSION}`,
  CART: `${STORAGE_PREFIX}:cart:${STORAGE_VERSION}`,
  BLOCKS: `${STORAGE_PREFIX}:blocks:${STORAGE_VERSION}`,
  REVIEWS: `${STORAGE_PREFIX}:reviews:${STORAGE_VERSION}`,
  MOCK_CONFIG: `${STORAGE_PREFIX}:mock_config:${STORAGE_VERSION}`,
  META: `${STORAGE_PREFIX}:meta:${STORAGE_VERSION}`,
} as const;

export type StorageKeyType = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export function getEntityStorageKey(entity: string, version = STORAGE_VERSION): string {
  return `${STORAGE_PREFIX}:${entity.toLowerCase()}:${version}`;
}
