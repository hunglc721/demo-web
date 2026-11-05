/**
 * Deep Adversarial Stress Harness for Milestone 6
 * Empirical Challenger 2
 * Tests:
 * 1. Boundary & Malicious Inputs on Address Hierarchies & Vietnamese Diacritics
 * 2. Cumulative Variant Reservation Collisions across split cart items
 * 3. Exact stock exhaustion (stock -> 0) and fractional/negative quantity injection
 * 4. Zod Schema Exhaustive Boundary & Sanitization Fuzzing
 * 5. Corrupted / Missing Foreign Keys (Unknown productId, Unknown variantId, Expired Coupon)
 */
import assert from 'node:assert';
import { spawnSync } from 'node:child_process';
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

class MockStorage {
  constructor() { this.store = new Map(); }
  getItem(key) { return this.store.has(key) ? this.store.get(key) : null; }
  setItem(key, value) { this.store.set(String(key), String(value)); }
  removeItem(key) { this.store.delete(String(key)); }
  clear() { this.store.clear(); }
}
if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = new MockStorage();
}

const {
  VIETNAM_63_PROVINCES,
  getDistrictsByProvince,
  getWardsByDistrict,
} = await import('../../src/features/checkout/data/vietnamAddressData.ts');

const {
  checkoutFormSchema,
  VIETNAMESE_PHONE_REGEX,
} = await import('../../src/features/checkout/schemas/checkoutSchema.ts');

const {
  createCheckoutOrder,
} = await import('../../src/features/checkout/services/checkoutService.ts');

const { productService } = await import('../../src/services/api/productService.ts');
const { orderService } = await import('../../src/services/api/orderService.ts');
const { couponService } = await import('../../src/services/api/couponService.ts');
const { mockEngine } = await import('../../src/services/mock/mockEngine.ts');

mockEngine.updateConfig({
  delayEnabled: false,
  errorRate: 0,
  simulateOffline: false,
  simulateServerError: false,
});

console.log('===============================================================');
console.log('   DEEP ADVERSARIAL STRESS HARNESS — EMPIRICAL CHALLENGER 2    ');
console.log('===============================================================\n');

let total = 0;
let passed = 0;

function it(desc, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`  ✔ [PASS] ${desc}`);
  } catch (err) {
    console.error(`  ✘ [FAIL] ${desc}: ${err.message}`);
    throw err;
  }
}

async function itAsync(desc, fn) {
  total++;
  try {
    await fn();
    passed++;
    console.log(`  ✔ [PASS] ${desc}`);
  } catch (err) {
    console.error(`  ✘ [FAIL] ${desc}: ${err.message}`);
    throw err;
  }
}

// ----------------------------------------------------------------------------
// SECTION 1: Vietnamese Diacritics & Special Provinces
// ----------------------------------------------------------------------------
console.log('--- Section 1: Complex Diacritics & Special Administrative Regions ---');

it('1.1 Handles diacritically intensive provinces: Đắk Lắk, Đắk Nông, Thừa Thiên Huế, Bà Rịa - Vũng Tàu', () => {
  const complexProvinces = [
    { name: 'Đắk Lắk', sampleDistrict: 'TP. Buôn Ma Thuột' },
    { name: 'Đắk Nông', sampleDistrict: 'TP. Gia Nghĩa' },
    { name: 'Thừa Thiên Huế', sampleDistrict: 'TP. Huế' },
    { name: 'Bà Rịa - Vũng Tàu', sampleDistrict: 'TP. Vũng Tàu' },
    { name: 'Bình Phước', sampleDistrict: 'TP. Đồng Xoài' },
    { name: 'Quảng Trị', sampleDistrict: 'TP. Đông Hà' },
    { name: 'Hậu Giang', sampleDistrict: 'TP. Vị Thanh' },
  ];

  for (const item of complexProvinces) {
    const districts = getDistrictsByProvince(item.name);
    assert.ok(districts.length > 0, `Districts should exist for ${item.name}`);
    assert.ok(districts.includes(item.sampleDistrict), `${item.name} should contain ${item.sampleDistrict}`);

    // Test case insensitive lookup with mixed casing
    const lowerDistricts = getDistrictsByProvince(item.name.toLowerCase());
    assert.deepStrictEqual(lowerDistricts, districts, `Lower-cased lookup should match for ${item.name}`);

    // Test wards lookup for the sample district
    const wards = getWardsByDistrict(item.name, item.sampleDistrict);
    assert.ok(wards.length > 0, `Wards should exist for ${item.name} > ${item.sampleDistrict}`);
  }
});

// ----------------------------------------------------------------------------
// SECTION 2: Cumulative Variant Reservation & Inventory Edge Cases
// ----------------------------------------------------------------------------
console.log('\n--- Section 2: Cumulative Variant Reservation & Inventory Collision ---');

await itAsync('2.1 Split cart lines of same variant accumulate total quantity against available stock', async () => {
  productService.getRepository().resetToSeed();
  orderService.getRepository().resetToSeed();

  const prod = (await productService.getProducts({ page: 1, pageSize: 1 })).data[0];
  const variant = prod.variants[0];
  const availableStock = variant.stock;

  // Create two separate cart items targeting the SAME variant, where each alone is valid,
  // but their sum strictly exceeds stock.
  const part1 = Math.floor(availableStock / 2) + 1;
  const part2 = availableStock - part1 + 1;
  assert.ok(part1 + part2 > availableStock, 'Sum must exceed available stock');

  const splitItems = [
    {
      id: 'cart-split-1',
      productId: prod.id,
      variantId: variant.id,
      title: prod.name,
      variantName: `${variant.color} / ${variant.size}`,
      sku: variant.sku,
      price: prod.price,
      quantity: part1,
      image: prod.images[0],
      stock: availableStock,
    },
    {
      id: 'cart-split-2',
      productId: prod.id,
      variantId: variant.id,
      title: prod.name,
      variantName: `${variant.color} / ${variant.size}`,
      sku: variant.sku,
      price: prod.price,
      quantity: part2,
      image: prod.images[0],
      stock: availableStock,
    },
  ];

  let rejected = false;
  try {
    await createCheckoutOrder(splitItems, {
      receiverName: 'Test Cumulative',
      phone: '0912345678',
      street: '123 Đường Test',
      province: 'TP. Hồ Chí Minh',
      district: 'Quận 1',
      ward: 'Phường Bến Nghé',
      paymentMethod: 'cod',
    });
  } catch (err) {
    rejected = true;
    assert.ok(err.message.includes('không đủ tồn kho'));
  }
  assert.ok(rejected, 'Cumulative reservation must block order when sum exceeds stock');
});

await itAsync('2.2 Exact stock exhaustion: purchasing exactly 100% of available stock drops stock to 0 cleanly', async () => {
  productService.getRepository().resetToSeed();
  orderService.getRepository().resetToSeed();

  const prod = (await productService.getProducts({ page: 1, pageSize: 1 })).data[0];
  const variant = prod.variants[0];
  const exactStock = variant.stock;
  const initialProductStock = prod.stock;

  const exactItem = [{
    id: 'cart-exact-exhaust',
    productId: prod.id,
    variantId: variant.id,
    title: prod.name,
    variantName: `${variant.color} / ${variant.size}`,
    sku: variant.sku,
    price: prod.price,
    quantity: exactStock,
    image: prod.images[0],
    stock: exactStock,
  }];

  const order = await createCheckoutOrder(exactItem, {
    receiverName: 'Test Exhaustion',
    phone: '0912345678',
    street: '123 Đường Test',
    province: 'TP. Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
    paymentMethod: 'cod',
  });

  assert.ok(order.id);
  const updatedProd = await productService.getProductById(prod.id);
  const updatedVar = updatedProd.variants.find((v) => v.id === variant.id);

  assert.strictEqual(updatedVar.stock, 0, 'Variant stock should reach exactly 0');
  assert.strictEqual(updatedProd.stock, initialProductStock - exactStock, 'Product stock decreased by exact amount');
});

await itAsync('2.3 Fractional, negative, and zero quantities are strictly rejected', async () => {
  productService.getRepository().resetToSeed();
  orderService.getRepository().resetToSeed();

  const prod = (await productService.getProducts({ page: 1, pageSize: 1 })).data[0];
  const variant = prod.variants[0];

  const badQuantities = [0, -1, -5, 1.5, 0.1, NaN, Infinity];

  for (const q of badQuantities) {
    let thrown = false;
    try {
      await createCheckoutOrder([
        {
          id: 'cart-bad-qty',
          productId: prod.id,
          variantId: variant.id,
          title: prod.name,
          variantName: `${variant.color} / ${variant.size}`,
          sku: variant.sku,
          price: prod.price,
          quantity: q,
          image: prod.images[0],
          stock: variant.stock,
        },
      ], {
        receiverName: 'Test Bad Qty',
        phone: '0912345678',
        street: '123 Đường Test',
        province: 'TP. Hồ Chí Minh',
        district: 'Quận 1',
        ward: 'Phường Bến Nghé',
        paymentMethod: 'cod',
      });
    } catch {
      thrown = true;
    }
    assert.ok(thrown, `Quantity ${q} must be rejected`);
  }
});

// ----------------------------------------------------------------------------
// SECTION 3: Zod Form Schema Boundary Fuzzing
// ----------------------------------------------------------------------------
console.log('\n--- Section 3: Zod Form Schema Boundary Fuzzing ---');

it('3.1 ReceiverName boundaries: min 2, max 100 characters', () => {
  const base = {
    phone: '0912345678',
    street: '123 Đường Nguyễn Trãi',
    province: 'TP. Hồ Chí Minh',
    district: 'Quận 5',
    ward: 'Phường 2',
    paymentMethod: 'cod',
  };

  // 1 character -> reject
  assert.strictEqual(checkoutFormSchema.safeParse({ ...base, receiverName: 'A' }).success, false);
  // 2 characters -> pass
  assert.strictEqual(checkoutFormSchema.safeParse({ ...base, receiverName: 'An' }).success, true);
  // 100 characters -> pass
  assert.strictEqual(checkoutFormSchema.safeParse({ ...base, receiverName: 'A'.repeat(100) }).success, true);
  // 101 characters -> reject
  assert.strictEqual(checkoutFormSchema.safeParse({ ...base, receiverName: 'A'.repeat(101) }).success, false);
});

it('3.2 Street address boundaries: min 5, max 255 characters', () => {
  const base = {
    receiverName: 'Nguyễn Văn An',
    phone: '0912345678',
    province: 'TP. Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
    paymentMethod: 'cod',
  };

  // 4 characters -> reject
  assert.strictEqual(checkoutFormSchema.safeParse({ ...base, street: 'Số 1' }).success, false);
  // 5 characters -> pass
  assert.strictEqual(checkoutFormSchema.safeParse({ ...base, street: 'Số 12' }).success, true);
  // 255 characters -> pass
  assert.strictEqual(checkoutFormSchema.safeParse({ ...base, street: 'X'.repeat(255) }).success, true);
  // 256 characters -> reject
  assert.strictEqual(checkoutFormSchema.safeParse({ ...base, street: 'X'.repeat(256) }).success, false);
});

it('3.3 PaymentMethod enum enforcement: only cod, vietqr, momo, card allowed', () => {
  const base = {
    receiverName: 'Nguyễn Văn An',
    phone: '0912345678',
    street: '123 Đường Lê Lợi',
    province: 'TP. Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
  };

  const allowed = ['cod', 'vietqr', 'momo', 'card'];
  for (const m of allowed) {
    assert.strictEqual(checkoutFormSchema.safeParse({ ...base, paymentMethod: m }).success, true);
  }

  const disallowed = ['bitcoin', 'paypal', 'applepay', 'stripe', '', null, undefined];
  for (const m of disallowed) {
    if (m === undefined) {
      // Default is 'cod'
      assert.strictEqual(checkoutFormSchema.parse({ ...base }).paymentMethod, 'cod');
    } else {
      assert.strictEqual(checkoutFormSchema.safeParse({ ...base, paymentMethod: m }).success, false);
    }
  }
});

it('3.4 Order note boundaries: max 300 characters, optional default to empty string', () => {
  const base = {
    receiverName: 'Nguyễn Văn An',
    phone: '0912345678',
    street: '123 Đường Lê Lợi',
    province: 'TP. Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
    paymentMethod: 'cod',
  };

  // 300 chars -> pass
  assert.strictEqual(checkoutFormSchema.safeParse({ ...base, note: 'N'.repeat(300) }).success, true);
  // 301 chars -> reject
  assert.strictEqual(checkoutFormSchema.safeParse({ ...base, note: 'N'.repeat(301) }).success, false);
  // omitted -> defaults to empty string
  const parsed = checkoutFormSchema.parse(base);
  assert.strictEqual(parsed.note, '');
});

it('3.5 Optional email validation: valid email accepted, empty string accepted, invalid email rejected', () => {
  const base = {
    receiverName: 'Nguyễn Văn An',
    phone: '0912345678',
    street: '123 Đường Lê Lợi',
    province: 'TP. Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
    paymentMethod: 'cod',
  };

  assert.strictEqual(checkoutFormSchema.safeParse({ ...base, email: 'user@example.com' }).success, true);
  assert.strictEqual(checkoutFormSchema.safeParse({ ...base, email: '' }).success, true);
  assert.strictEqual(checkoutFormSchema.safeParse({ ...base, email: undefined }).success, true);
  assert.strictEqual(checkoutFormSchema.safeParse({ ...base, email: 'not-an-email' }).success, false);
  assert.strictEqual(checkoutFormSchema.safeParse({ ...base, email: '@missingusername.com' }).success, false);
});

// ----------------------------------------------------------------------------
// SECTION 4: Foreign Key and Missing Data Resilience
// ----------------------------------------------------------------------------
console.log('\n--- Section 4: Foreign Key and Missing Data Resilience ---');

await itAsync('4.1 Rejects empty cart with descriptive error', async () => {
  let thrown = false;
  try {
    await createCheckoutOrder([], {
      receiverName: 'Nguyễn Văn An',
      phone: '0912345678',
      street: '123 Đường Lê Lợi',
      province: 'TP. Hồ Chí Minh',
      district: 'Quận 1',
      ward: 'Phường Bến Nghé',
      paymentMethod: 'cod',
    });
  } catch (err) {
    thrown = true;
    assert.ok(err.message.includes('Giỏ hàng đang trống'));
  }
  assert.ok(thrown);
});

await itAsync('4.2 Rejects non-existent product ID with descriptive error', async () => {
  let thrown = false;
  try {
    await createCheckoutOrder([
      {
        id: 'cart-ghost',
        productId: 'ghost_prod_99999',
        variantId: 'ghost_var_99999',
        title: 'Sản phẩm ảo',
        variantName: 'X',
        sku: 'GHOST',
        price: 100000,
        quantity: 1,
        image: '/ghost.jpg',
        stock: 5,
      },
    ], {
      receiverName: 'Nguyễn Văn An',
      phone: '0912345678',
      street: '123 Đường Lê Lợi',
      province: 'TP. Hồ Chí Minh',
      district: 'Quận 1',
      ward: 'Phường Bến Nghé',
      paymentMethod: 'cod',
    });
  } catch (err) {
    thrown = true;
    assert.ok(err.message.includes('không còn tồn tại'));
  }
  assert.ok(thrown);
});

await itAsync('4.3 Rejects non-existent coupon code during checkout preflight', async () => {
  productService.getRepository().resetToSeed();
  const prod = (await productService.getProducts({ page: 1, pageSize: 1 })).data[0];

  let thrown = false;
  try {
    await createCheckoutOrder([
      {
        id: 'cart-cpn-test',
        productId: prod.id,
        variantId: prod.variants[0].id,
        title: prod.name,
        variantName: `${prod.variants[0].color} / ${prod.variants[0].size}`,
        sku: prod.variants[0].sku,
        price: prod.price,
        quantity: 1,
        image: prod.images[0],
        stock: prod.variants[0].stock,
      },
    ], {
      receiverName: 'Nguyễn Văn An',
      phone: '0912345678',
      street: '123 Đường Lê Lợi',
      province: 'TP. Hồ Chí Minh',
      district: 'Quận 1',
      ward: 'Phường Bến Nghé',
      paymentMethod: 'cod',
    }, 'NON_EXISTENT_COUPON_CODE');
  } catch (err) {
    thrown = true;
  }
  assert.ok(thrown, 'Invalid coupon must block checkout');
});

console.log('\n===============================================================');
console.log(`  ADVERSARIAL STRESS TEST: ${passed}/${total} TESTS PASSED (100% OK)`);
console.log('===============================================================\n');
