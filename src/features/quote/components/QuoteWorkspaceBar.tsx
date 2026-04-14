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
  const modelPanelId = useId()
  const symbolLabelId = useId()
  const [query, setQuery] = useState('')
  const [modelOpen, setModelOpen] = useState(false)

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
        <div className="quote-workspace-bar__row">
          <span className="quote-workspace-bar__label" id={symbolLabelId}>
            Symbol
          </span>
          <input
            type="search"
            className="quote-workspace-bar__search"
            placeholder="AMZN"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-labelledby={symbolLabelId}
            autoComplete="off"
            spellCheck={false}
          />
          <select
            className="quote-workspace-bar__select"
            disabled={!canPick}
            value={selectedSymbol ?? ''}
            onChange={(e) => onSelectSymbol(e.target.value)}
            aria-labelledby={symbolLabelId}
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

          <div
            className="workspace-segmented"
            role="group"
            aria-label="Chart and model context"
          >
          <span
            className="workspace-segmented__seg workspace-segmented__seg--info"
            title="Daily closing prices"
          >
            Daily
          </span>
          <span
            className="workspace-segmented__seg workspace-segmented__seg--info"
            title="Last ~260 trading sessions (~1 year)"
          >
            ~1Y window
          </span>
          <button
            type="button"
            className={[
              'workspace-segmented__seg workspace-segmented__seg--action',
              modelOpen && 'workspace-segmented__seg--active',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-expanded={modelOpen}
            aria-controls={modelPanelId}
            onClick={() => setModelOpen((v) => !v)}
          >
            Model
          </button>
          </div>
        </div>

        {modelOpen ? (
          <div className="workspace-model-panel" id={modelPanelId} role="region">
            <p className="workspace-model-panel__text muted">
              {'50- & 200-day'} simple moving averages, RSI(14) with gates at{' '}
              <strong>72</strong> / <strong>28</strong>, volume confirmation on daily
              closes. Long-term read — not for scalping.
            </p>
          </div>
        ) : null}
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
