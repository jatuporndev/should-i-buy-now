import { computeSignal } from '@/features/quote/services/signal'
import type { StockQuote } from '@/features/quote/types'

type YahooChartJson = {
  chart?: {
    result?: Array<{
      meta?: {
        symbol?: string
        longName?: string
        shortName?: string
        currency?: string
        regularMarketPrice?: number
        chartPreviousClose?: number
        previousClose?: number
      }
      timestamp?: number[]
      indicators?: {
        quote?: Array<{
          close?: Array<number | null>
          volume?: Array<number | null>
        }>
      }
    }>
    error?: unknown
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/**
 * Yahoo often returns 429 when too many requests share one IP (Vercel, dev reloads).
 * Retry with backoff; respect Retry-After when present.
 */
async function fetchChartResponse(path: string): Promise<Response> {
  const url = `/api/yahoo${path}`
  const maxAttempts = 3
  let last: Response | null = null

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    last = await fetch(url)
    if (last.ok) return last
    if (last.status !== 429 && last.status !== 503) return last

    if (attempt < maxAttempts - 1) {
      const ra = last.headers.get('Retry-After')
      let delayMs = 800 * Math.pow(2, attempt)
      if (ra) {
        const sec = Number.parseInt(ra, 10)
        if (!Number.isNaN(sec) && sec > 0) {
          delayMs = Math.max(delayMs, sec * 1000)
        }
      }
      delayMs = Math.min(delayMs, 12_000)
      await sleep(delayMs)
    }
  }

  return last!
}

/** Same symbol requested while a fetch is in flight (e.g. React Strict Mode) — share one upstream call. */
const inFlightBySymbol = new Map<string, Promise<StockQuote>>()

/** Keeps closes, timestamps, and volumes aligned by trading day (skip rows with invalid close). */
function parseClosesAndVolumes(raw: YahooChartJson): {
  closes: number[]
  timestamps: number[]
  volumes: number[] | undefined
} {
  const row = raw.chart?.result?.[0]
  const quote = row?.indicators?.quote?.[0]
  const wall = row?.timestamp
  const close = quote?.close
  const volume = quote?.volume
  if (!close?.length) return { closes: [], timestamps: [], volumes: undefined }

  const closes: number[] = []
  const timestamps: number[] = []
  const vols: number[] = []

  for (let i = 0; i < close.length; i++) {
    const c = close[i]
    if (typeof c !== 'number' || Number.isNaN(c)) continue
    closes.push(c)
    const t = wall?.[i]
    timestamps.push(
      typeof t === 'number' && Number.isFinite(t) ? t : Number.NaN,
    )
    const vv = volume?.[i]
    const v =
      typeof vv === 'number' && !Number.isNaN(vv) && vv >= 0 ? vv : Number.NaN
    vols.push(v)
  }

  return { closes, timestamps, volumes: volume ? vols : undefined }
}

async function fetchStockQuoteOnce(symbolUpper: string): Promise<StockQuote> {
  const encoded = encodeURIComponent(symbolUpper)
  const path = `/v8/finance/chart/${encoded}?range=2y&interval=1d`
  const r = await fetchChartResponse(path)

  if (r.status === 429) {
    throw new Error(
      'Yahoo rate limit (429). Wait a few seconds and try again.',
    )
  }
  if (!r.ok) {
    throw new Error(`Quote request failed (${r.status})`)
  }

  const text = await r.text()

  const json = JSON.parse(text) as YahooChartJson
  if (json.chart?.error || !json.chart?.result?.[0]) {
    throw new Error('Unexpected Yahoo Finance response')
  }

  const row = json.chart.result[0]
  const meta = row.meta
  const { closes, timestamps, volumes } = parseClosesAndVolumes(json)

  const price =
    meta?.regularMarketPrice ??
    (closes.length ? closes[closes.length - 1] : NaN)

  const priorFromSeries =
    closes.length > 1 ? closes[closes.length - 2]! : Number.NaN

  let prev = Number.NaN
  const metaPrev = meta?.previousClose
  if (
    typeof metaPrev === 'number' &&
    Number.isFinite(metaPrev) &&
    metaPrev !== 0
  ) {
    prev = metaPrev
  } else if (Number.isFinite(priorFromSeries) && priorFromSeries !== 0) {
    prev = priorFromSeries
  } else {
    const chartPrev = meta?.chartPreviousClose
    if (
      typeof chartPrev === 'number' &&
      Number.isFinite(chartPrev) &&
      chartPrev !== 0
    ) {
      prev = chartPrev
    }
  }

  if (!Number.isFinite(price)) throw new Error('Could not read current price')

  const changePercent =
    Number.isFinite(prev) && prev !== 0 ? ((price - prev) / prev) * 100 : 0

  const { signal, detail, breakdown } = computeSignal(closes, volumes)

  return {
    symbol: meta?.symbol ?? symbolUpper,
    name: meta?.longName ?? meta?.shortName ?? symbolUpper,
    currency: meta?.currency ?? 'USD',
    price,
    previousClose: Number.isFinite(prev) ? prev : price,
    changePercent,
    closes,
    closeTimestamps: timestamps,
    signal,
    signalDetail: detail,
    signalBreakdown: breakdown,
  }
}

export async function fetchStockQuote(symbol: string): Promise<StockQuote> {
  const upper = symbol.trim().toUpperCase()
  const existing = inFlightBySymbol.get(upper)
  if (existing) return existing

  const p = fetchStockQuoteOnce(upper).finally(() => {
    inFlightBySymbol.delete(upper)
  })
  inFlightBySymbol.set(upper, p)
  return p
}
