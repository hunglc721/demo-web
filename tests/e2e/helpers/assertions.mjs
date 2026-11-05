/**
 * E2E Opaque-Box Assertion Library
 * Provides robust, expressive assertions with informative failure output.
 */

export class AssertionError extends Error {
  constructor(message, actual, expected) {
    super(message);
    this.name = 'AssertionError';
    this.actual = actual;
    this.expected = expected;
  }
}

function formatValue(val) {
  if (typeof val === 'string') return `"${val}"`;
  if (typeof val === 'function') return `[Function: ${val.name || 'anonymous'}]`;
  if (typeof val === 'symbol') return val.toString();
  try {
    return JSON.stringify(val);
  } catch {
    return String(val);
  }
}

export function assert(condition, message = 'Condition is not truthy') {
  if (!condition) {
    throw new AssertionError(message, condition, true);
  }
}

export function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    const msg = message || `Expected ${formatValue(actual)} to strictly equal ${formatValue(expected)}`;
    throw new AssertionError(msg, actual, expected);
  }
}

export function assertNotEqual(actual, unexpected, message) {
  if (actual === unexpected) {
    const msg = message || `Expected ${formatValue(actual)} NOT to equal ${formatValue(unexpected)}`;
    throw new AssertionError(msg, actual, unexpected);
  }
}

function deepEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false;

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const keysA = Reflect.ownKeys(a);
  const keysB = Reflect.ownKeys(b);
  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Reflect.has(b, key) || !deepEqual(a[key], b[key])) {
      return false;
    }
  }
  return true;
}

export function assertDeepEqual(actual, expected, message) {
  if (!deepEqual(actual, expected)) {
    const msg = message || `Expected deep equality:\nActual:   ${formatValue(actual)}\nExpected: ${formatValue(expected)}`;
    throw new AssertionError(msg, actual, expected);
  }
}

export function assertMatch(str, regex, message) {
  if (typeof str !== 'string' || !regex.test(str)) {
    const msg = message || `Expected ${formatValue(str)} to match regex ${regex}`;
    throw new AssertionError(msg, str, regex.toString());
  }
}

export function assertIncludes(container, item, message) {
  if (typeof container === 'string') {
    if (!container.includes(item)) {
      const msg = message || `Expected string to include ${formatValue(item)}`;
      throw new AssertionError(msg, container, item);
    }
    return;
  }
  if (Array.isArray(container)) {
    if (!container.some(el => deepEqual(el, item))) {
      const msg = message || `Expected array to contain item ${formatValue(item)}`;
      throw new AssertionError(msg, container, item);
    }
    return;
  }
  if (container instanceof Set || container instanceof Map) {
    if (!container.has(item)) {
      const msg = message || `Expected collection to contain ${formatValue(item)}`;
      throw new AssertionError(msg, container, item);
    }
    return;
  }
  throw new AssertionError(`Unsupported container type: ${typeof container}`, container, item);
}

export function assertGreaterThan(actual, threshold, message) {
  if (!(actual > threshold)) {
    const msg = message || `Expected ${actual} to be greater than ${threshold}`;
    throw new AssertionError(msg, actual, threshold);
  }
}

export function assertLessThan(actual, threshold, message) {
  if (!(actual < threshold)) {
    const msg = message || `Expected ${actual} to be less than ${threshold}`;
    throw new AssertionError(msg, actual, threshold);
  }
}

export function assertWithinRange(actual, min, max, message) {
  if (actual < min || actual > max) {
    const msg = message || `Expected ${actual} to be within [${min}, ${max}]`;
    throw new AssertionError(msg, actual, { min, max });
  }
}

export function assertThrows(fn, expectedError, message) {
  let threw = false;
  let caught = null;
  try {
    fn();
  } catch (err) {
    threw = true;
    caught = err;
  }

  if (!threw) {
    throw new AssertionError(message || 'Expected function to throw an error, but it returned normally', null, 'Error');
  }

  if (expectedError) {
    if (typeof expectedError === 'string' && !caught.message.includes(expectedError)) {
      throw new AssertionError(message || `Expected error message to contain "${expectedError}", got "${caught.message}"`, caught.message, expectedError);
    }
    if (expectedError instanceof RegExp && !expectedError.test(caught.message)) {
      throw new AssertionError(message || `Expected error message to match ${expectedError}, got "${caught.message}"`, caught.message, expectedError.toString());
    }
    if (typeof expectedError === 'function' && !(caught instanceof expectedError)) {
      throw new AssertionError(message || `Expected error to be instance of ${expectedError.name}`, caught, expectedError.name);
    }
  }
}

export async function assertRejects(promiseFn, expectedError, message) {
  let threw = false;
  let caught = null;
  try {
    await promiseFn();
  } catch (err) {
    threw = true;
    caught = err;
  }

  if (!threw) {
    throw new AssertionError(message || 'Expected async function to reject, but it resolved', null, 'Error');
  }

  if (expectedError) {
    if (typeof expectedError === 'string' && !caught.message.includes(expectedError)) {
      throw new AssertionError(message || `Expected rejection message to contain "${expectedError}", got "${caught.message}"`, caught.message, expectedError);
    }
    if (expectedError instanceof RegExp && !expectedError.test(caught.message)) {
      throw new AssertionError(message || `Expected rejection message to match ${expectedError}, got "${caught.message}"`, caught.message, expectedError.toString());
    }
  }
}

/**
 * Asserts that an object matches a contract schema.
 * schema: { [key: string]: 'string' | 'number' | 'boolean' | 'object' | 'function' | Array | ((val) => boolean) }
 */
export function assertContract(obj, schema, message = 'Contract validation failed') {
  if (typeof obj !== 'object' || obj === null) {
    throw new AssertionError(`${message}: target is not a non-null object`, obj, 'object');
  }

  for (const [key, typeDef] of Object.entries(schema)) {
    if (!(key in obj)) {
      throw new AssertionError(`${message}: missing required property "${key}"`, undefined, key);
    }
    const val = obj[key];
    if (typeof typeDef === 'string') {
      if (typeof val !== typeDef) {
        throw new AssertionError(`${message}: property "${key}" expected type "${typeDef}", got "${typeof val}"`, typeof val, typeDef);
      }
    } else if (typeof typeDef === 'function') {
      const isValid = typeDef(val);
      if (!isValid) {
        throw new AssertionError(`${message}: property "${key}" failed custom validation check`, val, typeDef.name || 'validator');
      }
    } else if (Array.isArray(typeDef)) {
      if (!typeDef.includes(val)) {
        throw new AssertionError(`${message}: property "${key}" value ${formatValue(val)} is not one of [${typeDef.map(formatValue).join(', ')}]`, val, typeDef);
      }
    }
  }
}
