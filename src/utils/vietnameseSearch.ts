/**
 * Vietnamese Accent-Insensitive Text Search Engine
 * Implements Unicode NFD decomposition, đ/Đ custom transliteration,
 * multi-term tokenization, and cross-field relevance scoring.
 */

/**
 * Normalizes Vietnamese text by stripping tones, diacritics, and converting đ/Đ to d/D.
 * Safe against null, undefined, and non-string inputs.
 */
export function normalizeVietnamese(input?: string | null): string {
  if (!input) return '';
  return input
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Strip combining diacritical marks
    .replace(/đ/g, 'd')             // Lowercase d with stroke
    .replace(/Đ/g, 'd')             // Uppercase D with stroke
    .trim();
}

/**
 * Tokenizes a search query into non-empty, normalized alphanumeric tokens.
 */
export function tokenizeQuery(query?: string | null): string[] {
  const normalized = normalizeVietnamese(query);
  if (!normalized) return [];
  return normalized.split(/\s+/).filter((token) => token.length > 0);
}

/**
 * Checks if a target string (or array of strings) satisfies a search query.
 * Matches if ALL tokens in the query are found in the target haystack (AND logic).
 */
export function matchesVietnameseSearch(
  target: string | (string | undefined | null)[] | null | undefined,
  query: string
): boolean {
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) return true;

  let haystack: string;
  if (Array.isArray(target)) {
    haystack = target.filter(Boolean).map((t) => normalizeVietnamese(t)).join(' ');
  } else {
    haystack = normalizeVietnamese(target);
  }

  if (!haystack) return false;
  return tokens.every((token) => haystack.includes(token));
}

/**
 * Calculates a relevance score for ranking search results.
 * Higher score indicates greater relevance to the user's query.
 */
export function calculateRelevanceScore(
  primaryText: string,
  secondaryTexts: (string | undefined | null)[],
  query: string
): number {
  const normQuery = normalizeVietnamese(query);
  if (!normQuery) return 0;

  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) return 0;

  const normPrimary = normalizeVietnamese(primaryText);
  const normSecondary = secondaryTexts
    .filter(Boolean)
    .map((s) => normalizeVietnamese(s))
    .join(' ');

  let score = 0;

  // 1. Exact match in primary text
  if (normPrimary === normQuery) {
    score += 150;
  } else if (normPrimary.startsWith(normQuery)) {
    score += 100;
  } else if (normPrimary.includes(normQuery)) {
    score += 60;
  }

  // 2. Token match checks in primary text
  const primaryTokenMatches = tokens.filter((t) => normPrimary.includes(t)).length;
  score += primaryTokenMatches * 20;

  // 3. Token match checks in secondary texts (SKU, Category, Tags)
  const secondaryTokenMatches = tokens.filter((t) => normSecondary.includes(t)).length;
  score += secondaryTokenMatches * 5;

  return score;
}
