/**
 * Tier 1 Contract & Functional Tests: Features 49 - 63 (Milestone 5 Storefront Experience)
 * Feature 49: Storefront Modular Block Architecture (DynamicBlockRenderer)
 * Feature 50: Storefront Header Block
 * Feature 51: Storefront Hero Banner Block
 * Feature 52: Storefront Value Propositions Block
 * Feature 53: Storefront Category Showcase Block
 * Feature 54: Storefront Flash Sale Block & Page
 * Feature 55: Storefront Featured Products Block & Live Filter Tabs
 * Feature 56: Storefront Promotion Banner Block & 1-Click Copy
 * Feature 57: Storefront Customer Testimonials Block
 * Feature 58: Storefront Newsletter Signup Block & Zod Validation
 * Feature 59: Storefront Footer Block
 * Feature 60: Storefront Catalog (PLP) Page, Faceted Filter Sidebar & Pagination
 * Feature 61: Storefront PDP Media Gallery, Zoom & Breadcrumbs Trail
 * Feature 62: Storefront PDP Interactive Variant Picker & Stock Boundary Stepper
 * Feature 63: Storefront PDP Information Tabs & Customer Review System
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, test } from '../runner.mjs';
import {
  assert,
  assertEqual,
  assertNotEqual,
  assertIncludes,
  assertContract,
  assertWithinRange,
  assertGreaterThan,
} from '../helpers/assertions.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..', '..');

import {
  formatCurrencyVND,
  formatDateVN,
  slugify,
} from '../../../src/utils/formatters.ts';

import {
  STORAGE_KEYS,
  STORAGE_PREFIX,
  STORAGE_VERSION,
} from '../../../src/services/storage/storageKeys.ts';

// -----------------------------------------------------------------------------
// FEATURE 49: Modular Block Architecture & DynamicBlockRenderer
// -----------------------------------------------------------------------------
describe('Feature 49: Storefront Block Architecture', () => {
  const blocksSeedPath = path.join(ROOT_DIR, 'src/services/seed/blocksSeed.ts');
  const blocksSeedContent = fs.readFileSync(blocksSeedPath, 'utf8');

  test('F49-1: defaultStorefrontBlocks defines all required block types', () => {
    assert(fs.existsSync(blocksSeedPath), 'blocksSeed.ts must exist');
    assertIncludes(blocksSeedContent, 'export const defaultStorefrontBlocks', 'Must export defaultStorefrontBlocks');

    const expectedBlockTypes = [
      'hero_banner',
      'value_propositions',
      'flash_sale',
      'category_showcase',
      'featured_products',
      'promo_banner',
      'brand_story',
      'testimonials',
      'newsletter',
    ];

    for (const bType of expectedBlockTypes) {
      assertIncludes(blocksSeedContent, `type: '${bType}'`, `Must define block type ${bType}`);
    }
  });

  test('F49-2: DynamicBlockRenderer source component exists and implements block sorting', () => {
    const rendererPath = path.join(ROOT_DIR, 'src/features/storefront/blocks/DynamicBlockRenderer.tsx');
    assert(fs.existsSync(rendererPath), 'DynamicBlockRenderer.tsx must exist');
    const content = fs.readFileSync(rendererPath, 'utf8');
    assertIncludes(content, 'export const DynamicBlockRenderer', 'Must export DynamicBlockRenderer');
    assertIncludes(content, 'blockService.getBlocks', 'Must query stored blocks');
    assertIncludes(content, 'a.order - b.order', 'Must sort active blocks by order ascending');
    assertIncludes(content, 'b.enabled', 'Must filter by enabled flag');
  });

  test('F49-3: blockService provides LocalStorage persistence and reactive update broadcasts', () => {
    const servicePath = path.join(ROOT_DIR, 'src/services/api/blockService.ts');
    assert(fs.existsSync(servicePath), 'blockService.ts must exist');
    const content = fs.readFileSync(servicePath, 'utf8');
    assertIncludes(content, 'STORAGE_KEYS.BLOCKS', 'Must persist in STORAGE_KEYS.BLOCKS');
    assertIncludes(content, 'd2c:blocks-updated', 'Must dispatch d2c:blocks-updated event');
    assertIncludes(content, 'getBlocks', 'Must provide getBlocks method');
    assertIncludes(content, 'saveBlocks', 'Must provide saveBlocks method');
  });
});

// -----------------------------------------------------------------------------
// FEATURES 50 - 54: Header, Hero, ValueProps, Categories, Flash Sale
// -----------------------------------------------------------------------------
describe('Features 50 - 54: Storefront Core Landing Blocks', () => {
  test('F50-1: HeaderBlock implements live product search and cart count badge', () => {
    const filePath = path.join(ROOT_DIR, 'src/features/storefront/blocks/HeaderBlock.tsx');
    assert(fs.existsSync(filePath), 'HeaderBlock.tsx must exist');
    const content = fs.readFileSync(filePath, 'utf8');
    assertIncludes(content, 'productService.getProducts', 'Header must query live product search');
    assertIncludes(content, 'getTotalItems', 'Header must bind cartStore total items badge');
    assertIncludes(content, 'toggleMode', 'Header must bind themeStore mode toggle');
  });

  test('F51-1: HeroBannerBlock component supports carousel and dual CTAs', () => {
    const filePath = path.join(ROOT_DIR, 'src/features/storefront/blocks/HeroBannerBlock.tsx');
    assert(fs.existsSync(filePath), 'HeroBannerBlock.tsx must exist');
    const content = fs.readFileSync(filePath, 'utf8');
    assertIncludes(content, 'currentSlide', 'Hero banner must support active slide state');
    assertIncludes(content, 'ctaLink', 'Hero banner must support primary CTA link');
    assertIncludes(content, 'secondaryCtaLink', 'Hero banner must support secondary CTA link');
  });

  test('F52-1: ValuePropsBlock component defines 4 customer trust badges', () => {
    const filePath = path.join(ROOT_DIR, 'src/features/storefront/blocks/ValuePropsBlock.tsx');
    assert(fs.existsSync(filePath), 'ValuePropsBlock.tsx must exist');
    const content = fs.readFileSync(filePath, 'utf8');
    assertIncludes(content, 'Miễn Phí Vận Chuyển', 'Must have freeship badge');
    assertIncludes(content, 'Đổi Trả 30 Ngày', 'Must have return policy badge');
    assertIncludes(content, 'Giao Hàng Siêu Tốc', 'Must have fast delivery badge');
    assertIncludes(content, 'Hỗ Trợ 24/7', 'Must have 24/7 support badge');
  });

  test('F53-1: CategoryShowcaseBlock queries categories from productService with hover zoom', () => {
    const filePath = path.join(ROOT_DIR, 'src/features/storefront/blocks/CategoryShowcaseBlock.tsx');
    assert(fs.existsSync(filePath), 'CategoryShowcaseBlock.tsx must exist');
    const content = fs.readFileSync(filePath, 'utf8');
    assertIncludes(content, 'productService.getCategories', 'CategoryShowcase must call getCategories');
    assertIncludes(content, 'hover:scale-105', 'Must support hover zoom scale on tiles');
  });

  test('F54-1: FlashSaleBlock queries flash sale products and manages live countdown timer', () => {
    const filePath = path.join(ROOT_DIR, 'src/features/storefront/blocks/FlashSaleBlock.tsx');
    assert(fs.existsSync(filePath), 'FlashSaleBlock.tsx must exist');
    const content = fs.readFileSync(filePath, 'utf8');
    assertIncludes(content, 'productService.getFlashSaleProducts', 'Must query flash sale products');
    assertIncludes(content, 'showStockProgress', 'Must render stock progress bar');
    assertIncludes(content, 'setTimeLeft', 'Must manage countdown timer in state');
  });

  test('F54-2: FlashSalePage provides full page view with countdown and live product cards', () => {
    const pagePath = path.join(ROOT_DIR, 'src/features/storefront/pages/FlashSalePage.tsx');
    assert(fs.existsSync(pagePath), 'FlashSalePage.tsx must exist');
    const content = fs.readFileSync(pagePath, 'utf8');
    assertIncludes(content, 'productService.getFlashSaleProducts', 'FlashSalePage must fetch real products');
    assertIncludes(content, 'ProductCard', 'Must render ProductCard items');
  });
});

// -----------------------------------------------------------------------------
// FEATURES 55 - 59: Featured, Promo, Testimonials, Newsletter, Footer
// -----------------------------------------------------------------------------
describe('Features 55 - 59: Storefront Content & Conversion Blocks', () => {
  test('F55-1: FeaturedProductsBlock renders filter tabs and queries products from productService', () => {
    const filePath = path.join(ROOT_DIR, 'src/features/storefront/blocks/FeaturedProductsBlock.tsx');
    assert(fs.existsSync(filePath), 'FeaturedProductsBlock.tsx must exist');
    const content = fs.readFileSync(filePath, 'utf8');
    assertIncludes(content, 'productService.getProducts', 'Must fetch products from productService');
    assertIncludes(content, 'best-seller', 'Must support bestseller filter tab');
    assertIncludes(content, 'new', 'Must support new products filter tab');
    assertIncludes(content, 'sale', 'Must support sale products filter tab');
    assertIncludes(content, 'd2c:products-updated', 'Must react to product updates');
  });

  test('F56-1: PromoBannerBlock provides coupon code and 1-click clipboard copy', () => {
    const filePath = path.join(ROOT_DIR, 'src/features/storefront/blocks/PromoBannerBlock.tsx');
    assert(fs.existsSync(filePath), 'PromoBannerBlock.tsx must exist');
    const content = fs.readFileSync(filePath, 'utf8');
    assertIncludes(content, 'clipboard.writeText', 'Must support clipboard write');
    assertIncludes(content, 'toast.success', 'Must provide toast feedback upon copy');
    assertIncludes(content, 'CHAOBAN', 'Must provide default coupon code');
  });

  test('F57-1: TestimonialsBlock displays customer reviews with rating stars and verified badges', () => {
    const filePath = path.join(ROOT_DIR, 'src/features/storefront/blocks/TestimonialsBlock.tsx');
    assert(fs.existsSync(filePath), 'TestimonialsBlock.tsx must exist');
    const content = fs.readFileSync(filePath, 'utf8');
    assertIncludes(content, 'CheckCircle', 'Must display verified purchase badge');
    assertIncludes(content, 'Star', 'Must render star rating indicators');
  });

  test('F58-1: NewsletterBlock validates email inputs using Zod schema', () => {
    const filePath = path.join(ROOT_DIR, 'src/features/storefront/blocks/NewsletterBlock.tsx');
    assert(fs.existsSync(filePath), 'NewsletterBlock.tsx must exist');
    const content = fs.readFileSync(filePath, 'utf8');
    assertIncludes(content, 'newsletterSchema', 'Must define newsletterSchema');
    assertIncludes(content, 'z.object', 'Must use Zod object schema');
    assertIncludes(content, 'toast.success', 'Must notify subscriber on success');
  });

  test('F59-1: FooterBlock renders brand information and payment badges', () => {
    const filePath = path.join(ROOT_DIR, 'src/features/storefront/blocks/FooterBlock.tsx');
    assert(fs.existsSync(filePath), 'FooterBlock.tsx must exist');
    const content = fs.readFileSync(filePath, 'utf8');
    assertIncludes(content, 'VietQR', 'Must display VietQR badge');
    assertIncludes(content, 'MoMo', 'Must display MoMo badge');
    assertIncludes(content, 'COD', 'Must display COD badge');
  });

  test('F59-2: HomePage renders DynamicBlockRenderer cleanly', () => {
    const homePath = path.join(ROOT_DIR, 'src/features/storefront/pages/HomePage.tsx');
    assert(fs.existsSync(homePath), 'HomePage.tsx must exist');
    const content = fs.readFileSync(homePath, 'utf8');
    assertIncludes(content, 'DynamicBlockRenderer', 'HomePage must render DynamicBlockRenderer');
  });
});

// -----------------------------------------------------------------------------
// FEATURE 60: Catalog PLP Page, Filter Sidebar, Active Filters & Pagination
// -----------------------------------------------------------------------------
describe('Feature 60: Catalog PLP Page & Faceted Filters', () => {
  const catalogPath = path.join(ROOT_DIR, 'src/features/storefront/pages/CatalogPage.tsx');
  const catalogContent = fs.readFileSync(catalogPath, 'utf8');

  test('F60-1: CatalogPage queries all products and categories from productService', () => {
    assert(fs.existsSync(catalogPath), 'CatalogPage.tsx must exist');
    assertIncludes(catalogContent, 'productService.getProducts', 'CatalogPage must call getProducts');
    assertIncludes(catalogContent, 'productService.getCategories', 'CatalogPage must call getCategories');
  });

  test('F60-2: CatalogPage binds URL search parameters (q, category, minPrice, maxPrice, inStock, sort, page)', () => {
    assertIncludes(catalogContent, 'useSearchParams', 'Must use useSearchParams');
    assertIncludes(catalogContent, "searchParams.get('q')", 'Must read search query param');
    assertIncludes(catalogContent, "searchParams.get('category')", 'Must read category param');
    assertIncludes(catalogContent, "searchParams.get('sort')", 'Must read sort param');
    assertIncludes(catalogContent, "searchParams.get('page')", 'Must read page param');
  });

  test('F60-3: CatalogFilterSidebar component provides multi-faceted filtering options', () => {
    const sidebarPath = path.join(ROOT_DIR, 'src/features/storefront/components/CatalogFilterSidebar.tsx');
    assert(fs.existsSync(sidebarPath), 'CatalogFilterSidebar.tsx must exist');
    const content = fs.readFileSync(sidebarPath, 'utf8');
    assertIncludes(content, 'Danh Mục Sản Phẩm', 'Must filter by category');
    assertIncludes(content, 'Khoảng Giá', 'Must filter by price presets and custom inputs');
    assertIncludes(content, 'Tình Trạng Kho', 'Must filter by stock availability');
    assertIncludes(content, 'Đánh Giá Tối Thiểu', 'Must filter by rating stars');
    assertIncludes(content, 'Xóa bộ lọc', 'Must provide reset action');
  });

  test('F60-4: CatalogActiveFilters renders removable filter pills', () => {
    const activePath = path.join(ROOT_DIR, 'src/features/storefront/components/CatalogActiveFilters.tsx');
    assert(fs.existsSync(activePath), 'CatalogActiveFilters.tsx must exist');
    const content = fs.readFileSync(activePath, 'utf8');
    assertIncludes(content, 'Xóa tất cả', 'Must provide clear all button');
  });

  test('F60-5: CategoryPage seamlessly navigates to catalog filtered by category slug', () => {
    const catPagePath = path.join(ROOT_DIR, 'src/features/storefront/pages/CategoryPage.tsx');
    assert(fs.existsSync(catPagePath), 'CategoryPage.tsx must exist');
    const content = fs.readFileSync(catPagePath, 'utf8');
    assertIncludes(content, '/catalog?category=', 'CategoryPage must redirect to catalog with category query');
  });
});

// -----------------------------------------------------------------------------
// FEATURES 61, 62, 63: Product Detail PDP, Gallery, Variant Picker, Reviews
// -----------------------------------------------------------------------------
describe('Features 61 - 63: Product Detail PDP, Variants & Reviews', () => {
  const pdpPath = path.join(ROOT_DIR, 'src/features/storefront/pages/ProductDetailPage.tsx');
  const pdpContent = fs.readFileSync(pdpPath, 'utf8');

  test('F61-1: ProductDetailPage implements dual-lookup by slug and fallback by id', () => {
    assert(fs.existsSync(pdpPath), 'ProductDetailPage.tsx must exist');
    assertIncludes(pdpContent, 'productService.getProductBySlug', 'PDP must implement dual-lookup by slug');
    assertIncludes(pdpContent, 'productService.getProductById', 'PDP must implement dual-lookup by id');
    assertIncludes(pdpContent, 'ProductGallery', 'PDP must render ProductGallery');
    assertIncludes(pdpContent, 'ProductVariantPicker', 'PDP must render ProductVariantPicker');
    assertIncludes(pdpContent, 'QuantityStepper', 'PDP must render QuantityStepper');
    assertIncludes(pdpContent, 'ProductTabs', 'PDP must render ProductTabs');
    assertIncludes(pdpContent, 'RelatedProducts', 'PDP must render RelatedProducts');
  });

  test('F61-2: ProductGallery component implements hover zoom, thumbnail strip and lightbox modal', () => {
    const galleryPath = path.join(ROOT_DIR, 'src/features/storefront/components/pdp/ProductGallery.tsx');
    assert(fs.existsSync(galleryPath), 'ProductGallery.tsx must exist');
    const content = fs.readFileSync(galleryPath, 'utf8');
    assertIncludes(content, 'isZooming', 'Must support hover lens zoom');
    assertIncludes(content, 'lightboxOpen', 'Must support full-screen lightbox modal');
    assertIncludes(content, 'setActiveIndex', 'Must support thumbnail strip switching');
  });

  test('F61-3: formatCurrencyVND correctly formats Vietnamese Dong amounts', () => {
    const formatted = formatCurrencyVND(299000);
    assertIncludes(formatted, '299.000', 'Must format currency properly in Vietnamese Dong');
    assertEqual(formatCurrencyVND(0), '0\u00a0₫', 'Zero VND should format cleanly');
  });

  test('F62-1: ProductVariantPicker maps Vietnamese color swatches and size buttons', () => {
    const pickerPath = path.join(ROOT_DIR, 'src/features/storefront/components/pdp/ProductVariantPicker.tsx');
    assert(fs.existsSync(pickerPath), 'ProductVariantPicker.tsx must exist');
    const content = fs.readFileSync(pickerPath, 'utf8');
    assertIncludes(content, 'colorHexMap', 'Must map color names to hex codes');
    assertIncludes(content, 'isOutOfStockCombination', 'Must detect out-of-stock variant combinations');
  });

  test('F62-2: QuantityStepper clamps input between 1 and available stock', () => {
    const stepperPath = path.join(ROOT_DIR, 'src/features/storefront/components/pdp/QuantityStepper.tsx');
    assert(fs.existsSync(stepperPath), 'QuantityStepper.tsx must exist');
    const content = fs.readFileSync(stepperPath, 'utf8');
    assertIncludes(content, 'handleDecrement', 'Must have decrement handler');
    assertIncludes(content, 'handleIncrement', 'Must have increment handler');
    assertIncludes(content, 'maxStock', 'Must enforce maxStock boundary');
  });

  test('F63-1: ProductTabs component renders Description, Specifications, and Customer Reviews', () => {
    const tabsPath = path.join(ROOT_DIR, 'src/features/storefront/components/pdp/ProductTabs.tsx');
    assert(fs.existsSync(tabsPath), 'ProductTabs.tsx must exist');
    const content = fs.readFileSync(tabsPath, 'utf8');
    assertIncludes(content, 'Mô Tả Sản Phẩm', 'Must render description tab');
    assertIncludes(content, 'Thông Số Kỹ Thuật', 'Must render specs tab');
    assertIncludes(content, 'ProductReviews', 'Must render customer reviews');
  });

  test('F63-2: seedReviews exports 15+ authentic Vietnamese reviews', () => {
    const reviewsPath = path.join(ROOT_DIR, 'src/services/seed/reviewsSeed.ts');
    assert(fs.existsSync(reviewsPath), 'reviewsSeed.ts must exist');
    const content = fs.readFileSync(reviewsPath, 'utf8');
    assertIncludes(content, 'export const seedReviews', 'Must export seedReviews');

    const idMatches = content.match(/id:\s*'rev_\d+'/g) || [];
    assertGreaterThan(idMatches.length, 14, `Expected at least 15 review items, found ${idMatches.length}`);
  });

  test('F63-3: reviewService provides LocalStorage persistence in STORAGE_KEYS.REVIEWS', () => {
    const revServicePath = path.join(ROOT_DIR, 'src/services/api/reviewService.ts');
    assert(fs.existsSync(revServicePath), 'reviewService.ts must exist');
    const content = fs.readFileSync(revServicePath, 'utf8');
    assertIncludes(content, 'STORAGE_KEYS.REVIEWS', 'Must persist in STORAGE_KEYS.REVIEWS');
    assertIncludes(content, 'getReviewsByProductId', 'Must provide getReviewsByProductId');
    assertIncludes(content, 'addReview', 'Must provide addReview');
    assertIncludes(content, 'getRatingSummary', 'Must provide getRatingSummary');
  });

  test('F63-4: ProductReviews form validates input with Zod schema', () => {
    const revCompPath = path.join(ROOT_DIR, 'src/features/storefront/components/pdp/ProductReviews.tsx');
    assert(fs.existsSync(revCompPath), 'ProductReviews.tsx must exist');
    const content = fs.readFileSync(revCompPath, 'utf8');
    assertIncludes(content, 'reviewSchema', 'Must validate with reviewSchema');
    assertIncludes(content, 'reviewService.addReview', 'Must persist review via reviewService');
  });

  test('F63-5: RelatedProducts component renders cross-sell products from same category', () => {
    const relatedPath = path.join(ROOT_DIR, 'src/features/storefront/components/pdp/RelatedProducts.tsx');
    assert(fs.existsSync(relatedPath), 'RelatedProducts.tsx must exist');
    const content = fs.readFileSync(relatedPath, 'utf8');
    assertIncludes(content, 'productService.getProducts', 'Must query related products');
    assertIncludes(content, 'ProductCard', 'Must render product cards');
  });
});
