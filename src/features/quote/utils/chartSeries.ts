import { rsiWilderSeries } from '@/features/quote/utils/rsi'

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
  closeTimestamps?: number[],
): {
  points: LongTermChartPoint[]
  rsi14: number[]
  yMin: number
  yMax: number
  barTimestampsSec: (number | null)[]
} | null {
  const n = closes.length
  if (n < 200) return null

  const tsAligned = closeTimestamps && closeTimestamps.length === n

  const startIdx = Math.max(199, n - maxBars)
  const rsiAll = rsiWilderSeries(closes, RSI_PERIOD)
  const points: LongTermChartPoint[] = []
  const rsi14: number[] = []
  const barTimestampsSec: (number | null)[] = []
  for (let i = startIdx; i < n; i++) {
    points.push({
      close: closes[i]!,
      sma50: mean(closes.slice(i - 49, i + 1)),
      sma200: mean(closes.slice(i - 199, i + 1)),
    })
    rsi14.push(rsiAll[i] ?? 50)
    if (tsAligned) {
      const sec = closeTimestamps![i]!
      barTimestampsSec.push(Number.isFinite(sec) ? sec : null)
    } else {
      barTimestampsSec.push(null)
    }
  }

  let yMin = Infinity
  let yMax = -Infinity
  for (const p of points) {
    yMin = Math.min(yMin, p.close, p.sma50, p.sma200)
    yMax = Math.max(yMax, p.close, p.sma50, p.sma200)
  }
  const span = yMax - yMin
  const pad = span > 0 ? span * 0.05 : Math.abs(yMin) * 0.02 || 1
  return { points, rsi14, yMin: yMin - pad, yMax: yMax + pad, barTimestampsSec }
}
