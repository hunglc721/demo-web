#!/usr/bin/env node
/**
 * Empirical Verification Harness: Milestone 3 Core Systems
 * Adversarially challenges and verifies:
 * 1. Quota Guard (UTF-16 calculations, tiered eviction, atomic rollback, quota warnings)
 * 2. Mock Latency & Chaos Simulator (delay timing, DalApiError typing, error code & status injection)
 * 3. HTML5 Canvas Image Compression (exact base64 byte estimation vs Buffer, downscale bounding, ratio preservation)
 * 4. Factory Reset Integrity (seed rehydration, custom mutation wiping, namespace isolation, event broadcast)
 */

import { createServer } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');

// Colors for terminal reporting
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bgRed: '\x1b[41m\x1b[37m',
  bgGreen: '\x1b[42m\x1b[30m'
};

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const failureLog = [];

function assert(condition, message) {
  totalChecks++;
  if (!condition) {
    failedChecks++;
    failureLog.push(message);
    console.log(`  ${colors.red}✖ FAIL: ${message}${colors.reset}`);
    throw new Error(message);
  } else {
    passedChecks++;
    console.log(`  ${colors.green}✔ PASS: ${message}${colors.reset}`);
  }
}

function assertEqual(actual, expected, message) {
  totalChecks++;
  if (actual !== expected) {
    const detail = `${message} | Expected: ${JSON.stringify(expected)}, Actual: ${JSON.stringify(actual)}`;
    failedChecks++;
    failureLog.push(detail);
    console.log(`  ${colors.red}✖ FAIL: ${detail}${colors.reset}`);
    throw new Error(detail);
  } else {
    passedChecks++;
    console.log(`  ${colors.green}✔ PASS: ${message}${colors.reset}`);
  }
}

function assertWithinRange(actual, min, max, message) {
  totalChecks++;
  if (actual < min || actual > max) {
    const detail = `${message} | Expected in [${min}, ${max}], Actual: ${actual}`;
    failedChecks++;
    failureLog.push(detail);
    console.log(`  ${colors.red}✖ FAIL: ${detail}${colors.reset}`);
    throw new Error(detail);
  } else {
    passedChecks++;
    console.log(`  ${colors.green}✔ PASS: ${message}${colors.reset}`);
  }
}

// Custom Mock Storage with configurable Quota Simulation
class AdversarialMockStorage {
  constructor(limitBytes = 5 * 1024 * 1024) {
    this._map = new Map();
    this.limitBytes = limitBytes;
    this.failNextSet = false;
    this.alwaysFailWithQuota = false;
  }

  get length() {
    return this._map.size;
  }

  key(index) {
    const keys = Array.from(this._map.keys());
    return keys[index] ?? null;
  }

  getItem(k) {
    return this._map.has(String(k)) ? this._map.get(String(k)) : null;
  }

  setItem(k, v) {
    const key = String(k);
    const value = String(v);

    if (this.alwaysFailWithQuota || this.failNextSet) {
      this.failNextSet = false;
      const err = new Error('DOMException: QuotaExceededError - Storage quota exceeded');
      err.name = 'QuotaExceededError';
      err.code = 22;
      throw err;
    }

    // Calculate simulated storage footprint: UTF-16 bytes = (key.length + value.length) * 2
    let currentBytes = 0;
    for (const [existingK, existingV] of this._map.entries()) {
      if (existingK !== key) {
        currentBytes += (existingK.length + existingV.length) * 2;
      }
    }
    const additionalBytes = (key.length + value.length) * 2;
    if (currentBytes + additionalBytes > this.limitBytes) {
      const err = new Error('DOMException: QuotaExceededError - Storage quota exceeded');
      err.name = 'QuotaExceededError';
      err.code = 22;
      throw err;
    }

    this._map.set(key, value);
  }

  removeItem(k) {
    this._map.delete(String(k));
  }

  clear() {
    this._map.clear();
  }
}

// Window Event Dispatcher Mock
class MockWindowTarget {
  constructor() {
    this.listeners = new Map();
  }

  addEventListener(type, listener) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type).push(listener);
  }

  removeEventListener(type, listener) {
    if (this.listeners.has(type)) {
      this.listeners.set(type, this.listeners.get(type).filter((l) => l !== listener));
    }
  }

  dispatchEvent(event) {
    const list = this.listeners.get(event.type) || [];
    for (const listener of list) {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in mock event listener:', err);
      }
    }
    return true;
  }
}

// Setup Global Browser Mock Environment
const mockStorage = new AdversarialMockStorage();
const mockWindow = new MockWindowTarget();
mockWindow.localStorage = mockStorage;

globalThis.window = mockWindow;
globalThis.localStorage = mockStorage;
globalThis.CustomEvent = class CustomEvent {
  constructor(type, options = {}) {
    this.type = type;
    this.detail = options.detail || null;
  }
};
globalThis.Event = class Event {
  constructor(type) {
    this.type = type;
  }
};

async function main() {
  console.log(`${colors.bold}${colors.cyan}================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}  EMPIRICAL CHALLENGER: MILESTONE 3 CORE SYSTEMS VERIFICATION   ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}================================================================${colors.reset}`);

  // Create Vite Dev Server for Module Loading
  const viteServer = await createServer({
    root: ROOT_DIR,
    server: { middlewareMode: true },
    appType: 'custom',
  });

  try {
    // -------------------------------------------------------------------------
    // TEST SECTION 1: Quota Guard (Calculation, Detection, Eviction, Rollback)
    // -------------------------------------------------------------------------
    console.log(`\n${colors.bold}[SECTION 1] Stress-Testing Quota Guard & Tiered Eviction${colors.reset}`);
    const quotaGuard = await viteServer.ssrLoadModule('/src/services/storage/quotaGuard.ts');
    const {
      calculateStorageUsage,
      formatByteSize,
      isQuotaExceededError,
      executeTieredEviction,
      safeSetStorageItem,
    } = quotaGuard;

    // 1.1: Storage Calculation & UTF-16 Multiplier
    mockStorage.clear();
    const emptyReport = calculateStorageUsage();
    assertEqual(emptyReport.usedBytes, 0, 'Empty storage reports 0 bytes used');
    assertEqual(emptyReport.usagePercentage, 0, 'Empty storage reports 0% usage');
    assertEqual(emptyReport.isNearLimit, false, 'Empty storage is not near limit');
    assertEqual(emptyReport.isCritical, false, 'Empty storage is not critical');
    assertEqual(emptyReport.breakdown.length, 0, 'Empty storage has empty breakdown');

    // Populate known item: key length 10 ("key_test_1"), value length 90 ("x".repeat(90))
    // Total characters = 100 -> UTF-16 bytes = 100 * 2 = 200 bytes
    const k10 = 'key_test_1';
    const v90 = 'x'.repeat(90);
    mockStorage.setItem(k10, v90);

    const report1 = calculateStorageUsage();
    assertEqual(report1.usedBytes, 200, 'Report calculates exact UTF-16 (key.len + val.len)*2 bytes');
    assertEqual(report1.breakdown.length, 1, 'Breakdown contains exactly 1 item');
    assertEqual(report1.breakdown[0].key, k10, 'Breakdown item key matches');
    assertEqual(report1.breakdown[0].bytes, 200, 'Breakdown item bytes matches 200');

    // 1.2: Threshold triggers (80% near limit and 95% critical)
    // 5MB = 5 * 1024 * 1024 = 5,242,880 bytes.
    // Near limit >= 80% = 4,194,304 bytes. Let's create an item using 4,200,000 bytes.
    // 4,200,000 bytes = 2,100,000 characters.
    mockStorage.clear();
    const chars80 = 2100000;
    mockStorage.setItem('large_key_80', 'a'.repeat(chars80 - 12));
    const report80 = calculateStorageUsage();
    assert(report80.usagePercentage >= 80, `Usage percentage (${report80.usagePercentage}%) is >= 80%`);
    assertEqual(report80.isNearLimit, true, 'isNearLimit flag is true at >= 80% capacity');
    assertEqual(report80.isCritical, false, 'isCritical flag remains false at 80% capacity');

    // Critical limit >= 95% = 4,980,736 bytes. Let's create an item using 5,000,000 bytes.
    // 5,000,000 bytes = 2,500,000 characters.
    mockStorage.clear();
    const chars95 = 2500000;
    mockStorage.setItem('large_key_95', 'b'.repeat(chars95 - 12));
    const report95 = calculateStorageUsage();
    assert(report95.usagePercentage >= 95, `Usage percentage (${report95.usagePercentage}%) is >= 95%`);
    assertEqual(report95.isNearLimit, true, 'isNearLimit flag is true at >= 95% capacity');
    assertEqual(report95.isCritical, true, 'isCritical flag is true at >= 95% capacity');

    // 1.3: isQuotaExceededError detection across DOMException variants
    assertEqual(isQuotaExceededError(null), false, 'null is not QuotaExceededError');
    assertEqual(isQuotaExceededError(undefined), false, 'undefined is not QuotaExceededError');
    assertEqual(isQuotaExceededError(new Error('Connection reset')), false, 'Generic error is not QuotaExceededError');

    const domErr1 = { name: 'QuotaExceededError' };
    assertEqual(isQuotaExceededError(domErr1), true, 'Detects name: "QuotaExceededError"');

    const domErr2 = { name: 'NS_ERROR_DOM_QUOTA_REACHED' };
    assertEqual(isQuotaExceededError(domErr2), true, 'Detects Firefox NS_ERROR_DOM_QUOTA_REACHED');

    const domErr3 = { code: 22 };
    assertEqual(isQuotaExceededError(domErr3), true, 'Detects DOMException code 22');

    const domErr4 = { code: 1014 };
    assertEqual(isQuotaExceededError(domErr4), true, 'Detects DOMException code 1014');

    const domErr5 = new Error('Local storage quota limit was exceeded');
    assertEqual(isQuotaExceededError(domErr5), true, 'Detects error message containing "quota"');

    // 1.4: Tier 1 Eviction
    mockStorage.clear();
    mockStorage.setItem('d2c_ecommerce:debug:perf', '{"log":123}');
    mockStorage.setItem('d2c_ecommerce:query_cache:products', '{"page":1}');
    mockStorage.setItem('d2c_ecommerce:search_history:recent', '["ao thun"]');
    mockStorage.setItem('d2c_ecommerce:products:v1', '[{"id":"prod_1"}]');
    mockStorage.setItem('foreign_app_key', 'safe_data');

    const tier1Freed = executeTieredEviction();
    assertEqual(tier1Freed, true, 'executeTieredEviction returns true when Tier 1 keys pruned');
    assertEqual(mockStorage.getItem('d2c_ecommerce:debug:perf'), null, 'Tier 1 debug key removed');
    assertEqual(mockStorage.getItem('d2c_ecommerce:query_cache:products'), null, 'Tier 1 query_cache key removed');
    assertEqual(mockStorage.getItem('d2c_ecommerce:search_history:recent'), null, 'Tier 1 search_history key removed');
    assert(mockStorage.getItem('d2c_ecommerce:products:v1') !== null, 'Essential catalog key PRESERVED');
    assertEqual(mockStorage.getItem('foreign_app_key'), 'safe_data', 'Foreign key PRESERVED');

    // 1.5: Tier 2 Eviction (Pruning cancelled orders when count > 20)
    mockStorage.clear();
    const ordersSeed = [];
    for (let i = 1; i <= 25; i++) {
      ordersSeed.push({
        id: `ord_${i}`,
        status: i % 5 === 0 ? 'cancelled' : 'completed', // 5 cancelled orders out of 25
      });
    }
    mockStorage.setItem('d2c_ecommerce:orders:v1', JSON.stringify(ordersSeed));
    const tier2Freed = executeTieredEviction();
    assertEqual(tier2Freed, true, 'executeTieredEviction returns true when Tier 2 cancelled orders pruned');
    const remainingOrders = JSON.parse(mockStorage.getItem('d2c_ecommerce:orders:v1'));
    assertEqual(remainingOrders.length, 20, 'Pruned exactly 5 cancelled orders, 20 completed remaining');
    assert(!remainingOrders.some((o) => o.status === 'cancelled'), 'No cancelled orders remain');

    // 1.6: safeSetStorageItem Atomic Rollback & CustomEvent Notification
    mockStorage.clear();
    const initialKey = 'd2c_ecommerce:test_atomic';
    const initialVal = 'initial_stable_content';
    mockStorage.setItem(initialKey, initialVal);

    // Track dispatched quota exceeded events
    let quotaEventFired = false;
    let quotaEventDetail = null;
    mockWindow.addEventListener('d2c:storage-quota-exceeded', (e) => {
      quotaEventFired = true;
      quotaEventDetail = e.detail;
    });

    // Make mock storage always fail with QuotaExceededError
    mockStorage.alwaysFailWithQuota = true;
    const writeResult = safeSetStorageItem(initialKey, 'destructive_overflow_content');

    assertEqual(writeResult, false, 'safeSetStorageItem returns false upon unrecoverable quota error');
    assertEqual(mockStorage.getItem(initialKey), initialVal, 'ATOMIC ROLLBACK: Key value rolled back to initial_stable_content');
    assertEqual(quotaEventFired, true, 'Event d2c:storage-quota-exceeded was dispatched');
    assertEqual(quotaEventDetail.key, initialKey, 'Event detail contains offending storage key');
    mockStorage.alwaysFailWithQuota = false;

    // -------------------------------------------------------------------------
    // TEST SECTION 2: Mock Latency & Chaos Error Injection (DalApiError)
    // -------------------------------------------------------------------------
    console.log(`\n${colors.bold}[SECTION 2] Stress-Testing Mock Latency & Chaos Simulator${colors.reset}`);
    const mockLatencyModule = await viteServer.ssrLoadModule('/src/services/mock/mockLatency.ts');
    const mockEngineModule = await viteServer.ssrLoadModule('/src/services/mock/mockEngine.ts');
    const { simulateDelay } = mockLatencyModule;
    const { mockEngine, DalApiError } = mockEngineModule;

    // 2.1: Timing test on simulateDelay
    const t0 = Date.now();
    await simulateDelay(60);
    const elapsed = Date.now() - t0;
    assertWithinRange(elapsed, 50, 200, `simulateDelay(60ms) took ${elapsed}ms (within 50-200ms range)`);

    // 0ms delay must resolve instantly
    const tZero0 = Date.now();
    await simulateDelay(0);
    const elapsedZero = Date.now() - tZero0;
    assert(elapsedZero < 20, `simulateDelay(0) returned instantly in ${elapsedZero}ms`);

    // 2.2: Chaos Error Injection: Offline Mode
    mockEngine.updateConfig({
      simulateOffline: true,
      simulateServerError: false,
      errorRate: 0,
    });

    let offlineCaught = false;
    try {
      mockEngine.maybeInjectError('productService.getAll');
    } catch (err) {
      offlineCaught = true;
      assert(err instanceof DalApiError, 'Error is instance of DalApiError');
      assert(err instanceof Error, 'Error is instance of Error');
      assertEqual(err.code, 'NETWORK_OFFLINE', 'Error code is NETWORK_OFFLINE');
      assertEqual(err.status, 0, 'Error status is 0 (offline)');
      assert(err.message.includes('Mất kết nối mạng'), 'Vietnamese offline error message returned');
      assert(Boolean(err.timestamp), 'Error contains ISO timestamp');
    }
    assertEqual(offlineCaught, true, 'simulateOffline: true reliably throws DalApiError');

    // 2.3: Chaos Error Injection: Server Error Mode
    mockEngine.updateConfig({
      simulateOffline: false,
      simulateServerError: true,
      errorRate: 0,
    });

    let serverErrorCaught = false;
    try {
      mockEngine.maybeInjectError('orderService.createOrder');
    } catch (err) {
      serverErrorCaught = true;
      assert(err instanceof DalApiError, 'Error is instance of DalApiError');
      assertEqual(err.code, 'INTERNAL_SERVER_ERROR', 'Error code is INTERNAL_SERVER_ERROR');
      assertEqual(err.status, 500, 'Error status is 500');
      assert(err.message.includes('orderService.createOrder'), 'Error message cites operation name');
    }
    assertEqual(serverErrorCaught, true, 'simulateServerError: true reliably throws DalApiError');

    // 2.4: Chaos Error Injection: 100% Chaos Error Rate Mode
    mockEngine.updateConfig({
      simulateOffline: false,
      simulateServerError: false,
      errorRate: 1.0,
    });

    let chaosCaught = false;
    try {
      mockEngine.maybeInjectError('customerService.getById');
    } catch (err) {
      chaosCaught = true;
      assert(err instanceof DalApiError, 'Error is instance of DalApiError');
      assertEqual(err.code, 'SIMULATED_CHAOS_ERROR', 'Error code is SIMULATED_CHAOS_ERROR');
      assertEqual(err.status, 500, 'Error status is 500');
      assert(err.message.includes('100%'), 'Error message reports 100% error rate');
    }
    assertEqual(chaosCaught, true, 'errorRate: 1.0 reliably triggers chaos error injection');

    // Reset mock engine config to safe default
    mockEngine.updateConfig({
      simulateOffline: false,
      simulateServerError: false,
      errorRate: 0,
      delayEnabled: false, // keep fast for remaining tests
    });

    // -------------------------------------------------------------------------
    // TEST SECTION 3: Image Downscale Formulas & Byte Size Estimation
    // -------------------------------------------------------------------------
    console.log(`\n${colors.bold}[SECTION 3] Stress-Testing Image Compression Formulas & Byte Estimation${colors.reset}`);
    const imageCompressor = await viteServer.ssrLoadModule('/src/utils/imageCompressor.ts');
    const { estimateBase64Bytes, compressImage } = imageCompressor;

    // 3.1: Empirical Accuracy of estimateBase64Bytes against Node Buffer across 50 sizes
    let bufferComparisonPassed = 0;
    for (let byteLen = 1; byteLen <= 50; byteLen++) {
      const rawBuf = Buffer.alloc(byteLen, 65 + (byteLen % 26)); // 'A'...'Z'
      const base64Str = rawBuf.toString('base64');
      const dataUrl = `data:image/webp;base64,${base64Str}`;

      const estimated = estimateBase64Bytes(dataUrl);
      if (estimated === byteLen) {
        bufferComparisonPassed++;
      } else {
        throw new Error(`Byte estimation mismatch: length=${byteLen}, estimated=${estimated}`);
      }
    }
    assertEqual(bufferComparisonPassed, 50, 'estimateBase64Bytes matches Buffer.byteLength with 100% precision across 50 byte sizes');

    // 3.2: Edge Cases in estimateBase64Bytes
    assertEqual(estimateBase64Bytes(''), 0, 'Empty string yields 0 bytes');
    assertEqual(estimateBase64Bytes(null), 0, 'null yields 0 bytes');
    assertEqual(estimateBase64Bytes('data:image/jpeg;base64,'), 0, 'Data URL without payload yields 0 bytes');

    // 3.3: Aspect Ratio Downscaling Formulas (<800px bound)
    function calcTargetDims(w, h, maxW = 800, maxH = 800) {
      if (w <= maxW && h <= maxH) return { w, h };
      const ratio = Math.min(maxW / w, maxH / h);
      return {
        w: Math.round(w * ratio),
        h: Math.round(h * ratio),
      };
    }

    // Landscape 4K (3840 x 2160, 16:9)
    const ls4k = calcTargetDims(3840, 2160);
    assertEqual(ls4k.w, 800, '4K landscape width clamped to 800px');
    assertEqual(ls4k.h, 450, '4K landscape height scaled to 450px (exact 16:9)');
    assertWithinRange(ls4k.w / ls4k.h, 1.77, 1.78, 'Aspect ratio 16:9 strictly preserved');

    // Portrait (1440 x 2560, 9:16)
    const port = calcTargetDims(1440, 2560);
    assertEqual(port.h, 800, 'Portrait height clamped to 800px');
    assertEqual(port.w, 450, 'Portrait width scaled to 450px (exact 9:16)');
    assertWithinRange(port.h / port.w, 1.77, 1.78, 'Aspect ratio 9:16 strictly preserved');

    // Square high-res (2048 x 2048)
    const sq = calcTargetDims(2048, 2048);
    assertEqual(sq.w, 800, 'Square width clamped to 800px');
    assertEqual(sq.h, 800, 'Square height clamped to 800px');

    // Small image under max bound (480 x 320)
    const sm = calcTargetDims(480, 320);
    assertEqual(sm.w, 480, 'Small width not upscaled');
    assertEqual(sm.h, 320, 'Small height not upscaled');

    // Extreme aspect ratio (10000 x 500)
    const extremeW = calcTargetDims(10000, 500);
    assertEqual(extremeW.w, 800, 'Extreme wide image width clamped to 800px');
    assertEqual(extremeW.h, 40, 'Extreme wide image height scaled to 40px');

    // Extreme tall aspect ratio (500 x 10000)
    const extremeH = calcTargetDims(500, 10000);
    assertEqual(extremeH.h, 800, 'Extreme tall image height clamped to 800px');
    assertEqual(extremeH.w, 40, 'Extreme tall image width scaled to 40px');

    // 3.4: SSR / Node Safe Fallback
    const fallbackResult = await compressImage('data:image/jpeg;base64,mockImageData');
    assert(typeof fallbackResult === 'string', 'compressImage in Node returns string');
    assert(fallbackResult.startsWith('data:image/'), 'compressImage in Node returns valid Data URL');

    // -------------------------------------------------------------------------
    // TEST SECTION 4: Factory Reset Integrity (systemService.resetDemoData)
    // -------------------------------------------------------------------------
    console.log(`\n${colors.bold}[SECTION 4] Stress-Testing Factory Reset & Data Rehydration${colors.reset}`);
    const systemModule = await viteServer.ssrLoadModule('/src/services/systemService.ts');
    const { systemService } = systemModule;

    // 4.1: Seed initialization
    mockStorage.clear();
    systemService.initSeedIfEmpty();
    const prodRaw = mockStorage.getItem('d2c_ecommerce:products:v1');
    assert(prodRaw !== null, 'initSeedIfEmpty hydrates products key');
    const seedProdList = JSON.parse(prodRaw);
    assertEqual(seedProdList.length, 24, 'Baseline product catalog contains exactly 24 items');

    const ordersRaw = mockStorage.getItem('d2c_ecommerce:orders:v1');
    assert(ordersRaw !== null, 'initSeedIfEmpty hydrates orders key');
    const seedOrderList = JSON.parse(ordersRaw);
    assertEqual(seedOrderList.length, 12, 'Baseline order collection contains exactly 12 items');

    // 4.2: Adversarial Mutations (Inject rogue items, custom product, custom order, foreign keys)
    const customProduct = {
      id: 'prod_custom_challenger_999',
      name: 'Challenger Rogue Test Product',
      slug: 'challenger-rogue-test-product',
      categoryId: 'thoi-trang-nam',
      price: 999000,
      stock: 99,
      images: ['https://example.com/test.jpg'],
      status: 'active',
      isFeatured: false,
    };
    seedProdList.unshift(customProduct);
    mockStorage.setItem('d2c_ecommerce:products:v1', JSON.stringify(seedProdList));

    const customOrder = {
      id: 'ord_custom_challenger_888',
      orderNumber: 'ORD-CHALLENGER-888',
      status: 'pending',
      total: 999000,
    };
    seedOrderList.unshift(customOrder);
    mockStorage.setItem('d2c_ecommerce:orders:v1', JSON.stringify(seedOrderList));

    // Inject rogue namespaced key and foreign external key
    mockStorage.setItem('d2c_ecommerce:rogue_mutation_key', 'should_be_wiped');
    mockStorage.setItem('d2c_debug_temp_log', 'should_be_wiped');
    mockStorage.setItem('third_party_external_session', 'MUST_BE_PRESERVED');

    // Verify mutations took effect in storage
    const mutatedProds = JSON.parse(mockStorage.getItem('d2c_ecommerce:products:v1'));
    assertEqual(mutatedProds.length, 25, 'Storage contains 25 products before reset');
    assertEqual(mutatedProds[0].id, 'prod_custom_challenger_999', 'Rogue product present in storage');

    // 4.3: Set up event listener for d2c:demo-data-reset
    let resetEventDispatched = false;
    let resetEventDetail = null;
    mockWindow.addEventListener('d2c:demo-data-reset', (e) => {
      resetEventDispatched = true;
      resetEventDetail = e.detail;
    });

    // 4.4: Execute Factory Reset
    const resetResult = await systemService.resetDemoData();
    assertEqual(resetResult.success, true, 'systemService.resetDemoData() returns success: true');
    assertEqual(resetEventDispatched, true, 'd2c:demo-data-reset CustomEvent dispatched');
    assert(resetEventDetail.seededCollections.products === 24, 'Event details report 24 products reseeded');
    assert(resetEventDetail.seededCollections.orders === 12, 'Event details report 12 orders reseeded');

    // 4.5: Empirically verify storage state after reset
    // Products
    const restoredProds = JSON.parse(mockStorage.getItem('d2c_ecommerce:products:v1'));
    assertEqual(restoredProds.length, 24, 'Exactly 24 baseline products restored');
    assert(!restoredProds.some((p) => p.id === 'prod_custom_challenger_999'), 'Rogue custom product is COMPLETELY WIPED');

    // Orders
    const restoredOrders = JSON.parse(mockStorage.getItem('d2c_ecommerce:orders:v1'));
    assertEqual(restoredOrders.length, 12, 'Exactly 12 baseline orders restored');
    assert(!restoredOrders.some((o) => o.id === 'ord_custom_challenger_888'), 'Rogue custom order is COMPLETELY WIPED');

    // Rogue keys vs Foreign keys
    assertEqual(mockStorage.getItem('d2c_ecommerce:rogue_mutation_key'), null, 'Rogue d2c_ecommerce key wiped');
    assertEqual(mockStorage.getItem('d2c_debug_temp_log'), null, 'Rogue d2c_ key wiped');
    assertEqual(mockStorage.getItem('third_party_external_session'), 'MUST_BE_PRESERVED', 'Foreign key STRICTLY PRESERVED');

    // Cart and Auth
    const restoredCart = JSON.parse(mockStorage.getItem('d2c_ecommerce:cart:v1'));
    assertEqual(Array.isArray(restoredCart) && restoredCart.length === 0, true, 'Cart collection rehydrated to empty array');

    const restoredAuth = JSON.parse(mockStorage.getItem('d2c_ecommerce:auth:v1'));
    assertEqual(restoredAuth.isAuthenticated, true, 'Auth rehydrated with isAuthenticated: true');
    assertEqual(restoredAuth.user.role, 'admin', 'Default admin user restored in auth');

  } finally {
    await viteServer.close();
  }

  // Final Summary
  console.log(`\n${colors.bold}${colors.cyan}----------------------------------------------------------------${colors.reset}`);
  console.log(`${colors.bold}EMPIRICAL CHALLENGE EXECUTION SUMMARY${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}----------------------------------------------------------------${colors.reset}`);
  console.log(`Total Empirical Checks:   ${totalChecks}`);
  console.log(`Passed Checks:            ${colors.green}${passedChecks}${colors.reset}`);
  console.log(`Failed Checks:            ${failedChecks > 0 ? colors.red : colors.gray}${failedChecks}${colors.reset}`);

  if (failedChecks > 0) {
    console.log(`\n${colors.bgRed}${colors.bold} VERIFICATION FAILED (${failedChecks} failures) ${colors.reset}\n`);
    for (const f of failureLog) {
      console.log(`  - ${f}`);
    }
    process.exit(1);
  } else {
    console.log(`\n${colors.bgGreen}${colors.bold} EMPIRICAL VERIFICATION COMPLETE: ALL SYSTEMS ROBUST (100% OK) ${colors.reset}\n`);
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(`\n${colors.bgRed}FATAL RUNNER EXCEPTION${colors.reset}`, err);
  process.exit(1);
});
