import { useId, useMemo, useState, type ReactNode } from 'react'

type Props = {
  symbols: string[]
  selectedSymbol: string | null
  onSelectSymbol: (symbol: string) => void
  watchlistOpen: boolean
  onToggleWatchlist: () => void
  /** Shown next to GitHub on wide layouts */
  trailingSlot?: ReactNode
}

export function QuoteWorkspaceBar({
  symbols,
  selectedSymbol,
  onSelectSymbol,
  watchlistOpen,
  onToggleWatchlist,
  trailingSlot,
}: Props) {
  const detailsId = useId()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = !q ? symbols : symbols.filter((s) => s.toLowerCase().includes(q))
    if (
      selectedSymbol &&
      !list.includes(selectedSymbol) &&
      symbols.includes(selectedSymbol)
    ) {
      list = [selectedSymbol, ...list]
    }
    return list
  }, [symbols, query, selectedSymbol])

  const canPick = symbols.length > 0

  return (
    <div className="quote-workspace-bar">
      <div className="quote-workspace-bar__primary">
        <label className="quote-workspace-bar__field">
          <span className="quote-workspace-bar__label">Symbol</span>
          <span className="quote-workspace-bar__symbol-control">
            <input
              type="search"
              className="quote-workspace-bar__search"
              placeholder="Filter tickers…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Filter watchlist tickers"
              autoComplete="off"
              spellCheck={false}
            />
            <select
              className="quote-workspace-bar__select"
              aria-label="Active ticker"
              disabled={!canPick}
              value={selectedSymbol ?? ''}
              onChange={(e) => onSelectSymbol(e.target.value)}
            >
              {filtered.length === 0 ? (
                <option value="">No match</option>
              ) : (
                filtered.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))
              )}
            </select>
          </span>
        </label>

        <div
          className="quote-workspace-bar__chips"
          role="group"
          aria-label="Chart context"
        >
          <span className="quote-workspace-bar__chip" title="Data frequency for the model">
            Daily
          </span>
          <span
            className="quote-workspace-bar__chip quote-workspace-bar__chip--muted"
            title="Last ~260 trading sessions in the chart (long-term window)"
          >
            ~1Y window
          </span>
        </div>

        <details id={detailsId} className="quote-workspace-bar__model">
          <summary className="quote-workspace-bar__model-summary">Model</summary>
          <div className="quote-workspace-bar__model-body">
            <p className="quote-workspace-bar__model-p">
              50- &amp; 200-day simple moving averages, RSI(14) with gates at{' '}
              <strong>72</strong> / <strong>28</strong>, volume confirmation on
              daily closes. Long-term read — not for scalping.
            </p>
          </div>
        </details>
      </div>

      <div className="quote-workspace-bar__actions">
        <button
          type="button"
          className={[
            'btn btn-compact quote-workspace-bar__watchlist-btn',
            watchlistOpen && 'quote-workspace-bar__watchlist-btn--active',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-expanded={watchlistOpen}
          aria-controls="quote-watchlist-drawer"
          onClick={onToggleWatchlist}
        >
          Watchlist
          <span className="quote-workspace-bar__count">{symbols.length}</span>
        </button>
        {trailingSlot}
      </div>
    </div>
  )
}
