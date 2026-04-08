import { QuoteCard } from '@/features/quote/components/QuoteCard'
import { QuoteLoadError } from '@/features/quote/components/QuoteLoadError'
import { useAmznQuote } from '@/features/quote/hooks/useAmznQuote'
import '@/features/quote/quote.css'

export function AmznQuoteSection() {
  const { quote, error, loading, reload } = useAmznQuote()

  return (
    <main className="card">
      {loading && <p className="muted">Loading AMZN…</p>}

      {error && (
        <QuoteLoadError
          message={error}
          onRetry={() => void reload()}
        />
      )}

      {!loading && !error && quote && (
        <QuoteCard quote={quote} onRefresh={() => void reload()} />
      )}
    </main>
  )
}
