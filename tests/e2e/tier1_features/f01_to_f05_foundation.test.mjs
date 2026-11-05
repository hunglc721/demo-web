/**
 * Tier 1 Contract & Smoke Tests: Features 1 - 5 (Milestone 1 Foundation)
 * Feature 1: Vite + React + TS Scaffolding
 * Feature 2: Layered Directory & Path Aliases
 * Feature 3: Tailwind CSS & Dynamic CSS Theming
 * Feature 4: Centralized appConfig.ts
 * Feature 5: React Router 6 & Shell Layouts
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, test } from '../runner.mjs';
import {
  assert,
  assertEqual,
  assertNotEqual,
  assertDeepEqual,
  assertMatch,
  assertIncludes,
  assertContract
} from '../helpers/assertions.mjs';

// Resolve project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..', '..');

// Import application modules to test
import { defaultAppConfig } from '../../../src/config/appConfig.ts';
import { formatCurrencyVND, formatDateVN, slugify } from '../../../src/utils/formatters.ts';
import { cn } from '../../../src/utils/cn.ts';

// -----------------------------------------------------------------------------
// FEATURE 1: Vite + React + TS Scaffolding (5 tests)
// -----------------------------------------------------------------------------
describe('Feature 1: Vite + React + TS Scaffolding', () => {
  test('F01-1: package.json specifies ESM module format and valid scripts', () => {
    const pkgPath = path.join(ROOT_DIR, 'package.json');
    assert(fs.existsSync(pkgPath), 'package.json must exist at project root');

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    assertEqual(pkg.type, 'module', 'package.json type must be "module"');
    assert(pkg.scripts.dev, 'scripts.dev must be defined');
    assert(pkg.scripts.build, 'scripts.build must be defined');
    assert(pkg.scripts.preview, 'scripts.preview must be defined');
  });

  test('F01-2: package.json contains all required production dependencies', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
    const deps = Object.keys(pkg.dependencies || {});

    const requiredDeps = [
      'react',
      'react-dom',
      'react-router-dom',
      'zustand',
      'lucide-react',
      'clsx',
      'tailwind-merge',
      'zod',
      'react-hook-form'
    ];

    for (const dep of requiredDeps) {
      assert(deps.includes(dep), `package.json must include dependency "${dep}"`);
    }
  });

  test('F01-3: tsconfig.json configures strict mode and JSX transform', () => {
    const tsconfigPath = path.join(ROOT_DIR, 'tsconfig.json');
    assert(fs.existsSync(tsconfigPath), 'tsconfig.json must exist');

    const raw = fs.readFileSync(tsconfigPath, 'utf8');
    // Strip trailing commas or comments for standard JSON parsing
    const cleaned = raw.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '').replace(/,(\s*[}\]])/g, '$1');
    const tsconfig = JSON.parse(cleaned);

    const opts = tsconfig.compilerOptions;
    assertEqual(opts.strict, true, 'TypeScript compilerOptions.strict must be true');
    assertEqual(opts.jsx, 'react-jsx', 'compilerOptions.jsx must be "react-jsx"');
  });

  test('F01-4: vite.config.ts configures React plugin and path resolution', () => {
    const viteConfigPath = path.join(ROOT_DIR, 'vite.config.ts');
    assert(fs.existsSync(viteConfigPath), 'vite.config.ts must exist');

    const content = fs.readFileSync(viteConfigPath, 'utf8');
    assertIncludes(content, '@vitejs/plugin-react', 'vite.config.ts must import @vitejs/plugin-react');
    assertIncludes(content, 'react()', 'vite.config.ts must invoke react() plugin');
    assertIncludes(content, 'resolve', 'vite.config.ts must configure path resolve alias');
  });

  test('F01-5: index.html contains root container and responsive viewport tags', () => {
    const htmlPath = path.join(ROOT_DIR, 'index.html');
    assert(fs.existsSync(htmlPath), 'index.html must exist at project root');

    const content = fs.readFileSync(htmlPath, 'utf8');
    assertIncludes(content, 'id="root"', 'index.html must contain root mount div');
    assertIncludes(content, 'viewport', 'index.html must contain viewport meta tag');
    assertIncludes(content, '/src/main.tsx', 'index.html must load /src/main.tsx');
  });
});

// -----------------------------------------------------------------------------
// FEATURE 2: Layered Directory & Path Aliases (5 tests)
// -----------------------------------------------------------------------------
describe('Feature 2: Layered Directory & Path Aliases', () => {
  test('F02-1: layered architectural directories exist per specification', () => {
    const requiredDirs = [
      'src/core',
      'src/config',
      'src/layouts',
      'src/stores',
      'src/utils'
    ];

    for (const dir of requiredDirs) {
      const fullPath = path.join(ROOT_DIR, dir);
      assert(fs.existsSync(fullPath), `Directory "${dir}" must exist`);
      assert(fs.statSync(fullPath).isDirectory(), `"${dir}" must be a directory`);
    }
  });

  test('F02-2: tsconfig.json maps @/* alias unambiguously to src/*', () => {
    const tsconfigPath = path.join(ROOT_DIR, 'tsconfig.json');
    const raw = fs.readFileSync(tsconfigPath, 'utf8');
    const cleaned = raw.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '').replace(/,(\s*[}\]])/g, '$1');
    const tsconfig = JSON.parse(cleaned);

    const paths = tsconfig.compilerOptions.paths;
    assert(paths, 'compilerOptions.paths must be configured');
    assert(paths['@/*'], 'compilerOptions.paths["@/*"] must be configured');
    assert(paths['@/*'][0].includes('src'), 'alias path must point to src/* directory');
  });

  test('F02-3: vite.config.ts defines @ alias resolving to src directory', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'vite.config.ts'), 'utf8');
    assertMatch(content, /['"]@['"]\s*:\s*path\.resolve/, 'vite.config.ts must define "@" path alias');
  });

  test('F02-4: utility layer exports working cn() className merger', () => {
    assert(typeof cn === 'function', 'cn helper must be a function');
    const merged = cn('px-4 py-2', 'px-6', false && 'hidden', undefined, 'text-white');
    // tailwind-merge resolves conflicting padding to px-6
    assertEqual(merged, 'py-2 px-6 text-white', 'cn() should resolve Tailwind class conflicts');
  });

  test('F02-5: utility formatters strictly adhere to Vietnamese conventions', () => {
    // 1. Currency formatting (e.g. 150000 -> 150.000 ₫)
    const currencyStr = formatCurrencyVND(150000);
    assert(currencyStr.includes('150.000'), `Currency must format thousands with dots: ${currencyStr}`);
    assert(currencyStr.includes('₫'), `Currency must include Vietnamese Dong symbol: ${currencyStr}`);

    // 2. Slugify Vietnamese accents
    const slug = slugify('Áo Thun Nam Cotton Compact 250GSM');
    assertEqual(slug, 'ao-thun-nam-cotton-compact-250gsm', 'slugify must normalize Vietnamese diacritics');

    // 3. Date formatting
    const testDate = new Date('2026-11-05T08:00:00Z');
    const formattedDate = formatDateVN(testDate);
    assert(typeof formattedDate === 'string' && formattedDate.length > 0, 'formatDateVN must return non-empty string');
  });
});

// -----------------------------------------------------------------------------
// FEATURE 3: Tailwind CSS & Dynamic CSS Theming (5 tests)
// -----------------------------------------------------------------------------
describe('Feature 3: Tailwind CSS & Dynamic CSS Theming', () => {
  test('F03-1: tailwind.config.js references CSS variable color tokens', () => {
    const tailwindPath = path.join(ROOT_DIR, 'tailwind.config.js');
    assert(fs.existsSync(tailwindPath), 'tailwind.config.js must exist');

    const content = fs.readFileSync(tailwindPath, 'utf8');
    assertIncludes(content, '--color-primary', 'tailwind.config.js must reference --color-primary');
    assertIncludes(content, 'var(', 'tailwind.config.js must use dynamic var() functions');
  });

  test('F03-2: src/index.css defines root CSS variables for light theme', () => {
    const cssPath = path.join(ROOT_DIR, 'src/index.css');
    assert(fs.existsSync(cssPath), 'src/index.css must exist');

    const content = fs.readFileSync(cssPath, 'utf8');
    assertIncludes(content, ':root', 'src/index.css must define :root scope');
    assertIncludes(content, '--color-primary:', 'src/index.css must define --color-primary');
    assertIncludes(content, '--color-bg-base:', 'src/index.css must define --color-bg-base');
    assertIncludes(content, '--color-text-main:', 'src/index.css must define --color-text-main');
  });

  test('F03-3: src/index.css specifies dark mode color palette overrides', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/index.css'), 'utf8');
    assertIncludes(content, '.dark', 'src/index.css must include .dark class selector');
    assertIncludes(content, '--color-bg-base: 15 23 42;', 'dark mode must define slate-900 background');
  });

  test('F03-4: src/index.css defines all 5 required D2C theme presets', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/index.css'), 'utf8');
    const requiredPresets = ['emerald', 'indigo', 'rose', 'amber', 'slate'];

    for (const preset of requiredPresets) {
      const selector = `[data-theme-preset="${preset}"]`;
      assertIncludes(content, selector, `src/index.css must define selector ${selector}`);
    }
  });

  test('F03-5: src/index.css defines dynamic border-radius presets', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/index.css'), 'utf8');
    const radiusPresets = ['none', 'sm', 'md', 'lg', 'full'];

    for (const r of radiusPresets) {
      const selector = `[data-radius="${r}"]`;
      assertIncludes(content, selector, `src/index.css must define radius selector ${selector}`);
    }
  });
});

// -----------------------------------------------------------------------------
// FEATURE 4: Centralized appConfig.ts (5 tests)
// -----------------------------------------------------------------------------
describe('Feature 4: Centralized appConfig.ts', () => {
  test('F04-1: defaultAppConfig exports valid store branding schema', () => {
    assert(defaultAppConfig, 'defaultAppConfig must be exported');
    assertContract(defaultAppConfig.store, {
      name: 'string',
      hotline: 'string',
      email: 'string',
      currency: 'string',
      address: 'string'
    }, 'defaultAppConfig.store contract');

    assertEqual(defaultAppConfig.store.currency, 'VND', 'Store currency must strictly be "VND"');
  });

  test('F04-2: defaultAppConfig theme configuration adheres to valid options', () => {
    const theme = defaultAppConfig.theme;
    assertContract(theme, {
      mode: ['light', 'dark', 'system'],
      preset: ['emerald', 'indigo', 'rose', 'amber', 'slate'],
      radius: ['none', 'sm', 'md', 'lg', 'full'],
      enableThemeCustomizer: 'boolean'
    }, 'defaultAppConfig.theme contract');
  });

  test('F04-3: feature flags provide boolean toggles for modular features', () => {
    const features = defaultAppConfig.features;
    assertContract(features, {
      reviews: 'boolean',
      flashSale: 'boolean',
      coupons: 'boolean',
      wishlist: 'boolean',
      supportChat: 'boolean',
      inventoryTracking: 'boolean',
      guestCheckout: 'boolean'
    }, 'defaultAppConfig.features contract');
  });

  test('F04-4: admin navigation contains all required backoffice routes', () => {
    const nav = defaultAppConfig.adminNav;
    assert(Array.isArray(nav), 'adminNav must be an array');
    const navIds = nav.map(item => item.id);

    const expectedSections = ['dashboard', 'products', 'orders', 'customers', 'marketing', 'settings'];
    for (const section of expectedSections) {
      assert(navIds.includes(section), `adminNav must include section "${section}"`);
    }
  });

  test('F04-5: storefront navigation contains valid category taxonomy', () => {
    const sfNav = defaultAppConfig.storefrontNav;
    assert(Array.isArray(sfNav.categories), 'storefrontNav.categories must be an array');
    assert(sfNav.categories.length >= 4, 'storefrontNav.categories must contain at least 4 seed categories');

    for (const cat of sfNav.categories) {
      assertContract(cat, {
        id: 'string',
        name: 'string',
        slug: 'string'
      }, `Category ${cat.name} contract`);
      assert(cat.slug.length > 0, 'Category slug must not be empty');
    }
  });
});

// -----------------------------------------------------------------------------
// FEATURE 5: React Router 6 & Shell Layouts (5 tests)
// -----------------------------------------------------------------------------
describe('Feature 5: React Router 6 & Shell Layouts', () => {
  test('F05-1: AdminLayout component file exists and defines layout structure', () => {
    const adminLayoutPath = path.join(ROOT_DIR, 'src/layouts/AdminLayout.tsx');
    assert(fs.existsSync(adminLayoutPath), 'src/layouts/AdminLayout.tsx must exist');

    const content = fs.readFileSync(adminLayoutPath, 'utf8');
    assertIncludes(content, 'Outlet', 'AdminLayout must include react-router-dom <Outlet />');
    assertIncludes(content, 'Sidebar', 'AdminLayout must include sidebar navigation');
  });

  test('F05-2: feedback primitives provide PageLoader component', () => {
    const loaderPath = path.join(ROOT_DIR, 'src/core/components/Feedback/PageLoader.tsx');
    assert(fs.existsSync(loaderPath), 'PageLoader.tsx must exist');

    const content = fs.readFileSync(loaderPath, 'utf8');
    assertIncludes(content, 'animate-spin', 'PageLoader must render spinning loader indicator');
  });

  test('F05-3: themeStore is defined with state selectors and action contracts', () => {
    const themeStorePath = path.join(ROOT_DIR, 'src/stores/themeStore.ts');
    assert(fs.existsSync(themeStorePath), 'themeStore.ts must exist');

    const content = fs.readFileSync(themeStorePath, 'utf8');
    assertIncludes(content, 'create', 'themeStore must use zustand create');
    assertIncludes(content, 'setMode', 'themeStore must provide setMode action');
    assertIncludes(content, 'setPreset', 'themeStore must provide setPreset action');
  });

  test('F05-4: authStore defines role switching capabilities', () => {
    const authStorePath = path.join(ROOT_DIR, 'src/stores/authStore.ts');
    assert(fs.existsSync(authStorePath), 'authStore.ts must exist');

    const content = fs.readFileSync(authStorePath, 'utf8');
    assertIncludes(content, 'switchRole', 'authStore must provide switchRole action');
    assertIncludes(content, 'admin', 'authStore must support admin role');
  });

  test('F05-5: cartStore defines item addition and quantity mutators', () => {
    const cartStorePath = path.join(ROOT_DIR, 'src/stores/cartStore.ts');
    assert(fs.existsSync(cartStorePath), 'cartStore.ts must exist');

    const content = fs.readFileSync(cartStorePath, 'utf8');
    assertIncludes(content, 'addItem', 'cartStore must provide addItem action');
    assertIncludes(content, 'removeItem', 'cartStore must provide removeItem action');
    assertIncludes(content, 'updateQuantity', 'cartStore must provide updateQuantity action');
  });
});
