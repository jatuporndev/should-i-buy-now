/** Parse first column of CSV; optional header row Symbol / Ticker / Code. */
export function parseWatchlistCsv(text: string): string[] {
  const normalized = text.replace(/^\uFEFF/, '')
  const lines = normalized.split(/\r?\n/)
  const seen = new Set<string>()
  const out: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const rawCell = line.split(',')[0] ?? ''
    const cell = rawCell.replace(/^"|"$/g, '').trim()
    if (!cell) continue

    if (i === 0 && /^(symbol|ticker|code)$/i.test(cell)) continue

    const upper = cell.toUpperCase()
    if (!/^[A-Z0-9^.\-=]+$/.test(upper)) continue
    if (seen.has(upper)) continue
    seen.add(upper)
    out.push(upper)
  }

  return out
}

/**
 * Appends a one-off query param so browsers/CDNs don’t serve an old Google-published CSV.
 * (Sheets updates are not pushed to the app — each visit refetches the URL.)
 */
export function cacheBustedCsvUrl(csvUrl: string): string {
  const ts = String(Date.now())
  if (csvUrl.startsWith('/')) {
    return `${csvUrl}?_=${encodeURIComponent(ts)}`
  }
  try {
    const u = new URL(csvUrl)
    u.searchParams.set('_', ts)
    return u.href
  } catch {
    return `${csvUrl}${csvUrl.includes('?') ? '&' : '?'}_=${encodeURIComponent(ts)}`
  }
}

export async function fetchWatchlistSymbols(csvUrl: string): Promise<string[]> {
  const r = await fetch(cacheBustedCsvUrl(csvUrl), { cache: 'no-store' })
  if (!r.ok) throw new Error(`Watchlist request failed (${r.status})`)
  const text = await r.text()
  const symbols = parseWatchlistCsv(text)
  if (symbols.length === 0) {
    throw new Error('No valid tickers found in the watchlist CSV')
  }
  return symbols
}

/** In dev, CSV is fetched via Vite proxy to avoid browser CORS with Google. */
export function resolveWatchlistCsvUrl(): string | undefined {
  const raw = import.meta.env.VITE_WATCHLIST_CSV_URL?.trim()
  if (!raw) return undefined
  if (import.meta.env.DEV) return '/api/watchlist-csv'
  return raw
}
