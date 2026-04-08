import type { SignalBreakdown } from '@/features/quote/types'
import { formatMoney } from '@/shared/utils/format'

type Props = {
  breakdown: SignalBreakdown
  currency: string
}

function volumeLabel(
  v: Extract<SignalBreakdown, { status: 'ok' }>['volume'],
): string {
  if (v === 'weak') {
    return 'Below recent norm — weak confirmation for Buys'
  }
  if (v === 'ok') {
    return 'Typical or stronger vs the model baseline'
  }
  return 'Not used (missing or unreliable in this feed)'
}

function trendLabel(t: Extract<SignalBreakdown, { status: 'ok' }>['maTrend']) {
  if (t === 'uptrend') {
    return 'Uptrend pattern (price above rising 10d & 30d averages)'
  }
  if (t === 'downtrend') {
    return 'Downtrend pattern (price below falling 10d & 30d averages)'
  }
  return 'Mixed / sideways — averages do not line up cleanly'
}

export function SignalBreakdownPanel({ breakdown, currency }: Props) {
  if (breakdown.status === 'need_history') {
    return (
      <div className="signal-breakdown" role="region" aria-label="Signal inputs">
        <h3 className="signal-breakdown__title">What drives the badge</h3>
        <p className="signal-breakdown__note">
          Need at least 30 trading days of closes; this feed has{' '}
          {breakdown.tradingDaysAvailable} usable day(s) so far.
        </p>
      </div>
    )
  }

  const { lastClose, sma10, sma30, rsi14, volume, maTrend, holdFilter } =
    breakdown

  return (
    <div className="signal-breakdown" role="region" aria-label="Signal inputs">
      <h3 className="signal-breakdown__title">What drives the badge</h3>
      <p className="signal-breakdown__lede muted">
        Same rules as the paragraph below — numbers are from the daily series
        used for the model.
      </p>
      <dl className="signal-breakdown__list">
        <div>
          <dt>Last close (series)</dt>
          <dd>{formatMoney(lastClose, currency)}</dd>
        </div>
        <div>
          <dt>10-day SMA</dt>
          <dd>{formatMoney(sma10, currency)}</dd>
        </div>
        <div>
          <dt>30-day SMA</dt>
          <dd>{formatMoney(sma30, currency)}</dd>
        </div>
        <div>
          <dt>RSI(14)</dt>
          <dd>
            {rsi14 !== null ? (
              <>{Math.round(rsi14)}</>
            ) : (
              <span className="muted">—</span>
            )}
          </dd>
        </div>
        <div>
          <dt>Volume</dt>
          <dd>{volumeLabel(volume)}</dd>
        </div>
        <div className="signal-breakdown__full">
          <dt>MA structure</dt>
          <dd>{trendLabel(maTrend)}</dd>
        </div>
        {holdFilter ? (
          <div className="signal-breakdown__full signal-breakdown__filter">
            <dt>Why not Buy / Sell</dt>
            <dd>{holdFilter}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  )
}
