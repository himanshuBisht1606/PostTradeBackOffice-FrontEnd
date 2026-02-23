import dayjs from 'dayjs';

/**
 * Format monetary values using decimal(18,4) precision (matching backend).
 */
export function formatCurrency(value: number | null | undefined, currency = '₹'): string {
  if (value === null || value === undefined) return '—';
  return `${currency} ${value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })}`;
}

/**
 * Format a large number with Indian number system (lakhs, crores).
 */
export function formatAmount(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

/**
 * Format percentage values (e.g., margin %, charges %).
 */
export function formatPercent(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined) return '—';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format ISO date string to display date.
 */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  return dayjs(value).format('DD-MMM-YYYY');
}

/**
 * Format ISO datetime string to display datetime.
 */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  return dayjs(value).format('DD-MMM-YYYY HH:mm');
}

/**
 * Format quantity values (no decimals for integer quantities).
 */
export function formatQuantity(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return value.toLocaleString('en-IN');
}

/**
 * Truncate a UUID to show first 8 chars for display.
 */
export function truncateId(id: string): string {
  return id.substring(0, 8).toUpperCase();
}
