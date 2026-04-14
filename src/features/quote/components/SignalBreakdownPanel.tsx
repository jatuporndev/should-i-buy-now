import type { SignalBreakdown } from '@/features/quote/types'
import { formatMoney } from '@/shared/utils/format'

type Props = {
  breakdown: SignalBreakdown
  currency: string
}

function volumeMeta(
  v: Extract<SignalBreakdown, { status: 'ok' }>['volume'],
): { short: string; detail: string; tone: 'bull' | 'neutral' | 'muted' } {
  if (v === 'weak') {
    return {
      short: 'Weak',
      detail:
        'Below longer-run norm — weak confirmation for long-term Buys',
      tone: 'neutral',
    }
  }
  if (v === 'ok') {
    return {
      short: 'OK',
      detail: 'Typical or stronger vs the long-term volume baseline',
      tone: 'bull',
    }
  }
  return {
    short: 'N/A',
    detail: 'Not used (missing or unreliable in this feed)',
    tone: 'muted',
  }
}

function trendMeta(t: Extract<SignalBreakdown, { status: 'ok' }>['maTrend']): {
  short: string
  detail: string
  tone: 'bull' | 'bear' | 'neutral'
} {
  if (t === 'uptrend') {
    return {
      short: 'Up',
      detail: 'Long-term uptrend (price above rising 50d & 200d averages)',
      tone: 'bull',
    }
  }
  if (t === 'downtrend') {
    return {
      short: 'Down',
      detail: 'Long-term downtrend (price below falling 50d & 200d averages)',
      tone: 'bear',
    }
  }
  return {
    short: 'Mix',
    detail: 'Mixed / sideways — 50d & 200d do not line up cleanly',
    tone: 'neutral',
  }
}

/** RSI gates match `computeSignal` / chart. */
const RSI_HIGH = 72
const RSI_LOW = 28

export function SignalBreakdownPanel({ breakdown, currency }: Props) {
  if (breakdown.status === 'need_history') {
    return (
      <div className="analysis-dense analysis-dense--warn" role="region" aria-label="Signal inputs">
        <p className="analysis-dense__warn-title">Insufficient history</p>
        <p className="analysis-dense__warn-body muted">
          Need ≥200 trading days for 200-day SMA. This feed:{' '}
          {breakdown.tradingDaysAvailable} day(s).
        </p>
      </div>
    )
  }

  const { lastClose, sma50, sma200, rsi14, volume, maTrend, holdFilter } =
    breakdown
  const vol = volumeMeta(volume)
  const tr = trendMeta(maTrend)
  const rsiVal = rsi14 != null ? Math.round(rsi14) : null

  return (
    <div className="analysis-dense" role="region" aria-label="Signal inputs">
      <div className="analysis-dense__head">
        <span className="analysis-dense__head-title">Inputs</span>
        <span className="analysis-dense__head-meta muted">
          Daily closes · same series as badge
        </span>
      </div>

      <table className="analysis-dense-table">
        <caption className="sr-only">Price level vs moving averages</caption>
        <thead>
          <tr>
            <th scope="col">Last</th>
            <th scope="col">SMA 50</th>
            <th scope="col">SMA 200</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{formatMoney(lastClose, currency)}</td>
            <td>{formatMoney(sma50, currency)}</td>
            <td>{formatMoney(sma200, currency)}</td>
          </tr>
        </tbody>
      </table>

      <div className="analysis-dense-split">
        <div
          className="rsi-widget rsi-widget--dense"
          title={
            rsiVal != null
              ? `RSI(14) ${rsiVal}. Buys pause ≥ ${RSI_HIGH}; sells avoided ≤ ${RSI_LOW} in downtrends.`
              : undefined
          }
        >
          <div className="rsi-widget__head">
            <span className="rsi-widget__label">RSI(14)</span>
            <span className="rsi-widget__num">
              {rsiVal != null ? rsiVal : <span className="muted">—</span>}
            </span>
          </div>
          <div className="rsi-widget__track" aria-hidden={rsiVal == null}>
            <span
              className="rsi-widget__gate rsi-widget__gate--low"
              style={{ left: `${RSI_LOW}%` }}
            />
            <span
              className="rsi-widget__gate rsi-widget__gate--high"
              style={{ left: `${RSI_HIGH}%` }}
            />
            {rsiVal != null ? (
              <span
                className="rsi-widget__marker"
                style={{ left: `${rsiVal}%` }}
              />
            ) : null}
          </div>
          <div className="rsi-widget__scale rsi-widget__scale--dense muted">
            <span>0</span>
            <span>{RSI_LOW}</span>
            <span>50</span>
            <span>{RSI_HIGH}</span>
            <span>100</span>
          </div>
        </div>

        <div className="analysis-dense-side">
          <div
            className={['volume-chip', 'volume-chip--dense', `volume-chip--${vol.tone}`].join(
              ' ',
            )}
            title={vol.detail}
          >
            <div className="volume-chip__row">
              <span className="volume-chip__label">Vol</span>
              <span className="volume-chip__value">{vol.short}</span>
            </div>
            <p className="volume-chip__detail muted">{vol.detail}</p>
          </div>
          <p
            className={`analysis-dense-trend analysis-dense-trend--${tr.tone}`}
            title={tr.detail}
          >
            <span className="analysis-dense-trend__k muted">MA</span>{' '}
            <span className="analysis-dense-trend__v">{tr.short}</span>
            <span className="analysis-dense-trend__d muted"> — {tr.detail}</span>
          </p>
        </div>
      </div>

      {holdFilter ? (
        <div className="analysis-dense-filter" role="note">
          <span className="analysis-dense-filter__k">Hold filter</span>
          <span className="analysis-dense-filter__v">{holdFilter}</span>
        </div>
      ) : null}
    </div>
  )
}
