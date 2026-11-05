import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');

// Setup mock window and document and localStorage for testing DOM and stores in Node.js
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

console.log('--- STARTING ADVERSARIAL VERIFICATION HARNESS ---');

// 1. TEST THEME STORE PERSISTENCE
console.log('\n[TEST 1] Testing useThemeStore state persistence in LocalStorage...');
import { useThemeStore } from '../../src/stores/themeStore.ts';

mockStorage.clear();
useThemeStore.getState().setMode('dark');
const storedAfterMode = mockStorage.getItem('d2c_theme_v1');
console.log('Stored theme after setMode("dark"):', storedAfterMode);
if (!storedAfterMode || !storedAfterMode.includes('"mode":"dark"')) {
  console.error('FAIL: useThemeStore did not persist dark mode to LocalStorage!');
} else {
  console.log('PASS: useThemeStore persisted dark mode.');
}

useThemeStore.getState().setPreset('indigo');
const storedAfterPreset = mockStorage.getItem('d2c_theme_v1');
console.log('Stored theme after setPreset("indigo"):', storedAfterPreset);
if (!storedAfterPreset || !storedAfterPreset.includes('"preset":"indigo"')) {
  console.error('FAIL: useThemeStore did not persist preset to LocalStorage!');
} else {
  console.log('PASS: useThemeStore persisted preset.');
}

useThemeStore.getState().setRadius('full');
const storedAfterRadius = mockStorage.getItem('d2c_theme_v1');
console.log('Stored theme after setRadius("full"):', storedAfterRadius);
if (!storedAfterRadius || !storedAfterRadius.includes('"radius":"full"')) {
  console.error('FAIL: useThemeStore did not persist radius to LocalStorage!');
} else {
  console.log('PASS: useThemeStore persisted radius.');
}

// Test initTheme recovery
useThemeStore.setState({ mode: 'light', preset: 'emerald', radius: 'sm' });
useThemeStore.getState().initTheme();
const recoveredState = useThemeStore.getState();
console.log('Recovered state via initTheme():', { mode: recoveredState.mode, preset: recoveredState.preset, radius: recoveredState.radius });
if (recoveredState.mode === 'dark' && recoveredState.preset === 'indigo' && recoveredState.radius === 'full') {
  console.log('PASS: initTheme() successfully rehydrated state from LocalStorage.');
} else {
  console.error('FAIL: initTheme() failed to rehydrate state from LocalStorage.');
}

// Test malformed JSON recovery
mockStorage.setItem('d2c_theme_v1', '{corrupted_json');
try {
  useThemeStore.getState().initTheme();
  console.log('PASS: initTheme() handled malformed JSON in LocalStorage without crashing.');
} catch (err) {
  console.error('FAIL: initTheme() crashed on malformed JSON:', err);
}

// 2. TEST AUTH STORE PERSISTENCE
console.log('\n[TEST 2] Testing useAuthStore state persistence in LocalStorage...');
import { useAuthStore } from '../../src/stores/authStore.ts';

mockStorage.clear();
const initialUser = useAuthStore.getState().user;
console.log('Initial auth user:', initialUser?.role, initialUser?.name);
console.log('LocalStorage keys before action:', Array.from(mockStorage.store.keys()));

console.log('Executing switchRole("staff")...');
useAuthStore.getState().switchRole('staff');
console.log('User after switchRole("staff"):', useAuthStore.getState().user?.role);
console.log('LocalStorage keys after switchRole("staff"):', Array.from(mockStorage.store.keys()));

const authStorageCheck = Array.from(mockStorage.store.entries()).find(([k, v]) => v.includes('staff') || k.toLowerCase().includes('auth'));
if (!authStorageCheck) {
  console.error('FAIL: useAuthStore does NOT persist authentication or role state to LocalStorage!');
  process.exitCode = 1;
} else {
  console.log('PASS: useAuthStore persisted auth state:', authStorageCheck);
}

// Test initAuth rehydration
useAuthStore.setState({ user: null, isAuthenticated: false });
useAuthStore.getState().initAuth();
const recoveredAuth = useAuthStore.getState();
if (recoveredAuth.user?.role === 'staff' && recoveredAuth.isAuthenticated) {
  console.log('PASS: initAuth() successfully rehydrated state from LocalStorage.');
} else {
  console.error('FAIL: initAuth() failed to rehydrate state from LocalStorage.');
  process.exitCode = 1;
}

// Test malformed JSON recovery in authStore
mockStorage.setItem('d2c_ecommerce:auth:v1', '{corrupt_json');
try {
  useAuthStore.getState().initAuth();
  console.log('PASS: initAuth() handled malformed JSON in LocalStorage without crashing.');
} catch (err) {
  console.error('FAIL: initAuth() crashed on malformed JSON:', err);
  process.exitCode = 1;
}

// 2.1 TEST FORMATTER HARDENING
console.log('\n[TEST 2.1] Testing formatDateVN robustness...');
import { formatDateVN } from '../../src/utils/formatters.ts';
try {
  const emptyRes = formatDateVN('');
  const invalidRes = formatDateVN('invalid_date_str');
  const nullRes = formatDateVN(null);
  const undefRes = formatDateVN(undefined);
  const nanRes = formatDateVN(NaN);
  const customFallbackRes = formatDateVN('invalid', 'N/A');
  const validRes = formatDateVN('2026-11-05T08:00:00Z');

  if (emptyRes === '—' && invalidRes === '—' && nullRes === '—' && undefRes === '—' && nanRes === '—' && customFallbackRes === 'N/A' && validRes.includes('05/11/2026')) {
    console.log('PASS: formatDateVN successfully handled invalid/null/empty inputs with fallback.');
  } else {
    console.error('FAIL: formatDateVN returned unexpected value:', { emptyRes, invalidRes, nullRes, undefRes, nanRes, customFallbackRes, validRes });
    process.exitCode = 1;
  }
} catch (err) {
  console.error('FAIL: formatDateVN threw an exception:', err);
  process.exitCode = 1;
}

// 3. TEST ADMIN & STOREFRONT NAVIGATION
console.log('\n[TEST 3] Testing Navigation Links against registered routes...');
import { defaultAppConfig } from '../../src/config/appConfig.ts';
const routesContent = fs.readFileSync(path.join(ROOT_DIR, 'src/routes/index.tsx'), 'utf8');

// Check Admin Nav
console.log('Checking Admin Nav Items:');
for (const item of defaultAppConfig.adminNav) {
  const routeSegment = item.path.replace(/^\/admin\/?/, '');
  const hasRoute = routesContent.includes(`path: '${routeSegment}'`) || (routeSegment === 'dashboard' && routesContent.includes('dashboard'));
  console.log(`  Admin link [${item.id}] -> ${item.path}: ${hasRoute ? 'MATCH' : 'MISSING'}`);
  if (item.children) {
    for (const child of item.children) {
      const childSegment = child.path.replace(/^\/admin\/?/, '');
      const hasChildRoute = routesContent.includes(`path: '${childSegment}'`);
      console.log(`    Child link [${child.id}] -> ${child.path}: ${hasChildRoute ? 'MATCH' : 'MISSING'}`);
    }
  }
}

// Check Storefront Nav
console.log('Checking Storefront Header Links:');
for (const link of defaultAppConfig.storefrontNav.headerLinks) {
  const pathWithoutQuery = link.path.split('?')[0];
  const routeSegment = pathWithoutQuery.replace(/^\//, '');
  const isHome = pathWithoutQuery === '/';
  const hasRoute = isHome ? routesContent.includes('index: true') : routesContent.includes(`path: '${routeSegment}'`);
  console.log(`  Header link [${link.title}] -> ${link.path}: ${hasRoute ? 'MATCH' : 'MISSING'}`);
}

console.log('Checking Storefront Footer Links:');
for (const col of defaultAppConfig.storefrontNav.footerColumns) {
  console.log(`  Column [${col.title}]:`);
  for (const link of col.links) {
    const routeSegment = link.path.replace(/^\//, '');
    const hasRoute = routesContent.includes(`path: '${routeSegment}'`);
    console.log(`    Footer link [${link.title}] -> ${link.path}: ${hasRoute ? 'MATCH' : 'NOT_FOUND (Fallback to 404)'}`);
  }
}

// 4. TEST BUILD ARTIFACT INTEGRITY
console.log('\n[TEST 4] Testing dist/ bundle artifact sizes and thresholds...');
const distDir = path.join(ROOT_DIR, 'dist');
if (!fs.existsSync(distDir)) {
  console.error('FAIL: dist/ directory does not exist. Run npm run build first.');
} else {
  const assetsDir = path.join(distDir, 'assets');
  const files = fs.readdirSync(assetsDir);
  let allUnderThreshold = true;
  for (const f of files) {
    const fullPath = path.join(assetsDir, f);
    const stat = fs.statSync(fullPath);
    const sizeKB = (stat.size / 1024).toFixed(2);
    const isOver = stat.size > 300 * 1024;
    console.log(`  Artifact: ${f} | Size: ${sizeKB} KB ${isOver ? 'OVER 300KB LIMIT!' : 'OK'}`);
    if (isOver) allUnderThreshold = false;
  }
  if (allUnderThreshold) {
    console.log('PASS: All dist/ assets are strictly < 300KB.');
  } else {
    console.error('FAIL: One or more dist/ assets exceed 300KB.');
  }
}

console.log('\n--- ADVERSARIAL VERIFICATION HARNESS COMPLETE ---');
