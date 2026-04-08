import { useCallback, useEffect, useState } from 'react'
import { fetchAmznQuote } from '@/features/quote/services/yahoo'
import type { StockQuote } from '@/features/quote/types'

export function useAmznQuote() {
  const [quote, setQuote] = useState<StockQuote | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setQuote(await fetchAmznQuote())
    } catch (e) {
      setQuote(null)
      setError(e instanceof Error ? e.message : 'Could not load quote')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { quote, error, loading, reload: load }
}
