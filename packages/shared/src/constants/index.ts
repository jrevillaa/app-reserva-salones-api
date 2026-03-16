export * from './enums';

/**
 * Common Constants
 */

export const HOLD_DURATION_HOURS = 24;
export const DEFAULT_DEPOSIT_PERCENT = 30;
export const DEFAULT_CLEANUP_BUFFER_MINUTES = 15;

export const CURRENCIES = {
  PEN: 'PEN',
  USD: 'USD',
} as const;

export const TIMEZONES = {
  LIMA: 'America/Lima',
  UTC: 'UTC',
} as const;
