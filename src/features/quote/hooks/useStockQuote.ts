import { useCallback, useState } from 'react'
import { fetchStockQuote } from '@/features/quote/services/yahoo'
import type { StockQuote } from '@/features/quote/types'

export function useStockQuote(symbol: string) {
  const [quote, setQuote] = useState<StockQuote | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const q = await fetchStockQuote(symbol)
      setQuote({ ...q, lastUpdatedAt: Date.now() })
    } catch (e) {
      setQuote(null)
      setError(e instanceof Error ? e.message : 'Could not load quote')
    } finally {
      setLoading(false)
    }
  }, [symbol])

  return { quote, error, loading, load }
}
