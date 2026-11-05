# E2E Test Infrastructure & Test Philosophy Specification

## 1. Test Philosophy & Architecture

### 1.1 Opaque-Box & Requirement-Driven Principle
The end-to-end (E2E) testing track adheres strictly to an **opaque-box, requirement-driven test philosophy**. All test cases and assertions are derived exclusively from the authoritative user specifications (`ORIGINAL_REQUEST.md`) and the master architectural design (`PROJECT.md`), completely independent of internal code implementations.

Key tenets:
1. **Behavioral Invariance Over Implementation Details**: Tests verify observable public interfaces, DOM states, user input validations, event reactions, storage persistence mutations, and business rules rather than private component states or internal functions.
2. **Authoritative Expected Output Derivation**: For every test case, the expected output is anchored to explicit business logic defined in the project specifications:
   - Currency formatting strictly adhering to Vietnamese Dong (`###.### ₫`).
   - Phone number validation strictly enforcing Vietnamese mobile prefix patterns (`03`, `05`, `07`, `08`, `09` with exactly 10 digits).
   - Accent-insensitive search matching Vietnamese Unicode NFD/NFC normalized strings.
   - Stock decrement invariant: `Stock_final = Stock_initial - Quantity_ordered`.
   - Free shipping discount progression: `Remaining = max(0, FreeShippingThreshold - Subtotal)`.
3. **Deterministic & Isolated Execution**:
   - Each test run executes within an isolated, hermetic sandbox with clean LocalStorage namespaces and fresh seed state.
   - Tests do not rely on execution order and clean up any mutations upon completion.
   - Timing jitter (200-400ms) in mock services can be tested in full asynchronous mode or accelerated via mock timing controls for high-speed deterministic CI regression.
4. **No Facade Testing**:
   - Zero-tolerance for trivial or tautological tests (e.g. `expect(true).toBe(true)`).
   - Every test must establish verifiable preconditions, execute an authentic action, and validate observable postconditions.

---

## 2. Test Architecture & Runner Specification

### 2.1 Runner Location & Execution Command
- **Harness Entrypoint**: `tests/e2e/runner.mjs`
- **Execution Command**:
  ```bash
  node tests/e2e/runner.mjs [options]
  ```
- **NPM Script Integration** (recommended in `package.json`):
  ```bash
  npm run test:e2e
  ```
- **CLI Options**:
  - `--tier=<1|2|3|4|all>`: Filter tests by Tier (defaults to all available).
  - `--filter=<pattern>`: Run test suites matching regex or substring.
  - `--verbose`: Output detailed assertion logs for every test case.
  - `--bail`: Stop execution immediately on the first assertion failure.
  - `--json`: Output test execution report in machine-readable JSON format.

### 2.2 Pass/Fail Semantics
- **Exit Code 0 (PASS)**:
  - 100% of discovered test cases executed and passed all assertions.
  - 0 unhandled promise rejections or uncaught exceptions.
  - 0 mandatory contract violations.
- **Exit Code 1 (FAIL)**:
  - 1 or more assertion failures encountered.
  - Test syntax error, runtime crash, or missing required export in test suites.
  - LocalStorage quota error unhandled or data corruption detected.

### 2.3 Directory Layout
```
f:\wweb bán hàng\tests\e2e\
├── runner.mjs                          # Test harness & runner CLI
├── helpers\
│   ├── assertions.mjs                  # Assertion library (assertEqual, assertDeepEqual, assertThrows...)
│   ├── test_context.mjs                # Hermetic LocalStorage mock & memory isolation environment
│   └── dom_mock.mjs                    # Lightweight DOM/Event simulation utilities
├── tier1_features\                     # Feature contract & behavior suites (Features 1 - 73)
│   ├── f01_to_f05_foundation.test.mjs  # Scaffolding, paths, Tailwind variables, appConfig, routing
│   ├── f06_to_f15_core_ui_1.test.mjs   # Buttons, inputs, selects, switches, modals, drawers, toasts
│   ├── f16_to_f21_core_ui_2.test.mjs   # Badges, cards, tables, pagination, skeletons, image upload
│   ├── f22_to_f26_dal_mock_engine.test.mjs # Repository contracts, LocalStorage engine, search query
│   ├── f27_to_f34_seed_quota.test.mjs  # D2C seed sets, reset demo data, canvas compression
│   ├── f35_to_f40_admin_products.test.mjs # Admin dashboard KPIs, product CRUD, variant matrix
│   ├── f41_to_f48_admin_ops.test.mjs   # Admin orders pipeline, invoices, CRM, coupons, theme studio
│   ├── f49_to_f59_storefront_blocks.test.mjs # Block renderer, header, hero, flash sale, footer
│   ├── f60_to_f63_catalog_pdp.test.mjs # Faceted PLP, PDP gallery, variant picker, reviews tab
│   ├── f64_to_f71_cart_checkout.test.mjs # Cart drawer, freeship bar, coupon, one-page checkout, VietQR
│   └── f72_f73_test_hardening.test.mjs # Test suite integrity, stress & adversarial resilience
├── tier2_boundaries\                   # Boundary, edge case, and fuzzing test suites
│   ├── b01_pricing_currency.test.mjs   # 0 VND, floating point roundoff, negative amounts, max limits
│   ├── b02_vietnamese_text.test.mjs    # Diacritics, NFD/NFC accents, tone marks, special characters
│   ├── b03_storage_quota.test.mjs      # 5MB LocalStorage quota boundaries, oversized images, evictions
│   ├── b04_validation_regex.test.mjs   # Invalid VN phone formats, malformed emails, injection payloads
│   └── b05_cart_inventory_race.test.mjs # Zero stock orders, quantity exceeding stock, concurrent tabs
├── tier3_combinations\                 # Cross-module pairwise & integration workflows
│   ├── c01_cart_coupon_shipping.test.mjs # Cart total + coupon calculation + free shipping threshold
│   ├── c02_checkout_order_inventory.test.mjs # Checkout submission -> order storage -> stock deduction
│   ├── c03_admin_status_customer_order.test.mjs # Order status progression (Pending->Shipped->Delivered)
│   └── c04_theme_preset_persistence.test.mjs # Theme toggle + preset change + refresh hydration
└── tier4_realworld\                    # End-to-end full user journeys & workloads
    ├── rw01_shopper_vietqr_purchase.test.mjs # Complete customer shopping journey with VietQR payment
    ├── rw02_admin_product_variant_launch.test.mjs # Admin product matrix builder & inventory release
    ├── rw03_flash_sale_coupon_campaign.test.mjs # Flash sale rush + coupon code + fast checkout
    └── rw04_system_factory_reset_cycle.test.mjs # Store data corruption recovery & demo reset cycle
```

---

## 3. Feature Inventory Coverage Mapping (Features 1 – 73)

The table below maps all 73 inventoried features from `PROJECT.md` to test files, test tiers, and authoritative validation invariants:

| # | Feature Name | M-Stone | Target Test Suite | Tier | Primary Validation Invariant |
|---|--------------|---------|-------------------|------|------------------------------|
| 1 | Vite + React + TS Scaffolding | M1 | `tier1_features/f01_to_f05_foundation.test.mjs` | T1 | Clean bundle generation, TypeScript strict typing with zero errors |
| 2 | Layered Directory & Path Aliases | M1 | `tier1_features/f01_to_f05_foundation.test.mjs` | T1 | `@/*` aliases resolve unambiguously to `src/*` across modules |
| 3 | Tailwind CSS & Dynamic CSS Theming | M1 | `tier1_features/f01_to_f05_foundation.test.mjs` | T1 | CSS variables `--color-primary`, surface, and background change dynamically |
| 4 | Centralized `appConfig.ts` | M1 | `tier1_features/f01_to_f05_foundation.test.mjs` | T1 | Config schema validates branding, active presets, and feature flags |
| 5 | React Router 6 & Shell Layouts | M1 | `tier1_features/f01_to_f05_foundation.test.mjs` | T1 | Layout shells render correct route children and preserve common chrome |
| 6 | Core UI: Button Primitives | M2 | `tier1_features/f06_to_f15_core_ui_1.test.mjs` | T1 | Variants (primary, secondary, danger), loading spinner, disabled state |
| 7 | Core UI: Input & Textarea | M2 | `tier1_features/f06_to_f15_core_ui_1.test.mjs` | T1 | Controlled value binding, label rendering, error message display |
| 8 | Core UI: Select & Multi-Select | M2 | `tier1_features/f06_to_f15_core_ui_1.test.mjs` | T1 | Option selection, keyboard navigation, placeholder rendering |
| 9 | Core UI: Checkbox, Radio, Switch | M2 | `tier1_features/f06_to_f15_core_ui_1.test.mjs` | T1 | Checked boolean state toggles, group exclusivity in radio |
| 10 | Core UI: Modal & Dialog | M2 | `tier1_features/f06_to_f15_core_ui_1.test.mjs` | T1 | Focus trap, backdrop click, Escape key triggers close callback |
| 11 | Core UI: Slide-out Drawer | M2 | `tier1_features/f06_to_f15_core_ui_1.test.mjs` | T1 | Slide-in animation state, backdrop dismissal, unmount cleanup |
| 12 | Core UI: Dropdown Menu | M2 | `tier1_features/f06_to_f15_core_ui_1.test.mjs` | T1 | Trigger click reveals popover, clicking outside dismisses |
| 13 | Core UI: Tabs & Segmented Control | M2 | `tier1_features/f06_to_f15_core_ui_1.test.mjs` | T1 | Active tab selection switches panels and active tab styles |
| 14 | Core UI: Breadcrumbs | M2 | `tier1_features/f06_to_f15_core_ui_1.test.mjs` | T1 | Hierarchy breadcrumb array renders links and trailing current page |
| 15 | Core UI: Toast Notification System | M2 | `tier1_features/f06_to_f15_core_ui_1.test.mjs` | T1 | Push notification queue, auto-dismiss timeout (3-5s), manual dismiss |
| 16 | Core UI: Badge & Status Pills | M2 | `tier1_features/f16_to_f21_core_ui_2.test.mjs` | T1 | Color maps for success, warning, danger, and neutral statuses |
| 17 | Core UI: Card & Container Primitives | M2 | `tier1_features/f16_to_f21_core_ui_2.test.mjs` | T1 | Header, body, footer slot composition and border elevation tokens |
| 18 | Core UI: Data Table | M2 | `tier1_features/f16_to_f21_core_ui_2.test.mjs` | T1 | Column sorting indicator, row selection checkboxes, empty state |
| 19 | Core UI: Pagination Controls | M2 | `tier1_features/f16_to_f21_core_ui_2.test.mjs` | T1 | Page bounds enforcement (1 <= current <= totalPages), page change emit |
| 20 | Core UI: Skeleton & Empty States | M2 | `tier1_features/f16_to_f21_core_ui_2.test.mjs` | T1 | Pulse animation during loading, fallback illustration when array empty |
| 21 | Core UI: Image Upload & Preview | M2 | `tier1_features/f16_to_f21_core_ui_2.test.mjs` | T1 | File drop emits preview data URL, delete button clears selection |
| 22 | Generic Repository DAL Contracts | M3 | `tier1_features/f22_to_f26_dal_mock_engine.test.mjs` | T1 | `IRepository<T>` CRUD interface contract compliance |
| 23 | Domain Service Interfaces | M3 | `tier1_features/f22_to_f26_dal_mock_engine.test.mjs` | T1 | `IProductService`, `IOrderService`, `ICustomerService`, `ICouponService` |
| 24 | LocalStorage Persistence Engine | M3 | `tier1_features/f22_to_f26_dal_mock_engine.test.mjs` | T1 | Namespaced storage key format `d2c_ecommerce:*:v1` with JSON hydration |
| 25 | Latency Jitter & Error Simulator | M3 | `tier1_features/f22_to_f26_dal_mock_engine.test.mjs` | T1 | Response delay within 200-400ms range; simulated network error triggers |
| 26 | Vietnamese Accent-Insensitive Query | M3 | `tier1_features/f22_to_f26_dal_mock_engine.test.mjs` | T1 | Search "ao thun" matches "Áo thun cotton" and "Áo Thun Nam" |
| 27 | Seed Data: Vietnamese D2C Products | M3 | `tier1_features/f27_to_f34_seed_quota.test.mjs` | T1 | 16 valid product items with SKU, price, images, and variant inventory |
| 28 | Seed Data: Categories & Collections | M3 | `tier1_features/f27_to_f34_seed_quota.test.mjs` | T1 | 8 valid categories with slug, icon, and accurate product item counts |
| 29 | Seed Data: Orders Pipeline | M3 | `tier1_features/f27_to_f34_seed_quota.test.mjs` | T1 | 12 orders spanning Pending, Processing, Shipped, Delivered, Cancelled |
| 30 | Seed Data: Customer CRM Profiles | M3 | `tier1_features/f27_to_f34_seed_quota.test.mjs` | T1 | 10 profiles with address, order counts, and total spending calculations |
| 31 | Seed Data: Coupons & Promotions | M3 | `tier1_features/f27_to_f34_seed_quota.test.mjs` | T1 | 6 coupons covering percentage, fixed VND, freeship, and min-spend |
| 32 | Seed Data: Mock Auth Users | M3 | `tier1_features/f27_to_f34_seed_quota.test.mjs` | T1 | Admin, Staff, and Customer users with respective role permissions |
| 33 | 1-Click Reset Demo Data & Quota Guard | M3 | `tier1_features/f27_to_f34_seed_quota.test.mjs` | T1 | Factory reset completely clears mutated data and reloads original seeds |
| 34 | Canvas Base64 Image Compression | M3 | `tier1_features/f27_to_f34_seed_quota.test.mjs` | T1 | Downscales uploaded images to <=800px width and <=80% JPEG quality |
| 35 | Admin Executive Dashboard | M4 | `tier1_features/f35_to_f40_admin_products.test.mjs` | T1 | 4 KPI cards calculate accurate totals for Revenue, Orders, AOV, Customers |
| 36 | Admin Revenue & Order Charts | M4 | `tier1_features/f35_to_f40_admin_products.test.mjs` | T1 | Timeframe selector (7D, 30D, Year) groups data points accurately |
| 37 | Admin Low-Stock Inventory Alerts | M4 | `tier1_features/f35_to_f40_admin_products.test.mjs` | T1 | Filters and displays all product variants where stock <= 5 |
| 38 | Admin Product Management List | M4 | `tier1_features/f35_to_f40_admin_products.test.mjs` | T1 | Table renders products with search, category filtering, stock badges |
| 39 | Admin Product Create/Edit Form | M4 | `tier1_features/f35_to_f40_admin_products.test.mjs` | T1 | Zod form validates title, price > 0, SKU, and image URL requirements |
| 40 | Admin Variant Matrix Builder | M4 | `tier1_features/f35_to_f40_admin_products.test.mjs` | T1 | Cartesian product of Size x Color options generates table of variants |
| 41 | Admin Order Management Pipeline | M4 | `tier1_features/f41_to_f48_admin_ops.test.mjs` | T1 | Filter orders by status tab, search by customer phone or order code |
| 42 | Admin Order Detail Drawer | M4 | `tier1_features/f41_to_f48_admin_ops.test.mjs` | T1 | Stepper displays status history, allow transitioning status with confirmation |
| 43 | Admin Mock Invoice & Packing Slip | M4 | `tier1_features/f41_to_f48_admin_ops.test.mjs` | T1 | Print preview displays order items, taxes, shipping fee, signature box |
| 44 | Admin Customer CRM Management | M4 | `tier1_features/f41_to_f48_admin_ops.test.mjs` | T1 | Directory calculates VIP/Regular/New segment based on order total |
| 45 | Admin Marketing & Coupon CRUD | M4 | `tier1_features/f41_to_f48_admin_ops.test.mjs` | T1 | Create/Edit/Delete coupon with start/end validity dates and discount values |
| 46 | Admin Settings & Theme Studio | M4 | `tier1_features/f41_to_f48_admin_ops.test.mjs` | T1 | Switch theme presets (5 colors) and preview dynamic CSS changes |
| 47 | Admin Feature Module Toggles | M4 | `tier1_features/f41_to_f48_admin_ops.test.mjs` | T1 | Toggle switches dynamically mount/unmount Reviews, Flash Sale, Coupons |
| 48 | Admin Mock Auth & Role Switcher | M4 | `tier1_features/f41_to_f48_admin_ops.test.mjs` | T1 | Switcher alters active user profile and updates authorization guards |
| 49 | Storefront Block Architecture | M5 | `tier1_features/f49_to_f59_storefront_blocks.test.mjs` | T1 | `<DynamicBlockRenderer />` iterates configured block array in order |
| 50 | Storefront Header Block | M5 | `tier1_features/f49_to_f59_storefront_blocks.test.mjs` | T1 | Renders branding, navigation menu links, search input, and cart count badge |
| 51 | Storefront Hero Banner Block | M5 | `tier1_features/f49_to_f59_storefront_blocks.test.mjs` | T1 | Renders title, subtitle, CTA button links, and banner graphic |
| 52 | Storefront Value Props Block | M5 | `tier1_features/f49_to_f59_storefront_blocks.test.mjs` | T1 | Displays 4 trust badges (Freeship, Warranty, Speed delivery, Support) |
| 53 | Storefront Category Showcase Block | M5 | `tier1_features/f49_to_f59_storefront_blocks.test.mjs` | T1 | Renders categories grid with category slug link and item counts |
| 54 | Storefront Flash Sale Block | M5 | `tier1_features/f49_to_f59_storefront_blocks.test.mjs` | T1 | Countdown timer decrements seconds; sale items show discount % tag |
| 55 | Storefront Featured Products Block | M5 | `tier1_features/f49_to_f59_storefront_blocks.test.mjs` | T1 | Filter tabs (All, Bestseller, New, Sale) correctly filter products |
| 56 | Storefront Promotion Banner Block | M5 | `tier1_features/f49_to_f59_storefront_blocks.test.mjs` | T1 | Banner displays voucher code with 1-click clipboard copy confirmation |
| 57 | Storefront Customer Testimonials | M5 | `tier1_features/f49_to_f59_storefront_blocks.test.mjs` | T1 | Renders testimonials with avatar, customer name, and 5-star rating |
| 58 | Storefront Newsletter Signup Block | M5 | `tier1_features/f49_to_f59_storefront_blocks.test.mjs` | T1 | Zod email validation enforces standard email RFC syntax before submit |
| 59 | Storefront Footer Block | M5 | `tier1_features/f49_to_f59_storefront_blocks.test.mjs` | T1 | Renders store hotline, email, copyright, and payment method logos |
| 60 | Storefront Catalog (PLP) Page | M5 | `tier1_features/f60_to_f63_catalog_pdp.test.mjs` | T1 | Multi-faceted filter combines category, price range, and sort order |
| 61 | Storefront Product Detail Page (PDP) | M5 | `tier1_features/f60_to_f63_catalog_pdp.test.mjs` | T1 | Renders image gallery, VND price, stock status, and product specs |
| 62 | Storefront PDP Variant Picker | M5 | `tier1_features/f60_to_f63_catalog_pdp.test.mjs` | T1 | Selecting Size and Color updates SKU, price, and available stock |
| 63 | Storefront PDP Information Tabs | M5 | `tier1_features/f60_to_f63_catalog_pdp.test.mjs` | T1 | Tabs switch between Description, Specifications, and Reviews |
| 64 | Storefront Slide-out Cart Drawer | M6 | `tier1_features/f64_to_f71_cart_checkout.test.mjs` | T1 | Opens on add to cart; quantity stepper updates item subtotal; delete removes |
| 65 | Storefront Free Shipping Tracker | M6 | `tier1_features/f64_to_f71_cart_checkout.test.mjs` | T1 | Progress bar computes `(subtotal / threshold) * 100%` up to 100% |
| 66 | Storefront Dedicated Cart Page | M6 | `tier1_features/f64_to_f71_cart_checkout.test.mjs` | T1 | Full summary calculates subtotal, applied discount, shipping, total |
| 67 | Storefront Coupon Apply in Cart | M6 | `tier1_features/f64_to_f71_cart_checkout.test.mjs` | T1 | Valid coupon deducts percentage or fixed VND; invalid shows error toast |
| 68 | Storefront One-Page Checkout Form | M6 | `tier1_features/f64_to_f71_cart_checkout.test.mjs` | T1 | Zod validates name, 10-digit VN phone, province, and shipping address |
| 69 | Checkout Payment Method Selector | M6 | `tier1_features/f64_to_f71_cart_checkout.test.mjs` | T1 | Supports COD, VietQR bank transfer, MoMo wallet, and mock credit card |
| 70 | Checkout Order Placement Mutation | M6 | `tier1_features/f64_to_f71_cart_checkout.test.mjs` | T1 | Saves new order in LocalStorage, decrements variant inventory, clears cart |
| 71 | Storefront Order Confirmation Page | M6 | `tier1_features/f64_to_f71_cart_checkout.test.mjs` | T1 | Displays Order ID, customer details, items recap, VietQR QR code |
| 72 | E2E Testing Suite (Tiers 1-4) | M7 | `tier1_features/f72_f73_test_hardening.test.mjs` | T1 | Automated runner executes all 4 tiers with 100% test pass rate |
| 73 | Adversarial Coverage Hardening | M7 | `tier1_features/f72_f73_test_hardening.test.mjs` | T1 | Stress tests, boundary fuzzing, and defect mitigation validation |

---

## 4. Real-World Application Scenarios (Tier 4)

Tier 4 tests execute comprehensive, multi-step customer and merchant scenarios that simulate authentic production workloads in UI_ONLY mode:

### 4.1 Scenario A: D2C Shopper End-to-End Funnel with VietQR
- **File**: `tests/e2e/tier4_realworld/rw01_shopper_vietqr_purchase.test.mjs`
- **Execution Workflow**:
  1. Shopper opens Storefront homepage, views Featured Products, and filters by "Áo thun".
  2. Navigates to PDP (`/products/ao-thun-cotton-compact-250gsm`).
  3. Selects Size `L` and Color `Đen`. Verifies active price is `289.000 ₫` and stock is sufficient.
  4. Clicks "Thêm vào giỏ hàng" (Add to Cart). Cart drawer opens automatically.
  5. Inspects Free Shipping Tracker: subtotal is under threshold; increments quantity to 2 items (`578.000 ₫`) -> qualifies for Free Shipping.
  6. Applies coupon code `CHAOBAN` (10% discount). Verifies subtotal, discount `-57.800 ₫`, shipping fee `0 ₫`, final total `520.200 ₫`.
  7. Proceeds to `/checkout`. Fills customer details with valid Vietnamese credentials:
     - Name: "Nguyễn Văn An"
     - Phone: "0912345678"
     - Province: "Hà Nội", District: "Ba Đình", Address: "Số 12 Kim Mã"
  8. Selects Payment Method: "Chuyển khoản VietQR (Quét mã QR)".
  9. Submits order:
     - Verifies LocalStorage `d2c_ecommerce:orders:v1` contains newly generated order with status `Pending`.
     - Verifies product variant stock decremented by 2.
     - Verifies cart is completely emptied.
  10. Redirects to `/order-success/:orderId`:
      - Displays order summary, QR code data string matching VietQR standard format (`000201010212...`).

### 4.2 Scenario B: Admin Backoffice Merchandising & Inventory Flow
- **File**: `tests/e2e/tier4_realworld/rw02_admin_product_variant_launch.test.mjs`
- **Execution Workflow**:
  1. Merchant logs into Admin backoffice (`/admin/dashboard`) as `Admin`.
  2. Inspects KPI cards (Total Revenue, Orders Count, Average Order Value).
  3. Navigates to `/admin/products/new`.
  4. Fills general information:
     - Name: "Váy Linen Thiết Kế Mùa Hè"
     - Category: "Thời Trang Nữ"
     - Base Price: `450.000 ₫`
  5. Uses Variant Matrix Builder:
     - Adds Option 1: Size [`S`, `M`, `L`]
     - Adds Option 2: Color [`Trắng`, `Be`]
     - Generates 6 variant combinations (S-Trắng, S-Be, M-Trắng, M-Be, L-Trắng, L-Be).
     - Bulk assigns initial inventory: 10 units per variant (total 60 units).
  6. Simulates canvas image upload with auto-compression.
  7. Saves product: verifies product appears in `/admin/products` table.
  8. Switches to Storefront view: verifies new product is discoverable via search and category filter.

### 4.3 Scenario C: End-to-End Order Fulfillment Lifecycle
- **File**: `tests/e2e/tier4_realworld/rw03_flash_sale_coupon_campaign.test.mjs`
- **Execution Workflow**:
  1. System initializes with order in `Pending` status.
  2. Merchant views `/admin/orders` table and filters by `Pending`.
  3. Clicks order row to open Order Detail Drawer.
  4. Transitions status from `Pending` -> `Processing` (Đang xử lý).
  5. Transitions status from `Processing` -> `Shipped` (Đang giao hàng).
  6. Generates and renders Mock Packing Slip / Invoice preview.
  7. Transitions status from `Shipped` -> `Delivered` (Đã giao hàng).
  8. Verifies customer CRM record updates lifetime value (LTV) and order count accordingly.

### 4.4 Scenario D: Store Data Quota Guard & Factory Reset Cycle
- **File**: `tests/e2e/tier4_realworld/rw04_system_factory_reset_cycle.test.mjs`
- **Execution Workflow**:
  1. Simulates extensive customer browsing, 10 created orders, custom theme changes, and 5 modified products.
  2. Verifies LocalStorage keys are populated across all modules.
  3. Merchant visits `/admin/settings` -> System Tools.
  4. Clicks "Khôi phục dữ liệu mẫu (Reset Demo Data)" and confirms modal prompt.
  5. Verifies all custom orders are purged and initial 12 seed orders restored.
  6. Verifies products and variant inventories reset to canonical seed values.
  7. Verifies active theme resets to default preset.

---

## 5. Coverage Thresholds & Quality Gates

The test architecture enforces strict numerical and qualitative coverage gates:

| Tier | Focus Area | Minimum Coverage Threshold | Validation Target |
|------|------------|----------------------------|-------------------|
| **Tier 1** | Feature Unit & Contract Smoke | **>= 5 test cases per feature** (73 features = **>= 365 test cases**) | Happy path, parameter contracts, UI render states, error messaging |
| **Tier 2** | Boundaries, Extremes & Fuzzing | **>= 5 test cases per feature or boundary domain** | 0 VND, negative amounts, overflow strings, accent marks, quota caps |
| **Tier 3** | Combinations & State Transitions | **>= 20 cross-module interaction flows** | Pairwise permutations of Cart x Coupons x Shipping x Order Status |
| **Tier 4** | Real-World E2E User Journeys | **>= 4 comprehensive multi-step workflows** | Full-funnel customer purchase, admin merchandising, order fulfillment, factory reset |
| **Total** | Global Test Suite | **>= 400 test cases total across Tiers 1-4** | 100% passing rate with exit code 0 |

---

## 6. Progressive Testability Alignment

To maintain strict compliance with progressive testability during milestone execution:
- **Phase 1 (Milestone 1)**: Initial tests verify Scaffolding, Directory Structure, Path Aliases, Tailwind Variable Configurations, and `appConfig.ts` contracts.
- **Phase 2 (Milestone 2)**: Core UI primitive suites are verified against rendered DOM snapshots and interactive event callbacks.
- **Phase 3 (Milestone 3)**: Mock Service Engine, Repository contracts, LocalStorage persistence, seed sets, and Vietnamese search queries are validated.
- **Phase 4 - 6 (Milestones 4-6)**: Backoffice admin features, Storefront blocks, and Cart/Checkout flows are progressively added to the runner.
- **Phase 7 (Milestone 7)**: 100% full suite execution across Tiers 1-4 with zero failures.
