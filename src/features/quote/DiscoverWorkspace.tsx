import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { QuoteCard } from '@/features/quote/components/QuoteCard'
import { QuoteWorkspaceBar } from '@/features/quote/components/QuoteWorkspaceBar'
import { QuoteCardIdle } from '@/features/quote/components/QuoteCardIdle'
import { QuoteCardLoading } from '@/features/quote/components/QuoteCardLoading'
import { QuoteLoadError } from '@/features/quote/components/QuoteLoadError'
import { useStockQuote } from '@/features/quote/hooks/useStockQuote'
import { useWatchlist } from '@/features/quote/hooks/useWatchlist'
import { useMatchMedia } from '@/shared/hooks/useMatchMedia'
import '@/features/quote/quote.css'

const EMPTY_SYMBOLS: readonly string[] = []

function QuoteDetailForSymbol({
  symbol,
  workspaceLayout,
}: {
  symbol: string
  workspaceLayout: boolean
}) {
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
      {idle && <QuoteCardIdle symbol={symbol} onLoad={() => void load()} />}

      {loading && <QuoteCardLoading symbol={symbol} />}

      {error && <QuoteLoadError message={error} onRetry={() => void load()} />}

      {!loading && !error && quote && (
        <QuoteCard
          quote={quote}
          onRefresh={() => void load()}
          contextHeader={workspaceLayout}
          workspaceLayout={workspaceLayout}
        />
      )}
    </section>
  )
}

type DiscoverWorkspaceProps = {
  githubSlot: ReactNode
  footer: ReactNode
}

export function DiscoverWorkspace({ githubSlot, footer }: DiscoverWorkspaceProps) {
  const isDesktop = useMatchMedia('(min-width: 769px)')
  const watchlist = useWatchlist()

  const symbolsList = useMemo((): readonly string[] => {
    if (watchlist.status !== 'ok') return EMPTY_SYMBOLS
    return watchlist.symbols
  }, [watchlist.status, watchlist.symbols])

  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)
  const [watchlistOpen, setWatchlistOpen] = useState(false)

  useEffect(() => {
    if (symbolsList.length === 0) {
      setSelectedSymbol(null)
      return
    }
    setSelectedSymbol((current) => {
      if (current != null && symbolsList.includes(current)) {
        return current
      }
      return symbolsList[0]!
    })
  }, [symbolsList])

  const closeDrawer = useCallback(() => setWatchlistOpen(false), [])

  let headHint: string | null = null
  if (watchlist.status === 'ok') {
    const n = watchlist.symbols.length
    headHint =
      n > 1
        ? `Pick a ticker in the bar or list. Loads on demand — nothing auto-refreshes.`
        : `Loads when ready. Nothing auto-refreshes after load.`
  }

  return (
    <>
      <header className="app-topbar app-topbar--workspace">
        <div className="app-topbar__inner app-topbar__inner--workspace">
          {watchlist.status === 'ok' ? (
            <QuoteWorkspaceBar
              symbols={watchlist.symbols}
              selectedSymbol={selectedSymbol}
              onSelectSymbol={setSelectedSymbol}
              watchlistOpen={watchlistOpen}
              onToggleWatchlist={() => setWatchlistOpen((v) => !v)}
              trailingSlot={githubSlot}
            />
          ) : (
            <div className="quote-workspace-bar quote-workspace-bar--placeholder">
              <p className="app-page-title">Dashboard</p>
              {githubSlot}
            </div>
          )}
        </div>
      </header>

      <div className="app-scroll">
        <main className="app-main" id="main-content">
          <div className="app-main__inner app-main__inner--workspace">
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

              {watchlist.status === 'ok' && headHint && (
                <p className="workspace-hint muted">{headHint}</p>
              )}

              {watchlist.status === 'ok' && (
                <div
                  className={[
                    'workspace-body',
                    watchlistOpen && 'workspace-body--drawer-open',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <div className="workspace-body__main">
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
                        workspaceLayout
                      />
                    )}
                  </div>

                  {watchlistOpen && (
                    <>
                      <button
                        type="button"
                        className="workspace-drawer-backdrop"
                        aria-label="Close watchlist"
                        onClick={closeDrawer}
                      />
                      <aside
                        id="quote-watchlist-drawer"
                        className="workspace-drawer"
                        aria-label="Watchlist"
                      >
                        <div className="workspace-drawer__head">
                          <h2 className="workspace-drawer__title">Watchlist</h2>
                          <button
                            type="button"
                            className="btn btn-compact workspace-drawer__close"
                            onClick={closeDrawer}
                          >
                            Close
                          </button>
                        </div>
                        <p className="workspace-drawer__symbols muted">
                          {watchlist.symbols.join(' · ')}
                        </p>
                        <ul
                          className="watchlist-picker workspace-drawer__list"
                          role="listbox"
                          aria-label="Watchlist tickers"
                          aria-activedescendant={
                            selectedSymbol
                              ? `watchlist-opt-${selectedSymbol}`
                              : undefined
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
                                  onClick={() => {
                                    setSelectedSymbol(sym)
                                    if (!isDesktop) closeDrawer()
                                  }}
                                >
                                  <span className="watchlist-picker__symbol">
                                    {sym}
                                  </span>
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      </aside>
                    </>
                  )}
                </div>
              )}
            </section>
          </div>
        </main>

        {footer}
      </div>
    </>
  )
}
