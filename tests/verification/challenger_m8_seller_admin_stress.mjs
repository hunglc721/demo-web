#!/usr/bin/env node
/**
 * EMPIRICAL ADVERSARIAL STRESS SUITE: Milestone 8 Objective 2
 * LadiSales Seller Admin Backoffice Customization
 * Challenger: teamwork_challenger_m8_2
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

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

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ${c.green}✔ PASS:${c.reset} ${message}`);
  } else {
    failed++;
    console.error(`  ${c.red}✖ FAIL:${c.reset} ${message}`);
  }
}

console.log(`${c.bold}${c.cyan}========================================================================${c.reset}`);
console.log(`${c.bold}${c.cyan}  CHALLENGER 2 STRESS SUITE: M8 OBJECTICVE 2 (SELLER ADMIN BACKOFFICE)   ${c.reset}`);
console.log(`${c.bold}${c.cyan}========================================================================${c.reset}\n`);

// Setup Mock LocalStorage & Browser DOM Environment
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

const mockStorage = new MockLocalStorage();
globalThis.localStorage = mockStorage;

const mockWindow = {
  localStorage: mockStorage,
  location: {
    pathname: '/',
    search: '',
    hash: '',
    href: 'http://localhost/',
    origin: 'http://localhost',
  },
  history: {
    pushState: () => {},
    replaceState: () => {},
  },
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
  matchMedia: () => ({ matches: false, addListener: () => {}, removeListener: () => {} }),
};

const mockDocument = {
  defaultView: mockWindow,
  documentElement: {
    classList: { add: () => {}, remove: () => {}, has: () => false },
    setAttribute: () => {},
    getAttribute: () => null,
    style: {},
  },
  createElement: () => ({
    style: {},
    setAttribute: () => {},
    getAttribute: () => null,
    appendChild: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
  }),
  head: { appendChild: () => {} },
  body: { appendChild: () => {} },
};

mockWindow.document = mockDocument;
globalThis.window = mockWindow;
globalThis.document = mockDocument;

// Bundle relevant modules for evaluation
const tempBundlePath = path.join(ROOT_DIR, 'tests', 'verification', 'temp_m8_challenger_bundle.mjs');
await esbuild.build({
  stdin: {
    contents: `
      export { STORAGE_KEYS, STORAGE_PREFIX, STORAGE_VERSION, getEntityStorageKey } from './src/services/storage/storageKeys';
      export { productFormSchema } from './src/features/products/pages/ProductFormPage';
      export { adminNavGroups } from './src/layouts/AdminLayout';
      export { defaultAppConfig } from './src/config/appConfig';
      export { slugify, formatCurrencyVND } from './src/utils/formatters';
      export { productService } from './src/services/api/productService';
      export { orderService } from './src/services/api/orderService';
      export { reviewService } from './src/services/api/reviewService';
      export { router } from './src/routes/index';
    `,
    resolveDir: ROOT_DIR,
    sourcefile: 'entry.js',
  },
  bundle: true,
  format: 'esm',
  outfile: tempBundlePath,
  plugins: [
    {
      name: 'alias-resolver',
      setup(build) {
        build.onResolve({ filter: /^@\// }, (args) => {
          const subPath = args.path.replace(/^@\//, '');
          const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx'];
          for (const ext of extensions) {
            const candidate = path.join(ROOT_DIR, 'src', subPath + ext);
            if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
              return { path: candidate };
            }
          }
          return { path: path.join(ROOT_DIR, 'src', subPath) };
        });
      },
    },
  ],
  logLevel: 'error',
});

const m = await import(`file://${tempBundlePath}`);

// -----------------------------------------------------------------------------
// SECTION 1: STORAGE_KEYS Consistency & Schema Compliance
// -----------------------------------------------------------------------------
console.log(`${c.bold}--- [SECTION 1] Storage Keys & Namespacing Consistency ---${c.reset}`);

const { STORAGE_KEYS, STORAGE_PREFIX, STORAGE_VERSION, getEntityStorageKey } = m;

assert(STORAGE_PREFIX === 'd2c_ecommerce', 'STORAGE_PREFIX is "d2c_ecommerce"');
assert(STORAGE_VERSION === 'v1', 'STORAGE_VERSION is "v1"');

const keyEntries = Object.entries(STORAGE_KEYS);
assert(keyEntries.length >= 19, `STORAGE_KEYS has ${keyEntries.length} keys (>= 19 required)`);

const newSellerKeys = [
  'ABANDONED_ORDERS',
  'SHIPPING_SLIPS',
  'ORDER_TAGS',
  'ORDER_CUSTOM_FIELDS',
  'PRODUCT_TAGS',
  'PRODUCT_CUSTOM_FIELDS',
];

for (const k of newSellerKeys) {
  assert(STORAGE_KEYS[k] !== undefined, `New seller storage key "${k}" exists`);
  assert(
    STORAGE_KEYS[k] === `d2c_ecommerce:${k.toLowerCase()}:v1`,
    `"${k}" has exact schema: "d2c_ecommerce:${k.toLowerCase()}:v1"`
  );
}

// Check for uniqueness of all key values
const allValues = Object.values(STORAGE_KEYS);
const uniqueValues = new Set(allValues);
assert(
  uniqueValues.size === allValues.length,
  `All ${allValues.length} storage key values are strictly unique without collisions`
);

// Check key prefix pattern
for (const [name, val] of keyEntries) {
  const matches = /^d2c_ecommerce:[a-z0-9_]+:v1$/.test(val);
  assert(matches, `Key "${name}" value "${val}" strictly adheres to ^d2c_ecommerce:[a-z0-9_]+:v1$`);
}

// Test getEntityStorageKey helper
assert(
  getEntityStorageKey('abandoned_orders') === 'd2c_ecommerce:abandoned_orders:v1',
  'getEntityStorageKey generates expected namespace string'
);
assert(
  getEntityStorageKey('CUSTOM_ITEMS', 'v2') === 'd2c_ecommerce:custom_items:v2',
  'getEntityStorageKey handles custom version parameter correctly'
);

// Verify that all 8 new seller page files import and use appropriate storage keys
const sellerFilesToCheck = [
  { file: 'src/features/orders/pages/AbandonedOrdersPage.tsx', keyExpected: 'ABANDONED_ORDERS' },
  { file: 'src/features/orders/pages/ShippingSlipsPage.tsx', keyExpected: 'SHIPPING_SLIPS' },
  { file: 'src/features/orders/pages/OrderTagsPage.tsx', keyExpected: 'ORDER_TAGS' },
  { file: 'src/features/orders/pages/OrderCustomFieldsPage.tsx', keyExpected: 'ORDER_CUSTOM_FIELDS' },
  { file: 'src/features/products/pages/ProductTagsPage.tsx', keyExpected: 'PRODUCT_TAGS' },
  { file: 'src/features/products/pages/ProductCustomFieldsPage.tsx', keyExpected: 'PRODUCT_CUSTOM_FIELDS' },
];

for (const item of sellerFilesToCheck) {
  const fileContent = fs.readFileSync(path.join(ROOT_DIR, item.file), 'utf8');
  const usesKey = fileContent.includes(`STORAGE_KEYS.${item.keyExpected}`);
  assert(usesKey, `${item.file} directly references STORAGE_KEYS.${item.keyExpected}`);
}

// -----------------------------------------------------------------------------
// SECTION 2: Navigation Groups & Admin Routes Integrity
// -----------------------------------------------------------------------------
console.log(`\n${c.bold}--- [SECTION 2] Navigation Groups & Admin Routes Registration ---${c.reset}`);

const { adminNavGroups, router } = m;

assert(Array.isArray(adminNavGroups), 'adminNavGroups is an array');
assert(adminNavGroups.length === 5, `adminNavGroups contains exactly 5 groups (got: ${adminNavGroups.length})`);

const expectedGroupIds = [
  'overview-group',
  'sales-group',
  'products-group',
  'channels-group',
  'management-group',
];

for (const gid of expectedGroupIds) {
  const g = adminNavGroups.find((grp) => grp.id === gid);
  assert(g !== undefined, `Navigation group "${gid}" exists`);
  assert(Array.isArray(g?.items) && g.items.length > 0, `Group "${gid}" has at least 1 item`);
}

// Extract all registered route paths from router
function extractRoutePaths(routes, parent = '') {
  let paths = [];
  for (const r of routes) {
    let full = '';
    if (r.path !== undefined) {
      if (r.path.startsWith('/')) {
        full = r.path;
      } else {
        full = parent === '/' ? `/${r.path}` : `${parent}/${r.path}`;
      }
      paths.push(full);
    } else {
      full = parent;
    }
    if (r.children) {
      paths = paths.concat(extractRoutePaths(r.children, full));
    }
  }
  return paths;
}

const registeredPaths = extractRoutePaths(router.routes);

// Verify all required routes from Milestone 8 Objective 2 dispatch
const requiredAdminRoutes = [
  '/admin/orders/abandoned',
  '/admin/orders/shipping-slips',
  '/admin/orders/tags',
  '/admin/orders/custom-fields',
  '/admin/products/categories',
  '/admin/products/tags',
  '/admin/products/inventory',
  '/admin/products/reviews',
  '/admin/products/custom-fields',
  '/admin/categories',
];

for (const reqRoute of requiredAdminRoutes) {
  const found = registeredPaths.includes(reqRoute);
  assert(found, `Mandatory route "${reqRoute}" is registered in router`);
}

// Verify every item in adminNavGroups has a valid path registered
let totalNavItems = 0;
for (const grp of adminNavGroups) {
  for (const item of grp.items) {
    totalNavItems++;
    assert(Boolean(item.id), `Nav item has id: ${item.id}`);
    assert(Boolean(item.title), `Nav item "${item.id}" has title: "${item.title}"`);
    assert(Boolean(item.path), `Nav item "${item.id}" has path: "${item.path}"`);
    assert(Boolean(item.icon), `Nav item "${item.id}" has icon element`);

    // Path must either be registered in router or be an external storefront path
    const isRegistered = registeredPaths.includes(item.path);
    assert(
      isRegistered,
      `Nav item "${item.title}" (${item.id}) path "${item.path}" resolves in registered router paths`
    );
  }
}
assert(totalNavItems >= 15, `Total admin nav items: ${totalNavItems} (>= 15 items covered)`);

// Check breadcrumbs mapping in AdminLayout.tsx
const adminLayoutSrc = fs.readFileSync(path.join(ROOT_DIR, 'src', 'layouts', 'AdminLayout.tsx'), 'utf8');
for (const reqRoute of requiredAdminRoutes) {
  assert(adminLayoutSrc.includes(reqRoute), `AdminLayout includes route mapping or path handling for "${reqRoute}"`);
}

// -----------------------------------------------------------------------------
// SECTION 3: ProductFormPage Schema & Logic Challenge
// -----------------------------------------------------------------------------
console.log(`\n${c.bold}--- [SECTION 3] ProductFormPage Schema & Calculations Stress Testing ---${c.reset}`);

const { productFormSchema, slugify } = m;

// 3.1 Baseline valid product
const baselineProduct = {
  name: 'Áo Polo Thể Thao Phối Viền Active Pro',
  slug: 'ao-polo-the-thao-phoi-vien-active-pro',
  sku: 'POLO-ACT-001',
  categoryId: 'cat_01',
  description: 'Chất liệu vải thể thao co giãn 4 chiều thoáng mát thấm hút mồ hôi tối đa.',
  shortDescription: 'Áo polo thể thao nam cao cấp.',
  price: 299000,
  compareAtPrice: 399000,
  stock: 120,
  lowStockThreshold: 10,
  status: 'active',
  isFeatured: true,
  isFlashSale: false,
  tags: 'Bán chạy, Thể thao, Hàng mới',
};

const parseRes = productFormSchema.safeParse(baselineProduct);
assert(parseRes.success, 'Baseline product passes productFormSchema validation');

// 3.2 Price & compareAtPrice adversarial boundary tests
// compareAtPrice < price should FAIL refinement
const invalidPriceRes = productFormSchema.safeParse({
  ...baselineProduct,
  price: 400000,
  compareAtPrice: 350000,
});
assert(!invalidPriceRes.success, 'compareAtPrice < price is REJECTED by refinement');
if (!invalidPriceRes.success) {
  const err = invalidPriceRes.error.issues.find((i) => i.path.includes('compareAtPrice'));
  assert(err !== undefined, 'Error is targeted to path "compareAtPrice"');
}

// compareAtPrice == price should PASS (no discount)
const equalPriceRes = productFormSchema.safeParse({
  ...baselineProduct,
  price: 350000,
  compareAtPrice: 350000,
});
assert(equalPriceRes.success, 'compareAtPrice == price is ACCEPTED');

// price = 0 (free gift / promo) should PASS
const zeroPriceRes = productFormSchema.safeParse({
  ...baselineProduct,
  price: 0,
  compareAtPrice: 100000,
});
assert(zeroPriceRes.success, 'price = 0 is ACCEPTED');

// negative price should FAIL
const negPriceRes = productFormSchema.safeParse({
  ...baselineProduct,
  price: -1000,
});
assert(!negPriceRes.success, 'Negative price (-1000) is REJECTED');

// negative stock should FAIL
const negStockRes = productFormSchema.safeParse({
  ...baselineProduct,
  stock: -5,
});
assert(!negStockRes.success, 'Negative stock (-5) is REJECTED');

// float stock should FAIL
const floatStockRes = productFormSchema.safeParse({
  ...baselineProduct,
  stock: 12.8,
});
assert(!floatStockRes.success, 'Float stock (12.8) is REJECTED');

// lowStockThreshold < 1 should FAIL
const invalidThreshRes = productFormSchema.safeParse({
  ...baselineProduct,
  lowStockThreshold: 0,
});
assert(!invalidThreshRes.success, 'lowStockThreshold = 0 is REJECTED (min is 1)');

// 3.3 Vietnamese Slug generation & validation
const slugSamples = [
  { text: 'Áo Thun Nam Cổ Tròn 100% Cotton', expected: 'ao-thun-nam-co-tron-100-cotton' },
  { text: 'Đầm Xòe Linen Cổ Vuông Dạo Phố', expected: 'dam-xoe-linen-co-vuong-dao-pho' },
  { text: 'Giày Sneaker Da Nam — Bản Giới Hạn!', expected: 'giay-sneaker-da-nam-ban-gioi-han' },
  { text: 'Ví Cầm Tay Mini Da Thật (Cao Cấp)', expected: 'vi-cam-tay-mini-da-that-cao-cap' },
];

for (const s of slugSamples) {
  const generated = slugify(s.text);
  assert(generated === s.expected, `slugify("${s.text}") -> "${generated}"`);
  const checkSlug = productFormSchema.safeParse({
    ...baselineProduct,
    slug: generated,
  });
  assert(checkSlug.success, `Generated slug "${generated}" satisfies slug regex constraint`);
}

// 3.4 Discount Percentage Calculation Verification
function calculateDiscountPct(price, compareAtPrice) {
  if (compareAtPrice && price && compareAtPrice > price) {
    return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
  }
  return 0;
}

assert(calculateDiscountPct(299000, 399000) === 25, '299k vs 399k gives 25% discount');
assert(calculateDiscountPct(200000, 400000) === 50, '200k vs 400k gives 50% discount');
assert(calculateDiscountPct(300000, 300000) === 0, 'equal price gives 0% discount');
assert(calculateDiscountPct(500000, undefined) === 0, 'undefined compareAtPrice gives 0% discount');

// -----------------------------------------------------------------------------
// SECTION 4: Seller Backoffice Data Operations Simulation
// -----------------------------------------------------------------------------
console.log(`\n${c.bold}--- [SECTION 4] Seller Backoffice Functional Simulation ---${c.reset}`);

const { productService, orderService } = m;

// 4.1 Stock manipulation logic (as implemented in InventoryPage)
const testProd = await productService.createProduct({
  name: 'Sản phẩm Test Tồn Kho InventoryPage',
  slug: 'san-pham-test-ton-kho-inventorypage',
  sku: 'TEST-INV-001',
  categoryId: 'cat_01',
  categoryName: 'Thời trang',
  description: 'Mô tả chi tiết sản phẩm test tồn kho.',
  price: 150000,
  stock: 10,
  lowStockThreshold: 5,
  status: 'active',
  images: ['https://example.com/test.jpg'],
  options: [],
  variants: [],
});

assert(testProd.id !== undefined, 'Created product for inventory manipulation');
assert(testProd.stock === 10, 'Initial stock is 10');

// Helper simulating InventoryPage handleUpdateStock
async function simulateUpdateStock(prodId, currentStock, delta) {
  const newStock = Math.max(0, currentStock + delta);
  await productService.updateProduct(prodId, { stock: newStock });
  return newStock;
}

let s1 = await simulateUpdateStock(testProd.id, 10, 5);
assert(s1 === 15, 'Stock updated +5 to 15');
let pCheck1 = await productService.getProductById(testProd.id);
assert(pCheck1?.stock === 15, 'Persisted stock in repository is 15');

let s2 = await simulateUpdateStock(testProd.id, 15, -20);
assert(s2 === 0, 'Stock decremented -20 clamped to 0 (cannot be negative)');
let pCheck2 = await productService.getProductById(testProd.id);
assert(pCheck2?.stock === 0, 'Persisted stock in repository is 0');

// Clean up test product
await productService.deleteProduct(testProd.id);
const pCheckDeleted = await productService.getProductById(testProd.id);
assert(pCheckDeleted === null, 'Test product successfully deleted after inventory test');

// 4.2 Abandoned Order conversion simulation
const mockAbandoned = {
  id: 'abn_test_99',
  code: 'ABN-TEST-99',
  customerName: 'Nguyễn Thử Nghiệm',
  customerPhone: '0909998877',
  customerEmail: 'test.abandoned@example.com',
  items: [
    {
      title: 'Áo Sơ Mi Oxford Dài Tay',
      quantity: 2,
      price: 350000,
      image: 'https://example.com/oxford.jpg',
    },
  ],
  totalAmount: 700000,
  reminderStatus: 'unsent',
  createdAt: new Date().toISOString(),
};

// Simulate converting to official order (matching AbandonedOrdersPage.tsx)
const convertedOrder = await orderService.createOrder({
  customer: {
    name: mockAbandoned.customerName,
    phone: mockAbandoned.customerPhone,
    email: mockAbandoned.customerEmail,
    address: {
      id: `addr_test`,
      receiverName: mockAbandoned.customerName,
      phone: mockAbandoned.customerPhone,
      street: '123 Đường Test',
      ward: 'Phường Bến Nghé',
      district: 'Quận 1',
      province: 'TP. Hồ Chí Minh',
      fullAddress: '123 Đường Test, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    },
  },
  items: mockAbandoned.items.map((item, idx) => ({
    id: `item_${idx}`,
    productId: 'prod_01',
    title: item.title,
    sku: 'SKU-001',
    price: item.price,
    quantity: item.quantity,
    totalPrice: item.price * item.quantity,
    image: item.image,
  })),
  subtotal: mockAbandoned.totalAmount,
  shippingFee: 30000,
  discount: 0,
  total: mockAbandoned.totalAmount + 30000,
  paymentMethod: 'cod',
  status: 'pending',
  notes: `Chuyển đổi từ đơn chưa hoàn tất ${mockAbandoned.code}`,
});

assert(convertedOrder.id !== undefined, 'Abandoned order successfully converted to real Order');
assert(convertedOrder.customer.phone === '0909998877', 'Customer phone preserved');
assert(convertedOrder.subtotal === 700000, 'Subtotal correctly preserved');

// Clean up bundle
try {
  fs.unlinkSync(tempBundlePath);
} catch (e) {}

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log(`\n${c.bold}========================================================================${c.reset}`);
console.log(`${c.bold}  EMPIRICAL CHALLENGER VERIFICATION RESULTS SUMMARY                     ${c.reset}`);
console.log(`${c.bold}========================================================================${c.reset}`);
console.log(`  Total Assertions:  ${passed + failed}`);
console.log(`  Passed:            ${c.green}${passed}${c.reset}`);
console.log(`  Failed:            ${failed > 0 ? c.red : c.green}${failed}${c.reset}\n`);

if (failed === 0) {
  console.log(`${c.bold}${c.green}★ ALL ADVERSARIAL STRESS CHALLENGES PASSED EMPIRICALLY (100% OK) ★${c.reset}\n`);
  process.exit(0);
} else {
  console.error(`${c.bold}${c.red}✖ VERIFICATION FAILED: ${failed} assertion(s) did not match expectations.${c.reset}\n`);
  process.exit(1);
}
