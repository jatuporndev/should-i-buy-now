import { rsiWilderLast } from '@/features/quote/utils/rsi'

export type LongTermChartPoint = {
  close: number
  sma50: number
  sma200: number
}

function mean(values: number[]): number {
  let s = 0
  for (const v of values) s += v
  return s / values.length
}

/**
 * Rolling 50- and 200-day series aligned with `computeSignal` (daily closes).
 * Returns the last `maxBars` trading days (or fewer if history is short), from the
 * first index where a 200-day SMA exists.
 */
const RSI_PERIOD = 14

export function buildLongTermChartPoints(
  closes: number[],
  maxBars = 260,
): {
  points: LongTermChartPoint[]
  rsi14: number[]
  yMin: number
  yMax: number
} | null {
  const n = closes.length
  if (n < 200) return null

  const startIdx = Math.max(199, n - maxBars)
  const points: LongTermChartPoint[] = []
  const rsi14: number[] = []
  for (let i = startIdx; i < n; i++) {
    points.push({
      close: closes[i]!,
      sma50: mean(closes.slice(i - 49, i + 1)),
      sma200: mean(closes.slice(i - 199, i + 1)),
    })
    const r = rsiWilderLast(closes.slice(0, i + 1), RSI_PERIOD)
    rsi14.push(r ?? 50)
  }

  let yMin = Infinity
  let yMax = -Infinity
  for (const p of points) {
    yMin = Math.min(yMin, p.close, p.sma50, p.sma200)
    yMax = Math.max(yMax, p.close, p.sma50, p.sma200)
  }
  const span = yMax - yMin
  const pad = span > 0 ? span * 0.05 : Math.abs(yMin) * 0.02 || 1
  return { points, rsi14, yMin: yMin - pad, yMax: yMax + pad }
}
