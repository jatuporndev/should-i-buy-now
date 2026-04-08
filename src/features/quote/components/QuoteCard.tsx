import { useId, useState } from 'react'
import { SignalBreakdownPanel } from '@/features/quote/components/SignalBreakdownPanel'
import { SignalBadge } from '@/features/quote/components/SignalBadge'
import type { StockQuote } from '@/features/quote/types'
import { formatMoney, formatPct } from '@/shared/utils/format'
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
    <>
      <div className="quote-summary">
        <div className="quote-summary__primary">
          <span className="symbol">{quote.symbol}</span>
          <SignalBadge signal={quote.signal} />
          <span className="quote-summary__company" title={quote.name}>
            {quote.name}
          </span>
        </div>
        <div className="quote-summary__metrics">
          <span className="price price--summary">
            {formatMoney(quote.price, quote.currency)}
          </span>
          <span className={`price-change ${changeClass}`}>
            {formatPct(quote.changePercent)}{' '}
            <span className="muted">1d</span>
          </span>
        </div>
        <div className="quote-summary__actions">
          <button
            type="button"
            className="btn btn-compact"
            onClick={onRefresh}
          >
            Refresh
          </button>
          <button
            type="button"
            className="btn btn-compact btn-details-toggle"
            aria-expanded={detailsOpen}
            aria-controls={detailsId}
            onClick={() => setDetailsOpen((v) => !v)}
          >
            {detailsOpen ? 'Hide details' : 'Explain signal'}
          </button>
        </div>
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

        <div className="signal-rationale">
          <span className="signal-rationale__label">Why this badge</span>
          <p className="signal-copy">{quote.signalDetail}</p>
        </div>

        <p className="disclaimer muted">
          Model uses MA, RSI, and volume on this series. Yahoo can lag — verify
          price and size at your broker.
        </p>
      </div>
    </>
  )
}
