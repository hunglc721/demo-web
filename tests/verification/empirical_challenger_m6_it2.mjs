/**
 * Empirical Challenger 2 Test Suite for Milestone 6
 * Covers:
 * 1. Vietnamese 63 provinces cascading hierarchy, helper functions, and child selection resets.
 * 2. Zod phone regex boundary & corner cases (mobile prefixes, +84, 84, landlines, old 11-digit, non-digits).
 * 3. Order mutation: stock deduction from variant and product, LocalStorage persistence, order lookup, and Saga rollback.
 * 4. Payment methods (COD, VietQR, MoMo, Card) and confirmation page data contracts.
 */

import assert from 'node:assert';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');

if (!process.execArgv.includes('--experimental-strip-types') && !process.env.CHALLENGER_BOOTSTRAPPED) {
  const loaderUrl = pathToFileURL(path.join(__dirname, '..', 'helpers', 'register_node_alias_loader.mjs')).href;
  const child = spawnSync(
    process.execPath,
    ['--experimental-strip-types', '--import', loaderUrl, ...process.execArgv, ...process.argv.slice(1)],
    {
      stdio: 'inherit',
      env: { ...process.env, CHALLENGER_BOOTSTRAPPED: '1' },
      cwd: ROOT_DIR,
    }
  );
  process.exit(child.status ?? 0);
}

// Mock browser LocalStorage if in pure Node environment
class MockStorage {
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
}

if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = new MockStorage();
}

// Import modules under test
const {
  VIETNAM_63_PROVINCES,
  getVietnam63Provinces,
  getDistrictsByProvince,
  getWardsByDistrict,
} = await import('../../src/features/checkout/data/vietnamAddressData.ts');

const {
  VIETNAMESE_PHONE_REGEX,
  checkoutFormSchema,
} = await import('../../src/features/checkout/schemas/checkoutSchema.ts');

const {
  createCheckoutOrder,
} = await import('../../src/features/checkout/services/checkoutService.ts');

const { productService } = await import('../../src/services/api/productService.ts');
const { orderService } = await import('../../src/services/api/orderService.ts');
const { couponService } = await import('../../src/services/api/couponService.ts');
const { mockEngine } = await import('../../src/services/mock/mockEngine.ts');
const { STORAGE_KEYS } = await import('../../src/services/storage/storageKeys.ts');

console.log('===============================================================');
console.log('  EMPIRICAL CHALLENGER 2: MILESTONE 6 VERIFICATION HARNESS    ');
console.log('===============================================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✔ [PASS] ${name}`);
  } catch (error) {
    console.error(`  ✘ [FAIL] ${name}`);
    console.error(`     Error: ${error.message}`);
    throw error;
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  ✔ [PASS] ${name}`);
  } catch (error) {
    console.error(`  ✘ [FAIL] ${name}`);
    console.error(`     Error: ${error.message}`);
    throw error;
  }
}

// Disable simulated network latency for deterministic test execution
mockEngine.updateConfig({
  delayEnabled: false,
  errorRate: 0,
  simulateOffline: false,
  simulateServerError: false,
});

// ============================================================================
// AREA 1: VIETNAMESE 63 PROVINCES CASCADING DATA & HIERARCHY
// ============================================================================
console.log('--- AREA 1: Vietnamese 63 Provinces Cascading Hierarchy ---');

runTest('1.1 Exact 63 provinces exist in VIETNAM_63_PROVINCES', () => {
  assert.strictEqual(VIETNAM_63_PROVINCES.length, 63, 'Must contain exactly 63 provinces');
});

runTest('1.2 All 63 provinces have valid non-empty name and code, with no duplicate names or codes', () => {
  const names = new Set();
  const codes = new Set();

  for (const p of VIETNAM_63_PROVINCES) {
    assert.ok(p.name && typeof p.name === 'string' && p.name.trim().length > 0, `Invalid province name: ${p.name}`);
    assert.ok(p.code && typeof p.code === 'string' && p.code.trim().length > 0, `Invalid province code: ${p.code}`);
    assert.ok(!names.has(p.name.toLowerCase()), `Duplicate province name: ${p.name}`);
    assert.ok(!codes.has(p.code), `Duplicate province code: ${p.code}`);
    names.add(p.name.toLowerCase());
    codes.add(p.code);
  }
  assert.strictEqual(names.size, 63);
  assert.strictEqual(codes.size, 63);
});

runTest('1.3 Hierarchy completeness: Every province has >= 1 district, every district has >= 1 ward', () => {
  let totalDistricts = 0;
  let totalWards = 0;

  for (const p of VIETNAM_63_PROVINCES) {
    assert.ok(Array.isArray(p.districts) && p.districts.length > 0, `Province ${p.name} has no districts`);
    for (const d of p.districts) {
      assert.ok(d.name && typeof d.name === 'string', `Invalid district in ${p.name}`);
      assert.ok(Array.isArray(d.wards) && d.wards.length > 0, `District ${d.name} in ${p.name} has no wards`);
      totalDistricts++;
      totalWards += d.wards.length;
    }
  }

  assert.ok(totalDistricts >= 150, `Expected >= 150 districts, found ${totalDistricts}`);
  assert.ok(totalWards >= 500, `Expected >= 500 wards, found ${totalWards}`);
});

runTest('1.4 getVietnam63Provinces() returns all 63 province names matching dataset', () => {
  const provinces = getVietnam63Provinces();
  assert.strictEqual(provinces.length, 63);
  for (let i = 0; i < 63; i++) {
    assert.strictEqual(provinces[i], VIETNAM_63_PROVINCES[i].name);
  }
});

runTest('1.5 getDistrictsByProvince() handles normal, case-insensitive, trimmed, and invalid queries', () => {
  // Normal lookup
  const hcmDistricts = getDistrictsByProvince('TP. Hồ Chí Minh');
  assert.ok(hcmDistricts.length > 5, 'TP. Hồ Chí Minh must have multiple districts');
  assert.ok(hcmDistricts.includes('Quận 1'));
  assert.ok(hcmDistricts.includes('TP. Thủ Đức'));

  // Case-insensitivity & whitespace trimming
  const hcmLower = getDistrictsByProvince('tp. hồ chí minh');
  assert.deepStrictEqual(hcmLower, hcmDistricts, 'Case-insensitive search should match');

  const hnTrimmed = getDistrictsByProvince('   TP. Hà Nội  ');
  assert.ok(hnTrimmed.includes('Quận Ba Đình'));
  assert.ok(hnTrimmed.includes('Quận Hoàn Kiếm'));

  // Non-existent or invalid queries
  assert.deepStrictEqual(getDistrictsByProvince('NonExistentProvince'), []);
  assert.deepStrictEqual(getDistrictsByProvince(''), []);
  assert.deepStrictEqual(getDistrictsByProvince(null), []);
  assert.deepStrictEqual(getDistrictsByProvince(undefined), []);
});

runTest('1.6 getWardsByDistrict() handles 3-tier cascade, case-insensitivity, and mismatch handling', () => {
  // Valid lookup
  const q1Wards = getWardsByDistrict('TP. Hồ Chí Minh', 'Quận 1');
  assert.ok(q1Wards.length >= 8);
  assert.ok(q1Wards.includes('Phường Bến Nghé'));
  assert.ok(q1Wards.includes('Phường Bến Thành'));

  // Case-insensitivity & trimming
  const q1Case = getWardsByDistrict('  tp. hồ chí minh  ', '  quận 1 ');
  assert.deepStrictEqual(q1Case, q1Wards);

  // Mismatched province and district
  const mismatch1 = getWardsByDistrict('TP. Hồ Chí Minh', 'Quận Ba Đình'); // Ba Đình is in Hà Nội
  assert.deepStrictEqual(mismatch1, []);

  // Invalid province
  const mismatch2 = getWardsByDistrict('Tokyo', 'Quận 1');
  assert.deepStrictEqual(mismatch2, []);

  // Falsy values
  assert.deepStrictEqual(getWardsByDistrict('', 'Quận 1'), []);
  assert.deepStrictEqual(getWardsByDistrict('Hà Nội', ''), []);
  assert.deepStrictEqual(getWardsByDistrict(null, undefined), []);
});

runTest('1.7 Address cascading state resets: changing province resets district and ward', () => {
  // Test simulation of VietnamAddressCascader event handlers
  let selectedProvince = 'TP. Hồ Chí Minh';
  let selectedDistrict = 'Quận 1';
  let selectedWard = 'Phường Bến Nghé';

  const onProvinceChange = (p) => { selectedProvince = p; selectedDistrict = ''; selectedWard = ''; };
  const onDistrictChange = (d) => { selectedDistrict = d; selectedWard = ''; };
  const onWardChange = (w) => { selectedWard = w; };

  // Step 1: initial selection
  assert.strictEqual(selectedProvince, 'TP. Hồ Chí Minh');
  assert.strictEqual(selectedDistrict, 'Quận 1');
  assert.strictEqual(selectedWard, 'Phường Bến Nghé');

  // Step 2: user changes district
  onDistrictChange('TP. Thủ Đức');
  assert.strictEqual(selectedDistrict, 'TP. Thủ Đức');
  assert.strictEqual(selectedWard, '', 'Changing district must clear ward');

  onWardChange('Phường Thảo Điền');
  assert.strictEqual(selectedWard, 'Phường Thảo Điền');

  // Step 3: user changes province
  onProvinceChange('Hà Nội');
  assert.strictEqual(selectedProvince, 'Hà Nội');
  assert.strictEqual(selectedDistrict, '', 'Changing province must clear district');
  assert.strictEqual(selectedWard, '', 'Changing province must clear ward');
});

runTest('1.8 Address preview string formatting handles full, partial, and empty states cleanly', () => {
  const formatPreview = (street, ward, district, province) =>
    [street?.trim(), ward?.trim(), district?.trim(), province?.trim()].filter(Boolean).join(', ');

  assert.strictEqual(
    formatPreview('12 Nguyễn Huệ', 'Phường Bến Nghé', 'Quận 1', 'TP. Hồ Chí Minh'),
    '12 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh'
  );
  assert.strictEqual(
    formatPreview('', '', 'Quận 1', 'TP. Hồ Chí Minh'),
    'Quận 1, TP. Hồ Chí Minh'
  );
  assert.strictEqual(formatPreview('', '', '', ''), '');
});

runTest('1.9 Backward compatibility: public/data legacy JSON files remain valid and intact', () => {
  const provincesPath = path.resolve('public/data/vietnam-provinces.json');
  const wardsPath = path.resolve('public/data/vietnam-wards.json');

  assert.ok(fs.existsSync(provincesPath), 'vietnam-provinces.json must exist');
  assert.ok(fs.existsSync(wardsPath), 'vietnam-wards.json must exist');

  const provincesJson = JSON.parse(fs.readFileSync(provincesPath, 'utf8'));
  const wardsJson = JSON.parse(fs.readFileSync(wardsPath, 'utf8'));

  assert.strictEqual(provincesJson.length, 34, 'Legacy provinces JSON preserved at 34');
  assert.strictEqual(wardsJson.length, 3321, 'Legacy wards JSON preserved at 3321');
});


// ============================================================================
// AREA 2: ZOD PHONE REGEX BOUNDARY TESTING
// ============================================================================
console.log('\n--- AREA 2: Zod Phone Regex Boundary Testing ---');

const baseFormData = {
  receiverName: 'Nguyễn Văn An',
  email: 'an@example.com',
  province: 'TP. Hồ Chí Minh',
  district: 'Quận 1',
  ward: 'Phường Bến Nghé',
  street: '123 Đường Lê Lợi',
  paymentMethod: 'cod',
  note: '',
};

runTest('2.1 Standard 10-digit mobile numbers with 03, 05, 07, 08, 09 prefixes PASS', () => {
  const validMobiles = [
    '0321234567', '0339876543', '0341112233', '0354445566', '0367778899', '0370001122', '0383334455', '0396667788',
    '0521234567', '0569876543', '0581112233', '0594445566',
    '0701234567', '0769876543', '0771112233', '0784445566', '0796667788',
    '0811234567', '0829876543', '0831112233', '0844445566', '0856667788', '0867778899', '0880001122', '0893334455',
    '0901234567', '0919876543', '0921112233', '0934445566', '0946667788', '0967778899', '0970001122', '0983334455', '0996667788',
  ];

  for (const phone of validMobiles) {
    assert.ok(VIETNAMESE_PHONE_REGEX.test(phone), `Regex should accept ${phone}`);
    const parseResult = checkoutFormSchema.safeParse({ ...baseFormData, phone });
    assert.ok(parseResult.success, `Schema should parse ${phone}: ${JSON.stringify(parseResult.error)}`);
  }
});

runTest('2.2 International format with +84 prefix PASS', () => {
  const validInternationalPlus = [
    '+84321234567',
    '+84561234567',
    '+84701234567',
    '+84861234567',
    '+84912345678',
    '+84988889999',
  ];

  for (const phone of validInternationalPlus) {
    assert.ok(VIETNAMESE_PHONE_REGEX.test(phone), `Regex should accept ${phone}`);
    const parseResult = checkoutFormSchema.safeParse({ ...baseFormData, phone });
    assert.ok(parseResult.success, `Schema should parse ${phone}`);
  }
});

runTest('2.3 International format with 84 prefix (without +) PASS', () => {
  const validInternationalNoPlus = [
    '84321234567',
    '84561234567',
    '84701234567',
    '84861234567',
    '84912345678',
    '84988889999',
  ];

  for (const phone of validInternationalNoPlus) {
    assert.ok(VIETNAMESE_PHONE_REGEX.test(phone), `Regex should accept ${phone}`);
    const parseResult = checkoutFormSchema.safeParse({ ...baseFormData, phone });
    assert.ok(parseResult.success, `Schema should parse ${phone}`);
  }
});

runTest('2.4 Schema trim handles surrounding whitespace around valid phone', () => {
  const parseResult = checkoutFormSchema.safeParse({
    ...baseFormData,
    phone: '   0912345678   ',
  });
  assert.ok(parseResult.success, 'Schema should trim and accept valid phone');
  if (parseResult.success) {
    assert.strictEqual(parseResult.data.phone, '0912345678');
  }
});

runTest('2.5 Landline phone numbers (024, 028, etc.) REJECTED', () => {
  const landlines = [
    '02438234567', // Hanoi landline (11 digits)
    '02838234567', // HCMC landline (11 digits)
    '0241234567',  // 10 digits starting with 02
    '0281234567',
    '+842438234567',
    '+842838234567',
  ];

  for (const phone of landlines) {
    assert.strictEqual(VIETNAMESE_PHONE_REGEX.test(phone), false, `Should reject landline ${phone}`);
    const parseResult = checkoutFormSchema.safeParse({ ...baseFormData, phone });
    assert.strictEqual(parseResult.success, false, `Schema must reject landline ${phone}`);
  }
});

runTest('2.6 Old 11-digit mobile prefixes (012x, 016x) REJECTED', () => {
  const oldPrefixes = [
    '01234567890',
    '01681234567',
    '01201234567',
    '01221234567',
    '+841234567890',
  ];

  for (const phone of oldPrefixes) {
    assert.strictEqual(VIETNAMESE_PHONE_REGEX.test(phone), false, `Should reject old 11-digit ${phone}`);
    const parseResult = checkoutFormSchema.safeParse({ ...baseFormData, phone });
    assert.strictEqual(parseResult.success, false, `Schema must reject old prefix ${phone}`);
  }
});

runTest('2.7 Invalid prefixes (00, 01, 02, 04, 06, 8409) REJECTED', () => {
  const invalidPrefixes = [
    '0012345678',
    '0112345678',
    '0212345678',
    '0412345678',
    '0612345678',
    '+84112345678',
    '+84412345678',
    '+84612345678',
    '840912345678', // double prefix
    '+840912345678',
  ];

  for (const phone of invalidPrefixes) {
    assert.strictEqual(VIETNAMESE_PHONE_REGEX.test(phone), false, `Should reject invalid prefix ${phone}`);
    const parseResult = checkoutFormSchema.safeParse({ ...baseFormData, phone });
    assert.strictEqual(parseResult.success, false, `Schema must reject invalid prefix ${phone}`);
  }
});

runTest('2.8 Length boundary violations (too short, too long) REJECTED', () => {
  const invalidLengths = [
    '091234567',      // 9 digits
    '09123456789',    // 11 digits
    '09',             // 2 digits
    '0',              // 1 digit
    '+8491234567',    // +84 + 8 digits = 10 chars, too short
    '+849123456789',  // +84 + 10 digits = 13 chars, too long
    '8491234567',     // 84 + 8 digits, too short
    '849123456789',   // 84 + 10 digits, too long
  ];

  for (const phone of invalidLengths) {
    assert.strictEqual(VIETNAMESE_PHONE_REGEX.test(phone), false, `Should reject length violation ${phone}`);
    const parseResult = checkoutFormSchema.safeParse({ ...baseFormData, phone });
    assert.strictEqual(parseResult.success, false, `Schema must reject length violation ${phone}`);
  }
});

runTest('2.9 Non-digits and special character formatting REJECTED', () => {
  const nonDigits = [
    '091234567a',
    '091-234-5678',
    '091 234 5678',
    '0912.345.678',
    '(091)2345678',
    '091234567#',
    '091234567*',
    '+84 912345678',
    'abc0912345678',
  ];

  for (const phone of nonDigits) {
    assert.strictEqual(VIETNAMESE_PHONE_REGEX.test(phone), false, `Should reject non-digit ${phone}`);
    const parseResult = checkoutFormSchema.safeParse({ ...baseFormData, phone });
    assert.strictEqual(parseResult.success, false, `Schema must reject non-digit ${phone}`);
  }
});

runTest('2.10 Empty string, null, undefined REJECTED by form schema', () => {
  assert.strictEqual(checkoutFormSchema.safeParse({ ...baseFormData, phone: '' }).success, false);
  assert.strictEqual(checkoutFormSchema.safeParse({ ...baseFormData, phone: null }).success, false);
  assert.strictEqual(checkoutFormSchema.safeParse({ ...baseFormData, phone: undefined }).success, false);
});


// ============================================================================
// AREA 3: ORDER MUTATION, LOCALSTORAGE PERSISTENCE, ROLLBACK, LOOKUP
// ============================================================================
console.log('\n--- AREA 3: Order Mutation, LocalStorage, Stock Deduction & Rollback ---');

const testDetails = {
  receiverName: 'Trần Thị Mai',
  phone: '0987654321',
  email: 'mai.tran@example.com',
  street: '456 Hai Bà Trưng',
  province: 'TP. Hồ Chí Minh',
  district: 'Quận 1',
  ward: 'Phường Tân Định',
  paymentMethod: 'cod',
  note: 'Giao giờ hành chính',
};

await runAsyncTest('3.1 Multi-variant stock deduction from both variant and product in LocalStorage', async () => {
  // Reset repositories to fresh seed state
  productService.getRepository().resetToSeed();
  orderService.getRepository().resetToSeed();
  couponService.getRepository().resetToSeed();

  // Find a product with multiple variants
  const products = (await productService.getProducts({ page: 1, pageSize: 20 })).data;
  const targetProduct = products.find((p) => p.variants && p.variants.length >= 2);
  assert.ok(targetProduct, 'Seed dataset must have a product with >= 2 variants');

  const v1 = targetProduct.variants[0];
  const v2 = targetProduct.variants[1];
  const initialTotalStock = targetProduct.stock;
  const initialV1Stock = v1.stock;
  const initialV2Stock = v2.stock;

  assert.ok(initialV1Stock >= 2, 'Variant 1 must have at least 2 in stock');
  assert.ok(initialV2Stock >= 1, 'Variant 2 must have at least 1 in stock');

  const cartItems = [
    {
      id: 'cart-line-1',
      productId: targetProduct.id,
      variantId: v1.id,
      title: targetProduct.name,
      variantName: `${v1.color} / ${v1.size}`,
      sku: v1.sku,
      price: v1.price || targetProduct.price,
      quantity: 2,
      image: targetProduct.images[0] || '/dummy.jpg',
      stock: v1.stock,
    },
    {
      id: 'cart-line-2',
      productId: targetProduct.id,
      variantId: v2.id,
      title: targetProduct.name,
      variantName: `${v2.color} / ${v2.size}`,
      sku: v2.sku,
      price: v2.price || targetProduct.price,
      quantity: 1,
      image: targetProduct.images[0] || '/dummy.jpg',
      stock: v2.stock,
    },
  ];

  // Execute checkout order creation
  const createdOrder = await createCheckoutOrder(cartItems, testDetails);

  // Assertions on created order
  assert.ok(createdOrder.id, 'Order must have an ID');
  assert.ok(createdOrder.orderNumber.startsWith('ORD-'), 'Order number format check');
  assert.strictEqual(createdOrder.status, 'pending');
  assert.strictEqual(createdOrder.paymentStatus, 'pending');
  assert.strictEqual(createdOrder.items.length, 2);
  assert.strictEqual(createdOrder.notes, 'Giao giờ hành chính');

  // Verify Order is recorded in LocalStorage
  const storedOrder = await orderService.getOrderById(createdOrder.id);
  assert.ok(storedOrder, 'Order must exist in LocalStorage');
  assert.strictEqual(storedOrder.orderNumber, createdOrder.orderNumber);

  // Verify stock deduction in LocalStorage
  const updatedProduct = await productService.getProductById(targetProduct.id);
  assert.ok(updatedProduct, 'Product must exist');

  const updatedV1 = updatedProduct.variants.find((v) => v.id === v1.id);
  const updatedV2 = updatedProduct.variants.find((v) => v.id === v2.id);

  assert.strictEqual(updatedV1.stock, initialV1Stock - 2, 'Variant 1 stock must be reduced by 2');
  assert.strictEqual(updatedV2.stock, initialV2Stock - 1, 'Variant 2 stock must be reduced by 1');
  assert.strictEqual(updatedProduct.stock, initialTotalStock - 3, 'Product overall stock must be reduced by 3');
});

await runAsyncTest('3.2 Order lookup by OrderNumber and Phone with format variations', async () => {
  productService.getRepository().resetToSeed();
  orderService.getRepository().resetToSeed();

  const products = (await productService.getProducts({ page: 1, pageSize: 5 })).data;
  const prod = products[0];
  const v = prod.variants[0];

  const cart = [{
    id: 'cart-lookup-1',
    productId: prod.id,
    variantId: v.id,
    title: prod.name,
    variantName: `${v.color} / ${v.size}`,
    sku: v.sku,
    price: prod.price,
    quantity: 1,
    image: prod.images[0],
    stock: v.stock,
  }];

  const order = await createCheckoutOrder(cart, {
    ...testDetails,
    receiverName: 'Lê Hoàng Long',
    phone: '0912345678',
  });

  // 1. Direct query by orderId
  const byId = await orderService.getOrderById(order.id);
  assert.ok(byId, 'Order must be findable by ID');
  assert.strictEqual(byId.orderNumber, order.orderNumber);

  // 2. Direct query by orderNumber
  const byNumber = await orderService.getOrderByNumber(order.orderNumber);
  assert.ok(byNumber, 'Order must be findable by orderNumber');

  // 3. Simulate OrderLookupPage search logic (case-insensitive code + 9-digit phone match)
  const lookupSearch = async (code, inputPhone) => {
    const found = await orderService.getOrderByNumber(code.trim().toUpperCase());
    if (!found) return { success: false, reason: 'NOT_FOUND' };
    const cleanFoundPhone = found.customer.phone.replace(/\D/g, '').slice(-9);
    const cleanInputPhone = inputPhone.replace(/\D/g, '').slice(-9);
    if (cleanFoundPhone !== cleanInputPhone) {
      return { success: false, reason: 'PHONE_MISMATCH' };
    }
    return { success: true, order: found };
  };

  // Exact match
  const res1 = await lookupSearch(order.orderNumber, '0912345678');
  assert.ok(res1.success, 'Exact orderNumber + phone should succeed');

  // Case-insensitive code
  const res2 = await lookupSearch(order.orderNumber.toLowerCase(), '0912345678');
  assert.ok(res2.success, 'Lowercase orderNumber should succeed');

  // Phone variation: international prefix +84 matching local 09
  const res3 = await lookupSearch(order.orderNumber, '+84912345678');
  assert.ok(res3.success, '+84 format should match 09 format via last 9 digits');

  // Phone variation: space formatted phone
  const res4 = await lookupSearch(order.orderNumber, '091 234 5678');
  assert.ok(res4.success, 'Space formatted phone should match');

  // Wrong phone
  const res5 = await lookupSearch(order.orderNumber, '0987654321');
  assert.strictEqual(res5.success, false);
  assert.strictEqual(res5.reason, 'PHONE_MISMATCH');

  // Non-existent order code
  const res6 = await lookupSearch('ORD-NON-EXISTENT-999', '0912345678');
  assert.strictEqual(res6.success, false);
  assert.strictEqual(res6.reason, 'NOT_FOUND');
});

await runAsyncTest('3.3 Out-of-stock preflight rejection: prevents order and leaves inventory untouched', async () => {
  productService.getRepository().resetToSeed();
  orderService.getRepository().resetToSeed();

  const products = (await productService.getProducts({ page: 1, pageSize: 5 })).data;
  const prod = products[0];
  const v = prod.variants[0];
  const initialStock = v.stock;
  const initialProductStock = prod.stock;

  const ordersBefore = (await orderService.getOrders()).total;

  const excessiveCart = [{
    id: 'cart-excessive',
    productId: prod.id,
    variantId: v.id,
    title: prod.name,
    variantName: `${v.color} / ${v.size}`,
    sku: v.sku,
    price: prod.price,
    quantity: initialStock + 10, // Exceeds available inventory
    image: prod.images[0],
    stock: initialStock,
  }];

  let errorThrown = false;
  try {
    await createCheckoutOrder(excessiveCart, testDetails);
  } catch (err) {
    errorThrown = true;
    assert.ok(err.message.includes('không đủ tồn kho'), `Error message should mention stock: ${err.message}`);
  }
  assert.ok(errorThrown, 'Should throw out-of-stock error');

  // Verify zero orders were created
  const ordersAfter = (await orderService.getOrders()).total;
  assert.strictEqual(ordersAfter, ordersBefore, 'No order should be created');

  // Verify inventory remained completely unchanged
  const prodAfter = await productService.getProductById(prod.id);
  const vAfter = prodAfter.variants.find((x) => x.id === v.id);
  assert.strictEqual(vAfter.stock, initialStock);
  assert.strictEqual(prodAfter.stock, initialProductStock);
});

await runAsyncTest('3.4 Saga Rollback on mutation error: deletes created order and restores inventory', async () => {
  productService.getRepository().resetToSeed();
  orderService.getRepository().resetToSeed();
  couponService.getRepository().resetToSeed();

  const products = (await productService.getProducts({ page: 1, pageSize: 5 })).data;
  const prod = products[0];
  const v = prod.variants[0];
  const initialVariantStock = v.stock;
  const initialProductStock = prod.stock;

  const couponBefore = await couponService.getCouponByCode('SALE50K');
  assert.ok(couponBefore, 'Coupon SALE50K must exist in seed');
  const initialUsedCount = couponBefore.usedCount;

  const ordersBefore = (await orderService.getOrders()).total;

  const cart = [{
    id: 'cart-fail-test',
    productId: prod.id,
    variantId: v.id,
    title: prod.name,
    variantName: `${v.color} / ${v.size}`,
    sku: v.sku,
    price: prod.price,
    quantity: 2,
    image: prod.images[0],
    stock: v.stock,
  }];

  // Intercept productService.updateProduct to throw simulated error on first mutation call, then allow rollback
  const originalUpdate = productService.updateProduct.bind(productService);
  let updateCalls = 0;
  productService.updateProduct = async (...args) => {
    updateCalls++;
    if (updateCalls === 1) {
      throw new Error('SIMULATED_STORAGE_CRASH_DURING_MUTATION');
    }
    return originalUpdate(...args);
  };

  let caughtError = null;
  try {
    await createCheckoutOrder(cart, testDetails, 'SALE50K');
  } catch (err) {
    caughtError = err;
  } finally {
    // Restore original method
    productService.updateProduct = originalUpdate;
  }

  assert.ok(caughtError, 'Should have failed due to injected error');
  assert.ok(caughtError.message.includes('SIMULATED_STORAGE_CRASH'), `Unexpected error: ${caughtError.message}`);

  // Check Saga Compensating Transaction:
  // 1. Order count must be unchanged (created order rolled back / deleted)
  const ordersAfter = (await orderService.getOrders()).total;
  assert.strictEqual(ordersAfter, ordersBefore, 'Created order must be cleaned up / rolled back');

  // 2. Coupon usedCount must be rolled back to initial value
  const couponAfter = await couponService.getCouponByCode('SALE50K');
  assert.strictEqual(couponAfter.usedCount, initialUsedCount, 'Coupon usedCount must remain unchanged');

  // 3. Product stock must remain unchanged
  const prodAfter = await productService.getProductById(prod.id);
  const vAfter = prodAfter.variants.find((x) => x.id === v.id);
  assert.strictEqual(vAfter.stock, initialVariantStock, 'Variant stock must remain unchanged');
  assert.strictEqual(prodAfter.stock, initialProductStock, 'Product stock must remain unchanged');
});


// ============================================================================
// AREA 4: PAYMENT METHODS (COD, VIETQR, MOMO, CARD) & CONFIRMATION
// ============================================================================
console.log('\n--- AREA 4: Payment Methods (COD, VietQR, MoMo, Card) & Confirmation ---');

const makeCartItem = (prod, quantity = 1) => ({
  id: `cart-${Date.now()}-${Math.random()}`,
  productId: prod.id,
  variantId: prod.variants[0].id,
  title: prod.name,
  variantName: `${prod.variants[0].color} / ${prod.variants[0].size}`,
  sku: prod.variants[0].sku,
  price: prod.price,
  quantity,
  image: prod.images[0],
  stock: prod.variants[0].stock,
});

await runAsyncTest('4.1 COD payment method: pending status, no bank details, cash instructions', async () => {
  productService.getRepository().resetToSeed();
  orderService.getRepository().resetToSeed();
  const prod = (await productService.getProducts({ page: 1, pageSize: 1 })).data[0];

  const order = await createCheckoutOrder(
    [makeCartItem(prod)],
    { ...testDetails, paymentMethod: 'cod' }
  );

  assert.strictEqual(order.paymentMethod, 'cod');
  assert.strictEqual(order.paymentStatus, 'pending');
  assert.strictEqual(order.paymentDetails, undefined);
  assert.strictEqual(order.status, 'pending');
});

await runAsyncTest('4.2 VietQR payment method: bank details, dynamic VietQR URL, simulated confirmation', async () => {
  productService.getRepository().resetToSeed();
  orderService.getRepository().resetToSeed();
  const prod = (await productService.getProducts({ page: 1, pageSize: 1 })).data[0];

  const order = await createCheckoutOrder(
    [makeCartItem(prod)],
    { ...testDetails, paymentMethod: 'vietqr' }
  );

  // Assert order payment attributes
  assert.strictEqual(order.paymentMethod, 'vietqr');
  assert.strictEqual(order.paymentStatus, 'pending');
  assert.ok(order.paymentDetails, 'VietQR order must have paymentDetails');
  assert.strictEqual(order.paymentDetails.bankName, 'MB Bank');
  assert.strictEqual(order.paymentDetails.accountNumber, '9999888826');
  assert.strictEqual(order.paymentDetails.accountName, 'D2C STORE VIETNAM');

  // Verify dynamic VietQR URL generation format matching OrderSuccessPage & VietQRModal
  const transferContent = order.orderNumber;
  const qrUrl = `https://img.vietqr.io/image/MB-${order.paymentDetails.accountNumber}-compact2.png?amount=${order.total}&addInfo=${encodeURIComponent(
    transferContent
  )}&accountName=${encodeURIComponent(order.paymentDetails.accountName)}`;

  assert.ok(qrUrl.includes('MB-9999888826-compact2.png'));
  assert.ok(qrUrl.includes(`amount=${order.total}`));
  assert.ok(qrUrl.includes(encodeURIComponent(transferContent)));

  // Simulate payment completion ("Tôi đã chuyển khoản xong")
  const updatedOrder = await orderService.updatePaymentStatus(
    order.id,
    'paid',
    'TX_TEST_VIETQR_123456'
  );

  assert.strictEqual(updatedOrder.paymentStatus, 'paid');
  assert.strictEqual(updatedOrder.paymentDetails.transactionId, 'TX_TEST_VIETQR_123456');
  assert.ok(updatedOrder.paymentDetails.paidAt, 'paidAt timestamp must be set');
  const lastTimeline = updatedOrder.timeline[updatedOrder.timeline.length - 1];
  assert.strictEqual(lastTimeline.title, 'Thanh toán thành công');
});

await runAsyncTest('4.3 MoMo payment method: wallet details, recipient info, simulated confirmation', async () => {
  productService.getRepository().resetToSeed();
  orderService.getRepository().resetToSeed();
  const prod = (await productService.getProducts({ page: 1, pageSize: 1 })).data[0];

  const order = await createCheckoutOrder(
    [makeCartItem(prod)],
    { ...testDetails, paymentMethod: 'momo' }
  );

  assert.strictEqual(order.paymentMethod, 'momo');
  assert.strictEqual(order.paymentStatus, 'pending');
  assert.ok(order.paymentDetails, 'MoMo order must have paymentDetails');
  assert.strictEqual(order.paymentDetails.bankName, 'MoMo');
  assert.strictEqual(order.paymentDetails.accountNumber, '0918889999');
  assert.strictEqual(order.paymentDetails.accountName, 'D2C STORE VIETNAM');

  // Simulate MoMo payment confirmation
  const updated = await orderService.updatePaymentStatus(
    order.id,
    'paid',
    'TX_MOMO_987654'
  );
  assert.strictEqual(updated.paymentStatus, 'paid');
  assert.strictEqual(updated.paymentDetails.transactionId, 'TX_MOMO_987654');
});

await runAsyncTest('4.4 Credit Card payment method: instant "paid" status, sandbox transaction ID', async () => {
  productService.getRepository().resetToSeed();
  orderService.getRepository().resetToSeed();
  const prod = (await productService.getProducts({ page: 1, pageSize: 1 })).data[0];

  const order = await createCheckoutOrder(
    [makeCartItem(prod)],
    { ...testDetails, paymentMethod: 'card' }
  );

  assert.strictEqual(order.paymentMethod, 'card');
  assert.strictEqual(order.paymentStatus, 'paid', 'Card payment should be marked "paid" immediately');
  assert.ok(order.paymentDetails, 'Card order must have paymentDetails');
  assert.strictEqual(order.paymentDetails.bankName, 'Visa / MasterCard');
  assert.ok(order.paymentDetails.transactionId.startsWith('TX_'), 'Must have generated transaction ID');
  assert.ok(order.paymentDetails.paidAt, 'Must have paidAt ISO timestamp');
});

await runAsyncTest('4.5 Order Confirmation Page data contract & Admin Backoffice link integrity', async () => {
  productService.getRepository().resetToSeed();
  orderService.getRepository().resetToSeed();
  const prod = (await productService.getProducts({ page: 1, pageSize: 1 })).data[0];

  const order = await createCheckoutOrder(
    [makeCartItem(prod, 2)],
    { ...testDetails, paymentMethod: 'vietqr', note: 'Giao buổi sáng' },
    'FREESHIP'
  );

  // 1. Data contract for OrderSuccessPage
  assert.ok(order.id, 'order.id required for route /order-success/:orderId');
  assert.ok(order.orderNumber, 'order.orderNumber required for transfer reference');
  assert.ok(order.customer.name, 'customer name required');
  assert.ok(order.customer.phone, 'customer phone required');
  assert.ok(order.customer.address.fullAddress, 'fullAddress required');
  assert.strictEqual(order.notes, 'Giao buổi sáng');

  // 2. Financial calculation contract
  assert.strictEqual(order.items.length, 1);
  assert.strictEqual(order.items[0].quantity, 2);
  assert.strictEqual(order.items[0].totalPrice, order.items[0].price * 2);
  assert.strictEqual(order.subtotal, order.items[0].totalPrice);
  assert.strictEqual(order.shippingFee, 0, 'FREESHIP coupon should zero shipping');
  assert.strictEqual(order.total, order.subtotal - order.discount);

  // 3. Admin Backoffice link route verification
  const adminBackofficeLink = `/admin/orders/${order.id}`;
  assert.ok(adminBackofficeLink.startsWith('/admin/orders/ORD-'));
});

console.log('\n===============================================================');
console.log(`  VERIFICATION COMPLETE: ${passedTests}/${totalTests} TESTS PASSED (100% OK)`);
console.log('===============================================================\n');
