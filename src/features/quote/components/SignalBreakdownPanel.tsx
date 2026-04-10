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
    return 'Below longer-run norm — weak confirmation for long-term Buys'
  }
  if (v === 'ok') {
    return 'Typical or stronger vs the long-term volume baseline'
  }
  return 'Not used (missing or unreliable in this feed)'
}

function trendLabel(t: Extract<SignalBreakdown, { status: 'ok' }>['maTrend']) {
  if (t === 'uptrend') {
    return 'Long-term uptrend (price above rising 50d & 200d averages)'
  }
  if (t === 'downtrend') {
    return 'Long-term downtrend (price below falling 50d & 200d averages)'
  }
  return 'Mixed / sideways — 50d & 200d do not line up cleanly'
}

export function SignalBreakdownPanel({ breakdown, currency }: Props) {
  if (breakdown.status === 'need_history') {
    return (
      <div className="signal-breakdown" role="region" aria-label="Signal inputs">
        <h3 className="signal-breakdown__title">What drives the badge</h3>
        <p className="signal-breakdown__horizon">Long-term view only.</p>
        <p className="signal-breakdown__note">
          Need at least 200 trading days of closes for the 200-day average; this
          feed has {breakdown.tradingDaysAvailable} usable day(s) so far.
        </p>
      </div>
    )
  }

  const { lastClose, sma50, sma200, rsi14, volume, maTrend, holdFilter } =
    breakdown

  return (
    <div className="signal-breakdown" role="region" aria-label="Signal inputs">
      <h3 className="signal-breakdown__title">What drives the badge</h3>
      <p className="signal-breakdown__horizon">
        Long-term view — daily 50- & 200-day trend model (not a short-term
        trade signal).
      </p>
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
          <dt>50-day SMA</dt>
          <dd>{formatMoney(sma50, currency)}</dd>
        </div>
        <div>
          <dt>200-day SMA</dt>
          <dd>{formatMoney(sma200, currency)}</dd>
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
