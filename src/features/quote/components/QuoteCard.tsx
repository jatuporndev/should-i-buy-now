import { useId, useState } from 'react'
import { LongTermDashboardChart } from '@/features/quote/components/LongTermDashboardChart'
import { SignalBreakdownPanel } from '@/features/quote/components/SignalBreakdownPanel'
import { SignalBadge } from '@/features/quote/components/SignalBadge'
import type { SignalBreakdown, StockQuote } from '@/features/quote/types'
import { quickSignalSummary } from '@/features/quote/utils/quickSignalSummary'
import { signalConfidence } from '@/features/quote/utils/signalConfidence'
import { formatLastUpdatedIct, formatMoney, formatPct } from '@/shared/utils/format'
import { priceChangeClassFromPercent } from '@/shared/utils/quoteDisplay'

type Props = {
  quote: StockQuote
  onRefresh: () => void
  /** When false, chart and narrative start collapsed. */
  defaultDetailsOpen?: boolean
  /** Symbol shown in app top bar; hide duplicate in card header. */
  contextHeader?: boolean
  /** Insights column + chart split (dashboard layout). */
  workspaceLayout?: boolean
}

const CTA_LABEL: Record<StockQuote['signal'], string> = {
  buy: 'Buy',
  hold: 'Hold',
  sell: 'Sell',
}

const RSI_HIGH = 72
const RSI_LOW = 28

function WorkspaceStatusBadges({ breakdown }: { breakdown: SignalBreakdown }) {
  if (breakdown.status !== 'ok') return null

  const { maTrend, rsi14, volume } = breakdown
  const rsiVal = rsi14 != null ? Math.round(rsi14) : null
  const rsiStretched = rsiVal != null && (rsiVal >= RSI_HIGH || rsiVal <= RSI_LOW)

  let trendLabel = 'Mixed / Sideways'
  let trendMod = 'dashboard-badge--amber'
  if (maTrend === 'uptrend') {
    trendLabel = 'Uptrend'
    trendMod = 'dashboard-badge--green'
  } else if (maTrend === 'downtrend') {
    trendLabel = 'Downtrend'
    trendMod = 'dashboard-badge--red'
  }

  const rsiLabel = rsiStretched ? 'RSI Stretched' : 'RSI Range'
  const rsiMod = rsiStretched ? 'dashboard-badge--red' : 'dashboard-badge--muted'

  let volLabel = 'Volume Healthy'
  let volMod = 'dashboard-badge--green'
  if (volume === 'weak') {
    volLabel = 'Volume Weak'
    volMod = 'dashboard-badge--amber'
  } else if (volume === 'unavailable') {
    volLabel = 'Volume N/A'
    volMod = 'dashboard-badge--muted'
  }

  return (
    <div className="dashboard-badges" aria-label="Market status">
      <span className={['dashboard-badge', trendMod].join(' ')}>{trendLabel}</span>
      <span className={['dashboard-badge', rsiMod].join(' ')}>{rsiLabel}</span>
      <span className={['dashboard-badge', volMod].join(' ')}>{volLabel}</span>
    </div>
  )
}

export function QuoteCard({
  quote,
  onRefresh,
  defaultDetailsOpen = true,
  contextHeader = false,
  workspaceLayout = false,
}: Props) {
  const detailsId = useId()
  const [detailsOpen, setDetailsOpen] = useState(defaultDetailsOpen)
  const changeClass = priceChangeClassFromPercent(quote.changePercent)
  const confidence = signalConfidence(quote.signalBreakdown, quote.signal)
  const summaryLines = quickSignalSummary(quote.signalBreakdown)

  const rsiValForAside =
    quote.signalBreakdown.status === 'ok' && quote.signalBreakdown.rsi14 != null
      ? Math.round(quote.signalBreakdown.rsi14)
      : null

  const disclaimerText =
    'Long-term heuristic (50- & 200-day MAs, RSI, volume on daily closes). Not advice — confirm live prices with your broker.'

  const chartBlock = (
    <div className="analysis-card analysis-card--chart analysis-card--dense dashboard-chart-card">
      <h3 className="analysis-card__title sr-only">Technical chart</h3>
      <p className="analysis-card__lede analysis-card__lede--dense muted">
        Daily closes · 50/200 SMA · RSI(14) vs gates 72 / 28
      </p>
      <LongTermDashboardChart
        closes={quote.closes}
        closeTimestamps={quote.closeTimestamps}
        currency={quote.currency}
      />
    </div>
  )

  const disclaimer = (
    <p className="disclaimer disclaimer--dense muted">{disclaimerText}</p>
  )

  if (workspaceLayout) {
    const bd = quote.signalBreakdown
    const statOk = bd.status === 'ok'

    return (
      <div className="quote-card-body quote-card-body--dense quote-card-body--workspace">
        <header className="quote-card-header quote-card-header--dense dashboard-card-header">
          <div className="quote-card-header__row">
            <div className="quote-row-top__meta">
              {contextHeader ? (
                <span className="sr-only">{quote.symbol}</span>
              ) : (
                <span className="symbol">{quote.symbol}</span>
              )}
              {quote.lastUpdatedAt != null && (
                <span className="quote-card-header__updated">
                  <span className="quote-card-header__updated-label muted">
                    Last update
                  </span>
                  <time
                    className="quote-card-header__time muted"
                    dateTime={new Date(quote.lastUpdatedAt).toISOString()}
                  >
                    {formatLastUpdatedIct(quote.lastUpdatedAt)}
                  </time>
                </span>
              )}
            </div>
            <button
              type="button"
              className="btn btn-primary btn-compact quote-card-top__update-btn"
              onClick={onRefresh}
              aria-label={`Update quote for ${quote.symbol}`}
            >
              Update
            </button>
          </div>
        </header>

        <div className="quote-dashboard">
          <div className="quote-dashboard__lead">
            <div className="dashboard-hero">
              <div className="dashboard-hero__head">
                <span className="dashboard-hero__ticker symbol">{quote.symbol}</span>
                <p className="dashboard-hero__name">{quote.name}</p>
              </div>
              <div className="dashboard-hero__price-row">
                <span className="dashboard-hero__price">
                  {formatMoney(quote.price, quote.currency)}
                </span>
                <span className={`dashboard-hero__chg price-change ${changeClass}`}>
                  {formatPct(quote.changePercent)}
                </span>
              </div>
            </div>

            <WorkspaceStatusBadges breakdown={quote.signalBreakdown} />
          </div>

          <aside className="quote-dashboard__aside" aria-label="Recommendation and stats">
            <div className="dashboard-rec-card">
              <p className="dashboard-rec-card__eyebrow">Recommendation</p>
              <p className={`dashboard-rec-card__stance dashboard-rec-card__stance--${quote.signal}`}>
                {CTA_LABEL[quote.signal]}
              </p>
              <p
                className="dashboard-rec-card__confidence muted"
                title={`${confidence.shortLabel} — heuristic strength for this snapshot`}
              >
                {confidence.strength}% · {confidence.shortLabel}
              </p>
              <div
                className="dashboard-rec-card__ctas"
                role="group"
                aria-label={`Model stance: ${CTA_LABEL[quote.signal]}`}
              >
                {(['buy', 'hold', 'sell'] as const).map((s) => (
                  <span
                    key={s}
                    className={[
                      'dashboard-rec-cta',
                      `dashboard-rec-cta--${s}`,
                      quote.signal === s ? 'dashboard-rec-cta--active' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {CTA_LABEL[s]}
                  </span>
                ))}
              </div>
            </div>

            {statOk ? (
              <div className="dashboard-stat-grid" aria-label="Price and moving averages">
                <div className="dashboard-stat">
                  <span className="dashboard-stat__k">Last price</span>
                  <span className="dashboard-stat__v">
                    {formatMoney(bd.lastClose, quote.currency)}
                  </span>
                </div>
                <div className="dashboard-stat">
                  <span className="dashboard-stat__k">SMA 50</span>
                  <span className="dashboard-stat__v">
                    {formatMoney(bd.sma50, quote.currency)}
                  </span>
                </div>
                <div className="dashboard-stat">
                  <span className="dashboard-stat__k">SMA 200</span>
                  <span className="dashboard-stat__v">
                    {formatMoney(bd.sma200, quote.currency)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="dashboard-stat-grid dashboard-stat-grid--warn muted" role="note">
                Insufficient history for SMA grid.
              </div>
            )}

            {statOk ? (
              <div
                className="rsi-widget rsi-widget--dense rsi-widget--dashboard"
                title={
                  rsiValForAside != null
                    ? `RSI(14) ${rsiValForAside}. Buys pause ≥ ${RSI_HIGH}; sells avoided ≤ ${RSI_LOW} in downtrends.`
                    : undefined
                }
              >
                <div className="rsi-widget__head">
                  <span className="rsi-widget__label">RSI(14)</span>
                  <span className="rsi-widget__num">
                    {rsiValForAside != null ? (
                      rsiValForAside
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </span>
                </div>
                <div className="rsi-widget__track" aria-hidden={rsiValForAside == null}>
                  <span
                    className="rsi-widget__gate rsi-widget__gate--low"
                    style={{ left: `${RSI_LOW}%` }}
                  />
                  <span
                    className="rsi-widget__gate rsi-widget__gate--high"
                    style={{ left: `${RSI_HIGH}%` }}
                  />
                  {rsiValForAside != null ? (
                    <span
                      className="rsi-widget__marker"
                      style={{ left: `${rsiValForAside}%` }}
                    />
                  ) : null}
                </div>
              </div>
            ) : null}

            {statOk ? (
              <div
                className={[
                  'dashboard-volume-badge',
                  bd.volume === 'ok' && 'dashboard-volume-badge--ok',
                  bd.volume === 'weak' && 'dashboard-volume-badge--weak',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {bd.volume === 'ok'
                  ? 'Volume OK'
                  : bd.volume === 'weak'
                    ? 'Volume weak vs baseline'
                    : 'Volume unavailable'}
              </div>
            ) : null}

            <div className="dashboard-model-note">
              <span className="dashboard-model-note__label">Model note</span>
              <p className="dashboard-model-note__body muted">{quote.signalDetail}</p>
            </div>
          </aside>

          <div className="quote-dashboard__chart">
            <div className="dashboard-chart-shell">
              {chartBlock}
            </div>

            <p className="dashboard-inline-disclaimer muted">{disclaimerText}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="quote-card-body quote-card-body--dense">
      <header className="quote-card-header quote-card-header--dense">
        <div className="quote-card-header__row">
          <div className="quote-row-top__meta">
            {contextHeader ? (
              <span className="sr-only">{quote.symbol}</span>
            ) : (
              <span className="symbol">{quote.symbol}</span>
            )}
            {quote.lastUpdatedAt != null && (
              <span className="quote-card-header__updated">
                <span className="quote-card-header__updated-label muted">
                  Last update
                </span>
                <time
                  className="quote-card-header__time muted"
                  dateTime={new Date(quote.lastUpdatedAt).toISOString()}
                >
                  {formatLastUpdatedIct(quote.lastUpdatedAt)}
                </time>
              </span>
            )}
          </div>
          <button
            type="button"
            className="btn btn-primary btn-compact quote-card-top__update-btn"
            onClick={onRefresh}
            aria-label={`Update quote for ${quote.symbol}`}
          >
            Update
          </button>
        </div>
        <p className="quote-card-name quote-card-name--dense">{quote.name}</p>
      </header>

      <section className="quote-dense-primary" aria-label="Quote and model snapshot">
        <div className="quote-dense-primary__price">
          <div className="quote-dense-price-line">
            <span className="quote-dense-price-val">
              {formatMoney(quote.price, quote.currency)}
            </span>
            <span className={`quote-dense-price-chg price-change ${changeClass}`}>
              {formatPct(quote.changePercent)}
            </span>
          </div>
          <p className="quote-dense-facts" aria-label="Model inputs summary">
            {summaryLines.map((line, i) => (
              <span key={`${line.label}-${line.value}`} className="quote-dense-facts__seg">
                {i > 0 ? (
                  <span className="quote-dense-facts__sep" aria-hidden="true">
                    ·
                  </span>
                ) : null}
                <span className="quote-dense-facts__k muted">{line.label}</span>{' '}
                <span
                  className={`quote-dense-facts__v quote-dense-facts__v--${line.tone}`}
                >
                  {line.value}
                </span>
              </span>
            ))}
          </p>
        </div>

        <div className="quote-dense-primary__signal">
          <div className="quote-dense-signal-top">
            <SignalBadge signal={quote.signal} emphasis />
            <span
              className="quote-dense-strength"
              title={`${confidence.shortLabel} — heuristic strength for this snapshot`}
            >
              <span className="quote-dense-strength__n">{confidence.strength}%</span>
              <span className="quote-dense-strength__s muted">
                {' '}
                · {confidence.shortLabel}
              </span>
            </span>
          </div>
          <div
            className="quote-confidence__track quote-confidence__track--dense"
            role="meter"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={confidence.strength}
            aria-label={`Signal strength ${confidence.strength} percent`}
          >
            <span
              className="quote-confidence__fill"
              style={{ width: `${confidence.strength}%` }}
            />
          </div>
          <div
            className="quote-signal-ctas quote-signal-ctas--dense"
            role="group"
            aria-label={`Model stance: ${CTA_LABEL[quote.signal]}`}
          >
            {(['buy', 'hold', 'sell'] as const).map((s) => (
              <span
                key={s}
                className={[
                  'quote-signal-cta',
                  `quote-signal-cta--${s}`,
                  quote.signal === s ? 'quote-signal-cta--active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {CTA_LABEL[s]}
              </span>
            ))}
          </div>
        </div>
      </section>

      <>
        <div className="quote-details-actions quote-details-actions--dense">
          <button
            type="button"
            className="btn btn-compact btn-details-toggle btn-details-toggle--dense"
            aria-expanded={detailsOpen}
            aria-controls={detailsId}
            onClick={() => setDetailsOpen((v) => !v)}
          >
            {detailsOpen
              ? 'Hide chart, inputs & narrative'
              : 'Show chart, inputs & narrative'}
          </button>
        </div>

        <div id={detailsId} className="quote-details quote-details--dense" hidden={!detailsOpen}>
          <SignalBreakdownPanel
            breakdown={quote.signalBreakdown}
            currency={quote.currency}
          />

          {chartBlock}

          <div className="signal-rationale signal-rationale--dense">
            <span className="signal-rationale__label">Model note</span>
            <p className="signal-copy signal-copy--dense">{quote.signalDetail}</p>
          </div>

          {disclaimer}
        </div>
      </>
    </div>
  )
}
