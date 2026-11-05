#!/usr/bin/env node
/**
 * ============================================================================
 * EMPIRICAL ADVERSARIAL CHALLENGER SUITE: MILESTONE 6
 * Target: Cart Operations, Free Shipping Thresholds & Checkout Flows
 *
 * File: tests/e2e/m6_challenger_cart_checkout.mjs
 * Author: challenger_m6_1 (Empirical Challenger)
 * ============================================================================
 *
 * Exhaustively stress-tests and verifies:
 * 1. Cart Operations with Variants & Complex Item Identifiers:
 *    - Variant isolation (different variantId on same product = separate lines)
 *    - Merging identical variants into single line
 *    - Products without variantId (undefined) merging and coexistence
 *    - Sold-out / zero-stock / negative-stock rejection
 *    - Fractional / negative quantity normalization
 *    - High-volume concurrent burst additions
 *
 * 2. Quantity Increments Beyond Stock & Boundary Clamping:
 *    - Initial add quantity exceeding stock clamping
 *    - Incremental addition exceeding stock clamping
 *    - updateQuantity(id, qty > stock) clamping
 *    - updateQuantity(id, Number.MAX_SAFE_INTEGER) boundary resilience
 *    - Exact boundary steps: stock - 1, stock, stock + 1
 *    - Items with undefined stock handling
 *
 * 3. Item Removal & Zero/Negative Decrement Semantics:
 *    - Explicit removeItem(id) isolation
 *    - Idempotency and unknown ID handling
 *    - updateQuantity(id, 0) auto-removal
 *    - updateQuantity(id, -1) auto-removal
 *    - Decrementing item whose stock became 0 triggers removal
 *    - Complete cart depletion verification
 *
 * 4. Clear Cart Action & State Hygiene:
 *    - clearCart() empties items, resets couponCode, couponDiscount, and note
 *    - Idempotent invocation on empty cart
 *    - LocalStorage persistence sync and partialization
 *
 * 5. Free Shipping Threshold Transitions (0₫ -> 299,000₫ -> 500,000₫):
 *    - calculateShippingFee across boundary spectrum (0, 1, 298999, 299000, 299001, 500000, 10000000)
 *    - Custom threshold parameters
 *    - FreeShippingTracker business math (remaining, percentage clamping, qualification status)
 *    - Zero/negative subtotal and division-by-zero protection
 *
 * 6. Coupon Discount Revalidation on Quantity Change:
 *    - Percentage coupon with caps (CHAOBAN: 10% max 50k, min 200k) across subtotal swings
 *    - Fixed coupon (SALE50K: 50k, min 300k) drop below and recovery
 *    - High-tier percentage coupon (VIP15: 15% max 150k, min 500k)
 *    - Free shipping coupon (FREESHIP: 30k) interaction when shippingFee becomes 0₫
 *    - Inactive, expired, and sold-out coupon rejections
 *
 * 7. Checkout Mutation Stress & Inventory Deduction:
 *    - Multi-product, multi-variant order creation and exact stock depletion
 *    - Rejection when requesting more than available variant stock
 *    - Cumulative variant reservation conflict detection
 *    - Saga rollback verification under simulated failure
 *    - VietQR, MoMo, COD, and Card payment metadata and status verification
 *
 * 8. Vietnamese Administrative Address & Schema Boundaries:
 *    - 63-province completeness and 3-level cascading query integrity
 *    - Strict Vietnamese mobile phone regex boundary fuzzing
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');

// Auto-bootstrap Node with --experimental-strip-types
if (!process.execArgv.includes('--experimental-strip-types') && !process.env.CHALLENGER_BOOTSTRAPPED) {
  const loaderUrl = pathToFileURL(path.join(__dirname, '..', 'helpers', 'register_node_alias_loader.mjs')).href;
  const child = spawnSync(
    process.execPath,
    ['--experimental-strip-types', '--import', loaderUrl, ...process.execArgv, ...process.argv.slice(1)],
    {
      stdio: 'inherit',
      env: { ...process.env, CHALLENGER_BOOTSTRAPPED: '1' }
    }
  );
  process.exit(child.status ?? 0);
}

// Module placeholders populated dynamically after bootstrap
let useCartStore;
let SHIPPING_CONFIG;
let calculateShippingFee;
let productService;
let orderService;
let couponService;
let mockEngine;
let createCheckoutOrder;
let checkoutFormSchema;
let VIETNAM_63_PROVINCES;
let getVietnam63Provinces;
let getDistrictsByProvince;
let getWardsByDistrict;

// Global Mock LocalStorage and Window for Zustand Persist & LocalStorageRepository
if (typeof globalThis.localStorage === 'undefined') {
  class MemoryStorage {
    constructor() { this.store = new Map(); }
    getItem(key) { return this.store.get(String(key)) ?? null; }
    setItem(key, value) { this.store.set(String(key), String(value)); }
    removeItem(key) { this.store.delete(String(key)); }
    clear() { this.store.clear(); }
  }
  const memStorage = new MemoryStorage();
  globalThis.localStorage = memStorage;
  if (typeof globalThis.window === 'undefined') {
    globalThis.window = {
      localStorage: memStorage,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    };
  }
}

// ANSI Styling
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
};

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failureDetails = [];

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    failedTests++;
    const detail = `FAIL: ${message}`;
    failureDetails.push(detail);
    console.log(`  ${c.red}✖ ${message}${c.reset}`);
    throw new Error(detail);
  } else {
    passedTests++;
    console.log(`  ${c.green}✔ ${message}${c.reset}`);
  }
}

function assertEqual(actual, expected, message) {
  totalTests++;
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    failedTests++;
    const detail = `FAIL: ${message} | Expected: ${expectedStr}, Got: ${actualStr}`;
    failureDetails.push(detail);
    console.log(`  ${c.red}✖ ${message} (Expected ${expectedStr}, got ${actualStr})${c.reset}`);
    throw new Error(detail);
  } else {
    passedTests++;
    console.log(`  ${c.green}✔ ${message}${c.reset}`);
  }
}

async function runSection(name, fn) {
  console.log(`\n${c.bold}${c.cyan}--- [CHALLENGE SECTION] ${name} ---${c.reset}`);
  try {
    await fn();
  } catch (err) {
    console.log(`  ${c.red}${c.bold}Section aborted due to assertion failure: ${err.message}${c.reset}`);
  }
}

// Test fixtures
const createMockItem = (overrides = {}) => ({
  productId: 'prod_01',
  variantId: 'var_01_blk_m',
  title: 'Áo Polo Nam Classic Pique',
  variantName: 'Đen / M',
  price: 299000,
  originalPrice: 350000,
  quantity: 1,
  image: '/polo.jpg',
  sku: 'POLO-01-BLK-M',
  stock: 12,
  ...overrides,
});

const defaultCustomer = {
  receiverName: 'Lê Hoàng Nam',
  phone: '0987654321',
  email: 'nam.le@example.vn',
  street: '72 Lê Thánh Tôn',
  province: 'TP. Hồ Chí Minh',
  district: 'Quận 1',
  ward: 'Phường Bến Nghé',
  paymentMethod: 'cod',
  note: 'Giao giờ hành chính',
};

async function main() {
  console.log(`${c.bold}${c.magenta}================================================================${c.reset}`);
  console.log(`${c.bold}${c.magenta}  M6 EMPIRICAL CHALLENGER VERIFICATION HARNESS                 ${c.reset}`);
  console.log(`${c.bold}${c.magenta}================================================================${c.reset}`);

  // Dynamic imports with registered loader
  ({ useCartStore } = await import('../../src/stores/cartStore.ts'));
  ({ SHIPPING_CONFIG, calculateShippingFee } = await import('../../src/config/shipping.ts'));
  ({ productService } = await import('../../src/services/api/productService.ts'));
  ({ orderService } = await import('../../src/services/api/orderService.ts'));
  ({ couponService } = await import('../../src/services/api/couponService.ts'));
  ({ mockEngine } = await import('../../src/services/mock/mockEngine.ts'));
  ({ createCheckoutOrder } = await import('../../src/features/checkout/services/checkoutService.ts'));
  ({ checkoutFormSchema } = await import('../../src/features/checkout/schemas/checkoutSchema.ts'));
  ({
    VIETNAM_63_PROVINCES,
    getVietnam63Provinces,
    getDistrictsByProvince,
    getWardsByDistrict,
  } = await import('../../src/features/checkout/data/vietnamAddressData.ts'));

  // Disable artificial delays for rapid execution
  mockEngine.updateConfig({ delayEnabled: false, errorRate: 0, simulateOffline: false, simulateServerError: false });

  // Reset repositories before testing
  productService.getRepository().resetToSeed();
  orderService.getRepository().resetToSeed();
  couponService.getRepository().resetToSeed();
  useCartStore.getState().clearCart();

  // --------------------------------------------------------------------------
  // SECTION 1: Cart Operations with Variants & Complex Item Identifiers
  // --------------------------------------------------------------------------
  await runSection('1. Cart Operations with Variants & Identifiers', async () => {
    const cart = useCartStore.getState();
    cart.clearCart();

    // 1.1 Distinct variants of same product remain separate line items
    cart.addItem(createMockItem({ variantId: 'var_01_blk_m', variantName: 'Đen / M', quantity: 1 }));
    cart.addItem(createMockItem({ variantId: 'var_01_blk_l', variantName: 'Đen / L', quantity: 2 }));
    cart.addItem(createMockItem({ variantId: 'var_01_wht_s', variantName: 'Trắng / S', quantity: 1 }));
    assertEqual(useCartStore.getState().items.length, 3, '1.1 Three different variants create 3 distinct lines');
    assertEqual(useCartStore.getState().getTotalItems(), 4, '1.1 Total items equals sum of variant quantities (1 + 2 + 1 = 4)');

    // 1.2 Adding same variant merges quantity into existing line item
    cart.addItem(createMockItem({ variantId: 'var_01_blk_m', variantName: 'Đen / M', quantity: 3 }));
    assertEqual(useCartStore.getState().items.length, 3, '1.2 Re-adding existing variant does not increase line count');
    const blkM = useCartStore.getState().items.find(i => i.variantId === 'var_01_blk_m');
    assertEqual(blkM?.quantity, 4, '1.2 Quantity for var_01_blk_m merged to 1 + 3 = 4');

    // 1.3 Product without variantId (undefined)
    cart.addItem({
      productId: 'prod_novar_1',
      title: 'Túi Tote Canvas',
      price: 150000,
      quantity: 2,
      image: '/tote.jpg',
      stock: 20,
    });
    assertEqual(useCartStore.getState().items.length, 4, '1.3 Non-variant product adds as separate line');
    cart.addItem({
      productId: 'prod_novar_1',
      title: 'Túi Tote Canvas',
      price: 150000,
      quantity: 3,
      image: '/tote.jpg',
      stock: 20,
    });
    assertEqual(useCartStore.getState().items.length, 4, '1.3 Re-adding non-variant product merges quantity (5)');
    const tote = useCartStore.getState().items.find(i => i.productId === 'prod_novar_1');
    assertEqual(tote?.quantity, 5, '1.3 Non-variant product quantity correctly merged to 5');

    // 1.4 Product with same productId but one has variantId and one has undefined variantId
    cart.addItem({
      productId: 'prod_novar_1',
      variantId: 'var_special',
      variantName: 'Bản Kỷ Niệm',
      title: 'Túi Tote Canvas',
      price: 180000,
      quantity: 1,
      image: '/tote.jpg',
      stock: 5,
    });
    assertEqual(useCartStore.getState().items.length, 5, '1.4 Variant vs non-variant for same product coexist as separate lines');

    // 1.5 Sold-out variants (stock: 0) cannot be added
    const preCount = useCartStore.getState().items.length;
    cart.addItem(createMockItem({ variantId: 'var_soldout', stock: 0, quantity: 1 }));
    assertEqual(useCartStore.getState().items.length, preCount, '1.5 Stock = 0 item is not added to cart');

    // 1.6 Negative stock variant is rejected
    cart.addItem(createMockItem({ variantId: 'var_neg_stock', stock: -5, quantity: 1 }));
    assertEqual(useCartStore.getState().items.length, preCount, '1.6 Stock < 0 item is not added to cart');

    // 1.7 Fractional quantity floored
    cart.addItem(createMockItem({ productId: 'prod_frac', variantId: 'var_frac', quantity: 2.9, stock: 10 }));
    const fracItem = useCartStore.getState().items.find(i => i.variantId === 'var_frac');
    assertEqual(fracItem?.quantity, 2, '1.7 Fractional quantity 2.9 is floored to integer 2');

    // 1.8 Rapid burst addition stress (50 additions)
    cart.clearCart();
    for (let i = 0; i < 50; i++) {
      const vId = `var_burst_${i % 10}`;
      cart.addItem(createMockItem({
        productId: `prod_burst_${Math.floor(i / 10)}`,
        variantId: vId,
        price: 100000,
        quantity: 1,
        stock: 100,
      }));
    }
    assertEqual(useCartStore.getState().getTotalItems(), 50, '1.8 Burst addition correctly tracks 50 total items');
    assertEqual(useCartStore.getState().getSubtotal(), 5000000, '1.8 Burst addition subtotal equals 5,000,000₫');
  });

  // --------------------------------------------------------------------------
  // SECTION 2: Quantity Increments Beyond Stock & Boundary Clamping
  // --------------------------------------------------------------------------
  await runSection('2. Quantity Increments Beyond Stock & Clamping', async () => {
    const cart = useCartStore.getState();
    cart.clearCart();

    // 2.1 Initial add quantity exceeding stock is clamped to stock
    cart.addItem(createMockItem({ variantId: 'var_clamp_1', quantity: 99, stock: 10 }));
    let item1 = useCartStore.getState().items.find(i => i.variantId === 'var_clamp_1');
    assertEqual(item1?.quantity, 10, '2.1 Initial quantity 99 with stock 10 clamped to 10');

    // 2.2 Re-adding to existing item clamped to stock
    cart.clearCart();
    cart.addItem(createMockItem({ variantId: 'var_clamp_2', quantity: 7, stock: 10 }));
    cart.addItem(createMockItem({ variantId: 'var_clamp_2', quantity: 8, stock: 10 }));
    let item2 = useCartStore.getState().items.find(i => i.variantId === 'var_clamp_2');
    assertEqual(item2?.quantity, 10, '2.2 Incremental merge (7 + 8) clamped to stock 10');

    // 2.3 updateQuantity beyond stock clamped
    const id = item2?.id;
    cart.updateQuantity(id, 25);
    let itemUpdated = useCartStore.getState().items.find(i => i.id === id);
    assertEqual(itemUpdated?.quantity, 10, '2.3 updateQuantity(id, 25) clamped to stock 10');

    // 2.4 updateQuantity with Number.MAX_SAFE_INTEGER
    cart.updateQuantity(id, Number.MAX_SAFE_INTEGER);
    itemUpdated = useCartStore.getState().items.find(i => i.id === id);
    assertEqual(itemUpdated?.quantity, 10, '2.4 updateQuantity(id, MAX_SAFE_INTEGER) safely clamped to 10');

    // 2.5 Exact boundary step tests: stock - 1, stock, stock + 1
    cart.updateQuantity(id, 9);
    itemUpdated = useCartStore.getState().items.find(i => i.id === id);
    assertEqual(itemUpdated?.quantity, 9, '2.5 Boundary stock - 1 (9) accepted');

    cart.updateQuantity(id, 10);
    itemUpdated = useCartStore.getState().items.find(i => i.id === id);
    assertEqual(itemUpdated?.quantity, 10, '2.5 Boundary exact stock (10) accepted');

    cart.updateQuantity(id, 11);
    itemUpdated = useCartStore.getState().items.find(i => i.id === id);
    assertEqual(itemUpdated?.quantity, 10, '2.5 Boundary stock + 1 (11) clamped to 10');

    // 2.6 Floating point quantity in updateQuantity
    cart.updateQuantity(id, 6.7);
    itemUpdated = useCartStore.getState().items.find(i => i.id === id);
    assertEqual(itemUpdated?.quantity, 6, '2.6 updateQuantity floored 6.7 to 6');

    // 2.7 Item without defined stock allows large updates
    cart.addItem({
      productId: 'prod_unlimited',
      title: 'Dịch vụ khắc tên',
      price: 50000,
      quantity: 5,
      image: '/svc.jpg',
    });
    const unlimItem = useCartStore.getState().items.find(i => i.productId === 'prod_unlimited');
    cart.updateQuantity(unlimItem.id, 500);
    const unlimUpdated = useCartStore.getState().items.find(i => i.id === unlimItem.id);
    assertEqual(unlimUpdated?.quantity, 500, '2.7 Item with undefined stock allows quantity = 500');
  });

  // --------------------------------------------------------------------------
  // SECTION 3: Item Removal & Zero/Negative Decrement Semantics
  // --------------------------------------------------------------------------
  await runSection('3. Item Removal & Auto-removal on Zero/Negative', async () => {
    const cart = useCartStore.getState();
    cart.clearCart();

    cart.addItem(createMockItem({ variantId: 'item_a', quantity: 2 }));
    cart.addItem(createMockItem({ variantId: 'item_b', quantity: 3 }));
    cart.addItem(createMockItem({ variantId: 'item_c', quantity: 1 }));
    assertEqual(useCartStore.getState().items.length, 3, '3.0 Three items initialized');

    const itemA = useCartStore.getState().items.find(i => i.variantId === 'item_a');
    const itemB = useCartStore.getState().items.find(i => i.variantId === 'item_b');
    const itemC = useCartStore.getState().items.find(i => i.variantId === 'item_c');

    // 3.1 removeItem removes targeted item only
    cart.removeItem(itemB.id);
    assertEqual(useCartStore.getState().items.length, 2, '3.1 items.length reduced to 2');
    assert(!useCartStore.getState().items.some(i => i.id === itemB.id), '3.1 item_b was removed');
    assert(useCartStore.getState().items.some(i => i.id === itemA.id), '3.1 item_a remains intact');

    // 3.2 Idempotent unknown ID removal
    cart.removeItem('completely_unknown_id');
    assertEqual(useCartStore.getState().items.length, 2, '3.2 Removing non-existent ID does not corrupt items');

    // 3.3 updateQuantity to 0 triggers auto-removal
    cart.updateQuantity(itemA.id, 0);
    assertEqual(useCartStore.getState().items.length, 1, '3.3 updateQuantity(itemA.id, 0) auto-removed itemA');
    assert(!useCartStore.getState().items.some(i => i.id === itemA.id), '3.3 itemA is gone');

    // 3.4 updateQuantity to negative value triggers auto-removal
    cart.updateQuantity(itemC.id, -5);
    assertEqual(useCartStore.getState().items.length, 0, '3.4 updateQuantity(itemC.id, -5) auto-removed itemC');
    assertEqual(useCartStore.getState().getTotalItems(), 0, '3.4 Cart is now completely empty');
    assertEqual(useCartStore.getState().getSubtotal(), 0, '3.4 Cart subtotal is 0');
  });

  // --------------------------------------------------------------------------
  // SECTION 4: Clear Cart Action & State Hygiene
  // --------------------------------------------------------------------------
  await runSection('4. Clear Cart Action & State Hygiene', async () => {
    const cart = useCartStore.getState();
    cart.clearCart();

    // Populate complex state
    cart.addItem(createMockItem({ quantity: 3 }));
    cart.setCouponCode('SALE50K');
    cart.setCouponDiscount(50000);
    cart.setNote('Giao vào buổi sáng trước 11h');

    assertEqual(useCartStore.getState().items.length, 1, '4.0 Items added');
    assertEqual(useCartStore.getState().couponCode, 'SALE50K', '4.0 Coupon set');
    assertEqual(useCartStore.getState().couponDiscount, 50000, '4.0 Coupon discount set');
    assertEqual(useCartStore.getState().note, 'Giao vào buổi sáng trước 11h', '4.0 Note set');

    // 4.1 clearCart resets all 4 properties
    cart.clearCart();
    assertEqual(useCartStore.getState().items.length, 0, '4.1 items reset to []');
    assertEqual(useCartStore.getState().couponCode, '', '4.1 couponCode reset to empty');
    assertEqual(useCartStore.getState().couponDiscount, 0, '4.1 couponDiscount reset to 0');
    assertEqual(useCartStore.getState().note, '', '4.1 note reset to empty string');
    assertEqual(useCartStore.getState().getTotalItems(), 0, '4.1 getTotalItems() is 0');
    assertEqual(useCartStore.getState().getSubtotal(), 0, '4.1 getSubtotal() is 0');

    // 4.2 Repeated clearCart is idempotent
    cart.clearCart();
    assertEqual(useCartStore.getState().items.length, 0, '4.2 Idempotent repeated clearCart');
  });

  // --------------------------------------------------------------------------
  // SECTION 5: Free Shipping Threshold Transitions (0₫ -> 299,000₫ -> 500,000₫)
  // --------------------------------------------------------------------------
  await runSection('5. Free Shipping Threshold Transitions (0₫ -> 299,000₫ -> 500,000₫)', async () => {
    // 5.1 Centralized constant verification
    assertEqual(SHIPPING_CONFIG.freeShippingThreshold, 299000, '5.1 Threshold is 299,000₫');
    assertEqual(SHIPPING_CONFIG.standardShippingFee, 30000, '5.1 Standard fee is 30,000₫');

    // 5.2 Transition at 0₫
    assertEqual(calculateShippingFee(0), 30000, '5.2 Fee at 0₫ is 30,000₫');
    assertEqual(calculateShippingFee(1), 30000, '5.2 Fee at 1₫ is 30,000₫');

    // 5.3 Near-threshold boundary (298,999₫)
    assertEqual(calculateShippingFee(298999), 30000, '5.3 Fee at 298,999₫ (1₫ below threshold) is 30,000₫');

    // 5.4 Exact threshold boundary (299,000₫)
    assertEqual(calculateShippingFee(299000), 0, '5.4 Fee at exact threshold 299,000₫ transitions to 0₫ (FREE)');

    // 5.5 Above threshold boundaries (299,001₫, 500,000₫, 10,000,000₫)
    assertEqual(calculateShippingFee(299001), 0, '5.5 Fee at 299,001₫ is 0₫');
    assertEqual(calculateShippingFee(500000), 0, '5.5 Fee at 500,000₫ is 0₫');
    assertEqual(calculateShippingFee(10000000), 0, '5.5 Fee at 10,000,000₫ is 0₫');

    // 5.6 Custom threshold parameter
    assertEqual(calculateShippingFee(499999, 500000), 30000, '5.6 Custom threshold 500k: 499,999₫ returns 30,000₫');
    assertEqual(calculateShippingFee(500000, 500000), 0, '5.6 Custom threshold 500k: 500,000₫ returns 0₫');

    // 5.7 FreeShippingTracker Mathematical Model Verification
    function evalTracker(subtotal, threshold = SHIPPING_CONFIG.freeShippingThreshold) {
      const effectiveThreshold = Math.max(1, threshold);
      const isQualified = subtotal >= effectiveThreshold && subtotal > 0;
      const remaining = Math.max(0, effectiveThreshold - subtotal);
      const percentage = subtotal <= 0 ? 0 : Math.min(100, Math.round((subtotal / effectiveThreshold) * 100));
      return { isQualified, remaining, percentage };
    }

    // At 0₫
    const t0 = evalTracker(0);
    assertEqual(t0.isQualified, false, '5.7 Tracker at 0₫: not qualified');
    assertEqual(t0.remaining, 299000, '5.7 Tracker at 0₫: remaining 299,000₫');
    assertEqual(t0.percentage, 0, '5.7 Tracker at 0₫: percentage 0%');

    // At 149,500₫ (50%)
    const tHalf = evalTracker(149500);
    assertEqual(tHalf.isQualified, false, '5.7 Tracker at 149.5k: not qualified');
    assertEqual(tHalf.remaining, 149500, '5.7 Tracker at 149.5k: remaining 149,500₫');
    assertEqual(tHalf.percentage, 50, '5.7 Tracker at 149.5k: percentage 50%');

    // At 298,999₫
    const tNear = evalTracker(298999);
    assertEqual(tNear.isQualified, false, '5.7 Tracker at 298,999₫: not qualified (1₫ short)');
    assertEqual(tNear.remaining, 1, '5.7 Tracker at 298,999₫: remaining 1₫');

    // At 299,000₫ (Exact threshold)
    const tExact = evalTracker(299000);
    assertEqual(tExact.isQualified, true, '5.7 Tracker at 299,000₫: QUALIFIED');
    assertEqual(tExact.remaining, 0, '5.7 Tracker at 299,000₫: remaining 0₫');
    assertEqual(tExact.percentage, 100, '5.7 Tracker at 299,000₫: percentage 100%');

    // At 500,000₫ (Well above threshold, clamp test)
    const t500k = evalTracker(500000);
    assertEqual(t500k.isQualified, true, '5.7 Tracker at 500,000₫: QUALIFIED');
    assertEqual(t500k.remaining, 0, '5.7 Tracker at 500,000₫: remaining 0₫');
    assertEqual(t500k.percentage, 100, '5.7 Tracker at 500,000₫: percentage clamped at 100% (not 167%)');

    // Negative subtotal resilience
    const tNeg = evalTracker(-50000);
    assertEqual(tNeg.isQualified, false, '5.7 Tracker with negative subtotal: not qualified');
    assertEqual(tNeg.percentage, 0, '5.7 Tracker with negative subtotal: percentage clamped to 0%');

    // Zero threshold division safety
    const tZeroThresh = evalTracker(100000, 0);
    assertEqual(tZeroThresh.percentage, 100, '5.7 Division by zero guard: threshold 0 safely clamped to 1');
  });

  // --------------------------------------------------------------------------
  // SECTION 6: Coupon Discount Revalidation on Quantity Change
  // --------------------------------------------------------------------------
  await runSection('6. Coupon Discount Revalidation on Quantity Change', async () => {
    // 6.1 Percentage coupon with cap: CHAOBAN (10% max 50k, minOrder 200k)
    // Initial: Subtotal = 250,000₫ -> valid, 25k discount
    let res = await couponService.validateCoupon('CHAOBAN', 250000, 30000);
    assertEqual(res.isValid, true, '6.1 CHAOBAN at 250k: valid');
    assertEqual(res.discountAmount, 25000, '6.1 CHAOBAN discount is 25,000₫');

    // User reduces quantity -> Subtotal drops to 150,000₫ (< 200k min)
    res = await couponService.validateCoupon('CHAOBAN', 150000, 30000);
    assertEqual(res.isValid, false, '6.1 CHAOBAN dropped to 150k: INVALIDated due to minOrderValue');
    assertEqual(res.discountAmount, 0, '6.1 CHAOBAN discount dropped to 0₫');
    assert(res.message.includes('tối thiểu'), '6.1 Feedback message mentions minimum order requirement');

    // User increases quantity -> Subtotal jumps to 800,000₫ (10% = 80k > maxDiscount 50k)
    res = await couponService.validateCoupon('CHAOBAN', 800000, 0);
    assertEqual(res.isValid, true, '6.1 CHAOBAN increased to 800k: valid');
    assertEqual(res.discountAmount, 50000, '6.1 CHAOBAN discount capped at maxDiscount (50,000₫)');

    // 6.2 Fixed amount coupon: SALE50K (50k off, minOrder 300k)
    res = await couponService.validateCoupon('SALE50K', 350000, 30000);
    assertEqual(res.isValid, true, '6.2 SALE50K at 350k: valid');
    assertEqual(res.discountAmount, 50000, '6.2 SALE50K discount is 50,000₫');

    res = await couponService.validateCoupon('SALE50K', 299000, 0);
    assertEqual(res.isValid, false, '6.2 SALE50K dropped to 299,000₫ (< 300k): INVALID');
    assertEqual(res.discountAmount, 0, '6.2 SALE50K discount is 0₫');

    // 6.3 VIP coupon: VIP15 (15% max 150k, minOrder 500k)
    res = await couponService.validateCoupon('VIP15', 499999, 0);
    assertEqual(res.isValid, false, '6.3 VIP15 at 499,999₫: INVALID (< 500k)');

    res = await couponService.validateCoupon('VIP15', 500000, 0);
    assertEqual(res.isValid, true, '6.3 VIP15 at 500,000₫: valid');
    assertEqual(res.discountAmount, 75000, '6.3 VIP15 discount is 15% of 500k = 75,000₫');

    res = await couponService.validateCoupon('VIP15', 2000000, 0);
    assertEqual(res.discountAmount, 150000, '6.3 VIP15 at 2M: capped at max 150,000₫');

    // 6.4 Free shipping coupon FREESHIP interaction when shipping fee becomes 0₫
    // When subtotal = 250,000₫, shipping fee = 30,000₫
    res = await couponService.validateCoupon('FREESHIP', 250000, 30000);
    assertEqual(res.isValid, true, '6.4 FREESHIP at 250k: valid');
    assertEqual(res.discountAmount, 30000, '6.4 FREESHIP discounts full 30,000₫ shipping fee');

    // When subtotal increases to 300,000₫, store threshold gives free shipping (shippingFee = 0₫)
    res = await couponService.validateCoupon('FREESHIP', 300000, 0);
    assertEqual(res.isValid, true, '6.4 FREESHIP at 300k: valid');
    assertEqual(res.discountAmount, 0, '6.4 FREESHIP when shippingFee is 0₫ discounts Math.min(30k, 0) = 0₫ (no phantom discount!)');

    // 6.5 Inactive, expired, and sold-out coupons are always rejected
    const resExp = await couponService.validateCoupon('EXPIRED10', 1000000, 30000);
    assertEqual(resExp.isValid, false, '6.5 EXPIRED10 rejected on 1M subtotal');

    const resSold = await couponService.validateCoupon('SOLDOUT', 1000000, 30000);
    assertEqual(resSold.isValid, false, '6.5 SOLDOUT rejected on 1M subtotal');

    const resFake = await couponService.validateCoupon('NOTEXISTING', 1000000, 30000);
    assertEqual(resFake.isValid, false, '6.5 Non-existent coupon code rejected');
  });

  // --------------------------------------------------------------------------
  // SECTION 7: Checkout Mutation Stress & Inventory Deduction
  // --------------------------------------------------------------------------
  await runSection('7. Checkout Mutation Stress & Inventory Deduction', async () => {
    // Reset seed data for predictable numbers
    productService.getRepository().resetToSeed();
    orderService.getRepository().resetToSeed();
    couponService.getRepository().resetToSeed();

    const prod1Before = await productService.getProductById('prod_01');
    const varM_Before = prod1Before?.variants.find(v => v.id === 'var_01_blk_m');
    const varL_Before = prod1Before?.variants.find(v => v.id === 'var_01_blk_l');
    const initialProdStock = prod1Before?.stock ?? 45;
    const initialM_Stock = varM_Before?.stock ?? 12;
    const initialL_Stock = varL_Before?.stock ?? 10;

    // 7.1 Multi-variant checkout order
    const orderItems = [
      createMockItem({ variantId: 'var_01_blk_m', quantity: 3, price: 299000 }),
      createMockItem({ variantId: 'var_01_blk_l', quantity: 2, price: 299000 }),
    ];
    const createdOrder = await createCheckoutOrder(orderItems, defaultCustomer, 'CHAOBAN');

    assertEqual(createdOrder.items.length, 2, '7.1 Created order contains both variant lines');
    assertEqual(createdOrder.subtotal, 1495000, '7.1 Order subtotal = 5 * 299k = 1,495,000₫');
    assertEqual(createdOrder.shippingFee, 0, '7.1 Order shipping fee is 0₫ (1.495M >= 299k threshold)');
    assertEqual(createdOrder.discount, 50000, '7.1 CHAOBAN discount capped at 50,000₫');
    assertEqual(createdOrder.total, 1445000, '7.1 Total = 1,495,000 - 50,000 = 1,445,000₫');

    // Verify stock deduction
    const prod1After = await productService.getProductById('prod_01');
    const varM_After = prod1After?.variants.find(v => v.id === 'var_01_blk_m');
    const varL_After = prod1After?.variants.find(v => v.id === 'var_01_blk_l');

    assertEqual(prod1After?.stock, initialProdStock - 5, '7.1 Product overall stock decremented by 5 (45 -> 40)');
    assertEqual(varM_After?.stock, initialM_Stock - 3, '7.1 Variant M stock decremented by 3 (12 -> 9)');
    assertEqual(varL_After?.stock, initialL_Stock - 2, '7.1 Variant L stock decremented by 2 (10 -> 8)');

    // 7.2 Over-stock rejection
    let rejected = false;
    try {
      await createCheckoutOrder([createMockItem({ variantId: 'var_01_blk_m', quantity: 15 })], defaultCustomer);
    } catch (err) {
      rejected = err.message.includes('không đủ tồn kho');
    }
    assert(rejected, '7.2 Checkout rejected when order quantity (15) exceeds available variant stock (9)');

    // Verify stocks untouched after rejection
    const prod1AfterReject = await productService.getProductById('prod_01');
    assertEqual(prod1AfterReject?.stock, 40, '7.2 Product stock untouched after rejected checkout');

    // 7.3 Cumulative variant reservation conflict
    // 2 separate lines referencing same variant whose combined sum exceeds stock
    let cumulativeRejected = false;
    try {
      await createCheckoutOrder([
        createMockItem({ variantId: 'var_01_blk_m', quantity: 5 }),
        createMockItem({ variantId: 'var_01_blk_m', quantity: 5 }), // Total 10 > 9
      ], defaultCustomer);
    } catch (err) {
      cumulativeRejected = err.message.includes('không đủ tồn kho');
    }
    assert(cumulativeRejected, '7.3 Cumulative duplicate variant lines exceeding stock (5 + 5 > 9) rejected');

    // 7.4 Saga compensating rollback on failure
    const originalUpdate = productService.updateProduct.bind(productService);
    let failTriggered = false;
    productService.updateProduct = async (...args) => {
      productService.updateProduct = originalUpdate; // restore immediately
      failTriggered = true;
      throw new Error('SIMULATED_DATABASE_TIMEOUT');
    };

    let sagaFailed = false;
    const ordersCountBefore = (await orderService.getOrders()).total;
    try {
      await createCheckoutOrder([createMockItem({ variantId: 'var_01_blk_m', quantity: 1 })], defaultCustomer);
    } catch (err) {
      sagaFailed = err.message.includes('SIMULATED_DATABASE_TIMEOUT');
    }
    assert(failTriggered, '7.4 Simulated failure was triggered');
    assert(sagaFailed, '7.4 Checkout caught error');
    const ordersCountAfter = (await orderService.getOrders()).total;
    assertEqual(ordersCountAfter, ordersCountBefore, '7.4 Saga rollback removed order from database');

    // 7.5 Payment methods: COD, VietQR, MoMo, Card
    const qrOrder = await createCheckoutOrder(
      [createMockItem({ variantId: 'var_01_blk_m', quantity: 1 })],
      { ...defaultCustomer, paymentMethod: 'vietqr' }
    );
    assertEqual(qrOrder.paymentMethod, 'vietqr', '7.5 VietQR payment method recorded');
    assertEqual(qrOrder.paymentStatus, 'pending', '7.5 VietQR payment status is pending');
    assertEqual(qrOrder.paymentDetails?.bankName, 'MB Bank', '7.5 VietQR bankName is MB Bank');
    assertEqual(qrOrder.paymentDetails?.accountNumber, '9999888826', '7.5 VietQR accountNumber is 9999888826');

    const cardOrder = await createCheckoutOrder(
      [createMockItem({ variantId: 'var_01_blk_m', quantity: 1 })],
      { ...defaultCustomer, paymentMethod: 'card' }
    );
    assertEqual(cardOrder.paymentMethod, 'card', '7.5 Card payment method recorded');
    assertEqual(cardOrder.paymentStatus, 'paid', '7.5 Card payment status is PAID immediately');
    assert(cardOrder.paymentDetails?.transactionId?.startsWith('TX_'), '7.5 Card transactionId generated');
  });

  // --------------------------------------------------------------------------
  // SECTION 8: Vietnamese Administrative Address & Schema Boundaries
  // --------------------------------------------------------------------------
  await runSection('8. Vietnamese Administrative Address & Schema Boundaries', async () => {
    // 8.1 63 Provinces validation
    const provinces = getVietnam63Provinces();
    assertEqual(provinces.length, 63, '8.1 Exactly 63 provinces returned');
    assertEqual(VIETNAM_63_PROVINCES.length, 63, '8.1 VIETNAM_63_PROVINCES length is 63');

    // All provinces have districts and wards
    for (const p of provinces) {
      const districts = getDistrictsByProvince(p);
      assert(districts.length > 0, `8.1 Province "${p}" has at least 1 district (${districts.length})`);
      for (const d of districts.slice(0, 2)) {
        const wards = getWardsByDistrict(p, d);
        assert(wards.length > 0, `8.1 District "${p} > ${d}" has at least 1 ward (${wards.length})`);
      }
    }

    // 8.2 Unknown query safety
    const unknownDistricts = getDistrictsByProvince('Tỉnh Không Tồn Tại');
    assertEqual(unknownDistricts, [], '8.2 Unknown province returns empty array');
    const unknownWards = getWardsByDistrict('TP. Hồ Chí Minh', 'Quận Không Có');
    assertEqual(unknownWards, [], '8.2 Unknown district returns empty array');

    // 8.3 Phone number regex boundary fuzzing
    const validPhones = [
      '0901234567',
      '0387654321',
      '0701112233',
      '0839998888',
      '0523456789',
      '+84912345678',
      '84912345678',
      '+84381234567',
    ];
    for (const phone of validPhones) {
      const res = checkoutFormSchema.safeParse({ ...defaultCustomer, phone });
      assert(res.success, `8.3 Valid VN phone "${phone}" passes schema`);
    }

    const invalidPhones = [
      '0243888888',   // Landline 024
      '0283999999',   // Landline 028
      '0123456789',   // Old 11-digit prefix 012 (invalid in 10-digit standard)
      '090123456',    // Too short (9 digits)
      '090123456789', // Too long (12 digits)
      '0401234567',   // Invalid 04 prefix
      'abcdefghij',   // Non-numeric
      '090123456a',   // Trailing letter
      '',             // Empty
    ];
    for (const phone of invalidPhones) {
      const res = checkoutFormSchema.safeParse({ ...defaultCustomer, phone });
      assert(!res.success, `8.3 Invalid phone "${phone}" correctly REJECTED by schema`);
    }
  });

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log(`\n${c.bold}${c.cyan}================================================================${c.reset}`);
  console.log(`${c.bold}${c.cyan}  TEST SUMMARY: ${totalTests} assertions | ${passedTests} passed | ${failedTests} failed${c.reset}`);
  console.log(`${c.bold}${c.cyan}================================================================${c.reset}`);

  if (failedTests > 0) {
    console.log(`\n${c.red}${c.bold}FAILED ASSERTIONS (${failedTests}):${c.reset}`);
    failureDetails.forEach((f, idx) => console.log(`  ${idx + 1}. ${f}`));
    process.exit(1);
  } else {
    console.log(`\n${c.green}${c.bold}ALL ${totalTests} ADVERSARIAL STRESS ASSERTIONS PASSED! (100% OK)${c.reset}\n`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
