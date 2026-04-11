import { useCallback, useEffect, useState } from 'react'
import { QuoteCard } from '@/features/quote/components/QuoteCard'
import { QuoteCardIdle } from '@/features/quote/components/QuoteCardIdle'
import { QuoteCardLoading } from '@/features/quote/components/QuoteCardLoading'
import { QuoteLoadError } from '@/features/quote/components/QuoteLoadError'
import { useStockQuote } from '@/features/quote/hooks/useStockQuote'
import { useWatchlist } from '@/features/quote/hooks/useWatchlist'
import { WATCHLIST_MOBILE_AUTO_FETCH_COUNT } from '@/features/quote/watchlist'
import { useMatchMedia } from '@/shared/hooks/useMatchMedia'
import '@/features/quote/quote.css'

type AutoSeqProps = {
  autoSeqIndex?: number
  autoSeqStep: number
  onAutoSeqAdvance: () => void
}

/** Stacked cards (mobile): sequential auto-load for the first N tickers. */
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

function WatchlistQuotes({ symbols }: { symbols: string[] }) {
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
            index < WATCHLIST_MOBILE_AUTO_FETCH_COUNT ? index : undefined
          }
          autoSeqStep={autoSeqStep}
          onAutoSeqAdvance={onAutoSeqAdvance}
        />
      ))}
    </div>
  )
}

/** Discover pane (desktop): single selected symbol, reasoning open by default. */
function QuoteDetailForSymbol({ symbol }: { symbol: string }) {
  const { quote, error, loading, load } = useStockQuote(symbol)
  const idle = !loading && !error && !quote

  useEffect(() => {
    void load()
  }, [load])

  const cardMods = [
    'card',
    'card--detail',
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
        <QuoteCard
          quote={quote}
          onRefresh={() => void load()}
          defaultDetailsOpen
        />
      )}
    </section>
  )
}

export function WatchlistSection() {
  const isDesktop = useMatchMedia('(min-width: 769px)')
  const watchlist = useWatchlist()
  const symbolsList =
    watchlist.status === 'ok' ? watchlist.symbols : []

  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)

  useEffect(() => {
    if (symbolsList.length === 0) {
      setSelectedSymbol(null)
      return
    }
    setSelectedSymbol((current) => {
      if (current != null && symbolsList.includes(current)) {
        return current
      }
      return symbolsList[0]
    })
  }, [symbolsList])

  let headHintDesktop: string | null = null
  let headHintMobile: string | null = null
  if (watchlist.status === 'ok') {
    const n = watchlist.symbols.length
    headHintDesktop =
      n > 1
        ? `Pick a ticker — detail loads when selected. Nothing auto-refreshes after load.`
        : `Detail loads when ready. Nothing auto-refreshes after load.`
    const k = Math.min(WATCHLIST_MOBILE_AUTO_FETCH_COUNT, n)
    if (n === 1) {
      headHintMobile =
        `Loads automatically. Nothing auto-refreshes after that.`
    } else if (k < n) {
      headHintMobile =
        k === 1
          ? `The first ticker loads automatically; tap Load for the rest. Nothing auto-refreshes after that.`
          : `The first ${k} of ${n} tickers load one-by-one automatically; tap Load for the rest. Nothing auto-refreshes after that.`
    } else {
      headHintMobile =
        `All ${n} tickers load one-by-one automatically. Nothing auto-refreshes after that.`
    }
  }

  const symbolsKey = symbolsList.join(',')

  return (
    <section className="watchlist-section" aria-label="Stock watchlist">
      {watchlist.status === 'loading' && (
        <p className="watchlist-page-status">Loading watchlist…</p>
      )}

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

      {watchlist.status === 'ok' && isDesktop && (
        <div className="discover-layout">
          <div className="discover-layout__list">
            <header className="watchlist-head discover-list-head">
              <h2 className="watchlist-head__title">Watchlist</h2>
              <p className="watchlist-head__symbols">
                {watchlist.symbols.join(' · ')}
              </p>
              {headHintDesktop && (
                <p className="watchlist-head__hint">{headHintDesktop}</p>
              )}
            </header>

            <ul
              className="watchlist-picker"
              role="listbox"
              aria-label="Watchlist tickers"
              aria-activedescendant={
                selectedSymbol ? `watchlist-opt-${selectedSymbol}` : undefined
              }
            >
              {watchlist.symbols.map((sym) => {
                const selected = sym === selectedSymbol
                return (
                  <li key={sym} role="none">
                    <button
                      type="button"
                      role="option"
                      id={`watchlist-opt-${sym}`}
                      aria-selected={selected}
                      className={[
                        'watchlist-picker__btn',
                        selected && 'watchlist-picker__btn--selected',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => setSelectedSymbol(sym)}
                    >
                      <span className="watchlist-picker__symbol">{sym}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="discover-layout__detail">
            {selectedSymbol == null ? (
              <div className="discover-detail-placeholder card card--detail">
                <p className="muted discover-detail-placeholder__text">
                  No tickers in the list.
                </p>
              </div>
            ) : (
              <QuoteDetailForSymbol
                key={selectedSymbol}
                symbol={selectedSymbol}
              />
            )}
          </div>
        </div>
      )}

      {watchlist.status === 'ok' && !isDesktop && (
        <>
          <header className="watchlist-head">
            <h2 className="watchlist-head__title">Watchlist</h2>
            <p className="watchlist-head__symbols">
              {watchlist.symbols.join(' · ')}
            </p>
            {headHintMobile && (
              <p className="watchlist-head__hint">{headHintMobile}</p>
            )}
          </header>
          <WatchlistQuotes key={symbolsKey} symbols={watchlist.symbols} />
        </>
      )}
    </section>
  )
}
