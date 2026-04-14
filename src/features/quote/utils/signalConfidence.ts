import type { Signal, SignalBreakdown } from '@/features/quote/types'

export type SignalConfidence = {
  /** 0–100 for the strength meter */
  strength: number
  shortLabel: string
}

/**
 * Display-only heuristic: stronger when trend and badge align without gates.
 */
export function signalConfidence(
  breakdown: SignalBreakdown,
  signal: Signal,
): SignalConfidence {
  if (breakdown.status === 'need_history') {
    return { strength: 22, shortLabel: 'Incomplete data' }
  }

  if (signal === 'hold' && breakdown.holdFilter) {
    return { strength: 54, shortLabel: 'Filters active' }
  }

  if (breakdown.maTrend === 'sideways') {
    return { strength: 46, shortLabel: 'Mixed structure' }
  }

  if (signal === 'buy') {
    return { strength: 86, shortLabel: 'Uptrend aligned' }
  }

  if (signal === 'sell') {
    return { strength: 86, shortLabel: 'Downtrend aligned' }
  }

  return { strength: 58, shortLabel: 'Neutral' }
}
