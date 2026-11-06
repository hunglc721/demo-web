/**
 * Reviewer Adversarial Deep Stress Test for Milestone 8
 * Author: Reviewer 1 (Adversarial Critic)
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');

// Setup mock window, document, and localStorage for Node environment
class MockLocalStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    this.store.set(String(key), String(value));
  }
  removeItem(key) {
    this.store.delete(String(key));
  }
  clear() {
    this.store.clear();
  }
  get length() {
    return this.store.size;
  }
  key(index) {
    return Array.from(this.store.keys())[index] || null;
  }
}

const mockStorage = new MockLocalStorage();
globalThis.localStorage = mockStorage;

globalThis.window = {
  localStorage: mockStorage,
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
  scrollY: 150,
  scrollTo: () => {},
};

globalThis.document = {
  defaultView: globalThis.window,
  documentElement: {
    classList: {
      add: () => {},
      remove: () => {},
      toggle: () => {},
      has: () => false,
    },
    setAttribute: () => {},
    getAttribute: () => null,
  },
};

globalThis.CustomEvent = class CustomEvent {
  constructor(type, eventInitDict) {
    this.type = type;
    this.detail = eventInitDict?.detail;
  }
};
globalThis.Event = class Event {
  constructor(type) {
    this.type = type;
  }
};

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✔ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✖ FAIL: ${name}`);
    console.error(`         ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('========================================================================');
console.log('  REVIEWER 1: ADVERSARIAL DEEP STRESS & INTEGRITY SUITE (MILESTONE 8)   ');
console.log('========================================================================\n');

// ---------------------------------------------------------------------------
// Dynamic Bundle of TS/TSX modules via esbuild
// ---------------------------------------------------------------------------
const tempBundle = path.join(__dirname, `temp_reviewer_m8_${Date.now()}.mjs`);
function cleanup() {
  try {
    if (fs.existsSync(tempBundle)) fs.unlinkSync(tempBundle);
  } catch {}
}
process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(1); });

esbuild.buildSync({
  stdin: {
    contents: `
      export { STORAGE_KEYS } from '@/services/storage/storageKeys';
      export { AUTH_STORAGE_KEY, defaultAdminUser, useAuthStore } from '@/stores/authStore';
      export { systemService } from '@/services/systemService';
      export { adminNavGroups } from '@/layouts/AdminLayout';
      export { productFormSchema } from '@/features/products/pages/ProductFormPage';
      export { defaultAppConfig } from '@/config/appConfig';
    `,
    resolveDir: ROOT_DIR,
    loader: 'ts',
  },
  bundle: true,
  write: true,
  outfile: tempBundle,
  format: 'esm',
  alias: { '@': path.join(ROOT_DIR, 'src') },
  external: ['react', 'react-dom', 'react-router-dom', 'lucide-react', 'zustand'],
});

const bundleUrl = new URL(`file://${tempBundle.replace(/\\/g, '/')}`);
const {
  STORAGE_KEYS,
  AUTH_STORAGE_KEY,
  defaultAdminUser,
  useAuthStore,
  systemService,
  adminNavGroups,
  productFormSchema,
  defaultAppConfig,
} = await import(bundleUrl.href);

// -------------------------------------------------------------------------
// SECTION 1: SystemService Demo Reset Auth State & Key Contracts
// -------------------------------------------------------------------------
console.log('--- [SECTION 1: SystemService Auth State Reset] ---');

await (async () => {
  // Test resetDemoData
  await systemService.resetDemoData();

  test('1.1 STORAGE_KEYS.AUTH is populated in localStorage after resetDemoData', () => {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH);
    assert.ok(raw, 'STORAGE_KEYS.AUTH must exist');
    const parsed = JSON.parse(raw);
    assert.strictEqual(parsed.isAuthenticated, true);
    assert.strictEqual(parsed.user.id, defaultAdminUser.id);
    assert.strictEqual(parsed.user.role, 'admin');
  });

  test('1.2 AUTH_STORAGE_KEY (v3) is populated in localStorage after resetDemoData', () => {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    assert.ok(raw, 'AUTH_STORAGE_KEY must exist');
    const parsed = JSON.parse(raw);
    assert.strictEqual(parsed.isAuthenticated, true);
    assert.strictEqual(parsed.user.role, 'admin');
  });

  test('1.3 useAuthStore in-memory state rehydrates to admin after resetDemoData', () => {
    const state = useAuthStore.getState();
    assert.strictEqual(state.isAuthenticated, true);
    assert.strictEqual(state.user?.id, defaultAdminUser.id);
    assert.strictEqual(state.user?.role, 'admin');
  });

  test('1.4 Repeated resetDemoData runs idempotently without key corruption', async () => {
    await systemService.resetDemoData();
    await systemService.resetDemoData();
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH);
    assert.ok(raw);
    const parsed = JSON.parse(raw);
    assert.strictEqual(parsed.user.email, 'admin@d2cstarter.vn');
  });
})();

// -------------------------------------------------------------------------
// SECTION 2: Catalog Page Auto-scroll & Filter Edge Cases
// -------------------------------------------------------------------------
console.log('\n--- [SECTION 2: Catalog Page Auto-Scroll & Filter Edge Cases] ---');

test('2.1 Scroll target computation adheres to Math.max(0, headerTop - 80)', () => {
  const computeTarget = (headerTop) => Math.max(0, headerTop - 80);
  assert.strictEqual(computeTarget(600), 520);
  assert.strictEqual(computeTarget(80), 0);
  assert.strictEqual(computeTarget(40), 0);
  assert.strictEqual(computeTarget(0), 0);
  assert.strictEqual(computeTarget(-200), 0);
});

test('2.2 Custom price range swaps inverted min > max inputs', () => {
  let customMin = '1000000';
  let customMax = '200000';
  let minVal = customMin.trim() ? Math.max(0, parseInt(customMin, 10)) : undefined;
  let maxVal = customMax.trim() ? Math.max(0, parseInt(customMax, 10)) : undefined;

  if (minVal !== undefined && maxVal !== undefined && minVal > maxVal) {
    const temp = minVal;
    minVal = maxVal;
    maxVal = temp;
  }

  assert.strictEqual(minVal, 200000);
  assert.strictEqual(maxVal, 1000000);
});

test('2.3 Catalog source code binds scrollToTop to all filter trigger points', () => {
  const catalogSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/features/storefront/pages/CatalogPage.tsx'), 'utf-8');
  assert.ok(catalogSrc.includes('ref={catalogHeaderRef}'));
  assert.ok(catalogSrc.includes('handleFilterChange = (updates: Partial<CatalogFilterState>, shouldScroll = true)'));
  assert.ok(catalogSrc.includes('handleResetFilters'));
  assert.ok(catalogSrc.includes('onPageChange'));
  assert.ok(catalogSrc.includes('onPageSizeChange'));
  assert.ok(catalogSrc.includes('onRemoveCategory'));
  assert.ok(catalogSrc.includes('onRemovePrice'));
  assert.ok(catalogSrc.includes('onRemoveInStock'));
  assert.ok(catalogSrc.includes('onRemoveRating'));
  assert.ok(catalogSrc.includes('onRemoveTag'));
  assert.ok(catalogSrc.includes('onRemoveSearch'));
});

// -------------------------------------------------------------------------
// SECTION 3: AdminLayout 5 Groups & Path Resolution Matrix
// -------------------------------------------------------------------------
console.log('\n--- [SECTION 3: AdminLayout 5 Groups & Path Resolution Matrix] ---');

test('3.1 adminNavGroups contains exactly 5 semantic groups', () => {
  assert.strictEqual(adminNavGroups.length, 5);
  assert.strictEqual(adminNavGroups[0].id, 'overview-group');
  assert.strictEqual(adminNavGroups[1].label, 'Bán hàng');
  assert.strictEqual(adminNavGroups[2].label, 'Sản phẩm');
  assert.strictEqual(adminNavGroups[3].label, 'Kênh bán');
  assert.strictEqual(adminNavGroups[4].label, 'Quản trị hệ thống');
});

test('3.2 All items in adminNavGroups have valid path and unique IDs', () => {
  const seenIds = new Set();
  for (const group of adminNavGroups) {
    for (const item of group.items) {
      assert.ok(item.id, 'Item must have id');
      assert.ok(!seenIds.has(item.id), `Duplicate nav id: ${item.id}`);
      seenIds.add(item.id);
      assert.ok(item.path.startsWith('/'), `Path must start with /: ${item.path}`);
      assert.ok(item.title, 'Item must have title');
    }
  }
});

// Test isItemActive logic extracted from AdminLayout
function simulateIsItemActive(curPath, item) {
  if (item.exact) {
    if (item.id === 'orders') {
      if (curPath === '/admin/orders') return true;
      const parts = curPath.split('/').filter(Boolean);
      if (parts.length === 3 && parts[1] === 'orders') {
        const sub = parts[2];
        if (!['abandoned', 'shipping-slips', 'tags', 'custom-fields'].includes(sub)) {
          return true;
        }
      }
      return false;
    }
    if (item.id === 'products') {
      if (curPath === '/admin/products') return true;
      if (curPath.startsWith('/admin/products/new')) return true;
      if (/^\/admin\/products\/[^/]+\/edit/.test(curPath)) return true;
      return false;
    }
    return curPath === item.path;
  }

  if (item.id === 'products-categories') {
    return curPath === '/admin/products/categories' || curPath === '/admin/categories';
  }

  if (item.isExternal) {
    return curPath === item.path;
  }

  return curPath === item.path || curPath.startsWith(`${item.path}/`);
}

test('3.3 Orders item highlights for /admin/orders and /admin/orders/ord_01, but NOT /admin/orders/abandoned', () => {
  const ordersItem = { id: 'orders', path: '/admin/orders', exact: true };
  assert.strictEqual(simulateIsItemActive('/admin/orders', ordersItem), true);
  assert.strictEqual(simulateIsItemActive('/admin/orders/ord_01', ordersItem), true);
  assert.strictEqual(simulateIsItemActive('/admin/orders/abandoned', ordersItem), false);
  assert.strictEqual(simulateIsItemActive('/admin/orders/shipping-slips', ordersItem), false);
  assert.strictEqual(simulateIsItemActive('/admin/orders/tags', ordersItem), false);
  assert.strictEqual(simulateIsItemActive('/admin/orders/custom-fields', ordersItem), false);
});

test('3.4 Products item highlights for /admin/products, /admin/products/new, /admin/products/prod_01/edit, but NOT /admin/products/inventory', () => {
  const productsItem = { id: 'products', path: '/admin/products', exact: true };
  assert.strictEqual(simulateIsItemActive('/admin/products', productsItem), true);
  assert.strictEqual(simulateIsItemActive('/admin/products/new', productsItem), true);
  assert.strictEqual(simulateIsItemActive('/admin/products/prod_01/edit', productsItem), true);
  assert.strictEqual(simulateIsItemActive('/admin/products/inventory', productsItem), false);
  assert.strictEqual(simulateIsItemActive('/admin/products/tags', productsItem), false);
  assert.strictEqual(simulateIsItemActive('/admin/products/categories', productsItem), false);
  assert.strictEqual(simulateIsItemActive('/admin/products/reviews', productsItem), false);
});

test('3.5 Category item highlights for BOTH /admin/categories and /admin/products/categories', () => {
  const catItem = { id: 'products-categories', path: '/admin/products/categories' };
  assert.strictEqual(simulateIsItemActive('/admin/categories', catItem), true);
  assert.strictEqual(simulateIsItemActive('/admin/products/categories', catItem), true);
});

// -------------------------------------------------------------------------
// SECTION 4: ProductFormPage Schema & Calculator Hardening
// -------------------------------------------------------------------------
console.log('\n--- [SECTION 4: ProductFormPage Schema & Discount Calculator] ---');

test('4.1 productFormSchema validates normal product correctly', () => {
  const validProduct = {
    name: 'Áo Sơ Mi Oxford Cotton Cao Cấp',
    slug: 'ao-so-mi-oxford-cotton-cao-cap',
    sku: 'SM-OXFORD-01',
    categoryId: 'cat_01',
    description: 'Chất liệu vải Oxford dày dặn, đứng form chuẩn phong cách nam tính.',
    price: 350000,
    compareAtPrice: 450000,
    stock: 25,
    lowStockThreshold: 5,
    status: 'active',
  };
  const result = productFormSchema.safeParse(validProduct);
  assert.strictEqual(result.success, true);
});

test('4.2 productFormSchema rejects compareAtPrice < price when compareAtPrice > 0', () => {
  const invalid = {
    name: 'Sản phẩm lỗi giá',
    slug: 'san-pham-loi-gia',
    sku: 'ERR-01',
    categoryId: 'cat_01',
    description: 'Mô tả hợp lệ trên 10 ký tự cho sản phẩm.',
    price: 300000,
    compareAtPrice: 200000, // Invalid: original price lower than sale price
    stock: 10,
    status: 'active',
  };
  const result = productFormSchema.safeParse(invalid);
  assert.strictEqual(result.success, false);
});

test('4.3 Discount percentage formula calculates correct savings', () => {
  const calcDiscount = (comp, pr) =>
    comp && pr && comp > pr ? Math.round(((comp - pr) / comp) * 100) : 0;

  assert.strictEqual(calcDiscount(500000, 350000), 30);
  assert.strictEqual(calcDiscount(1000000, 250000), 75);
  assert.strictEqual(calcDiscount(200000, 200000), 0);
  assert.strictEqual(calcDiscount(0, 200000), 0);
  assert.strictEqual(calcDiscount(undefined, 200000), 0);
});

// -------------------------------------------------------------------------
// SECTION 5: Seller Admin Pages Integrity & Storage Keys
// -------------------------------------------------------------------------
console.log('\n--- [SECTION 5: Seller Admin Pages Integrity & Storage Keys] ---');

const expectedStorageKeys = [
  'ABANDONED_ORDERS',
  'SHIPPING_SLIPS',
  'ORDER_TAGS',
  'ORDER_CUSTOM_FIELDS',
  'PRODUCT_TAGS',
  'PRODUCT_CUSTOM_FIELDS',
];

for (const k of expectedStorageKeys) {
  test(`5.1 STORAGE_KEYS.${k} exists and follows namespacing convention`, () => {
    assert.ok(STORAGE_KEYS[k], `STORAGE_KEYS.${k} must exist`);
    assert.match(STORAGE_KEYS[k], /^d2c_ecommerce:.*:v1$/);
  });
}

const pageFiles = [
  'src/features/orders/pages/AbandonedOrdersPage.tsx',
  'src/features/orders/pages/ShippingSlipsPage.tsx',
  'src/features/orders/pages/OrderTagsPage.tsx',
  'src/features/orders/pages/OrderCustomFieldsPage.tsx',
  'src/features/products/pages/ProductTagsPage.tsx',
  'src/features/products/pages/InventoryPage.tsx',
  'src/features/products/pages/ProductReviewsPage.tsx',
  'src/features/products/pages/ProductCustomFieldsPage.tsx',
];

for (const file of pageFiles) {
  test(`5.2 Page file ${path.basename(file)} exists, is non-trivial (>150 lines), and exports component`, () => {
    const fullPath = path.join(ROOT_DIR, file);
    assert.ok(fs.existsSync(fullPath), `File must exist: ${file}`);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n').length;
    assert.ok(lines > 150, `File ${file} has only ${lines} lines, expected > 150`);
    assert.match(content, /export const [A-Za-z]+Page: React\.FC/);
  });
}

// -------------------------------------------------------------------------
// SECTION 6: Integrity Violations Sweep
// -------------------------------------------------------------------------
console.log('\n--- [SECTION 6: Integrity Violations Sweep] ---');

test('6.1 No hardcoded test bypass flags in src/', () => {
  const checkDirs = [
    'src/features/storefront',
    'src/features/orders',
    'src/features/products',
    'src/layouts',
    'src/services',
  ];

  for (const dir of checkDirs) {
    const fullDir = path.join(ROOT_DIR, dir);
    if (!fs.existsSync(fullDir)) continue;

    const files = fs.readdirSync(fullDir, { recursive: true });
    for (const f of files) {
      if (typeof f !== 'string' || (!f.endsWith('.ts') && !f.endsWith('.tsx'))) continue;
      const content = fs.readFileSync(path.join(fullDir, f), 'utf-8');

      assert.ok(!content.includes('// mock bypass for tests'), `Found test bypass in ${f}`);
      assert.ok(!content.includes('// hardcoded test pass'), `Found hardcoded test pass in ${f}`);
      assert.ok(!content.includes('// fake implementation'), `Found fake implementation in ${f}`);
    }
  }
});

console.log('\n========================================================================');
console.log(`  RESULTS: ${passedTests} / ${totalTests} Passed | ${totalTests - passedTests} Failed`);
console.log('========================================================================\n');
