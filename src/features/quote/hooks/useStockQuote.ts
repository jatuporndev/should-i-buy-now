import { useCallback, useRef, useState } from 'react'
import { fetchStockQuote } from '@/features/quote/services/yahoo'
import type { StockQuote } from '@/features/quote/types'

export function useStockQuote(symbol: string) {
  const [quote, setQuote] = useState<StockQuote | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const loadLock = useRef<Promise<void> | null>(null)
  const lockSymbol = useRef<string | null>(null)

  const load = useCallback(async () => {
    if (loadLock.current && lockSymbol.current === symbol) {
      await loadLock.current
      return
    }

    lockSymbol.current = symbol
    const run = (async () => {
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
    })()

    loadLock.current = run.then(() => {}).finally(() => {
      loadLock.current = null
      lockSymbol.current = null
    })
    await loadLock.current
  }, [symbol])

  return { quote, error, loading, load }
}
