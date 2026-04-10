type Props = {
  symbol: string
  onLoad: () => void
}

/**
 * Same grid as {@link QuoteCard} / {@link QuoteCardLoading} so height stays even before load.
 */
export function QuoteCardIdle({ symbol, onLoad }: Props) {
  return (
    <div className="quote-card-body quote-card-body--idle">
      <div className="quote-row-top">
        <span className="symbol">{symbol}</span>
        <span
          className="quote-skel quote-skel--badge-inline"
          aria-hidden="true"
        />
        <button
          type="button"
          className="btn btn-primary btn-compact"
          onClick={onLoad}
        >
          Load {symbol}
        </button>
      </div>

      <p className="quote-card-name muted">
        Long-term signal from ~2 years of daily Yahoo data. Tap Load — no
        background requests.
      </p>

      <div className="quote-row-metrics">
        <div className="quote-row-metrics__price">
          <span
            className="quote-skel__line quote-skel__line--hero"
            aria-hidden="true"
          />
          <span
            className="quote-skel__line quote-skel__line--change"
            aria-hidden="true"
          />
        </div>
        <button
          type="button"
          className="quote-idle__why-slot btn btn-compact btn-details-toggle"
          aria-hidden="true"
          tabIndex={-1}
          disabled
        >
          Why this call?
        </button>
      </div>
    </div>
  )
}
