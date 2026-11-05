#!/usr/bin/env node
/**
 * Empirical Adversarial Challenger Stress Harness for Milestone 3 Iteration 2
 * Focus: LocalStorageRepository cross-tab sync, cache invalidation, and DalApiError contract on missing ID update.
 */

import { createServer } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failureDetails = [];

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    failedTests++;
    failureDetails.push(message);
    console.error(`  ✖ FAIL: ${message}`);
  } else {
    passedTests++;
    console.log(`  ✔ PASS: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  totalTests++;
  if (actual !== expected) {
    const detail = `${message} | Expected: ${JSON.stringify(expected)}, Actual: ${JSON.stringify(actual)}`;
    failedTests++;
    failureDetails.push(detail);
    console.error(`  ✖ FAIL: ${detail}`);
  } else {
    passedTests++;
    console.log(`  ✔ PASS: ${message}`);
  }
}

// Mock LocalStorage
class MockLocalStorage {
  constructor() {
    this._map = new Map();
  }
  get length() {
    return this._map.size;
  }
  key(index) {
    return Array.from(this._map.keys())[index] ?? null;
  }
  getItem(key) {
    return this._map.has(String(key)) ? this._map.get(String(key)) : null;
  }
  setItem(key, value) {
    this._map.set(String(key), String(value));
  }
  removeItem(key) {
    this._map.delete(String(key));
  }
  clear() {
    this._map.clear();
  }
}

// Mock Window with StorageEvent support
class MockWindow {
  constructor() {
    this.listeners = new Map();
  }
  addEventListener(type, cb) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(cb);
  }
  removeEventListener(type, cb) {
    if (!this.listeners.has(type)) return;
    this.listeners.set(type, this.listeners.get(type).filter((l) => l !== cb));
  }
  dispatchEvent(event) {
    const list = this.listeners.get(event.type) || [];
    for (const l of list) l(event);
    return true;
  }
}

const mockStorage = new MockLocalStorage();
const mockWindow = new MockWindow();
mockWindow.localStorage = mockStorage;

globalThis.window = mockWindow;
globalThis.localStorage = mockStorage;

globalThis.StorageEvent = class StorageEvent {
  constructor(type, init = {}) {
    this.type = type;
    this.key = init.key ?? null;
    this.oldValue = init.oldValue ?? null;
    this.newValue = init.newValue ?? null;
    this.url = init.url ?? 'http://localhost';
    this.storageArea = init.storageArea ?? mockStorage;
  }
};

globalThis.CustomEvent = class CustomEvent {
  constructor(type, opts = {}) {
    this.type = type;
    this.detail = opts.detail || null;
  }
};

globalThis.Event = class Event {
  constructor(type) {
    this.type = type;
  }
};

async function runAdversarialStressSuite() {
  console.log('======================================================================');
  console.log('  CHALLENGER M3 IT2: ADVERSARIAL EMPIRICAL STRESS TEST HARNESS        ');
  console.log('======================================================================\n');

  const viteServer = await createServer({
    root: ROOT_DIR,
    server: { middlewareMode: true },
    appType: 'custom',
  });

  try {
    const dalModule = await viteServer.ssrLoadModule('/src/types/dal.ts');
    const { DalApiError } = dalModule;

    const repoModule = await viteServer.ssrLoadModule('/src/services/mock/LocalStorageRepository.ts');
    const { LocalStorageRepository } = repoModule;

    const latencyModule = await viteServer.ssrLoadModule('/src/services/mock/mockLatency.ts');
    // Set 0 delay for fast stress testing
    if (latencyModule.setMockDelayRange) {
      latencyModule.setMockDelayRange(0, 0);
    }

    // -------------------------------------------------------------------------
    // SUITE 1: CROSS-TAB CACHE INVALIDATION & SYNC STRESS
    // -------------------------------------------------------------------------
    console.log('--- SUITE 1: CROSS-TAB CACHE INVALIDATION & SYNC ---');

    const STORAGE_KEY_1 = 'd2c_ecommerce:crosstab_test:v1';
    const initialSeed = [
      { id: 'item-1', name: 'Item One', price: 100 },
      { id: 'item-2', name: 'Item Two', price: 200 },
      { id: 'item-3', name: 'Item Three', price: 300 },
    ];

    mockStorage.clear();
    const repo1 = new LocalStorageRepository(STORAGE_KEY_1, initialSeed);

    // Initial check: seeds hydrated
    let records = await repo1.getAll();
    assertEqual(records.total, 3, 'Initial repo1 contains 3 seeded items');

    // Test 1.1: Cross-tab key removal (e.newValue === null)
    mockStorage.removeItem(STORAGE_KEY_1);
    mockWindow.dispatchEvent(
      new StorageEvent('storage', {
        key: STORAGE_KEY_1,
        oldValue: JSON.stringify(initialSeed),
        newValue: null,
      })
    );

    records = await repo1.getAll();
    assertEqual(records.total, 0, 'Cross-tab removal (newValue: null) empties repo cache');
    assertEqual(await repo1.count(), 0, 'repo.count() returns 0 after cross-tab removal');
    assertEqual(await repo1.getById('item-1'), null, 'getById(item-1) returns null after cross-tab removal');

    // Test 1.2: Cross-tab total localStorage.clear() (e.key === null)
    // First, restore data by re-persisting
    await repo1.create({ id: 'item-fresh', name: 'Fresh Item', price: 500 });
    assertEqual(await repo1.count(), 1, 'Repo has 1 newly created item');

    // Simulate another tab running localStorage.clear()
    mockStorage.clear();
    mockWindow.dispatchEvent(
      new StorageEvent('storage', {
        key: null,
        oldValue: null,
        newValue: null,
      })
    );

    records = await repo1.getAll();
    assertEqual(records.total, 0, 'Cross-tab clear() (key: null) empties repo cache');
    assertEqual(await repo1.count(), 0, 'repo.count() returns 0 after cross-tab clear()');
    assertEqual(await repo1.getById('item-fresh'), null, 'getById returns null after cross-tab clear()');

    // Test 1.3: Cross-tab update with new external records
    const externalRecords = [
      { id: 'ext-1', name: 'External One', price: 999 },
      { id: 'ext-2', name: 'External Two', price: 888 },
    ];
    mockStorage.setItem(STORAGE_KEY_1, JSON.stringify(externalRecords));
    mockWindow.dispatchEvent(
      new StorageEvent('storage', {
        key: STORAGE_KEY_1,
        oldValue: null,
        newValue: JSON.stringify(externalRecords),
      })
    );

    records = await repo1.getAll();
    assertEqual(records.total, 2, 'Cross-tab update replaces cache with external records');
    const extItem1 = await repo1.getById('ext-1');
    assert(extItem1 !== null, 'External record ext-1 is retrievable');
    assertEqual(extItem1?.name, 'External One', 'External record ext-1 has correct name');

    // Test 1.4: Cross-tab empty string newValue ("")
    mockWindow.dispatchEvent(
      new StorageEvent('storage', {
        key: STORAGE_KEY_1,
        newValue: '',
      })
    );
    records = await repo1.getAll();
    assertEqual(records.total, 0, 'Cross-tab empty string (newValue: "") empties repo cache');

    // Test 1.5: Cross-tab malformed JSON resilience
    // Reset to 2 records first
    mockStorage.setItem(STORAGE_KEY_1, JSON.stringify(externalRecords));
    mockWindow.dispatchEvent(
      new StorageEvent('storage', {
        key: STORAGE_KEY_1,
        newValue: JSON.stringify(externalRecords),
      })
    );
    assertEqual((await repo1.getAll()).total, 2, 'Reset to 2 records before malformed test');

    // Fire malformed JSON event
    mockWindow.dispatchEvent(
      new StorageEvent('storage', {
        key: STORAGE_KEY_1,
        newValue: '{{{ INVALID JSON CORRUPTED',
      })
    );
    // Should NOT crash and preserve previous cache
    const resilientRecords = await repo1.getAll();
    assertEqual(resilientRecords.total, 2, 'Malformed JSON in cross-tab event is caught gracefully without crash');

    // Test 1.6: Unrelated storage key isolation
    mockWindow.dispatchEvent(
      new StorageEvent('storage', {
        key: 'd2c_ecommerce:other_unrelated_key:v1',
        newValue: null,
      })
    );
    const isolatedRecords = await repo1.getAll();
    assertEqual(isolatedRecords.total, 2, 'Unrelated key deletion does not affect repo1 cache');

    // -------------------------------------------------------------------------
    // SUITE 2: UPDATE() NON-EXISTENT ID & TYPED DalApiError(404)
    // -------------------------------------------------------------------------
    console.log('\n--- SUITE 2: UPDATE() NON-EXISTENT ID & DalApiError(404) ---');

    const STORAGE_KEY_2 = 'd2c_ecommerce:update_error_test:v1';
    const repo2 = new LocalStorageRepository(STORAGE_KEY_2, [
      { id: 'valid-id-1', name: 'Valid Product', price: 100 },
    ]);

    // Test 2.1: Canonical non-existent ID
    let errorCaught = null;
    try {
      await repo2.update('non-existent-id-404', { name: 'Attempted Update' });
    } catch (err) {
      errorCaught = err;
    }

    assert(errorCaught !== null, 'update() with non-existent ID threw an error');
    assert(errorCaught instanceof DalApiError, 'Threw error is an instance of DalApiError');
    assertEqual(errorCaught.name, 'DalApiError', 'Error name is DalApiError');
    assertEqual(errorCaught.statusCode, 404, 'statusCode is strictly 404');
    assertEqual(errorCaught.status, 404, 'status getter returns strictly 404');
    assertEqual(errorCaught.code, 'RECORD_NOT_FOUND', 'code is RECORD_NOT_FOUND');
    assert(
      errorCaught.message.includes('was not found in'),
      `Error message contains "was not found in": "${errorCaught?.message}"`
    );
    assert(
      errorCaught.message.includes('non-existent-id-404'),
      `Error message contains requested ID: "${errorCaught?.message}"`
    );
    assert(
      errorCaught.message.includes(STORAGE_KEY_2),
      `Error message contains storageKey: "${errorCaught?.message}"`
    );
    assert(typeof errorCaught.timestamp === 'string', 'Error has ISO timestamp string');

    // Test 2.2: Adversarial / Fuzzing Non-Existent IDs
    const fuzzMissingIds = [
      '',
      '   ',
      '__proto__',
      'constructor',
      'null',
      'undefined',
      '<script>alert("xss")</script>',
      "' OR '1'='1",
      '!@#$%^&*()_+',
      'sản_phẩm_không_tồn_tại_123',
    ];

    for (const badId of fuzzMissingIds) {
      let fuzzErr = null;
      try {
        await repo2.update(badId, { name: 'Fuzz Update' });
      } catch (err) {
        fuzzErr = err;
      }
      assert(fuzzErr !== null, `update() throws on bad/fuzz ID: "${badId}"`);
      assert(fuzzErr instanceof DalApiError, `fuzz error for "${badId}" is DalApiError`);
      assertEqual(fuzzErr?.status, 404, `fuzz error status is 404 for "${badId}"`);
      assertEqual(fuzzErr?.code, 'RECORD_NOT_FOUND', `fuzz error code is RECORD_NOT_FOUND for "${badId}"`);
    }

    // Test 2.3: Existing record update does NOT throw, updates properly
    const updatedRecord = await repo2.update('valid-id-1', { price: 250 });
    assertEqual(updatedRecord.price, 250, 'Existing record update succeeds with new price 250');
    assertEqual(updatedRecord.name, 'Valid Product', 'Existing record update retains untouched fields');

    // Test 2.4: ID Immutability on Valid Update
    const hijackAttempt = await repo2.update('valid-id-1', {
      id: 'hijacked-new-id',
      price: 350,
    });
    assertEqual(hijackAttempt.id, 'valid-id-1', 'Target ID remains immutable despite attempted override');
    const checkById = await repo2.getById('valid-id-1');
    assertEqual(checkById?.id, 'valid-id-1', 'Persisted ID in storage remains valid-id-1');
    const checkHijacked = await repo2.getById('hijacked-new-id');
    assertEqual(checkHijacked, null, 'getById("hijacked-new-id") returns null');

    // Test 2.5: Deep clone immutability of returned records
    const retrieved = await repo2.getById('valid-id-1');
    if (retrieved) {
      retrieved.name = 'DIRTY_MUTATION';
    }
    const retrievedAgain = await repo2.getById('valid-id-1');
    assertEqual(
      retrievedAgain?.name,
      'Valid Product',
      'Direct in-memory mutation of returned record does NOT pollute internal cache'
    );

    // -------------------------------------------------------------------------
    // SUITE 3: CONCURRENCY & RACE CONDITIONS STRESS
    // -------------------------------------------------------------------------
    console.log('\n--- SUITE 3: CONCURRENCY & RACE CONDITIONS ---');

    const STORAGE_KEY_3 = 'd2c_ecommerce:concurrency_test:v1';
    const repo3 = new LocalStorageRepository(STORAGE_KEY_3, []);

    // Create 30 items concurrently
    const createPromises = Array.from({ length: 30 }, (_, i) =>
      repo3.create({ id: `concurrent-${i}`, name: `Concurrent Item ${i}`, price: i * 10 })
    );
    const createdItems = await Promise.all(createPromises);
    assertEqual(createdItems.length, 30, 'All 30 items created concurrently');
    assertEqual(await repo3.count(), 30, 'Repo count reflects all 30 items');

    // Interleave 25 valid updates and 25 non-existent updates concurrently
    const mixedOperations = [];
    for (let i = 0; i < 25; i++) {
      mixedOperations.push(repo3.update(`concurrent-${i}`, { price: 999 }));
      mixedOperations.push(repo3.update(`phantom-id-${i}`, { price: 999 }));
    }

    const settled = await Promise.allSettled(mixedOperations);
    const fulfilled = settled.filter((s) => s.status === 'fulfilled');
    const rejected = settled.filter((s) => s.status === 'rejected');

    assertEqual(fulfilled.length, 25, 'Exactly 25 valid updates fulfilled');
    assertEqual(rejected.length, 25, 'Exactly 25 invalid updates rejected');

    for (const r of rejected) {
      const reason = r.reason;
      assert(reason instanceof DalApiError, 'Rejected update reason is DalApiError');
      assertEqual(reason.status, 404, 'Rejected update status is 404');
    }

    // Rapid cross-tab storage events interleaved with concurrent reads
    let rapidEventErrors = 0;
    const rapidOperations = [];
    for (let i = 0; i < 20; i++) {
      rapidOperations.push(repo3.getAll());
      mockWindow.dispatchEvent(
        new StorageEvent('storage', {
          key: STORAGE_KEY_3,
          newValue: JSON.stringify([{ id: `rapid-${i}`, name: `Rapid ${i}` }]),
        })
      );
      rapidOperations.push(repo3.getById(`rapid-${i}`));
    }
    try {
      await Promise.all(rapidOperations);
    } catch (err) {
      rapidEventErrors++;
    }
    assertEqual(rapidEventErrors, 0, 'Rapid alternating storage events and reads produced 0 uncaught errors');

    console.log('\n======================================================================');
    console.log(`TOTAL STRESS CHECKS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
    console.log('======================================================================\n');

    await viteServer.close();
    return failedTests === 0;
  } catch (error) {
    console.error('Fatal Stress Suite Error:', error);
    await viteServer.close();
    return false;
  }
}

runAdversarialStressSuite().then((success) => {
  process.exit(success ? 0 : 1);
});
