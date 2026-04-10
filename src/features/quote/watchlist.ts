/** First N symbols load one-after-another when the watchlist is ready (no parallel Yahoo calls). */
export const WATCHLIST_AUTO_FETCH_COUNT = 5

/** Default tickers when `VITE_WATCHLIST_CSV_URL` is unset (Yahoo Finance symbols). */
export const DEFAULT_WATCHLIST_SYMBOLS = [
  'AMZN',
  'META',
  'RKLB',
  'EOSE',
] as const
