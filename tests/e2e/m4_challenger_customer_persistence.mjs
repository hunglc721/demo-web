#!/usr/bin/env node
/**
 * EMPIRICAL ADVERSARIAL VERIFICATION SCRIPT: Customer Update Persistence Across Reloads
 * 
 * Target: CustomerDetailPage & customerService persistence across simulated browser reloads.
 * Verifies:
 * 1. Updating notes in CustomerDetailPage persists to LocalStorage and survives browser reload simulation.
 * 2. Toggling status (active / blocked) persists to LocalStorage and survives browser reload simulation.
 * 3. Bidirectional toggle (active -> blocked -> active) persistence.
 * 4. Multi-update consistency: notes and status updated independently and together.
 * 5. Isolation: Updating customer A does not affect customer B across reloads.
 * 6. Special character / multi-line notes persistence (Vietnamese diacritics, unicode, newlines).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');

// Terminal colors
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
};

// In-Memory Mock Browser LocalStorage & Window
class MockLocalStorage {
  constructor() {
    this._map = new Map();
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
  get length() {
    return this._map.size;
  }
  key(i) {
    return Array.from(this._map.keys())[i] || null;
  }
}

const mockStorage = new MockLocalStorage();
globalThis.window = {
  localStorage: mockStorage,
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
};
globalThis.localStorage = mockStorage;

// Dynamic bundler helper
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
    `temp_crm_persist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.mjs`
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
    external: ['react', 'react-dom', 'zustand', 'lucide-react', 'react-router-dom'],
  });

  const fileUrl = new URL(`file://${tempBundle.replace(/\\/g, '/')}`);
  return await import(fileUrl.href);
}

// Harness
let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;

function assert(condition, message) {
  totalAssertions++;
  if (!condition) {
    failedAssertions++;
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
    failedAssertions++;
    console.log(`  ${c.red}✖ FAIL: ${message} (Expected: ${JSON.stringify(expected)}, Got: ${JSON.stringify(actual)})${c.reset}`);
    throw new Error(`${message}: ${actual} !== ${expected}`);
  } else {
    passedAssertions++;
    console.log(`  ${c.green}✔ PASS: ${message}${c.reset}`);
  }
}

async function run() {
  console.log(`${c.bold}${c.cyan}========================================================================${c.reset}`);
  console.log(`${c.bold}${c.cyan}  EMPIRICAL CHALLENGER: CUSTOMER UPDATE PERSISTENCE ACROSS RELOADS      ${c.reset}`);
  console.log(`${c.bold}${c.cyan}========================================================================${c.reset}\n`);

  const customerMod = await bundleAndImport('src/services/api/customerService.ts');
  const storageKeysMod = await bundleAndImport('src/services/storage/storageKeys.ts');
  const { CustomerService, customerService } = customerMod;
  const { STORAGE_KEYS } = storageKeysMod;

  const targetId = 'cust_01';

  // -------------------------------------------------------------------------
  // STEP 1: Verify Initial Seed State
  // -------------------------------------------------------------------------
  console.log(`${c.yellow}--- [STEP 1] Baseline Customer Profile Inspection ---${c.reset}`);
  const initialCust = await customerService.getCustomerById(targetId);
  assert(initialCust !== null, 'Customer cust_01 exists in database');
  assertEqual(initialCust.id, targetId, 'Customer ID strictly matches target');
  assertEqual(initialCust.status, 'active', 'Initial status is active');
  assert(typeof initialCust.totalOrders === 'number', 'totalOrders is numeric');
  assert(typeof initialCust.totalSpend === 'number', 'totalSpend is numeric');

  // Verify that LocalStorage now contains serialized customers
  const initialRaw = mockStorage.getItem(STORAGE_KEYS.CUSTOMERS);
  assert(initialRaw !== null, 'LocalStorage has STORAGE_KEYS.CUSTOMERS seeded');
  const initialList = JSON.parse(initialRaw);
  assert(Array.isArray(initialList) && initialList.length >= 10, 'Seed contains at least 10 customers');

  // -------------------------------------------------------------------------
  // STEP 2: Note Update & LocalStorage Verification
  // -------------------------------------------------------------------------
  console.log(`\n${c.yellow}--- [STEP 2] Note Update & Raw Storage Inspection ---${c.reset}`);
  const sampleNote = 'VIP: Ưu tiên giao buổi sáng. Hàng dễ vỡ, xin đóng 2 lớp bóng khí.';
  const updateResult = await customerService.updateCustomer(targetId, { notes: sampleNote });
  assertEqual(updateResult.notes, sampleNote, 'updateCustomer returns updated note in returned object');

  // Check raw LocalStorage directly
  const rawAfterNotes = JSON.parse(mockStorage.getItem(STORAGE_KEYS.CUSTOMERS));
  const recordAfterNotes = rawAfterNotes.find((c) => c.id === targetId);
  assert(recordAfterNotes !== undefined, 'Customer found in raw LocalStorage');
  assertEqual(recordAfterNotes.notes, sampleNote, 'Raw LocalStorage stores updated notes immediately');

  // -------------------------------------------------------------------------
  // STEP 3: Reload Simulation 1 (Notes Persistence)
  // -------------------------------------------------------------------------
  console.log(`\n${c.yellow}--- [STEP 3] Reload Simulation 1: Reconstruct Service from LocalStorage ---${c.reset}`);
  // In a browser reload, runtime memory is wiped, and new CustomerService reads from localStorage
  const reloadedService1 = new CustomerService();
  const loadedCust1 = await reloadedService1.getCustomerById(targetId);
  assert(loadedCust1 !== null, 'Customer retrieved after reload');
  assertEqual(loadedCust1.notes, sampleNote, 'Saved notes persist intact after full reload simulation');
  assertEqual(loadedCust1.status, 'active', 'Status remains active after notes-only update');

  // -------------------------------------------------------------------------
  // STEP 4: Status Toggle to "blocked" & Persistence Across Reload
  // -------------------------------------------------------------------------
  console.log(`\n${c.yellow}--- [STEP 4] Status Toggle: "active" -> "blocked" Across Reload ---${c.reset}`);
  const toggleResult1 = await reloadedService1.updateCustomer(targetId, { status: 'blocked' });
  assertEqual(toggleResult1.status, 'blocked', 'updateCustomer toggles status to blocked');

  // Verify in raw LocalStorage
  const rawAfterBlocked = JSON.parse(mockStorage.getItem(STORAGE_KEYS.CUSTOMERS));
  const recordAfterBlocked = rawAfterBlocked.find((c) => c.id === targetId);
  assertEqual(recordAfterBlocked.status, 'blocked', 'Raw LocalStorage stores "blocked" status');
  assertEqual(recordAfterBlocked.notes, sampleNote, 'Notes still preserved when toggling status');

  // Reload Simulation 2
  const reloadedService2 = new CustomerService();
  const loadedCust2 = await reloadedService2.getCustomerById(targetId);
  assertEqual(loadedCust2.status, 'blocked', 'Blocked status persists across reload');
  assertEqual(loadedCust2.notes, sampleNote, 'Notes persist alongside blocked status across reload');

  // -------------------------------------------------------------------------
  // STEP 5: Status Re-activation to "active" & Persistence Across Reload
  // -------------------------------------------------------------------------
  console.log(`\n${c.yellow}--- [STEP 5] Status Re-activation: "blocked" -> "active" Across Reload ---${c.reset}`);
  const toggleResult2 = await reloadedService2.updateCustomer(targetId, { status: 'active' });
  assertEqual(toggleResult2.status, 'active', 'updateCustomer toggles status back to active');

  // Reload Simulation 3
  const reloadedService3 = new CustomerService();
  const loadedCust3 = await reloadedService3.getCustomerById(targetId);
  assertEqual(loadedCust3.status, 'active', 'Reactivated "active" status persists across reload');

  // -------------------------------------------------------------------------
  // STEP 6: Vietnamese Diacritics, Emojis & Multi-Line Notes
  // -------------------------------------------------------------------------
  console.log(`\n${c.yellow}--- [STEP 6] Complex Multi-Line Notes with Accents & Emojis ---${c.reset}`);
  const complexNotes = `⭐ Khách hàng kim cương VIP Gold.
- Thói quen: Mua thời trang nam phong cách tối giản.
- Địa chỉ nhận hàng quen thuộc: Toà Landmark 81, P. 22, Q. Bình Thạnh, TP. Hồ Chí Minh.
- MST công ty: 0312345678 - Công ty TNHH Giải Pháp Công Nghệ D2C.
- Lưu ý shipper: "Giao lễ tân tầng trệt nếu không gọi được".`;

  await reloadedService3.updateCustomer(targetId, { notes: complexNotes });

  // Reload Simulation 4
  const reloadedService4 = new CustomerService();
  const loadedCust4 = await reloadedService4.getCustomerById(targetId);
  assertEqual(loadedCust4.notes, complexNotes, 'Multi-line accented Vietnamese notes with quotes and emojis persist perfectly');

  // -------------------------------------------------------------------------
  // STEP 7: Customer Isolation (Multiple Customers Updated)
  // -------------------------------------------------------------------------
  console.log(`\n${c.yellow}--- [STEP 7] Multi-Customer Modification Isolation Across Reload ---${c.reset}`);
  const targetId2 = 'cust_02';
  const cust2Notes = 'Khách sỉ chiết khấu 15%. Liên hệ qua Zalo.';
  await reloadedService4.updateCustomer(targetId2, { notes: cust2Notes, status: 'blocked' });

  // Reload Simulation 5
  const reloadedService5 = new CustomerService();
  const loadedC1 = await reloadedService5.getCustomerById(targetId);
  const loadedC2 = await reloadedService5.getCustomerById(targetId2);

  assertEqual(loadedC1.notes, complexNotes, 'Customer 1 notes unaffected by Customer 2 updates');
  assertEqual(loadedC1.status, 'active', 'Customer 1 status unaffected by Customer 2 updates');
  assertEqual(loadedC2.notes, cust2Notes, 'Customer 2 notes persisted accurately');
  assertEqual(loadedC2.status, 'blocked', 'Customer 2 blocked status persisted accurately');

  // -------------------------------------------------------------------------
  // STEP 8: Empty / Cleared Notes Persistence
  // -------------------------------------------------------------------------
  console.log(`\n${c.yellow}--- [STEP 8] Cleared Note Persistence ---${c.reset}`);
  await reloadedService5.updateCustomer(targetId, { notes: '' });

  // Reload Simulation 6
  const reloadedService6 = new CustomerService();
  const loadedCust6 = await reloadedService6.getCustomerById(targetId);
  assertEqual(loadedCust6.notes, '', 'Cleared empty note persists across reload');

  // -------------------------------------------------------------------------
  // FINAL SUMMARY
  // -------------------------------------------------------------------------
  console.log(`\n${c.bold}${c.cyan}========================================================================${c.reset}`);
  console.log(`${c.bold}${c.cyan}  CUSTOMER PERSISTENCE VERIFICATION COMPLETED                           ${c.reset}`);
  console.log(`${c.bold}${c.cyan}========================================================================${c.reset}`);
  console.log(`  Total Assertions: ${totalAssertions}`);
  console.log(`  Passed:           ${c.green}${passedAssertions}${c.reset}`);
  console.log(`  Failed:           ${failedAssertions === 0 ? c.green + '0' : c.red + failedAssertions}${c.reset}`);
  console.log(`\n${c.bold}${c.green}★ ALL CUSTOMER PERSISTENCE TESTS PASSED EMPIRICALLY (100% OK) ★${c.reset}\n`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
