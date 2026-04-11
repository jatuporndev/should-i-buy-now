/**
 * Mobile stacked cards: only the first ticker auto-loads. More back-to-back
 * Yahoo chart calls often return 429 Too Many Requests (IP / proxy limits).
 * Desktop discover loads one symbol at a time via the picker.
 */
export const WATCHLIST_MOBILE_AUTO_FETCH_COUNT = 1

/** Default tickers when `VITE_WATCHLIST_CSV_URL` is unset (Yahoo Finance symbols). */
export const DEFAULT_WATCHLIST_SYMBOLS = [
  'AMZN',
  'META',
  'RKLB',
  'EOSE',
] as const
