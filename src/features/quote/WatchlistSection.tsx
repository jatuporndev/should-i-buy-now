import { useCallback, useEffect, useState } from 'react'
import { QuoteCard } from '@/features/quote/components/QuoteCard'
import { QuoteCardIdle } from '@/features/quote/components/QuoteCardIdle'
import { QuoteCardLoading } from '@/features/quote/components/QuoteCardLoading'
import { QuoteLoadError } from '@/features/quote/components/QuoteLoadError'
import { useStockQuote } from '@/features/quote/hooks/useStockQuote'
import { useWatchlist } from '@/features/quote/hooks/useWatchlist'
import { WATCHLIST_AUTO_FETCH_COUNT } from '@/features/quote/watchlist'
import '@/features/quote/quote.css'

type AutoSeqProps = {
  autoSeqIndex?: number
  autoSeqStep: number
  onAutoSeqAdvance: () => void
}

function QuoteForSymbol({
  symbol,
  autoSeqIndex,
  autoSeqStep,
  onAutoSeqAdvance,
}: { symbol: string } & AutoSeqProps) {
  const { quote, error, loading, load } = useStockQuote(symbol)
  const idle = !loading && !error && !quote

  useEffect(() => {
    if (autoSeqIndex === undefined) return
    if (autoSeqIndex !== autoSeqStep) return
    let active = true
    void (async () => {
      try {
        await load()
      } finally {
        if (active) onAutoSeqAdvance()
      }
    })()
    return () => {
      active = false
    }
  }, [autoSeqIndex, autoSeqStep, load, onAutoSeqAdvance])

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

function WatchlistQuotes({
  symbols,
}: {
  symbols: string[]
}) {
  const [autoSeqStep, setAutoSeqStep] = useState(0)
  const onAutoSeqAdvance = useCallback(() => {
    setAutoSeqStep((s) => s + 1)
  }, [])

  return (
    <div className="watchlist">
      {symbols.map((symbol, index) => (
        <QuoteForSymbol
          key={symbol}
          symbol={symbol}
          autoSeqIndex={
            index < WATCHLIST_AUTO_FETCH_COUNT ? index : undefined
          }
          autoSeqStep={autoSeqStep}
          onAutoSeqAdvance={onAutoSeqAdvance}
        />
      ))}
    </div>
  )
}

export function WatchlistSection() {
  const watchlist = useWatchlist()

  const symbolsList =
    watchlist.status === 'ok' ? watchlist.symbols : []
  const symbolsKey = symbolsList.join(',')

  let headHint: string | null = null
  if (watchlist.status === 'ok') {
    const n = watchlist.symbols.length
    const k = Math.min(WATCHLIST_AUTO_FETCH_COUNT, n)
    headHint =
      k < n
        ? `The first ${k} of ${n} tickers load one-by-one automatically; tap Load for the rest. Nothing auto-refreshes after that.`
        : `All ${n} ${n === 1 ? 'ticker' : 'tickers'} load one-by-one automatically. Nothing auto-refreshes after that.`
  }

  return (
    <section className="watchlist-section" aria-label="Stock watchlist">
      <header className="watchlist-head">
        <h2 className="watchlist-head__title">Watchlist</h2>
        {watchlist.status === 'loading' && (
          <p className="watchlist-head__symbols">Loading…</p>
        )}
        {watchlist.status === 'error' && (
          <p className="watchlist-head__symbols">Couldn’t load list</p>
        )}
        {watchlist.status === 'ok' && (
          <>
            <p className="watchlist-head__symbols">
              {watchlist.symbols.join(' · ')}
            </p>
            <p className="watchlist-head__hint">{headHint}</p>
          </>
        )}
      </header>

      {watchlist.status === 'error' && (
        <div className="error watchlist-error" role="alert">
          <p className="error__message">{watchlist.error}</p>
          {watchlist.hasRemoteUrl && (
            <button
              type="button"
              className="btn btn-primary btn-compact"
              onClick={() => watchlist.retry()}
            >
              Try again
            </button>
          )}
        </div>
      )}

      {watchlist.status === 'ok' && (
        <WatchlistQuotes key={symbolsKey} symbols={watchlist.symbols} />
      )}
    </section>
  )
}
