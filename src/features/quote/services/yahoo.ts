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

export async function fetchAmznQuote(): Promise<StockQuote> {
  const path = '/v8/finance/chart/AMZN?range=3mo&interval=1d'
  const yahooUrl = `https://query1.finance.yahoo.com${path}`

  let text: string

  if (import.meta.env.DEV) {
    const local = await fetch(`/api/yahoo${path}`)
    if (!local.ok) throw new Error(`Quote request failed (${local.status})`)
    text = await local.text()
  } else {
    const wrapped = `https://api.allorigins.win/raw?url=${encodeURIComponent(yahooUrl)}`
    const r = await fetch(wrapped)
    if (!r.ok) throw new Error(`Quote request failed (${r.status})`)
    text = await r.text()
  }

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

  const prev =
    meta?.chartPreviousClose ??
    meta?.previousClose ??
    (closes.length > 1 ? closes[closes.length - 2] : NaN)

  if (!Number.isFinite(price)) throw new Error('Could not read current price')

  const changePercent =
    Number.isFinite(prev) && prev !== 0 ? ((price - prev) / prev) * 100 : 0

  const { signal, detail } = computeSignal(closes, volumes)

  return {
    symbol: meta?.symbol ?? 'AMZN',
    name: meta?.longName ?? meta?.shortName ?? 'Amazon.com, Inc.',
    currency: meta?.currency ?? 'USD',
    price,
    previousClose: Number.isFinite(prev) ? prev : price,
    changePercent,
    closes,
    signal,
    signalDetail: detail,
  }
}
