import { useId, useState } from 'react'
import { SignalDecisionChart } from '@/features/quote/components/SignalDecisionChart'
import { SignalBreakdownPanel } from '@/features/quote/components/SignalBreakdownPanel'
import { SignalBadge } from '@/features/quote/components/SignalBadge'
import type { StockQuote } from '@/features/quote/types'
import { formatLastUpdatedIct, formatMoney, formatPct } from '@/shared/utils/format'
import { priceChangeClassFromPercent } from '@/shared/utils/quoteDisplay'

type Props = {
  quote: StockQuote
  onRefresh: () => void
}

export function QuoteCard({ quote, onRefresh }: Props) {
  const detailsId = useId()
  const [detailsOpen, setDetailsOpen] = useState(false)
  const changeClass = priceChangeClassFromPercent(quote.changePercent)

  return (
    <div className="quote-card-body">
      <div className="quote-card-top">
        <div className="quote-row-top__meta">
          <span className="symbol">{quote.symbol}</span>
          <SignalBadge signal={quote.signal} emphasis />
        </div>
        <button
          type="button"
          className="btn btn-primary btn-compact quote-card-top__update-btn"
          onClick={onRefresh}
          aria-label={`Update quote for ${quote.symbol}`}
        >
          Update
        </button>
        <p className="quote-card-name">{quote.name}</p>
        {quote.lastUpdatedAt != null && (
          <p className="quote-card-updated muted">
            <time dateTime={new Date(quote.lastUpdatedAt).toISOString()}>
              {formatLastUpdatedIct(quote.lastUpdatedAt)}
            </time>
          </p>
        )}
      </div>

      <div className="quote-row-metrics">
        <div className="quote-row-metrics__price">
          <span className="price price--inline">
            {formatMoney(quote.price, quote.currency)}
          </span>
          <span className={`price-change ${changeClass}`}>
            {formatPct(quote.changePercent)}
          </span>
        </div>
        <button
          type="button"
          className="btn btn-compact btn-details-toggle"
          aria-expanded={detailsOpen}
          aria-controls={detailsId}
          onClick={() => setDetailsOpen((v) => !v)}
        >
          {detailsOpen ? 'Hide reasoning' : 'Why this call?'}
        </button>
      </div>

      <div
        id={detailsId}
        className="quote-details"
        hidden={!detailsOpen}
      >
        <SignalBreakdownPanel
          breakdown={quote.signalBreakdown}
          currency={quote.currency}
        />

        <SignalDecisionChart
          closes={quote.closes}
          currency={quote.currency}
          signal={quote.signal}
        />

        <div className="signal-rationale">
          <span className="signal-rationale__label">Model note</span>
          <p className="signal-copy">{quote.signalDetail}</p>
        </div>

        <p className="disclaimer muted">
          Long-term heuristic (50- & 200-day MAs, RSI, volume on daily closes).
          Not advice — confirm live prices with your broker.
        </p>
      </div>
    </div>
  )
}
