/**
 * Tier 2 Boundary & Edge Case Tests: Pricing, Currency & Diacritics
 * Validates system boundary conditions, zero values, extreme inputs, and storage limits.
 */

import { describe, test } from '../runner.mjs';
import {
  assert,
  assertEqual,
  assertWithinRange,
  assertThrows
} from '../helpers/assertions.mjs';
import { createTestContext } from '../helpers/test_context.mjs';
import { formatCurrencyVND, slugify } from '../../../src/utils/formatters.ts';

describe('Tier 2 Boundaries: Currency, Diacritics & Storage Limits', () => {
  test('B01-1: formatCurrencyVND handles 0 VND gracefully', () => {
    const formatted = formatCurrencyVND(0);
    assert(formatted.includes('0'), 'Zero amount must contain 0');
    assert(formatted.includes('₫'), 'Zero amount must include currency symbol');
  });

  test('B01-2: formatCurrencyVND formats large transaction amounts (> 100,000,000 VND)', () => {
    const formatted = formatCurrencyVND(125000000);
    assert(formatted.includes('125.000.000'), `Large amount must format with dot separators: ${formatted}`);
    assert(formatted.includes('₫'), 'Must contain VND symbol');
  });

  test('B01-3: formatCurrencyVND handles negative discount amounts', () => {
    const formatted = formatCurrencyVND(-45000);
    assert(formatted.includes('-45.000') || formatted.includes('45.000'), 'Negative amount must represent 45.000');
    assert(formatted.includes('-'), 'Negative amount must retain negative sign');
  });

  test('B01-4: slugify normalizes full spectrum of Vietnamese diacritics and tones', () => {
    const complexVietnamese = 'Áo Thun Cổ Lọ Siêu Co Giãn Đỏ Mận và Xanh Rêu Phiên Bản Đặc Biệt';
    const slug = slugify(complexVietnamese);
    assertEqual(
      slug,
      'ao-thun-co-lo-sieu-co-gian-do-man-va-xanh-reu-phien-ban-dac-biet',
      'Complex Vietnamese string with tones and diacritics must be cleanly normalized into ASCII slug'
    );
  });

  test('B01-5: mock local storage enforces 5MB quota boundaries', () => {
    // Test small 10KB limit sandbox
    const { storage } = createTestContext({ quotaBytes: 10 * 1024, enforceQuota: true });

    // Under quota should succeed
    const safeData = 'a'.repeat(4000);
    storage.setItem('safe_key', safeData);
    assertEqual(storage.getItem('safe_key'), safeData, 'Data under quota should be saved');

    // Over quota must throw QuotaExceededError
    assertThrows(() => {
      const oversizedData = 'b'.repeat(10000);
      storage.setItem('huge_key', oversizedData);
    }, 'QuotaExceededError', 'Storage exceeding quota must throw QuotaExceededError');
  });
});
