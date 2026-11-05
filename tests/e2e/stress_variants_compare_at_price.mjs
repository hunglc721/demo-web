#!/usr/bin/env node
/**
 * ============================================================================
 * EMPIRICAL CHALLENGER STRESS SUITE: MILESTONE 3 ITERATION 2
 * Focus: Product Variant Creation & compareAtPrice Handling
 *
 * File: tests/e2e/stress_variants_compare_at_price.mjs
 * Author: challenger_m3_it2_2 (Adversarial Empirical Challenger)
 * ============================================================================
 *
 * Stress-tests:
 * 1. Product & ProductVariant type contracts and schema invariants
 * 2. Variant matrix generator algorithm (Cartesian product, combinatorial limits,
 *    Vietnamese diacritics, SKU generation, stock distribution, title synthesis)
 * 3. End-to-end LocalStorage DAL persistence of variants and options
 * 4. compareAtPrice handling (normal discount, equal prices, inverted prices,
 *    zero values, omitted fallbacks, string coercion, variant-level compareAtPrice)
 * 5. Form payload simulation and round-trip integrity through productService
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
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
  bgRed: '\x1b[41m\x1b[37m',
  bgGreen: '\x1b[42m\x1b[30m',
};

// ---------------------------------------------------------------------------
// 1. Mock LocalStorage Environment
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
// 3. Dynamic Bundle & Load of Services and Utils
// ---------------------------------------------------------------------------
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

async function loadServices() {
  const tempBundle = path.join(__dirname, `temp_stress_m3_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.mjs`);
  tempFiles.add(tempBundle);

  esbuild.buildSync({
    stdin: {
      contents: `
        export * from '@/services/index';
        export * from '@/utils/formatters';
      `,
      resolveDir: ROOT_DIR,
      sourcefile: 'entry.ts',
      loader: 'ts',
    },
    bundle: true,
    write: true,
    outfile: tempBundle,
    format: 'esm',
    alias: { '@': path.join(ROOT_DIR, 'src') },
    external: ['react', 'react-dom', 'zustand'],
  });

  const fileUrl = new URL(`file://${tempBundle.replace(/\\/g, '/')}`);
  return await import(fileUrl.href);
}

// Cartesian helper matching ProductFormPage implementation
function generateFormVariants(options, baseSku, basePrice, baseStock) {
  if (options.length === 0) return [];

  const cartesian = (arrays) => {
    return arrays.reduce(
      (acc, curr) => acc.flatMap((a) => curr.map((c) => [...a, c])),
      [[]]
    );
  };

  const cleanValuesArrays = options.map((opt) =>
    opt.values.map((v) => (typeof v === 'string' ? v.trim() : v)).filter(Boolean)
  );

  // If any option has 0 valid values, combinations is empty
  if (cleanValuesArrays.some((vals) => vals.length === 0)) return [];

  const combinations = cartesian(cleanValuesArrays);

  return combinations.map((combo, idx) => {
    const optionMap = {};
    options.forEach((opt, oIdx) => {
      optionMap[opt.name] = combo[oIdx];
    });

    const comboSku = `${baseSku || 'SKU'}-${combo.join('-').toUpperCase()}`;

    return {
      id: `var_test_${Date.now()}_${idx}`,
      sku: comboSku,
      title: combo.join(' / '),
      options: optionMap,
      price: basePrice,
      stock: Math.floor(baseStock / combinations.length) || 10,
    };
  });
}

// ---------------------------------------------------------------------------
// 4. Main Stress Runner
// ---------------------------------------------------------------------------
async function runStressSuite() {
  console.log(`${c.bold}${c.cyan}========================================================================${c.reset}`);
  console.log(`${c.bold}${c.cyan}  EMPIRICAL CHALLENGER STRESS SUITE: VARIANTS & COMPARE_AT_PRICE       ${c.reset}`);
  console.log(`${c.bold}${c.cyan}========================================================================${c.reset}\n`);

  const { productService, systemService, formatCurrencyVND } = await loadServices();

  // Reset to clean seed data
  await systemService.resetDemoData();

  // =========================================================================
  // SECTION 1: Product Variant Cartesian Matrix Generator Stress Testing
  // =========================================================================
  console.log(`\n${c.bold}${c.yellow}--- [SECTION 1] Variant Matrix Generator Stress Testing ---${c.reset}`);

  // 1.1 Empty options
  const emptyRes = generateFormVariants([], 'POLO', 199000, 50);
  assertEqual(emptyRes.length, 0, '1.1 Empty options generates 0 variants without errors');

  // 1.2 Single option with 1 value
  const singleOptRes = generateFormVariants(
    [{ name: 'Kích cỡ', values: ['Freesize'] }],
    'AO-01',
    150000,
    40
  );
  assertEqual(singleOptRes.length, 1, '1.2 Single option with 1 value generates exactly 1 variant');
  assertEqual(singleOptRes[0].sku, 'AO-01-FREESIZE', '1.2 Variant SKU correctly formed');
  assertEqual(singleOptRes[0].title, 'Freesize', '1.2 Variant title matches single value');
  assertEqual(singleOptRes[0].options['Kích cỡ'], 'Freesize', '1.2 Option map accurately bound');
  assertEqual(singleOptRes[0].stock, 40, '1.2 Full stock allocated when 1 variant');

  // 1.3 Single option with 8 values
  const multiValueRes = generateFormVariants(
    [{ name: 'Màu', values: ['Đỏ', 'Cam', 'Vàng', 'Lục', 'Lam', 'Chàm', 'Tím', 'Trắng'] }],
    'VAY',
    250000,
    80
  );
  assertEqual(multiValueRes.length, 8, '1.3 Single option with 8 values generates exactly 8 variants');
  assertEqual(multiValueRes[0].stock, 10, '1.3 80 stock divided across 8 variants yields 10 each');

  // 1.4 Dual options Cartesian (3 sizes x 2 colors = 6)
  const dualOptRes = generateFormVariants(
    [
      { name: 'Kích cỡ', values: ['S', 'M', 'L'] },
      { name: 'Màu sắc', values: ['Đen', 'Trắng'] },
    ],
    'SM-01',
    350000,
    60
  );
  assertEqual(dualOptRes.length, 6, '1.4 (3 sizes x 2 colors) generates exactly 6 variants');
  assertEqual(dualOptRes[0].title, 'S / Đen', '1.4 Variant 0 title is "S / Đen"');
  assertEqual(dualOptRes[1].title, 'S / Trắng', '1.4 Variant 1 title is "S / Trắng"');
  assertEqual(dualOptRes[2].title, 'M / Đen', '1.4 Variant 2 title is "M / Đen"');
  assertEqual(dualOptRes[5].title, 'L / Trắng', '1.4 Variant 5 title is "L / Trắng"');
  assertEqual(dualOptRes[0].options['Kích cỡ'], 'S', '1.4 Option Kích cỡ bound');
  assertEqual(dualOptRes[0].options['Màu sắc'], 'Đen', '1.4 Option Màu sắc bound');
  assertEqual(dualOptRes[0].stock, 10, '1.4 60 stock / 6 variants = 10 each');

  // 1.5 Triple options Cartesian (3 x 2 x 2 = 12)
  const tripleOptRes = generateFormVariants(
    [
      { name: 'Kích cỡ', values: ['M', 'L', 'XL'] },
      { name: 'Màu sắc', values: ['Xanh Navy', 'Ghi Sáng'] },
      { name: 'Chất liệu', values: ['Cotton 100%', 'Pima Cao Cấp'] },
    ],
    'POLO-PREMIUM',
    450000,
    120
  );
  assertEqual(tripleOptRes.length, 12, '1.5 Triple options generates 12 variants');
  assertEqual(tripleOptRes[0].title, 'M / Xanh Navy / Cotton 100%', '1.5 Triple combo title accurately joined');
  assertEqual(tripleOptRes[0].sku, 'POLO-PREMIUM-M-XANH NAVY-COTTON 100%', '1.5 Triple SKU accurately synthesized');

  // 1.6 High combinatorial dimension stress (4 options: 4 x 3 x 2 x 2 = 48 variants)
  const start48 = Date.now();
  const res48 = generateFormVariants(
    [
      { name: 'Size', values: ['S', 'M', 'L', 'XL'] },
      { name: 'Color', values: ['Red', 'Blue', 'Black'] },
      { name: 'Collar', values: ['Crew', 'V-Neck'] },
      { name: 'Fit', values: ['Slim', 'Regular'] },
    ],
    'TEE',
    200000,
    480
  );
  const dur48 = Date.now() - start48;
  assertEqual(res48.length, 48, '1.6 4-dimensional option tree generates 48 variants');
  assert(dur48 < 50, `1.6 48 variants generated in ${dur48}ms (< 50ms)`);

  // 1.7 Extreme combinatorial stress: 5 options of 3 values each (3^5 = 243 variants)
  const start243 = Date.now();
  const res243 = generateFormVariants(
    [
      { name: 'O1', values: ['A', 'B', 'C'] },
      { name: 'O2', values: ['D', 'E', 'F'] },
      { name: 'O3', values: ['G', 'H', 'I'] },
      { name: 'O4', values: ['J', 'K', 'L'] },
      { name: 'O5', values: ['M', 'N', 'P'] },
    ],
    'STRESS',
    100000,
    2430
  );
  const dur243 = Date.now() - start243;
  assertEqual(res243.length, 243, '1.7 5-dimensional option tree generates 243 variants without recursion limit');
  assert(dur243 < 100, `1.7 243 variants generated in ${dur243}ms (< 100ms)`);
  assertEqual(res243[0].stock, 10, '1.7 2430 stock / 243 variants = 10 each');

  // 1.8 Uniqueness of SKU across all 243 generated variants
  const skuSet = new Set(res243.map((v) => v.sku));
  assertEqual(skuSet.size, 243, '1.8 All 243 generated variant SKUs are strictly unique');

  // 1.9 Vietnamese Diacritics & Special Characters Stress
  const vnOptRes = generateFormVariants(
    [
      { name: 'Kích cỡ', values: ['Size Lỡ (55-65kg)', 'Size Đại (>75kg)'] },
      { name: 'Màu sắc', values: ['Xanh lá chuối non / Dạ quang', 'Đỏ bordeaux viền ánh kim'] },
    ],
    'VN-DIACRITIC',
    399000,
    20
  );
  assertEqual(vnOptRes.length, 4, '1.9 Vietnamese diacritics and complex descriptions generate 4 variants');
  assert(vnOptRes[0].title.includes('Xanh lá chuối non / Dạ quang'), '1.9 Vietnamese diacritics preserved in title');
  assertEqual(vnOptRes[0].options['Màu sắc'], 'Xanh lá chuối non / Dạ quang', '1.9 Full diacritic string preserved in optionMap');

  // 1.10 Stock boundary edge cases
  const zeroStockRes = generateFormVariants(
    [{ name: 'Size', values: ['S', 'M'] }],
    'ZERO',
    100000,
    0
  );
  assertEqual(zeroStockRes[0].stock, 10, '1.10 Stock 0 falls back to default 10 per variant');

  const lowStockRes = generateFormVariants(
    [{ name: 'Size', values: ['S', 'M', 'L', 'XL'] }],
    'LOW',
    100000,
    2
  );
  assertEqual(lowStockRes[0].stock, 10, '1.10 Stock 2 (< 4) falls back to default 10 per variant');

  // =========================================================================
  // SECTION 2: End-to-End DAL Product CRUD with Variants Persistence
  // =========================================================================
  console.log(`\n${c.bold}${c.yellow}--- [SECTION 2] LocalStorage DAL Product CRUD with Variants ---${c.reset}`);

  // 2.1 Create new product with 6 variants in productService
  const newProductPayload = {
    name: 'Áo Polo Thể Thao Pro Active Challenger',
    slug: 'ao-polo-the-thao-pro-active-challenger',
    sku: 'POLO-PRO-01',
    categoryId: 'cat_thoi_trang',
    description: 'Chất vải thun lạnh co giãn 4 chiều kháng khuẩn',
    price: 289000,
    compareAtPrice: 399000,
    originalPrice: 399000,
    stock: 120,
    lowStockThreshold: 5,
    status: 'active',
    images: ['https://images.unsplash.com/photo-polo-challenger.jpg'],
    tags: ['hot', 'sale', 'challenger-test'],
    options: [
      { name: 'Kích cỡ', values: ['M', 'L', 'XL'] },
      { name: 'Màu sắc', values: ['Đen Phantom', 'Xanh Navy'] },
    ],
    variants: [
      {
        id: 'var_test_m_blk',
        sku: 'POLO-PRO-01-M-BLK',
        title: 'M / Đen Phantom',
        price: 289000,
        compareAtPrice: 399000,
        originalPrice: 399000,
        stock: 20,
        options: { 'Kích cỡ': 'M', 'Màu sắc': 'Đen Phantom' },
      },
      {
        id: 'var_test_m_nvy',
        sku: 'POLO-PRO-01-M-NVY',
        title: 'M / Xanh Navy',
        price: 289000,
        compareAtPrice: 399000,
        originalPrice: 399000,
        stock: 20,
        options: { 'Kích cỡ': 'M', 'Màu sắc': 'Xanh Navy' },
      },
      {
        id: 'var_test_l_blk',
        sku: 'POLO-PRO-01-L-BLK',
        title: 'L / Đen Phantom',
        price: 289000,
        compareAtPrice: 399000,
        originalPrice: 399000,
        stock: 20,
        options: { 'Kích cỡ': 'L', 'Màu sắc': 'Đen Phantom' },
      },
      {
        id: 'var_test_l_nvy',
        sku: 'POLO-PRO-01-L-NVY',
        title: 'L / Xanh Navy',
        price: 289000,
        compareAtPrice: 399000,
        originalPrice: 399000,
        stock: 0, // Out of stock variant edge case
        options: { 'Kích cỡ': 'L', 'Màu sắc': 'Xanh Navy' },
      },
      {
        id: 'var_test_xl_blk',
        sku: 'POLO-PRO-01-XL-BLK',
        title: 'XL / Đen Phantom',
        price: 309000, // Price differential on larger size
        compareAtPrice: 429000,
        originalPrice: 429000,
        stock: 20,
        options: { 'Kích cỡ': 'XL', 'Màu sắc': 'Đen Phantom' },
      },
      {
        id: 'var_test_xl_nvy',
        sku: 'POLO-PRO-01-XL-NVY',
        title: 'XL / Xanh Navy',
        price: 309000,
        compareAtPrice: 429000,
        originalPrice: 429000,
        stock: 40,
        options: { 'Kích cỡ': 'XL', 'Màu sắc': 'Xanh Navy' },
      },
    ],
  };

  const createdProduct = await productService.createProduct(newProductPayload);
  assert(Boolean(createdProduct && createdProduct.id), '2.1 Product created with generated ID');
  assertEqual(createdProduct.variants.length, 6, '2.1 Created product has exactly 6 variants');

  // 2.2 Re-fetch created product by ID from fresh storage cache
  const fetchedProduct = await productService.getProductById(createdProduct.id);
  assert(Boolean(fetchedProduct), '2.2 Successfully fetched created product by ID');
  assertEqual(fetchedProduct.variants.length, 6, '2.2 Fetched product preserved all 6 variants');
  assertEqual(fetchedProduct.variants[3].stock, 0, '2.2 Out-of-stock variant preserved with stock 0');
  assertEqual(fetchedProduct.variants[4].price, 309000, '2.2 Variant with differential price (309,000) preserved');
  assertEqual(fetchedProduct.variants[4].compareAtPrice, 429000, '2.2 Variant compareAtPrice (429,000) preserved');
  assertEqual(fetchedProduct.variants[4].title, 'XL / Đen Phantom', '2.2 Variant title preserved');

  // 2.3 Fetch product by slug
  const fetchedBySlug = await productService.getProductBySlug('ao-polo-the-thao-pro-active-challenger');
  assert(Boolean(fetchedBySlug), '2.3 Product found by slug');
  assertEqual(fetchedBySlug.id, createdProduct.id, '2.3 Slug search resolved to identical entity');
  assertEqual(fetchedBySlug.variants.length, 6, '2.3 Slug query retains all variants');

  // 2.4 Update variants: modify individual variant's stock and price
  const updatedVariants = [...fetchedProduct.variants];
  updatedVariants[3] = {
    ...updatedVariants[3],
    stock: 50, // Restocked
    price: 279000, // Discounted
  };

  const updatedProduct = await productService.updateProduct(createdProduct.id, {
    variants: updatedVariants,
  });
  assertEqual(updatedProduct.variants[3].stock, 50, '2.4 Variant 3 successfully restocked to 50');
  assertEqual(updatedProduct.variants[3].price, 279000, '2.4 Variant 3 price successfully updated to 279,000');

  // 2.5 Add a new variant dynamically
  const addedVariants = [
    ...updatedProduct.variants,
    {
      id: 'var_test_xxl_blk',
      sku: 'POLO-PRO-01-XXL-BLK',
      title: 'XXL / Đen Phantom',
      price: 329000,
      compareAtPrice: 450000,
      stock: 15,
      options: { 'Kích cỡ': 'XXL', 'Màu sắc': 'Đen Phantom' },
    },
  ];

  const productWith7Variants = await productService.updateProduct(createdProduct.id, {
    variants: addedVariants,
  });
  assertEqual(productWith7Variants.variants.length, 7, '2.5 Variant list grew from 6 to 7');
  assertEqual(productWith7Variants.variants[6].sku, 'POLO-PRO-01-XXL-BLK', '2.5 New variant correctly appended');

  // 2.6 Delete a variant dynamically
  const filteredVariants = productWith7Variants.variants.filter((v) => v.id !== 'var_test_m_blk');
  const productWith6Variants = await productService.updateProduct(createdProduct.id, {
    variants: filteredVariants,
  });
  assertEqual(productWith6Variants.variants.length, 6, '2.6 Variant successfully deleted (back to 6)');
  assert(!productWith6Variants.variants.some((v) => v.id === 'var_test_m_blk'), '2.6 Deleted variant ID no longer present');

  // =========================================================================
  // SECTION 3: compareAtPrice Form Validation, Logic & Edge Cases
  // =========================================================================
  console.log(`\n${c.bold}${c.yellow}--- [SECTION 3] compareAtPrice Form Handling & Boundary Edge Cases ---${c.reset}`);

  // Form simulation: helper checking whether strikethrough original price renders
  function shouldRenderOriginalPrice(product) {
    const originalOrCompare = product.compareAtPrice || product.originalPrice || 0;
    return Boolean((product.compareAtPrice || product.originalPrice) && originalOrCompare > product.price);
  }

  function calculateDiscountPercent(product) {
    const original = product.compareAtPrice || product.originalPrice || 0;
    if (original <= product.price || original === 0) return 0;
    return Math.round(((original - product.price) / original) * 100);
  }

  // 3.1 Normal discount case: compareAtPrice > price
  const normalDiscountProduct = {
    name: 'Áo Thun Cơ Bản',
    price: 150000,
    compareAtPrice: 200000,
    originalPrice: 200000,
  };
  assert(shouldRenderOriginalPrice(normalDiscountProduct), '3.1 Normal discount renders strikethrough price');
  assertEqual(calculateDiscountPercent(normalDiscountProduct), 25, '3.1 Normal discount calculates exactly 25%');

  // 3.2 Equal prices: compareAtPrice === price (no discount)
  const equalPriceProduct = {
    name: 'Áo Thun Không Giảm',
    price: 200000,
    compareAtPrice: 200000,
    originalPrice: 200000,
  };
  assert(!shouldRenderOriginalPrice(equalPriceProduct), '3.2 Equal prices does NOT render strikethrough price');
  assertEqual(calculateDiscountPercent(equalPriceProduct), 0, '3.2 Equal prices yields 0% discount');

  // 3.3 Inverted pricing edge case: compareAtPrice < price (e.g. price increased)
  const invertedPriceProduct = {
    name: 'Áo Tăng Giá',
    price: 250000,
    compareAtPrice: 200000,
    originalPrice: 200000,
  };
  assert(!shouldRenderOriginalPrice(invertedPriceProduct), '3.3 Inverted pricing (original < price) suppresses strikethrough');
  assertEqual(calculateDiscountPercent(invertedPriceProduct), 0, '3.3 Inverted pricing yields 0% discount');

  // 3.4 Backward compatibility: only originalPrice present (no compareAtPrice)
  const legacyProduct = {
    name: 'Sản Phẩm Cũ',
    price: 180000,
    originalPrice: 240000,
  };
  assert(shouldRenderOriginalPrice(legacyProduct), '3.4 Legacy product with only originalPrice triggers strikethrough');
  assertEqual(calculateDiscountPercent(legacyProduct), 25, '3.4 Legacy product calculates 25% discount');

  // 3.5 compareAtPrice present, originalPrice undefined
  const modernProduct = {
    name: 'Sản Phẩm Mới',
    price: 300000,
    compareAtPrice: 400000,
  };
  assert(shouldRenderOriginalPrice(modernProduct), '3.5 Product with only compareAtPrice triggers strikethrough');
  assertEqual(calculateDiscountPercent(modernProduct), 25, '3.5 Product calculates 25% discount');

  // 3.6 Zero compareAtPrice
  const zeroCompareProduct = {
    name: 'Sản Phẩm Giá Gốc 0',
    price: 150000,
    compareAtPrice: 0,
    originalPrice: 0,
  };
  assert(!shouldRenderOriginalPrice(zeroCompareProduct), '3.6 Zero compareAtPrice suppresses strikethrough');
  assertEqual(calculateDiscountPercent(zeroCompareProduct), 0, '3.6 Zero compareAtPrice yields 0% discount');

  // 3.7 Form submit simulation: string numeric coercion
  // In HTML form inputs: e.target.value is a string "250000"
  const formRawInput = {
    priceInput: "199000",
    compareAtPriceInput: "299000",
    stockInput: "50",
  };
  const coercedPayload = {
    price: Number(formRawInput.priceInput),
    compareAtPrice: Number(formRawInput.compareAtPriceInput),
    originalPrice: Number(formRawInput.compareAtPriceInput),
    stock: Number(formRawInput.stockInput),
  };
  assertEqual(typeof coercedPayload.price, 'number', '3.7 Coerced price is numeric');
  assertEqual(typeof coercedPayload.compareAtPrice, 'number', '3.7 Coerced compareAtPrice is numeric');
  assertEqual(coercedPayload.compareAtPrice, 299000, '3.7 Value parsed accurately');

  // 3.8 High-value luxury/tech pricing formatting
  const highValueProduct = {
    name: 'Laptop Gaming Cao Cấp',
    price: 45000000,
    compareAtPrice: 55000000,
    originalPrice: 55000000,
  };
  assert(shouldRenderOriginalPrice(highValueProduct), '3.8 High-value item triggers strikethrough');
  assertEqual(formatCurrencyVND(highValueProduct.price), '45.000.000\u00a0₫', '3.8 45M VND formatted properly');
  assertEqual(formatCurrencyVND(highValueProduct.compareAtPrice), '55.000.000\u00a0₫', '3.8 55M VND compareAtPrice formatted properly');
  assertEqual(calculateDiscountPercent(highValueProduct), 18, '3.8 Discount rounds to 18%');

  // 3.9 End-to-end Form round-trip creation with compareAtPrice
  const formCreatedProduct = await productService.createProduct({
    name: 'Giày Thể Thao Sneaker Nitro Runner',
    slug: 'giay-the-thao-sneaker-nitro-runner',
    sku: 'SNK-NITRO-01',
    categoryId: 'cat_thoi_trang',
    description: 'Đế đệm khí êm ái, bám đường tuyệt đối',
    price: 890000,
    compareAtPrice: 1250000,
    originalPrice: 1250000,
    stock: 35,
    status: 'active',
    tags: ['new', 'hot'],
    images: ['https://images.unsplash.com/photo-sneaker.jpg'],
    options: [{ name: 'Size', values: ['39', '40', '41', '42'] }],
    variants: [
      { id: 'v_39', sku: 'SNK-39', title: 'Size 39', price: 890000, compareAtPrice: 1250000, stock: 10, options: { Size: '39' } },
      { id: 'v_40', sku: 'SNK-40', title: 'Size 40', price: 890000, compareAtPrice: 1250000, stock: 15, options: { Size: '40' } },
      { id: 'v_41', sku: 'SNK-41', title: 'Size 41', price: 890000, compareAtPrice: 1250000, stock: 10, options: { Size: '41' } },
    ],
  });

  const reloaded = await productService.getProductById(formCreatedProduct.id);
  assert(Boolean(reloaded), '3.9 Product loaded after form creation');
  assertEqual(reloaded.compareAtPrice, 1250000, '3.9 Root compareAtPrice preserved across storage');
  assertEqual(reloaded.originalPrice, 1250000, '3.9 Root originalPrice preserved across storage');
  assertEqual(reloaded.variants[0].compareAtPrice, 1250000, '3.9 Variant compareAtPrice preserved across storage');

  // 3.10 Form Edit round-trip: user updates price and compareAtPrice
  const updatedPricingProduct = await productService.updateProduct(formCreatedProduct.id, {
    price: 790000, // Price slashed further
    compareAtPrice: 1250000,
    originalPrice: 1250000,
  });
  assertEqual(updatedPricingProduct.price, 790000, '3.10 Product price updated to 790,000');
  assertEqual(updatedPricingProduct.compareAtPrice, 1250000, '3.10 compareAtPrice maintained at 1,250,000');
  assertEqual(calculateDiscountPercent(updatedPricingProduct), 37, '3.10 Slashed price yields 37% discount');

  // =========================================================================
  // SECTION 4: Storage Quota & Serialization Resilience with Large Variant Trees
  // =========================================================================
  console.log(`\n${c.bold}${c.yellow}--- [SECTION 4] Storage Quota & Serialization Resilience ---${c.reset}`);

  // 4.1 Generate a mega product with 60 variants
  const megaVariants = generateFormVariants(
    [
      { name: 'Kích cỡ', values: ['XS', 'S', 'M', 'L', 'XL'] }, // 5
      { name: 'Màu sắc', values: ['Đen', 'Trắng', 'Đỏ', 'Xanh'] }, // 4
      { name: 'Phiên bản', values: ['Tiêu chuẩn', 'Cao cấp', 'Giới hạn'] }, // 3
    ],
    'MEGA',
    500000,
    600
  );
  assertEqual(megaVariants.length, 60, '4.1 5 x 4 x 3 generates exactly 60 variants');

  // 4.2 Save mega product into productService
  const megaProduct = await productService.createProduct({
    name: 'Mega Collection Master Shirt',
    slug: 'mega-collection-master-shirt',
    sku: 'MEGA-MASTER-01',
    categoryId: 'cat_thoi_trang',
    description: 'Sản phẩm thử nghiệm tải lớn với 60 biến thể đầy đủ',
    price: 500000,
    compareAtPrice: 750000,
    originalPrice: 750000,
    stock: 600,
    status: 'active',
    tags: ['featured'],
    images: ['https://images.unsplash.com/mega.jpg'],
    options: [
      { name: 'Kích cỡ', values: ['XS', 'S', 'M', 'L', 'XL'] },
      { name: 'Màu sắc', values: ['Đen', 'Trắng', 'Đỏ', 'Xanh'] },
      { name: 'Phiên bản', values: ['Tiêu chuẩn', 'Cao cấp', 'Giới hạn'] },
    ],
    variants: megaVariants,
  });

  const reloadedMega = await productService.getProductById(megaProduct.id);
  assert(Boolean(reloadedMega), '4.2 Mega product successfully persisted and retrieved');
  assertEqual(reloadedMega.variants.length, 60, '4.2 All 60 variants retained in storage');

  // 4.3 Check storage usage remains well within 5MB quota
  const storageRaw = mockStorage.getItem('d2c_ecommerce:products:v1');
  assert(Boolean(storageRaw), '4.3 Storage key d2c_ecommerce:products:v1 exists');
  const bytesUsed = storageRaw.length * 2;
  assert(bytesUsed < 1024 * 1024, `4.3 Products collection with 60 variants consumes ${Math.round(bytesUsed / 1024)}KB (< 1MB)`);

  // 4.4 Factory reset wipes custom variants cleanly and restores baseline seeds
  await systemService.resetDemoData();
  const resetProdCheck = await productService.getProductById(megaProduct.id);
  assertEqual(resetProdCheck, null, '4.4 Custom mega product eradicated after factory reset');

  const baselineProducts = await productService.getProducts();
  assertEqual(baselineProducts.total, 24, '4.4 Products restored to baseline 24 items');

  // 4.5 Verify baseline product variants and originalPrice intact
  const seedPolo = await productService.getProductById('prod_01');
  assert(Boolean(seedPolo), '4.5 prod_01 exists in restored baseline');
  assertEqual(seedPolo.price, 299000, '4.5 prod_01 price is 299,000');
  assertEqual(seedPolo.originalPrice, 399000, '4.5 prod_01 originalPrice is 399,000');
  assertEqual(seedPolo.variants.length, 4, '4.5 prod_01 has 4 variants');
  assertEqual(seedPolo.variants[0].sku, 'POLO-01-BLK-M', '4.5 Variant 0 SKU matches seed');

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log(`\n${c.bold}${c.cyan}========================================================================${c.reset}`);
  console.log(`${c.bold}${c.cyan}  STRESS TEST SUITE RESULTS SUMMARY                                     ${c.reset}`);
  console.log(`${c.bold}${c.cyan}========================================================================${c.reset}`);
  console.log(`  Total Assertions:  ${totalAssertions}`);
  console.log(`  Passed:            ${c.green}${passedAssertions}${c.reset}`);
  console.log(`  Failed:            ${failedAssertions > 0 ? c.red : c.green}${failedAssertions}${c.reset}`);

  if (failedAssertions > 0) {
    console.log(`\n${c.bold}${c.red}FAILURES:${c.reset}`);
    for (const f of failures) {
      console.log(`  - ${f}`);
    }
    process.exit(1);
  } else {
    console.log(`\n${c.bold}${c.green}★ ALL VARIANT CREATION & COMPARE_AT_PRICE STRESS TESTS PASSED (100% OK) ★${c.reset}\n`);
    process.exit(0);
  }
}

runStressSuite().catch((err) => {
  console.error(`\n${c.bgRed} FATAL STRESS TEST RUNNER EXCEPTION ${c.reset}`);
  console.error(err);
  process.exit(1);
});
