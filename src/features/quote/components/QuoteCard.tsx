import { useId, useState } from 'react'
import { SignalDecisionChart } from '@/features/quote/components/SignalDecisionChart'
import { SignalBreakdownPanel } from '@/features/quote/components/SignalBreakdownPanel'
import { SignalBadge } from '@/features/quote/components/SignalBadge'
import type { StockQuote } from '@/features/quote/types'
import { quickSignalSummary } from '@/features/quote/utils/quickSignalSummary'
import { signalConfidence } from '@/features/quote/utils/signalConfidence'
import { formatLastUpdatedIct, formatMoney, formatPct } from '@/shared/utils/format'
import { priceChangeClassFromPercent } from '@/shared/utils/quoteDisplay'

type Props = {
  quote: StockQuote
  onRefresh: () => void
  /** When false, chart and narrative start collapsed. */
  defaultDetailsOpen?: boolean
  /** Ticker shown in app top bar; hide duplicate in card header. */
  contextHeader?: boolean
  /** Insights column + chart split (dashboard layout). */
  workspaceLayout?: boolean
}

const CTA_LABEL: Record<StockQuote['signal'], string> = {
  buy: 'Buy',
  hold: 'Hold',
  sell: 'Sell',
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

  const chartBlock = (
    <div className="analysis-card analysis-card--chart analysis-card--dense">
      <h3 className="analysis-card__title">Chart</h3>
      <p className="analysis-card__lede analysis-card__lede--dense muted">
        Daily closes · 50/200 SMA · RSI(14) vs gates 72 / 28
      </p>
      <SignalDecisionChart
        closes={quote.closes}
        currency={quote.currency}
        signal={quote.signal}
      />
    </div>
  )

  const disclaimer = (
    <p className="disclaimer disclaimer--dense muted">
      Long-term heuristic (50- & 200-day MAs, RSI, volume on daily closes).
      Not advice — confirm live prices with your broker.
    </p>
  )

  const insightsAside = (
    <aside
      className="quote-workspace-split__aside"
      aria-label="Signal inputs and model note"
    >
      <SignalBreakdownPanel
        breakdown={quote.signalBreakdown}
        currency={quote.currency}
      />
      <div className="signal-rationale signal-rationale--dense">
        <span className="signal-rationale__label">Model note</span>
        <p className="signal-copy signal-copy--dense">{quote.signalDetail}</p>
      </div>
    </aside>
  )

  return (
    <div
      className={[
        'quote-card-body',
        'quote-card-body--dense',
        workspaceLayout && 'quote-card-body--workspace',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <header className="quote-card-header quote-card-header--dense">
        <div className="quote-card-header__row">
          <div className="quote-row-top__meta">
            {contextHeader ? (
              <span className="sr-only">{quote.symbol}</span>
            ) : (
              <span className="symbol">{quote.symbol}</span>
            )}
            {quote.lastUpdatedAt != null && (
              <span className="quote-card-header__time muted">
                <time dateTime={new Date(quote.lastUpdatedAt).toISOString()}>
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

      {workspaceLayout ? (
        <div className="quote-workspace-split">
          <div className="quote-workspace-split__main">
            <div className="quote-details-actions quote-details-actions--dense">
              <button
                type="button"
                className="btn btn-compact btn-details-toggle btn-details-toggle--dense"
                aria-expanded={detailsOpen}
                aria-controls={detailsId}
                onClick={() => setDetailsOpen((v) => !v)}
              >
                {detailsOpen ? 'Hide chart' : 'Show chart'}
              </button>
            </div>

            <div
              id={detailsId}
              className="quote-details quote-details--dense"
              hidden={!detailsOpen}
            >
              {chartBlock}
              {disclaimer}
            </div>
          </div>
          {insightsAside}
        </div>
      ) : (
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
      )}
    </div>
  )
}
