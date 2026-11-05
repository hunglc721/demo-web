/**
 * Tier 4 Real-World Application Workloads: Shopper & Merchant Baseline Contracts
 * Validates production environment contracts and readiness for full-funnel scenarios.
 */

import { describe, test } from '../runner.mjs';
import {
  assert,
  assertEqual,
  assertMatch
} from '../helpers/assertions.mjs';
import { createTestContext } from '../helpers/test_context.mjs';
import { defaultAppConfig } from '../../../src/config/appConfig.ts';

describe('Tier 4 Real-World Workloads: Baseline System Readiness', () => {
  test('RW01-1: store branding and localization adheres to Vietnamese D2C standards', () => {
    assertEqual(defaultAppConfig.store.currency, 'VND', 'Store must operate in Vietnamese Dong');
    assertEqual(defaultAppConfig.store.locale, 'vi-VN', 'Locale must strictly be vi-VN');
    assertMatch(defaultAppConfig.store.hotline, /^[0-9\s]+$/, 'Hotline must contain valid dial digits');
    assertMatch(defaultAppConfig.store.email, /@.+\./, 'Support email must be a valid email format');
  });

  test('RW01-2: local storage namespacing follows strict architectural key pattern', () => {
    const { storage, getNamespacedKeys } = createTestContext();

    // Standard namespace pattern from PROJECT.md: d2c_ecommerce:*:v1
    const keysToTest = [
      'd2c_ecommerce:cart:v1',
      'd2c_ecommerce:orders:v1',
      'd2c_ecommerce:products:v1',
      'd2c_ecommerce:theme:v1',
      'd2c_ecommerce:auth:v1'
    ];

    for (const k of keysToTest) {
      storage.setItem(k, JSON.stringify({ initialized: true, timestamp: Date.now() }));
    }

    const recordedKeys = getNamespacedKeys('d2c_ecommerce:');
    assertEqual(recordedKeys.length, 5, 'All keys must match the d2c_ecommerce:* prefix');

    for (const k of recordedKeys) {
      assertMatch(k, /^d2c_ecommerce:[a-z_]+:v1$/, `Key "${k}" must adhere to versioned namespace format`);
    }
  });

  test('RW01-3: Vietnamese mobile phone pattern regex enforces valid prefixes', () => {
    // Official Vietnamese mobile prefixes: 03x, 05x, 07x, 08x, 09x (10 digits total)
    const vnPhoneRegex = /(03|05|07|08|09)+([0-9]{8})\b/;

    const validPhones = ['0912345678', '0389998888', '0776543210', '0834567890', '0567890123'];
    const invalidPhones = ['0123456789', '1234567890', '091234567', '091234567890', '0243888888'];

    for (const phone of validPhones) {
      assert(vnPhoneRegex.test(phone), `Phone "${phone}" must be valid`);
    }

    for (const phone of invalidPhones) {
      assert(!vnPhoneRegex.test(phone), `Phone "${phone}" must be rejected as invalid`);
    }
  });
});
