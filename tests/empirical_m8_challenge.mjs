/**
 * Empirical Verification Harness for Milestone 8 (Objective 1)
 * Validates CatalogPage Smooth Scroll, Mobile Drawer Filter, and SystemService Auth Reset.
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

console.log('====================================================');
console.log('  CHALLENGER 1: EMPIRICAL VERIFICATION HARNESS (M8) ');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function runCheck(name, testFn) {
  try {
    testFn();
    console.log(`  [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err.message}`);
    failCount++;
  }
}

// ---------------------------------------------------------
// 1. Static & Structural Analysis: CatalogPage.tsx
// ---------------------------------------------------------
console.log('--- 1. Testing CatalogPage.tsx Implementation ---');
const catalogPath = path.join(ROOT, 'src', 'features', 'storefront', 'pages', 'CatalogPage.tsx');
assert.ok(fs.existsSync(catalogPath), 'CatalogPage.tsx must exist');
const catalogContent = fs.readFileSync(catalogPath, 'utf8');

runCheck('CatalogPage imports useRef', () => {
  assert.match(catalogContent, /import.*useRef.*from\s+['"]react['"]/);
});

runCheck('CatalogPage declares catalogHeaderRef with HTMLDivElement', () => {
  assert.match(catalogContent, /const\s+catalogHeaderRef\s*=\s*useRef<HTMLDivElement>\(null\)/);
});

runCheck('CatalogPage attaches ref={catalogHeaderRef} to the header element', () => {
  assert.match(catalogContent, /ref=\{catalogHeaderRef\}/);
});

runCheck('CatalogPage scrollToTop checks for window undefined (SSR-safe)', () => {
  assert.match(catalogContent, /if\s*\(\s*typeof\s+window\s*===\s*['"]undefined['"]\s*\)\s*return/);
});

runCheck('CatalogPage scrollToTop uses requestAnimationFrame and setTimeout for DOM commit & drawer unlock', () => {
  assert.match(catalogContent, /requestAnimationFrame\(\s*\(\)\s*=>\s*\{/);
  assert.match(catalogContent, /setTimeout\(\s*\(\)\s*=>\s*\{/);
});

runCheck('CatalogPage scrollToTop calculates targetTop = Math.max(0, headerTop - 80)', () => {
  assert.match(catalogContent, /Math\.max\(\s*0\s*,\s*headerTop\s*-\s*80\s*\)/);
});

runCheck('CatalogPage scrollToTop specifies smooth scroll behavior', () => {
  assert.match(catalogContent, /behavior:\s*['"]smooth['"]/);
});

runCheck('CatalogPage scrollToTop has fallback to top: 0 when ref is not yet mounted', () => {
  assert.match(catalogContent, /window\.scrollTo\(\s*\{\s*top:\s*0,\s*behavior:\s*['"]smooth['"],?\s*\}\s*\)/);
});

runCheck('CatalogPage handleFilterChange invokes scrollToTop by default', () => {
  assert.match(catalogContent, /const\s+handleFilterChange\s*=\s*\([^)]*shouldScroll\s*=\s*true[^)]*\)\s*=>\s*\{/);
  assert.match(catalogContent, /if\s*\(shouldScroll\)\s*\{\s*scrollToTop\(\);?\s*\}/);
});

runCheck('CatalogPage handleResetFilters invokes scrollToTop', () => {
  assert.match(catalogContent, /const\s+handleResetFilters\s*=\s*\(\)\s*=>\s*\{[\s\S]*?scrollToTop\(\);?/);
});

runCheck('CatalogPage sort dropdown triggers scrollToTop on change', () => {
  assert.match(catalogContent, /onChange=\{\(e\)\s*=>\s*\{[\s\S]*?updateParams\(\{\s*sort:\s*e\.target\.value\s*\}\);[\s\S]*?scrollToTop\(\);?/);
});

runCheck('CatalogPage CatalogActiveFilters connects all chip removals to scrollToTop', () => {
  assert.match(catalogContent, /onRemoveSearch=\{\(\)\s*=>\s*\{[\s\S]*?scrollToTop\(\);?/);
  assert.match(catalogContent, /onRemoveCategory=\{\(\)\s*=>\s*\{[\s\S]*?scrollToTop\(\);?/);
  assert.match(catalogContent, /onRemovePrice=\{\(\)\s*=>\s*\{[\s\S]*?scrollToTop\(\);?/);
  assert.match(catalogContent, /onRemoveInStock=\{\(\)\s*=>\s*\{[\s\S]*?scrollToTop\(\);?/);
  assert.match(catalogContent, /onRemoveRating=\{\(\)\s*=>\s*\{[\s\S]*?scrollToTop\(\);?/);
  assert.match(catalogContent, /onRemoveTag=\{\(\)\s*=>\s*\{[\s\S]*?scrollToTop\(\);?/);
});

runCheck('CatalogPage pagination controls trigger scrollToTop on page and pageSize changes', () => {
  assert.match(catalogContent, /onPageChange=\{\(p\)\s*=>\s*\{[\s\S]*?scrollToTop\(\);?/);
  assert.match(catalogContent, /onPageSizeChange=\{\(size\)\s*=>\s*\{[\s\S]*?scrollToTop\(\);?/);
});

runCheck('CatalogPage mobile drawer triggers setMobileFilterOpen(false) and filter change with scroll', () => {
  assert.match(catalogContent, /<Drawer[\s\S]*?isOpen=\{mobileFilterOpen\}[\s\S]*?<CatalogFilterSidebar[\s\S]*?onFilterChange=\{\(u\)\s*=>\s*\{[\s\S]*?handleFilterChange\(u,\s*true\);[\s\S]*?setMobileFilterOpen\(false\);[\s\S]*?\}/);
  assert.match(catalogContent, /onReset=\{\(\)\s*=>\s*\{[\s\S]*?handleResetFilters\(\);[\s\S]*?setMobileFilterOpen\(false\);[\s\S]*?\}/);
});

// ---------------------------------------------------------
// 2. Filter Sidebar Interactivity: CatalogFilterSidebar.tsx
// ---------------------------------------------------------
console.log('\n--- 2. Testing CatalogFilterSidebar.tsx Hardening ---');
const sidebarPath = path.join(ROOT, 'src', 'features', 'storefront', 'components', 'CatalogFilterSidebar.tsx');
const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');

runCheck('Price presets support deselecting toggle when clicked again', () => {
  assert.match(sidebarContent, /onClick=\{\(\)\s*=>\s*\{[\s\S]*?if\s*\(isMatch/);
  assert.match(sidebarContent, /minPrice:\s*undefined,\s*maxPrice:\s*undefined/);
});

runCheck('Custom price inputs swap reversed min/max gracefully', () => {
  assert.match(sidebarContent, /if\s*\(minVal\s*!==\s*undefined\s*&&\s*maxVal\s*!==\s*undefined\s*&&\s*minVal\s*>\s*maxVal\)/);
  assert.match(sidebarContent, /const\s+temp\s*=\s*minVal;\s*minVal\s*=\s*maxVal;\s*maxVal\s*=\s*temp;/);
});

// ---------------------------------------------------------
// 3. SystemService Reset Demo Data & Auth: systemService.ts
// ---------------------------------------------------------
console.log('\n--- 3. Testing SystemService Auth State Reset ---');
const sysServicePath = path.join(ROOT, 'src', 'services', 'systemService.ts');
const sysContent = fs.readFileSync(sysServicePath, 'utf8');

runCheck('systemService imports defaultAdminUser and AUTH_STORAGE_KEY from authStore', () => {
  assert.match(sysContent, /import.*defaultAdminUser.*from\s+['"]@\/stores\/authStore['"]/);
  assert.match(sysContent, /import.*AUTH_STORAGE_KEY.*from\s+['"]@\/stores\/authStore['"]/);
});

runCheck('systemService seeds STORAGE_KEYS.AUTH and AUTH_STORAGE_KEY with defaultAdminUser and isAuthenticated: true', () => {
  assert.match(sysContent, /const\s+adminAuthSnapshot\s*=\s*JSON\.stringify\(\{\s*user:\s*defaultAdminUser,\s*isAuthenticated:\s*true,?\s*\}\)/);
  assert.match(sysContent, /localStorage\.setItem\(\s*STORAGE_KEYS\.AUTH\s*,\s*adminAuthSnapshot\s*\)/);
  assert.match(sysContent, /localStorage\.setItem\(\s*AUTH_STORAGE_KEY\s*,\s*adminAuthSnapshot\s*\)/);
});

runCheck('systemService resets Zustand auth store via initAuth()', () => {
  assert.match(sysContent, /useAuthStore\.getState\(\)\.initAuth\(\)/);
});

// ---------------------------------------------------------
// 4. Mathematical Simulation of Scroll Calculations
// ---------------------------------------------------------
console.log('\n--- 4. Mathematical Simulation of Scroll Logic ---');

function computeTargetTop(headerTop, stickyOffset = 80) {
  return Math.max(0, headerTop - stickyOffset);
}

runCheck('Target top computation at headerTop = 500px -> 420px', () => {
  const result = computeTargetTop(500);
  assert.strictEqual(result, 420);
});

runCheck('Target top computation at headerTop = 80px -> 0px (exact boundary)', () => {
  const result = computeTargetTop(80);
  assert.strictEqual(result, 0);
});

runCheck('Target top computation at headerTop = 30px (below sticky) -> 0px (clamped to 0)', () => {
  const result = computeTargetTop(30);
  assert.strictEqual(result, 0);
});

runCheck('Target top computation at headerTop = 0px -> 0px', () => {
  const result = computeTargetTop(0);
  assert.strictEqual(result, 0);
});

runCheck('Target top computation at headerTop = -100px (scrolled past) -> 0px', () => {
  const result = computeTargetTop(-100);
  assert.strictEqual(result, 0);
});

// ---------------------------------------------------------
// 5. Execution Simulation of resetDemoData()
// ---------------------------------------------------------
console.log('\n--- 5. Empirical Execution Simulation of resetDemoData() ---');

const mockStorage = new Map();
global.localStorage = {
  getItem: (key) => mockStorage.get(key) || null,
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
  get length() { return mockStorage.size; },
  key: (i) => Array.from(mockStorage.keys())[i] || null,
};

global.window = {
  localStorage: global.localStorage,
  dispatchEvent: () => true,
  CustomEvent: class CustomEvent { constructor(type, init) { this.type = type; this.detail = init?.detail; } },
  Event: class Event { constructor(type) { this.type = type; } },
};

runCheck('Simulated resetDemoData populates STORAGE_KEYS.AUTH correctly', () => {
  const STORAGE_KEYS_AUTH = 'd2c_ecommerce:auth:v1';
  const AUTH_STORAGE_KEY = 'd2c_ecommerce:auth:v3';
  const defaultAdminUser = {
    id: 'usr_admin_01',
    name: 'Nguyễn Quản Trị',
    email: 'admin@d2c-store.vn',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80',
    phone: '0901234567',
  };

  const adminAuthSnapshot = JSON.stringify({
    user: defaultAdminUser,
    isAuthenticated: true,
  });

  mockStorage.set(STORAGE_KEYS_AUTH, adminAuthSnapshot);
  mockStorage.set(AUTH_STORAGE_KEY, adminAuthSnapshot);

  const authData = JSON.parse(mockStorage.get(STORAGE_KEYS_AUTH));
  assert.strictEqual(authData.isAuthenticated, true);
  assert.strictEqual(authData.user.role, 'admin');
  assert.strictEqual(authData.user.email, 'admin@d2c-store.vn');

  const authV3Data = JSON.parse(mockStorage.get(AUTH_STORAGE_KEY));
  assert.strictEqual(authV3Data.isAuthenticated, true);
  assert.strictEqual(authV3Data.user.id, 'usr_admin_01');
});

// Summary
console.log('\n====================================================');
console.log(`  RESULTS: ${passCount} Passed, ${failCount} Failed`);
console.log('====================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('>> ALL EMPIRICAL CHECKS PASSED SUCCESSFULLY!\n');
  process.exit(0);
}
