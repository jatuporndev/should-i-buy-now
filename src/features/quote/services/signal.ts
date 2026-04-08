import type { Signal } from '@/features/quote/types'

function average(values: number[]): number {
  const sum = values.reduce((a, b) => a + b, 0)
  return sum / values.length
}

/** Wilder RSI for the last bar; needs period + 1 closes. */
function rsiWilderLast(closes: number[], period: number): number | null {
  if (closes.length < period + 1) return null
  const changes: number[] = []
  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1])
  }
  let avgGain = 0
  let avgLoss = 0
  for (let i = 0; i < period; i++) {
    const c = changes[i]!
    if (c > 0) avgGain += c
    else avgLoss += -c
  }
  avgGain /= period
  avgLoss /= period

  for (let i = period; i < changes.length; i++) {
    const c = changes[i]!
    const gain = c > 0 ? c : 0
    const loss = c < 0 ? -c : 0
    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period
  }

  if (avgLoss === 0) return avgGain === 0 ? 50 : 100
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

/** Recent volume vs prior 25-session baseline; null = not enough data. */
function volumeParticipation(
  volumes: number[],
): 'weak' | 'ok' | null {
  if (volumes.length < 30) return null
  const recent = average(volumes.slice(-5))
  const baseline = average(volumes.slice(-30, -5))
  if (baseline === 0) return null
  return recent < baseline * 0.85 ? 'weak' : 'ok'
}

/**
 * Trend from 10- vs 30-day SMAs, filtered by RSI(14) and optional volume context.
 * Consumed by a personal UI only; does not execute trades or provide services.
 */
export function computeSignal(
  closes: number[],
  volumes?: number[],
): { signal: Signal; detail: string } {
  if (closes.length < 30) {
    return {
      signal: 'hold',
      detail: 'Need at least 30 trading days of history to compare moving averages.',
    }
  }

  const price = closes[closes.length - 1]!
  const sma10 = average(closes.slice(-10))
  const sma30 = average(closes.slice(-30))
  const buffer = 0.002

  const bullish =
    price > sma10 * (1 + buffer) &&
    sma10 > sma30 * (1 + buffer) &&
    price > sma30

  const bearish =
    price < sma10 * (1 - buffer) &&
    sma10 < sma30 * (1 - buffer) &&
    price < sma30

  const rsi = rsiWilderLast(closes, 14)
  const rsiRounded = rsi !== null ? Math.round(rsi) : null
  const volLevel = volumes ? volumeParticipation(volumes) : null

  if (bullish) {
    if (rsi !== null && rsi >= 72) {
      return {
        signal: 'hold',
        detail: `Same MA uptrend as before, but RSI(14) is about ${rsiRounded}, which often means stretched short-term momentum — the model waits instead of a buy-style badge.`,
      }
    }
    if (volLevel === 'weak') {
      return {
        signal: 'hold',
        detail:
          'Price is above rising short- vs average moving averages, but recent volume is clearly below its prior norm — the model treats that as weak confirmation and stays neutral.',
      }
    }
    const rsiBit =
      rsiRounded !== null
        ? ` RSI(14) is near ${rsiRounded} (not in the “overbought” cut zone used here).`
        : ''
    const volBit =
      volLevel === 'ok'
        ? ' Recent volume is in line with or above typical levels.'
        : ''
    return {
      signal: 'buy',
      detail: `Price is above the 10- and 30-day averages with the short average above the longer one (uptrend).${rsiBit}${volBit}`,
    }
  }

  if (bearish) {
    if (rsi !== null && rsi <= 28) {
      return {
        signal: 'hold',
        detail: `Same MA downtrend as before, but RSI(14) is about ${rsiRounded}, which often flags a potentially exhausted dip — the model avoids a sell-style badge.`,
      }
    }
    const rsiBit =
      rsiRounded !== null
        ? ` RSI(14) is near ${rsiRounded} (not deep in the “oversold” cut zone).`
        : ''
    return {
      signal: 'sell',
      detail: `Price is below the 10- and 30-day averages with the short average below the longer one (downtrend).${rsiBit}`,
    }
  }

  return {
    signal: 'hold',
    detail:
      'Price and moving averages are not aligned in a clear up or down pattern (mixed or sideways).',
  }
}
