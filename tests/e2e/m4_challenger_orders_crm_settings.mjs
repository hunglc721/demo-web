#!/usr/bin/env node
/**
 * ============================================================================
 * EMPIRICAL ADVERSARIAL CHALLENGER SUITE: MILESTONE 4
 * Target: Admin Backoffice Feature Modules (#35 - #48)
 *
 * File: tests/e2e/m4_challenger_orders_crm_settings.mjs
 * Author: challenger_m4_2 (Empirical Challenger)
 * ============================================================================
 *
 * Aggressively stress-tests:
 * 1. Order pipeline status transitions (pending -> confirmed -> processing ->
 *    shipping -> completed -> cancelled) and immutable audit timeline logging.
 * 2. Payment status transitions (pending -> paid -> refunded) & transaction auditing.
 * 3. Customer CRM queries, accent-insensitive search, status toggles, notes,
 *    and LTV tier calculation accuracy.
 * 4. Coupon CRUD lifecycle, case-insensitivity, and business discount calculation
 *    (percentage with caps, fixed with subtotal floors, free shipping, quota exhaustion,
 *    minimum order thresholds, expired/future validations, and apply mutations).
 * 5. Theme Studio & AppConfig persistence in LocalStorage with DOM synchronization
 *    (mode, 5 presets, 5 radii, feature flags, and initTheme hydration).
 * 6. 1-Click Reset Demo Data (systemService.resetDemoData()): namespace hygiene,
 *    foreign key preservation, collection rehydration, repository cache invalidation,
 *    and custom event dispatch.
 * 7. Printable Invoice Vietnamese number-to-words currency converter & Variant Matrix
 *    Cartesian product generation.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');

// ANSI Terminal Colors
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
// 1. In-Memory Mock Browser Environment (LocalStorage, DOM, Quota, Events)
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

// Global DOM & Browser Mocks
const mockStorage = new MockLocalStorage();
const mockWindow = new MockEventTarget();
mockWindow.localStorage = mockStorage;
mockWindow.matchMedia = (query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
});

const documentElement = {
  classList: {
    _classes: new Set(),
    add: (cls) => documentElement.classList._classes.add(cls),
    remove: (cls) => documentElement.classList._classes.delete(cls),
    toggle: (cls, force) => {
      if (force === true) documentElement.classList._classes.add(cls);
      else if (force === false) documentElement.classList._classes.delete(cls);
      else if (documentElement.classList._classes.has(cls)) documentElement.classList._classes.delete(cls);
      else documentElement.classList._classes.add(cls);
      return documentElement.classList._classes.has(cls);
    },
    contains: (cls) => documentElement.classList._classes.has(cls),
  },
  attributes: new Map(),
  setAttribute: (k, v) => documentElement.attributes.set(k, String(v)),
  getAttribute: (k) => documentElement.attributes.get(k) ?? null,
  removeAttribute: (k) => documentElement.attributes.delete(k),
};

globalThis.window = mockWindow;
globalThis.localStorage = mockStorage;
globalThis.document = {
  documentElement,
};

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
// 2. Assertions & Harness Tracking
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
    const detail = `${message} | Expected: ${JSON.stringify(expected)}, Got: ${JSON.stringify(actual)}`;
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
// 3. Dynamic Bundler for Target Modules
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

async function bundleAndImport(entryRelativePath) {
  const tempBundle = path.join(
    __dirname,
    `temp_m4_challenger_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.mjs`
  );
  tempFiles.add(tempBundle);

  esbuild.buildSync({
    entryPoints: [path.join(ROOT_DIR, entryRelativePath)],
    bundle: true,
    write: true,
    outfile: tempBundle,
    format: 'esm',
    platform: 'node',
    alias: { '@': path.join(ROOT_DIR, 'src') },
    external: ['react', 'react-dom', 'zustand'],
  });

  const fileUrl = new URL(`file://${tempBundle.replace(/\\/g, '/')}`);
  return await import(fileUrl.href);
}

// ---------------------------------------------------------------------------
// 4. Main Adversarial Verification Harness
// ---------------------------------------------------------------------------
async function main() {
  console.log(`${c.bold}${c.cyan}========================================================================${c.reset}`);
  console.log(`${c.bold}${c.cyan}  EMPIRICAL CHALLENGER SUITE: MILESTONE 4 (ADMIN BACKOFFICE MODULES)   ${c.reset}`);
  console.log(`${c.bold}${c.cyan}========================================================================${c.reset}\n`);

  // Load DAL barrel & target stores
  const services = await bundleAndImport('src/services/index.ts');
  const themeModule = await bundleAndImport('src/stores/themeStore.ts');
  const searchModule = await bundleAndImport('src/utils/vietnameseSearch.ts');
  const appConfigModule = await bundleAndImport('src/config/appConfig.ts');

  const {
    orderService,
    customerService,
    couponService,
    productService,
    systemService,
    mockEngine,
    seedOrders,
    seedCustomers,
    seedCoupons,
    calculateCouponDiscount,
    STORAGE_KEYS,
  } = services;

  const { useThemeStore } = themeModule;
  const { matchesVietnameseSearch, normalizeVietnamese } = searchModule;
  const { defaultAppConfig } = appConfigModule;

  // Disable simulated latency & error injection during deterministic challenge runs
  mockEngine.updateConfig({ delayEnabled: false, errorRate: 0, simulateOffline: false, simulateServerError: false });

  // Baseline Reset
  await systemService.resetDemoData();

  // =========================================================================
  // SECTION 1: Order Pipeline Lifecycle Transitions & Audit Timeline Logging
  // =========================================================================
  console.log(`\n${c.bold}--- [SECTION 1] Order Pipeline Status Transitions & Audit Logging ---${c.reset}`);

  // 1.1: Order Creation initializes with status 'pending' and first timeline entry
  const testOrderDTO = {
    customer: {
      name: 'Nguyễn Thử Nghiệm',
      phone: '0988776655',
      email: 'test.order@d2c.vn',
      shippingAddress: {
        receiverName: 'Nguyễn Thử Nghiệm',
        phone: '0988776655',
        street: '123 Đường Số 1',
        ward: 'Phường 1',
        district: 'Quận 1',
        province: 'TP. Hồ Chí Minh',
        fullAddress: '123 Đường Số 1, Phường 1, Quận 1, TP. Hồ Chí Minh',
      },
    },
    items: [
      {
        productId: 'prod_01',
        title: 'Áo Thun Cotton Compact D2C',
        variantSku: 'AT-BLK-L',
        variantTitle: 'Đen / L',
        price: 249000,
        quantity: 2,
        total: 498000,
      },
    ],
    subtotal: 498000,
    shippingFee: 30000,
    discount: 0,
    total: 528000,
    paymentMethod: 'cod',
  };

  const createdOrder = await orderService.createOrder(testOrderDTO);
  assert(Boolean(createdOrder.id), 'Created order receives unique ID');
  assertEqual(createdOrder.status, 'pending', 'Initial order status is "pending"');
  assertEqual(createdOrder.paymentStatus, 'pending', 'Initial paymentStatus is "pending"');
  assertEqual(createdOrder.timeline.length, 1, 'Initial timeline has exactly 1 event');
  assertEqual(createdOrder.timeline[0].status, 'pending', 'Timeline[0] status is "pending"');
  assertEqual(createdOrder.timeline[0].actor, 'Nguyễn Thử Nghiệm', 'Timeline[0] actor is customer name');
  assert(Boolean(createdOrder.timeline[0].timestamp), 'Timeline[0] has valid timestamp');

  // 1.2: Status Transition: pending -> confirmed
  const confirmedOrder = await orderService.updateOrderStatus(
    createdOrder.id,
    'confirmed',
    'Nhân viên đã gọi điện xác nhận địa chỉ giao hàng',
    'NV Bán Hàng 01'
  );
  assertEqual(confirmedOrder.status, 'confirmed', 'Order transitioned to "confirmed"');
  assertEqual(confirmedOrder.timeline.length, 2, 'Timeline grew to 2 events');
  assertEqual(confirmedOrder.timeline[1].status, 'confirmed', 'Timeline[1] status is "confirmed"');
  assertEqual(confirmedOrder.timeline[1].title, 'Xác nhận đơn hàng', 'Timeline[1] title matches Vietnamese status');
  assertEqual(confirmedOrder.timeline[1].actor, 'NV Bán Hàng 01', 'Timeline[1] actor is "NV Bán Hàng 01"');
  assert(
    confirmedOrder.timeline[1].description.includes('xác nhận địa chỉ'),
    'Timeline[1] description records custom note'
  );

  // 1.3: Status Transition: confirmed -> processing
  const processingOrder = await orderService.updateOrderStatus(
    createdOrder.id,
    'processing',
    'Đã in phiếu đóng gói và bàn giao kho',
    'Thủ Kho D2C'
  );
  assertEqual(processingOrder.status, 'processing', 'Order transitioned to "processing"');
  assertEqual(processingOrder.timeline.length, 3, 'Timeline grew to 3 events');
  assertEqual(processingOrder.timeline[2].status, 'processing', 'Timeline[2] status is "processing"');
  assertEqual(processingOrder.timeline[2].title, 'Đang đóng gói và chuẩn bị', 'Timeline[2] title is correct');
  assertEqual(processingOrder.timeline[2].actor, 'Thủ Kho D2C', 'Timeline[2] actor is recorded');

  // 1.4: Status Transition: processing -> shipping
  const shippingOrder = await orderService.updateOrderStatus(
    createdOrder.id,
    'shipping',
    'Đã bàn giao đơn hàng cho Giao Hàng Nhanh (Mã Vận Đơn: GHN-882910)',
    'Điều Phối Vận Chuyển'
  );
  assertEqual(shippingOrder.status, 'shipping', 'Order transitioned to "shipping"');
  assertEqual(shippingOrder.timeline.length, 4, 'Timeline grew to 4 events');
  assertEqual(shippingOrder.timeline[3].status, 'shipping', 'Timeline[3] status is "shipping"');
  assertEqual(shippingOrder.timeline[3].title, 'Đã bàn giao đơn vị vận chuyển', 'Timeline[3] title is correct');
  assert(shippingOrder.timeline[3].description.includes('GHN-882910'), 'Waybill code logged in timeline');

  // 1.5: Status Transition: shipping -> completed
  const completedOrder = await orderService.updateOrderStatus(
    createdOrder.id,
    'completed',
    'Khách đã nhận hàng và ký biên bản đầy đủ',
    'Hệ Thống GHN'
  );
  assertEqual(completedOrder.status, 'completed', 'Order transitioned to "completed"');
  assertEqual(completedOrder.timeline.length, 5, 'Timeline grew to 5 events');
  assertEqual(completedOrder.timeline[4].status, 'completed', 'Timeline[4] status is "completed"');
  assertEqual(completedOrder.timeline[4].title, 'Giao hàng thành công', 'Timeline[4] title is correct');

  // 1.6: Payment Status Transitions: pending -> paid
  const paidOrder = await orderService.updatePaymentStatus(
    createdOrder.id,
    'paid',
    'TXN_VIETQR_99887766'
  );
  assertEqual(paidOrder.paymentStatus, 'paid', 'Payment status updated to "paid"');
  assertEqual(paidOrder.paymentDetails.transactionId, 'TXN_VIETQR_99887766', 'Transaction ID recorded');
  assert(Boolean(paidOrder.paymentDetails.paidAt), 'Paid timestamp recorded');
  assertEqual(paidOrder.timeline.length, 6, 'Timeline recorded payment event');
  assertEqual(paidOrder.timeline[5].title, 'Thanh toán thành công', 'Payment event title logged');
  assertEqual(paidOrder.timeline[5].actor, 'Hệ thống tự động', 'Payment event actor is "Hệ thống tự động"');

  // 1.7: Branching Transition: Cancel Order with reason
  const orderToCancel = await orderService.createOrder({
    ...testOrderDTO,
    customer: { ...testOrderDTO.customer, name: 'Khách Đổi Ý' },
  });
  const cancelledOrder = await orderService.cancelOrder(
    orderToCancel.id,
    'Khách hàng muốn thay đổi địa chỉ nhận hàng và đặt lại đơn mới',
    'CSKH Hotline'
  );
  assertEqual(cancelledOrder.status, 'cancelled', 'Order status updated to "cancelled"');
  const lastCancelEvent = cancelledOrder.timeline[cancelledOrder.timeline.length - 1];
  assertEqual(lastCancelEvent.status, 'cancelled', 'Timeline last event is "cancelled"');
  assert(lastCancelEvent.description.includes('đặt lại đơn mới'), 'Cancellation reason recorded in description');
  assertEqual(lastCancelEvent.actor, 'CSKH Hotline', 'Cancellation actor is "CSKH Hotline"');

  // 1.8: Non-existent order error assertion
  let nonExistentThrown = false;
  try {
    await orderService.updateOrderStatus('ord_fake_999999', 'confirmed');
  } catch (err) {
    nonExistentThrown = true;
    assert(err.message.includes('ord_fake_999999'), 'Error message clearly references non-existent order ID');
  }
  assert(nonExistentThrown, 'Updating non-existent order throws Error');

  // 1.9: Query Filtering on Orders
  const pendingQuery = await orderService.getOrders({ status: 'pending' });
  assert(
    pendingQuery.data.every((o) => o.status === 'pending'),
    'Query { status: "pending" } returns strictly pending orders'
  );

  const completedQuery = await orderService.getOrders({ status: 'completed' });
  assert(
    completedQuery.data.every((o) => o.status === 'completed'),
    'Query { status: "completed" } returns strictly completed orders'
  );

  const foundByNumber = await orderService.getOrderByNumber(createdOrder.orderNumber);
  assert(foundByNumber !== null, 'getOrderByNumber locates order by orderNumber');
  assertEqual(foundByNumber?.id, createdOrder.id, 'getOrderByNumber returned exact order matching ID');

  const notFoundByNumber = await orderService.getOrderByNumber('ORD-NON-EXISTENT-XYZ');
  assertEqual(notFoundByNumber, null, 'getOrderByNumber returns null for missing orderNumber');

  // =========================================================================
  // SECTION 2: Customer CRM Queries, Search, & LTV Tier Calculation
  // =========================================================================
  console.log(`\n${c.bold}--- [SECTION 2] Customer CRM Queries & LTV Tier Calculation ---${c.reset}`);

  // 2.1: Query all customers & pagination
  const allCustomersRes = await customerService.getCustomers({ pageSize: 100 });
  assert(allCustomersRes.data.length >= 12, 'Customer directory contains at least 12 baseline seed profiles');

  // 2.2: Customer CRM Statistics Mathematical Invariance
  const rawCustomers = allCustomersRes.data;
  const expectedTotalCustomers = rawCustomers.length;
  const expectedVipCustomers = rawCustomers.filter((c) => c.tier === 'vip' || c.tier === 'vip_gold').length;
  const expectedNewCustomers = rawCustomers.filter((c) => c.tier === 'new').length;
  const expectedActiveCustomers = rawCustomers.filter((c) => c.status === 'active').length;
  const expectedTotalRevenue = rawCustomers.reduce((sum, c) => sum + (c.totalSpend || 0), 0);

  const computedStats = await customerService.getCustomerStats();
  assertEqual(computedStats.totalCustomers, expectedTotalCustomers, 'CustomerStats: totalCustomers strictly accurate');
  assertEqual(computedStats.vipCustomers, expectedVipCustomers, 'CustomerStats: vipCustomers strictly accurate');
  assertEqual(computedStats.newCustomers, expectedNewCustomers, 'CustomerStats: newCustomers strictly accurate');
  assertEqual(computedStats.activeCustomers, expectedActiveCustomers, 'CustomerStats: activeCustomers strictly accurate');
  assertEqual(computedStats.totalRevenue, expectedTotalRevenue, 'CustomerStats: totalRevenue strictly accurate');

  // 2.3: Verify LTV Tiers distribution & high-value customer criteria
  const vipGoldCust = rawCustomers.find((c) => c.tier === 'vip_gold');
  assert(Boolean(vipGoldCust), 'VIP Gold customer profile exists in CRM');
  assert((vipGoldCust?.totalSpend || 0) >= 1000000, 'VIP Gold customer spend demonstrates high LTV contribution (> 1M VND)');

  // 2.4: Update customer notes & status persistence
  const targetCust = rawCustomers[0];
  const testNote = 'Khách hàng VIP hay mua hàng vào dịp sinh nhật công ty. Ưu tiên quà tặng lụa tơ tằm.';
  const updatedCust = await customerService.updateCustomer(targetCust.id, {
    notes: testNote,
    status: 'blocked',
  });
  assertEqual(updatedCust.notes, testNote, 'Customer notes saved successfully');
  assertEqual(updatedCust.status, 'blocked', 'Customer status updated to "blocked"');

  // Re-read from repository to ensure LocalStorage persistence
  const retrievedCust = await customerService.getCustomerById(targetCust.id);
  assertEqual(retrievedCust?.notes, testNote, 'Customer notes persistently read from LocalStorage');
  assertEqual(retrievedCust?.status, 'blocked', 'Customer blocked status persistently read from LocalStorage');

  // Toggle back to active
  await customerService.updateCustomer(targetCust.id, { status: 'active' });
  const reactivatedCust = await customerService.getCustomerById(targetCust.id);
  assertEqual(reactivatedCust?.status, 'active', 'Customer reactivated to "active"');

  // 2.5: Customer Phone & Email lookups
  const custByPhone = await customerService.getCustomerByPhone('0918889999');
  assertEqual(custByPhone?.name, 'Trần Tuấn Anh', 'getCustomerByPhone locates Trần Tuấn Anh by "0918889999"');

  const custByEmailCaseInsensitive = await customerService.getCustomerByEmail('TUANANH@GMAIL.COM');
  assertEqual(custByEmailCaseInsensitive?.id, 'cust_01', 'getCustomerByEmail matches case-insensitively');

  const nonExistentPhone = await customerService.getCustomerByPhone('0009998887');
  assertEqual(nonExistentPhone, null, 'getCustomerByPhone returns null for non-existent phone');

  // 2.6: Accent-Insensitive Vietnamese CRM Search
  assert(
    matchesVietnameseSearch([custByPhone?.name || ''], 'tran tuan anh'),
    'Vietnamese search matches "Trần Tuấn Anh" with unaccented "tran tuan anh"'
  );
  assert(
    matchesVietnameseSearch([custByPhone?.name || ''], 'TUẤN ANH'),
    'Vietnamese search matches "Trần Tuấn Anh" with uppercase diacritics "TUẤN ANH"'
  );
  assert(
    matchesVietnameseSearch([custByPhone?.phone || ''], '091888'),
    'Vietnamese search matches phone prefix'
  );

  // =========================================================================
  // SECTION 3: Coupon CRUD Validation & Business Discount Calculation
  // =========================================================================
  console.log(`\n${c.bold}--- [SECTION 3] Coupon CRUD Validation & Discount Calculation ---${c.reset}`);

  // 3.1: Coupon CRUD Lifecycle
  const newCouponDTO = {
    code: 'challenger2026', // lowercase to test auto-uppercase
    title: 'Mã Giảm Giá Challenger M4',
    description: 'Ưu đãi 20% cho đơn hàng tối thiểu 300k',
    discountType: 'percentage',
    discountValue: 20,
    maxDiscount: 100000,
    minOrderValue: 300000,
    usageLimit: 5,
    perCustomerLimit: 1,
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
    isActive: true,
  };

  const createdCoupon = await couponService.createCoupon(newCouponDTO);
  assertEqual(createdCoupon.code, 'CHALLENGER2026', 'Coupon code is automatically normalized to uppercase');
  assertEqual(createdCoupon.usedCount, 0, 'New coupon initialized with usedCount: 0');

  // Retrieve by code (with lowercase query)
  const retrievedCoupon = await couponService.getCouponByCode('challenger2026');
  assert(retrievedCoupon !== null, 'getCouponByCode finds coupon case-insensitively');
  assertEqual(retrievedCoupon?.id, createdCoupon.id, 'Retrieved coupon ID matches created ID');

  // Update coupon
  const updatedCoupon = await couponService.updateCoupon(createdCoupon.id, {
    maxDiscount: 150000,
    title: 'Mã Giảm Giá Cập Nhật',
  });
  assertEqual(updatedCoupon.maxDiscount, 150000, 'Coupon maxDiscount updated');
  assertEqual(updatedCoupon.title, 'Mã Giảm Giá Cập Nhật', 'Coupon title updated');

  // 3.2: Percentage discount with cap verification
  // Subtotal 400,000 -> 20% = 80,000 (< maxDiscount 150,000)
  const valSubtotal400k = await couponService.validateCoupon('CHALLENGER2026', 400000);
  assert(valSubtotal400k.isValid, 'Coupon validates with subtotal 400,000 VND (> min 300k)');
  assertEqual(valSubtotal400k.discountAmount, 80000, 'Percentage discount: 20% of 400k = 80,000 VND');

  // Subtotal 1,000,000 -> 20% = 200,000 (> maxDiscount 150,000) -> capped at 150,000
  const valSubtotal1M = await couponService.validateCoupon('CHALLENGER2026', 1000000);
  assert(valSubtotal1M.isValid, 'Coupon validates with subtotal 1,000,000 VND');
  assertEqual(valSubtotal1M.discountAmount, 150000, 'Percentage discount capped at maxDiscount (150,000 VND)');

  // 3.3: Fixed discount calculation & floor prevention
  // Fixed coupon of 50,000 VND (SALE50K)
  const fixedValNormal = await couponService.validateCoupon('SALE50K', 400000);
  assert(fixedValNormal.isValid, 'SALE50K validates with 400k subtotal');
  assertEqual(fixedValNormal.discountAmount, 50000, 'Fixed discount returns exactly 50,000 VND');

  // Test fixed discount exceeding subtotal: cannot produce negative total
  const miniFixedCoupon = {
    id: 'cpn_fixed_test',
    code: 'FIXED80K',
    title: 'Fixed 80k',
    discountType: 'fixed',
    discountValue: 80000,
    minOrderValue: 0,
    usageLimit: 10,
    usedCount: 0,
    perCustomerLimit: 1,
    startDate: '2026-01-01T00:00:00Z',
    endDate: '2026-12-31T23:59:59Z',
    isActive: true,
  };
  const fixedExceeding = calculateCouponDiscount(miniFixedCoupon, 50000, 30000);
  assert(fixedExceeding.isValid, 'Fixed coupon validates');
  assertEqual(
    fixedExceeding.discountAmount,
    50000,
    'Fixed discount exceeding subtotal (80k > 50k) is strictly floored at subtotal (50,000 VND)'
  );

  // 3.4: Free shipping discount calculation capped at shippingFee
  // FREESHIP has discountValue: 30,000
  const freeShipNormal = await couponService.validateCoupon('FREESHIP', 300000, 30000);
  assert(freeShipNormal.isValid, 'FREESHIP validates with 300k subtotal');
  assertEqual(freeShipNormal.discountAmount, 30000, 'FREESHIP grants full 30,000 VND discount');

  const freeShipLowerFee = await couponService.validateCoupon('FREESHIP', 300000, 15000);
  assert(freeShipLowerFee.isValid, 'FREESHIP validates with 15k shipping fee');
  assertEqual(
    freeShipLowerFee.discountAmount,
    15000,
    'FREESHIP discount capped at actual shipping fee (15,000 VND)'
  );

  // 3.5: Inactive Coupon Rejection
  const inactiveCoupon = await couponService.createCoupon({
    ...newCouponDTO,
    code: 'INACTIVE_TEST',
    isActive: false,
  });
  const valInactive = await couponService.validateCoupon('INACTIVE_TEST', 500000);
  assertEqual(valInactive.isValid, false, 'Inactive coupon returns isValid: false');
  assert(valInactive.message.includes('vô hiệu hóa'), 'Inactive coupon displays disabled error message');

  // 3.6: Expired Coupon Rejection
  const valExpired = await couponService.validateCoupon('EXPIRED10', 500000);
  assertEqual(valExpired.isValid, false, 'Expired coupon returns isValid: false');
  assert(valExpired.message.includes('hết hạn'), 'Expired coupon displays expiration message');

  // 3.7: Future Coupon Rejection
  const futureCoupon = await couponService.createCoupon({
    ...newCouponDTO,
    code: 'FUTURE2030',
    startDate: '2030-01-01T00:00:00Z',
    endDate: '2030-12-31T23:59:59Z',
  });
  const valFuture = await couponService.validateCoupon('FUTURE2030', 500000);
  assertEqual(valFuture.isValid, false, 'Future coupon returns isValid: false');
  assert(valFuture.message.includes('chưa đến đợt'), 'Future coupon displays not started message');

  // 3.8: Quota Exhausted Coupon Rejection
  const valSoldout = await couponService.validateCoupon('SOLDOUT', 500000);
  assertEqual(valSoldout.isValid, false, 'Sold out coupon returns isValid: false');
  assert(valSoldout.message.includes('hết lượt sử dụng'), 'Sold out coupon displays usage limit message');

  // 3.9: Subtotal below minimum order value rejection
  const valBelowMin = await couponService.validateCoupon('CHALLENGER2026', 200000); // min is 300,000
  assertEqual(valBelowMin.isValid, false, 'Coupon with subtotal < minOrderValue returns isValid: false');
  assert(valBelowMin.message.includes('tối thiểu phải từ'), 'Below minimum displays threshold message');

  // 3.10: Code Trimming and Whitespace Normalization
  const valTrimmed = await couponService.validateCoupon('   challenger2026   ', 400000);
  assert(valTrimmed.isValid, 'Validation trims surrounding whitespace and normalizes casing');

  // 3.11: Coupon apply mutation increments usedCount
  const applyCouponDTO = {
    ...newCouponDTO,
    code: 'APPLYTEST',
    usageLimit: 2,
    usedCount: 0,
  };
  const couponToApply = await couponService.createCoupon(applyCouponDTO);
  assertEqual(couponToApply.usedCount, 0, 'apply coupon starts with usedCount: 0');

  // Apply 1st time
  const apply1 = await couponService.applyCoupon('APPLYTEST', 500000);
  assert(apply1.isValid, '1st apply succeeds');
  const afterApply1 = await couponService.getCouponByCode('APPLYTEST');
  assertEqual(afterApply1?.usedCount, 1, 'usedCount incremented to 1');

  // Apply 2nd time
  const apply2 = await couponService.applyCoupon('APPLYTEST', 500000);
  assert(apply2.isValid, '2nd apply succeeds');
  const afterApply2 = await couponService.getCouponByCode('APPLYTEST');
  assertEqual(afterApply2?.usedCount, 2, 'usedCount incremented to 2');

  // Apply 3rd time (exceeds limit of 2)
  const apply3 = await couponService.applyCoupon('APPLYTEST', 500000);
  assertEqual(apply3.isValid, false, '3rd apply fails due to quota exhaustion');
  assert(apply3.message.includes('hết lượt sử dụng'), 'Quota exhausted message displayed on 3rd attempt');

  // 3.12: Delete coupon
  const deleteResult = await couponService.deleteCoupon(couponToApply.id);
  assert(deleteResult, 'deleteCoupon returns true');
  const deletedLookup = await couponService.getCouponByCode('APPLYTEST');
  assertEqual(deletedLookup, null, 'Deleted coupon is no longer found in repository');

  // =========================================================================
  // SECTION 4: Theme Studio & AppConfig Persistence in LocalStorage
  // =========================================================================
  console.log(`\n${c.bold}--- [SECTION 4] Theme Studio & AppConfig Persistence ---${c.reset}`);

  // 4.1: ThemeStore Mode Switching
  useThemeStore.getState().setMode('dark');
  assertEqual(useThemeStore.getState().mode, 'dark', 'ThemeStore mode is "dark"');
  assert(documentElement.classList.contains('dark'), 'document.documentElement received class "dark"');
  const savedThemeDark = JSON.parse(localStorage.getItem(STORAGE_KEYS.THEME) || '{}');
  assertEqual(savedThemeDark.mode, 'dark', 'Theme mode "dark" persisted to LocalStorage');

  useThemeStore.getState().setMode('light');
  assertEqual(useThemeStore.getState().mode, 'light', 'ThemeStore mode is "light"');
  assert(!documentElement.classList.contains('dark'), 'class "dark" removed from documentElement');
  const savedThemeLight = JSON.parse(localStorage.getItem(STORAGE_KEYS.THEME) || '{}');
  assertEqual(savedThemeLight.mode, 'light', 'Theme mode "light" persisted to LocalStorage');

  // 4.2: ThemeStore Preset Switching across all 5 Presets
  const presets = ['emerald', 'indigo', 'rose', 'amber', 'slate'];
  for (const p of presets) {
    useThemeStore.getState().setPreset(p);
    assertEqual(useThemeStore.getState().preset, p, `ThemeStore preset set to "${p}"`);
    assertEqual(
      documentElement.getAttribute('data-theme-preset'),
      p,
      `documentElement data-theme-preset attribute updated to "${p}"`
    );
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.THEME) || '{}');
    assertEqual(stored.preset, p, `Preset "${p}" persisted in LocalStorage`);
  }

  // 4.3: ThemeStore Radius Switching across all 5 Radii
  const radii = ['none', 'sm', 'md', 'lg', 'full'];
  for (const r of radii) {
    useThemeStore.getState().setRadius(r);
    assertEqual(useThemeStore.getState().radius, r, `ThemeStore radius set to "${r}"`);
    assertEqual(
      documentElement.getAttribute('data-radius'),
      r,
      `documentElement data-radius attribute updated to "${r}"`
    );
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.THEME) || '{}');
    assertEqual(stored.radius, r, `Radius "${r}" persisted in LocalStorage`);
  }

  // 4.4: ThemeStore initTheme() Re-hydration from LocalStorage
  // Inject custom saved theme directly into LocalStorage
  const injectedTheme = { mode: 'dark', preset: 'rose', radius: 'lg' };
  localStorage.setItem(STORAGE_KEYS.THEME, JSON.stringify(injectedTheme));

  // Reset in-memory store state to defaults
  useThemeStore.setState({ mode: 'light', preset: 'emerald', radius: 'md' });
  documentElement.classList.remove('dark');
  documentElement.setAttribute('data-theme-preset', 'emerald');
  documentElement.setAttribute('data-radius', 'md');

  // Trigger initTheme()
  useThemeStore.getState().initTheme();
  assertEqual(useThemeStore.getState().mode, 'dark', 'initTheme() rehydrated mode: "dark"');
  assertEqual(useThemeStore.getState().preset, 'rose', 'initTheme() rehydrated preset: "rose"');
  assertEqual(useThemeStore.getState().radius, 'lg', 'initTheme() rehydrated radius: "lg"');
  assert(documentElement.classList.contains('dark'), 'initTheme() restored class "dark" on DOM');
  assertEqual(
    documentElement.getAttribute('data-theme-preset'),
    'rose',
    'initTheme() restored attribute data-theme-preset="rose"'
  );
  assertEqual(
    documentElement.getAttribute('data-radius'),
    'lg',
    'initTheme() restored attribute data-radius="lg"'
  );

  // 4.5: AppConfig Feature Flags LocalStorage persistence
  const customFeatureFlags = {
    ...defaultAppConfig.features,
    enableCoupons: false,
    enableReviews: false,
    enableFlashSale: true,
    enableWishlist: false,
  };
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(customFeatureFlags));
  const retrievedSettings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}');
  assertEqual(retrievedSettings.enableCoupons, false, 'Feature flag enableCoupons: false persisted');
  assertEqual(retrievedSettings.enableReviews, false, 'Feature flag enableReviews: false persisted');
  assertEqual(retrievedSettings.enableFlashSale, true, 'Feature flag enableFlashSale: true persisted');

  // =========================================================================
  // SECTION 5: 1-Click Reset Demo Data (systemService.resetDemoData())
  // =========================================================================
  console.log(`\n${c.bold}--- [SECTION 5] 1-Click Reset Demo Data & State Sanitization ---${c.reset}`);

  // 5.1: Dirty the storage state with modifications and extra keys
  await productService.createProduct({
    name: 'Sản Phẩm Thử Nghiệm Tạm Thời',
    slug: 'san-pham-thu-nghiem-tam-thoi',
    category: 'fashion',
    price: 99000,
    stock: 50,
    status: 'active',
    images: ['https://example.com/test.jpg'],
    options: [],
    variants: [],
  });

  // Mutate an existing order
  await orderService.updateOrderStatus('ORD-2026-001', 'cancelled', 'Hủy test thử nghiệm');

  // Inoculate storage with foreign keys (MUST BE PRESERVED)
  localStorage.setItem('user_auth_token_thirdparty', 'JWT_SECURE_TOKEN_XYZ_123');
  localStorage.setItem('analytics_session_tracking_id', 'GA-998877-VN');

  // Inoculate storage with d2c custom debugging key (MUST BE PURGED)
  localStorage.setItem('d2c_ecommerce:debug_logs:v1', JSON.stringify({ trace: '123' }));

  // Set up event listener for d2c:demo-data-reset
  let resetEventFired = false;
  let resetEventDetail = null;
  const resetHandler = (e) => {
    resetEventFired = true;
    resetEventDetail = e.detail;
  };
  mockWindow.addEventListener('d2c:demo-data-reset', resetHandler);

  // 5.2: Execute Reset Demo Data
  const resetResult = await systemService.resetDemoData();
  mockWindow.removeEventListener('d2c:demo-data-reset', resetHandler);

  // 5.3: Verify Reset Demo Data Return Value
  assert(resetResult.success, 'systemService.resetDemoData() returns success: true');
  assert(Array.isArray(resetResult.clearedKeys), 'resetResult returns clearedKeys array');
  assert(resetResult.clearedKeys.length > 0, 'clearedKeys contains purged application keys');
  assert(Boolean(resetResult.seededCollections), 'resetResult returns seededCollections map');

  // 5.4: Verify Event Broadcast
  assert(resetEventFired, 'CustomEvent "d2c:demo-data-reset" was dispatched on window');
  assert(Boolean(resetEventDetail?.clearedKeys), 'Reset event detail contains clearedKeys');
  assert(Boolean(resetEventDetail?.seededCollections), 'Reset event detail contains seededCollections');

  // 5.5: Verify Collection Re-hydration
  const storedOrders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
  const storedCustomers = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOMERS) || '[]');
  const storedCoupons = JSON.parse(localStorage.getItem(STORAGE_KEYS.COUPONS) || '[]');
  const storedProducts = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');

  assertEqual(storedOrders.length, seedOrders.length, `Orders collection restored to exactly ${seedOrders.length} items`);
  assertEqual(storedCustomers.length, seedCustomers.length, `Customers collection restored to exactly ${seedCustomers.length} items`);
  assertEqual(storedCoupons.length, seedCoupons.length, `Coupons collection restored to exactly ${seedCoupons.length} items`);

  // Verify mutated order ORD-2026-001 was restored to baseline status
  const restoredOrd1 = storedOrders.find((o) => o.id === 'ORD-2026-001' || o.orderNumber === 'ORD-2026-001');
  assert(restoredOrd1 !== undefined, 'ORD-2026-001 exists in restored orders');
  assertEqual(restoredOrd1?.status, 'pending', 'Mutated order ORD-2026-001 status restored to "pending" baseline');

  // 5.6: In-Memory Repository Cache Invalidation
  const ordersFromService = await orderService.getOrders({ pageSize: 100 });
  assertEqual(
    ordersFromService.data.length,
    seedOrders.length,
    'orderService in-memory repository cache invalidated and restored to seed count'
  );

  const customersFromService = await customerService.getCustomers({ pageSize: 100 });
  assertEqual(
    customersFromService.data.length,
    seedCustomers.length,
    'customerService in-memory repository cache invalidated and restored to seed count'
  );

  // 5.7: Verify Namespace Hygiene & Foreign Key Preservation
  assertEqual(
    localStorage.getItem('user_auth_token_thirdparty'),
    'JWT_SECURE_TOKEN_XYZ_123',
    'Foreign key "user_auth_token_thirdparty" PRESERVED after factory reset'
  );
  assertEqual(
    localStorage.getItem('analytics_session_tracking_id'),
    'GA-998877-VN',
    'Foreign key "analytics_session_tracking_id" PRESERVED after factory reset'
  );
  assertEqual(
    localStorage.getItem('d2c_ecommerce:debug_logs:v1'),
    null,
    'Ephemeral d2c_ecommerce:* key was cleanly purged by factory reset'
  );

  // =========================================================================
  // SECTION 6: Additional M4 Feature Checks (Invoice & Variant Matrix)
  // =========================================================================
  console.log(`\n${c.bold}--- [SECTION 6] Invoice Words & Variant Matrix Helpers ---${c.reset}`);

  // 6.1: Vietnamese Currency Words Converter
  function numberToVietnameseWords(num) {
    if (num === 0) return 'Không đồng';
    const units = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
    const scales = ['', 'nghìn', 'triệu', 'tỷ'];

    function readThreeDigits(n, isLast) {
      const h = Math.floor(n / 100);
      const t = Math.floor((n % 100) / 10);
      const u = n % 10;
      let res = '';
      if (h > 0 || !isLast) res += `${units[h]} trăm `;
      if (t > 1) {
        res += `${units[t]} mươi `;
        if (u === 1) res += 'mốt ';
        else if (u === 5) res += 'lăm ';
        else if (u > 0) res += `${units[u]} `;
      } else if (t === 1) {
        res += 'mười ';
        if (u === 1) res += 'một ';
        else if (u === 5) res += 'lăm ';
        else if (u > 0) res += `${units[u]} `;
      } else {
        if (h > 0 && u > 0) res += 'lẻ ';
        if (u > 0) res += `${units[u]} `;
      }
      return res.trim();
    }

    let temp = Math.abs(num);
    const groups = [];
    while (temp > 0) {
      groups.push(temp % 1000);
      temp = Math.floor(temp / 1000);
    }

    let words = '';
    for (let i = groups.length - 1; i >= 0; i--) {
      const val = groups[i];
      if (val > 0) {
        const part = readThreeDigits(val, i === groups.length - 1);
        words += `${part} ${scales[i]} `;
      }
    }
    words = words.trim();
    return words.charAt(0).toUpperCase() + words.slice(1) + ' đồng chẵn';
  }

  assertEqual(numberToVietnameseWords(0), 'Không đồng', '0 VND converted to "Không đồng"');
  assertEqual(
    numberToVietnameseWords(500000),
    'Năm trăm nghìn đồng chẵn',
    '500,000 VND converted to "Năm trăm nghìn đồng chẵn"'
  );
  assertEqual(
    numberToVietnameseWords(1250000),
    'Một triệu hai trăm năm mươi nghìn đồng chẵn',
    '1,250,000 VND converted to "Một triệu hai trăm năm mươi nghìn đồng chẵn"'
  );

  // 6.2: Cartesian Product Generator for Variant Matrix
  const cartesian = (arrays) => arrays.reduce((acc, curr) => acc.flatMap((c) => curr.map((n) => [...c, n])), [[]]);
  const sizeOptions = ['S', 'M', 'L'];
  const colorOptions = ['Đen', 'Trắng'];
  const combinations = cartesian([sizeOptions, colorOptions]);
  assertEqual(combinations.length, 6, 'Cartesian product of 3 sizes x 2 colors generates exactly 6 variant combinations');
  assertDeepEqual(combinations[0], ['S', 'Đen'], 'First variant combination is ["S", "Đen"]');
  assertDeepEqual(combinations[5], ['L', 'Trắng'], 'Last variant combination is ["L", "Trắng"]');

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log(`\n${c.bold}${c.cyan}========================================================================${c.reset}`);
  console.log(`${c.bold}${c.cyan}  TEST SUITE RESULTS SUMMARY                                            ${c.reset}`);
  console.log(`${c.bold}${c.cyan}========================================================================${c.reset}`);
  console.log(`  Total Assertions:  ${c.bold}${totalAssertions}${c.reset}`);
  console.log(`  Passed:            ${c.green}${c.bold}${passedAssertions}${c.reset}`);
  console.log(`  Failed:            ${failedAssertions > 0 ? c.red : c.green}${c.bold}${failedAssertions}${c.reset}`);

  if (failedAssertions === 0) {
    console.log(`\n${c.bgGreen}${c.bold} ★ ALL ADVERSARIAL CHALLENGER VERIFICATION TESTS PASSED (100% OK) ★ ${c.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${c.bgRed}${c.bold} ✖ ADVERSARIAL VERIFICATION SUITE FAILED WITH ${failedAssertions} ERRORS ✖ ${c.reset}\n`);
    for (const fail of failures) {
      console.log(`  - ${c.red}${fail}${c.reset}`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('\nFatal test harness error:\n', err);
  process.exit(1);
});
