import { QuoteCard } from '@/features/quote/components/QuoteCard'
import { QuoteLoadError } from '@/features/quote/components/QuoteLoadError'
import { useStockQuote } from '@/features/quote/hooks/useStockQuote'
import { WATCHLIST_SYMBOLS } from '@/features/quote/watchlist'
import '@/features/quote/quote.css'

function QuoteForSymbol({ symbol }: { symbol: string }) {
  const { quote, error, loading, load } = useStockQuote(symbol)
  const idle = !loading && !error && !quote

  const cardMods = [
    'card',
    quote && 'card--loaded',
    quote && `card--signal-${quote.signal}`,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section className={cardMods} aria-labelledby={`quote-${symbol}-title`}>
      <h2 id={`quote-${symbol}-title`} className="sr-only">
        {symbol} quote
      </h2>
      {idle && (
        <div className="quote-idle">
          <div className="quote-idle__top">
            <span className="symbol symbol--idle">{symbol}</span>
            <span className="quote-idle__pill">Ready to load</span>
          </div>
          <p className="muted quote-idle-hint">
            Fetches Yahoo chart data only when you ask — avoids burst requests.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => void load()}>
            Load quote
          </button>
        </div>
      )}

      {loading && (
        <div className="quote-loading" aria-busy="true" aria-live="polite">
          <span className="quote-loading__label">Loading {symbol}</span>
          <div className="quote-loading__bars" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
      )}

      {error && (
        <QuoteLoadError message={error} onRetry={() => void load()} />
      )}

      {!loading && !error && quote && (
        <QuoteCard quote={quote} onRefresh={() => void load()} />
      )}
    </section>
  )
}

export function WatchlistSection() {
  return (
    <>
      <p className="watchlist-intro">
        Watchlist: {WATCHLIST_SYMBOLS.join(', ')}
      </p>
      <div className="watchlist">
        {WATCHLIST_SYMBOLS.map((symbol) => (
          <QuoteForSymbol key={symbol} symbol={symbol} />
        ))}
      </div>
    </>
  )
}
