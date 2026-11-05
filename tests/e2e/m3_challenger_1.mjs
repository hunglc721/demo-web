/**
 * ADVERSARIAL EMPIRICAL CHALLENGER TEST SUITE: MILESTONE 3
 * Target: Mock Service Engine & Data Access Layer (DAL)
 * File: tests/e2e/m3_challenger_1.mjs
 *
 * Exhaustively stress-tests:
 * 1. Vietnamese diacritic-insensitive search & locale sorting
 * 2. LocalStorage CRUD operations, boundaries & concurrency
 * 3. QuotaGuard behavior, simulated storage exhaustion & tiered eviction
 * 4. System factory reset & namespace hygiene
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');

// ---------------------------------------------------------------------------
// 1. Hermetic Mock LocalStorage with Strict Quota & Event Simulation
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

  dump() {
    const obj = {};
    for (const [k, v] of this._store.entries()) {
      obj[k] = v;
    }
    return obj;
  }
}

// Global browser environment mocks
const mockStorage = new MockLocalStorage({ quotaBytes: 5 * 1024 * 1024, enforceQuota: true });
globalThis.localStorage = mockStorage;

const globalEventListeners = new Map();
globalThis.window = {
  localStorage: mockStorage,
  addEventListener: (type, fn) => {
    if (!globalEventListeners.has(type)) globalEventListeners.set(type, []);
    globalEventListeners.get(type).push(fn);
  },
  removeEventListener: (type, fn) => {
    if (globalEventListeners.has(type)) {
      globalEventListeners.set(type, globalEventListeners.get(type).filter((l) => l !== fn));
    }
  },
  dispatchEvent: (event) => {
    const list = globalEventListeners.get(event.type) || [];
    for (const fn of list) {
      try {
        fn(event);
      } catch (err) {
        console.error(`Error in event listener for ${event.type}:`, err);
      }
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
// 2. Assertion Utilities & Logging
// ---------------------------------------------------------------------------
let totalAssertions = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function assert(condition, message) {
  totalAssertions++;
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  totalAssertions++;
  if (actual !== expected) {
    throw new Error(
      `${message || 'assertEqual failed'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

function assertDeepEqual(actual, expected, message) {
  totalAssertions++;
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(`${message || 'assertDeepEqual failed'}:\nExpected: ${expectedStr}\nActual:   ${actualStr}`);
  }
}

async function runTest(suiteName, testName, fn) {
  try {
    await fn();
    console.log(`  \x1b[32m✔\x1b[0m [${suiteName}] ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`  \x1b[31m✖\x1b[0m [${suiteName}] ${testName}`);
    console.error(`    \x1b[31m${err.message}\x1b[0m`);
    failures.push({ suite: suiteName, test: testName, error: err.message, stack: err.stack });
    failedTests++;
  }
}

// ---------------------------------------------------------------------------
// 3. Dynamic Bundler for TypeScript Modules
// ---------------------------------------------------------------------------
function pathToFileURL(p) {
  let pathName = path.resolve(p).replace(/\\/g, '/');
  if (pathName[0] !== '/') pathName = '/' + pathName;
  return new URL('file://' + encodeURI(pathName));
}

const tempBundleFiles = new Set();
async function bundleAndImport(entryRelativePath) {
  const tempFileName = `temp_challenger_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.mjs`;
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
// 4. Main Adversarial Stress Test Execution
// ---------------------------------------------------------------------------
async function main() {
  console.log('\n================================================================');
  console.log('  CHALLENGER 1 ADVERSARIAL STRESS HARNESS: MILESTONE 3 DAL      ');
  console.log('================================================================\n');

  try {
    // Import target modules
    const searchModule = await bundleAndImport('src/utils/vietnameseSearch.ts');
    const {
      normalizeVietnamese,
      tokenizeQuery,
      matchesVietnameseSearch,
      calculateRelevanceScore,
    } = searchModule;

    const queryEngineModule = await bundleAndImport('src/services/queryEngine.ts');
    const {
      filterItems,
      sortItems,
      paginateItems,
      applyQueryPipeline,
      getNestedProperty,
    } = queryEngineModule;

    const quotaGuardModule = await bundleAndImport('src/services/storage/quotaGuard.ts');
    const {
      calculateStorageUsage,
      isQuotaExceededError,
      executeTieredEviction,
      safeSetStorageItem,
      formatByteSize,
    } = quotaGuardModule;

    const repoModule = await bundleAndImport('src/services/mock/LocalStorageRepository.ts');
    const { LocalStorageRepository, BaseLocalStorageRepository } = repoModule;

    const storageKeysModule = await bundleAndImport('src/services/storage/storageKeys.ts');
    const { STORAGE_KEYS, STORAGE_PREFIX, STORAGE_VERSION } = storageKeysModule;

    const seedCouponsModule = await bundleAndImport('src/services/seed/couponsSeed.ts');
    const { seedCoupons, calculateCouponDiscount } = seedCouponsModule;

    const systemModule = await bundleAndImport('src/services/systemService.ts');
    const { systemService } = systemModule;

    const mockEngineModule = await bundleAndImport('src/services/mock/mockEngine.ts');
    const { mockEngine } = mockEngineModule;
    // Set 0ms latency for deterministic fast execution during tests
    mockEngine.updateConfig({ delayEnabled: false, minDelayMs: 0, maxDelayMs: 0 });

    // =========================================================================
    // SUITE 1: Vietnamese Diacritic-Insensitive Search Stress Tests
    // =========================================================================
    console.log('• SUITE 1: Vietnamese Diacritic-Insensitive Search Stress Tests');

    await runTest('VietnameseSearch', 'Mandatory pair: "áo thun" vs "ao thun"', () => {
      const target = 'Áo Thun Nam Cổ Tròn Cotton 100%';
      assert(matchesVietnameseSearch(target, 'áo thun'), 'Target matches "áo thun"');
      assert(matchesVietnameseSearch(target, 'ao thun'), 'Target matches "ao thun"');
      assert(matchesVietnameseSearch(target, 'ÁO THUN'), 'Target matches "ÁO THUN"');
      assert(matchesVietnameseSearch(target, 'AO THUN'), 'Target matches "AO THUN"');
    });

    await runTest('VietnameseSearch', 'Mandatory pair: "ĐẦM HOA" vs "dam hoa"', () => {
      const target = 'Đầm Hoa Nhí Vintage Dáng Dài';
      assert(matchesVietnameseSearch(target, 'ĐẦM HOA'), 'Target matches "ĐẦM HOA"');
      assert(matchesVietnameseSearch(target, 'dam hoa'), 'Target matches "dam hoa"');
      assert(matchesVietnameseSearch(target, 'đầm hoa'), 'Target matches "đầm hoa"');
      assert(matchesVietnameseSearch(target, 'DAM HOA'), 'Target matches "DAM HOA"');
    });

    await runTest('VietnameseSearch', 'Mandatory pair: "đũi" vs "dui" (double modification stroke + hook/tilde)', () => {
      const target = 'Quần Baggy Vải Đũi Xước Cao Cấp';
      assert(matchesVietnameseSearch(target, 'đũi'), 'Target matches "đũi"');
      assert(matchesVietnameseSearch(target, 'dui'), 'Target matches "dui"');
      assert(matchesVietnameseSearch(target, 'ĐŨI'), 'Target matches "ĐŨI"');
      assert(matchesVietnameseSearch(target, 'DUI'), 'Target matches "DUI"');
      assert(matchesVietnameseSearch(target, 'vai dui'), 'Target matches "vai dui"');
      assert(matchesVietnameseSearch(target, 'vải đũi'), 'Target matches "vải đũi"');
    });

    await runTest('VietnameseSearch', 'Full Vietnamese tone marks spectrum across all vowels', () => {
      const vowelsWithTones = [
        // A variants
        { input: 'á à ả ã ạ', expected: 'a a a a a' },
        { input: 'ă ắ ằ ẳ ẵ ặ', expected: 'a a a a a a' },
        { input: 'â ấn ần ẩn lẫn hận', expected: 'a an an an lan han' },
        // E variants
        { input: 'é è ẻ vẽ mẹ', expected: 'e e e ve me' },
        { input: 'ê tế tề để lễ nghệ', expected: 'e te te de le nghe' },
        // I variants
        { input: 'í ì ỉ kĩ chị', expected: 'i i i ki chi' },
        // O variants
        { input: 'ó bò đỏ rõ họ', expected: 'o bo do ro ho' },
        { input: 'ô cố mồ bổ chỗ hộ', expected: 'o co mo bo cho ho' },
        { input: 'ơ cớ cờ ở cỡ sợ', expected: 'o co co o co so' },
        // U variants
        { input: 'ú tù củ cũ vụ', expected: 'u tu cu cu vu' },
        { input: 'ư cứ từ cử cữ sự', expected: 'u cu tu cu cu su' },
        // Y variants
        { input: 'ý kỳ tỷ mỹ tỵ', expected: 'y ky ty my ty' },
      ];

      for (const { input, expected } of vowelsWithTones) {
        assertEqual(
          normalizeVietnamese(input),
          expected,
          `Failed normalizing tone group "${input}"`
        );
      }
    });

    await runTest('VietnameseSearch', 'Uppercase & Lowercase đ / Đ transliteration', () => {
      assertEqual(normalizeVietnamese('Đà Nẵng'), 'da nang');
      assertEqual(normalizeVietnamese('ĐỒNG NAI'), 'dong nai');
      assertEqual(normalizeVietnamese('đường xá đông đúc'), 'duong xa dong duc');
      assertEqual(normalizeVietnamese('ĐƠN ĐẶT HÀNG ĐÃ ĐƯỢC DUYỆT'), 'don dat hang da duoc duyet');
    });

    await runTest('VietnameseSearch', 'NFC precomposed vs NFD decomposed Unicode representation invariance', () => {
      const nfcString = 'Áo kiểu nữ vải voan hoa nhí cổ vuông tay bồng';
      const nfdString = nfcString.normalize('NFD');

      const normNFC = normalizeVietnamese(nfcString);
      const normNFD = normalizeVietnamese(nfdString);

      assertEqual(normNFC, normNFD, 'NFC and NFD normalized strings must be strictly identical');
      assert(matchesVietnameseSearch(nfcString, 'ao kieu'), 'Matches query on NFC target');
      assert(matchesVietnameseSearch(nfdString, 'ao kieu'), 'Matches query on NFD target');
      assert(matchesVietnameseSearch(nfcString, 'áo kiểu'.normalize('NFD')), 'Matches NFD query on NFC target');
    });

    await runTest('VietnameseSearch', 'Multi-word queries with arbitrary token permutations', () => {
      const haystack = 'Đầm Xòe Công Sở Nữ Màu Trắng Cổ V Dáng A';

      // All combinations of 2, 3, 4 words in random order
      assert(matchesVietnameseSearch(haystack, 'cong so dam xoe'), 'Reverse order 1');
      assert(matchesVietnameseSearch(haystack, 'trang nu cong so dam'), 'Reverse order 2');
      assert(matchesVietnameseSearch(haystack, 'dang a mau trang'), 'Sub-phrase');
      assert(matchesVietnameseSearch(haystack, 'xoe co v dam'), 'Interleaved tokens');

      // Negative checks: if any token is missing, MUST return false
      assert(!matchesVietnameseSearch(haystack, 'dam xoe mau den'), 'Should fail because "den" is not in haystack');
      assert(!matchesVietnameseSearch(haystack, 'ao so mi'), 'Should fail completely unrelated query');
    });

    await runTest('VietnameseSearch', 'Non-standard punctuation and mixed symbols in haystack', () => {
      const haystack = 'Áo Thun Nam (Cotton 100% / Size: L) - Màu: Trắng [Hàng Chính Hãng!]';

      // Query without punctuation should find words inside punctuated targets
      assert(matchesVietnameseSearch(haystack, 'ao thun'), 'Matches "ao thun"');
      assert(matchesVietnameseSearch(haystack, 'cotton 100'), 'Matches "cotton 100"');
      assert(matchesVietnameseSearch(haystack, 'chinh hang'), 'Matches "chinh hang"');
      assert(matchesVietnameseSearch(haystack, 'trang hang chinh hang'), 'Matches across delimiters');
    });

    await runTest('VietnameseSearch', 'Non-standard punctuation in query string', () => {
      const haystack = 'Đầm hoa nhí dáng xòe vải đũi';

      // Queries with trailing punctuation or commas
      // Note: tokenizeQuery uses whitespace splitting. Let's see how tokens behave:
      const tokensWithPunct = tokenizeQuery('đầm, hoa!');
      // Tokens will be ['dam,', 'hoa!'] if punctuation isn't stripped in tokenizer
      // Let's test if search matches or if query punctuation requires exact match
      const matchesStandard = matchesVietnameseSearch(haystack, 'đầm hoa');
      assert(matchesStandard, 'Matches "đầm hoa"');

      // Test query with exclamation or comma
      const punctQueryMatches = matchesVietnameseSearch(haystack, 'đầm, hoa');
      // Documenting behavior: tokenizeQuery preserves punctuation attached to words
      if (!punctQueryMatches) {
        console.log('    ℹ Note: Query with attached punctuation ("đầm, hoa") does not match unpunctuated target ("đầm hoa nhí") because tokenizeQuery does not strip punctuation.');
      }
    });

    await runTest('VietnameseSearch', 'Edge cases: null, undefined, empty, excess whitespace, numbers only', () => {
      assertEqual(normalizeVietnamese(null), '');
      assertEqual(normalizeVietnamese(undefined), '');
      assertEqual(normalizeVietnamese(''), '');
      assertEqual(normalizeVietnamese('   \n\t  '), '');

      // Query of pure whitespace matches anything (returns all)
      assert(matchesVietnameseSearch('Sản phẩm thử nghiệm', '    \t   '), 'Empty/whitespace query matches all');

      // Empty target
      assert(!matchesVietnameseSearch('', 'ao thun'), 'Empty target returns false');
      assert(!matchesVietnameseSearch(null, 'ao thun'), 'Null target returns false');
      assert(!matchesVietnameseSearch(undefined, 'ao thun'), 'Undefined target returns false');

      // Numeric query
      assert(matchesVietnameseSearch('Mã đơn hàng #108429', '108429'), 'Numeric query matches string');
    });

    await runTest('VietnameseSearch', 'Relevance ranking order hierarchy', () => {
      const query = 'Áo Thun';
      const exact = calculateRelevanceScore('Áo Thun', [], query);
      const prefix = calculateRelevanceScore('Áo Thun Nam Cổ Tròn', [], query);
      const contains = calculateRelevanceScore('Thời Trang Áo Thun Cao Cấp', [], query);
      const partial = calculateRelevanceScore('Áo Sơ Mi Nam', [], query);
      const none = calculateRelevanceScore('Quần Jeans Nam', [], query);

      assert(exact > prefix, `Exact (${exact}) > Prefix (${prefix})`);
      assert(prefix > contains, `Prefix (${prefix}) > Contains (${contains})`);
      assert(contains > partial, `Contains (${contains}) > Partial (${partial})`);
      assert(partial > none, `Partial (${partial}) > None (${none})`);
      assertEqual(none, 0, 'Unrelated score is 0');
    });

    // =========================================================================
    // SUITE 2: Vietnamese Locale-Aware Sorting Stress Tests
    // =========================================================================
    console.log('\n• SUITE 2: Vietnamese Locale-Aware Sorting Stress Tests');

    await runTest('LocaleSort', 'Sorts Vietnamese alphabet correctly (D precedes Đ, tone collation)', () => {
      const items = [
        { id: '1', name: 'Đầm dạ hội' },
        { id: '2', name: 'Dép sandal' },
        { id: '3', name: 'Áo khoác' },
        { id: '4', name: 'Balo laptop' },
        { id: '5', name: 'Cà vạt' },
      ];

      const sortedAsc = sortItems(items, { sortBy: 'name', sortOrder: 'asc' });
      const namesAsc = sortedAsc.map((i) => i.name);

      // In Vietnamese alphabet: A -> B -> C -> D -> Đ
      assertEqual(namesAsc[0], 'Áo khoác', 'First is Áo');
      assertEqual(namesAsc[1], 'Balo laptop', 'Second is Balo');
      assertEqual(namesAsc[2], 'Cà vạt', 'Third is Cà vạt');
      assertEqual(namesAsc[3], 'Dép sandal', 'D must precede Đ');
      assertEqual(namesAsc[4], 'Đầm dạ hội', 'Đ comes after D');

      const sortedDesc = sortItems(items, { sortBy: 'name', sortOrder: 'desc' });
      const namesDesc = sortedDesc.map((i) => i.name);
      assertEqual(namesDesc[0], 'Đầm dạ hội', 'Desc: First is Đầm');
      assertEqual(namesDesc[4], 'Áo khoác', 'Desc: Last is Áo');
    });

    await runTest('LocaleSort', 'Natural numeric sorting inside strings (numeric: true)', () => {
      const items = [
        { id: '1', title: 'Phiên bản 10' },
        { id: '2', title: 'Phiên bản 2' },
        { id: '3', title: 'Phiên bản 1' },
        { id: '4', title: 'Phiên bản 20' },
      ];

      const sorted = sortItems(items, { sortBy: 'title', sortOrder: 'asc' });
      const titles = sorted.map((i) => i.title);

      // Natural sort: 1 -> 2 -> 10 -> 20 (not 1 -> 10 -> 2 -> 20)
      assertEqual(titles[0], 'Phiên bản 1');
      assertEqual(titles[1], 'Phiên bản 2');
      assertEqual(titles[2], 'Phiên bản 10');
      assertEqual(titles[3], 'Phiên bản 20');
    });

    await runTest('LocaleSort', 'Null, undefined, and missing fields sort to the bottom safely', () => {
      const items = [
        { id: '1', name: 'Sản phẩm B', price: null },
        { id: '2', name: 'Sản phẩm A', price: 200000 },
        { id: '3', name: 'Sản phẩm C', price: undefined },
        { id: '4', name: 'Sản phẩm D', price: 100000 },
      ];

      const sortedAsc = sortItems(items, { sortBy: 'price', sortOrder: 'asc' });
      assertEqual(sortedAsc[0].id, '4', 'Lowest price first (100k)');
      assertEqual(sortedAsc[1].id, '2', 'Second price (200k)');
      // Null and undefined must be at the end
      assert(sortedAsc[2].price == null, 'Null/undefined sorted at bottom');
      assert(sortedAsc[3].price == null, 'Null/undefined sorted at bottom');
    });

    // =========================================================================
    // SUITE 3: LocalStorage CRUD Operations, Boundaries & Concurrency
    // =========================================================================
    console.log('\n• SUITE 3: LocalStorage CRUD Operations, Boundaries & Concurrency');

    const TEST_KEY = 'd2c_ecommerce:challenger_test:v1';

    await runTest('CRUD', 'Repository CRUD full lifecycle write-through', async () => {
      mockStorage.clear();
      const initialSeed = [
        { id: 'item_1', name: 'Sản phẩm mẫu 1', price: 100000 },
        { id: 'item_2', name: 'Sản phẩm mẫu 2', price: 200000 },
      ];

      const repo = new LocalStorageRepository(TEST_KEY, initialSeed);

      // Read initial
      const initialList = await repo.getAll();
      assertEqual(initialList.total, 2);
      assertEqual(initialList.items.length, 2);

      // Create new item
      const created = await repo.create({ name: 'Sản phẩm mới tạo', price: 350000 });
      assert(Boolean(created.id), 'Created item has generated ID');
      assertEqual(created.name, 'Sản phẩm mới tạo');
      assert(Boolean(created.createdAt), 'Item has createdAt');
      assert(Boolean(created.updatedAt), 'Item has updatedAt');

      // Verify in storage
      const rawStored = JSON.parse(mockStorage.getItem(TEST_KEY) || '[]');
      assert(rawStored.some((r) => r.id === created.id), 'Created item written to storage');

      // Read by ID
      const fetched = await repo.getById(created.id);
      assertEqual(fetched?.name, 'Sản phẩm mới tạo');

      // Update
      const updated = await repo.update(created.id, { price: 399000 });
      assertEqual(updated.price, 399000);
      assertEqual(updated.name, 'Sản phẩm mới tạo');

      // Verify ID immutability during update (attempting to override ID in payload)
      const immutabilityTest = await repo.update(created.id, { id: 'MALICIOUS_OVERRIDE_ID', price: 450000 });
      assertEqual(immutabilityTest.id, created.id, 'ID is strictly immutable during update');
      const storedAfterImmutability = JSON.parse(mockStorage.getItem(TEST_KEY) || '[]');
      assert(!storedAfterImmutability.some((r) => r.id === 'MALICIOUS_OVERRIDE_ID'), 'Malicious ID override ignored');

      // Delete
      const deleteResult = await repo.delete(created.id);
      assertEqual(deleteResult, true, 'Delete returns true');

      const afterDelete = await repo.getById(created.id);
      assertEqual(afterDelete, null, 'Deleted item returns null');
    });

    await runTest('CRUD', 'Storage corruption resilience (invalid JSON in localStorage)', async () => {
      mockStorage.clear();
      mockStorage.setItem(TEST_KEY, 'INVALID_CORRUPTED_JSON_{{{{');

      // Repository must not crash when initialized with corrupted data
      const repo = new LocalStorageRepository(TEST_KEY, [{ id: 'fallback_1', name: 'Fallback Item' }]);
      const records = await repo.getAll();
      assertEqual(records.total, 1, 'Recovers from corrupted storage by hydrating seed fallback');
      assertEqual(records.items[0].id, 'fallback_1');
    });

    await runTest('CRUD', 'Updating non-existent ID throws descriptive Error', async () => {
      mockStorage.clear();
      const repo = new LocalStorageRepository(TEST_KEY, []);

      let errorThrown = false;
      try {
        await repo.update('non_existent_id_404', { name: 'Attempted Update' });
      } catch (err) {
        errorThrown = true;
        assert(err.message.includes('non_existent_id_404'), 'Error message mentions missing ID');
      }
      assert(errorThrown, 'Must throw when updating non-existent ID');
    });

    await runTest('CRUD', 'Deleting deleted or non-existent items is safe and idempotent', async () => {
      mockStorage.clear();
      const repo = new LocalStorageRepository(TEST_KEY, [{ id: 'del_item', name: 'Item To Delete' }]);

      // First delete succeeds
      const res1 = await repo.delete('del_item');
      assertEqual(res1, true, 'First delete returns true');

      // Second delete on same ID returns false (does not throw)
      const res2 = await repo.delete('del_item');
      assertEqual(res2, false, 'Second delete returns false');

      // Delete completely arbitrary non-existent ID returns false
      const res3 = await repo.delete('ghost_item_999');
      assertEqual(res3, false, 'Delete non-existent returns false');
    });

    await runTest('CRUD', 'Pagination boundary conditions & clamping', () => {
      const mockItems = Array.from({ length: 45 }, (_, i) => ({
        id: `p_${i + 1}`,
        name: `Product ${i + 1}`,
      }));

      // 1. Normal pagination: page 1, size 10
      const p1 = paginateItems(mockItems, { page: 1, pageSize: 10 });
      assertEqual(p1.page, 1);
      assertEqual(p1.pageSize, 10);
      assertEqual(p1.total, 45);
      assertEqual(p1.totalPages, 5);
      assertEqual(p1.items.length, 10);
      assertEqual(p1.hasNextPage, true);
      assertEqual(p1.hasPrevPage, false);
      assert(p1.items === p1.data, 'Dual pointer contract: p1.items === p1.data');

      // 2. Page 0 or negative page clamped to 1
      const pZero = paginateItems(mockItems, { page: 0, pageSize: 10 });
      assertEqual(pZero.page, 1, 'Page 0 clamped to 1');
      const pNeg = paginateItems(mockItems, { page: -99, pageSize: 10 });
      assertEqual(pNeg.page, 1, 'Negative page clamped to 1');

      // 3. Page far beyond totalPages clamped to totalPages
      const pBeyond = paginateItems(mockItems, { page: 9999, pageSize: 10 });
      assertEqual(pBeyond.page, 5, 'Page 9999 clamped to totalPages (5)');
      assertEqual(pBeyond.items.length, 5, 'Last page has 5 items');
      assertEqual(pBeyond.hasNextPage, false);
      assertEqual(pBeyond.hasPrevPage, true);

      // 4. PageSize boundary: 0 or negative clamped to 1
      const pZeroSize = paginateItems(mockItems, { page: 1, pageSize: 0 });
      assertEqual(pZeroSize.pageSize, 1, 'PageSize 0 clamped to 1');
      assertEqual(pZeroSize.items.length, 1);

      // 5. PageSize > 100 clamped to 100
      const pHugeSize = paginateItems(mockItems, { page: 1, pageSize: 500 });
      assertEqual(pHugeSize.pageSize, 100, 'PageSize 500 clamped to 100');
      assertEqual(pHugeSize.items.length, 45);

      // 6. Empty dataset
      const pEmpty = paginateItems([], { page: 1, pageSize: 20 });
      assertEqual(pEmpty.total, 0);
      assertEqual(pEmpty.page, 1);
      assertEqual(pEmpty.totalPages, 1);
      assertEqual(pEmpty.items.length, 0);
      assertEqual(pEmpty.data.length, 0);
      assertEqual(pEmpty.hasNextPage, false);
      assertEqual(pEmpty.hasPrevPage, false);
      assert(pEmpty.items === pEmpty.data, 'Dual pointer on empty dataset');
    });

    await runTest('CRUD', 'High concurrency stress: 30 concurrent async writes (Promise.all)', async () => {
      mockStorage.clear();
      const repo = new LocalStorageRepository(TEST_KEY, []);

      const writePromises = [];
      for (let i = 0; i < 30; i++) {
        writePromises.push(
          repo.create({
            name: `Concurrent Item #${i}`,
            price: (i + 1) * 10000,
          })
        );
      }

      const results = await Promise.all(writePromises);
      assertEqual(results.length, 30, 'All 30 concurrent creates completed');

      // Verify all 30 unique records are preserved in repository
      const allRecords = await repo.getAll({ pageSize: 100 });
      assertEqual(allRecords.total, 30, 'Total records in repo is exactly 30');

      // Verify no duplicate IDs
      const idSet = new Set(allRecords.items.map((r) => r.id));
      assertEqual(idSet.size, 30, 'All 30 IDs are strictly unique');

      // Verify storage serialization matches
      const rawStored = JSON.parse(mockStorage.getItem(TEST_KEY) || '[]');
      assertEqual(rawStored.length, 30, 'Storage contains exactly 30 items');
    });

    await runTest('CRUD', 'Interleaved concurrent reads and writes', async () => {
      mockStorage.clear();
      const repo = new LocalStorageRepository(TEST_KEY, []);

      // Create base item
      const item = await repo.create({ name: 'Base Item', price: 1000 });

      // Run 10 simultaneous updates and 10 reads
      const tasks = [];
      for (let i = 0; i < 10; i++) {
        tasks.push(repo.update(item.id, { price: 1000 + i }));
        tasks.push(repo.getById(item.id));
      }

      await Promise.all(tasks);

      const finalItem = await repo.getById(item.id);
      assert(finalItem !== null, 'Item exists after concurrent ops');
      assert(finalItem.price >= 1000, 'Price updated cleanly');
    });

    await runTest('CRUD', 'Bulk operations: bulkCreate and bulkDelete', async () => {
      mockStorage.clear();
      const repo = new LocalStorageRepository(TEST_KEY, []);

      const bulkPayload = Array.from({ length: 50 }, (_, i) => ({
        name: `Bulk Product ${i + 1}`,
        price: 50000 + i * 1000,
      }));

      const createdList = await repo.bulkCreate(bulkPayload);
      assertEqual(createdList.length, 50);

      const totalAfterBulk = await repo.count();
      assertEqual(totalAfterBulk, 50);

      // Bulk delete 20 items
      const idsToDelete = createdList.slice(0, 20).map((i) => i.id);
      const deletedCount = await repo.bulkDelete(idsToDelete);
      assertEqual(deletedCount, 20);

      const remainingCount = await repo.count();
      assertEqual(remainingCount, 30);
    });

    // =========================================================================
    // SUITE 4: QuotaGuard Behavior & Eviction Stress Tests
    // =========================================================================
    console.log('\n• SUITE 4: QuotaGuard Behavior & Eviction Stress Tests');

    await runTest('QuotaGuard', 'calculateStorageUsage byte computation and threshold flags', () => {
      mockStorage.clear();
      // Empty storage
      const initial = calculateStorageUsage();
      assertEqual(initial.usedBytes, 0);
      assertEqual(initial.usagePercentage, 0);
      assertEqual(initial.isNearLimit, false);
      assertEqual(initial.isCritical, false);

      // Populate with 4.1MB (exceeding 80% threshold of 5MB = 4MB)
      // (key.len + val.len)*2 => 4.1MB = 4,300,000 bytes => ~2,150,000 characters
      const largePayload = 'X'.repeat(2150000);
      mockStorage.setItem('d2c_ecommerce:test_near_limit', largePayload);

      const report80 = calculateStorageUsage();
      assert(report80.usagePercentage >= 80, `Usage (${report80.usagePercentage}%) must be >= 80%`);
      assertEqual(report80.isNearLimit, true, 'isNearLimit is true');
      assertEqual(report80.isCritical, false, 'isCritical is false at 82%');

      // Add more to exceed 95% threshold (4.8MB = ~2,400,000 characters)
      const extraPayload = 'Y'.repeat(350000);
      mockStorage.setItem('d2c_ecommerce:test_critical', extraPayload);

      const report95 = calculateStorageUsage();
      assert(report95.usagePercentage >= 95, `Usage (${report95.usagePercentage}%) must be >= 95%`);
      assertEqual(report95.isNearLimit, true);
      assertEqual(report95.isCritical, true, 'isCritical is true at >= 95%');
    });

    await runTest('QuotaGuard', 'isQuotaExceededError identifies diverse browser DOMExceptions', () => {
      // 1. Chrome / Standard DOMException
      const chromeErr = { name: 'QuotaExceededError', code: 22 };
      assert(isQuotaExceededError(chromeErr), 'Detects Chrome QuotaExceededError');

      // 2. Firefox NS_ERROR_DOM_QUOTA_REACHED
      const ffErr = { name: 'NS_ERROR_DOM_QUOTA_REACHED', code: 1014 };
      assert(isQuotaExceededError(ffErr), 'Detects Firefox NS_ERROR_DOM_QUOTA_REACHED');

      // 3. Fallback message containing "quota"
      const genericMsgErr = new Error('The quota has been exceeded for this origin');
      assert(isQuotaExceededError(genericMsgErr), 'Detects message containing "quota"');

      // 4. Non-quota errors return false
      assert(!isQuotaExceededError(new Error('Network error')), 'Non-quota returns false');
      assert(!isQuotaExceededError(null), 'null returns false');
      assert(!isQuotaExceededError(undefined), 'undefined returns false');
    });

    await runTest('QuotaGuard', 'Tier 1 eviction purges debug, query_cache, search_history', () => {
      mockStorage.clear();
      mockStorage.setItem('d2c_ecommerce:debug:logs', JSON.stringify(['log 1', 'log 2']));
      mockStorage.setItem('d2c_ecommerce:query_cache:plp', JSON.stringify({ cached: true }));
      mockStorage.setItem('d2c_ecommerce:search_history:user1', JSON.stringify(['ao', 'quan']));
      mockStorage.setItem('d2c_ecommerce:products:v1', JSON.stringify([{ id: 'p1', name: 'Vital Product' }]));
      mockStorage.setItem('foreign_app_key', 'keep this safe');

      const evicted = executeTieredEviction();
      assertEqual(evicted, true, 'executeTieredEviction returned true');

      // Tier 1 keys removed
      assertEqual(mockStorage.getItem('d2c_ecommerce:debug:logs'), null, 'Debug logs evicted');
      assertEqual(mockStorage.getItem('d2c_ecommerce:query_cache:plp'), null, 'Query cache evicted');
      assertEqual(mockStorage.getItem('d2c_ecommerce:search_history:user1'), null, 'Search history evicted');

      // Essential & Foreign keys retained
      assert(mockStorage.getItem('d2c_ecommerce:products:v1') !== null, 'Products key retained');
      assertEqual(mockStorage.getItem('foreign_app_key'), 'keep this safe', 'Foreign key untouched');
    });

    await runTest('QuotaGuard', 'Tier 2 eviction prunes cancelled orders when orders collection > 20 items', () => {
      mockStorage.clear();
      // Setup orders with 22 items: 17 completed and 5 cancelled
      const mockOrders = [];
      for (let i = 1; i <= 17; i++) {
        mockOrders.push({ id: `ord_${i}`, status: 'completed', total: 100000 });
      }
      for (let i = 18; i <= 22; i++) {
        mockOrders.push({ id: `ord_${i}`, status: 'cancelled', total: 50000 });
      }
      mockStorage.setItem('d2c_ecommerce:orders:v1', JSON.stringify(mockOrders));

      // No Tier 1 keys present, executeTieredEviction should proceed to Tier 2
      const evicted = executeTieredEviction();
      assertEqual(evicted, true, 'Tier 2 eviction returned true');

      const prunedOrders = JSON.parse(mockStorage.getItem('d2c_ecommerce:orders:v1') || '[]');
      assertEqual(prunedOrders.length, 17, 'Pruned 5 cancelled orders, 17 completed remain');
      assert(!prunedOrders.some((o) => o.status === 'cancelled'), 'Zero cancelled orders remaining');
    });

    await runTest('QuotaGuard', 'safeSetStorageItem recovers via eviction under storage pressure', () => {
      mockStorage.clear();
      // Configure mock storage quota to 200KB for precision testing
      mockStorage.quotaBytes = 200 * 1024; // 200KB limit

      // Fill ~170KB with Tier 1 evictable cache (85,000 chars * 2 = 170KB)
      const evictableData = 'C'.repeat(85000);
      mockStorage.setItem('d2c_ecommerce:query_cache:heavy', evictableData);

      // Now attempt to write a 50KB payload. Without eviction, 170KB + 50KB = 220KB > 200KB (would fail).
      const newPayload = 'N'.repeat(25000); // 50KB
      const success = safeSetStorageItem('d2c_ecommerce:vital_new_item', newPayload);

      assertEqual(success, true, 'safeSetStorageItem succeeded by evicting Tier 1 cache');
      assertEqual(mockStorage.getItem('d2c_ecommerce:query_cache:heavy'), null, 'Cache was evicted');
      assertEqual(mockStorage.getItem('d2c_ecommerce:vital_new_item'), newPayload, 'New payload written');

      // Restore standard quota
      mockStorage.quotaBytes = 5 * 1024 * 1024;
    });

    await runTest('QuotaGuard', 'Atomic rollback and alert dispatch on unrecoverable exhaustion', () => {
      mockStorage.clear();
      mockStorage.quotaBytes = 100 * 1024; // 100KB limit

      // Write stable initial state
      const initialVal = 'STABLE_DATA';
      mockStorage.setItem('d2c_ecommerce:target_key', initialVal);

      // Fill rest with NON-EVICTABLE vital keys
      const filler = 'F'.repeat(45000); // 90KB
      mockStorage.setItem('d2c_ecommerce:permanent_data', filler);

      let quotaAlertReceived = false;
      let alertDetail = null;

      const alertHandler = (e) => {
        quotaAlertReceived = true;
        alertDetail = e.detail;
      };

      globalThis.window.addEventListener('d2c:storage-quota-exceeded', alertHandler);

      // Attempt to write an oversized value (30KB > 10KB remaining space)
      const oversized = 'O'.repeat(15000); // 30KB
      const result = safeSetStorageItem('d2c_ecommerce:target_key', oversized);

      globalThis.window.removeEventListener('d2c:storage-quota-exceeded', alertHandler);

      assertEqual(result, false, 'safeSetStorageItem returned false on unrecoverable quota error');
      assertEqual(mockStorage.getItem('d2c_ecommerce:target_key'), initialVal, 'ATOMIC ROLLBACK: Value preserved');
      assertEqual(quotaAlertReceived, true, 'Dispatched "d2c:storage-quota-exceeded" custom event');
      assertEqual(alertDetail?.key, 'd2c_ecommerce:target_key', 'Offending key reported in event detail');

      // Restore standard quota
      mockStorage.quotaBytes = 5 * 1024 * 1024;
    });

    // =========================================================================
    // SUITE 5: System Factory Reset & Business Rules Verification
    // =========================================================================
    console.log('\n• SUITE 5: System Factory Reset & Business Rules Verification');

    await runTest('SystemService', 'resetDemoData rehydrates all seed collections and cleans namespace', async () => {
      mockStorage.clear();

      // Pollute storage with mutated data, test keys, and foreign keys
      mockStorage.setItem('d2c_ecommerce:products:v1', JSON.stringify([{ id: 'custom_polluted_product' }]));
      mockStorage.setItem('d2c_ecommerce:garbage:temp', 'garbage');
      mockStorage.setItem('d2c_other_token', 'temp_token');
      mockStorage.setItem('user_persisted_foreign_pref', 'keep_me');

      let resetEventDispatched = false;
      const resetListener = () => {
        resetEventDispatched = true;
      };
      globalThis.window.addEventListener('d2c:demo-data-reset', resetListener);

      const resetResult = await systemService.resetDemoData();
      globalThis.window.removeEventListener('d2c:demo-data-reset', resetListener);

      assertEqual(resetResult.success, true, 'Reset returned success: true');
      assertEqual(resetEventDispatched, true, 'Broadcasted d2c:demo-data-reset custom event');

      // Verify foreign key preserved
      assertEqual(mockStorage.getItem('user_persisted_foreign_pref'), 'keep_me', 'Foreign key preserved');

      // Verify garbage key deleted
      assertEqual(mockStorage.getItem('d2c_ecommerce:garbage:temp'), null, 'Garbage key cleared');

      // Verify all 6 core collections rehydrated with seed counts
      const rehydratedProducts = JSON.parse(mockStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
      assert(rehydratedProducts.length >= 20, `Products rehydrated (${rehydratedProducts.length})`);
      assert(!rehydratedProducts.some((p) => p.id === 'custom_polluted_product'), 'Polluted product purged');

      const rehydratedOrders = JSON.parse(mockStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
      assert(rehydratedOrders.length >= 10, 'Orders rehydrated');

      const rehydratedCustomers = JSON.parse(mockStorage.getItem(STORAGE_KEYS.CUSTOMERS) || '[]');
      assert(rehydratedCustomers.length >= 10, 'Customers rehydrated');

      const rehydratedCoupons = JSON.parse(mockStorage.getItem(STORAGE_KEYS.COUPONS) || '[]');
      assert(rehydratedCoupons.length >= 6, 'Coupons rehydrated');
    });

    await runTest('BusinessRules', 'Coupon discount calculation engine precision & edge limits', () => {
      // Find coupons
      const chaoban = seedCoupons.find((c) => c.code === 'CHAOBAN');
      const freeship = seedCoupons.find((c) => c.code === 'FREESHIP');
      const sale50k = seedCoupons.find((c) => c.code === 'SALE50K');
      const expired = seedCoupons.find((c) => c.code === 'EXPIRED10');
      const soldout = seedCoupons.find((c) => c.code === 'SOLDOUT');

      assert(chaoban != null && freeship != null && sale50k != null, 'Coupons exist in seed');

      // 1. Percentage discount (10% of 300,000 = 30,000)
      const res1 = calculateCouponDiscount(chaoban, 300000);
      assertEqual(res1.isValid, true);
      assertEqual(res1.discountAmount, 30000);

      // 2. Percentage discount hitting maxDiscount cap (10% of 1,000,000 = 100,000, maxDiscount = 50,000)
      const resCap = calculateCouponDiscount(chaoban, 1000000);
      assertEqual(resCap.isValid, true);
      assertEqual(resCap.discountAmount, 50000, 'Capped at maxDiscount 50,000₫');

      // 3. Subtotal below minimum order value (150,000 < 200,000)
      const resBelowMin = calculateCouponDiscount(chaoban, 150000);
      assertEqual(resBelowMin.isValid, false);
      assertEqual(resBelowMin.discountAmount, 0);

      // 4. Fixed amount discount (50,000₫)
      const resFixed = calculateCouponDiscount(sale50k, 400000);
      assertEqual(resFixed.isValid, true);
      assertEqual(resFixed.discountAmount, 50000);

      // 5. Free shipping discount capped by shippingFee or discountValue
      // Shipping fee 25,000 < coupon discountValue 30,000 => discount is 25,000
      const resShip1 = calculateCouponDiscount(freeship, 300000, 25000);
      assertEqual(resShip1.isValid, true);
      assertEqual(resShip1.discountAmount, 25000, 'Discount matches shipping fee when <= discountValue');

      // Shipping fee 40,000 > coupon discountValue 30,000 => discount is capped at 30,000
      const resShip2 = calculateCouponDiscount(freeship, 300000, 40000);
      assertEqual(resShip2.isValid, true);
      assertEqual(resShip2.discountAmount, 30000, 'Discount capped at discountValue 30,000₫');

      // 6. Expired coupon
      if (expired) {
        const resExp = calculateCouponDiscount(expired, 500000);
        assertEqual(resExp.isValid, false, 'Expired coupon rejected');
      }

      // 7. Sold out coupon
      if (soldout) {
        const resSold = calculateCouponDiscount(soldout, 500000);
        assertEqual(resSold.isValid, false, 'Sold out coupon rejected');
      }
    });

    console.log('\n================================================================');
    console.log('  CHALLENGER STRESS HARNESS SUMMARY                             ');
    console.log('================================================================');
    console.log(`Total Assertions Evaluated: ${totalAssertions}`);
    console.log(`Passed Tests:               ${passedTests}`);
    console.log(`Failed Tests:               ${failedTests}`);
    console.log('================================================================\n');

    if (failedTests > 0) {
      console.error('\nAdversarial Failures:');
      for (const f of failures) {
        console.error(`- [${f.suite}] ${f.test}: ${f.error}`);
      }
      process.exitCode = 1;
    } else {
      console.log(' ALL ADVERSARIAL STRESS TESTS PASSED EMPIRICALLY! \n');
      process.exitCode = 0;
    }
  } catch (fatalErr) {
    console.error('\nFATAL CHALLENGER HARNESS ERROR:', fatalErr);
    process.exitCode = 1;
  } finally {
    cleanupTempFiles();
  }
}

main();
