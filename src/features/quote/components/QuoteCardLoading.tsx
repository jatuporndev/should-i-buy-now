type Props = { symbol: string }

/**
 * Same regions as {@link QuoteCard} so the card does not jump while fetching.
 */
export function QuoteCardLoading({ symbol }: Props) {
  return (
    <div className="quote-card-body quote-card-body--loading" aria-busy="true">
      <div className="quote-row-top">
        <span className="symbol">{symbol}</span>
        <span
          className="quote-skel quote-skel--badge-inline quote-skel--shimmer"
          aria-hidden="true"
        />
        <button
          type="button"
          className="btn btn-primary btn-compact"
          disabled
          aria-disabled="true"
        >
          Loading…
        </button>
      </div>

      <p className="quote-card-name muted">Fetching daily history for long-term signal…</p>

      <div className="quote-row-metrics">
        <div className="quote-row-metrics__price">
          <span
            className="quote-skel__line quote-skel__line--hero quote-skel--shimmer"
            aria-hidden="true"
          />
          <span
            className="quote-skel__line quote-skel__line--change quote-skel--shimmer"
            aria-hidden="true"
          />
        </div>
        <button
          type="button"
          className="btn btn-compact btn-details-toggle"
          disabled
          aria-disabled="true"
        >
          Why this call?
        </button>
      </div>
    </div>
  )
}
