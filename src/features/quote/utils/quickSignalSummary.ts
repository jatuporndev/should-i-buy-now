import type { SignalBreakdown } from '@/features/quote/types'

export type SummaryTone = 'bull' | 'bear' | 'neutral'

export type QuickSummaryLine = {
  label: string
  value: string
  tone: SummaryTone
}

export function quickSignalSummary(
  breakdown: SignalBreakdown,
): QuickSummaryLine[] {
  if (breakdown.status === 'need_history') {
    return [
      {
        label: 'History',
        value: `${breakdown.tradingDaysAvailable} day(s) — need 200+`,
        tone: 'neutral',
      },
    ]
  }

  const { maTrend, rsi14, volume } = breakdown

  const trendLine: QuickSummaryLine =
    maTrend === 'uptrend'
      ? {
          label: 'Trend',
          value: 'Long-term uptrend',
          tone: 'bull',
        }
      : maTrend === 'downtrend'
        ? {
            label: 'Trend',
            value: 'Long-term downtrend',
            tone: 'bear',
          }
        : {
            label: 'Trend',
            value: 'Mixed / sideways',
            tone: 'neutral',
          }

  let rsiTone: SummaryTone = 'neutral'
  if (rsi14 != null) {
    if (rsi14 >= 72) rsiTone = 'bear'
    else if (rsi14 <= 28) rsiTone = 'bull'
  }

  const rsiLine: QuickSummaryLine = {
    label: 'RSI(14)',
    value:
      rsi14 != null
        ? `${Math.round(rsi14)}${rsi14 >= 72 ? ' · stretched' : rsi14 <= 28 ? ' · washed out' : ''}`
        : '—',
    tone: rsiTone,
  }

  const volLine: QuickSummaryLine =
    volume === 'weak'
      ? {
          label: 'Volume',
          value: 'Below baseline',
          tone: 'neutral',
        }
      : volume === 'ok'
        ? {
            label: 'Volume',
            value: 'Healthy vs baseline',
            tone: 'bull',
          }
        : {
            label: 'Volume',
            value: 'Unavailable',
            tone: 'neutral',
          }

  return [trendLine, rsiLine, volLine]
}
