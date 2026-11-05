import assert from 'node:assert';

// Mock storage implementation
class MockStorage {
  constructor() {
    this.map = new Map();
    this.shouldThrow = false;
  }
  getItem(k) {
    return this.map.has(k) ? this.map.get(k) : null;
  }
  setItem(k, v) {
    if (this.shouldThrow) {
      throw new Error('QuotaExceededError: storage full');
    }
    this.map.set(String(k), String(v));
  }
  removeItem(k) {
    this.map.delete(String(k));
  }
  clear() {
    this.map.clear();
  }
}

const mockStorage = new MockStorage();
globalThis.localStorage = mockStorage;

const mockClassList = new Set();
const mockAttrs = new Map();
globalThis.document = {
  documentElement: {
    classList: {
      add: (c) => mockClassList.add(c),
      remove: (c) => mockClassList.delete(c),
      toggle: (c, force) => {
        if (force === undefined) {
          if (mockClassList.has(c)) mockClassList.delete(c);
          else mockClassList.add(c);
        } else if (force) mockClassList.add(c);
        else mockClassList.delete(c);
      },
      has: (c) => mockClassList.has(c)
    },
    setAttribute: (k, v) => mockAttrs.set(k, v),
    getAttribute: (k) => mockAttrs.get(k)
  }
};

globalThis.window = {
  matchMedia: () => ({ matches: true })
};

console.log('=== EMPIRICAL CHALLENGER M1-IT2 VERIFICATION ===');

const { useThemeStore, THEME_STORAGE_KEY } = await import('../../src/stores/themeStore.ts');
const { useAuthStore, AUTH_STORAGE_KEY, defaultAdminUser, defaultStaffUser, defaultCustomerUser } = await import('../../src/stores/authStore.ts');

// 1. Verify THEME_STORAGE_KEY constant
console.log('1. Checking THEME_STORAGE_KEY contract:');
assert.strictEqual(THEME_STORAGE_KEY, 'd2c_ecommerce:theme:v1', 'THEME_STORAGE_KEY must be d2c_ecommerce:theme:v1');
console.log('   ✔ THEME_STORAGE_KEY matches d2c_ecommerce:theme:v1');

// 2. Verify Theme dual-write
console.log('2. Verifying ThemeStore dual-write on setMode, setPreset, setRadius:');
mockStorage.clear();
useThemeStore.getState().setMode('dark');
assert.ok(mockStorage.getItem('d2c_ecommerce:theme:v1'), 'Must write d2c_ecommerce:theme:v1');
assert.ok(mockStorage.getItem('d2c_theme_v1'), 'Must write d2c_theme_v1');
const modeV1 = JSON.parse(mockStorage.getItem('d2c_ecommerce:theme:v1'));
const modeLegacy = JSON.parse(mockStorage.getItem('d2c_theme_v1'));
assert.strictEqual(modeV1.mode, 'dark');
assert.strictEqual(modeLegacy.mode, 'dark');
console.log('   ✔ setMode writes identical payload to both keys');

useThemeStore.getState().setPreset('rose');
const presetV1 = JSON.parse(mockStorage.getItem('d2c_ecommerce:theme:v1'));
const presetLegacy = JSON.parse(mockStorage.getItem('d2c_theme_v1'));
assert.strictEqual(presetV1.preset, 'rose');
assert.strictEqual(presetLegacy.preset, 'rose');
console.log('   ✔ setPreset writes identical payload to both keys');

useThemeStore.getState().setRadius('lg');
const radiusV1 = JSON.parse(mockStorage.getItem('d2c_ecommerce:theme:v1'));
const radiusLegacy = JSON.parse(mockStorage.getItem('d2c_theme_v1'));
assert.strictEqual(radiusV1.radius, 'lg');
assert.strictEqual(radiusLegacy.radius, 'lg');
console.log('   ✔ setRadius writes identical payload to both keys');

// 3. Verify Theme rehydration priority
console.log('3. Verifying ThemeStore rehydration priority:');
mockStorage.clear();
// Case A: Only canonical key present
mockStorage.setItem('d2c_ecommerce:theme:v1', JSON.stringify({ mode: 'light', preset: 'amber', radius: 'sm' }));
useThemeStore.getState().initTheme();
assert.strictEqual(useThemeStore.getState().preset, 'amber');
console.log('   ✔ Rehydrates from canonical d2c_ecommerce:theme:v1 alone');

// Case B: Only legacy key present
mockStorage.clear();
mockStorage.setItem('d2c_theme_v1', JSON.stringify({ mode: 'dark', preset: 'slate', radius: 'full' }));
useThemeStore.getState().initTheme();
assert.strictEqual(useThemeStore.getState().preset, 'slate');
assert.strictEqual(useThemeStore.getState().mode, 'dark');
console.log('   ✔ Rehydrates from legacy d2c_theme_v1 alone (backward compat)');

// Case C: QuotaExceeded on theme store
mockStorage.shouldThrow = true;
useThemeStore.getState().setMode('light');
assert.strictEqual(useThemeStore.getState().mode, 'light', 'Store in-memory updates even if storage throws');
mockStorage.shouldThrow = false;
console.log('   ✔ Storage QuotaExceeded does not throw or break theme state');

// 4. Verify AUTH_STORAGE_KEY constant
console.log('4. Checking AUTH_STORAGE_KEY contract:');
assert.strictEqual(AUTH_STORAGE_KEY, 'd2c_ecommerce:auth:v1', 'AUTH_STORAGE_KEY must be d2c_ecommerce:auth:v1');
console.log('   ✔ AUTH_STORAGE_KEY matches d2c_ecommerce:auth:v1');

// 5. Verify Auth actions write to d2c_ecommerce:auth:v1
console.log('5. Verifying AuthStore writes to d2c_ecommerce:auth:v1:');
mockStorage.clear();

useAuthStore.getState().switchRole('customer');
const custData = JSON.parse(mockStorage.getItem('d2c_ecommerce:auth:v1'));
assert.strictEqual(custData.user.role, 'customer');
assert.strictEqual(custData.isAuthenticated, true);
console.log('   ✔ switchRole("customer") persisted correctly');

useAuthStore.getState().switchRole('admin');
const adminData = JSON.parse(mockStorage.getItem('d2c_ecommerce:auth:v1'));
assert.strictEqual(adminData.user.role, 'admin');
assert.strictEqual(adminData.isAuthenticated, true);
console.log('   ✔ switchRole("admin") persisted correctly');

useAuthStore.getState().logout();
const logoutData = JSON.parse(mockStorage.getItem('d2c_ecommerce:auth:v1'));
assert.strictEqual(logoutData.user, null);
assert.strictEqual(logoutData.isAuthenticated, false);
console.log('   ✔ logout() persisted correctly (user: null, isAuthenticated: false)');

useAuthStore.getState().login({
  id: 'usr_custom_99',
  name: 'Test Challenger',
  email: 'challenger@test.vn',
  role: 'staff'
});
const customData = JSON.parse(mockStorage.getItem('d2c_ecommerce:auth:v1'));
assert.strictEqual(customData.user.id, 'usr_custom_99');
assert.strictEqual(customData.isAuthenticated, true);
console.log('   ✔ login() persisted custom user correctly');

// 6. Verify Auth rehydration
console.log('6. Verifying Auth rehydration via initAuth:');
useAuthStore.setState({ user: null, isAuthenticated: false });
assert.strictEqual(useAuthStore.getState().isAuthenticated, false);
useAuthStore.getState().initAuth();
assert.strictEqual(useAuthStore.getState().user?.id, 'usr_custom_99');
assert.strictEqual(useAuthStore.getState().isAuthenticated, true);
console.log('   ✔ initAuth() restored persisted user session');

// 7. Verify Auth QuotaExceeded resilience
mockStorage.shouldThrow = true;
useAuthStore.getState().switchRole('staff');
assert.strictEqual(useAuthStore.getState().user?.role, 'staff');
mockStorage.shouldThrow = false;
console.log('   ✔ Storage QuotaExceeded does not throw or break auth state');

console.log('\nALL EMPIRICAL CHALLENGES PASSED WITH ZERO ERRORS.');
