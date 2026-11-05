import assert from 'node:assert';

console.log('=== REVIEWER CRITIC ADVERSARIAL STRESS TEST ===\n');

// ------------------------------------------------------------------
// SECTION 1: Pure SSR Execution (Zero DOM / Zero Storage Globals)
// ------------------------------------------------------------------
console.log('1. Testing pure SSR execution (globalThis.window, document, localStorage are undefined)...');
assert.strictEqual(typeof globalThis.window, 'undefined');
assert.strictEqual(typeof globalThis.document, 'undefined');
assert.strictEqual(typeof globalThis.localStorage, 'undefined');

// Dynamic import in pristine Node environment
const { useAuthStore, AUTH_STORAGE_KEY, defaultAdminUser, defaultStaffUser, defaultCustomerUser } = await import('../../src/stores/authStore.ts');
const { useThemeStore, THEME_STORAGE_KEY } = await import('../../src/stores/themeStore.ts');
const { formatDateVN, formatCurrencyVND, slugify } = await import('../../src/utils/formatters.ts');

// Test that authStore methods work without crashing in SSR
assert.doesNotThrow(() => {
  useAuthStore.getState().initAuth();
  useAuthStore.getState().switchRole('staff');
  useAuthStore.getState().switchRole('customer');
  useAuthStore.getState().switchRole('admin');
  useAuthStore.getState().logout();
  useAuthStore.getState().login(defaultStaffUser);
}, 'authStore must execute cleanly under SSR');
console.log('   ✔ authStore executed all operations in pure SSR without throwing');

// Test that themeStore methods work without crashing in SSR
assert.doesNotThrow(() => {
  useThemeStore.getState().initTheme();
  useThemeStore.getState().setMode('dark');
  useThemeStore.getState().setMode('light');
  useThemeStore.getState().setMode('system');
  useThemeStore.getState().setPreset('emerald');
  useThemeStore.getState().setPreset('rose');
  useThemeStore.getState().setRadius('sm');
  useThemeStore.getState().setRadius('full');
  useThemeStore.getState().toggleMode();
}, 'themeStore must execute cleanly under SSR');
console.log('   ✔ themeStore executed all operations in pure SSR without throwing');

// ------------------------------------------------------------------
// SECTION 2: Storage Quota & Security Exception Stress Testing
// ------------------------------------------------------------------
console.log('\n2. Testing Storage QuotaExceeded & SecurityError injection...');

class ExplodingStorage {
  constructor() {
    this.storage = new Map();
    this.mode = 'normal'; // 'normal' | 'quota' | 'security' | 'denied'
  }
  getItem(key) {
    if (this.mode === 'security') throw new Error('SecurityError: Access is denied for this document');
    return this.storage.has(key) ? this.storage.get(key) : null;
  }
  setItem(key, value) {
    if (this.mode === 'quota') throw new Error('QuotaExceededError: DOMException 22');
    if (this.mode === 'security') throw new Error('SecurityError: The operation is insecure');
    if (this.mode === 'denied') throw new TypeError('localStorage is disabled');
    this.storage.set(String(key), String(value));
  }
  removeItem(key) {
    this.storage.delete(String(key));
  }
  clear() {
    this.storage.clear();
  }
}

const explodingStorage = new ExplodingStorage();
globalThis.localStorage = explodingStorage;

// QuotaExceeded on authStore
explodingStorage.mode = 'quota';
assert.doesNotThrow(() => {
  useAuthStore.getState().switchRole('staff');
  useAuthStore.getState().logout();
}, 'authStore must handle QuotaExceededError without throwing');
console.log('   ✔ authStore survives QuotaExceededError');

// SecurityError on authStore
explodingStorage.mode = 'security';
assert.doesNotThrow(() => {
  useAuthStore.getState().initAuth();
  useAuthStore.getState().login(defaultAdminUser);
}, 'authStore must handle SecurityError on both read and write');
console.log('   ✔ authStore survives SecurityError (private browsing/iframe restrictions)');

// QuotaExceeded on themeStore
explodingStorage.mode = 'quota';
assert.doesNotThrow(() => {
  useThemeStore.getState().setMode('dark');
  useThemeStore.getState().setPreset('indigo');
}, 'themeStore must handle QuotaExceededError without throwing');
console.log('   ✔ themeStore survives QuotaExceededError');

// SecurityError on themeStore
explodingStorage.mode = 'security';
assert.doesNotThrow(() => {
  useThemeStore.getState().initTheme();
  useThemeStore.getState().setRadius('md');
}, 'themeStore must handle SecurityError without throwing');
console.log('   ✔ themeStore survives SecurityError');

explodingStorage.mode = 'normal';

// ------------------------------------------------------------------
// SECTION 3: Corrupted & Adversarial Storage Payloads
// ------------------------------------------------------------------
console.log('\n3. Testing resilience against corrupted / hostile storage payloads...');

const maliciousPayloads = [
  '{ bad json',
  'null',
  'undefined',
  '12345',
  'true',
  'false',
  '"just a string"',
  '[]',
  '[1, 2, 3]',
  '{"user": null, "isAuthenticated": false}',
  '{"unexpectedField": true}',
  '{"user": "not_an_object"}',
  '{"user": {}, "isAuthenticated": "not_a_boolean"}',
  '<script>alert("xss")</script>',
  '\u0000\u0001\u0002',
];

for (const payload of maliciousPayloads) {
  // Test in authStore
  explodingStorage.setItem(AUTH_STORAGE_KEY, payload);
  assert.doesNotThrow(() => {
    useAuthStore.getState().initAuth();
  }, `authStore.initAuth must not throw on payload: ${payload}`);

  // Test in themeStore
  explodingStorage.setItem(THEME_STORAGE_KEY, payload);
  assert.doesNotThrow(() => {
    useThemeStore.getState().initTheme();
  }, `themeStore.initTheme must not throw on payload: ${payload}`);
}
console.log(`   ✔ Both stores withstood all ${maliciousPayloads.length} corrupted/adversarial payloads`);

// ------------------------------------------------------------------
// SECTION 4: Logout State Persistence Fidelity
// ------------------------------------------------------------------
console.log('\n4. Testing Logout Persistence Fidelity...');
explodingStorage.clear();
useAuthStore.getState().login(defaultCustomerUser);
assert.strictEqual(useAuthStore.getState().isAuthenticated, true);
assert.strictEqual(useAuthStore.getState().user?.role, 'customer');

// Perform logout
useAuthStore.getState().logout();
assert.strictEqual(useAuthStore.getState().isAuthenticated, false);
assert.strictEqual(useAuthStore.getState().user, null);

// Rehydrate: must REMAIN logged out
useAuthStore.getState().initAuth();
assert.strictEqual(useAuthStore.getState().isAuthenticated, false, 'User must remain logged out after rehydration');
assert.strictEqual(useAuthStore.getState().user, null, 'User object must remain null after rehydration');
console.log('   ✔ Logout state is faithfully persisted and rehydrated (does not inadvertently reset to admin)');

// ------------------------------------------------------------------
// SECTION 5: Formatter Boundary & Adversarial Fuzzing
// ------------------------------------------------------------------
console.log('\n5. Stress testing formatters (formatDateVN, formatCurrencyVND, slugify)...');

const dateFuzzCases = [
  { input: null, fallback: 'N/A', expected: 'N/A' },
  { input: undefined, fallback: undefined, expected: '—' },
  { input: '', fallback: 'EMPTY', expected: 'EMPTY' },
  { input: '   ', fallback: 'SPACES', expected: 'SPACES' },
  { input: 'random string', fallback: 'ERR', expected: 'ERR' },
  { input: NaN, fallback: 'NAN', expected: 'NAN' },
  { input: Infinity, fallback: 'INF', expected: 'INF' },
  { input: -Infinity, fallback: '-INF', expected: '-INF' },
  { input: 1e18, fallback: 'OVERFLOW', expected: 'OVERFLOW' }, // Out of Range Date
  { input: new Date(NaN), fallback: 'INVALID_DATE', expected: 'INVALID_DATE' },
  { input: 0, check: (res) => res.includes('1970') }, // Timestamp 0
  { input: new Date('2026-11-05T08:00:00Z'), check: (res) => res.includes('05/11/2026') },
  { input: '2026-02-28T12:00:00Z', check: (res) => res.includes('28/02/2026') },
];

for (const tc of dateFuzzCases) {
  let res;
  assert.doesNotThrow(() => {
    res = formatDateVN(tc.input, tc.fallback);
  }, `formatDateVN must never throw for input: ${tc.input}`);

  if (tc.expected !== undefined) {
    assert.strictEqual(res, tc.expected, `Input ${tc.input} expected ${tc.expected}, got ${res}`);
  }
  if (tc.check) {
    assert.ok(tc.check(res), `Check failed for input ${tc.input}: got ${res}`);
  }
}
console.log(`   ✔ formatDateVN survived all ${dateFuzzCases.length} edge cases`);

// formatCurrencyVND tests
assert.doesNotThrow(() => {
  const zero = formatCurrencyVND(0);
  assert.ok(zero.includes('0') && zero.includes('₫'));
  const normal = formatCurrencyVND(150000);
  assert.ok(normal.includes('150.000') && normal.includes('₫'));
  const large = formatCurrencyVND(50000000000);
  assert.ok(large.includes('50.000.000.000') && large.includes('₫'));
  const negative = formatCurrencyVND(-25000);
  assert.ok(negative.includes('-25.000') && negative.includes('₫'));
});
console.log('   ✔ formatCurrencyVND handles zero, standard, massive, and negative amounts');

// slugify tests
const slugTests = [
  { in: 'Áo Thun Nam Thể Thao Đẹp Giá Rẻ!', out: 'ao-thun-nam-the-thao-dep-gia-re' },
  { in: 'Đồng Hồ Thông Minh 5G - Bản Giới Hạn', out: 'dong-ho-thong-minh-5g-ban-gioi-han' },
  { in: '   ---  Nhiều     khoảng     trắng ---  ', out: 'nhieu-khoang-trang' },
  { in: 'Sản phẩm 100% tự nhiên @#$$&*()', out: 'san-pham-100-tu-nhien' },
  { in: 'Đường, Đỗ, Đi, Đến, Đã, Đậu', out: 'duong-do-di-den-da-dau' },
];
for (const st of slugTests) {
  const actual = slugify(st.in);
  assert.strictEqual(actual, st.out, `slugify failed: "${st.in}" -> "${actual}" (expected "${st.out}")`);
}
console.log(`   ✔ slugify correctly handled Vietnamese diacritics, 'Đ'/'đ', symbols, and whitespace`);

console.log('\n=== ALL REVIEWER ADVERSARIAL STRESS TESTS PASSED (100% OK) ===');
