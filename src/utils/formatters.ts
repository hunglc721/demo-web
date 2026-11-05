/**
 * Formats a number to Vietnamese Dong currency string (e.g., 150.000 ₫)
 */
export function formatCurrencyVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

/**
 * Formats a date string, timestamp, or Date object into a localized Vietnamese format (e.g., "14:30 05/11/2026").
 * Gracefully handles invalid, null, undefined, or empty date inputs by returning a fallback placeholder ('—')
 * without throwing RangeError.
 */
export function formatDateVN(
  dateInput?: string | number | Date | null,
  fallback: string = '—'
): string {
  if (!dateInput && dateInput !== 0) {
    return fallback;
  }
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) {
    return fallback;
  }
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Generates an SEO-friendly Vietnamese slug from string
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}
