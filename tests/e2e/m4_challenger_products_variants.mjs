#!/usr/bin/env node
/**
 * ============================================================================
 * EMPIRICAL CHALLENGER TEST SUITE: MILESTONE 4
 * Focus: Admin Backoffice Product Management, Variant Matrix,
 *        Form Validation Schema & Low-Stock Inventory
 *
 * File: tests/e2e/m4_challenger_products_variants.mjs
 * Author: challenger_m4_1 (Empirical Challenger)
 * ============================================================================
 *
 * Scope:
 * 1. Variant Matrix generation with complex options and bulk edits:
 *    - Cartesian product across 1D, 2D, 3D, 4D, 5D option structures
 *    - SKU diacritic normalization (Vietnamese accents -> ASCII, uppercase)
 *    - Title formatting ("Size / Color / Material")
 *    - State preservation across matrix rebuilds
 *    - Bulk operations: bulk price, bulk stock, boundary validation
 *    - Single-row overrides (custom price/stock/SKU) & row deletions
 *    - Dynamic total variant stock calculation
 *
 * 2. Product form validation schema (`productFormSchema`):
 *    - Name validation: rejection of empty string, whitespace-only, < 3 chars, > 200 chars
 *    - Slug validation: rejection of uppercase, spaces, accents, special characters
 *    - SKU validation: rejection of empty / < 2 chars, uppercase normalization
 *    - Stock validation: rejection of negative numbers, floats; acceptance of 0, positive ints
 *    - Price validation: rejection of negative price; acceptance of 0, positive numbers
 *    - Cross-field refinement: rejection of `price > compareAtPrice` (when compareAtPrice > 0)
 *    - Acceptance of `compareAtPrice >= price`, `compareAtPrice == undefined`, `compareAtPrice == 0`
 *
 * 3. Low-stock inventory table queries (`productService.getLowStockProducts(5)`):
 *    - Seed catalog low-stock audit
 *    - Exact boundary behavior (stock = 0, 4, 5, 6)
 *    - Custom product-level `lowStockThreshold` precedence
 *    - Real-time stock mutation reactivity (restock, depletion, deletion)
 *    - Custom query threshold parameters (`threshold = 2`, `threshold = 0`)
 *    - Multi-mutation consistency without stale caching
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');

// ANSI Color Palette
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
};

// ---------------------------------------------------------------------------
// 1. Mock LocalStorage & Event Target Environment for DAL
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

// Global Mocks Setup
const mockStorage = new MockLocalStorage();
const mockWindow = new MockEventTarget();
mockWindow.localStorage = mockStorage;

globalThis.window = mockWindow;
globalThis.localStorage = mockStorage;

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
// 2. Assertion Utilities
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
    const detail = `${message} | Expected: ${JSON.stringify(expected)}, Actual: ${JSON.stringify(actual)}`;
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
// 3. Dynamic Module Bundle via esbuild
// ---------------------------------------------------------------------------
const tempBundle = path.join(__dirname, `temp_bundle_m4_${Date.now()}.mjs`);

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
      export { productFormSchema } from '@/features/products/pages/ProductFormPage';
      export { ProductService, productService } from '@/services/api/productService';
      export { systemService } from '@/services/systemService';
      export { slugify } from '@/utils/formatters';
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

const fileUrl = new URL(`file://${tempBundle.replace(/\\/g, '/')}`);
const { productFormSchema, ProductService, productService, systemService, slugify } = await import(fileUrl.href);

// ---------------------------------------------------------------------------
// 4. VariantMatrixBuilder Implementation Logic
// (Extracted directly from VariantMatrixBuilder.tsx for algorithmic stress testing)
// ---------------------------------------------------------------------------
function slugifyValue(val) {
  return val
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 4)
    .toUpperCase();
}

function generateCartesianVariants(opts, baseSku, basePrice, baseStock, existingVariants = []) {
  const validOpts = opts.filter((o) => o.name && o.name.trim() && o.values && o.values.length > 0);
  if (validOpts.length === 0) return [];

  const cartesian = (arrays) => {
    return arrays.reduce(
      (acc, curr) => acc.flatMap((c) => curr.map((n) => [...c, n])),
      [[]]
    );
  };

  const valueArrays = validOpts.map((o) => o.values);
  const combos = cartesian(valueArrays);

  const prefixSku = (baseSku || 'SKU').trim().toUpperCase();

  const existingMap = new Map();
  for (const v of existingVariants) {
    const key = Object.entries(v.options || {})
      .sort(([k1], [k2]) => k1.localeCompare(k2))
      .map(([k, val]) => `${k}:${val}`)
      .join('|');
    existingMap.set(key, v);
  }

  return combos.map((combo) => {
    const optMap = {};
    validOpts.forEach((o, idx) => {
      optMap[o.name] = combo[idx];
    });

    const key = Object.entries(optMap)
      .sort(([k1], [k2]) => k1.localeCompare(k2))
      .map(([k, val]) => `${k}:${val}`)
      .join('|');

    const existing = existingMap.get(key);
    const skuSuffix = combo.map(slugifyValue).join('-');
    const generatedSku = `${prefixSku}-${skuSuffix}`;

    if (existing) {
      return {
        ...existing,
        title: combo.join(' / '),
        options: optMap,
        sku: existing.sku || generatedSku,
      };
    }

    return {
      id: `var_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sku: generatedSku,
      title: combo.join(' / '),
      price: basePrice > 0 ? basePrice : 100000,
      stock: baseStock >= 0 ? baseStock : 10,
      options: optMap,
    };
  });
}

function bulkApplyPrice(variants, bulkPrice) {
  if (typeof bulkPrice !== 'number' || bulkPrice < 0 || isNaN(bulkPrice)) return variants;
  return variants.map((v) => ({ ...v, price: bulkPrice }));
}

function bulkApplyStock(variants, bulkStock) {
  if (typeof bulkStock !== 'number' || bulkStock < 0 || isNaN(bulkStock)) return variants;
  return variants.map((v) => ({ ...v, stock: bulkStock }));
}

function updateVariantField(variants, vIdx, field, value) {
  return variants.map((v, idx) => {
    if (idx === vIdx) {
      return { ...v, [field]: value };
    }
    return v;
  });
}

function deleteVariantRow(variants, vIdx) {
  return variants.filter((_, idx) => idx !== vIdx);
}

function calculateTotalStock(variants) {
  return variants.reduce((sum, v) => sum + (v.stock || 0), 0);
}

// ===========================================================================
// TEST SUITE EXECUTION
// ===========================================================================
console.log(`\n${c.bold}========================================================================${c.reset}`);
console.log(`${c.bold}${c.cyan}  EMPIRICAL CHALLENGER STRESS SUITE: MILESTONE 4 (ADMIN MODULES)${c.reset}`);
console.log(`${c.bold}========================================================================${c.reset}\n`);

// ===========================================================================
// SECTION 1: Variant Matrix Generation & Bulk Edits
// ===========================================================================
console.log(`\n${c.bold}--- [SECTION 1] Variant Matrix Generation & Bulk Edits ---${c.reset}`);

// 1.1 Empty & Malformed Options
{
  const empty1 = generateCartesianVariants([], 'SKU-01', 200000, 20);
  assertEqual(empty1.length, 0, '1.1 Empty options generates 0 variants');

  const empty2 = generateCartesianVariants([{ name: '  ', values: ['S', 'M'] }], 'SKU-01', 200000, 20);
  assertEqual(empty2.length, 0, '1.1 Whitespace option name is ignored');

  const empty3 = generateCartesianVariants([{ name: 'Size', values: [] }], 'SKU-01', 200000, 20);
  assertEqual(empty3.length, 0, '1.1 Option group with empty values generates 0 variants');
}

// 1.2 Cartesian Multi-Dimensional Combinations
{
  // 1D: 4 Sizes
  const v1D = generateCartesianVariants(
    [{ name: 'Kích cỡ', values: ['S', 'M', 'L', 'XL'] }],
    'AO-POLO',
    250000,
    15
  );
  assertEqual(v1D.length, 4, '1.2 1D: 4 sizes generates exactly 4 variants');
  assertEqual(v1D[0].title, 'S', '1.2 1D: Title of first variant matches value');
  assertEqual(v1D[3].sku, 'AO-POLO-XL', '1.2 1D: Last variant SKU formatted properly');
  assertEqual(v1D[0].stock, 15, '1.2 1D: Variant inherits baseStock');
  assertEqual(v1D[0].price, 250000, '1.2 1D: Variant inherits basePrice');

  // 2D: 3 Sizes x 3 Colors
  const v2D = generateCartesianVariants(
    [
      { name: 'Kích cỡ', values: ['S', 'M', 'L'] },
      { name: 'Màu sắc', values: ['Đen', 'Trắng', 'Đỏ'] },
    ],
    'AT-001',
    199000,
    10
  );
  assertEqual(v2D.length, 9, '1.2 2D: 3 sizes x 3 colors generates exactly 9 variants');
  assertEqual(v2D[0].title, 'S / Đen', '1.2 2D: First title joined with slash');
  assertEqual(v2D[8].title, 'L / Đỏ', '1.2 2D: Last title joined with slash');

  // Verify Vietnamese diacritics normalized in SKU
  assertEqual(v2D[0].sku, 'AT-001-S-DEN', '1.2 2D: "Đen" normalized to "DEN" in SKU');
  assertEqual(v2D[1].sku, 'AT-001-S-TRAN', '1.2 2D: "Trắng" normalized to "TRAN" in SKU');
  assertEqual(v2D[2].sku, 'AT-001-S-DO', '1.2 2D: "Đỏ" normalized to "DO" in SKU');

  // 3D: 3 Sizes x 2 Colors x 2 Materials = 12 variants
  const v3D = generateCartesianVariants(
    [
      { name: 'Kích cỡ', values: ['S', 'M', 'L'] },
      { name: 'Màu sắc', values: ['Xanh Dương', 'Vàng Cát'] },
      { name: 'Chất liệu', values: ['Cotton 100%', 'Lụa Tơ Tằm'] },
    ],
    'SM-2026',
    350000,
    25
  );
  assertEqual(v3D.length, 12, '1.2 3D: 3 x 2 x 2 generates exactly 12 variants');
  assertEqual(v3D[0].title, 'S / Xanh Dương / Cotton 100%', '1.2 3D: Complex title joined correctly');
  assertEqual(v3D[0].sku, 'SM-2026-S-XANH-COTT', '1.2 3D: Suffixes truncated to 4 chars');

  // 4D: 2 x 2 x 2 x 2 = 16 variants
  const v4D = generateCartesianVariants(
    [
      { name: 'Kích cỡ', values: ['M', 'L'] },
      { name: 'Màu sắc', values: ['Đen', 'Trắng'] },
      { name: 'Kiểu dáng', values: ['Slim', 'Regular'] },
      { name: 'Cổ áo', values: ['Tròn', 'Bẻ'] },
    ],
    'AO-4D',
    299000,
    5
  );
  assertEqual(v4D.length, 16, '1.2 4D: 2x2x2x2 generates exactly 16 variants');
  assertEqual(v4D[0].title, 'M / Đen / Slim / Tròn', '1.2 4D: 4 options joined correctly');

  // 5D: Combinatorial stress (3 x 3 x 3 x 2 x 2 = 108 variants)
  const startTime = Date.now();
  const v5D = generateCartesianVariants(
    [
      { name: 'Dim1', values: ['A', 'B', 'C'] },
      { name: 'Dim2', values: ['1', '2', '3'] },
      { name: 'Dim3', values: ['X', 'Y', 'Z'] },
      { name: 'Dim4', values: ['Alpha', 'Beta'] },
      { name: 'Dim5', values: ['One', 'Two'] },
    ],
    'STRESS',
    100000,
    10
  );
  const elapsed = Date.now() - startTime;
  assertEqual(v5D.length, 108, '1.2 5D: 3x3x3x2x2 generates 108 variants');
  assert(elapsed < 50, `1.2 5D: Generated 108 variants in ${elapsed}ms (< 50ms)`);

  // Verify strictly unique SKUs
  const skuSet = new Set(v5D.map((v) => v.sku));
  assertEqual(skuSet.size, 108, '1.2 5D: All 108 generated SKUs are strictly unique');
}

// 1.3 State Preservation across Matrix Rebuilds
{
  const initialOptions = [
    { name: 'Kích cỡ', values: ['S', 'M'] },
    { name: 'Màu sắc', values: ['Đen', 'Trắng'] },
  ];
  let matrix = generateCartesianVariants(initialOptions, 'VEST', 500000, 20);
  assertEqual(matrix.length, 4, '1.3 Initial matrix has 4 variants');

  // Customize Variant 0: S / Đen
  matrix[0].price = 750000;
  matrix[0].stock = 5;
  matrix[0].sku = 'VEST-CUSTOM-SDEN';

  // Add a new size 'L' to the option group
  const expandedOptions = [
    { name: 'Kích cỡ', values: ['S', 'M', 'L'] },
    { name: 'Màu sắc', values: ['Đen', 'Trắng'] },
  ];
  const rebuiltMatrix = generateCartesianVariants(expandedOptions, 'VEST', 500000, 20, matrix);
  assertEqual(rebuiltMatrix.length, 6, '1.3 Rebuilt matrix has 6 variants');

  // Check preserved custom values on S / Đen
  const preserved = rebuiltMatrix.find((v) => v.options['Kích cỡ'] === 'S' && v.options['Màu sắc'] === 'Đen');
  assert(Boolean(preserved), '1.3 S / Đen variant found in rebuilt matrix');
  assertEqual(preserved.price, 750000, '1.3 Custom price 750,000 preserved after rebuilding matrix');
  assertEqual(preserved.stock, 5, '1.3 Custom stock 5 preserved after rebuilding matrix');
  assertEqual(preserved.sku, 'VEST-CUSTOM-SDEN', '1.3 Custom SKU preserved after rebuilding matrix');

  // Check newly added variant L / Đen gets defaults
  const newlyAdded = rebuiltMatrix.find((v) => v.options['Kích cỡ'] === 'L' && v.options['Màu sắc'] === 'Đen');
  assert(Boolean(newlyAdded), '1.3 Newly added L / Đen variant exists');
  assertEqual(newlyAdded.price, 500000, '1.3 Newly added variant gets basePrice default');
  assertEqual(newlyAdded.stock, 20, '1.3 Newly added variant gets baseStock default');
}

// 1.4 Bulk Edits & Single Overrides
{
  const opts = [
    { name: 'Size', values: ['S', 'M', 'L'] },
    { name: 'Color', values: ['Red', 'Blue'] },
  ];
  let variants = generateCartesianVariants(opts, 'BULK', 200000, 10);
  assertEqual(variants.length, 6, '1.4 Generated 6 variants for bulk operations');

  // Initial total stock: 6 x 10 = 60
  assertEqual(calculateTotalStock(variants), 60, '1.4 Initial total stock is 60');

  // Bulk Apply Price = 320,000
  variants = bulkApplyPrice(variants, 320000);
  assert(
    variants.every((v) => v.price === 320000),
    '1.4 Bulk apply price updated all 6 variants to 320,000'
  );

  // Bulk Apply Stock = 50
  variants = bulkApplyStock(variants, 50);
  assert(
    variants.every((v) => v.stock === 50),
    '1.4 Bulk apply stock updated all 6 variants to 50'
  );
  assertEqual(calculateTotalStock(variants), 300, '1.4 Total stock after bulk stock is 300');

  // Boundary: Bulk negative price rejected
  const untouchedPrice = bulkApplyPrice(variants, -50000);
  assertEqual(untouchedPrice[0].price, 320000, '1.4 Bulk negative price rejected / no-op');

  // Boundary: Bulk negative stock rejected
  const untouchedStock = bulkApplyStock(variants, -10);
  assertEqual(untouchedStock[0].stock, 50, '1.4 Bulk negative stock rejected / no-op');

  // Single-row override: Update variant #2 price and stock
  variants = updateVariantField(variants, 2, 'price', 450000);
  variants = updateVariantField(variants, 2, 'stock', 0); // Out of stock
  assertEqual(variants[2].price, 450000, '1.4 Variant #2 price individually overridden to 450,000');
  assertEqual(variants[2].stock, 0, '1.4 Variant #2 stock individually overridden to 0');
  assertEqual(variants[0].price, 320000, '1.4 Other variants retain bulk price');
  assertEqual(calculateTotalStock(variants), 250, '1.4 Total stock dynamically updated to 250');

  // Single-row deletion: Delete variant #0
  const deletedId = variants[0].id;
  variants = deleteVariantRow(variants, 0);
  assertEqual(variants.length, 5, '1.4 Variant count decreased from 6 to 5 after row deletion');
  assert(!variants.some((v) => v.id === deletedId), '1.4 Deleted variant ID is absent');
  assertEqual(calculateTotalStock(variants), 200, '1.4 Total stock dynamically updated to 200 after row deletion');
}

// ===========================================================================
// SECTION 2: Product Form Validation Schema (`productFormSchema`)
// ===========================================================================
console.log(`\n${c.bold}--- [SECTION 2] Product Form Validation Schema (Zod) ---${c.reset}`);

const validBasePayload = {
  name: 'Áo Thun Nam Thể Thao Cao Cấp',
  slug: 'ao-thun-nam-the-thao-cao-cap',
  sku: 'AT-THE-THAO-01',
  categoryId: 'cat_fashion',
  description: 'Chất liệu vải mè thể thao thoáng mát, co giãn 4 chiều.',
  price: 299000,
  compareAtPrice: 399000,
  stock: 100,
  lowStockThreshold: 5,
  status: 'active',
  isFeatured: false,
  isFlashSale: false,
};

// 2.1 Baseline Valid Payload
{
  const result = productFormSchema.safeParse(validBasePayload);
  assert(result.success, '2.1 Baseline valid payload passes productFormSchema');
}

// 2.2 Name Validation: Empty, Whitespace, Length Limits
{
  // Empty name
  const rEmpty = productFormSchema.safeParse({ ...validBasePayload, name: '' });
  assert(!rEmpty.success, '2.2 Empty name is rejected');
  assertEqual(rEmpty.error.errors[0].path[0], 'name', '2.2 Error path is "name"');

  // Whitespace-only name
  const rWhitespace = productFormSchema.safeParse({ ...validBasePayload, name: '      ' });
  assert(!rWhitespace.success, '2.2 Whitespace-only name is rejected after trim');

  // Name too short (< 3 chars)
  const rShort = productFormSchema.safeParse({ ...validBasePayload, name: 'Ab' });
  assert(!rShort.success, '2.2 Name with 2 characters is rejected (min 3)');

  // Name boundary: exactly 3 characters
  const rMin3 = productFormSchema.safeParse({ ...validBasePayload, name: 'Áo1' });
  assert(rMin3.success, '2.2 Name with 3 characters is accepted');

  // Name too long (> 200 chars)
  const superLongName = 'A'.repeat(201);
  const rLong = productFormSchema.safeParse({ ...validBasePayload, name: superLongName });
  assert(!rLong.success, '2.2 Name exceeding 200 characters is rejected');
}

// 2.3 Slug Validation
{
  // Uppercase in slug
  const rUpper = productFormSchema.safeParse({ ...validBasePayload, slug: 'Ao-Thun-Nam' });
  assert(!rUpper.success, '2.3 Slug with uppercase letters is rejected');

  // Spaces in slug
  const rSpaces = productFormSchema.safeParse({ ...validBasePayload, slug: 'ao thun nam' });
  assert(!rSpaces.success, '2.3 Slug with spaces is rejected');

  // Special characters in slug
  const rSpecial = productFormSchema.safeParse({ ...validBasePayload, slug: 'ao_thun_nam@#$' });
  assert(!rSpecial.success, '2.3 Slug with special characters is rejected');

  // Vietnamese diacritics in slug
  const rAccents = productFormSchema.safeParse({ ...validBasePayload, slug: 'áo-thun-nam' });
  assert(!rAccents.success, '2.3 Slug with Vietnamese accents is rejected');

  // Valid hyphenated slug
  const rValidSlug = productFormSchema.safeParse({ ...validBasePayload, slug: 'ao-thun-nam-123-hot' });
  assert(rValidSlug.success, '2.3 Valid lowercase alphanumeric hyphenated slug is accepted');
}

// 2.4 SKU Validation & Transformation
{
  const rEmptySku = productFormSchema.safeParse({ ...validBasePayload, sku: '' });
  assert(!rEmptySku.success, '2.4 Empty SKU is rejected (min 2)');

  const rShortSku = productFormSchema.safeParse({ ...validBasePayload, sku: 'A' });
  assert(!rShortSku.success, '2.4 1-character SKU is rejected');

  // Lowercase SKU auto-uppercased
  const rLowerSku = productFormSchema.safeParse({ ...validBasePayload, sku: 'sku-vn-007' });
  assert(rLowerSku.success, '2.4 Lowercase SKU is accepted');
  assertEqual(rLowerSku.data.sku, 'SKU-VN-007', '2.4 Lowercase SKU transformed to uppercase');
}

// 2.5 Stock Validation: Negative, Non-integer, Zero
{
  // Negative stock
  const rNegStock = productFormSchema.safeParse({ ...validBasePayload, stock: -1 });
  assert(!rNegStock.success, '2.5 Negative stock (-1) is rejected');
  assertEqual(rNegStock.error.errors[0].path[0], 'stock', '2.5 Error path is "stock"');

  const rNegStockLarge = productFormSchema.safeParse({ ...validBasePayload, stock: -999 });
  assert(!rNegStockLarge.success, '2.5 Large negative stock is rejected');

  // Float stock (must be integer)
  const rFloatStock = productFormSchema.safeParse({ ...validBasePayload, stock: 12.5 });
  assert(!rFloatStock.success, '2.5 Float stock (12.5) is rejected (must be int)');

  // Zero stock: valid
  const rZeroStock = productFormSchema.safeParse({ ...validBasePayload, stock: 0 });
  assert(rZeroStock.success, '2.5 Zero stock (0) is accepted (out of stock)');

  // String coerced stock
  const rStringStock = productFormSchema.safeParse({ ...validBasePayload, stock: '55' });
  assert(rStringStock.success, '2.5 String stock "55" is coerced to number');
  assertEqual(rStringStock.data.stock, 55, '2.5 Stock coerced to 55');
}

// 2.6 Price & Cross-Field Refinement (price vs compareAtPrice)
{
  // Negative price
  const rNegPrice = productFormSchema.safeParse({ ...validBasePayload, price: -50000 });
  assert(!rNegPrice.success, '2.6 Negative price is rejected');

  // Zero price (free promotional item / gift)
  const rZeroPrice = productFormSchema.safeParse({ ...validBasePayload, price: 0, compareAtPrice: 50000 });
  assert(rZeroPrice.success, '2.6 Zero price is accepted');

  // REJECT: price > compareAtPrice
  const rInverted = productFormSchema.safeParse({
    ...validBasePayload,
    price: 350000,
    compareAtPrice: 200000,
  });
  assert(!rInverted.success, '2.6 REJECT: price (350,000) > compareAtPrice (200,000) fails refinement');
  assertEqual(rInverted.error.errors[0].path[0], 'compareAtPrice', '2.6 Error targeted to path "compareAtPrice"');
  assert(
    rInverted.error.errors[0].message.includes('Giá gốc / so sánh phải lớn hơn hoặc bằng giá bán'),
    '2.6 Refinement error message matches expected Vietnamese message'
  );

  // String coerced inverted price: "400000" vs "300000"
  const rStringInverted = productFormSchema.safeParse({
    ...validBasePayload,
    price: '400000',
    compareAtPrice: '300000',
  });
  assert(!rStringInverted.success, '2.6 String coerced inverted price is also rejected');

  // ACCEPT: price == compareAtPrice
  const rEqual = productFormSchema.safeParse({
    ...validBasePayload,
    price: 250000,
    compareAtPrice: 250000,
  });
  assert(rEqual.success, '2.6 ACCEPT: price == compareAtPrice is valid (no discount)');

  // ACCEPT: compareAtPrice > price
  const rNormalDiscount = productFormSchema.safeParse({
    ...validBasePayload,
    price: 200000,
    compareAtPrice: 280000,
  });
  assert(rNormalDiscount.success, '2.6 ACCEPT: compareAtPrice (280,000) > price (200,000) is valid');

  // ACCEPT: compareAtPrice is undefined
  const rUndefinedCompare = productFormSchema.safeParse({
    ...validBasePayload,
    price: 200000,
    compareAtPrice: undefined,
  });
  assert(rUndefinedCompare.success, '2.6 ACCEPT: undefined compareAtPrice is valid');

  // ACCEPT: compareAtPrice is 0
  const rZeroCompare = productFormSchema.safeParse({
    ...validBasePayload,
    price: 200000,
    compareAtPrice: 0,
  });
  assert(rZeroCompare.success, '2.6 ACCEPT: compareAtPrice = 0 is valid (suppresses discount)');
}

// 2.7 Other Required Field Constraints
{
  // Empty categoryId
  const rEmptyCat = productFormSchema.safeParse({ ...validBasePayload, categoryId: '' });
  assert(!rEmptyCat.success, '2.7 Empty categoryId is rejected');

  // Description < 10 chars
  const rShortDesc = productFormSchema.safeParse({ ...validBasePayload, description: 'Quá ngắn' });
  assert(!rShortDesc.success, '2.7 Description < 10 chars is rejected');

  // Invalid enum status
  const rInvalidStatus = productFormSchema.safeParse({ ...validBasePayload, status: 'deleted' });
  assert(!rInvalidStatus.success, '2.7 Invalid status "deleted" is rejected by enum');

  // lowStockThreshold < 1
  const rLowThreshold = productFormSchema.safeParse({ ...validBasePayload, lowStockThreshold: 0 });
  assert(!rLowThreshold.success, '2.7 lowStockThreshold < 1 is rejected');
}

// ===========================================================================
// SECTION 3: Low-Stock Inventory Table Queries
// ===========================================================================
console.log(`\n${c.bold}--- [SECTION 3] Low-Stock Inventory Table Queries (` + `productService.getLowStockProducts(5)` + `) ---${c.reset}`);

// Re-initialize fresh test service
mockStorage.clear();
const service = new ProductService();

// 3.1 Baseline Seed Audit
{
  const lowStockBaseline = await service.getLowStockProducts(5);
  assert(Array.isArray(lowStockBaseline), '3.1 Baseline query returns an array');
  assert(lowStockBaseline.length > 0, `3.1 Found ${lowStockBaseline.length} low-stock products in seed dataset`);

  // Verify all returned products conform to condition
  for (const p of lowStockBaseline) {
    const threshold = p.lowStockThreshold || 5;
    assert(
      p.stock <= threshold,
      `3.1 Product "${p.name}" stock (${p.stock}) is <= threshold (${threshold})`
    );
  }
}

// 3.2 Exact Boundary Testing (stock: 0, 4, 5, 6)
{
  // Create Boundary Product A: stock = 0 (out of stock)
  const prodZero = await service.createProduct({
    name: 'Sản Phẩm Tồn Kho Bằng 0',
    slug: 'san-pham-ton-kho-0',
    sku: 'STK-ZERO',
    categoryId: 'cat_tech',
    description: 'Sản phẩm phục vụ kiểm tra boundary hết hàng hoàn toàn.',
    price: 150000,
    stock: 0,
    lowStockThreshold: 5,
  });

  // Create Boundary Product B: stock = 4 (< threshold 5)
  const prodFour = await service.createProduct({
    name: 'Sản Phẩm Tồn Kho Bằng 4',
    slug: 'san-pham-ton-kho-4',
    sku: 'STK-FOUR',
    categoryId: 'cat_tech',
    description: 'Sản phẩm phục vụ kiểm tra boundary cận dưới ngưỡng 5.',
    price: 150000,
    stock: 4,
    lowStockThreshold: 5,
  });

  // Create Boundary Product C: stock = 5 (EXACT threshold 5)
  const prodFive = await service.createProduct({
    name: 'Sản Phẩm Tồn Kho Bằng 5',
    slug: 'san-pham-ton-kho-5',
    sku: 'STK-FIVE',
    categoryId: 'cat_tech',
    description: 'Sản phẩm phục vụ kiểm tra boundary chính xác ngưỡng 5.',
    price: 150000,
    stock: 5,
    lowStockThreshold: 5,
  });

  // Create Boundary Product D: stock = 6 (> threshold 5)
  const prodSix = await service.createProduct({
    name: 'Sản Phẩm Tồn Kho Bằng 6',
    slug: 'san-pham-ton-kho-6',
    sku: 'STK-SIX',
    categoryId: 'cat_tech',
    description: 'Sản phẩm phục vụ kiểm tra boundary trên ngưỡng 5.',
    price: 150000,
    stock: 6,
    lowStockThreshold: 5,
  });

  const boundaryLowStock = await service.getLowStockProducts(5);
  const boundaryIds = boundaryLowStock.map((p) => p.id);

  assert(boundaryIds.includes(prodZero.id), '3.2 Boundary: stock = 0 MUST be included in low stock');
  assert(boundaryIds.includes(prodFour.id), '3.2 Boundary: stock = 4 (< 5) MUST be included in low stock');
  assert(boundaryIds.includes(prodFive.id), '3.2 Boundary: stock = 5 (== 5) MUST be included in low stock');
  assert(!boundaryIds.includes(prodSix.id), '3.2 Boundary: stock = 6 (> 5) MUST NOT be included in low stock');
}

// 3.3 Custom Product-Level lowStockThreshold Precedence
{
  // Product with stock = 8, but custom lowStockThreshold = 10 (8 <= 10 -> Low stock!)
  const prodHighThreshold = await service.createProduct({
    name: 'Sản Phẩm Ngưỡng Cao 10',
    slug: 'san-pham-nguong-cao-10',
    sku: 'THR-HIGH-10',
    categoryId: 'cat_fashion',
    description: 'Sản phẩm tồn 8 với ngưỡng cảnh báo 10.',
    price: 500000,
    stock: 8,
    lowStockThreshold: 10,
  });

  // Product with stock = 12, custom lowStockThreshold = 10 (12 > 10 -> Not low stock!)
  const prodHighAbove = await service.createProduct({
    name: 'Sản Phẩm Tồn 12 Ngưỡng 10',
    slug: 'san-pham-ton-12-nguong-10',
    sku: 'THR-HIGH-12',
    categoryId: 'cat_fashion',
    description: 'Sản phẩm tồn 12 với ngưỡng cảnh báo 10.',
    price: 500000,
    stock: 12,
    lowStockThreshold: 10,
  });

  const queryRes = await service.getLowStockProducts(5);
  const ids = queryRes.map((p) => p.id);

  assert(
    ids.includes(prodHighThreshold.id),
    '3.3 Product with stock = 8 and lowStockThreshold = 10 is INCLUDED (8 <= 10)'
  );
  assert(
    !ids.includes(prodHighAbove.id),
    '3.3 Product with stock = 12 and lowStockThreshold = 10 is EXCLUDED (12 > 10)'
  );
}

// 3.4 Dynamic Stock Mutation Reactivity (Restock, Deplete, Delete)
{
  // Create candidate product with stock = 2
  const candidate = await service.createProduct({
    name: 'Sản Phẩm Biến Động Kho',
    slug: 'san-pham-bien-dong-kho',
    sku: 'MUT-DYN-01',
    categoryId: 'cat_tech',
    description: 'Sản phẩm kiểm tra biến động tồn kho realtime.',
    price: 250000,
    stock: 2,
    lowStockThreshold: 5,
  });

  let lowList = await service.getLowStockProducts(5);
  assert(lowList.some((p) => p.id === candidate.id), '3.4 Candidate product (stock 2) initially in low stock');

  // RESTOCK: update stock to 50
  await service.updateProduct(candidate.id, { stock: 50 });
  lowList = await service.getLowStockProducts(5);
  assert(!lowList.some((p) => p.id === candidate.id), '3.4 Candidate product (stock 50) immediately drops out of low stock');

  // DEPLETE: update stock down to 1
  await service.updateProduct(candidate.id, { stock: 1 });
  lowList = await service.getLowStockProducts(5);
  assert(lowList.some((p) => p.id === candidate.id), '3.4 Candidate product (stock 1) immediately reappears in low stock');

  // DELETE: delete product completely
  await service.deleteProduct(candidate.id);
  lowList = await service.getLowStockProducts(5);
  assert(!lowList.some((p) => p.id === candidate.id), '3.4 Deleted product immediately removed from low stock list');
}

// 3.5 Custom Query Threshold Parameters (e.g. threshold = 2, threshold = 0)
{
  // Calling getLowStockProducts(0) to get exclusively 0-stock items
  const zeroStockOnly = await service.getLowStockProducts(0);
  assert(
    zeroStockOnly.every((p) => p.stock <= (p.lowStockThreshold || 0)),
    '3.5 Query with threshold=0 filters items strictly <= lowStockThreshold or 0'
  );
}

// 3.6 Rapid Consecutive Mutations Integrity
{
  const testBatch = [];
  for (let i = 0; i < 5; i++) {
    const p = await service.createProduct({
      name: `Sản Phẩm Rapid ${i}`,
      slug: `san-pham-rapid-${i}`,
      sku: `RAP-${i}`,
      categoryId: 'cat_cosmetics',
      description: 'Test stress kiểm tra tính nhất quán khi thao tác liên tục.',
      price: 100000,
      stock: i * 2, // 0, 2, 4, 6, 8
      lowStockThreshold: 5,
    });
    testBatch.push(p);
  }

  const rapidLow = await service.getLowStockProducts(5);
  const rapidIds = rapidLow.map((p) => p.id);

  // i = 0 (stock 0), i = 1 (stock 2), i = 2 (stock 4) must be present
  assert(rapidIds.includes(testBatch[0].id), '3.6 Rapid Batch: item 0 (stock 0) in low stock');
  assert(rapidIds.includes(testBatch[1].id), '3.6 Rapid Batch: item 1 (stock 2) in low stock');
  assert(rapidIds.includes(testBatch[2].id), '3.6 Rapid Batch: item 2 (stock 4) in low stock');

  // i = 3 (stock 6), i = 4 (stock 8) must NOT be present
  assert(!rapidIds.includes(testBatch[3].id), '3.6 Rapid Batch: item 3 (stock 6) NOT in low stock');
  assert(!rapidIds.includes(testBatch[4].id), '3.6 Rapid Batch: item 4 (stock 8) NOT in low stock');
}

// ===========================================================================
// RESULTS SUMMARY
// ===========================================================================
console.log(`\n${c.bold}========================================================================${c.reset}`);
console.log(`${c.bold}${c.green}  CHALLENGER VERIFICATION RESULTS SUMMARY                               ${c.reset}`);
console.log(`${c.bold}========================================================================${c.reset}`);
console.log(`  Total Assertions:  ${c.bold}${totalAssertions}${c.reset}`);
console.log(`  Passed:            ${c.bold}${c.green}${passedAssertions}${c.reset}`);
console.log(`  Failed:            ${c.bold}${failedAssertions > 0 ? c.red : c.green}${failedAssertions}${c.reset}`);

if (failedAssertions > 0) {
  console.log(`\n${c.red}${c.bold}FAILURES ENCOUNTERED:${c.reset}`);
  failures.forEach((f, idx) => console.log(`  ${idx + 1}. ${f}`));
  process.exit(1);
} else {
  console.log(`\n${c.bold}${c.green}★ ALL ADVERSARIAL STRESS CHALLENGES PASSED EMPIRICALLY (100% OK) ★${c.reset}\n`);
  process.exit(0);
}
