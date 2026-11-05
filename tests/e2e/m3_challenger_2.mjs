#!/usr/bin/env node
/**
 * ============================================================================
 * EMPIRICAL CHALLENGER VERIFICATION SUITE: MILESTONE 3
 * Mock Service Engine & Data Access Layer (DAL)
 *
 * File: tests/e2e/m3_challenger_2.mjs
 * Author: challenger_m3_2 (Empirical Challenger)
 * ============================================================================
 *
 * Rigorous adversarial validation covering:
 * 1. Seed data completeness & invariants (24 products, 12 orders / 6 statuses, 12 customers, 7 coupons, 9 blocks)
 * 2. Low stock edge cases (prod_02 = 3, prod_13 = 1, prod_17 = 0) & threshold filtering
 * 3. Order status lifecycle transitions, validation, and immutable audit timeline logging
 * 4. Factory reset idempotency, deep state mutation wiping, repository cache invalidation & namespace hygiene
 * 5. Mock latency jitter simulation, offline injection, 500 error injection, and chaos mode
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');

// ANSI Color Palette
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
  bgRed: '\x1b[41m\x1b[37m',
  bgGreen: '\x1b[42m\x1b[30m',
};

// ---------------------------------------------------------------------------
// 1. In-Memory Mock Browser Environment (LocalStorage + Quota + Event Target)
// ---------------------------------------------------------------------------
class MockLocalStorage {
  constructor(quotaBytes = 5 * 1024 * 1024) {
    this._map = new Map();
    this.quotaBytes = quotaBytes;
    this.enforceQuota = true;
  }

  get length() {
    return this._map.size;
  }

  key(index) {
    const keys = Array.from(this._map.keys());
    return keys[index] ?? null;
  }

  getItem(key) {
    const k = String(key);
    return this._map.has(k) ? this._map.get(k) : null;
  }

  setItem(key, value) {
    const k = String(key);
    const v = String(value);

    if (this.enforceQuota) {
      let currentBytes = 0;
      for (const [ek, ev] of this._map.entries()) {
        if (ek !== k) {
          currentBytes += (ek.length + ev.length) * 2;
        }
      }
      const newBytes = currentBytes + (k.length + v.length) * 2;
      if (newBytes > this.quotaBytes) {
        const err = new Error('DOMException: QuotaExceededError - LocalStorage quota exceeded');
        err.name = 'QuotaExceededError';
        err.code = 22;
        throw err;
      }
    }

    this._map.set(k, v);
  }

  removeItem(key) {
    this._map.delete(String(key));
  }

  clear() {
    this._map.clear();
  }
}

class MockEventTarget {
  constructor() {
    this._listeners = new Map();
  }

  addEventListener(type, fn) {
    if (!this._listeners.has(type)) {
      this._listeners.set(type, []);
    }
    this._listeners.get(type).push(fn);
  }

  removeEventListener(type, fn) {
    if (this._listeners.has(type)) {
      this._listeners.set(type, this._listeners.get(type).filter((l) => l !== fn));
    }
  }

  dispatchEvent(event) {
    const handlers = this._listeners.get(event.type) || [];
    for (const h of handlers) {
      try {
        h(event);
      } catch (err) {
        console.error('Event handler error:', err);
      }
    }
    return true;
  }
}

// Global Mocks Setup
const mockStorage = new MockLocalStorage();
const mockWindow = new MockEventTarget();
mockWindow.localStorage = mockStorage;

globalThis.window = mockWindow;
globalThis.localStorage = mockStorage;

globalThis.CustomEvent = class CustomEvent {
  constructor(type, params = {}) {
    this.type = type;
    this.detail = params.detail || null;
  }
};

globalThis.Event = class Event {
  constructor(type) {
    this.type = type;
  }
};

// ---------------------------------------------------------------------------
// 2. Test Harness & Assertions
// ---------------------------------------------------------------------------
let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;
const failures = [];

function assert(condition, message) {
  totalAssertions++;
  if (!condition) {
    failedAssertions++;
    failures.push(message);
    console.log(`  ${c.red}✖ FAIL: ${message}${c.reset}`);
    throw new Error(message);
  } else {
    passedAssertions++;
    console.log(`  ${c.green}✔ PASS: ${message}${c.reset}`);
  }
}

function assertEqual(actual, expected, message) {
  totalAssertions++;
  if (actual !== expected) {
    const detail = `${message} | Expected: ${JSON.stringify(expected)}, Actual: ${JSON.stringify(actual)}`;
    failedAssertions++;
    failures.push(detail);
    console.log(`  ${c.red}✖ FAIL: ${detail}${c.reset}`);
    throw new Error(detail);
  } else {
    passedAssertions++;
    console.log(`  ${c.green}✔ PASS: ${message}${c.reset}`);
  }
}

function assertDeepEqual(actual, expected, message) {
  totalAssertions++;
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    const detail = `${message} | Objects differ.\n  Expected: ${expectedStr}\n  Actual:   ${actualStr}`;
    failedAssertions++;
    failures.push(detail);
    console.log(`  ${c.red}✖ FAIL: ${detail}${c.reset}`);
    throw new Error(detail);
  } else {
    passedAssertions++;
    console.log(`  ${c.green}✔ PASS: ${message}${c.reset}`);
  }
}

// ---------------------------------------------------------------------------
// 3. Dynamic Bundle & Load of DAL Barrel
// ---------------------------------------------------------------------------
const tempFiles = new Set();

function cleanup() {
  for (const f of tempFiles) {
    try {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    } catch {}
  }
}

process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(1); });

async function loadServices() {
  const tempBundle = path.join(__dirname, `temp_challenger_m3_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.mjs`);
  tempFiles.add(tempBundle);

  esbuild.buildSync({
    entryPoints: [path.join(ROOT_DIR, 'src/services/index.ts')],
    bundle: true,
    write: true,
    outfile: tempBundle,
    format: 'esm',
    alias: { '@': path.join(ROOT_DIR, 'src') },
    external: ['react', 'react-dom', 'zustand'],
  });

  const fileUrl = new URL(`file://${tempBundle.replace(/\\/g, '/')}`);
  return await import(fileUrl.href);
}

// ---------------------------------------------------------------------------
// 4. Main Verification Logic
// ---------------------------------------------------------------------------
async function runChallengerSuite() {
  console.log(`${c.bold}${c.cyan}========================================================================${c.reset}`);
  console.log(`${c.bold}${c.cyan}  EMPIRICAL CHALLENGER SUITE: MILESTONE 3 (DAL & MOCK SERVICE ENGINE)   ${c.reset}`);
  console.log(`${c.bold}${c.cyan}========================================================================${c.reset}\n`);

  const services = await loadServices();

  const {
    seedProducts,
    seedCategories,
    seedOrders,
    seedCustomers,
    seedCoupons,
    defaultStorefrontBlocks,
    productService,
    orderService,
    customerService,
    couponService,
    systemService,
    mockEngine,
    simulateDelay,
    DalApiError,
    STORAGE_KEYS,
    calculateStorageUsage,
  } = services;

  // Turn off latency delay initially for fast deterministic unit checks
  mockEngine.updateConfig({ delayEnabled: false, errorRate: 0, simulateOffline: false, simulateServerError: false });

  // =========================================================================
  // SECTION 1: SEED DATA COMPLETENESS & INVARIANTS
  // =========================================================================
  console.log(`${c.bold}${c.magenta}--- [SECTION 1] Seed Data Completeness & Domain Invariants ---${c.reset}`);

  // 1.1 Products count
  assertEqual(seedProducts.length, 24, 'Seed products must contain exactly 24 items');

  // 1.2 Orders count and status distribution
  assertEqual(seedOrders.length, 12, 'Seed orders must contain exactly 12 items');
  const requiredStatuses = ['pending', 'confirmed', 'processing', 'shipping', 'completed', 'cancelled'];
  const presentStatuses = new Set(seedOrders.map((o) => o.status));
  for (const status of requiredStatuses) {
    assert(presentStatuses.has(status), `Seed orders must contain at least one order with status "${status}"`);
  }
  assertEqual(presentStatuses.size, 6, 'Seed orders must span all 6 distinct OrderStatus states');

  // 1.3 Customers count & attributes
  assertEqual(seedCustomers.length, 12, 'Seed customers must contain exactly 12 profiles');
  const phoneRegex = /^(03|05|07|08|09)\d{8}$/;
  for (const cust of seedCustomers) {
    assert(phoneRegex.test(cust.phone), `Customer ${cust.id} (${cust.name}) phone "${cust.phone}" matches VN format`);
    assert(['vip_gold', 'vip', 'regular', 'new'].includes(cust.tier), `Customer ${cust.id} tier "${cust.tier}" is valid`);
    assert(cust.totalOrders >= 0, `Customer ${cust.id} totalOrders is non-negative`);
    assert(cust.totalSpend >= 0, `Customer ${cust.id} totalSpend is non-negative`);
  }

  // 1.4 Coupons count & rules
  assertEqual(seedCoupons.length, 7, 'Seed coupons must contain exactly 7 coupons');
  const couponCodes = seedCoupons.map((c) => c.code);
  assert(couponCodes.includes('CHAOBAN'), 'Contains CHAOBAN coupon');
  assert(couponCodes.includes('FREESHIP'), 'Contains FREESHIP coupon');
  assert(couponCodes.includes('SALE50K'), 'Contains SALE50K coupon');
  assert(couponCodes.includes('VIP15'), 'Contains VIP15 coupon');
  assert(couponCodes.includes('D2C15OFF'), 'Contains D2C15OFF coupon');
  assert(couponCodes.includes('EXPIRED10'), 'Contains EXPIRED10 coupon');
  assert(couponCodes.includes('SOLDOUT'), 'Contains SOLDOUT coupon');

  // 1.5 Storefront Blocks count
  assertEqual(defaultStorefrontBlocks.length, 9, 'Seed blocks must contain exactly 9 modular blocks');
  const blockTypes = defaultStorefrontBlocks.map((b) => b.type);
  assert(blockTypes.includes('hero_banner'), 'Blocks include hero_banner');
  assert(blockTypes.includes('value_propositions'), 'Blocks include value_propositions');
  assert(blockTypes.includes('flash_sale'), 'Blocks include flash_sale');
  assert(blockTypes.includes('featured_products'), 'Blocks include featured_products');
  assert(blockTypes.includes('testimonials'), 'Blocks include testimonials');

  // 1.6 Categories count
  assertEqual(seedCategories.length, 5, 'Seed categories must contain exactly 5 core categories');

  // =========================================================================
  // SECTION 2: LOW STOCK & INVENTORY EDGE CASES
  // =========================================================================
  console.log(`\n${c.bold}${c.magenta}--- [SECTION 2] Low Stock & Inventory Edge Cases ---${c.reset}`);

  const prod02 = seedProducts.find((p) => p.id === 'prod_02');
  assert(Boolean(prod02), 'Product prod_02 exists in seeds');
  assertEqual(prod02.stock, 3, 'prod_02 must have stock === 3 (low stock)');

  const prod13 = seedProducts.find((p) => p.id === 'prod_13');
  assert(Boolean(prod13), 'Product prod_13 exists in seeds');
  assertEqual(prod13.stock, 1, 'prod_13 must have stock === 1 (critical stock)');

  const prod17 = seedProducts.find((p) => p.id === 'prod_17');
  assert(Boolean(prod17), 'Product prod_17 exists in seeds');
  assertEqual(prod17.stock, 0, 'prod_17 must have stock === 0 (out of stock)');

  // Test productService low stock query filter
  const lowStockThreshold5 = await productService.getLowStockProducts(5);
  const lowStockIds = lowStockThreshold5.map((p) => p.id);
  assert(lowStockIds.includes('prod_02'), 'getLowStockProducts(5) includes prod_02 (stock 3)');
  assert(lowStockIds.includes('prod_13'), 'getLowStockProducts(5) includes prod_13 (stock 1)');
  assert(lowStockIds.includes('prod_17'), 'getLowStockProducts(5) includes prod_17 (stock 0)');

  for (const p of lowStockThreshold5) {
    assert(p.stock <= (p.lowStockThreshold || 5), `Product ${p.id} stock (${p.stock}) is <= threshold`);
  }

  const allProducts = await productService.getProducts({ pageSize: 100 });
  const stock1OrLess = allProducts.items.filter((p) => p.stock <= 1);
  const stock1OrLessIds = stock1OrLess.map((p) => p.id);
  assert(stock1OrLessIds.includes('prod_13'), 'stock <= 1 includes prod_13 (stock 1)');
  assert(stock1OrLessIds.includes('prod_17'), 'stock <= 1 includes prod_17 (stock 0)');
  assert(!stock1OrLessIds.includes('prod_02'), 'stock <= 1 excludes prod_02 (stock 3 > 1)');

  // =========================================================================
  // SECTION 3: ORDER LIFECYCLE TRANSITIONS & TIMELINE AUDIT LOGGING
  // =========================================================================
  console.log(`\n${c.bold}${c.magenta}--- [SECTION 3] Order Status Transitions & Timeline Logging ---${c.reset}`);

  // 3.1 Create test order
  const testOrderData = {
    orderNumber: 'ORD-TEST-CHALLENGER-01',
    customer: {
      id: 'cust_01',
      name: 'Nguyễn Văn An',
      phone: '0912345678',
      email: 'nguyenvanan@gmail.com',
      address: {
        province: 'Hà Nội',
        district: 'Cầu Giấy',
        ward: 'Dịch Vọng Hậu',
        street: 'Số 10 Phạm Hùng',
      },
    },
    items: [
      {
        productId: 'prod_01',
        variantId: 'var_01_blk_m',
        name: 'Áo Polo Nam Pique Cotton',
        sku: 'POLO-01-BLK-M',
        price: 299000,
        quantity: 2,
        total: 598000,
      },
    ],
    subtotal: 598000,
    shippingFee: 30000,
    discount: 0,
    total: 628000,
    paymentMethod: 'cod',
    shippingMethod: 'standard',
    status: 'pending',
    paymentStatus: 'pending',
    paymentDetails: {},
  };

  const createdOrder = await orderService.createOrder(testOrderData);
  assert(Boolean(createdOrder.id), 'Created order receives an ID');
  assertEqual(createdOrder.status, 'pending', 'Initial order status is "pending"');
  assertEqual(createdOrder.timeline.length, 1, 'Initial order has 1 timeline event');
  assertEqual(createdOrder.timeline[0].status, 'pending', 'Timeline[0] status is "pending"');
  assertEqual(createdOrder.timeline[0].actor, 'Nguyễn Văn An', 'Timeline[0] actor is customer');

  // 3.2 Transition: pending -> confirmed
  const confirmedOrder = await orderService.updateOrderStatus(
    createdOrder.id,
    'confirmed',
    'Nhân viên đã gọi điện xác nhận đơn.',
    'Nhân viên CSKH'
  );
  assertEqual(confirmedOrder.status, 'confirmed', 'Order transitioned to "confirmed"');
  assertEqual(confirmedOrder.timeline.length, 2, 'Timeline grew to 2 events');
  assertEqual(confirmedOrder.timeline[1].status, 'confirmed', 'Timeline[1] status is "confirmed"');
  assertEqual(confirmedOrder.timeline[1].actor, 'Nhân viên CSKH', 'Timeline[1] actor logged');
  assertEqual(confirmedOrder.timeline[1].description, 'Nhân viên đã gọi điện xác nhận đơn.', 'Timeline[1] custom note logged');

  // 3.3 Transition: confirmed -> processing -> shipping -> completed
  const processingOrder = await orderService.updateOrderStatus(createdOrder.id, 'processing');
  assertEqual(processingOrder.status, 'processing', 'Order transitioned to "processing"');
  assertEqual(processingOrder.timeline.length, 3, 'Timeline grew to 3 events');

  const shippingOrder = await orderService.updateOrderStatus(createdOrder.id, 'shipping', 'Đã giao cho Giao Hàng Nhanh');
  assertEqual(shippingOrder.status, 'shipping', 'Order transitioned to "shipping"');
  assertEqual(shippingOrder.timeline.length, 4, 'Timeline grew to 4 events');

  const completedOrder = await orderService.updateOrderStatus(createdOrder.id, 'completed', 'Khách hàng đã nhận hàng và thanh toán');
  assertEqual(completedOrder.status, 'completed', 'Order transitioned to "completed"');
  assertEqual(completedOrder.timeline.length, 5, 'Timeline grew to 5 events');

  // 3.4 Payment update
  const paidOrder = await orderService.updatePaymentStatus(createdOrder.id, 'paid', 'VNQR_TXN_888999');
  assertEqual(paidOrder.paymentStatus, 'paid', 'Payment status updated to "paid"');
  assertEqual(paidOrder.paymentDetails.transactionId, 'VNQR_TXN_888999', 'Transaction ID saved');
  assert(Boolean(paidOrder.paymentDetails.paidAt), 'Paid timestamp recorded');
  assertEqual(paidOrder.timeline.length, 6, 'Payment event added to timeline');

  // 3.5 Cancellation test
  const cancelTestOrder = await orderService.createOrder({ ...testOrderData, orderNumber: 'ORD-CANCEL-TEST' });
  const cancelledOrder = await orderService.cancelOrder(cancelTestOrder.id, 'Khách hàng đổi ý muốn mua màu khác', 'Khách hàng');
  assertEqual(cancelledOrder.status, 'cancelled', 'Order status updated to "cancelled"');
  const lastEvent = cancelledOrder.timeline[cancelledOrder.timeline.length - 1];
  assertEqual(lastEvent.status, 'cancelled', 'Last timeline event is "cancelled"');
  assert(lastEvent.description.includes('Khách hàng đổi ý'), 'Cancellation reason recorded in description');

  // 3.6 Non-existent order exception handling
  let threwNotFound = false;
  try {
    await orderService.updateOrderStatus('ord_non_existent_9999', 'confirmed');
  } catch (err) {
    threwNotFound = true;
    assert(err.message.includes('ord_non_existent_9999'), 'Error message identifies non-existent order ID');
  }
  assert(threwNotFound, 'Updating non-existent order throws Error');

  // =========================================================================
  // SECTION 4: FACTORY RESET DEEP IDEMPOTENCY & QUOTA RECOVERY
  // =========================================================================
  console.log(`\n${c.bold}${c.magenta}--- [SECTION 4] Factory Reset & State Recovery ---${c.reset}`);

  // 4.1 Perform aggressive mutations
  // - Mutate existing product
  await productService.updateProduct('prod_01', { name: 'MUTATED PRODUCT NAME', price: 9999999 });
  const mutatedProd = await productService.getProductById('prod_01');
  assertEqual(mutatedProd.name, 'MUTATED PRODUCT NAME', 'prod_01 was successfully mutated');

  // - Create new extraneous product
  const newProduct = await productService.createProduct({
    name: 'Temporary Extra Product',
    slug: 'temporary-extra-product',
    sku: 'TEMP-SKU-999',
    categoryId: 'thoi-trang-nam',
    categoryName: 'Thời Trang Nam',
    price: 150000,
    stock: 50,
    lowStockThreshold: 5,
    images: ['https://example.com/test.jpg'],
    tags: ['new'],
    status: 'active',
    options: [],
    variants: [],
    rating: 5,
    reviewCount: 0,
    salesCount: 0,
    shortDescription: 'test',
    description: 'test',
  });
  assert(Boolean(newProduct.id), 'Extra product created');
  const prodsBeforeReset = await productService.getProducts({ pageSize: 100 });
  assertEqual(prodsBeforeReset.total, 25, 'Catalog total grew to 25 products');

  // - Delete some orders
  await orderService.getRepository().delete('ORD-2026-001');
  const deletedOrd01 = await orderService.getOrderById('ORD-2026-001');
  assertEqual(deletedOrd01, null, 'ORD-2026-001 successfully deleted before reset');

  // - Add alien foreign keys to localStorage
  mockStorage.setItem('user_personal_session_token', 'SECRET_DO_NOT_DELETE');
  mockStorage.setItem('third_party_analytics_id', 'ANALYTICS_12345');
  // - Add corrupt/debug d2c key
  mockStorage.setItem('d2c_ecommerce:debug_log_temp', JSON.stringify({ junk: true }));

  // 4.2 Listen for reset event
  let resetEventFired = false;
  let resetEventDetail = null;
  const resetHandler = (e) => {
    resetEventFired = true;
    resetEventDetail = e.detail;
  };
  mockWindow.addEventListener('d2c:demo-data-reset', resetHandler);

  // 4.3 Trigger Factory Reset
  const resetResult = await systemService.resetDemoData();
  assertEqual(resetResult.success, true, 'resetDemoData returns success: true');
  assert(resetEventFired, 'd2c:demo-data-reset event was dispatched');
  assert(Boolean(resetEventDetail?.clearedKeys), 'Event detail contains clearedKeys');
  assert(Boolean(resetEventDetail?.seededCollections), 'Event detail contains seededCollections');

  // 4.4 Verify state recovery
  const prodsAfterReset = await productService.getProducts({ pageSize: 100 });
  assertEqual(prodsAfterReset.total, 24, 'Product count perfectly restored to 24');

  const restoredProd01 = await productService.getProductById('prod_01');
  assertEqual(restoredProd01.name, 'Áo Polo Nam Pique Cotton Thoáng Khí', 'prod_01 name restored to baseline seed');
  assertEqual(restoredProd01.price, 299000, 'prod_01 price restored to baseline seed');

  const restoredOrd01 = await orderService.getOrderById('ORD-2026-001');
  assert(Boolean(restoredOrd01), 'Deleted ORD-2026-001 restored from seed');
  assertEqual(restoredOrd01.id, 'ORD-2026-001', 'Restored ORD-2026-001 has correct ID');

  const tempProdCheck = await productService.getProductById(newProduct.id);
  assertEqual(tempProdCheck, null, 'Extra product was eradicated by factory reset');

  const ordersAfterReset = await orderService.getOrders({ pageSize: 100 });
  assertEqual(ordersAfterReset.total, 12, 'Order count restored to 12');

  const customersAfterReset = await customerService.getCustomers({ pageSize: 100 });
  assertEqual(customersAfterReset.total, 12, 'Customer count restored to 12');

  const couponsAfterReset = await couponService.getCoupons();
  assertEqual(couponsAfterReset.total, 7, 'Coupon count restored to 7');

  // 4.5 Namespace Hygiene: foreign keys MUST be preserved, d2c keys cleansed
  assertEqual(mockStorage.getItem('user_personal_session_token'), 'SECRET_DO_NOT_DELETE', 'Foreign key preserved');
  assertEqual(mockStorage.getItem('third_party_analytics_id'), 'ANALYTICS_12345', 'Third-party foreign key preserved');
  assertEqual(mockStorage.getItem('d2c_ecommerce:debug_log_temp'), null, 'App debug key was purged');

  mockWindow.removeEventListener('d2c:demo-data-reset', resetHandler);

  // =========================================================================
  // SECTION 5: MOCK LATENCY & CHAOS MODE ERROR INJECTION
  // =========================================================================
  console.log(`\n${c.bold}${c.magenta}--- [SECTION 5] Mock Latency & Chaos Simulator ---${c.reset}`);

  // 5.1 Latency jitter timing check
  mockEngine.updateConfig({ delayEnabled: true, minDelayMs: 60, maxDelayMs: 120, slowNetworkMode: false });
  const startT = Date.now();
  await mockEngine.simulateDelay();
  const elapsed = Date.now() - startT;
  assert(elapsed >= 50 && elapsed <= 250, `simulateDelay (60-120ms) elapsed ${elapsed}ms (within tolerance)`);

  // 5.2 Disabled latency check
  mockEngine.updateConfig({ delayEnabled: false });
  const startDisabled = Date.now();
  await mockEngine.simulateDelay();
  const elapsedDisabled = Date.now() - startDisabled;
  assert(elapsedDisabled < 20, `Disabled simulateDelay took ${elapsedDisabled}ms (< 20ms)`);

  // 5.3 Offline simulation
  mockEngine.updateConfig({ simulateOffline: true, delayEnabled: false });
  let caughtOffline = false;
  try {
    await productService.getProducts();
  } catch (err) {
    caughtOffline = true;
    assert(err instanceof DalApiError, 'Thrown error is instance of DalApiError');
    assertEqual(err.code, 'NETWORK_OFFLINE', 'Error code is "NETWORK_OFFLINE"');
    assertEqual(err.statusCode, 0, 'Offline status code is 0');
    assert(err.message.includes('Mất kết nối mạng'), 'Offline error message is localized in Vietnamese');
  }
  assert(caughtOffline, 'productService.getProducts threw offline error when simulateOffline is true');

  // 5.4 Internal server error simulation
  mockEngine.updateConfig({ simulateOffline: false, simulateServerError: true });
  let caughtServerError = false;
  try {
    await orderService.getOrderById('ORD-2026-001');
  } catch (err) {
    caughtServerError = true;
    assert(err instanceof DalApiError, 'Server error is instance of DalApiError');
    assertEqual(err.code, 'INTERNAL_SERVER_ERROR', 'Error code is "INTERNAL_SERVER_ERROR"');
    assertEqual(err.statusCode, 500, 'Server error status code is 500');
    assert(err.message.includes('Máy chủ gặp sự cố nội bộ'), 'Server error message is localized');
  }
  assert(caughtServerError, 'orderService.getOrderById threw 500 error when simulateServerError is true');

  // 5.5 Chaos mode errorRate simulation (100% chaos)
  mockEngine.updateConfig({ simulateServerError: false, errorRate: 1.0 });
  let caughtChaos = false;
  try {
    await customerService.getCustomerById('cust_01');
  } catch (err) {
    caughtChaos = true;
    assert(err instanceof DalApiError, 'Chaos error is instance of DalApiError');
    assertEqual(err.code, 'SIMULATED_CHAOS_ERROR', 'Error code is "SIMULATED_CHAOS_ERROR"');
    assertEqual(err.statusCode, 500, 'Chaos error status code is 500');
  }
  assert(caughtChaos, 'customerService.getCustomerById threw error when errorRate is 1.0');

  // 5.6 Restore pristine mock engine state
  mockEngine.updateConfig({
    delayEnabled: false,
    errorRate: 0,
    simulateOffline: false,
    simulateServerError: false,
  });

  // Verify restored mock engine allows normal operation
  const healthyCheck = await productService.getProductById('prod_01');
  assert(Boolean(healthyCheck), 'Restored mock engine executes normally without errors');

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log(`\n${c.bold}${c.cyan}========================================================================${c.reset}`);
  console.log(`${c.bold}${c.cyan}  TEST SUITE RESULTS SUMMARY                                            ${c.reset}`);
  console.log(`${c.bold}${c.cyan}========================================================================${c.reset}`);
  console.log(`  Total Assertions:  ${totalAssertions}`);
  console.log(`  Passed:            ${c.green}${passedAssertions}${c.reset}`);
  console.log(`  Failed:            ${failedAssertions > 0 ? c.red : c.green}${failedAssertions}${c.reset}`);

  if (failedAssertions > 0) {
    console.log(`\n${c.bold}${c.red}FAILURES:${c.reset}`);
    for (const f of failures) {
      console.log(`  - ${f}`);
    }
    process.exit(1);
  } else {
    console.log(`\n${c.bold}${c.green}★ ALL ADVERSARIAL CHALLENGER VERIFICATION TESTS PASSED (100% OK) ★${c.reset}\n`);
    process.exit(0);
  }
}

runChallengerSuite().catch((err) => {
  console.error(`\n${c.bgRed} FATAL TEST RUNNER EXCEPTION ${c.reset}`);
  console.error(err);
  process.exit(1);
});
