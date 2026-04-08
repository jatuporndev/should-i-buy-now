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
  const changeClass = priceChangeClassFromPercent(quote.changePercent)

  return (
    <>
      <div className="card-top">
        <div className="card-top__main">
          <div className="ticker-row">
            <span className="symbol">{quote.symbol}</span>
            <SignalBadge signal={quote.signal} />
          </div>
          <h2 className="company">{quote.name}</h2>
        </div>
        <div className="price-block">
          <span className="price">
            {formatMoney(quote.price, quote.currency)}
          </span>
          <span className={`price-change ${changeClass}`}>
            {formatPct(quote.changePercent)}{' '}
            <span className="muted">1d</span>
          </span>
        </div>
      </div>

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

      <button
        type="button"
        className="btn btn-ghost"
        onClick={onRefresh}
      >
        Refresh quote
      </button>
    </>
  )
}
