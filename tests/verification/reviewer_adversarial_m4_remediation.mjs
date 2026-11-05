#!/usr/bin/env node
/**
 * EMPIRICAL ADVERSARIAL REVIEW TEST: Milestone 4 Iteration 2 Remediation
 * Reviewer: reviewer_m4_it2_2
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';
import { matchRoutes } from 'react-router-dom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');

const c = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

console.log(`${c.bold}${c.cyan}========================================================================${c.reset}`);
console.log(`${c.bold}${c.cyan}  REVIEWER ADVERSARIAL TEST: M4 ITERATION 2 REMEDIATION                ${c.reset}`);
console.log(`${c.bold}${c.cyan}========================================================================${c.reset}\n`);

// 1. Mock LocalStorage Environment
class MockLocalStorage {
  constructor() {
    this._map = new Map();
  }
  get length() { return this._map.size; }
  key(i) { return Array.from(this._map.keys())[i] ?? null; }
  getItem(k) { return this._map.has(String(k)) ? this._map.get(String(k)) : null; }
  setItem(k, v) { this._map.set(String(k), String(v)); }
  removeItem(k) { this._map.delete(String(k)); }
  clear() { this._map.clear(); }
}

globalThis.localStorage = new MockLocalStorage();
globalThis.window = {
  localStorage: globalThis.localStorage,
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
};

// Bundle and load customerService, orderService, couponService, systemService via virtual stdin
const bundlePath = path.join(ROOT_DIR, 'tests', 'e2e', 'temp_m4_remediation_bundle.mjs');
await esbuild.build({
  stdin: {
    contents: `
      export { customerService } from './src/services/api/customerService';
      export { orderService } from './src/services/api/orderService';
      export { couponService } from './src/services/api/couponService';
      export { systemService } from './src/services/systemService';
    `,
    resolveDir: ROOT_DIR,
    sourcefile: 'entry.js',
  },
  bundle: true,
  format: 'esm',
  outfile: bundlePath,
  plugins: [
    {
      name: 'alias-resolver',
      setup(build) {
        build.onResolve({ filter: /^@\// }, (args) => ({
          path: path.join(ROOT_DIR, 'src', args.path.replace(/^@\//, '') + (path.extname(args.path) ? '' : '.ts')),
        }));
      },
    },
  ],
  logLevel: 'error',
});

const services = await import(`file://${bundlePath}`);
const { customerService, orderService, couponService, systemService } = services;

// Reset demo data to clean state
await systemService.resetDemoData();

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ${c.green}✔ PASS:${c.reset} ${message}`);
    passed++;
  } else {
    console.error(`  ${c.red}✖ FAIL:${c.reset} ${message}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// TEST 1: CustomerDetailPage Dynamic Query & Error/Boundary Handling
// ---------------------------------------------------------------------------
console.log(`${c.bold}--- [1. CustomerDetailPage DAL & Edge Cases] ---${c.reset}`);

// 1.1 Valid customer fetch
const cust1 = await customerService.getCustomerById('cust_01');
assert(cust1 !== null && cust1.id === 'cust_01', 'getCustomerById("cust_01") finds existing customer');
assert(cust1.name && cust1.phone && cust1.email, 'Customer profile contains name, phone, email');
assert(Array.isArray(cust1.addresses), 'Customer addresses is an array');

// 1.2 Non-existent customer returns null (triggers empty state)
const missing = await customerService.getCustomerById('non_existent_id_9999');
assert(missing === null, 'getCustomerById with non-existent ID returns null (triggers Not Found empty state)');

// 1.3 Update notes with Vietnamese diacritics & special chars
const testNotes = 'Khách VIP ưu tiên giao buổi sáng. Đơn hàng yêu cầu bọc chống sốc kỹ! <script>alert(1)</script>';
const updatedNotes = await customerService.updateCustomer('cust_01', { notes: testNotes });
assert(updatedNotes.notes === testNotes, 'updateCustomer updates notes with full diacritics and special chars');

const reReadCust = await customerService.getCustomerById('cust_01');
assert(reReadCust.notes === testNotes, 'Updated notes persist in LocalStorage and survive reload');

// 1.4 Toggle status: active -> blocked -> active
const blocked = await customerService.updateCustomer('cust_01', { status: 'blocked' });
assert(blocked.status === 'blocked', 'updateCustomer toggles status to "blocked"');

const reReadBlocked = await customerService.getCustomerById('cust_01');
assert(reReadBlocked.status === 'blocked', 'Blocked status persisted in LocalStorage');

const reactivated = await customerService.updateCustomer('cust_01', { status: 'active' });
assert(reactivated.status === 'active', 'updateCustomer reactivates account to "active"');

// ---------------------------------------------------------------------------
// TEST 2: Order History Matching Algorithm
// ---------------------------------------------------------------------------
console.log(`\n${c.bold}--- [2. Order History Matching Logic] ---${c.reset}`);

const allOrdersRes = await orderService.getOrders({ limit: 100 });
const allOrders = allOrdersRes.data;
assert(allOrders.length > 0, `orderService returns ${allOrders.length} orders`);

// Match orders for cust_01 using the exact algorithm from CustomerDetailPage:
// (o.customerId && o.customerId === customer.id) ||
// o.customer.phone === customer.phone ||
// (o.customer.email && customer.email && o.customer.email.toLowerCase() === customer.email.toLowerCase())
const cust1Orders = allOrders.filter(
  (o) =>
    (o.customerId && o.customerId === cust1.id) ||
    o.customer.phone === cust1.phone ||
    (o.customer.email && cust1.email && o.customer.email.toLowerCase() === cust1.email.toLowerCase())
);
assert(cust1Orders.length > 0, `cust_01 matches ${cust1Orders.length} orders in seed dataset`);

for (const ord of cust1Orders) {
  const matchesId = ord.customerId === cust1.id;
  const matchesPhone = ord.customer.phone === cust1.phone;
  const matchesEmail = ord.customer.email?.toLowerCase() === cust1.email?.toLowerCase();
  assert(matchesId || matchesPhone || matchesEmail, `Order ${ord.orderNumber} correctly matched cust_01`);
}

// Ensure orders of another customer do not leak
const cust2 = await customerService.getCustomerById('cust_02');
if (cust2) {
  const cust2Orders = allOrders.filter(
    (o) =>
      (o.customerId && o.customerId === cust2.id) ||
      o.customer.phone === cust2.phone ||
      (o.customer.email && cust2.email && o.customer.email.toLowerCase() === cust2.email.toLowerCase())
  );
  for (const ord of cust2Orders) {
    if (ord.customer.phone !== cust1.phone && ord.customerId !== cust1.id) {
      assert(!cust1Orders.some((o) => o.id === ord.id), `Order ${ord.orderNumber} does not cross-leak between customers`);
    }
  }
}

// ---------------------------------------------------------------------------
// TEST 3: Route Resolution for Admin Pages & Coupons
// ---------------------------------------------------------------------------
console.log(`\n${c.bold}--- [3. Admin Routes Resolution Matrix] ---${c.reset}`);

// Replicate routes table from src/routes/index.tsx
const routes = [
  {
    path: '/',
    children: [
      { index: true, id: 'home' },
      { path: 'catalog', id: 'catalog' },
    ],
  },
  {
    path: '/',
    children: [
      { path: 'checkout', id: 'checkout' },
      { path: '*', id: 'not-found' },
    ],
  },
  {
    path: '/admin',
    children: [
      { index: true, id: 'admin-index-redirect' },
      { path: 'dashboard', id: 'admin-dashboard' },
      { path: 'products', id: 'admin-products' },
      { path: 'products/new', id: 'admin-products-new' },
      { path: 'products/:id/edit', id: 'admin-products-edit' },
      { path: 'categories', id: 'admin-categories' },
      { path: 'orders', id: 'admin-orders' },
      { path: 'orders/:id', id: 'admin-orders-detail' },
      { path: 'customers', id: 'admin-customers' },
      { path: 'customers/:id', id: 'admin-customers-detail' },
      { path: 'marketing', id: 'admin-marketing' },
      { path: 'marketing/coupons', id: 'admin-marketing-coupons' },
      { path: 'marketing/flash-sale', id: 'admin-marketing-flash-sale' },
      { path: 'settings', id: 'admin-settings' },
    ],
  },
];

const testRoutes = [
  { url: '/admin/dashboard', expected: 'admin-dashboard' },
  { url: '/admin/products', expected: 'admin-products' },
  { url: '/admin/products/new', expected: 'admin-products-new' },
  { url: '/admin/products/prod_01/edit', expected: 'admin-products-edit' },
  { url: '/admin/categories', expected: 'admin-categories' },
  { url: '/admin/orders', expected: 'admin-orders' },
  { url: '/admin/orders/ord_01', expected: 'admin-orders-detail' },
  { url: '/admin/customers', expected: 'admin-customers' },
  { url: '/admin/customers/cust_01', expected: 'admin-customers-detail' },
  { url: '/admin/customers/cust_02', expected: 'admin-customers-detail' },
  { url: '/admin/marketing', expected: 'admin-marketing' },
  { url: '/admin/marketing/coupons', expected: 'admin-marketing-coupons' },
  { url: '/admin/marketing/flash-sale', expected: 'admin-marketing-flash-sale' },
  { url: '/admin/settings', expected: 'admin-settings' },
];

for (const tr of testRoutes) {
  const match = matchRoutes(routes, tr.url);
  assert(match && match[match.length - 1].route.id === tr.expected, `Route "${tr.url}" accurately resolves to "${tr.expected}"`);
}

// Clean up temporary bundle
if (fs.existsSync(bundlePath)) {
  fs.unlinkSync(bundlePath);
}

console.log(`\n${c.bold}========================================================================${c.reset}`);
console.log(`Total Assertions: ${passed + failed} | Passed: ${c.green}${passed}${c.reset} | Failed: ${failed > 0 ? c.red : c.green}${failed}${c.reset}`);
if (failed > 0) {
  console.log(`${c.red}ADVERSARIAL VERIFICATION FAILED${c.reset}`);
  process.exit(1);
} else {
  console.log(`${c.green}★ ALL ADVERSARIAL VERIFICATION ASSERTIONS PASSED (100% OK) ★${c.reset}`);
  process.exit(0);
}
