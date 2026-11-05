/**
 * EMPIRICAL CHALLENGER TEST SUITE: MILESTONE 3 (DAL, Query Engine, Vietnamese Search, Mock Services)
 * Adversarial stress harness verifying runtime behavior, boundary cases, and edge dynamics.
 * File: tests/e2e/temp_verify_m3_dal.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');

// ---------------------------------------------------------------------------
// 1. In-Memory Mock LocalStorage with Quota Support
// ---------------------------------------------------------------------------
class MockLocalStorage {
  constructor(options = {}) {
    this._store = new Map();
    this.quotaBytes = options.quotaBytes || 5 * 1024 * 1024; // 5MB standard limit
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
        error.code = 22;
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
}

// Install mock environment globals
const mockStorage = new MockLocalStorage({ quotaBytes: 5 * 1024 * 1024, enforceQuota: true });
globalThis.localStorage = mockStorage;

const eventListeners = new Map();
globalThis.window = {
  localStorage: mockStorage,
  addEventListener: (type, fn) => {
    if (!eventListeners.has(type)) eventListeners.set(type, []);
    eventListeners.get(type).push(fn);
  },
  removeEventListener: (type, fn) => {
    if (eventListeners.has(type)) {
      eventListeners.set(type, eventListeners.get(type).filter((l) => l !== fn));
    }
  },
  dispatchEvent: (event) => {
    const list = eventListeners.get(event.type) || [];
    for (const fn of list) {
      fn(event);
    }
    return true;
  },
};

globalThis.CustomEvent = class CustomEvent extends Event {
  constructor(type, eventInitDict) {
    super(type, eventInitDict);
    this.detail = eventInitDict?.detail;
  }
};

// ---------------------------------------------------------------------------
// 2. Assertion Utilities & Test Runner
// ---------------------------------------------------------------------------
let passedTests = 0;
let failedTests = 0;
const testFailures = [];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(
      `${message || 'assertEqual failed'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

function assertDeepEqual(actual, expected, message) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(`${message || 'assertDeepEqual failed'}:\nExpected: ${expectedStr}\nActual:   ${actualStr}`);
  }
}

async function runTest(name, fn) {
  try {
    await fn();
    console.log(`  \x1b[32m✔\x1b[0m ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  \x1b[31m✖\x1b[0m ${name}`);
    console.error(`    \x1b[31mError: ${err.message}\x1b[0m`);
    testFailures.push({ name, error: err });
    failedTests++;
  }
}

function pathToFileURL(p) {
  let pathName = path.resolve(p).replace(/\\/g, '/');
  if (pathName[0] !== '/') pathName = '/' + pathName;
  return new URL('file://' + encodeURI(pathName));
}

const tempBundleFiles = new Set();
async function bundleAndImport(entryRelativePath) {
  const tempFileName = `temp_bundle_m3_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.mjs`;
  const tempFilePath = path.join(__dirname, tempFileName);
  tempBundleFiles.add(tempFilePath);

  const fullEntryPath = path.join(ROOT_DIR, entryRelativePath);

  esbuild.buildSync({
    entryPoints: [fullEntryPath],
    bundle: true,
    write: true,
    outfile: tempFilePath,
    format: 'esm',
    alias: { '@': path.join(ROOT_DIR, 'src') },
    external: ['zustand', 'react', 'react-dom'],
  });

  const module = await import(pathToFileURL(tempFilePath).href);
  return module;
}

function cleanupTempFiles() {
  for (const f of tempBundleFiles) {
    try {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    } catch {}
  }
}

// ---------------------------------------------------------------------------
// 3. Execution & Verification Harness
// ---------------------------------------------------------------------------
async function main() {
  console.log('================================================================');
  console.log('  CHALLENGER ADVERSARIAL STRESS HARNESS: MILESTONE 3 DAL        ');
  console.log('================================================================\n');

  try {
    // Import DAL modules via bundled entrypoints
    const dalModule = await bundleAndImport('src/services/baseRepository.ts');
    const { LocalStorageRepository, BaseLocalStorageRepository } = dalModule;

    const queryEngineModule = await bundleAndImport('src/services/queryEngine.ts');
    const {
      filterItems,
      sortItems,
      paginateItems,
      applyQueryPipeline,
      getNestedProperty,
    } = queryEngineModule;

    const vietnameseSearchModule = await bundleAndImport('src/utils/vietnameseSearch.ts');
    const {
      normalizeVietnamese,
      tokenizeQuery,
      matchesVietnameseSearch,
      calculateRelevanceScore,
    } = vietnameseSearchModule;

    const storageKeysModule = await bundleAndImport('src/services/storage/storageKeys.ts');
    const { STORAGE_KEYS, STORAGE_PREFIX, STORAGE_VERSION, getEntityStorageKey } = storageKeysModule;

    const quotaGuardModule = await bundleAndImport('src/services/storage/quotaGuard.ts');
    const {
      formatByteSize,
      isQuotaExceededError,
      calculateStorageUsage,
      executeTieredEviction,
      safeSetStorageItem,
    } = quotaGuardModule;

    const mockEngineModule = await bundleAndImport('src/services/mock/mockEngine.ts');
    const { mockEngine, DalApiError } = mockEngineModule;

    // Turn off delay for instantaneous stress test execution
    mockEngine.updateConfig({
      delayEnabled: false,
      errorRate: 0,
      simulateOffline: false,
      simulateServerError: false,
    });

    const productsSeedModule = await bundleAndImport('src/services/seed/productsSeed.ts');
    const { seedProducts } = productsSeedModule;

    const ordersSeedModule = await bundleAndImport('src/services/seed/ordersSeed.ts');
    const { seedOrders } = ordersSeedModule;

    const customersSeedModule = await bundleAndImport('src/services/seed/customersSeed.ts');
    const { seedCustomers } = customersSeedModule;

    const couponsSeedModule = await bundleAndImport('src/services/seed/couponsSeed.ts');
    const { seedCoupons, calculateCouponDiscount } = couponsSeedModule;

    const blocksSeedModule = await bundleAndImport('src/services/seed/blocksSeed.ts');
    const { defaultStorefrontBlocks } = blocksSeedModule;

    const systemServiceModule = await bundleAndImport('src/services/systemService.ts');
    const { systemService, SystemService } = systemServiceModule;

    const productServiceModule = await bundleAndImport('src/services/api/productService.ts');
    const { productService, ProductService } = productServiceModule;

    const orderServiceModule = await bundleAndImport('src/services/api/orderService.ts');
    const { orderService, OrderService } = orderServiceModule;

    const customerServiceModule = await bundleAndImport('src/services/api/customerService.ts');
    const { customerService, CustomerService } = customerServiceModule;

    const couponServiceModule = await bundleAndImport('src/services/api/couponService.ts');
    const { couponService, CouponService } = couponServiceModule;

    // -------------------------------------------------------------------------
    // SUITE 1: BaseLocalStorageRepository CRUD Lifecycle & Namespacing
    // -------------------------------------------------------------------------
    console.log('• SUITE 1: BaseLocalStorageRepository CRUD Lifecycle & Namespacing');

    await runTest('M3-C1-01: BaseLocalStorageRepository is exported and aliases LocalStorageRepository', () => {
      assert(LocalStorageRepository !== undefined, 'LocalStorageRepository must be exported');
      assert(BaseLocalStorageRepository !== undefined, 'BaseLocalStorageRepository must be exported');
      assertEqual(BaseLocalStorageRepository, LocalStorageRepository, 'BaseLocalStorageRepository must strictly alias LocalStorageRepository');
    });

    await runTest('M3-C1-02: Key namespacing adheres to d2c_ecommerce:<entity>:v1 pattern', () => {
      assertEqual(STORAGE_PREFIX, 'd2c_ecommerce', 'Prefix must be d2c_ecommerce');
      assertEqual(STORAGE_VERSION, 'v1', 'Version must be v1');
      assertEqual(STORAGE_KEYS.PRODUCTS, 'd2c_ecommerce:products:v1');
      assertEqual(STORAGE_KEYS.ORDERS, 'd2c_ecommerce:orders:v1');
      assertEqual(STORAGE_KEYS.CUSTOMERS, 'd2c_ecommerce:customers:v1');
      assertEqual(STORAGE_KEYS.COUPONS, 'd2c_ecommerce:coupons:v1');
      assertEqual(STORAGE_KEYS.BLOCKS, 'd2c_ecommerce:blocks:v1');
      assertEqual(getEntityStorageKey('Inventory'), 'd2c_ecommerce:inventory:v1');
    });

    await runTest('M3-C1-03: Repository initializes and hydrates seed into localStorage if empty', () => {
      const testKey = 'd2c_ecommerce:test_items:v1';
      mockStorage.removeItem(testKey);

      const initialSeed = [
        { id: 'item_1', name: 'Item One', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
        { id: 'item_2', name: 'Item Two', createdAt: '2026-01-02T00:00:00Z', updatedAt: '2026-01-02T00:00:00Z' },
      ];

      const repo = new LocalStorageRepository(testKey, initialSeed);
      const stored = mockStorage.getItem(testKey);
      assert(stored !== null, 'Storage item must be created on initialization');
      const parsed = JSON.parse(stored);
      assertEqual(parsed.length, 2, 'Stored array must contain 2 items');
      assertEqual(parsed[0].id, 'item_1');
    });

    await runTest('M3-C1-04: Repository CRUD operations (Create, Read, Update, Delete) write-through to storage', async () => {
      const testKey = 'd2c_ecommerce:test_crud:v1';
      mockStorage.removeItem(testKey);

      const repo = new LocalStorageRepository(testKey, []);

      // 1. Create with generated ID
      const created1 = await repo.create({ name: 'Challenger Item 1', price: 150000 });
      assert(created1.id && created1.id.length > 5, 'Auto-generated ID must be present');
      assert(created1.createdAt !== undefined, 'createdAt must be set');
      assert(created1.updatedAt !== undefined, 'updatedAt must be set');

      // Verify write-through
      let stored = JSON.parse(mockStorage.getItem(testKey));
      assertEqual(stored.length, 1, 'Storage must have 1 record');
      assertEqual(stored[0].id, created1.id);

      // 2. Create with explicit ID
      const created2 = await repo.create({ id: 'item_custom_99', name: 'Custom ID Item', price: 250000 });
      assertEqual(created2.id, 'item_custom_99', 'Explicit ID must be honored');
      stored = JSON.parse(mockStorage.getItem(testKey));
      assertEqual(stored.length, 2, 'Storage must have 2 records');
      assertEqual(stored[0].id, 'item_custom_99', 'New item must be unshifted to head');

      // 3. Read by ID
      const fetched = await repo.getById('item_custom_99');
      assert(fetched !== null, 'getById must return record');
      assertEqual(fetched.name, 'Custom ID Item');

      // Deep clone test: mutating fetched record should NOT corrupt repo cache
      fetched.name = 'MUTATED IN MEMORY';
      const fetchedAgain = await repo.getById('item_custom_99');
      assertEqual(fetchedAgain.name, 'Custom ID Item', 'Repository must return immutable deep clones');

      // 4. Update
      const oldUpdatedAt = created2.updatedAt;
      const updated = await repo.update('item_custom_99', {
        name: 'Updated Name',
        price: 300000,
        id: 'TRY_OVERWRITE_ID', // Attempt to mutate immutable ID
      });
      assertEqual(updated.id, 'item_custom_99', 'ID must be immutable during update');
      assertEqual(updated.name, 'Updated Name');
      assertEqual(updated.price, 300000);

      // Verify update in storage
      stored = JSON.parse(mockStorage.getItem(testKey));
      const inStore = stored.find((r) => r.id === 'item_custom_99');
      assertEqual(inStore.name, 'Updated Name');

      // Update non-existent ID throws
      let threw = false;
      try {
        await repo.update('non_existent_id', { name: 'Fail' });
      } catch (err) {
        threw = true;
        assert(err.message.includes('not found'), 'Must throw not found error');
      }
      assert(threw, 'Updating non-existent ID must throw');

      // 5. Exists & Count
      const existsTrue = await repo.exists('item_custom_99');
      const existsFalse = await repo.exists('bogus_id');
      assertEqual(existsTrue, true);
      assertEqual(existsFalse, false);
      const count = await repo.count();
      assertEqual(count, 2);

      // 6. Delete
      const deletedTrue = await repo.delete('item_custom_99');
      assertEqual(deletedTrue, true, 'delete existing record returns true');
      const deletedFalse = await repo.delete('item_custom_99');
      assertEqual(deletedFalse, false, 'delete non-existent record returns false');

      stored = JSON.parse(mockStorage.getItem(testKey));
      assertEqual(stored.length, 1);
      assertEqual(stored[0].id, created1.id);
    });

    await runTest('M3-C1-05: Bulk operations (bulkCreate, bulkDelete, clear, resetToSeed)', async () => {
      const testKey = 'd2c_ecommerce:test_bulk:v1';
      mockStorage.removeItem(testKey);

      const initialSeed = [{ id: 'seed_init_1', name: 'Initial Seed' }];
      const repo = new LocalStorageRepository(testKey, initialSeed);

      // bulkCreate
      const batch = [
        { id: 'b_1', name: 'Batch 1' },
        { id: 'b_2', name: 'Batch 2' },
        { id: 'b_3', name: 'Batch 3' },
      ];
      const createdList = await repo.bulkCreate(batch);
      assertEqual(createdList.length, 3);
      assertEqual(await repo.count(), 4);

      // bulkDelete
      const deletedCount = await repo.bulkDelete(['b_1', 'b_3', 'non_existing']);
      assertEqual(deletedCount, 2, 'Should delete exactly 2 matching items');
      assertEqual(await repo.count(), 2);

      // clear
      await repo.clear();
      assertEqual(await repo.count(), 0);
      assertEqual(JSON.parse(mockStorage.getItem(testKey)).length, 0);

      // resetToSeed
      repo.resetToSeed();
      assertEqual(await repo.count(), 1);
      const all = await repo.getAll();
      assertEqual(all.items[0].id, 'seed_init_1');
    });

    await runTest('M3-C1-06: Storage corruption resilience (invalid JSON string in localStorage)', () => {
      const testKey = 'd2c_ecommerce:test_corrupt:v1';
      mockStorage.setItem(testKey, '{{CORRUPTED_JSON_STRING%%%');

      const initialSeed = [{ id: 'safe_seed', name: 'Safe Seed' }];
      // Repository initialization should not crash on invalid JSON
      const repo = new LocalStorageRepository(testKey, initialSeed);
      assert(repo !== null, 'Repository must initialize safely');
    });

    // -------------------------------------------------------------------------
    // SUITE 2: Vietnamese Diacritics Adversarial Search Engine
    // -------------------------------------------------------------------------
    console.log('\n• SUITE 2: Vietnamese Diacritics Adversarial Search Engine');

    await runTest('M3-C2-01: All Vietnamese tone marks strip to standard base Latin vowels', () => {
      // Acute (sắc)
      assertEqual(normalizeVietnamese('á é í ó ú ý ắ ấ ế ố ớ ứ'), 'a e i o u y a a e o o u');
      // Grave (huyền)
      assertEqual(normalizeVietnamese('à è ì ò ù ỳ ằ ầ ề ồ ờ ừ'), 'a e i o u y a a e o o u');
      // Hook above (hỏi)
      assertEqual(normalizeVietnamese('ả ẻ ỉ ỏ ủ ỷ ẳ ẩ ể ổ ở ử'), 'a e i o u y a a e o o u');
      // Tilde (ngã)
      assertEqual(normalizeVietnamese('ã ẽ ĩ õ ũ ỹ ẵ ẫ ễ ỗ ỡ ữ'), 'a e i o u y a a e o o u');
      // Dot below (nặng)
      assertEqual(normalizeVietnamese('ạ ẹ ị ọ ụ ỵ ặ ậ ệ ộ ợ ự'), 'a e i o u y a a e o o u');
    });

    await runTest('M3-C2-02: Special Vietnamese consonant transliteration (đ / Đ to d)', () => {
      assertEqual(normalizeVietnamese('đường đời'), 'duong doi');
      assertEqual(normalizeVietnamese('ĐỒNG HỒ ĐEO TAY'), 'dong ho deo tay');
      assertEqual(normalizeVietnamese('Đầm xòe công sở ĐẸP'), 'dam xoe cong so dep');
      assertEqual(normalizeVietnamese('Đà Nẵng & Đắk Lắk'), 'da nang & dak lak');
    });

    await runTest('M3-C2-03: Unicode NFD decomposed vs NFC precomposed invariance', () => {
      const precomposed = 'Áo thun cổ bẻ'; // NFC
      const decomposed = 'A\u0301o thun c\u00F4\u0309 be\u0309'; // NFD decomposed

      const normPre = normalizeVietnamese(precomposed);
      const normDec = normalizeVietnamese(decomposed);

      assertEqual(normPre, 'ao thun co be');
      assertEqual(normDec, 'ao thun co be');
      assertEqual(normPre, normDec, 'Normalized NFC and NFD strings must be identical');
    });

    await runTest('M3-C2-04: Multi-token conjunctive (AND) matching with out-of-order terms', () => {
      const haystack = 'Áo Thun Nam Cổ Tròn Cotton Màu Trắng Basic';

      // Exact order
      assert(matchesVietnameseSearch(haystack, 'ao thun'), 'Matches "ao thun"');
      // Mixed case and diacritics
      assert(matchesVietnameseSearch(haystack, 'ÁO THUN'), 'Matches "ÁO THUN"');
      // Reversed / scrambled term order
      assert(matchesVietnameseSearch(haystack, 'trắng áo cotton nam'), 'Matches out-of-order terms');
      assert(matchesVietnameseSearch(haystack, 'BASIC co tron'), 'Matches "BASIC co tron"');

      // Failure case: at least one token missing
      assert(!matchesVietnameseSearch(haystack, 'ao thun nu'), 'Should not match because "nu" is absent');
      assert(!matchesVietnameseSearch(haystack, 'Áo Khoác'), 'Should not match "Áo Khoác"');
    });

    await runTest('M3-C2-05: Adversarial input safety (empty strings, null, undefined, excess whitespace)', () => {
      assertEqual(normalizeVietnamese(null), '');
      assertEqual(normalizeVietnamese(undefined), '');
      assertEqual(normalizeVietnamese(''), '');

      const tokens = tokenizeQuery('   \t\n   áo     thun   \n\r   ');
      assertDeepEqual(tokens, ['ao', 'thun']);

      // Empty search query must match everything
      assert(matchesVietnameseSearch('Sản phẩm bất kỳ', '   '), 'Empty query matches all items');
      // Null target
      assert(!matchesVietnameseSearch(null, 'ao'), 'Null target fails search');

      // Target array with mixed nulls
      assert(matchesVietnameseSearch(['Áo khoác', null, undefined, 'Mùa đông'], 'dong ao'), 'Array target matches');
    });

    await runTest('M3-C2-06: Multi-tier relevance scoring hierarchy', () => {
      const query = 'Áo Thun';
      const exactScore = calculateRelevanceScore('Áo Thun', [], query);
      const prefixScore = calculateRelevanceScore('Áo Thun Nam', [], query);
      const containsScore = calculateRelevanceScore('Bộ Đồ Áo Thun', [], query);
      const partialTokenScore = calculateRelevanceScore('Áo Sơ Mi', [], query);
      const unrelatedScore = calculateRelevanceScore('Giày Tây', [], query);

      assert(exactScore > prefixScore, `Exact match (${exactScore}) must score higher than prefix match (${prefixScore})`);
      assert(prefixScore > containsScore, `Prefix match (${prefixScore}) must score higher than contains (${containsScore})`);
      assert(containsScore > partialTokenScore, `Contains match (${containsScore}) must score higher than partial token (${partialTokenScore})`);
      assert(partialTokenScore > unrelatedScore, `Partial token (${partialTokenScore}) must score higher than unrelated (${unrelatedScore})`);
      assertEqual(unrelatedScore, 0, 'Unrelated query must score 0');
    });

    // -------------------------------------------------------------------------
    // SUITE 3: Query Engine (Faceted Filter, Locale Sort, Clamped Pagination)
    // -------------------------------------------------------------------------
    console.log('\n• SUITE 3: Query Engine (Faceted Filter, Locale Sort, Clamped Pagination)');

    const mockProductsDataset = [
      { id: 'p_1', name: 'Áo Thun Nam Classic', categoryId: 'cat_nam', price: 150000, stock: 20, status: 'active', tags: ['hot', 'basic'], createdAt: '2026-01-01T10:00:00Z' },
      { id: 'p_2', name: 'Áo Sơ Mi Nam Công Sở', categoryId: 'cat_nam', price: 350000, stock: 5, status: 'active', tags: ['office'], createdAt: '2026-01-02T10:00:00Z' },
      { id: 'p_3', name: 'Đầm Xòe Nữ Dáng Dài', categoryId: 'cat_nu', price: 450000, stock: 0, status: 'active', tags: ['party', 'hot'], createdAt: '2026-01-03T10:00:00Z' },
      { id: 'p_4', name: 'Chân Váy Chữ A Nữ', categoryId: 'cat_nu', price: 220000, stock: 12, status: 'inactive', tags: ['basic'], createdAt: '2026-01-04T10:00:00Z' },
      { id: 'p_5', name: 'Túi Xách Da Cao Cấp', categoryId: 'cat_phukien', price: 650000, stock: 8, status: 'active', tags: ['luxury'], createdAt: '2026-01-05T10:00:00Z' },
      { id: 'p_6', name: 'Ví Da Nam Cầm Tay', categoryId: 'cat_phukien', price: 290000, stock: 15, status: 'active', tags: ['gift'], createdAt: '2026-01-06T10:00:00Z' },
    ];

    await runTest('M3-C3-01: Multi-faceted filtering (category, price range, stock, tags, status)', () => {
      // Category filter
      const namItems = filterItems(mockProductsDataset, { category: 'cat_nam' });
      assertEqual(namItems.length, 2);

      // Price range filter [200,000 to 450,000]
      const priceItems = filterItems(mockProductsDataset, { minPrice: 200000, maxPrice: 450000 });
      assertEqual(priceItems.length, 3); // p_2 (350k), p_3 (450k), p_4 (220k), p_6 (290k)? Wait: 220k, 290k, 350k, 450k = 4 items
      const expectedIds = ['p_2', 'p_3', 'p_4', 'p_6'];
      assertEqual(priceItems.length, expectedIds.length);

      // Stock filter: inStock: true (must exclude p_3 with stock 0)
      const inStockItems = filterItems(mockProductsDataset, { inStock: true });
      assertEqual(inStockItems.length, 5);
      assert(!inStockItems.some((p) => p.id === 'p_3'), 'p_3 must be excluded from inStock items');

      // Stock filter: inStock: false (must only include out-of-stock items)
      const outOfStockItems = filterItems(mockProductsDataset, { inStock: false });
      assertEqual(outOfStockItems.length, 1);
      assertEqual(outOfStockItems[0].id, 'p_3');

      // Tag filter
      const hotItems = filterItems(mockProductsDataset, { tags: ['hot'] });
      assertEqual(hotItems.length, 2); // p_1 and p_3

      // Combined multi-facet filter
      const combo = filterItems(mockProductsDataset, {
        category: 'cat_nam',
        inStock: true,
        maxPrice: 200000,
        status: 'active',
      });
      assertEqual(combo.length, 1);
      assertEqual(combo[0].id, 'p_1');
    });

    await runTest('M3-C3-02: Where clauses and custom predicate filtering', () => {
      // Where exact match
      const exact = filterItems(mockProductsDataset, { where: { status: 'inactive' } });
      assertEqual(exact.length, 1);
      assertEqual(exact[0].id, 'p_4');

      // Where range
      const whereRange = filterItems(mockProductsDataset, {
        where: { price: { min: 600000, max: 700000 } },
      });
      assertEqual(whereRange.length, 1);
      assertEqual(whereRange[0].id, 'p_5');

      // Custom predicate
      const highValue = filterItems(mockProductsDataset, {
        predicate: (item) => item.price > 400000 && item.tags.includes('luxury'),
      });
      assertEqual(highValue.length, 1);
      assertEqual(highValue[0].id, 'p_5');
    });

    await runTest('M3-C3-03: Vietnamese locale-aware string sorting and numeric sorting', () => {
      const namesList = [
        { id: '1', name: 'Đạt' },
        { id: '2', name: 'An' },
        { id: '3', name: 'Bình' },
        { id: '4', name: 'Cường' },
        { id: '5', name: 'Ân' },
        { id: '6', name: 'Dũng' },
      ];

      const sortedNamesAsc = sortItems(namesList, { sortBy: 'name', sortOrder: 'asc' });
      // In Vietnamese collation: An, Ân, Bình, Cường, Dũng, Đạt
      assertEqual(sortedNamesAsc[0].name, 'An');
      assertEqual(sortedNamesAsc[1].name, 'Ân');
      assertEqual(sortedNamesAsc[2].name, 'Bình');
      assertEqual(sortedNamesAsc[3].name, 'Cường');
      assertEqual(sortedNamesAsc[4].name, 'Dũng');
      assertEqual(sortedNamesAsc[5].name, 'Đạt');

      // Numeric sorting (ensures 100 > 20 > 2, not lexicographic string order!)
      const numbersList = [
        { id: '1', price: 20 },
        { id: '2', price: 2 },
        { id: '3', price: 100 },
        { id: '4', price: 15 },
        { id: '5', price: null }, // Null safety test
      ];

      const sortedNumAsc = sortItems(numbersList, { sortBy: 'price', sortOrder: 'asc' });
      assertEqual(sortedNumAsc[0].price, 2);
      assertEqual(sortedNumAsc[1].price, 15);
      assertEqual(sortedNumAsc[2].price, 20);
      assertEqual(sortedNumAsc[3].price, 100);
      assertEqual(sortedNumAsc[4].price, null, 'Null value must be pushed to bottom');

      const sortedNumDesc = sortItems(numbersList, { sortBy: 'price', sortOrder: 'desc' });
      assertEqual(sortedNumDesc[0].price, 100);
      assertEqual(sortedNumDesc[1].price, 20);
      assertEqual(sortedNumDesc[2].price, 15);
      assertEqual(sortedNumDesc[3].price, 2);
      assertEqual(sortedNumDesc[4].price, null, 'Null value must remain at bottom in desc');
    });

    await runTest('M3-C3-04: Pagination boundary clamping and dual array pointers (.items === .data)', () => {
      const sampleItems = Array.from({ length: 47 }, (_, i) => ({ id: `it_${i + 1}`, val: i + 1 }));

      // Normal pagination: Page 1 of 5 (10 items)
      const p1 = paginateItems(sampleItems, { page: 1, pageSize: 10 });
      assertEqual(p1.items.length, 10);
      assertEqual(p1.items, p1.data, 'result.items and result.data must reference identical array pointer');
      assertEqual(p1.total, 47);
      assertEqual(p1.totalPages, 5);
      assertEqual(p1.page, 1);
      assertEqual(p1.hasNextPage, true);
      assertEqual(p1.hasPrevPage, false);

      // Last page: Page 5 of 5 (7 remaining items)
      const p5 = paginateItems(sampleItems, { page: 5, pageSize: 10 });
      assertEqual(p5.items.length, 7);
      assertEqual(p5.hasNextPage, false);
      assertEqual(p5.hasPrevPage, true);

      // Boundary: Page 9999 clamped to totalPages (5)
      const pMax = paginateItems(sampleItems, { page: 9999, pageSize: 10 });
      assertEqual(pMax.page, 5, 'Page 9999 must clamp to max totalPages 5');
      assertEqual(pMax.items.length, 7);

      // Boundary: Page 0 and negative clamped to 1
      const pZero = paginateItems(sampleItems, { page: 0, pageSize: 10 });
      assertEqual(pZero.page, 1, 'Page 0 must clamp to 1');
      const pNeg = paginateItems(sampleItems, { page: -10, pageSize: 10 });
      assertEqual(pNeg.page, 1, 'Negative page must clamp to 1');

      // Boundary: PageSize 0 clamped to 1
      const pSizeZero = paginateItems(sampleItems, { page: 1, pageSize: 0 });
      assertEqual(pSizeZero.pageSize, 1, 'pageSize 0 must clamp to 1');

      // Boundary: PageSize 500 clamped to 100
      const pSizeMax = paginateItems(sampleItems, { page: 1, pageSize: 500 });
      assertEqual(pSizeMax.pageSize, 100, 'pageSize 500 must clamp to 100');

      // Empty dataset
      const pEmpty = paginateItems([], { page: 1, pageSize: 10 });
      assertEqual(pEmpty.total, 0);
      assertEqual(pEmpty.totalPages, 1);
      assertEqual(pEmpty.items.length, 0);
      assertEqual(pEmpty.items, pEmpty.data);
      assertEqual(pEmpty.hasNextPage, false);
      assertEqual(pEmpty.hasPrevPage, false);
    });

    await runTest('M3-C3-05: Comprehensive Query Pipeline (applyQueryPipeline) integrates search, sort & page', () => {
      const result = applyQueryPipeline(mockProductsDataset, {
        search: 'nam',
        category: 'cat_nam',
        sortBy: 'price',
        sortOrder: 'asc',
        page: 1,
        pageSize: 10,
      });

      assertEqual(result.total, 2);
      assertEqual(result.items.length, 2);
      assertEqual(result.items[0].id, 'p_1'); // 150k < 350k
      assertEqual(result.items[1].id, 'p_2');
      assertEqual(result.items, result.data);
    });

    // -------------------------------------------------------------------------
    // SUITE 4: Quota Guard & Tiered Eviction Behavior
    // -------------------------------------------------------------------------
    console.log('\n• SUITE 4: Quota Guard & Tiered Eviction Behavior');

    await runTest('M3-C4-01: formatByteSize formats bytes across units accurately', () => {
      assertEqual(formatByteSize(0), '0 B');
      assertEqual(formatByteSize(-10), '0 B');
      assertEqual(formatByteSize(512), '512.00 B');
      assertEqual(formatByteSize(1024), '1.00 KB');
      assertEqual(formatByteSize(1024 * 1024), '1.00 MB');
      assertEqual(formatByteSize(5 * 1024 * 1024), '5.00 MB');
    });

    await runTest('M3-C4-02: calculateStorageUsage computes UTF-16 bytes and usage thresholds', () => {
      mockStorage.clear();
      // Write a known string: key length 10, value length 90 -> total characters 100 * 2 bytes = 200 bytes
      const testKey = '0123456789';
      const testVal = 'a'.repeat(90);
      mockStorage.setItem(testKey, testVal);

      const report = calculateStorageUsage();
      assertEqual(report.usedBytes, 200, 'UTF-16 character estimation must equal (10 + 90) * 2 = 200 bytes');
      assertEqual(report.limitBytes, 5 * 1024 * 1024);
      assertEqual(report.isNearLimit, false);
      assertEqual(report.isCritical, false);
      assertEqual(report.breakdown.length, 1);
      assertEqual(report.breakdown[0].key, testKey);
      assertEqual(report.breakdown[0].bytes, 200);
    });

    await runTest('M3-C4-03: Tiered eviction purges debug logs & query caches on quota recovery', () => {
      mockStorage.clear();
      // Seed tier 1 items
      mockStorage.setItem('d2c_ecommerce:debug_log_1', 'diagnostics_data');
      mockStorage.setItem('d2c_ecommerce:query_cache_abc', 'cached_query_result');
      mockStorage.setItem('d2c_ecommerce:search_history_v1', 'recent_searches');
      // Seed business items
      mockStorage.setItem('d2c_ecommerce:products:v1', '[{"id":"prod_1"}]');

      assertEqual(mockStorage.length, 4);

      const evicted = executeTieredEviction();
      assertEqual(evicted, true, 'executeTieredEviction must report freed storage');

      // Tier 1 items must be deleted
      assertEqual(mockStorage.getItem('d2c_ecommerce:debug_log_1'), null);
      assertEqual(mockStorage.getItem('d2c_ecommerce:query_cache_abc'), null);
      assertEqual(mockStorage.getItem('d2c_ecommerce:search_history_v1'), null);

      // Business item must be preserved
      assert(mockStorage.getItem('d2c_ecommerce:products:v1') !== null, 'Business collection must not be evicted');
    });

    await runTest('M3-C4-04: isQuotaExceededError detects browser quota exceptions', () => {
      const domError = new Error('The quota has been exceeded');
      domError.name = 'QuotaExceededError';
      domError.code = 22;

      assertEqual(isQuotaExceededError(domError), true);

      const genericQuotaError = new Error('LocalStorage quota full');
      assertEqual(isQuotaExceededError(genericQuotaError), true);

      const normalError = new Error('SyntaxError: unexpected token');
      assertEqual(isQuotaExceededError(normalError), false);
      assertEqual(isQuotaExceededError(null), false);
    });

    // -------------------------------------------------------------------------
    // SUITE 5: Seed Datasets & Domain Services Integration
    // -------------------------------------------------------------------------
    console.log('\n• SUITE 5: Seed Datasets & Domain Services Integration');

    await runTest('M3-C5-01: Realistic Vietnamese seed datasets structural integrity', () => {
      // Products Seed: exactly 24 items, Unsplash images, variant matrices
      assertEqual(seedProducts.length, 24, 'seedProducts must have exactly 24 products');
      const sampleProd = seedProducts[0];
      assert(sampleProd.name && sampleProd.slug, 'Product must have name and slug');
      assert(sampleProd.variants.length > 0, 'Fashion products must define variant matrices');
      assert(sampleProd.images.length > 0 && sampleProd.images[0].includes('unsplash.com'), 'Must use Unsplash images');

      // Orders Seed: exactly 12 orders spanning all 6 statuses
      assertEqual(seedOrders.length, 12, 'seedOrders must have 12 orders');
      const statuses = new Set(seedOrders.map((o) => o.status));
      assert(statuses.has('pending'), 'Contains pending');
      assert(statuses.has('confirmed'), 'Contains confirmed');
      assert(statuses.has('processing'), 'Contains processing');
      assert(statuses.has('shipping'), 'Contains shipping');
      assert(statuses.has('completed'), 'Contains completed');
      assert(statuses.has('cancelled'), 'Contains cancelled');

      // Customers Seed: exactly 12 customers with Vietnamese names & phone numbers
      assertEqual(seedCustomers.length, 12, 'seedCustomers must have 12 profiles');
      const sampleCust = seedCustomers[0];
      assert(/^(03|05|07|08|09)/.test(sampleCust.phone), 'Phone number must match VN mobile prefix');

      // Coupons Seed: exactly 7 coupons
      assertEqual(seedCoupons.length, 7, 'seedCoupons must have 7 coupons');

      // Blocks Seed: exactly 9 storefront blocks
      assertEqual(defaultStorefrontBlocks.length, 9, 'defaultStorefrontBlocks must have 9 blocks');
    });

    await runTest('M3-C5-02: ProductService queries and inventory edge case filters', async () => {
      mockStorage.clear();
      mockStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(seedProducts));
      mockStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify([]));

      const service = new ProductService();

      // Featured products
      const featured = await service.getFeaturedProducts(4);
      assertEqual(featured.length, 4);

      // Flash sale products
      const flashSales = await service.getFlashSaleProducts();
      assert(flashSales.length >= 2, 'Should return flash sale items');
      assert(flashSales.every((p) => p.isFlashSale), 'Every item must be marked as flash sale');

      // Low stock products (threshold 5)
      const lowStock = await service.getLowStockProducts(5);
      assert(lowStock.length > 0, 'Should find low stock items');
      assert(lowStock.some((p) => p.stock <= 5), 'Must include items with stock <= 5');
    });

    await runTest('M3-C5-03: OrderService status transition appends audit timeline event', async () => {
      mockStorage.clear();
      mockStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(seedOrders));

      const service = new OrderService();
      const firstOrder = seedOrders[0];
      const initialTimelineLen = firstOrder.timeline.length;

      const updated = await service.updateOrderStatus(
        firstOrder.id,
        'shipping',
        'Bàn giao đơn vị vận chuyển Viettel Post',
        'Admin Tester'
      );

      assertEqual(updated.status, 'shipping');
      assertEqual(updated.timeline.length, initialTimelineLen + 1, 'Timeline must be appended with new event');
      const lastEvent = updated.timeline[updated.timeline.length - 1];
      assertEqual(lastEvent.status, 'shipping');
      assertEqual(lastEvent.actor, 'Admin Tester');
      assert(lastEvent.description.includes('Viettel Post'));
    });

    await runTest('M3-C5-04: CouponService validation logic & discount calculations', async () => {
      mockStorage.clear();
      mockStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(seedCoupons));

      const service = new CouponService();

      // Valid coupon CHAOBAN (10% max 50k, min 200k)
      const valValid = await service.validateCoupon('CHAOBAN', 300000);
      assertEqual(valValid.isValid, true);
      assertEqual(valValid.discountAmount, 30000); // 10% of 300k = 30k

      // CHAOBAN with subtotal < minOrderValue (100k < 200k)
      const valUnderMin = await service.validateCoupon('CHAOBAN', 100000);
      assertEqual(valUnderMin.isValid, false);
      assert(valUnderMin.message.includes('tối thiểu'), 'Should fail min order threshold');

      // Expired coupon EXPIRED10
      const valExpired = await service.validateCoupon('EXPIRED10', 500000);
      assertEqual(valExpired.isValid, false);
      assert(valExpired.message.includes('hết hạn'), 'Should fail expiry check');

      // Sold out coupon SOLDOUT
      const valSoldOut = await service.validateCoupon('SOLDOUT', 500000);
      assertEqual(valSoldOut.isValid, false);
      assert(valSoldOut.message.includes('hết lượt'), 'Should fail sold out check');

      // Free shipping coupon FREESHIP
      const valFreeship = await service.validateCoupon('FREESHIP', 300000, 35000);
      assertEqual(valFreeship.isValid, true);
      assertEqual(valFreeship.discountAmount, 35000, 'Free shipping discount equals shippingFee');
    });

    await runTest('M3-C5-05: CustomerService summary KPI analytics', async () => {
      mockStorage.clear();
      mockStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(seedCustomers));

      const service = new CustomerService();
      const stats = await service.getCustomerStats();

      assertEqual(stats.totalCustomers, 12);
      assert(stats.vipCustomers > 0, 'VIP customers count > 0');
      assert(stats.newCustomers > 0, 'New customers count > 0');
      assert(stats.totalRevenue > 0, 'Total revenue > 0');
    });

    await runTest('M3-C5-06: SystemService resetDemoData restores factory baseline & broadcasts event', async () => {
      mockStorage.clear();
      // Dirty some keys and set custom keys
      mockStorage.setItem('d2c_ecommerce:dirty_junk', 'random_junk');
      mockStorage.setItem('unrelated_user_key', 'keep_me');

      let eventFired = false;
      let eventDetail = null;

      const resetHandler = (e) => {
        eventFired = true;
        eventDetail = e.detail;
      };
      globalThis.window.addEventListener('d2c:demo-data-reset', resetHandler);

      const service = new SystemService();
      const result = await service.resetDemoData();

      assertEqual(result.success, true);
      assertEqual(result.seededCollections.products, 24);
      assertEqual(result.seededCollections.orders, 12);
      assertEqual(result.seededCollections.customers, 12);
      assertEqual(result.seededCollections.coupons, 7);
      assertEqual(result.seededCollections.blocks, 9);

      // Verify dirty d2c keys cleared
      assertEqual(mockStorage.getItem('d2c_ecommerce:dirty_junk'), null, 'Dirty d2c keys must be removed');
      // Foreign keys preserved
      assertEqual(mockStorage.getItem('unrelated_user_key'), 'keep_me', 'Foreign keys must be preserved');

      // Verify rehydrated collections exist in storage
      assert(mockStorage.getItem(STORAGE_KEYS.PRODUCTS) !== null);
      assert(mockStorage.getItem(STORAGE_KEYS.ORDERS) !== null);
      assert(mockStorage.getItem(STORAGE_KEYS.CUSTOMERS) !== null);

      // Verify event was fired
      assertEqual(eventFired, true, 'd2c:demo-data-reset event must be dispatched');
      assert(eventDetail !== null);

      globalThis.window.removeEventListener('d2c:demo-data-reset', resetHandler);
    });

  } catch (globalErr) {
    console.error('FATAL HARNESS ERROR:', globalErr);
    process.exit(1);
  } finally {
    cleanupTempFiles();
  }

  console.log('\n================================================================');
  console.log('  CHALLENGER HARNESS EXECUTION SUMMARY                          ');
  console.log('================================================================');
  console.log(`Total Adversarial Tests: ${passedTests + failedTests}`);
  console.log(`Passed:                  \x1b[32m${passedTests}\x1b[0m`);
  console.log(`Failed:                  \x1b[${failedTests > 0 ? '31' : '32'}m${failedTests}\x1b[0m`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    console.error('Failure Details:');
    for (const f of testFailures) {
      console.error(`- ${f.name}: ${f.error.message}`);
    }
    process.exit(1);
  } else {
    console.log(' ALL ADVERSARIAL STRESS TESTS PASSED EMPIRICALLY! ');
    process.exit(0);
  }
}

main();
