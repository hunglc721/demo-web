import assert from 'node:assert/strict';

// Setup Mock DOM & LocalStorage for Node environment
class MockLocalStorage {
  constructor() {
    this.store = new Map();
    this.throwOnSet = false;
    this.throwOnGet = false;
  }
  getItem(key) {
    if (this.throwOnGet) throw new Error('DOMException: SecurityError');
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    if (this.throwOnSet) throw new Error('DOMException: QuotaExceededError');
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

const mockClassList = new Set();
const mockAttributes = new Map();

globalThis.document = {
  documentElement: {
    classList: {
      add: (cls) => mockClassList.add(cls),
      remove: (cls) => mockClassList.delete(cls),
      toggle: (cls, force) => {
        if (force === undefined) {
          if (mockClassList.has(cls)) mockClassList.delete(cls);
          else mockClassList.add(cls);
        } else if (force) {
          mockClassList.add(cls);
        } else {
          mockClassList.delete(cls);
        }
      },
      has: (cls) => mockClassList.has(cls)
    },
    setAttribute: (k, v) => mockAttributes.set(k, v),
    getAttribute: (k) => mockAttributes.get(k)
  }
};

globalThis.window = {
  matchMedia: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {}
  })
};

console.log('=== START CHALLENGER M1 EMPIRICAL STRESS HARNESS ===');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err.message}`);
    process.exitCode = 1;
  }
}

// Import stores and utilities
const {
  useAuthStore,
  AUTH_STORAGE_KEY,
  defaultAdminUser,
  defaultStaffUser,
  defaultCustomerUser,
} = await import('../../src/stores/authStore.ts');

const {
  useThemeStore,
  THEME_STORAGE_KEY,
} = await import('../../src/stores/themeStore.ts');

const { formatDateVN } = await import('../../src/utils/formatters.ts');

console.log('\n--- SECTION 1: AUTH STORE PERSISTENCE & HYDRATION ---');

runTest('1.1 Auth initial state fallback when storage empty', () => {
  mockStorage.clear();
  useAuthStore.getState().initAuth();
  const state = useAuthStore.getState();
  assert.equal(state.isAuthenticated, true);
  assert.equal(state.user?.role, 'admin');
  assert.equal(state.user?.id, defaultAdminUser.id);
});

runTest('1.2 switchRole("staff") persists to AUTH_STORAGE_KEY (d2c_ecommerce:auth:v1)', () => {
  mockStorage.clear();
  useAuthStore.getState().switchRole('staff');
  
  // Verify state
  const state = useAuthStore.getState();
  assert.equal(state.isAuthenticated, true);
  assert.equal(state.user?.role, 'staff');
  assert.equal(state.user?.id, defaultStaffUser.id);

  // Verify LocalStorage
  const raw = mockStorage.getItem(AUTH_STORAGE_KEY);
  assert.ok(raw, `Expected key ${AUTH_STORAGE_KEY} in localStorage`);
  const parsed = JSON.parse(raw);
  assert.equal(parsed.isAuthenticated, true);
  assert.equal(parsed.user?.role, 'staff');
  assert.equal(parsed.user?.id, defaultStaffUser.id);
});

runTest('1.3 initAuth() rehydrates persisted staff role after in-memory state wipe', () => {
  // Wipe in-memory Zustand store
  useAuthStore.setState({ user: null, isAuthenticated: false });
  assert.equal(useAuthStore.getState().user, null);
  assert.equal(useAuthStore.getState().isAuthenticated, false);

  // Call initAuth
  useAuthStore.getState().initAuth();
  const rehydrated = useAuthStore.getState();
  assert.equal(rehydrated.isAuthenticated, true);
  assert.equal(rehydrated.user?.role, 'staff');
});

runTest('1.4 switchRole("customer") updates both state and storage', () => {
  useAuthStore.getState().switchRole('customer');
  assert.equal(useAuthStore.getState().user?.role, 'customer');
  
  const raw = mockStorage.getItem(AUTH_STORAGE_KEY);
  const parsed = JSON.parse(raw);
  assert.equal(parsed.user?.role, 'customer');
  assert.equal(parsed.user?.id, defaultCustomerUser.id);
});

runTest('1.5 login(customUser) updates state and storage', () => {
  const customUser = {
    id: 'usr_custom_99',
    name: 'VIP User',
    email: 'vip@test.com',
    role: 'customer',
  };
  useAuthStore.getState().login(customUser);
  assert.equal(useAuthStore.getState().user?.name, 'VIP User');

  const raw = mockStorage.getItem(AUTH_STORAGE_KEY);
  const parsed = JSON.parse(raw);
  assert.equal(parsed.user?.name, 'VIP User');
  assert.equal(parsed.isAuthenticated, true);
});

runTest('1.6 logout() clears state and persists logged-out status', () => {
  useAuthStore.getState().logout();
  assert.equal(useAuthStore.getState().user, null);
  assert.equal(useAuthStore.getState().isAuthenticated, false);

  const raw = mockStorage.getItem(AUTH_STORAGE_KEY);
  const parsed = JSON.parse(raw);
  assert.equal(parsed.user, null);
  assert.equal(parsed.isAuthenticated, false);

  // Rehydration preserves logged-out status
  useAuthStore.getState().initAuth();
  assert.equal(useAuthStore.getState().user, null);
  assert.equal(useAuthStore.getState().isAuthenticated, false);
});

console.log('\n--- SECTION 2: ADVERSARIAL CORRUPTION & STORAGE RESILIENCY ---');

runTest('2.1 Malformed JSON in LocalStorage recovers cleanly without throwing', () => {
  mockStorage.setItem(AUTH_STORAGE_KEY, '{invalid_json: true,,,}');
  assert.doesNotThrow(() => {
    useAuthStore.getState().initAuth();
  });
  const state = useAuthStore.getState();
  assert.equal(state.isAuthenticated, true);
  assert.equal(state.user?.role, 'admin');
});

runTest('2.2 Primitive non-object JSON values recover cleanly', () => {
  for (const primitive of ['12345', '"hello"', 'true', 'false', 'null', '[]']) {
    mockStorage.setItem(AUTH_STORAGE_KEY, primitive);
    assert.doesNotThrow(() => {
      useAuthStore.getState().initAuth();
    });
    const state = useAuthStore.getState();
    assert.ok(state.user !== null, `Failed on primitive: ${primitive}`);
  }
});

runTest('2.3 LocalStorage QuotaExceededError does not crash switchRole, login, or logout', () => {
  mockStorage.throwOnSet = true;
  assert.doesNotThrow(() => {
    useAuthStore.getState().switchRole('staff');
  });
  assert.equal(useAuthStore.getState().user?.role, 'staff');

  assert.doesNotThrow(() => {
    useAuthStore.getState().logout();
  });
  assert.equal(useAuthStore.getState().user, null);

  mockStorage.throwOnSet = false;
});

runTest('2.4 LocalStorage SecurityError / getItem throw does not crash initAuth()', () => {
  mockStorage.throwOnGet = true;
  assert.doesNotThrow(() => {
    useAuthStore.getState().initAuth();
  });
  const state = useAuthStore.getState();
  assert.equal(state.user?.role, 'admin');
  mockStorage.throwOnGet = false;
});

console.log('\n--- SECTION 3: FORMATTER ADVERSARIAL FUZZING ---');

runTest('3.1 formatDateVN handles null, undefined, empty string, NaN, invalid-date', () => {
  assert.equal(formatDateVN(null), '—');
  assert.equal(formatDateVN(undefined), '—');
  assert.equal(formatDateVN(''), '—');
  assert.equal(formatDateVN('   '), '—');
  assert.equal(formatDateVN('invalid-date'), '—');
  assert.equal(formatDateVN('2026-99-99'), '—');
  assert.equal(formatDateVN(NaN), '—');
});

runTest('3.2 formatDateVN respects custom fallback string', () => {
  assert.equal(formatDateVN(null, 'Chưa có'), 'Chưa có');
  assert.equal(formatDateVN(undefined, 'N/A'), 'N/A');
  assert.equal(formatDateVN('gibberish', 'Trống'), 'Trống');
});

runTest('3.3 formatDateVN handles numeric timestamps, Date instances, and ISO strings', () => {
  const isoRes = formatDateVN('2026-11-05T08:30:00Z');
  assert.ok(isoRes.includes('05/11/2026') || isoRes.includes('11/05/2026'), `Unexpected ISO result: ${isoRes}`);

  const dateObj = new Date('2026-01-15T10:00:00Z');
  const dateRes = formatDateVN(dateObj);
  assert.ok(dateRes.includes('15/01/2026') || dateRes.includes('01/15/2026'), `Unexpected Date object result: ${dateRes}`);

  const timestampRes = formatDateVN(1762330800000);
  assert.ok(typeof timestampRes === 'string' && timestampRes !== '—');

  // Timestamp 0 (Unix epoch) is valid and should not fall back to '—'
  const epochRes = formatDateVN(0);
  assert.ok(typeof epochRes === 'string' && epochRes !== '—', `Epoch 0 should format, got: ${epochRes}`);
});

console.log('\n--- SECTION 4: THEME DUAL-KEY PERSISTENCE & RESILIENCE ---');

runTest('4.1 useThemeStore persists to both THEME_STORAGE_KEY and legacy d2c_theme_v1', () => {
  mockStorage.clear();
  useThemeStore.getState().setMode('dark');
  useThemeStore.getState().setPreset('rose');
  useThemeStore.getState().setRadius('lg');

  const canonical = mockStorage.getItem(THEME_STORAGE_KEY);
  const legacy = mockStorage.getItem('d2c_theme_v1');

  assert.ok(canonical, `Canonical key ${THEME_STORAGE_KEY} missing`);
  assert.ok(legacy, 'Legacy key d2c_theme_v1 missing');

  const parsedCanonical = JSON.parse(canonical);
  const parsedLegacy = JSON.parse(legacy);

  assert.equal(parsedCanonical.mode, 'dark');
  assert.equal(parsedCanonical.preset, 'rose');
  assert.equal(parsedCanonical.radius, 'lg');

  assert.deepEqual(parsedCanonical, parsedLegacy);
});

runTest('4.2 initTheme rehydrates from canonical or legacy storage correctly', () => {
  useThemeStore.setState({ mode: 'light', preset: 'indigo', radius: 'sm' });
  useThemeStore.getState().initTheme();

  const current = useThemeStore.getState();
  assert.equal(current.mode, 'dark');
  assert.equal(current.preset, 'rose');
  assert.equal(current.radius, 'lg');
});

runTest('4.3 Corrupt theme storage recovers with defaults without crashing', () => {
  mockStorage.setItem(THEME_STORAGE_KEY, '{broken');
  mockStorage.setItem('d2c_theme_v1', '{broken');

  assert.doesNotThrow(() => {
    useThemeStore.getState().initTheme();
  });
});

console.log(`\n=== STRESS HARNESS SUMMARY: ${passedTests}/${totalTests} TESTS PASSED ===\n`);
if (passedTests !== totalTests) {
  process.exit(1);
}
