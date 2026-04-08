import { formatMoney, formatPct } from '@/shared/utils/format'
import { priceChangeClassFromPercent } from '@/shared/utils/quoteDisplay'
import type { StockQuote } from '@/features/quote/types'
import { SignalBadge } from '@/features/quote/components/SignalBadge'

type Props = {
  quote: StockQuote
  onRefresh: () => void
}

export function QuoteCard({ quote, onRefresh }: Props) {
  const changeClass = priceChangeClassFromPercent(quote.changePercent)

  return (
    <>
      <div className="card-top">
        <div>
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
            {formatPct(quote.changePercent)} <span className="muted">1d</span>
          </span>
        </div>
      </div>

      <p className="signal-copy">
        <strong>Why this badge:</strong> {quote.signalDetail}
      </p>
      <p className="disclaimer muted">
        Badge = your MA + RSI + volume rules on data pulled here. Yahoo’s feed
        can lag, change, or fail; confirm price and size with your broker.
        Bugs and bad data are possible — you alone bear trading risk.
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
