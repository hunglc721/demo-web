/**
 * Central Data Access Layer & Mock Service Engine Barrel Exports
 */

// 1. Contracts & Interfaces
export * from './contracts';

// 2. Storage & Quota Management
export * from './storage/storageKeys';
export * from './storage/quotaGuard';
export * from './storage/localStorageEngine';

// 3. Mock Latency & Chaos Simulator
export * from './mock/mockLatency';
export * from './mock/mockEngine';

// 4. Base Repository Implementation
export * from './mock/LocalStorageRepository';
export * from './baseRepository';

// 5. Query Pipeline & Image Compression
export * from './queryEngine';
export {
  compressImage,
  estimateBase64Bytes,
  type ImageCompressionOptions,
} from './imageCompressor';

// 6. Seed Datasets & Helpers
export * from './seed';

// 7. Domain Services
export * from './api/productService';
export * from './api/orderService';
export * from './api/customerService';
export * from './api/couponService';
export * from './api/blockService';
export * from './api/reviewService';
export * from './systemService';
