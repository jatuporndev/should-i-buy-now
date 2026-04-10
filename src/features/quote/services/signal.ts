import type { Signal, SignalBreakdown } from '@/features/quote/types'
import { rsiWilderLast } from '@/features/quote/utils/rsi'

/** Minimum daily closes for a 200-day SMA plus stable comparisons. */
const MIN_CLOSES = 200

function average(values: number[]): number {
  const sum = values.reduce((a, b) => a + b, 0)
  return sum / values.length
}

/** Recent ~1 month vs prior ~4 months of volume; null = not enough data. */
function volumeParticipation(
  volumes: number[],
): 'weak' | 'ok' | null {
  if (volumes.length < 120) return null
  const recent = average(volumes.slice(-20))
  const baseline = average(volumes.slice(-100, -20))
  if (baseline === 0) return null
  return recent < baseline * 0.85 ? 'weak' : 'ok'
}

/**
 * Long-term trend from 50- vs 200-day SMAs on daily closes, filtered by RSI(14)
 * and optional volume context. Emits buy, sell, or hold. For personal UI only.
 */
export function computeSignal(closes: number[], volumes?: number[]): {
  signal: Signal
  detail: string
  breakdown: SignalBreakdown
} {
  if (closes.length < MIN_CLOSES) {
    return {
      signal: 'hold',
      detail:
        'Need at least 200 trading days of history to compute the 200-day average for this long-term model.',
      breakdown: {
        status: 'need_history',
        tradingDaysAvailable: closes.length,
      },
    }
  }

  const price = closes[closes.length - 1]!
  const sma50 = average(closes.slice(-50))
  const sma200 = average(closes.slice(-200))
  const buffer = 0.003

  const bullish =
    price > sma50 * (1 + buffer) &&
    sma50 > sma200 * (1 + buffer) &&
    price > sma200

  const bearish =
    price < sma50 * (1 - buffer) &&
    sma50 < sma200 * (1 - buffer) &&
    price < sma200

  const rsi = rsiWilderLast(closes, 14)
  const rsiRounded = rsi !== null ? Math.round(rsi) : null
  const volLevel = volumes ? volumeParticipation(volumes) : null

  const volume: 'weak' | 'ok' | 'unavailable' = !volumes
    ? 'unavailable'
    : volLevel === 'weak'
      ? 'weak'
      : volLevel === 'ok'
        ? 'ok'
        : 'unavailable'

  const maTrend: 'uptrend' | 'downtrend' | 'sideways' = bullish
    ? 'uptrend'
    : bearish
      ? 'downtrend'
      : 'sideways'

  const baseOk = {
    status: 'ok' as const,
    lastClose: price,
    sma50,
    sma200,
    rsi14: rsi,
    volume,
    maTrend,
    holdFilter: null as string | null,
  } satisfies Extract<SignalBreakdown, { status: 'ok' }>

  if (bullish) {
    if (rsi !== null && rsi >= 72) {
      return {
        signal: 'hold',
        detail: `Long-term structure is still up (50-day above 200-day), but RSI(14) is about ${rsiRounded}, which often follows an extended rally — the model waits instead of a buy-style badge.`,
        breakdown: {
          ...baseOk,
          holdFilter: `RSI(14) is ${rsiRounded} (model pauses Buys at ≥ 72).`,
        },
      }
    }
    if (volLevel === 'weak') {
      return {
        signal: 'hold',
        detail:
          'Price sits above a rising 50- and 200-day structure, but recent volume is clearly below its longer-run norm — the model treats that as weak confirmation and stays neutral.',
        breakdown: {
          ...baseOk,
          holdFilter:
            'Recent volume is clearly below its longer-run baseline vs the model.',
        },
      }
    }
    const rsiBit =
      rsiRounded !== null
        ? ` RSI(14) is near ${rsiRounded} (not in the “overbought” cut zone used here).`
        : ''
    const volBit =
      volLevel === 'ok'
        ? ' Recent volume is in line with or above typical longer-run levels.'
        : ''
    return {
      signal: 'buy',
      detail: `Long-term uptrend: price is above rising 50- and 200-day averages, with the 50-day above the 200-day.${rsiBit}${volBit}`,
      breakdown: baseOk,
    }
  }

  if (bearish) {
    if (rsi !== null && rsi <= 28) {
      return {
        signal: 'hold',
        detail: `Long-term structure is still down (50-day below 200-day), but RSI(14) is about ${rsiRounded}, which often flags a potentially exhausted dip — the model avoids a Sell badge.`,
        breakdown: {
          ...baseOk,
          holdFilter: `RSI(14) is ${rsiRounded} (model avoids Sells at ≤ 28).`,
        },
      }
    }
    const rsiBit =
      rsiRounded !== null
        ? ` RSI(14) is near ${rsiRounded} (not deep in the “oversold” cut zone).`
        : ''
    return {
      signal: 'sell',
      detail: `Long-term downtrend: price is below falling 50- and 200-day averages, with the 50-day below the 200-day.${rsiBit}`,
      breakdown: baseOk,
    }
  }

  return {
    signal: 'hold',
    detail:
      'Price and the 50- / 200-day averages are not aligned in a clear long-term up or down pattern (mixed or sideways).',
    breakdown: baseOk,
  }
}
