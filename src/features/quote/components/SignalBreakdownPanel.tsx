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
    return 'Below normal — not enough conviction to back a Buy'
  }
  if (v === 'ok') {
    return 'Healthy — participation supports the recommendation'
  }
  return 'Not available (missing or unreliable in this feed)'
}

function trendLabel(t: Extract<SignalBreakdown, { status: 'ok' }>['maTrend']) {
  if (t === 'uptrend') {
    return 'Favors buying (price above rising 50d & 200d averages)'
  }
  if (t === 'downtrend') {
    return 'Favors selling (price below falling 50d & 200d averages)'
  }
  return 'No clear direction — wait before acting'
}

export function SignalBreakdownPanel({ breakdown, currency }: Props) {
  if (breakdown.status === 'need_history') {
    return (
      <div className="signal-breakdown" role="region" aria-label="Signal inputs">
        <h3 className="signal-breakdown__title">Why this recommendation</h3>
        <p className="signal-breakdown__horizon">Long-term view only.</p>
        <p className="signal-breakdown__note">
          Not enough data to recommend yet — need at least 200 trading days of
          closes for the 200-day average; this feed has{' '}
          {breakdown.tradingDaysAvailable} usable day(s) so far.
        </p>
      </div>
    )
  }

  const { lastClose, sma50, sma200, rsi14, volume, maTrend, holdFilter } =
    breakdown

  return (
    <div className="signal-breakdown" role="region" aria-label="Signal inputs">
      <h3 className="signal-breakdown__title">Why this recommendation</h3>
      <p className="signal-breakdown__horizon">
        Based on the daily 50- & 200-day trend model — a long-term view, not a
        short-term trade signal.
      </p>
      <p className="signal-breakdown__lede muted">
        These are the numbers behind the recommendation — drawn from the same
        daily series used by the model.
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
            <dt>Why Hold instead</dt>
            <dd>{holdFilter}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  )
}
