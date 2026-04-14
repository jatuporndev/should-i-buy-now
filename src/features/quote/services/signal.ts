import type { Signal, SignalBreakdown } from '@/features/quote/types'
import { rsiWilderLast } from '@/features/quote/utils/rsi'

/** Minimum daily closes for a 200-day SMA plus stable comparisons. */
const MIN_CLOSES = 200

function average(values: number[]): number {
  const sum = values.reduce((a, b) => a + b, 0)
  return sum / values.length
}

/** Average of finite values only; returns 0 when none are valid. */
function finiteAverage(values: number[]): { avg: number; count: number } {
  let sum = 0
  let count = 0
  for (const v of values) {
    if (Number.isFinite(v)) {
      sum += v
      count++
    }
  }
  return { avg: count > 0 ? sum / count : 0, count }
}

/** Recent ~1 month vs prior ~4 months of volume; null = not enough data. */
function volumeParticipation(
  volumes: number[],
): 'weak' | 'ok' | null {
  if (volumes.length < 120) return null
  const recent = finiteAverage(volumes.slice(-20))
  const baseline = finiteAverage(volumes.slice(-100, -20))
  if (recent.count < 10 || baseline.count < 40) return null
  if (baseline.avg === 0) return null
  return recent.avg < baseline.avg * 0.85 ? 'weak' : 'ok'
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
        'Not enough data to make a recommendation yet — need at least 200 trading days of history for the 200-day average.',
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
        detail: `The trend supports buying, but RSI(14) is about ${rsiRounded} — that often follows an extended rally. Wait for a better entry before buying.`,
        breakdown: {
          ...baseOk,
          holdFilter: `RSI(14) is ${rsiRounded} — wait for it to cool off before buying (pauses at ≥ 72).`,
        },
      }
    }
    if (volLevel === 'weak') {
      return {
        signal: 'hold',
        detail:
          'The trend supports buying, but recent volume is clearly below its longer-run norm — not enough conviction to recommend a buy right now.',
        breakdown: {
          ...baseOk,
          holdFilter:
            'Recent volume is too weak to confirm a buy — wait for stronger participation.',
        },
      }
    }
    const rsiBit =
      rsiRounded !== null
        ? ` RSI(14) is near ${rsiRounded}, which is healthy — not in overbought territory.`
        : ''
    const volBit =
      volLevel === 'ok'
        ? ' Volume confirms the move with participation at or above typical levels.'
        : ''
    return {
      signal: 'buy',
      detail: `Consider buying — the long-term trend is in your favor. Price is above rising 50- and 200-day averages with the 50-day leading the 200-day.${rsiBit}${volBit}`,
      breakdown: baseOk,
    }
  }

  if (bearish) {
    if (rsi !== null && rsi <= 28) {
      return {
        signal: 'hold',
        detail: `The trend points down, but RSI(14) is about ${rsiRounded} — the dip may be exhausted. Hold off on selling at this level; a bounce could be near.`,
        breakdown: {
          ...baseOk,
          holdFilter: `RSI(14) is ${rsiRounded} — too oversold to recommend selling here (pauses at ≤ 28).`,
        },
      }
    }
    const rsiBit =
      rsiRounded !== null
        ? ` RSI(14) is near ${rsiRounded} — still room to fall, not yet in oversold territory.`
        : ''
    return {
      signal: 'sell',
      detail: `Consider selling — the long-term trend has turned against this position. Price is below falling 50- and 200-day averages with the 50-day trailing the 200-day.${rsiBit}`,
      breakdown: baseOk,
    }
  }

  return {
    signal: 'hold',
    detail:
      'No clear recommendation right now — the trend is mixed or sideways. Wait for a clearer signal before acting.',
    breakdown: baseOk,
  }
}
