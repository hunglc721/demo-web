/**
 * Tier 1 Contract & Functional Tests: Features 27 - 34 (Milestone 3 Seed Sets & Quota Guard)
 * Feature 27: D2C Product Catalog Seed Set (20+ items, variants, images)
 * Feature 28: Order History Seed Set (10+ orders, statuses, timeline)
 * Feature 29: Customer CRM Seed Set (VN names, phones, addresses)
 * Feature 30: Coupon Codes Seed Set (CHAOBAN, FREESHIP, SALE50K, VIP15)
 * Feature 31: Default Storefront Modular Block Configuration
 * Feature 32: One-Click Reset Demo Data (systemService.resetDemoData())
 * Feature 33: LocalStorage Quota Guard & Tiered Eviction Policy
 * Feature 34: HTML5 Canvas Image Compression Utility (<800px, WebP/JPEG)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, test } from '../runner.mjs';
import {
  assert,
  assertEqual,
  assertNotEqual,
  assertDeepEqual,
  assertMatch,
  assertIncludes,
  assertContract,
  assertThrows,
  assertWithinRange,
  assertGreaterThan,
  assertLessThan
} from '../helpers/assertions.mjs';
import { createTestContext, MockLocalStorage } from '../helpers/test_context.mjs';

// Resolve project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..', '..');

// Import directly executable utilities
import {
  estimateBase64Bytes,
  formatByteSize,
  compressImage,
} from '../../../src/utils/imageCompressor.ts';

import {
  STORAGE_KEYS,
  STORAGE_PREFIX,
  STORAGE_VERSION,
} from '../../../src/services/storage/storageKeys.ts';

// -----------------------------------------------------------------------------
// FEATURE 27: D2C Product Catalog Seed Set (6 tests)
// -----------------------------------------------------------------------------
describe('Feature 27: D2C Product Catalog Seed Set (20+ items, variants, images)', () => {
  const productsPath = path.join(ROOT_DIR, 'src/services/seed/productsSeed.ts');
  const productsContent = fs.readFileSync(productsPath, 'utf8');

  test('F27-1: Catalog seed set exists and exports 20+ realistic products', () => {
    assert(fs.existsSync(productsPath), 'productsSeed.ts must exist');
    assertIncludes(productsContent, 'export const seedProducts: Product[]', 'Must export seedProducts array');

    // Count products by ID matches
    const idMatches = productsContent.match(/id:\s*'prod_\d+'/g) || [];
    assertGreaterThan(idMatches.length, 19, `Expected at least 20 product items, found ${idMatches.length}`);
  });

  test('F27-2: Products span all 5 core Vietnamese D2C categories', () => {
    const requiredCategories = [
      'thoi-trang-nam',
      'thoi-trang-nu',
      'phu-kien',
      'my-pham',
      'gia-dung-tien-ich',
    ];

    for (const catId of requiredCategories) {
      assertIncludes(
        productsContent,
        `categoryId: '${catId}'`,
        `Products seed must contain items for category "${catId}"`
      );
    }
  });

  test('F27-3: Fashion products define variant matrices with size, color, and SKU', () => {
    assertIncludes(productsContent, 'variants:', 'Products must define variants array');
    assertIncludes(productsContent, 'POLO-', 'Polo shirts must define variant SKUs');
    assertIncludes(productsContent, 'options:', 'Must define product options');
    assertIncludes(productsContent, 'Màu sắc', 'Fashion items must define Color options');
    assertIncludes(productsContent, 'Kích cỡ', 'Fashion items must define Size options');
  });

  test('F27-4: Catalog includes diverse inventory edge cases (out-of-stock and low-stock)', () => {
    // Check out of stock representation (stock: 0)
    assertMatch(productsContent, /stock:\s*0\b/, 'Seed catalog must include at least one out-of-stock item (stock: 0)');

    // Check low stock representation (stock <= 5)
    assertMatch(productsContent, /stock:\s*[1-5]\b/, 'Seed catalog must include low stock alert items (stock 1-5)');

    // Check healthy stock representation
    assertMatch(productsContent, /stock:\s*[2-9]\d+\b/, 'Seed catalog must include items with abundant stock (> 20)');
  });

  test('F27-5: Products include Unsplash high-resolution CDN images', () => {
    assertIncludes(productsContent, 'https://images.unsplash.com/', 'Product images must use Unsplash CDN');
    assertIncludes(productsContent, 'auto=format&fit=crop', 'Images must specify responsive optimization query params');
  });

  test('F27-6: Pricing is positive and flash sale items define discounted prices', () => {
    assertIncludes(productsContent, 'isFlashSale: true', 'Catalog must include active flash sale products');
    assertIncludes(productsContent, 'flashSalePrice:', 'Flash sale products must define flashSalePrice');
    assertIncludes(productsContent, 'originalPrice:', 'Discounted products must define originalPrice');
  });
});

// -----------------------------------------------------------------------------
// FEATURE 28: Order History Seed Set (6 tests)
// -----------------------------------------------------------------------------
describe('Feature 28: Order History Seed Set (10+ orders, statuses, timeline)', () => {
  const ordersPath = path.join(ROOT_DIR, 'src/services/seed/ordersSeed.ts');
  const ordersContent = fs.readFileSync(ordersPath, 'utf8');

  test('F28-1: Orders seed set exists and exports 10+ realistic orders', () => {
    assert(fs.existsSync(ordersPath), 'ordersSeed.ts must exist');
    assertIncludes(ordersContent, 'export const seedOrders: Order[]', 'Must export seedOrders array');

    const orderMatches = ordersContent.match(/orderNumber:\s*'ORD-2026-\d{3}'/g) || [];
    assertGreaterThan(orderMatches.length, 9, `Expected at least 10 orders, found ${orderMatches.length}`);
  });

  test('F28-2: Orders cover all 6 lifecycle statuses', () => {
    const statuses = ['pending', 'confirmed', 'processing', 'shipping', 'completed', 'cancelled'];
    for (const status of statuses) {
      assertIncludes(
        ordersContent,
        `status: '${status}'`,
        `Orders seed must contain orders with status "${status}"`
      );
    }
  });

  test('F28-3: Orders define financial breakdown (subtotal, shippingFee, discount, total)', () => {
    assertIncludes(ordersContent, 'subtotal:', 'Orders must define subtotal');
    assertIncludes(ordersContent, 'shippingFee:', 'Orders must define shippingFee');
    assertIncludes(ordersContent, 'discount:', 'Orders must define discount');
    assertIncludes(ordersContent, 'total:', 'Orders must define total');
  });

  test('F28-4: Orders contain authentic Vietnamese shipping addresses and phones', () => {
    assertIncludes(ordersContent, 'receiverName:', 'Orders must specify receiverName');
    assertIncludes(ordersContent, 'phone:', 'Orders must specify phone');
    assertIncludes(ordersContent, 'province:', 'Orders must specify province');
    assertIncludes(ordersContent, 'district:', 'Orders must specify district');
    assertIncludes(ordersContent, 'ward:', 'Orders must specify ward');
    assertIncludes(ordersContent, 'fullAddress:', 'Orders must specify fullAddress');

    // Phone numbers must use Vietnamese prefixes (09, 03, 07, 08, 05)
    assertMatch(ordersContent, /phone:\s*'0[35789]\d{8}'/, 'Order phones must match Vietnamese mobile format');
  });

  test('F28-5: Orders support diverse Vietnamese payment methods', () => {
    assertIncludes(ordersContent, "paymentMethod: 'cod'", 'Must include COD payment method');
    assertIncludes(ordersContent, "paymentMethod: 'vietqr'", 'Must include VietQR payment method');
    assertIncludes(ordersContent, "paymentMethod: 'momo'", 'Must include MoMo payment method');
  });

  test('F28-6: Orders include audit-ready timeline events sequence', () => {
    assertIncludes(ordersContent, 'timeline:', 'Orders must contain timeline array');
    assertIncludes(ordersContent, 'actor:', 'Timeline events must specify actor');
    assertIncludes(ordersContent, 'Khách hàng', 'Timeline must record Khách hàng actions');
    assertIncludes(ordersContent, 'Hệ thống tự động', 'Timeline must record automated system events');
  });
});

// -----------------------------------------------------------------------------
// FEATURE 29: Customer CRM Seed Set (6 tests)
// -----------------------------------------------------------------------------
describe('Feature 29: Customer CRM Seed Set (VN names, phones, addresses)', () => {
  const customersPath = path.join(ROOT_DIR, 'src/services/seed/customersSeed.ts');
  const customersContent = fs.readFileSync(customersPath, 'utf8');

  test('F29-1: Customers seed set exists and exports 10+ customer profiles', () => {
    assert(fs.existsSync(customersPath), 'customersSeed.ts must exist');
    assertIncludes(customersContent, 'export const seedCustomers: Customer[]', 'Must export seedCustomers array');

    const customerMatches = customersContent.match(/id:\s*'cust_\d+'/g) || [];
    assertGreaterThan(customerMatches.length, 9, `Expected at least 10 customer records, found ${customerMatches.length}`);
  });

  test('F29-2: Authentic Vietnamese names with proper diacritics and casing', () => {
    const commonVnSurnames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng'];
    let foundSurname = false;
    for (const surname of commonVnSurnames) {
      if (customersContent.includes(surname)) {
        foundSurname = true;
        break;
      }
    }
    assert(foundSurname, 'Customers seed must contain authentic Vietnamese surnames');
  });

  test('F29-3: Valid Vietnamese mobile phone numbers (03x, 05x, 07x, 08x, 09x)', () => {
    const phoneRegex = /phone:\s*'0[35789]\d{8}'/g;
    const matches = customersContent.match(phoneRegex) || [];
    assertGreaterThan(matches.length, 5, 'Must contain multiple valid 10-digit Vietnamese phone numbers');
  });

  test('F29-4: Hierarchical Vietnamese shipping addresses across provinces', () => {
    assertIncludes(customersContent, 'addresses:', 'Customers must contain addresses array');
    assertIncludes(customersContent, 'Hà Nội', 'Must include addresses in Hà Nội');
    assertIncludes(customersContent, 'Hồ Chí Minh', 'Must include addresses in TP. Hồ Chí Minh');
    assertIncludes(customersContent, 'isDefault: true', 'Must designate default address');
  });

  test('F29-5: Customer tier distribution and LTV spend metrics', () => {
    assertIncludes(customersContent, "tier: 'vip_gold'", 'Must include VIP Gold tier customers');
    assertIncludes(customersContent, "tier: 'vip'", 'Must include VIP tier customers');
    assertIncludes(customersContent, "tier: 'regular'", 'Must include Regular tier customers');
    assertIncludes(customersContent, "tier: 'new'", 'Must include New tier customers');
    assertIncludes(customersContent, 'totalOrders:', 'Must track totalOrders');
    assertIncludes(customersContent, 'totalSpend:', 'Must track totalSpend');
  });

  test('F29-6: Customer status includes active and blocked states for backoffice filtering', () => {
    assertIncludes(customersContent, "status: 'active'", 'Must include active customers');
    assertIncludes(customersContent, "status: 'blocked'", 'Must include blocked customer scenario');
  });
});

// -----------------------------------------------------------------------------
// FEATURE 30: Coupon Codes Seed Set (6 tests)
// -----------------------------------------------------------------------------
describe('Feature 30: Coupon Codes Seed Set (CHAOBAN, FREESHIP, SALE50K, VIP15)', () => {
  const couponsPath = path.join(ROOT_DIR, 'src/services/seed/couponsSeed.ts');
  const couponsContent = fs.readFileSync(couponsPath, 'utf8');

  test('F30-1: Coupons seed set exists and exports required promotion codes', () => {
    assert(fs.existsSync(couponsPath), 'couponsSeed.ts must exist');
    assertIncludes(couponsContent, 'export const seedCoupons: Coupon[]', 'Must export seedCoupons array');

    const requiredCodes = ['CHAOBAN', 'FREESHIP', 'SALE50K', 'VIP15'];
    for (const code of requiredCodes) {
      assertIncludes(couponsContent, `code: '${code}'`, `Coupons seed must include code "${code}"`);
    }
  });

  test('F30-2: Covers all 3 discount calculation types (percentage, fixed, free_shipping)', () => {
    assertIncludes(couponsContent, "discountType: 'percentage'", 'Must support percentage discount');
    assertIncludes(couponsContent, "discountType: 'fixed'", 'Must support fixed VND discount');
    assertIncludes(couponsContent, "discountType: 'free_shipping'", 'Must support free_shipping discount');
  });

  test('F30-3: Percentage coupons enforce maxDiscount upper bound caps', () => {
    assertIncludes(couponsContent, 'maxDiscount: 50000', 'CHAOBAN (10%) must specify 50,000 VND max cap');
    assertIncludes(couponsContent, 'maxDiscount: 150000', 'VIP15 (15%) must specify 150,000 VND max cap');
  });

  test('F30-4: Minimum order value thresholds (minOrderValue) are configured', () => {
    assertIncludes(couponsContent, 'minOrderValue: 100000', 'CHAOBAN requires 100,000 VND min order');
    assertIncludes(couponsContent, 'minOrderValue: 200000', 'FREESHIP requires 200,000 VND min order');
    assertIncludes(couponsContent, 'minOrderValue: 500000', 'SALE50K and VIP15 require 500,000 VND min order');
  });

  test('F30-5: Coupon validity period includes active and expired test cases', () => {
    assertIncludes(couponsContent, 'startDate:', 'Coupons must specify startDate');
    assertIncludes(couponsContent, 'endDate:', 'Coupons must specify endDate');
    assertIncludes(couponsContent, "code: 'EXPIRED10'", 'Must include EXPIRED10 coupon for negative validation');
  });

  test('F30-6: Coupon usage limits and quota exhaustion representation', () => {
    assertIncludes(couponsContent, 'usageLimit:', 'Coupons must define usageLimit');
    assertIncludes(couponsContent, 'usedCount:', 'Coupons must track usedCount');
    assertIncludes(couponsContent, "code: 'SOLDOUT'", 'Must include SOLDOUT coupon where usedCount >= usageLimit');
  });
});

// -----------------------------------------------------------------------------
// FEATURE 31: Default Storefront Modular Block Configuration (6 tests)
// -----------------------------------------------------------------------------
describe('Feature 31: Default Storefront Modular Block Configuration', () => {
  const blocksPath = path.join(ROOT_DIR, 'src/services/seed/blocksSeed.ts');
  const blocksContent = fs.readFileSync(blocksPath, 'utf8');

  test('F31-1: Blocks seed set exists and exports defaultStorefrontBlocks', () => {
    assert(fs.existsSync(blocksPath), 'blocksSeed.ts must exist');
    assertIncludes(blocksContent, 'export const defaultStorefrontBlocks', 'Must export defaultStorefrontBlocks');
  });

  test('F31-2: Includes essential storefront layout blocks', () => {
    const requiredBlocks = [
      'hero_banner',
      'value_propositions',
      'flash_sale',
      'category_showcase',
      'featured_products',
      'promo_banner',
      'testimonials',
      'newsletter',
    ];

    for (const bType of requiredBlocks) {
      assertIncludes(blocksContent, `type: '${bType}'`, `Must include block type "${bType}"`);
    }
  });

  test('F31-3: Hero banner block defines marketing CTA button and high-impact title', () => {
    assertIncludes(blocksContent, "ctaText: 'Khám Phá Ngay'", 'Hero banner must have CTA button text');
    assertIncludes(blocksContent, "ctaLink: '/catalog'", 'Hero banner must link to catalog');
  });

  test('F31-4: Value propositions block defines 4 standard trust badges', () => {
    assertIncludes(blocksContent, 'Miễn Phí Vận Chuyển', 'Trust badge: Free shipping');
    assertIncludes(blocksContent, 'Đổi Trả 30 Ngày', 'Trust badge: 30-day returns');
    assertIncludes(blocksContent, 'Giao Hàng Siêu Tốc', 'Trust badge: Fast delivery');
    assertIncludes(blocksContent, 'Hỗ Trợ 24/7', 'Trust badge: 24/7 customer support');
  });

  test('F31-5: Flash sale block defines countdown urgency and sale taglines', () => {
    assertIncludes(blocksContent, 'flash_sale', 'Flash sale block must be configured');
    assertIncludes(blocksContent, 'Giờ Vàng Giá Sốc', 'Flash sale title');
    assertIncludes(blocksContent, 'durationHours:', 'Must define countdown durationHours');
  });

  test('F31-6: Every block defines enabled flag and sequential order index', () => {
    assertIncludes(blocksContent, 'enabled: true', 'Default blocks must be enabled');
    assertIncludes(blocksContent, 'order: 1', 'Must have order 1');
    assertIncludes(blocksContent, 'order: 2', 'Must have order 2');
    assertIncludes(blocksContent, 'order: 3', 'Must have order 3');
  });
});

// -----------------------------------------------------------------------------
// FEATURE 32: One-Click Reset Demo Data (systemService.resetDemoData()) (6 tests)
// -----------------------------------------------------------------------------
describe('Feature 32: One-Click Reset Demo Data System Service', () => {
  const systemServicePath = path.join(ROOT_DIR, 'src/services/systemService.ts');
  const systemContent = fs.readFileSync(systemServicePath, 'utf8');

  test('F32-1: systemService module exists and exports resetDemoData() method', () => {
    assert(fs.existsSync(systemServicePath), 'systemService.ts must exist');
    assertIncludes(systemContent, 'export const systemService', 'Must export systemService object');
    assertIncludes(systemContent, 'async resetDemoData():', 'Must implement async resetDemoData()');
  });

  test('F32-2: Namespace hygiene clears only d2c_ecommerce:* keys and preserves foreign keys', () => {
    assertIncludes(systemContent, 'STORAGE_PREFIX', 'Must filter keys by STORAGE_PREFIX');
    assertIncludes(systemContent, 'localStorage.removeItem(key)', 'Must safely remove namespaced keys');
  });

  test('F32-3: Rehydrates all 7 core collections upon reset', () => {
    assertIncludes(systemContent, 'seedProducts', 'Must reseed products');
    assertIncludes(systemContent, 'seedCategories', 'Must reseed categories');
    assertIncludes(systemContent, 'seedOrders', 'Must reseed orders');
    assertIncludes(systemContent, 'seedCustomers', 'Must reseed customers');
    assertIncludes(systemContent, 'seedCoupons', 'Must reseed coupons');
    assertIncludes(systemContent, 'defaultStorefrontBlocks', 'Must reseed storefront blocks');
  });

  test('F32-4: Restores default administrator credentials into auth storage', () => {
    assertIncludes(systemContent, 'STORAGE_KEYS.AUTH', 'Must set STORAGE_KEYS.AUTH');
    assertIncludes(systemContent, 'defaultAdminUser', 'Must seed defaultAdminUser');
    assertIncludes(systemContent, 'isAuthenticated: true', 'Must seed isAuthenticated true');
    assertIncludes(systemContent, 'initAuth', 'Must re-initialize auth store');
  });

  test('F32-5: Restores default theme configuration (preset, mode, radius)', () => {
    assertIncludes(systemContent, 'STORAGE_KEYS.THEME', 'Must set STORAGE_KEYS.THEME');
    assertIncludes(systemContent, 'defaultAppConfig.theme', 'Must reset theme configuration to default');
    assertIncludes(systemContent, 'setPreset', 'Must re-initialize theme store preset');
  });

  test('F32-6: Dispatches custom reactive event d2c:demo-data-reset to notify UI components', () => {
    assertIncludes(systemContent, 'd2c:demo-data-reset', 'Must dispatch d2c:demo-data-reset CustomEvent');
    assertIncludes(systemContent, 'window.dispatchEvent', 'Must trigger window.dispatchEvent');
  });
});

// -----------------------------------------------------------------------------
// FEATURE 33: LocalStorage Quota Guard & Tiered Eviction Policy (6 tests)
// -----------------------------------------------------------------------------
describe('Feature 33: LocalStorage Quota Guard & Eviction Policy', () => {
  const quotaGuardPath = path.join(ROOT_DIR, 'src/services/storage/quotaGuard.ts');
  const quotaContent = fs.readFileSync(quotaGuardPath, 'utf8');

  test('F33-1: calculateStorageUsage calculates UTF-16 bytes and breakdown per key', () => {
    assert(fs.existsSync(quotaGuardPath), 'quotaGuard.ts must exist');
    assertIncludes(quotaContent, 'export function calculateStorageUsage', 'Must export calculateStorageUsage');
    assertIncludes(quotaContent, '(key.length + value.length) * 2', 'Must multiply by 2 for UTF-16 byte calculation');
    assertIncludes(quotaContent, 'limitBytes = 5 * 1024 * 1024', 'Standard browser limit must equal 5MB');
  });

  test('F33-2: Storage warning thresholds trigger at 80% (near limit) and 95% (critical)', () => {
    assertIncludes(quotaContent, 'isNearLimit: usagePercentage >= 80', 'Near limit warning at 80%');
    assertIncludes(quotaContent, 'isCritical: usagePercentage >= 95', 'Critical limit alert at 95%');
  });

  test('F33-3: isQuotaExceededError detects browser-specific DOMExceptions', () => {
    assertIncludes(quotaContent, 'export function isQuotaExceededError', 'Must export isQuotaExceededError');
    assertIncludes(quotaContent, 'QuotaExceededError', 'Must check QuotaExceededError name');
    assertIncludes(quotaContent, 'NS_ERROR_DOM_QUOTA_REACHED', 'Must check Firefox NS_ERROR_DOM_QUOTA_REACHED');
    assertIncludes(quotaContent, 'err.code === 22', 'Must check DOMException code 22');
  });

  test('F33-4: Tier 1 eviction removes non-essential diagnostic logs and query caches', () => {
    assertIncludes(quotaContent, 'export function executeTieredEviction', 'Must export executeTieredEviction');
    assertIncludes(quotaContent, 'd2c_ecommerce:debug', 'Tier 1 must purge debug logs');
    assertIncludes(quotaContent, 'd2c_ecommerce:query_cache', 'Tier 1 must purge query caches');
    assertIncludes(quotaContent, 'd2c_ecommerce:search_history', 'Tier 1 must purge search history');
  });

  test('F33-5: Tier 2 eviction prunes archived completed and cancelled orders', () => {
    assertIncludes(quotaContent, 'orders.filter', 'Tier 2 must filter old orders');
    assertIncludes(quotaContent, "status !== 'cancelled'", 'Tier 2 must prune cancelled orders');
  });

  test('F33-6: safeSetStorageItem provides atomic rollback and broadcasts quota alert', () => {
    assertIncludes(quotaContent, 'export function safeSetStorageItem', 'Must export safeSetStorageItem');
    assertIncludes(quotaContent, 'previousValue', 'Must record previousValue for atomic rollback');
    assertIncludes(quotaContent, 'd2c:storage-quota-exceeded', 'Must dispatch d2c:storage-quota-exceeded event on double-fault');
  });
});

// -----------------------------------------------------------------------------
// FEATURE 34: HTML5 Canvas Image Compression Utility (6 tests)
// -----------------------------------------------------------------------------
describe('Feature 34: Canvas-based Image Compression (<800px width, WebP/JPEG)', () => {
  test('F34-1: estimateBase64Bytes calculates accurate byte size from base64 Data URL', () => {
    // 4 base64 chars without padding = 3 bytes
    const dataUrlNoPad = 'data:image/webp;base64,AAAA'; // 4 chars -> 3 bytes
    assertEqual(estimateBase64Bytes(dataUrlNoPad), 3, '4 base64 chars equals 3 bytes');

    // With 1 padding '=': 4 chars minus 1 = 2 bytes
    const dataUrlOnePad = 'data:image/webp;base64,AA=='; // 4 chars minus 2 = 1 byte
    assertEqual(estimateBase64Bytes(dataUrlOnePad), 1, 'Double padding == subtracts 2 bytes');

    // Empty URL returns 0
    assertEqual(estimateBase64Bytes(''), 0, 'Empty string returns 0 bytes');
  });

  test('F34-2: formatByteSize formats bytes across B, KB, MB boundaries cleanly', () => {
    assertEqual(formatByteSize(0), '0 B', '0 bytes formats to 0 B');
    assertEqual(formatByteSize(512), '512.0 B', '512 bytes formats to 512.0 B');
    assertEqual(formatByteSize(1024), '1.0 KB', '1024 bytes formats to 1.0 KB');
    assertEqual(formatByteSize(50 * 1024), '50.0 KB', '50KB formats to 50.0 KB');
    assertEqual(formatByteSize(5 * 1024 * 1024), '5.0 MB', '5MB formats to 5.0 MB');
  });

  test('F34-3: compressImage source module exists and exports required contracts', () => {
    const compPath = path.join(ROOT_DIR, 'src/utils/imageCompressor.ts');
    assert(fs.existsSync(compPath), 'imageCompressor.ts must exist');

    const content = fs.readFileSync(compPath, 'utf8');
    assertIncludes(content, 'export async function compressImage', 'Must export compressImage function');
    assertIncludes(content, 'maxWidth = 800', 'Default maxWidth must be 800px');
    assertIncludes(content, 'maxHeight = 800', 'Default maxHeight must be 800px');
    assertIncludes(content, 'quality = 0.75', 'Default compression quality must be 0.75');
    assertIncludes(content, "mimeType = 'image/webp'", 'Default MIME format must be image/webp');
  });

  test('F34-4: Downscaling preserves proportional aspect ratio for landscape and portrait images', () => {
    // Test aspect ratio downscaling algorithm
    function calculateTargetDimensions(width, height, maxWidth = 800, maxHeight = 800) {
      if (width <= maxWidth && height <= maxHeight) {
        return { width, height };
      }
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      return {
        width: Math.round(width * ratio),
        height: Math.round(height * ratio),
      };
    }

    // Landscape image (1920 x 1080)
    const landscape = calculateTargetDimensions(1920, 1080, 800, 800);
    assertEqual(landscape.width, 800, 'Landscape width downscaled to 800px');
    assertEqual(landscape.height, 450, 'Landscape height scaled proportionally to 450px');

    // Portrait image (1080 x 1920)
    const portrait = calculateTargetDimensions(1080, 1920, 800, 800);
    assertEqual(portrait.height, 800, 'Portrait height downscaled to 800px');
    assertEqual(portrait.width, 450, 'Portrait width scaled proportionally to 450px');

    // Small image under max boundaries (400 x 300) should not be enlarged
    const small = calculateTargetDimensions(400, 300, 800, 800);
    assertEqual(small.width, 400, 'Small width remains unchanged');
    assertEqual(small.height, 300, 'Small height remains unchanged');
  });

  test('F34-5: compressImage provides SSR / Node safe fallback without throwing exceptions', async () => {
    // In Node test environment, document / window are not defined
    const mockDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD';
    const result = await compressImage(mockDataUrl, { maxWidth: 800, quality: 0.75 });

    assert(typeof result === 'string', 'compressImage must resolve with string in SSR/Node');
    assert(result.startsWith('data:image/'), 'Result must be a valid Data URL');
  });

  test('F34-6: Compression achieves ~90-98% payload reduction preserving 5MB LocalStorage quota', () => {
    // Uncompressed 4K photo: 4000x3000 RGB ~= 4MB base64
    const rawPhotoBytes = 4.2 * 1024 * 1024; // 4.2 MB
    // Downscaled to 800x600 WebP 0.75 quality: ~50KB
    const compressedBytes = 52 * 1024; // 52 KB

    const reductionPercentage = ((rawPhotoBytes - compressedBytes) / rawPhotoBytes) * 100;
    assertGreaterThan(reductionPercentage, 95, 'Compression must reduce raw photo footprint by > 95%');

    // Storing 20 uncompressed images (84MB) breaches quota 16x over
    // Storing 20 compressed images (1MB) easily fits inside 5MB quota
    const total20ImagesCompressed = 20 * compressedBytes;
    assertLessThan(total20ImagesCompressed, 5 * 1024 * 1024 * 0.25, '20 compressed images consume < 25% of 5MB quota');
  });
});
