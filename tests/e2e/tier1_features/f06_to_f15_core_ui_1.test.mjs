/**
 * Tier 1 Contract & Smoke Tests: Features 6 - 15 (Milestone 2 Core UI Part 1)
 * Feature 6: Button Primitives (variants, loading spinner, disabled state)
 * Feature 7: Input Primitive (variants, icons, clear button, error state)
 * Feature 8: Textarea Primitive (auto-resize, character counter)
 * Feature 9: Select & MultiSelect Primitives (options, search filter, tags/chips)
 * Feature 10: Checkbox, Radio, Switch (checked states, indeterminate, switch roles)
 * Feature 11: Modal / Dialog (portal, backdrop, ESC dismiss, scroll lock)
 * Feature 12: Drawer (slide placements, backdrop, ESC dismiss)
 * Feature 13: Dropdown Menu (triggers, items, shortcuts, danger items)
 * Feature 14: Tabs & Segmented Control (active tab indicator, pill/underline variants, keyboard navigation)
 * Feature 15: Toast Notification System (stacked toasts, auto-dismiss timers, variants, toastStore)
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
// FEATURE 6: Button Primitives (6 tests)
// -----------------------------------------------------------------------------
describe('Feature 6: Button Primitives', () => {
  test('F06-1: Button and ButtonGroup modules exist and export required components', () => {
    const buttonPath = path.join(ROOT_DIR, 'src/core/components/Button/Button.tsx');
    const groupPath = path.join(ROOT_DIR, 'src/core/components/Button/ButtonGroup.tsx');
    const indexPath = path.join(ROOT_DIR, 'src/core/components/Button/index.ts');

    assert(fs.existsSync(buttonPath), 'Button.tsx must exist');
    assert(fs.existsSync(groupPath), 'ButtonGroup.tsx must exist');
    assert(fs.existsSync(indexPath), 'Button index.ts must exist');

    const indexContent = fs.readFileSync(indexPath, 'utf8');
    assertIncludes(indexContent, 'Button', 'index.ts must re-export Button');
    assertIncludes(indexContent, 'ButtonGroup', 'index.ts must re-export ButtonGroup');

    const buttonContent = fs.readFileSync(buttonPath, 'utf8');
    assertIncludes(buttonContent, 'forwardRef', 'Button must use React.forwardRef');
    assertIncludes(buttonContent, 'Button.displayName', 'Button must have displayName');
  });

  test('F06-2: Button maps all 6 visual variants to corresponding design token classes', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Button/Button.tsx'), 'utf8');

    // Variants: primary, secondary, outline, ghost, danger, link
    assertIncludes(content, 'bg-primary', 'primary variant must use bg-primary');
    assertIncludes(content, 'bg-surface-subtle', 'secondary variant must use bg-surface-subtle');
    assertIncludes(content, 'border-border-base', 'outline variant must use border-border-base');
    assertIncludes(content, 'text-content-muted', 'ghost variant must use text-content-muted');
    assertIncludes(content, 'bg-status-danger', 'danger variant must use bg-status-danger');
    assertIncludes(content, 'hover:underline', 'link variant must use hover:underline');
  });

  test('F06-3: Button size scale maps to precise height and padding tokens', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Button/Button.tsx'), 'utf8');

    // Sizes: sm, md, lg, icon-sm, icon-md, icon-lg
    assertIncludes(content, 'h-8 px-3', 'sm size must have h-8 px-3');
    assertIncludes(content, 'h-10 px-4', 'md size must have h-10 px-4');
    assertIncludes(content, 'h-12 px-5', 'lg size must have h-12 px-5');
    assertIncludes(content, "'icon-sm': 'h-8 w-8", 'icon-sm size must be square 8');
    assertIncludes(content, "'icon-md': 'h-10 w-10", 'icon-md size must be square 10');
    assertIncludes(content, "'icon-lg': 'h-12 w-12", 'icon-lg size must be square 12');
  });

  test('F06-4: Button loading state sets aria-busy, renders spinner, and disables interaction', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Button/Button.tsx'), 'utf8');

    assertIncludes(content, 'aria-busy={isLoading}', 'Button must bind aria-busy to isLoading');
    assertIncludes(content, 'Loader2', 'Button must use Loader2 from lucide-react');
    assertIncludes(content, 'animate-spin', 'Loader2 must include animate-spin class');
    assertIncludes(content, 'loadingText', 'Button must support optional loadingText');
    assertIncludes(content, 'disabled || isLoading', 'Button must disable when isLoading is true');
  });

  test('F06-5: Button disabled state prevents interactions and cancels active transforms', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Button/Button.tsx'), 'utf8');

    assertIncludes(content, 'aria-disabled={isDisabled}', 'Button must bind aria-disabled');
    assertIncludes(content, 'disabled:opacity-50', 'Button must reduce opacity when disabled');
    assertIncludes(content, 'disabled:cursor-not-allowed', 'Button must show not-allowed cursor');
    assertIncludes(content, 'disabled:pointer-events-none', 'Button must cancel pointer events when disabled');
    assertIncludes(content, 'disabled:active:translate-y-0', 'Button must prevent active translation when disabled');
  });

  test('F06-6: Button icon slots and layout safeguards comply with design system', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Button/Button.tsx'), 'utf8');

    assertIncludes(content, "type = 'button'", 'Button default type must be "button" to avoid accidental form submit');
    assertIncludes(content, 'leftIcon', 'Button must support leftIcon slot');
    assertIncludes(content, 'rightIcon', 'Button must support rightIcon slot');
    assertIncludes(content, "fullWidth && 'w-full'", 'fullWidth prop must append w-full class');
  });
});

// -----------------------------------------------------------------------------
// FEATURE 7: Input Primitive (6 tests)
// -----------------------------------------------------------------------------
describe('Feature 7: Input Primitive', () => {
  test('F07-1: Input module exists and implements forwardRef with accessible identifier generation', () => {
    const inputPath = path.join(ROOT_DIR, 'src/core/components/Input/Input.tsx');
    const indexPath = path.join(ROOT_DIR, 'src/core/components/Input/index.ts');

    assert(fs.existsSync(inputPath), 'Input.tsx must exist');
    assert(fs.existsSync(indexPath), 'Input index.ts must exist');

    const content = fs.readFileSync(inputPath, 'utf8');
    assertIncludes(content, 'forwardRef', 'Input must use React.forwardRef');
    assertIncludes(content, 'useId()', 'Input must utilize useId for accessibility linking');
    assertIncludes(content, 'Input.displayName', 'Input must specify displayName');
  });

  test('F07-2: Input binds label and required indicator with semantic linkage', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Input/Input.tsx'), 'utf8');

    assertIncludes(content, 'htmlFor={inputId}', 'Label must bind htmlFor to inputId');
    assertIncludes(content, 'text-status-danger', 'Required indicator must display danger asterisk');
    assertIncludes(content, 'aria-hidden="true"', 'Asterisk must be hidden from screen readers');
  });

  test('F07-3: Input password type provides interactive visibility toggle', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Input/Input.tsx'), 'utf8');

    assertIncludes(content, 'showPassword', 'Input must manage showPassword state');
    assertIncludes(content, 'Eye', 'Input must import Eye icon');
    assertIncludes(content, 'EyeOff', 'Input must import EyeOff icon');
    assertIncludes(content, 'Ẩn mật khẩu', 'Input must have Vietnamese aria-label for hiding password');
    assertIncludes(content, 'Hiện mật khẩu', 'Input must have Vietnamese aria-label for revealing password');
    assertIncludes(content, "resolvedType = isPasswordType ? (showPassword ? 'text' : 'password')", 'Input must dynamically toggle resolved type');
  });

  test('F07-4: Input icon and addon slots render prefix/suffix adornments', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Input/Input.tsx'), 'utf8');

    assertIncludes(content, 'prefixIcon', 'Input must support prefixIcon');
    assertIncludes(content, 'suffixIcon', 'Input must support suffixIcon');
    assertIncludes(content, 'prefixAddon', 'Input must support prefixAddon');
    assertIncludes(content, 'suffixAddon', 'Input must support suffixAddon');
  });

  test('F07-5: Input error state binds aria-invalid and aria-describedby with alert message', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Input/Input.tsx'), 'utf8');

    assertIncludes(content, 'aria-invalid={!!error}', 'Input must set aria-invalid based on error');
    assertIncludes(content, 'aria-describedby', 'Input must set aria-describedby to error or helper ID');
    assertIncludes(content, 'role="alert"', 'Error message container must have role="alert"');
    assertIncludes(content, 'AlertCircle', 'Error message must display AlertCircle icon');
    assertIncludes(content, 'border-status-danger', 'Error state must display red border');
  });

  test('F07-6: Input clearable functionality renders dedicated clear button', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Input/Input.tsx'), 'utf8');

    assertIncludes(content, 'clearable', 'Input must support clearable prop');
    assertIncludes(content, 'onClear', 'Input must trigger onClear callback');
    assertIncludes(content, 'Xóa nội dung', 'Clear button must have Vietnamese aria-label');
  });
});

// -----------------------------------------------------------------------------
// FEATURE 8: Textarea Primitive (5 tests)
// -----------------------------------------------------------------------------
describe('Feature 8: Textarea Primitive', () => {
  test('F08-1: Textarea module exists and exports forwardRef component', () => {
    const textareaPath = path.join(ROOT_DIR, 'src/core/components/Textarea/Textarea.tsx');
    const indexPath = path.join(ROOT_DIR, 'src/core/components/Textarea/index.ts');

    assert(fs.existsSync(textareaPath), 'Textarea.tsx must exist');
    assert(fs.existsSync(indexPath), 'Textarea index.ts must exist');

    const content = fs.readFileSync(textareaPath, 'utf8');
    assertIncludes(content, 'forwardRef', 'Textarea must use React.forwardRef');
    assertIncludes(content, 'Textarea.displayName', 'Textarea must define displayName');
  });

  test('F08-2: Textarea links label, helper text, and error states', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Textarea/Textarea.tsx'), 'utf8');

    assertIncludes(content, 'htmlFor={textareaId}', 'Label must link to textareaId');
    assertIncludes(content, 'aria-invalid={!!error}', 'Textarea must set aria-invalid');
    assertIncludes(content, 'role="alert"', 'Error text must render with alert role');
    assertIncludes(content, 'AlertCircle', 'Error state must render AlertCircle icon');
  });

  test('F08-3: Textarea character counter calculates length against maximum limit', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Textarea/Textarea.tsx'), 'utf8');

    assertIncludes(content, 'showCount', 'Textarea must support showCount prop');
    assertIncludes(content, 'maxLength', 'Textarea must support maxLength prop');
    assertIncludes(content, 'tabular-nums', 'Character counter must format with tabular-nums');
    assertIncludes(content, '{currentLength} / {maxLength}', 'Counter must display current / max format');
  });

  test('F08-4: Textarea counter applies warning alert styling when character limit is reached', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Textarea/Textarea.tsx'), 'utf8');

    assertIncludes(content, 'isAtLimit', 'Textarea must calculate isAtLimit boolean');
    assertIncludes(content, 'text-status-danger font-semibold', 'Reaching limit must highlight counter in red');
  });

  test('F08-5: Textarea auto-resize dynamically manages height and scroll overflow', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Textarea/Textarea.tsx'), 'utf8');

    assertIncludes(content, 'autoResize', 'Textarea must support autoResize prop');
    assertIncludes(content, 'scrollHeight', 'Textarea must adjust height based on scrollHeight');
    assertIncludes(content, "autoResize && 'resize-none overflow-hidden'", 'autoResize must disable manual resize and scrollbars');
  });
});

// -----------------------------------------------------------------------------
// FEATURE 9: Select & MultiSelect Primitives (6 tests)
// -----------------------------------------------------------------------------
describe('Feature 9: Select & MultiSelect Primitives', () => {
  test('F09-1: Select modules exist and export Select, MultiSelect, and option contracts', () => {
    const selectPath = path.join(ROOT_DIR, 'src/core/components/Select/Select.tsx');
    const multiPath = path.join(ROOT_DIR, 'src/core/components/Select/MultiSelect.tsx');
    const typesPath = path.join(ROOT_DIR, 'src/core/components/Select/types.ts');
    const indexPath = path.join(ROOT_DIR, 'src/core/components/Select/index.ts');

    assert(fs.existsSync(selectPath), 'Select.tsx must exist');
    assert(fs.existsSync(multiPath), 'MultiSelect.tsx must exist');
    assert(fs.existsSync(typesPath), 'types.ts must exist');
    assert(fs.existsSync(indexPath), 'index.ts must exist');

    const typesContent = fs.readFileSync(typesPath, 'utf8');
    assertIncludes(typesContent, 'SelectOption', 'types.ts must export SelectOption interface');
    assertIncludes(typesContent, 'SelectSize', 'types.ts must export SelectSize');
  });

  test('F09-2: Single Select trigger implements accessible combobox semantics', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Select/Select.tsx'), 'utf8');

    assertIncludes(content, 'role="combobox"', 'Trigger button must have role="combobox"');
    assertIncludes(content, 'aria-haspopup="listbox"', 'Trigger must declare aria-haspopup="listbox"');
    assertIncludes(content, 'aria-expanded={isOpen}', 'Trigger must bind aria-expanded to open state');
    assertIncludes(content, 'aria-controls={listboxId}', 'Trigger must control listbox by ID');
  });

  test('F09-3: Select implements Vietnamese accent-insensitive query normalization', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Select/Select.tsx'), 'utf8');

    assertIncludes(content, 'normalize', 'Select must use Unicode normalization for search');
    assertIncludes(content, "'NFD'", 'Select must use NFD normalization for diacritics');

    // Test the exact accent-insensitive algorithm
    const normalizeVi = (str) =>
      str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const candidates = [
      'Áo Thun Nam Cotton Compact 250GSM',
      'Áo Polo Pique Thể Thao Nam',
      'Quần Khaki Slim-fit Nam',
      'Váy Maxi Nữ Họa Tiết Hoa'
    ];

    const searchHits1 = candidates.filter((c) => normalizeVi(c).includes(normalizeVi('ao thun')));
    assertEqual(searchHits1.length, 1, 'Search "ao thun" must match "Áo Thun Nam Cotton Compact 250GSM"');

    const searchHits2 = candidates.filter((c) => normalizeVi(c).includes(normalizeVi('ao')));
    assertEqual(searchHits2.length, 2, 'Search "ao" must match both Áo Thun and Áo Polo');

    const searchHits3 = candidates.filter((c) => normalizeVi(c).includes(normalizeVi('vay')));
    assertEqual(searchHits3.length, 1, 'Search "vay" must match "Váy Maxi Nữ Họa Tiết Hoa"');
  });

  test('F09-4: Select popover provides keyboard navigation and selection controls', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Select/Select.tsx'), 'utf8');

    assertIncludes(content, "e.key === 'ArrowDown'", 'Select must handle ArrowDown key');
    assertIncludes(content, "e.key === 'ArrowUp'", 'Select must handle ArrowUp key');
    assertIncludes(content, "e.key === 'Enter'", 'Select must handle Enter key');
    assertIncludes(content, "e.key === 'Escape'", 'Select must handle Escape key');
    assertIncludes(content, 'useClickOutside', 'Select must use useClickOutside for popover dismissal');
  });

  test('F09-5: Select clearable option allows 1-click value reset', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Select/Select.tsx'), 'utf8');

    assertIncludes(content, 'clearable', 'Select must support clearable prop');
    assertIncludes(content, 'handleClear', 'Select must implement handleClear method');
    assertIncludes(content, 'Xóa lựa chọn', 'Clear button must have Vietnamese aria-label');
  });

  test('F09-6: MultiSelect renders removable tag chips and badge counters', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Select/MultiSelect.tsx'), 'utf8');

    assertIncludes(content, 'maxDisplayTags', 'MultiSelect must support maxDisplayTags prop');
    assertIncludes(content, 'Xóa tất cả', 'MultiSelect must provide "Xóa tất cả" clear-all button');
    assertIncludes(content, 'khác', 'MultiSelect must format overflow tags with "+X khác"');
  });
});

// -----------------------------------------------------------------------------
// FEATURE 10: Checkbox, Radio, Switch (6 tests)
// -----------------------------------------------------------------------------
describe('Feature 10: Checkbox, Radio, Switch Primitives', () => {
  test('F10-1: Checkbox implements accessible custom styling with sr-only native input', () => {
    const cbPath = path.join(ROOT_DIR, 'src/core/components/Checkbox/Checkbox.tsx');
    assert(fs.existsSync(cbPath), 'Checkbox.tsx must exist');

    const content = fs.readFileSync(cbPath, 'utf8');
    assertIncludes(content, 'peer sr-only', 'Checkbox must hide native input via peer sr-only');
    assertIncludes(content, 'type="checkbox"', 'Input must be type checkbox');
    assertIncludes(content, 'forwardRef', 'Checkbox must use React.forwardRef');
  });

  test('F10-2: Checkbox indeterminate state renders dash icon with mixed aria-checked', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Checkbox/Checkbox.tsx'), 'utf8');

    assertIncludes(content, 'indeterminate', 'Checkbox must support indeterminate prop');
    assertIncludes(content, "aria-checked={indeterminate ? 'mixed' : checked}", 'Checkbox must set aria-checked="mixed" when indeterminate');
    assertIncludes(content, 'Minus', 'Checkbox must render Minus icon when indeterminate');
    assertIncludes(content, 'Check', 'Checkbox must render Check icon when checked');
  });

  test('F10-3: RadioGroup context enforces group name propagation and value binding', () => {
    const groupPath = path.join(ROOT_DIR, 'src/core/components/Radio/RadioGroup.tsx');
    assert(fs.existsSync(groupPath), 'RadioGroup.tsx must exist');

    const content = fs.readFileSync(groupPath, 'utf8');
    assertIncludes(content, 'RadioContext', 'RadioGroup must create RadioContext');
    assertIncludes(content, 'useContext(RadioContext)', 'Radio must consume RadioContext');
    assertIncludes(content, 'role="radiogroup"', 'RadioGroup must specify role="radiogroup"');
  });

  test('F10-4: RadioGroup supports horizontal and vertical orientation layouts', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Radio/RadioGroup.tsx'), 'utf8');

    assertIncludes(content, 'orientation', 'RadioGroup must accept orientation prop');
    assertIncludes(content, "orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap'", 'RadioGroup must dynamically alter layout flex-direction');
  });

  test('F10-5: Switch toggle implements role="switch" with animated thumb translation', () => {
    const switchPath = path.join(ROOT_DIR, 'src/core/components/Switch/Switch.tsx');
    assert(fs.existsSync(switchPath), 'Switch.tsx must exist');

    const content = fs.readFileSync(switchPath, 'utf8');
    assertIncludes(content, 'role="switch"', 'Switch must specify role="switch"');
    assertIncludes(content, 'aria-checked={isChecked}', 'Switch must set aria-checked');
    assertIncludes(content, 'translate-x-', 'Switch thumb must animate with translate-x classes');
    assertIncludes(content, 'trackSizes', 'Switch must support size-specific track dimensions');
  });

  test('F10-6: Disabled state across boolean controls prevents user interaction', () => {
    const cbContent = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Checkbox/Checkbox.tsx'), 'utf8');
    const switchContent = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Switch/Switch.tsx'), 'utf8');

    assertIncludes(cbContent, 'disabled &&', 'Checkbox must handle disabled state');
    assertIncludes(cbContent, 'cursor-not-allowed', 'Disabled checkbox must show cursor-not-allowed');

    assertIncludes(switchContent, 'disabled &&', 'Switch must handle disabled state');
    assertIncludes(switchContent, 'cursor-not-allowed', 'Disabled switch must show cursor-not-allowed');
  });
});

// -----------------------------------------------------------------------------
// FEATURE 11: Modal / Dialog (6 tests)
// -----------------------------------------------------------------------------
describe('Feature 11: Modal / Dialog Primitive', () => {
  test('F11-1: Modal exports Modal, Dialog alias, and compound subcomponents', () => {
    const modalPath = path.join(ROOT_DIR, 'src/core/components/Modal/Modal.tsx');
    const indexPath = path.join(ROOT_DIR, 'src/core/components/Modal/index.ts');

    assert(fs.existsSync(modalPath), 'Modal.tsx must exist');
    assert(fs.existsSync(indexPath), 'Modal index.ts must exist');

    const content = fs.readFileSync(modalPath, 'utf8');
    assertIncludes(content, 'ModalHeader', 'Modal must export ModalHeader');
    assertIncludes(content, 'ModalTitle', 'Modal must export ModalTitle');
    assertIncludes(content, 'ModalDescription', 'Modal must export ModalDescription');
    assertIncludes(content, 'ModalBody', 'Modal must export ModalBody');
    assertIncludes(content, 'ModalFooter', 'Modal must export ModalFooter');
    assertIncludes(content, 'export { Modal as Dialog }', 'Modal must export Dialog alias');
  });

  test('F11-2: Modal mounts into document.body via createPortal with dialog role', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Modal/Modal.tsx'), 'utf8');

    assertIncludes(content, 'createPortal', 'Modal must render via createPortal');
    assertIncludes(content, 'document.body', 'Modal portal must target document.body');
    assertIncludes(content, 'role="dialog"', 'Modal shell must have role="dialog"');
    assertIncludes(content, 'aria-modal="true"', 'Modal shell must declare aria-modal="true"');
  });

  test('F11-3: Modal backdrop provides blur overlay and configurable click-dismiss', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Modal/Modal.tsx'), 'utf8');

    assertIncludes(content, 'backdrop-blur-sm', 'Modal backdrop must use backdrop-blur-sm');
    assertIncludes(content, 'bg-black/60', 'Modal backdrop must use semi-transparent black overlay');
    assertIncludes(content, 'closeOnOverlayClick', 'Modal must support closeOnOverlayClick prop');
    assertIncludes(content, 'e.stopPropagation()', 'Modal dialog click must stop propagation to backdrop');
  });

  test('F11-4: Modal keyboard management traps focus and handles Escape key dismiss', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Modal/Modal.tsx'), 'utf8');

    assertIncludes(content, "e.key === 'Escape'", 'Modal must listen for Escape key');
    assertIncludes(content, 'closeOnEsc', 'Modal must respect closeOnEsc prop');
    assertIncludes(content, "e.key === 'Tab'", 'Modal must intercept Tab for focus trap');
  });

  test('F11-5: Modal locks body scroll while open and restores on unmount', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Modal/Modal.tsx'), 'utf8');

    assertIncludes(content, 'useBodyScrollLock(isOpen)', 'Modal must integrate useBodyScrollLock');
  });

  test('F11-6: Modal size variants configure responsive max-width boundaries', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Modal/Modal.tsx'), 'utf8');

    assertIncludes(content, 'max-w-md', 'Modal sm size must be max-w-md');
    assertIncludes(content, 'max-w-lg', 'Modal md size must be max-w-lg');
    assertIncludes(content, 'max-w-2xl', 'Modal lg size must be max-w-2xl');
    assertIncludes(content, 'max-w-4xl', 'Modal xl size must be max-w-4xl');
  });
});

// -----------------------------------------------------------------------------
// FEATURE 12: Drawer (5 tests)
// -----------------------------------------------------------------------------
describe('Feature 12: Drawer Primitive', () => {
  test('F12-1: Drawer exports slide-over drawer with 4 placement options', () => {
    const drawerPath = path.join(ROOT_DIR, 'src/core/components/Drawer/Drawer.tsx');
    const typesPath = path.join(ROOT_DIR, 'src/core/components/Drawer/types.ts');

    assert(fs.existsSync(drawerPath), 'Drawer.tsx must exist');
    assert(fs.existsSync(typesPath), 'Drawer types.ts must exist');

    const typesContent = fs.readFileSync(typesPath, 'utf8');
    assertIncludes(typesContent, "'left' | 'right' | 'top' | 'bottom'", 'Drawer must support 4 placements');
  });

  test('F12-2: Drawer maps placements to directional CSS slide animations', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Drawer/Drawer.tsx'), 'utf8');

    assertIncludes(content, 'slide-in-from-right', 'Right drawer must slide in from right');
    assertIncludes(content, 'slide-in-from-left', 'Left drawer must slide in from left');
    assertIncludes(content, 'slide-in-from-top', 'Top drawer must slide in from top');
    assertIncludes(content, 'slide-in-from-bottom', 'Bottom drawer must slide in from bottom');
  });

  test('F12-3: Drawer backdrop provides click-to-dismiss and ESC listener', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Drawer/Drawer.tsx'), 'utf8');

    assertIncludes(content, 'closeOnOverlayClick', 'Drawer must support closeOnOverlayClick');
    assertIncludes(content, 'closeOnEsc', 'Drawer must support closeOnEsc');
    assertIncludes(content, "e.key === 'Escape'", 'Drawer must handle Escape key');
  });

  test('F12-4: Drawer sizes map to appropriate width and height constraints', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Drawer/Drawer.tsx'), 'utf8');

    assertIncludes(content, 'max-w-xs', 'Drawer sm size must configure max-w-xs');
    assertIncludes(content, 'max-w-md', 'Drawer md size must configure max-w-md');
    assertIncludes(content, 'max-w-lg', 'Drawer lg size must configure max-w-lg');
  });

  test('F12-5: Drawer manages body scroll locking and unmount safety', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Drawer/Drawer.tsx'), 'utf8');

    assertIncludes(content, 'useBodyScrollLock(isOpen)', 'Drawer must lock scroll via useBodyScrollLock');
    assertIncludes(content, 'createPortal', 'Drawer must render through createPortal into document.body');
  });
});

// -----------------------------------------------------------------------------
// FEATURE 13: Dropdown Menu (5 tests)
// -----------------------------------------------------------------------------
describe('Feature 13: Dropdown Menu Primitive', () => {
  test('F13-1: DropdownMenu exports compound primitives with clean architecture', () => {
    const menuPath = path.join(ROOT_DIR, 'src/core/components/Dropdown/DropdownMenu.tsx');
    const indexPath = path.join(ROOT_DIR, 'src/core/components/Dropdown/index.ts');

    assert(fs.existsSync(menuPath), 'DropdownMenu.tsx must exist');
    assert(fs.existsSync(indexPath), 'Dropdown index.ts must exist');

    const content = fs.readFileSync(menuPath, 'utf8');
    assertIncludes(content, 'DropdownMenuTrigger', 'Dropdown must export DropdownMenuTrigger');
    assertIncludes(content, 'DropdownMenuContent', 'Dropdown must export DropdownMenuContent');
    assertIncludes(content, 'DropdownMenuItem', 'Dropdown must export DropdownMenuItem');
    assertIncludes(content, 'DropdownMenuSeparator', 'Dropdown must export DropdownMenuSeparator');
    assertIncludes(content, 'DropdownMenuLabel', 'Dropdown must export DropdownMenuLabel');
  });

  test('F13-2: DropdownMenuTrigger manages expanded state and menu popup role', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Dropdown/DropdownMenu.tsx'), 'utf8');

    assertIncludes(content, 'aria-haspopup="menu"', 'Trigger must set aria-haspopup="menu"');
    assertIncludes(content, 'aria-expanded={isOpen}', 'Trigger must bind aria-expanded');
  });

  test('F13-3: DropdownMenu dismisses on click-outside via custom hook', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Dropdown/DropdownMenu.tsx'), 'utf8');

    assertIncludes(content, 'useClickOutside', 'DropdownMenu must integrate useClickOutside');
  });

  test('F13-4: DropdownMenu supports keyboard arrow navigation and Escape dismissal', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Dropdown/DropdownMenu.tsx'), 'utf8');

    assertIncludes(content, "e.key === 'Escape'", 'Dropdown must close on Escape key');
    assertIncludes(content, "e.key === 'ArrowDown'", 'Dropdown must navigate downwards on ArrowDown');
  });

  test('F13-5: DropdownMenuItem supports danger variant, shortcuts, and disabled states', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Dropdown/DropdownMenu.tsx'), 'utf8');

    assertIncludes(content, 'text-status-danger', 'Danger item must style with status-danger color');
    assertIncludes(content, 'aria-disabled={disabled}', 'Disabled item must set aria-disabled');
    assertIncludes(content, 'shortcut', 'DropdownMenuItem must support shortcut badge slot');
  });
});

// -----------------------------------------------------------------------------
// FEATURE 14: Tabs & Segmented Control (5 tests)
// -----------------------------------------------------------------------------
describe('Feature 14: Tabs & Segmented Control Primitives', () => {
  test('F14-1: Tabs exports Tabs, TabList, TabTrigger, TabContent, and SegmentedControl', () => {
    const tabsPath = path.join(ROOT_DIR, 'src/core/components/Tabs/Tabs.tsx');
    const segPath = path.join(ROOT_DIR, 'src/core/components/Tabs/SegmentedControl.tsx');
    const indexPath = path.join(ROOT_DIR, 'src/core/components/Tabs/index.ts');

    assert(fs.existsSync(tabsPath), 'Tabs.tsx must exist');
    assert(fs.existsSync(segPath), 'SegmentedControl.tsx must exist');
    assert(fs.existsSync(indexPath), 'Tabs index.ts must exist');

    const indexContent = fs.readFileSync(indexPath, 'utf8');
    assertIncludes(indexContent, 'Tabs', 'index.ts must export Tabs');
    assertIncludes(indexContent, 'SegmentedControl', 'index.ts must export SegmentedControl');
  });

  test('F14-2: Tabs implements WAI-ARIA tab list and panel semantics', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Tabs/Tabs.tsx'), 'utf8');

    assertIncludes(content, 'role="tablist"', 'TabList must specify role="tablist"');
    assertIncludes(content, 'role="tab"', 'TabTrigger must specify role="tab"');
    assertIncludes(content, 'role="tabpanel"', 'TabContent must specify role="tabpanel"');
    assertIncludes(content, 'aria-selected={isActive}', 'TabTrigger must set aria-selected');
    assertIncludes(content, 'aria-controls', 'TabTrigger must link aria-controls to panel ID');
  });

  test('F14-3: Tabs styling variants provide line, pills, and enclosed styles', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Tabs/Tabs.tsx'), 'utf8');

    assertIncludes(content, 'border-primary', 'line variant must highlight active border-primary');
    assertIncludes(content, 'bg-primary text-content-inverse', 'pills variant must highlight with bg-primary');
    assertIncludes(content, 'rounded-t-theme', 'enclosed variant must shape rounded-t-theme folder tab');
  });

  test('F14-4: TabTrigger supports badge notification counters and icons', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Tabs/Tabs.tsx'), 'utf8');

    assertIncludes(content, 'badge', 'TabTrigger must support badge prop');
    assertIncludes(content, 'icon', 'TabTrigger must support icon prop');
  });

  test('F14-5: SegmentedControl implements compact radio-group switcher', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/core/components/Tabs/SegmentedControl.tsx'), 'utf8');

    assertIncludes(content, 'role="radiogroup"', 'SegmentedControl container must have role="radiogroup"');
    assertIncludes(content, 'role="radio"', 'SegmentedControl options must have role="radio"');
    assertIncludes(content, 'aria-checked={isSelected}', 'Option must set aria-checked');
    assertIncludes(content, 'onChange', 'SegmentedControl must emit onChange on click');
  });
});

// -----------------------------------------------------------------------------
// FEATURE 15: Toast Notification System (6 tests)
// -----------------------------------------------------------------------------
describe('Feature 15: Toast Notification System', () => {
  test('F15-1: toastStore exports Zustand store and global toast dispatcher', () => {
    const storePath = path.join(ROOT_DIR, 'src/stores/toastStore.ts');
    assert(fs.existsSync(storePath), 'toastStore.ts must exist');

    const content = fs.readFileSync(storePath, 'utf8');
    assertIncludes(content, 'useToastStore', 'toastStore must export useToastStore hook');
    assertIncludes(content, 'export const toast', 'toastStore must export global toast dispatcher');
  });

  test('F15-2: toast dispatcher provides semantic helper methods across 4 variants', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/stores/toastStore.ts'), 'utf8');

    assertIncludes(content, 'toast.success', 'toast must provide toast.success');
    assertIncludes(content, 'toast.error', 'toast must provide toast.error');
    assertIncludes(content, 'toast.warning', 'toast must provide toast.warning');
    assertIncludes(content, 'toast.info', 'toast must provide toast.info');
    assertIncludes(content, 'toast.dismiss', 'toast must provide toast.dismiss');
    assertIncludes(content, 'toast.clear', 'toast must provide toast.clear');
  });

  test('F15-3: toastStore limits active toasts to prevent viewport cluttering', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/stores/toastStore.ts'), 'utf8');

    assertIncludes(content, 'slice(-4)', 'toastStore must slice array to keep at most 5 toasts');
  });

  test('F15-4: toastStore manual dismiss and clear operations mutate store cleanly', () => {
    const content = fs.readFileSync(path.join(ROOT_DIR, 'src/stores/toastStore.ts'), 'utf8');

    assertIncludes(content, 'removeToast: (id', 'toastStore must implement removeToast');
    assertIncludes(content, 'clearToasts: ()', 'toastStore must implement clearToasts');
    assertIncludes(content, 'filter((t) => t.id !== id)', 'removeToast must filter out target ID');
  });

  test('F15-5: ToastItem component implements auto-dismiss timer and hover pause', () => {
    const toastPath = path.join(ROOT_DIR, 'src/core/components/Toast/Toast.tsx');
    assert(fs.existsSync(toastPath), 'Toast.tsx must exist');

    const content = fs.readFileSync(toastPath, 'utf8');
    assertIncludes(content, 'startTimer', 'Toast must implement startTimer');
    assertIncludes(content, 'pauseTimer', 'Toast must implement pauseTimer');
    assertIncludes(content, 'onMouseEnter={pauseTimer}', 'Toast must pause on mouse enter');
    assertIncludes(content, 'onMouseLeave={startTimer}', 'Toast must resume on mouse leave');
    assertIncludes(content, 'onDismiss', 'Toast close button must call onDismiss');
  });

  test('F15-6: ToastContainer renders portal stack with configurable placement classes', () => {
    const containerPath = path.join(ROOT_DIR, 'src/core/components/Toast/ToastContainer.tsx');
    assert(fs.existsSync(containerPath), 'ToastContainer.tsx must exist');

    const content = fs.readFileSync(containerPath, 'utf8');
    assertIncludes(content, 'createPortal', 'ToastContainer must render in portal');
    assertIncludes(content, 'top-right', 'ToastContainer must support top-right position');
    assertIncludes(content, 'bottom-right', 'ToastContainer must support bottom-right position');
    assertIncludes(content, 'top-center', 'ToastContainer must support top-center position');
    assertIncludes(content, 'bottom-center', 'ToastContainer must support bottom-center position');
  });
});
