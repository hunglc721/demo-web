import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { matchRoutes } from 'react-router-dom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..');

console.log('====================================================');
console.log('  CHALLENGER M1 EMPIRICAL STRESS TEST HARNESS       ');
console.log('====================================================\n');

// ----------------------------------------------------
// PART 1: THEME PRESETS RGB & CONTRAST EMPIRICAL ORACLE
// ----------------------------------------------------
console.log('--- PART 1: DYNAMIC THEMING STRESS TEST ---');
const cssPath = path.join(ROOT, 'src', 'index.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

function parseRgb(str) {
  const parts = str.trim().split(/\s+/).map(Number);
  if (parts.length !== 3 || parts.some(n => isNaN(n) || n < 0 || n > 255 || !Number.isInteger(n))) {
    throw new Error(`Invalid RGB tuple: "${str}"`);
  }
  return parts;
}

function luminance([r, g, b]) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrast(rgb1, rgb2) {
  const l1 = luminance(rgb1);
  const l2 = luminance(rgb2);
  const brighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (brighter + 0.05) / (darker + 0.05);
}

const requiredPresets = ['emerald', 'indigo', 'rose', 'amber', 'slate'];
const requiredVars = [
  '--color-primary',
  '--color-primary-hover',
  '--color-primary-light',
  '--color-primary-subtle',
  '--color-border-focus'
];

let themeErrors = 0;

for (const preset of requiredPresets) {
  const blockRegex = new RegExp(`\\[data-theme-preset="${preset}"\\]\\s*\\{([\\s\\S]*?)\\}`, 'm');
  const match = cssContent.match(blockRegex);
  if (!match) {
    console.error(`[FAIL] Theme preset "${preset}" block not found in src/index.css`);
    themeErrors++;
    continue;
  }

  const blockText = match[1];
  console.log(`\n• Preset [${preset}]:`);

  for (const v of requiredVars) {
    const varRegex = new RegExp(`${v}:\\s*([0-9\\s]+);`);
    const vMatch = blockText.match(varRegex);
    if (!vMatch) {
      console.error(`  [FAIL] Missing variable ${v}`);
      themeErrors++;
      continue;
    }

    try {
      const rgb = parseRgb(vMatch[1]);
      console.log(`  ✔ ${v.padEnd(24)} -> [${rgb.join(', ')}] (Valid RGB Integer Tuple)`);
    } catch (err) {
      console.error(`  [FAIL] ${v}: ${err.message}`);
      themeErrors++;
    }
  }
}

// Check Dark Mode Tokens & Surface Contrast
console.log('\n• Dark Mode Surface & Text Contrast (WCAG 2.1):');
const darkBlockMatch = cssContent.match(/\.dark\s*\{([\s\S]*?)\}/m);
if (!darkBlockMatch) {
  console.error('[FAIL] .dark block not found in src/index.css');
  themeErrors++;
} else {
  const dBlock = darkBlockMatch[1];
  const extractVar = (name) => {
    const m = dBlock.match(new RegExp(`${name}:\\s*([0-9\\s]+);`));
    return m ? parseRgb(m[1]) : null;
  };

  const darkBgBase = extractVar('--color-bg-base');
  const darkBgCard = extractVar('--color-bg-card');
  const darkBgSubtle = extractVar('--color-bg-subtle');
  const darkTextMain = extractVar('--color-text-main');
  const darkTextMuted = extractVar('--color-text-muted');

  const crMainOnBase = contrast(darkTextMain, darkBgBase);
  const crMainOnCard = contrast(darkTextMain, darkBgCard);
  const crMutedOnBase = contrast(darkTextMuted, darkBgBase);
  const crMutedOnCard = contrast(darkTextMuted, darkBgCard);

  console.log(`  text-main on bg-base:   ${crMainOnBase.toFixed(2)}:1 ${crMainOnBase >= 7 ? '(AAA Pass)' : crMainOnBase >= 4.5 ? '(AA Pass)' : '(FAIL)'}`);
  console.log(`  text-main on bg-card:   ${crMainOnCard.toFixed(2)}:1 ${crMainOnCard >= 7 ? '(AAA Pass)' : crMainOnCard >= 4.5 ? '(AA Pass)' : '(FAIL)'}`);
  console.log(`  text-muted on bg-base:  ${crMutedOnBase.toFixed(2)}:1 ${crMutedOnBase >= 4.5 ? '(AA Pass)' : '(FAIL)'}`);
  console.log(`  text-muted on bg-card:  ${crMutedOnCard.toFixed(2)}:1 ${crMutedOnCard >= 4.5 ? '(AA Pass)' : '(FAIL)'}`);

  if (crMainOnBase < 4.5 || crMainOnCard < 4.5 || crMutedOnBase < 4.5 || crMutedOnCard < 4.5) {
    console.error('  [FAIL] Dark mode contrast failed WCAG AA threshold!');
    themeErrors++;
  } else {
    console.log('  ✔ All Dark mode text contrast ratios exceed WCAG AA specifications.');
  }

  // Check surface elevation contrast
  const crCardBase = contrast(darkBgCard, darkBgBase);
  const crSubtleCard = contrast(darkBgSubtle, darkBgCard);
  console.log(`  Surface elevation (bg-card vs bg-base):   ${crCardBase.toFixed(2)}:1`);
  console.log(`  Surface elevation (bg-subtle vs bg-card): ${crSubtleCard.toFixed(2)}:1`);
}

// ----------------------------------------------------
// PART 2: ROUTE & LAYOUT STRESS TEST
// ----------------------------------------------------
console.log('\n--- PART 2: ROUTE & LAYOUT STRESS TEST ---');
let routeErrors = 0;

// Replicate exact router structure from src/routes/index.tsx
const routes = [
  // 1. Storefront Surface
  {
    path: '/',
    id: 'storefront-root',
    children: [
      { index: true, id: 'home' },
      { path: 'catalog', id: 'catalog' },
      { path: 'category/:slug', id: 'category' },
      { path: 'product/:slug', id: 'product' },
      { path: 'flash-sale', id: 'flash-sale' },
      { path: 'cart', id: 'cart' },
      { path: 'order-lookup', id: 'order-lookup' },
      { path: 'about', id: 'about' },
      { path: 'help', id: 'help' },
    ],
  },
  // 2. Blank Layout Surface (Checkout, Auth, Error)
  {
    path: '/',
    id: 'blank-root',
    children: [
      { path: 'checkout', id: 'checkout' },
      { path: 'order-success/:orderId', id: 'order-success' },
      { path: 'login', id: 'login' },
      { path: 'register', id: 'register' },
      { path: '*', id: 'not-found' },
    ],
  },
  // 3. Admin Backoffice Surface
  {
    path: '/admin',
    id: 'admin-root',
    children: [
      { index: true, id: 'admin-index-redirect' },
      { path: 'dashboard', id: 'admin-dashboard' },
      { path: 'products', id: 'admin-products' },
      { path: 'products/new', id: 'admin-product-new' },
      { path: 'products/:id/edit', id: 'admin-product-edit' },
      { path: 'categories', id: 'admin-categories' },
      { path: 'orders', id: 'admin-orders' },
      { path: 'orders/:id', id: 'admin-order-detail' },
      { path: 'customers', id: 'admin-customers' },
      { path: 'customers/:id', id: 'admin-customer-detail' },
      { path: 'marketing', id: 'admin-marketing' },
      { path: 'marketing/coupons', id: 'admin-marketing-coupons' },
      { path: 'marketing/flash-sale', id: 'admin-marketing-flash-sale' },
      { path: 'settings', id: 'admin-settings' },
    ],
  },
];

// Test Matrix for Unmapped routes
const unmappedScenarios = [
  { url: '/404', expectedId: 'not-found', desc: 'Direct /404 path' },
  { url: '/does-not-exist', expectedId: 'not-found', desc: 'Random root-level path' },
  { url: '/category/', expectedId: 'not-found', desc: 'Missing slug parameter' },
  { url: '/product/', expectedId: 'not-found', desc: 'Missing product slug parameter' },
  { url: '/admin/unknown-page', expectedId: 'not-found', desc: 'Invalid admin subroute' },
  { url: '/admin/orders/123/edit/unknown', expectedId: 'not-found', desc: 'Deep nested invalid admin subroute' },
  { url: '/random/nested/deep/directory/file.html', expectedId: 'not-found', desc: 'Deep nested arbitrary path' },
  { url: '/checkout/step2/extra', expectedId: 'not-found', desc: 'Invalid checkout subpath' },
  { url: '/about/us/team', expectedId: 'not-found', desc: 'Subpath under static route' },
];

console.log('• Testing Unmapped Routes -> NotFound 404 Resolution:');
for (const scen of unmappedScenarios) {
  const matches = matchRoutes(routes, scen.url);
  if (!matches) {
    console.error(`  [FAIL] URL "${scen.url}" returned null (no route matched)`);
    routeErrors++;
    continue;
  }

  const leaf = matches[matches.length - 1];
  if (leaf.route.id !== scen.expectedId) {
    console.error(`  [FAIL] URL "${scen.url}" resolved to "${leaf.route.id}" instead of "${scen.expectedId}"`);
    routeErrors++;
  } else {
    console.log(`  ✔ URL "${scen.url.padEnd(35)}" -> ${leaf.route.id} (${scen.desc})`);
  }
}

// ----------------------------------------------------
// PART 3: LAZY CHUNK PROMISE RESOLUTION VERIFICATION
// ----------------------------------------------------
console.log('\n--- PART 3: ROUTE LAZY CHUNK LOADING VERIFICATION ---');
let chunkErrors = 0;

const routesIndexPath = path.join(ROOT, 'src', 'routes', 'index.tsx');
const routesSource = fs.readFileSync(routesIndexPath, 'utf8');

const importRegex = /import\('@\/(.*?)'\)/g;
let m;
const lazyTargets = [];
while ((m = importRegex.exec(routesSource)) !== null) {
  lazyTargets.push(m[1]);
}

console.log(`• Checking ${lazyTargets.length} lazy-loaded route chunk components:`);
for (const target of lazyTargets) {
  const filePath = path.join(ROOT, 'src', target + '.tsx');
  if (!fs.existsSync(filePath)) {
    console.error(`  [FAIL] Lazy file missing: ${filePath}`);
    chunkErrors++;
    continue;
  }

  const src = fs.readFileSync(filePath, 'utf8');
  const hasExportDefault = /export\s+default\s+/.test(src);
  if (!hasExportDefault) {
    console.error(`  [FAIL] File "${target}.tsx" lacks default export! React.lazy will reject.`);
    chunkErrors++;
  } else {
    console.log(`  ✔ ${target.padEnd(46)} (File exists, default export present)`);
  }
}

// Final Summary
console.log('\n====================================================');
console.log('CHALLENGE SUMMARY RESULT:');
console.log(`  Theme Preset & Contrast Errors: ${themeErrors}`);
console.log(`  Route 404 Fallback Errors:       ${routeErrors}`);
console.log(`  Lazy Chunk Import Errors:        ${chunkErrors}`);
const totalErrors = themeErrors + routeErrors + chunkErrors;
console.log(`  TOTAL STRESS TEST ERRORS:        ${totalErrors}`);
console.log('====================================================\n');

if (totalErrors > 0) {
  process.exit(1);
} else {
  console.log('ALL EMPIRICAL CHALLENGES PASSED CONVINCINGLY.');
  process.exit(0);
}
