import { QuoteCard } from '@/features/quote/components/QuoteCard'
import { QuoteCardIdle } from '@/features/quote/components/QuoteCardIdle'
import { QuoteCardLoading } from '@/features/quote/components/QuoteCardLoading'
import { QuoteLoadError } from '@/features/quote/components/QuoteLoadError'
import { useStockQuote } from '@/features/quote/hooks/useStockQuote'
import { WATCHLIST_SYMBOLS } from '@/features/quote/watchlist'
import '@/features/quote/quote.css'

function QuoteForSymbol({ symbol }: { symbol: string }) {
  const { quote, error, loading, load } = useStockQuote(symbol)
  const idle = !loading && !error && !quote

  const cardMods = [
    'card',
    loading && 'card--loading',
    quote && 'card--loaded',
    quote && `card--signal-${quote.signal}`,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section className={cardMods} aria-labelledby={`quote-${symbol}-title`}>
      <h2 id={`quote-${symbol}-title`} className="sr-only">
        {symbol}
      </h2>
      {idle && (
        <QuoteCardIdle symbol={symbol} onLoad={() => void load()} />
      )}

      {loading && <QuoteCardLoading symbol={symbol} />}

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
    <section className="watchlist-section" aria-label="Stock watchlist">
      <header className="watchlist-head">
        <h2 className="watchlist-head__title">Watchlist</h2>
        <p className="watchlist-head__symbols">{WATCHLIST_SYMBOLS.join(' · ')}</p>
        <p className="watchlist-head__hint">
          {WATCHLIST_SYMBOLS.length} tickers — load when you’re ready. Nothing
          auto-refreshes.
        </p>
      </header>
      <div className="watchlist">
        {WATCHLIST_SYMBOLS.map((symbol) => (
          <QuoteForSymbol key={symbol} symbol={symbol} />
        ))}
      </div>
    </section>
  )
}
