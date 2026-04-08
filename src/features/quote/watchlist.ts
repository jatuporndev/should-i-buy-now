/** Default tickers shown in the app (Yahoo Finance symbols). */
export const WATCHLIST_SYMBOLS = ['AMZN', 'META', 'RKLB', 'EOSE'] as const

export type WatchlistSymbol = (typeof WATCHLIST_SYMBOLS)[number]
