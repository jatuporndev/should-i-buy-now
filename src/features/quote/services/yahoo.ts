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

/** Keeps closes and volumes aligned by trading day (skip rows with invalid close). */
function parseClosesAndVolumes(raw: YahooChartJson): {
  closes: number[]
  volumes: number[] | undefined
} {
  const quote = raw.chart?.result?.[0]?.indicators?.quote?.[0]
  const close = quote?.close
  const volume = quote?.volume
  if (!close?.length) return { closes: [], volumes: undefined }

  const closes: number[] = []
  const vols: number[] = []

  for (let i = 0; i < close.length; i++) {
    const c = close[i]
    if (typeof c !== 'number' || Number.isNaN(c)) continue
    closes.push(c)
    const vv = volume?.[i]
    const v =
      typeof vv === 'number' && !Number.isNaN(vv) && vv >= 0 ? vv : Number.NaN
    vols.push(v)
  }

  const volumes = vols.some((x) => Number.isNaN(x)) ? undefined : vols
  return { closes, volumes }
}

export async function fetchStockQuote(symbol: string): Promise<StockQuote> {
  const upper = symbol.trim().toUpperCase()
  const encoded = encodeURIComponent(upper)
  const path = `/v8/finance/chart/${encoded}?range=2y&interval=1d`
  // Dev: Vite proxy. Production (e.g. Vercel): /api/yahoo/* serverless route proxies Yahoo.
  const r = await fetch(`/api/yahoo${path}`)
  if (!r.ok) throw new Error(`Quote request failed (${r.status})`)
  const text = await r.text()

  const json = JSON.parse(text) as YahooChartJson
  if (json.chart?.error || !json.chart?.result?.[0]) {
    throw new Error('Unexpected Yahoo Finance response')
  }

  const row = json.chart.result[0]
  const meta = row.meta
  const { closes, volumes } = parseClosesAndVolumes(json)

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
    symbol: meta?.symbol ?? upper,
    name: meta?.longName ?? meta?.shortName ?? upper,
    currency: meta?.currency ?? 'USD',
    price,
    previousClose: Number.isFinite(prev) ? prev : price,
    changePercent,
    closes,
    signal,
    signalDetail: detail,
    signalBreakdown: breakdown,
  }
}
