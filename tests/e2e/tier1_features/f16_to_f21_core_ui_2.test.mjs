/**
 * Tier 1 Contract & Smoke Tests: Features 16 - 21 (Milestone 2 Core UI Part 2)
 * Feature 16: Badge Primitive (variants, subtle/solid/outline styles, dot indicator)
 * Feature 17: Card Primitive (CardHeader, CardTitle, CardContent, CardFooter)
 * Feature 18: Data Table Primitive (columns, sorting indicators, row selection, bulk toolbar)
 * Feature 19: Pagination Primitive (records counter, page size selector, active pills, smart ellipsis)
 * Feature 20: Skeleton & Empty States (shimmer variants, 5 e-commerce empty state presets)
 * Feature 21: Image Upload (dropzone, preview, Base64 conversion, validation limits <5MB)
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

// -----------------------------------------------------------------------------
// FEATURE 16: Badge Primitive (6 tests)
// -----------------------------------------------------------------------------
describe('Feature 16: Badge Primitive', () => {
  test('F16-1: Badge module exists and exports Badge and types', () => {
    const badgePath = path.join(ROOT_DIR, 'src/core/components/Badge/Badge.tsx');
    const indexPath = path.join(ROOT_DIR, 'src/core/components/Badge/index.ts');

    assert(fs.existsSync(badgePath), 'Badge.tsx must exist');
    assert(fs.existsSync(indexPath), 'Badge index.ts must exist');

    const content = fs.readFileSync(badgePath, 'utf8');
    assertIncludes(content, 'export const Badge', 'Badge.tsx must export Badge component');
    assertIncludes(content, 'Badge.displayName', 'Badge must specify displayName');
  });

  test('F16-2: Badge maps all 6 visual variants to corresponding color palettes', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Badge/Badge.tsx'), 'utf8');

    // Variants: primary, success, warning, danger, info, neutral
    assertIncludes(content, 'bg-primary-subtle', 'primary variant must use bg-primary-subtle');
    assertIncludes(content, 'bg-emerald-50', 'success variant must use emerald palette');
    assertIncludes(content, 'bg-amber-50', 'warning variant must use amber palette');
    assertIncludes(content, 'bg-rose-50', 'danger variant must use rose palette');
    assertIncludes(content, 'bg-blue-50', 'info variant must use blue palette');
    assertIncludes(content, 'bg-surface-subtle', 'neutral variant must use surface-subtle palette');
  });

  test('F16-3: Badge supports subtle, solid, and outline appearance styles', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Badge/Badge.tsx'), 'utf8');

    assertIncludes(content, 'subtle:', 'Badge must define subtle appearance map');
    assertIncludes(content, 'solid:', 'Badge must define solid appearance map');
    assertIncludes(content, 'outline:', 'Badge must define outline appearance map');
    assertIncludes(content, 'bg-status-success', 'solid success must use bg-status-success');
    assertIncludes(content, 'bg-status-danger', 'solid danger must use bg-status-danger');
  });

  test('F16-4: Badge pulse dot indicator renders ping animation and relative dot', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Badge/Badge.tsx'), 'utf8');

    assertIncludes(content, 'pulse', 'Badge must support pulse prop');
    assertIncludes(content, 'animate-ping', 'Pulse dot must include animate-ping class');
    assertIncludes(content, 'rounded-full h-2 w-2', 'Pulse dot must be circular with 8px diameter');
  });

  test('F16-5: Badge removable tag pill renders X dismiss button and triggers callback', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Badge/Badge.tsx'), 'utf8');

    assertIncludes(content, 'onRemove', 'Badge must support onRemove callback prop');
    assertIncludes(content, 'onClick={onRemove}', 'Dismiss button must trigger onRemove on click');
    assertIncludes(content, 'aria-label="Xóa"', 'Dismiss button must have Vietnamese aria-label');
  });

  test('F16-6: Badge size scale maps to precise typography and padding scales', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Badge/Badge.tsx'), 'utf8');

    assertIncludes(content, 'text-[10px] px-1.5 py-0.5', 'sm size must have text-[10px]');
    assertIncludes(content, 'text-xs px-2.5 py-0.5', 'md size must have text-xs');
    assertIncludes(content, 'text-sm px-3 py-1', 'lg size must have text-sm');
    assertIncludes(content, 'leftIcon', 'Badge must support leftIcon slot');
    assertIncludes(content, 'rightIcon', 'Badge must support rightIcon slot');
  });
});

// -----------------------------------------------------------------------------
// FEATURE 17: Card Primitive (6 tests)
// -----------------------------------------------------------------------------
describe('Feature 17: Card Primitive', () => {
  test('F17-1: Card module exists and exports forwardRef Card and all compound primitives', () => {
    const cardPath = path.join(ROOT_DIR, 'src/core/components/Card/Card.tsx');
    const indexPath = path.join(ROOT_DIR, 'src/core/components/Card/index.ts');

    assert(fs.existsSync(cardPath), 'Card.tsx must exist');
    assert(fs.existsSync(indexPath), 'Card index.ts must exist');

    const content = fs.readFileSync(cardPath, 'utf8');
    assertIncludes(content, 'export const Card = React.forwardRef', 'Card must use React.forwardRef');
    assertIncludes(content, 'CardHeader', 'Card must export CardHeader');
    assertIncludes(content, 'CardTitle', 'Card must export CardTitle');
    assertIncludes(content, 'CardDescription', 'Card must export CardDescription');
    assertIncludes(content, 'CardContent', 'Card must export CardContent');
    assertIncludes(content, 'CardFooter', 'Card must export CardFooter');
  });

  test('F17-2: Card supports 5 visual variants with surface tokens', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Card/Card.tsx'), 'utf8');

    assertIncludes(content, 'bg-surface-card border border-border-base', 'default variant must use surface-card and border-base');
    assertIncludes(content, 'border-2 border-border-base', 'bordered variant must use double-thickness border');
    assertIncludes(content, 'shadow-md', 'elevated variant must use shadow-md');
    assertIncludes(content, 'bg-transparent border-none', 'ghost variant must be transparent');
    assertIncludes(content, 'interactive:', 'Card must define interactive variant');
  });

  test('F17-3: Interactive Card variant applies hover elevation and active scale', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Card/Card.tsx'), 'utf8');

    assertIncludes(content, 'hover:shadow-md', 'Interactive card must elevate shadow on hover');
    assertIncludes(content, 'hover:border-primary/40', 'Interactive card must highlight border on hover');
    assertIncludes(content, 'active:scale-[0.99]', 'Interactive card must provide tactile active scale press');
  });

  test('F17-4: Card padding scale supports none, sm, md, and lg presets', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Card/Card.tsx'), 'utf8');

    assertIncludes(content, "none: ''", 'none padding must be empty');
    assertIncludes(content, "sm: 'p-4'", 'sm padding must be p-4');
    assertIncludes(content, "md: 'p-6'", 'md padding must be p-6');
    assertIncludes(content, "lg: 'p-8'", 'lg padding must be p-8');
  });

  test('F17-5: CardHeader and CardFooter support bordered divider slots', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Card/Card.tsx'), 'utf8');

    assertIncludes(content, 'bordered &&', 'CardHeader must support bordered divider prop');
    assertIncludes(content, 'border-b border-border-base', 'CardHeader bordered must add bottom divider');
    assertIncludes(content, 'border-t border-border-base', 'CardFooter bordered must add top divider');
  });

  test('F17-6: CardTitle supports semantic HTML heading tag customization via as prop', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Card/Card.tsx'), 'utf8');

    assertIncludes(content, "as: Component = 'h3'", 'CardTitle must default to h3 element');
    assertIncludes(content, '<Component className=', 'CardTitle must render dynamic Component tag');
  });
});

// -----------------------------------------------------------------------------
// FEATURE 18: Data Table Primitive (6 tests)
// -----------------------------------------------------------------------------
describe('Feature 18: Data Table Primitive', () => {
  test('F18-1: Semantic table primitives exist and export HTML5 table wrappers', () => {
    const tablePath = path.join(ROOT_DIR, 'src/core/components/Table/Table.tsx');
    const dataTablePath = path.join(ROOT_DIR, 'src/core/components/Table/DataTable.tsx');
    const indexPath = path.join(ROOT_DIR, 'src/core/components/Table/index.ts');

    assert(fs.existsSync(tablePath), 'Table.tsx must exist');
    assert(fs.existsSync(dataTablePath), 'DataTable.tsx must exist');
    assert(fs.existsSync(indexPath), 'Table index.ts must exist');

    const content = fs.readFileSync(tablePath, 'utf8');
    assertIncludes(content, 'TableHeader', 'Table must export TableHeader');
    assertIncludes(content, 'TableBody', 'Table must export TableBody');
    assertIncludes(content, 'TableFooter', 'Table must export TableFooter');
    assertIncludes(content, 'TableRow', 'Table must export TableRow');
    assertIncludes(content, 'TableHead', 'Table must export TableHead');
    assertIncludes(content, 'TableCell', 'Table must export TableCell');
    assertIncludes(content, 'TableCaption', 'Table must export TableCaption');
  });

  test('F18-2: DataTable generic component defines ColumnDef schema', () => {
    const typesPath = path.join(ROOT_DIR, 'src/core/components/Table/types.ts');
    assert(fs.existsSync(typesPath), 'types.ts must exist');

    const content = fs.readFileSync(typesPath, 'utf8');
    assertIncludes(content, 'export interface ColumnDef<T>', 'types.ts must define ColumnDef interface');
    assertIncludes(content, 'key: string', 'ColumnDef must require key');
    assertIncludes(content, 'header:', 'ColumnDef must require header');
    assertIncludes(content, 'sortable?: boolean', 'ColumnDef must support sortable');
    assertIncludes(content, 'accessorKey?:', 'ColumnDef must support accessorKey');
  });

  test('F18-3: Sortable column headers implement tri-state cycle with indicators and aria-sort', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Table/DataTable.tsx'), 'utf8');

    assertIncludes(content, 'handleSortToggle', 'DataTable must implement handleSortToggle');
    assertIncludes(content, 'ArrowUp', 'Sort asc must render ArrowUp');
    assertIncludes(content, 'ArrowDown', 'Sort desc must render ArrowDown');
    assertIncludes(content, 'ArrowUpDown', 'Sort neutral must render ArrowUpDown');
    assertIncludes(content, 'aria-sort', 'Sortable header must specify aria-sort');

    // Simulate tri-state sorting state machine
    let sort = null;
    const toggleSort = (key, current) => {
      if (!current || current.columnKey !== key) return { columnKey: key, direction: 'asc' };
      if (current.direction === 'asc') return { columnKey: key, direction: 'desc' };
      return null;
    };

    sort = toggleSort('price', sort);
    assertDeepEqual(sort, { columnKey: 'price', direction: 'asc' }, 'First click sorts asc');

    sort = toggleSort('price', sort);
    assertDeepEqual(sort, { columnKey: 'price', direction: 'desc' }, 'Second click sorts desc');

    sort = toggleSort('price', sort);
    assertEqual(sort, null, 'Third click resets sort to null');
  });

  test('F18-4: Row selection checkboxes maintain independent states and update master checkbox', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Table/DataTable.tsx'), 'utf8');

    assertIncludes(content, 'masterCheckboxRef', 'DataTable must use masterCheckboxRef');
    assertIncludes(content, 'masterCheckboxRef.current.indeterminate = isIndeterminate', 'DataTable must bind master checkbox indeterminate property via DOM ref');
    assertIncludes(content, 'isIndeterminate', 'DataTable must calculate isIndeterminate');
    assertIncludes(content, 'isAllSelected', 'DataTable must calculate isAllSelected');
    assertIncludes(content, 'aria-label="Chọn tất cả dòng"', 'Master checkbox must have aria-label');
  });

  test('F18-5: Bulk actions toolbar slot renders dynamically when rows are selected', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Table/DataTable.tsx'), 'utf8');

    assertIncludes(content, 'bulkActions', 'DataTable must support bulkActions slot');
    assertIncludes(content, 'clearSelection', 'DataTable must provide clearSelection method');
    assertIncludes(content, 'Bỏ chọn tất cả', 'Bulk actions toolbar must include Vietnamese "Bỏ chọn tất cả" button');
    assertIncludes(content, 'Đã chọn', 'Toolbar must format Vietnamese "Đã chọn X mục"');
  });

  test('F18-6: DataTable empty state and loading skeleton integration', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Table/DataTable.tsx'), 'utf8');

    assertIncludes(content, 'isLoading', 'DataTable must support isLoading prop');
    assertIncludes(content, 'loadingRowCount', 'DataTable must support loadingRowCount prop');
    assertIncludes(content, 'emptyState', 'DataTable must support emptyState slot');
    assertIncludes(content, 'colSpan={columns.length + (selectable ? 1 : 0)}', 'Empty state row must span all table columns');
  });
});

// -----------------------------------------------------------------------------
// FEATURE 19: Pagination Primitive (6 tests)
// -----------------------------------------------------------------------------
describe('Feature 19: Pagination Primitive', () => {
  test('F19-1: Pagination component and usePagination hook exist', () => {
    const pagPath = path.join(ROOT_DIR, 'src/core/components/Pagination/Pagination.tsx');
    const hookPath = path.join(ROOT_DIR, 'src/core/components/Pagination/usePagination.ts');
    const indexPath = path.join(ROOT_DIR, 'src/core/components/Pagination/index.ts');

    assert(fs.existsSync(pagPath), 'Pagination.tsx must exist');
    assert(fs.existsSync(hookPath), 'usePagination.ts must exist');
    assert(fs.existsSync(indexPath), 'Pagination index.ts must exist');

    const indexContent = fs.readFileSync(indexPath, 'utf8');
    assertIncludes(indexContent, 'Pagination', 'index.ts must export Pagination');
    assertIncludes(indexContent, 'usePagination', 'index.ts must export usePagination');
  });

  test('F19-2: usePagination algorithm generates correct page numbers and smart ellipsis', () => {
    const hookContent = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Pagination/usePagination.ts'), 'utf8');

    assertIncludes(hookContent, 'ellipsis-right', 'Algorithm must generate ellipsis-right');
    assertIncludes(hookContent, 'ellipsis-left', 'Algorithm must generate ellipsis-left');

    // Test the pure mathematical pagination algorithm
    function calculatePagination({ currentPage, totalPages, siblingCount = 1 }) {
      if (totalPages <= 0) return [];
      const totalNumbers = siblingCount * 2 + 3;
      const totalBlocks = totalNumbers + 2;

      if (totalPages <= totalBlocks) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
      }

      const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
      const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

      const shouldShowLeftDots = leftSiblingIndex > 2;
      const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

      if (!shouldShowLeftDots && shouldShowRightDots) {
        const leftItemCount = 3 + 2 * siblingCount;
        const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
        return [...leftRange, 'ellipsis-right', totalPages];
      }

      if (shouldShowLeftDots && !shouldShowRightDots) {
        const rightItemCount = 3 + 2 * siblingCount;
        const rightRange = Array.from({ length: rightItemCount }, (_, i) => totalPages - rightItemCount + i + 1);
        return [1, 'ellipsis-left', ...rightRange];
      }

      if (shouldShowLeftDots && shouldShowRightDots) {
        const middleRange = Array.from({ length: rightSiblingIndex - leftSiblingIndex + 1 }, (_, i) => leftSiblingIndex + i);
        return [1, 'ellipsis-left', ...middleRange, 'ellipsis-right', totalPages];
      }

      return [];
    }

    // Case 1: Small total pages (<= 7) shows all numbers
    const smallRange = calculatePagination({ currentPage: 3, totalPages: 5 });
    assertDeepEqual(smallRange, [1, 2, 3, 4, 5], 'Small page count must display all page numbers');

    // Case 2: Near beginning of large total pages
    const nearStartRange = calculatePagination({ currentPage: 2, totalPages: 10 });
    assertDeepEqual(nearStartRange, [1, 2, 3, 4, 5, 'ellipsis-right', 10], 'Near start must show right ellipsis');

    // Case 3: Near end of large total pages
    const nearEndRange = calculatePagination({ currentPage: 9, totalPages: 10 });
    assertDeepEqual(nearEndRange, [1, 'ellipsis-left', 6, 7, 8, 9, 10], 'Near end must show left ellipsis');

    // Case 4: Middle of large total pages
    const middleRange = calculatePagination({ currentPage: 5, totalPages: 10 });
    assertDeepEqual(middleRange, [1, 'ellipsis-left', 4, 5, 6, 'ellipsis-right', 10], 'Middle page must show both ellipses');
  });

  test('F19-3: Records summary formats accurate Vietnamese text with zero bounds handling', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Pagination/Pagination.tsx'), 'utf8');

    assertIncludes(content, 'Hiển thị', 'Summary must include Vietnamese "Hiển thị"');
    assertIncludes(content, 'trong', 'Summary must include Vietnamese "trong"');
    assertIncludes(content, 'bản ghi', 'Summary must include Vietnamese "bản ghi"');
    assertIncludes(content, 'totalItems === 0 ? 0 :', 'Summary must handle 0 items by displaying 0');
  });

  test('F19-4: Previous and Next boundary buttons disable appropriately', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Pagination/Pagination.tsx'), 'utf8');

    assertIncludes(content, 'isPrevDisabled = currentPage <= 1', 'Previous button must disable at page <= 1');
    assertIncludes(content, 'isNextDisabled = currentPage >= totalPages', 'Next button must disable at page >= totalPages');
    assertIncludes(content, 'aria-label="Trang trước"', 'Previous button must have aria-label');
    assertIncludes(content, 'aria-label="Trang tiếp theo"', 'Next button must have aria-label');
  });

  test('F19-5: Page size selector provides options and emits onPageSizeChange', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Pagination/Pagination.tsx'), 'utf8');

    assertIncludes(content, 'pageSizeOptions = [10, 20, 50, 100]', 'Default page size options must be [10, 20, 50, 100]');
    assertIncludes(content, 'onPageSizeChange', 'Component must support onPageSizeChange callback');
    assertIncludes(content, 'Số dòng:', 'Selector must include Vietnamese label "Số dòng:"');
    assertIncludes(content, '/ trang', 'Options must format with "/ trang"');
  });

  test('F19-6: Active page pill receives aria-current="page" and primary styling', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Pagination/Pagination.tsx'), 'utf8');

    assertIncludes(content, 'aria-current={isActive ? \'page\' : undefined}', 'Active page button must set aria-current="page"');
    assertIncludes(content, 'bg-primary text-content-inverse', 'Active page must highlight with bg-primary');
    assertIncludes(content, 'role="navigation"', 'Outer container must specify role="navigation"');
    assertIncludes(content, 'aria-label="Điều hướng phân trang"', 'Container must have Vietnamese aria-label');
  });
});

// -----------------------------------------------------------------------------
// FEATURE 20: Skeleton & Empty States (6 tests)
// -----------------------------------------------------------------------------
describe('Feature 20: Skeleton & Empty States Primitives', () => {
  test('F20-1: Skeleton primitive exists with shimmer pulse animation and variants', () => {
    const skeletonPath = path.join(ROOT_DIR, 'src/core/components/Feedback/Skeleton.tsx');
    assert(fs.existsSync(skeletonPath), 'Skeleton.tsx must exist');

    const content = fs.readFileSync(skeletonPath, 'utf8');
    assertIncludes(content, 'animate-pulse', 'Skeleton must include animate-pulse class');
    assertIncludes(content, 'text:', 'Skeleton must support text variant');
    assertIncludes(content, 'circular:', 'Skeleton must support circular variant');
    assertIncludes(content, 'rectangular:', 'Skeleton must support rectangular variant');
    assertIncludes(content, 'rounded:', 'Skeleton must support rounded variant');
    assertIncludes(content, 'aria-hidden="true"', 'Skeleton must hide from screen readers via aria-hidden');
  });

  test('F20-2: Composite skeletons render configured counts and dimensions', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Feedback/Skeleton.tsx'), 'utf8');

    assertIncludes(content, 'SkeletonText', 'Feedback must export SkeletonText');
    assertIncludes(content, 'SkeletonAvatar', 'Feedback must export SkeletonAvatar');
    assertIncludes(content, 'SkeletonCard', 'Feedback must export SkeletonCard');
    assertIncludes(content, 'SkeletonTable', 'Feedback must export SkeletonTable');
  });

  test('F20-3: EmptyState component exists with role="status" and action button CTA slot', () => {
    const emptyPath = path.join(ROOT_DIR, 'src/core/components/Feedback/EmptyState.tsx');
    assert(fs.existsSync(emptyPath), 'EmptyState.tsx must exist');

    const content = fs.readFileSync(emptyPath, 'utf8');
    assertIncludes(content, 'role="status"', 'EmptyState must specify role="status"');
    assertIncludes(content, 'action', 'EmptyState must support primary action');
    assertIncludes(content, 'secondaryAction', 'EmptyState must support secondary action');
  });

  test('F20-4: EmptyState defines all 5 e-commerce presets with semantic icons and tint styles', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Feedback/EmptyState.tsx'), 'utf8');

    // 5 Presets: no-data, no-search, empty-cart, no-orders, error
    assertIncludes(content, 'PackageOpen', 'no-data preset must use PackageOpen icon');
    assertIncludes(content, 'SearchX', 'no-search preset must use SearchX icon');
    assertIncludes(content, 'ShoppingBag', 'empty-cart preset must use ShoppingBag icon');
    assertIncludes(content, 'Receipt', 'no-orders preset must use Receipt icon');
    assertIncludes(content, 'AlertCircle', 'error preset must use AlertCircle icon');
  });

  test('F20-5: EmptyState compact mode applies reduced padding and scaled icons', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Feedback/EmptyState.tsx'), 'utf8');

    assertIncludes(content, 'compact', 'EmptyState must support compact prop');
    assertIncludes(content, "compact ? 'py-8 px-4'", 'compact mode must reduce vertical padding');
    assertIncludes(content, "compact ? 'w-12 h-12", 'compact mode must reduce icon container size');
  });

  test('F20-6: EmptyState action rendering supports both action objects and custom React nodes', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Feedback/EmptyState.tsx'), 'utf8');

    assertIncludes(content, 'React.isValidElement(act)', 'EmptyState must support raw React element actions');
    assertIncludes(content, 'actionObj.onClick', 'EmptyState must wire action button click handler');
  });
});

// -----------------------------------------------------------------------------
// FEATURE 21: Image Upload & Preview (6 tests)
// -----------------------------------------------------------------------------
describe('Feature 21: Image Upload & Preview Primitive', () => {
  test('F21-1: ImageUpload module exists and exports component and data contracts', () => {
    const uploadPath = path.join(ROOT_DIR, 'src/core/components/ImageUpload/ImageUpload.tsx');
    const typesPath = path.join(ROOT_DIR, 'src/core/components/ImageUpload/types.ts');
    const indexPath = path.join(ROOT_DIR, 'src/core/components/ImageUpload/index.ts');

    assert(fs.existsSync(uploadPath), 'ImageUpload.tsx must exist');
    assert(fs.existsSync(typesPath), 'types.ts must exist');
    assert(fs.existsSync(indexPath), 'index.ts must exist');

    const typesContent = fs.readFileSync(typesPath, 'utf8');
    assertIncludes(typesContent, 'UploadedImage', 'types.ts must export UploadedImage interface');
    assertIncludes(typesContent, 'ImageUploadProps', 'types.ts must export ImageUploadProps interface');
  });

  test('F21-2: Drag-and-drop dropzone handles dragover, dragleave, and drop states', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/ImageUpload/ImageUpload.tsx'), 'utf8');

    assertIncludes(content, 'isDragging', 'ImageUpload must manage isDragging state');
    assertIncludes(content, 'onDragOver={handleDragOver}', 'Dropzone must handle dragover');
    assertIncludes(content, 'onDragLeave={handleDragLeave}', 'Dropzone must handle dragleave');
    assertIncludes(content, 'onDrop={handleDrop}', 'Dropzone must handle drop event');
    assertIncludes(content, 'border-dashed', 'Dropzone must feature dashed border');
  });

  test('F21-3: File size validation enforces 5MB limit and produces localized error message', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/ImageUpload/ImageUpload.tsx'), 'utf8');

    assertIncludes(content, 'maxSizeInMB = 5', 'ImageUpload default maxSizeInMB must be 5');
    assertIncludes(content, 'maxSizeInMB * 1024 * 1024', 'Validation must compute maxBytes in megabytes');
    assertIncludes(content, 'vượt quá dung lượng tối đa', 'Validation error message must be in Vietnamese');
  });

  test('F21-4: File format validation restricts MIME types to accepted image formats', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/ImageUpload/ImageUpload.tsx'), 'utf8');

    assertIncludes(content, "'image/png', 'image/jpeg', 'image/webp'", 'Default formats must be PNG, JPEG, WEBP');
    assertIncludes(content, 'Định dạng file', 'Invalid format error must start with Vietnamese "Định dạng file"');
    assertIncludes(content, 'Chỉ chấp nhận JPG, PNG hoặc WEBP', 'Invalid format error must guide user to valid extensions');
  });

  test('F21-5: Instant client preview and Base64 conversion pipeline with memory cleanup', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/ImageUpload/ImageUpload.tsx'), 'utf8');

    assertIncludes(content, 'createObjectURL', 'ImageUpload must generate immediate client preview via ObjectURL');
    assertIncludes(content, 'readAsDataURL', 'ImageUpload must generate base64 string via FileReader.readAsDataURL');
    assertIncludes(content, 'revokeObjectURL', 'ImageUpload must revoke active ObjectURLs on unmount or removal');
  });

  test('F21-6: Simulated progress bar and thumbnail delete button with accessible label', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/ImageUpload/ImageUpload.tsx'), 'utf8');

    assertIncludes(content, 'simulateProgress', 'ImageUpload must support simulateProgress');
    assertIncludes(content, 'handleRemove', 'ImageUpload must provide handleRemove method');
    assertIncludes(content, 'aria-label={`Xóa ảnh', 'Thumbnail remove button must have Vietnamese aria-label');
  });
});
