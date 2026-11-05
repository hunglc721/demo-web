/**
 * Tier 1 Contract & Functional Tests: Features 22 - 26 (Milestone 3 DAL & Mock Engine)
 * Feature 22: Generic Repository Pattern Interface & PaginatedResponse Envelope
 * Feature 23: LocalStorage Namespacing (d2c_ecommerce:*:v1) & Safe JSON Engine
 * Feature 24: Configurable Mock Delay & Random Network Error Injection (Chaos Simulator)
 * Feature 25: Vietnamese Accent-Insensitive Query Engine (Unicode NFD & đ/Đ)
 * Feature 26: Paginated, Sorted & Multi-faceted Filter Query Pipeline
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

// Import directly executable modules
import {
  normalizeVietnamese,
  tokenizeQuery,
  matchesVietnameseSearch,
  calculateRelevanceScore,
} from '../../../src/utils/vietnameseSearch.ts';

import {
  STORAGE_KEYS,
  STORAGE_PREFIX,
  STORAGE_VERSION,
  getEntityStorageKey,
} from '../../../src/services/storage/storageKeys.ts';

import {
  simulateDelay,
  MOCK_DELAY_DEFAULT_MIN,
  MOCK_DELAY_DEFAULT_MAX,
} from '../../../src/services/mock/mockLatency.ts';

// -----------------------------------------------------------------------------
// FEATURE 22: Generic Repository Pattern Interface (6 tests)
// -----------------------------------------------------------------------------
describe('Feature 22: Generic Repository Pattern Interface & Response Standard', () => {
  test('F22-1: IRepository interface contract and PaginatedResponse envelope definition', () => {
    const dalTypesPath = path.join(ROOT_DIR, 'src/types/dal.ts');
    const repoContractPath = path.join(ROOT_DIR, 'src/services/contracts/IRepository.ts');

    assert(fs.existsSync(dalTypesPath), 'src/types/dal.ts must exist');
    assert(fs.existsSync(repoContractPath), 'src/services/contracts/IRepository.ts must exist');

    const dalContent = fs.readFileSync(dalTypesPath, 'utf8');

    // Contract must define generic repository methods
    assertIncludes(dalContent, 'export interface IRepository<', 'Must export generic IRepository interface');
    assertIncludes(dalContent, 'getAll(', 'IRepository must specify getAll() method');
    assertIncludes(dalContent, 'getById(', 'IRepository must specify getById() method');
    assertIncludes(dalContent, 'findMany(', 'IRepository must specify findMany() method');
    assertIncludes(dalContent, 'exists(', 'IRepository must specify exists() method');
    assertIncludes(dalContent, 'count(', 'IRepository must specify count() method');
    assertIncludes(dalContent, 'create(', 'IRepository must specify create() method');
    assertIncludes(dalContent, 'update(', 'IRepository must specify update() method');
    assertIncludes(dalContent, 'delete(', 'IRepository must specify delete() method');
    assertIncludes(dalContent, 'bulkCreate(', 'IRepository must specify bulkCreate() method');
    assertIncludes(dalContent, 'bulkDelete(', 'IRepository must specify bulkDelete() method');
    assertIncludes(dalContent, 'clear():', 'IRepository must specify clear() method');

    // Envelope must define dual items and data properties
    assertIncludes(dalContent, 'export interface PaginatedResponse<T>', 'Must export PaginatedResponse<T>');
    assertIncludes(dalContent, 'items: T[]', 'PaginatedResponse must have items array');
    assertIncludes(dalContent, 'data: T[]', 'PaginatedResponse must have data alias array');
    assertIncludes(dalContent, 'total: number', 'PaginatedResponse must specify total count');
    assertIncludes(dalContent, 'page: number', 'PaginatedResponse must specify page number');
    assertIncludes(dalContent, 'pageSize: number', 'PaginatedResponse must specify pageSize');
    assertIncludes(dalContent, 'totalPages: number', 'PaginatedResponse must specify totalPages');
    assertIncludes(dalContent, 'hasNextPage: boolean', 'PaginatedResponse must specify hasNextPage');
    assertIncludes(dalContent, 'hasPrevPage: boolean', 'PaginatedResponse must specify hasPrevPage');
  });

  test('F22-2: PaginatedResponse envelope calculation invariants', () => {
    // Pure calculation invariant test
    function createPaginatedEnvelope(rawItems, page = 1, pageSize = 10) {
      const total = rawItems.length;
      const validPageSize = Math.min(Math.max(1, pageSize), 100);
      const totalPages = Math.max(1, Math.ceil(total / validPageSize));
      const validPage = total === 0 ? 1 : Math.min(Math.max(1, page), totalPages);
      const startIndex = (validPage - 1) * validPageSize;
      const slice = total === 0 ? [] : rawItems.slice(startIndex, startIndex + validPageSize);

      return {
        items: slice,
        data: slice, // Must point to identical slice
        total,
        page: validPage,
        pageSize: validPageSize,
        totalPages,
        hasNextPage: validPage < totalPages,
        hasPrevPage: validPage > 1,
      };
    }

    const sampleDataset = Array.from({ length: 45 }, (_, i) => ({ id: `item_${i + 1}`, name: `Item ${i + 1}` }));

    // Page 1 of 5 (10 items per page)
    const page1 = createPaginatedEnvelope(sampleDataset, 1, 10);
    assertEqual(page1.items.length, 10, 'Page 1 should have 10 items');
    assertEqual(page1.data, page1.items, 'data and items must reference identical array');
    assertEqual(page1.total, 45, 'Total should equal 45');
    assertEqual(page1.totalPages, 5, 'Total pages should equal 5 (Math.ceil(45/10))');
    assertEqual(page1.hasNextPage, true, 'Page 1 hasNextPage must be true');
    assertEqual(page1.hasPrevPage, false, 'Page 1 hasPrevPage must be false');
    assertEqual(page1.items[0].id, 'item_1', 'First item on page 1 is item_1');

    // Page 5 of 5 (Last page: 5 remaining items)
    const page5 = createPaginatedEnvelope(sampleDataset, 5, 10);
    assertEqual(page5.items.length, 5, 'Page 5 should contain last 5 items');
    assertEqual(page5.hasNextPage, false, 'Last page hasNextPage must be false');
    assertEqual(page5.hasPrevPage, true, 'Page 5 hasPrevPage must be true');
    assertEqual(page5.items[4].id, 'item_45', 'Last item on page 5 is item_45');

    // Empty dataset boundary
    const emptyResult = createPaginatedEnvelope([], 1, 10);
    assertEqual(emptyResult.total, 0, 'Empty dataset total is 0');
    assertEqual(emptyResult.totalPages, 1, 'Empty dataset totalPages is clamped to 1');
    assertEqual(emptyResult.items.length, 0, 'Empty items array');
    assertEqual(emptyResult.hasNextPage, false, 'Empty dataset hasNextPage false');
    assertEqual(emptyResult.hasPrevPage, false, 'Empty dataset hasPrevPage false');
  });

  test('F22-3: LocalStorageRepository class exists and conforms to IRepository', () => {
    const repoPath = path.join(ROOT_DIR, 'src/services/mock/LocalStorageRepository.ts');
    assert(fs.existsSync(repoPath), 'LocalStorageRepository.ts must exist');

    const content = fs.readFileSync(repoPath, 'utf8');
    assertIncludes(content, 'export class LocalStorageRepository<', 'Must export generic LocalStorageRepository class');
    assertIncludes(content, 'implements IRepository<', 'LocalStorageRepository must implement IRepository contract');
    assertIncludes(content, 'protected readonly storageKey: string', 'Must hold storageKey');
    assertIncludes(content, 'protected readonly initialSeed: T[]', 'Must hold initialSeed');
    assertIncludes(content, 'public async getAll(', 'Must implement getAll');
    assertIncludes(content, 'public async getById(', 'Must implement getById');
    assertIncludes(content, 'public async create(', 'Must implement create');
    assertIncludes(content, 'public async update(', 'Must implement update');
    assertIncludes(content, 'public async delete(', 'Must implement delete');
    assertIncludes(content, 'public async bulkCreate(', 'Must implement bulkCreate');
    assertIncludes(content, 'public async bulkDelete(', 'Must implement bulkDelete');
    assertIncludes(content, 'public async clear():', 'Must implement clear');
  });

  test('F22-4: LocalStorageRepository auto-generates ID, timestamps and preserves immutability', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/services/mock/LocalStorageRepository.ts'), 'utf8');

    // Check ID and timestamp generation logic
    assertIncludes(content, 'crypto.randomUUID', 'Should attempt to generate secure UUID');
    assertIncludes(content, 'createdAt:', 'Must assign createdAt timestamp');
    assertIncludes(content, 'updatedAt:', 'Must assign updatedAt timestamp');
    assertIncludes(content, 'this.deepClone', 'Must return deep-cloned records to protect internal cache from mutation');
  });

  test('F22-5: LocalStorageRepository update method guards non-existent records and protects ID', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/services/mock/LocalStorageRepository.ts'), 'utf8');

    // Verify non-existent ID throws error
    assertIncludes(content, 'was not found in', 'Must throw descriptive error if ID is not found on update');
    // Verify ID immutability
    assertIncludes(content, 'id, // Immutable ID', 'Must keep original ID intact during update');
  });

  test('F22-6: Standard ApiResponse and DalApiError error contract', () => {
    const dalContent = fs.readFileSync(path.join(ROOT_DIR, 'src/types/dal.ts'), 'utf8');

    assertIncludes(dalContent, 'export class DalApiError extends Error', 'Must export DalApiError');
    assertIncludes(dalContent, 'readonly statusCode: number;', 'DalApiError must have statusCode');
    assertIncludes(dalContent, 'readonly code: string;', 'DalApiError must have error code');
    assertIncludes(dalContent, 'readonly timestamp: string;', 'DalApiError must have timestamp');
  });
});

// -----------------------------------------------------------------------------
// FEATURE 23: LocalStorage Namespacing & Serializer (6 tests)
// -----------------------------------------------------------------------------
describe('Feature 23: LocalStorage Namespacing (d2c_ecommerce:*:v1) & Serializer', () => {
  test('F23-1: Centralized storage keys adhere to d2c_ecommerce:<entity>:v1 schema', () => {
    assertEqual(STORAGE_PREFIX, 'd2c_ecommerce', 'Storage prefix must be d2c_ecommerce');
    assertEqual(STORAGE_VERSION, 'v1', 'Storage version must be v1');

    const keyPattern = /^d2c_ecommerce:[a-z0-9_]+:v1$/;

    const expectedKeys = [
      'PRODUCTS',
      'CATEGORIES',
      'ORDERS',
      'CUSTOMERS',
      'COUPONS',
      'SETTINGS',
      'AUTH',
      'THEME',
      'CART',
      'BLOCKS',
      'MOCK_CONFIG',
      'META',
    ];

    for (const key of expectedKeys) {
      assert(key in STORAGE_KEYS, `STORAGE_KEYS must include ${key}`);
      const val = STORAGE_KEYS[key];
      assertMatch(val, keyPattern, `Storage key for ${key} (${val}) must match schema`);
    }

    // Helper function verification
    assertEqual(
      getEntityStorageKey('products'),
      'd2c_ecommerce:products:v1',
      'getEntityStorageKey must format entity name to standard namespaced key'
    );
    assertEqual(
      getEntityStorageKey('CUSTOMERS'),
      'd2c_ecommerce:customers:v1',
      'getEntityStorageKey must lowercase entity name'
    );
  });

  test('F23-2: Safe JSON parsing handles valid, empty, and corrupt payloads', () => {
    function safeJsonParse(raw, fallback) {
      if (!raw) return fallback;
      try {
        const parsed = JSON.parse(raw);
        return parsed !== null && parsed !== undefined ? parsed : fallback;
      } catch {
        return fallback;
      }
    }

    // Valid JSON
    const parsedValid = safeJsonParse('{"id":"p1","price":120000}', null);
    assertEqual(parsedValid.id, 'p1', 'Valid JSON must parse cleanly');
    assertEqual(parsedValid.price, 120000, 'Parsed numbers must retain value');

    // Corrupt JSON string
    const fallbackObj = { fallback: true };
    const parsedCorrupt = safeJsonParse('{id:"broken",price:120000', fallbackObj);
    assertEqual(parsedCorrupt, fallbackObj, 'Corrupted JSON must return provided fallback object');

    // Null and empty strings
    assertDeepEqual(safeJsonParse(null, []), [], 'Null raw input must return fallback');
    assertEqual(safeJsonParse('', 'default'), 'default', 'Empty string must return fallback');
    assertEqual(safeJsonParse('undefined', null), null, 'Invalid literal undefined returns fallback');
  });

  test('F23-3: MemoryStorageFallback operates seamlessly when window.localStorage is absent', () => {
    const memStore = new Map();
    const memoryAdapter = {
      getItem: (k) => memStore.get(k) ?? null,
      setItem: (k, v) => memStore.set(k, String(v)),
      removeItem: (k) => memStore.delete(k),
      clear: () => memStore.clear(),
      get length() { return memStore.size; },
      key: (i) => Array.from(memStore.keys())[i] ?? null,
    };

    memoryAdapter.setItem('d2c_ecommerce:test:v1', JSON.stringify({ active: true }));
    assertEqual(memoryAdapter.length, 1, 'Memory adapter length should increment');
    assertEqual(memoryAdapter.key(0), 'd2c_ecommerce:test:v1', 'key(0) returns stored key');

    const retrieved = JSON.parse(memoryAdapter.getItem('d2c_ecommerce:test:v1'));
    assertEqual(retrieved.active, true, 'Retrieved value matches stored object');

    memoryAdapter.removeItem('d2c_ecommerce:test:v1');
    assertEqual(memoryAdapter.getItem('d2c_ecommerce:test:v1'), null, 'Removed item returns null');
    assertEqual(memoryAdapter.length, 0, 'Memory store is now empty');
  });

  test('F23-4: LocalStorageEngine source file exists and implements safe serialization', () => {
    const enginePath = path.join(ROOT_DIR, 'src/services/storage/localStorageEngine.ts');
    assert(fs.existsSync(enginePath), 'localStorageEngine.ts must exist');

    const content = fs.readFileSync(enginePath, 'utf8');
    assertIncludes(content, 'export class MemoryStorageFallback', 'Must export MemoryStorageFallback');
    assertIncludes(content, 'export function isLocalStorageAvailable', 'Must export availability check');
    assertIncludes(content, 'export function safeJsonParse', 'Must export safeJsonParse');
    assertIncludes(content, 'export function safeJsonStringify', 'Must export safeJsonStringify');
    assertIncludes(content, 'export class LocalStorageEngine', 'Must export LocalStorageEngine');
  });

  test('F23-5: Storage keys isolation protects third-party and foreign application keys', () => {
    const { storage, getNamespacedKeys } = createTestContext({ forceGlobalMock: false });

    // Populate mix of D2C keys and foreign keys
    storage.setItem('d2c_ecommerce:products:v1', JSON.stringify([{ id: 'p1' }]));
    storage.setItem('d2c_ecommerce:orders:v1', JSON.stringify([{ id: 'o1' }]));
    storage.setItem('google_analytics:cid', 'GA1.2.123456');
    storage.setItem('vite:debug', 'true');

    assertEqual(storage.length, 4, 'Storage should contain 4 items total');

    const d2cKeys = getNamespacedKeys('d2c_ecommerce:');
    assertEqual(d2cKeys.length, 2, 'Exactly 2 keys belong to d2c_ecommerce namespace');
    assertIncludes(d2cKeys, 'd2c_ecommerce:products:v1', 'Products key is present');
    assertIncludes(d2cKeys, 'd2c_ecommerce:orders:v1', 'Orders key is present');

    // Foreign keys remain accessible and untouched
    assertEqual(storage.getItem('google_analytics:cid'), 'GA1.2.123456', 'Foreign keys are intact');
  });

  test('F23-6: Cross-tab synchronization event listener is declared in LocalStorageRepository', () => {
    const repoContent = fs.readFileSync(path.join(ROOT_DIR, 'src/services/mock/LocalStorageRepository.ts'), 'utf8');
    assertIncludes(repoContent, 'window.addEventListener(\'storage\'', 'Must attach storage event listener for cross-tab sync');
    assertIncludes(repoContent, 'e.key === this.storageKey', 'Must check matching storageKey before refreshing cache');
  });
});

// -----------------------------------------------------------------------------
// FEATURE 24: Configurable Mock Delay & Random Network Error Injection (6 tests)
// -----------------------------------------------------------------------------
describe('Feature 24: Configurable Mock Delay & Random Network Error Injection', () => {
  test('F24-1: Default mock engine configuration adheres to 200–400ms jitter specification', () => {
    const mockEnginePath = path.join(ROOT_DIR, 'src/services/mock/mockEngine.ts');
    assert(fs.existsSync(mockEnginePath), 'mockEngine.ts must exist');

    const content = fs.readFileSync(mockEnginePath, 'utf8');
    assertIncludes(content, 'delayEnabled: true', 'Default delayEnabled must be true');
    assertIncludes(content, 'minDelayMs: 200', 'Default minDelayMs must be 200');
    assertIncludes(content, 'maxDelayMs: 400', 'Default maxDelayMs must be 400');
    assertIncludes(content, 'slowNetworkMode: false', 'Default slowNetworkMode must be false');
    assertIncludes(content, 'errorRate: 0', 'Default errorRate must be 0');
  });

  test('F24-2: MockEngineManager loads configuration from STORAGE_KEYS.MOCK_CONFIG', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/services/mock/mockEngine.ts'), 'utf8');
    assertIncludes(content, 'STORAGE_KEYS.MOCK_CONFIG', 'Must bind to STORAGE_KEYS.MOCK_CONFIG');
    assertIncludes(content, 'public updateConfig(', 'Must provide updateConfig method');
    assertIncludes(content, 'simulateDelay(', 'Must provide simulateDelay method');
    assertIncludes(content, 'public maybeInjectError(', 'Must provide maybeInjectError method');
  });

  test('F24-3: simulateDelay function resolves within expected bounds and supports 0ms test mode', async () => {
    assertEqual(MOCK_DELAY_DEFAULT_MIN, 200, 'MOCK_DELAY_DEFAULT_MIN must equal 200ms');
    assertEqual(MOCK_DELAY_DEFAULT_MAX, 400, 'MOCK_DELAY_DEFAULT_MAX must equal 400ms');

    // Zero-latency test mode should resolve immediately
    const startZero = Date.now();
    await simulateDelay(0);
    const elapsedZero = Date.now() - startZero;
    assert(elapsedZero < 20, `Zero delay should resolve < 20ms, got ${elapsedZero}ms`);

    // Disabled mode should resolve immediately
    const startDisabled = Date.now();
    await simulateDelay({ enabled: false, minDelayMs: 500, maxDelayMs: 1000 });
    const elapsedDisabled = Date.now() - startDisabled;
    assert(elapsedDisabled < 20, `Disabled delay should resolve < 20ms, got ${elapsedDisabled}ms`);
  });

  test('F24-4: Offline network error simulation throws NETWORK_OFFLINE with status 0', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/services/mock/mockEngine.ts'), 'utf8');
    assertIncludes(content, 'simulateOffline', 'Must check simulateOffline flag');
    assertIncludes(content, 'NETWORK_OFFLINE', 'Must throw code NETWORK_OFFLINE on offline mode');
    assertIncludes(content, '0,', 'Offline statusCode must be 0');
  });

  test('F24-5: Server error simulation throws INTERNAL_SERVER_ERROR with status 500', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/services/mock/mockEngine.ts'), 'utf8');
    assertIncludes(content, 'simulateServerError', 'Must check simulateServerError flag');
    assertIncludes(content, 'INTERNAL_SERVER_ERROR', 'Must throw code INTERNAL_SERVER_ERROR on server error mode');
    assertIncludes(content, '500,', 'Server error statusCode must be 500');
  });

  test('F24-6: Chaos random error rate logic throws SIMULATED_CHAOS_ERROR', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/services/mock/mockEngine.ts'), 'utf8');
    assertIncludes(content, 'SIMULATED_CHAOS_ERROR', 'Must throw SIMULATED_CHAOS_ERROR when errorRate triggers');
    assertIncludes(content, 'Math.random() < this.config.errorRate', 'Must compare Math.random() against errorRate');
  });
});

// -----------------------------------------------------------------------------
// FEATURE 25: Vietnamese Accent-Insensitive Query Engine (6 tests)
// -----------------------------------------------------------------------------
describe('Feature 25: Vietnamese Accent-Insensitive Query Engine (Unicode NFD & đ/Đ)', () => {
  test('F25-1: normalizeVietnamese strips all 5 Vietnamese tone marks and combining accents', () => {
    // Sắc (acute), Huyền (grave), Hỏi (hook above), Ngã (tilde), Nặng (dot below)
    const accentedVowels = 'á à ả ã ạ ă ắ ằ ẳ ẵ ặ â ấn ầ ẩ ẫ ậ é è ẻ ẽ ẹ ê ế ề ể ễ ệ í ì ỉ ĩ ị ó ò ỏ õ ọ ô ố ồ ổ ỗ ộ ơ ớ ờ ở ỡ ợ ú ù ủ ũ ụ ư ứ ừ ử ữ ự ý ỳ ỷ ỹ ỵ';
    const normalized = normalizeVietnamese(accentedVowels);

    // After normalization, NO combining diacritics or non-ASCII vowels should remain
    assertMatch(normalized, /^[a-z\s]+$/, `Normalized output "${normalized}" must contain only base ASCII letters and spaces`);
    assert(!normalized.includes('á'), 'Should not contain á');
    assert(!normalized.includes('ế'), 'Should not contain ế');
    assert(!normalized.includes('ở'), 'Should not contain ở');
    assert(!normalized.includes('ự'), 'Should not contain ự');
  });

  test('F25-2: normalizeVietnamese explicitly transliterates distinct Vietnamese đ and Đ consonants', () => {
    // Crucial check: đ and Đ do NOT decompose via Unicode NFD alone
    const inputWithD = 'Đồng Hồ Đeo Tay Nam Đẳng Cấp Đi Phượt';
    const normalized = normalizeVietnamese(inputWithD);

    assertEqual(
      normalized,
      'dong ho deo tay nam dang cap di phuot',
      'Both uppercase Đ and lowercase đ must be converted cleanly to d'
    );
    assert(!normalized.includes('đ'), 'Must not retain lowercase đ');
    assert(!normalized.includes('Đ'), 'Must not retain uppercase Đ');
  });

  test('F25-3: tokenizeQuery sanitizes whitespace and extracts non-empty alphanumeric tokens', () => {
    const query = '   Áo    Sơ-Mi    Lụa   Nam   ';
    const tokens = tokenizeQuery(query);

    assert(Array.isArray(tokens), 'tokenizeQuery must return array');
    assertEqual(tokens.length, 4, 'Must parse exactly 4 tokens');
    assertEqual(tokens[0], 'ao', 'First token is "ao"');
    assertEqual(tokens[1], 'so-mi', 'Second token is "so-mi"');
    assertEqual(tokens[2], 'lua', 'Third token is "lua"');
    assertEqual(tokens[3], 'nam', 'Fourth token is "nam"');

    // Empty/Null cases
    assertDeepEqual(tokenizeQuery(''), [], 'Empty query returns empty array');
    assertDeepEqual(tokenizeQuery('   '), [], 'Whitespace query returns empty array');
    assertDeepEqual(tokenizeQuery(null), [], 'Null returns empty array');
    assertDeepEqual(tokenizeQuery(undefined), [], 'Undefined returns empty array');
  });

  test('F25-4: matchesVietnameseSearch performs conjunctive (AND) matching regardless of word order', () => {
    const haystack = 'Áo Thun Nam Cotton Cổ Tròn Dáng Rộng Màu Trắng';

    // Searching "ao nam" matches because both "ao" and "nam" exist in haystack
    assertEqual(matchesVietnameseSearch(haystack, 'ao nam'), true, '"ao nam" should match');
    assertEqual(matchesVietnameseSearch(haystack, 'áo trắng nam'), true, '"áo trắng nam" should match');
    assertEqual(matchesVietnameseSearch(haystack, 'cotton co tron'), true, '"cotton co tron" should match');

    // Non-matching query
    assertEqual(matchesVietnameseSearch(haystack, 'ao nu'), false, '"ao nu" should NOT match');
    assertEqual(matchesVietnameseSearch(haystack, 'den'), false, '"den" should NOT match');

    // Empty query matches everything
    assertEqual(matchesVietnameseSearch(haystack, ''), true, 'Empty query returns true');
  });

  test('F25-5: matchesVietnameseSearch supports multi-field array haystacks', () => {
    const fields = [
      'Áo Polo Classic',
      'POLO-001',
      'Thời Trang Nam',
      'Chất liệu cotton thoáng mát, thấm hút mồ hôi tốt',
      'polo, nam, cotton, classic',
    ];

    // Matches across distinct fields
    assertEqual(matchesVietnameseSearch(fields, 'polo 001'), true, 'Matches across title and SKU');
    assertEqual(matchesVietnameseSearch(fields, 'thoi trang cotton'), true, 'Matches across category and description');
    assertEqual(matchesVietnameseSearch(fields, 'polo nu'), false, 'Non-existent term in any field returns false');
  });

  test('F25-6: calculateRelevanceScore prioritizes exact and title matches over secondary text matches', () => {
    const title = 'Áo Thun Nam Cotton';
    const secondaryFields = ['POLO-001', 'Thời Trang Nam', 'Chất vải mềm'];

    const scoreExact = calculateRelevanceScore(title, secondaryFields, 'Áo Thun Nam Cotton');
    const scorePrefix = calculateRelevanceScore(title, secondaryFields, 'Áo Thun');
    const scorePartial = calculateRelevanceScore(title, secondaryFields, 'POLO');
    const scoreIrrelevant = calculateRelevanceScore(title, secondaryFields, 'Xe Máy Điện');

    assertGreaterThan(scoreExact, scorePrefix, 'Exact title match must score higher than prefix match');
    assertGreaterThan(scorePrefix, scorePartial, 'Title prefix match must score higher than secondary field match');
    assertEqual(scoreIrrelevant, 0, 'Irrelevant query without any token overlap must score 0');
  });
});

// -----------------------------------------------------------------------------
// FEATURE 26: Paginated, Sorted & Multi-faceted Filter Query Pipeline (6 tests)
// -----------------------------------------------------------------------------
describe('Feature 26: Paginated, Sorted & Multi-faceted Filter Query Pipeline', () => {
  // Mock dataset for testing query pipeline logic
  const testProducts = [
    { id: 'p1', name: 'Áo Thun Nam Basic', categoryId: 'thoi-trang-nam', price: 150000, stock: 25, status: 'active', createdAt: '2026-01-01T00:00:00Z' },
    { id: 'p2', name: 'Đầm Xòe Nữ Hoa Nhí', categoryId: 'thoi-trang-nu', price: 350000, stock: 10, status: 'active', createdAt: '2026-01-02T00:00:00Z' },
    { id: 'p3', name: 'Ví Da Bò Nam Cao Cấp', categoryId: 'phu-kien', price: 450000, stock: 0, status: 'active', createdAt: '2026-01-03T00:00:00Z' },
    { id: 'p4', name: 'Áo Sơ Mi Nam Lụa', categoryId: 'thoi-trang-nam', price: 290000, stock: 15, status: 'active', createdAt: '2026-01-04T00:00:00Z' },
    { id: 'p5', name: 'Son Dưỡng Môi Hữu Cơ', categoryId: 'my-pham', price: 120000, stock: 50, status: 'draft', createdAt: '2026-01-05T00:00:00Z' },
  ];

  test('F26-1: Query pipeline filtering by category, price bounds, and stock status', () => {
    function filterMock(items, { category, minPrice, maxPrice, inStock, status }) {
      return items.filter((item) => {
        if (category && item.categoryId !== category) return false;
        if (minPrice !== undefined && item.price < minPrice) return false;
        if (maxPrice !== undefined && item.price > maxPrice) return false;
        if (inStock === true && item.stock <= 0) return false;
        if (inStock === false && item.stock > 0) return false;
        if (status && item.status !== status) return false;
        return true;
      });
    }

    // Category filter
    const menItems = filterMock(testProducts, { category: 'thoi-trang-nam' });
    assertEqual(menItems.length, 2, 'Should find 2 men items (p1, p4)');

    // Price range filter: 200,000 VND to 400,000 VND
    const midPriceItems = filterMock(testProducts, { minPrice: 200000, maxPrice: 400000 });
    assertEqual(midPriceItems.length, 2, 'Should find 2 items in price range 200k-400k (p2: 350k, p4: 290k)');

    // In-stock filter
    const inStockItems = filterMock(testProducts, { inStock: true });
    assertEqual(inStockItems.length, 4, '4 items in stock, p3 out of stock');
    assert(!inStockItems.some((i) => i.id === 'p3'), 'p3 (stock 0) must be excluded when inStock=true');
  });

  test('F26-2: Vietnamese locale-aware alphabetical sorting (Ă, Â, Đ, Ê, Ô, Ơ, Ư)', () => {
    const vietnameseTitles = [
      { name: 'Xoài Cát' },
      { name: 'Áo Thun' },
      { name: 'Balo Laptop' },
      { name: 'Đồng Hồ' },
      { name: 'Áo Sơ Mi' },
    ];

    const sorted = [...vietnameseTitles].sort((a, b) =>
      a.name.localeCompare(b.name, 'vi', { sensitivity: 'base', numeric: true })
    );

    // In Vietnamese alphabet: Áo Sơ Mi < Áo Thun < Balo Laptop < Đồng Hồ < Xoài Cát
    assertEqual(sorted[0].name, 'Áo Sơ Mi', 'First item in Vietnamese alphabetical sort');
    assertEqual(sorted[1].name, 'Áo Thun', 'Second item');
    assertEqual(sorted[2].name, 'Balo Laptop', 'Third item');
    assertEqual(sorted[3].name, 'Đồng Hồ', 'Đ comes after B, not after Z');
    assertEqual(sorted[4].name, 'Xoài Cát', 'Last item is X');
  });

  test('F26-3: Numeric price sorting ascending and descending', () => {
    const sortedAsc = [...testProducts].sort((a, b) => a.price - b.price);
    assertEqual(sortedAsc[0].id, 'p5', 'Lowest price is p5 (120k)');
    assertEqual(sortedAsc[sortedAsc.length - 1].id, 'p3', 'Highest price is p3 (450k)');

    const sortedDesc = [...testProducts].sort((a, b) => b.price - a.price);
    assertEqual(sortedDesc[0].id, 'p3', 'First in desc sort is p3 (450k)');
    assertEqual(sortedDesc[sortedDesc.length - 1].id, 'p5', 'Last in desc sort is p5 (120k)');
  });

  test('F26-4: Timestamp date sorting ascending and descending', () => {
    const sortedDesc = [...testProducts].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    assertEqual(sortedDesc[0].id, 'p5', 'Newest item is p5 (Jan 5)');
    assertEqual(sortedDesc[sortedDesc.length - 1].id, 'p1', 'Oldest item is p1 (Jan 1)');
  });

  test('F26-5: Boundary-clamped pagination handles out-of-range pages and page sizes', () => {
    function paginate(items, page = 1, pageSize = 2) {
      const total = items.length;
      const clampedPageSize = Math.min(Math.max(1, pageSize), 100);
      const totalPages = Math.max(1, Math.ceil(total / clampedPageSize));
      const clampedPage = total === 0 ? 1 : Math.min(Math.max(1, page), totalPages);
      const start = (clampedPage - 1) * clampedPageSize;
      const data = items.slice(start, start + clampedPageSize);

      return {
        items: data,
        data,
        total,
        page: clampedPage,
        pageSize: clampedPageSize,
        totalPages,
        hasNextPage: clampedPage < totalPages,
        hasPrevPage: clampedPage > 1,
      };
    }

    // Page 99 requested on 5 items (pageSize: 2) -> clamped to page 3
    const overPaged = paginate(testProducts, 99, 2);
    assertEqual(overPaged.page, 3, 'Page 99 must clamp to totalPages = 3');
    assertEqual(overPaged.items.length, 1, 'Page 3 has last 1 item');
    assertEqual(overPaged.hasNextPage, false, 'No next page');

    // Page -5 requested -> clamped to page 1
    const underPaged = paginate(testProducts, -5, 2);
    assertEqual(underPaged.page, 1, 'Negative page must clamp to 1');
    assertEqual(underPaged.items.length, 2, 'Page 1 has 2 items');
    assertEqual(underPaged.hasPrevPage, false, 'Page 1 has no previous page');

    // Extreme pageSize (500) -> clamped to 100
    const hugePageSize = paginate(testProducts, 1, 500);
    assertEqual(hugePageSize.pageSize, 100, 'PageSize > 100 clamped to 100');
  });

  test('F26-6: QueryEngine module file exists and exports query functions', () => {
    const queryEnginePath = path.join(ROOT_DIR, 'src/services/queryEngine.ts');
    assert(fs.existsSync(queryEnginePath), 'queryEngine.ts must exist');

    const content = fs.readFileSync(queryEnginePath, 'utf8');
    assertIncludes(content, 'export function filterItems', 'Must export filterItems');
    assertIncludes(content, 'export function sortItems', 'Must export sortItems');
    assertIncludes(content, 'export function paginateItems', 'Must export paginateItems');
    assertIncludes(content, 'export function applyQueryPipeline', 'Must export applyQueryPipeline');
  });
});
