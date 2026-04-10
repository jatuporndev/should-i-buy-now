import { useCallback, useEffect, useMemo, useState } from 'react'
import { DEFAULT_WATCHLIST_SYMBOLS } from '@/features/quote/watchlist'
import {
  fetchWatchlistSymbols,
  resolveWatchlistCsvUrl,
} from '@/features/quote/services/watchlistCsv'

type WatchlistState =
  | {
      symbols: string[]
      status: 'ok'
      error: null
      source: 'default' | 'remote'
    }
  | {
      symbols: string[]
      status: 'loading'
      error: null
      source: 'remote'
    }
  | {
      symbols: string[]
      status: 'error'
      error: string
      source: 'remote'
    }

export function useWatchlist() {
  const csvUrl = useMemo(() => resolveWatchlistCsvUrl(), [])
  const [loadKey, setLoadKey] = useState(0)

  const [state, setState] = useState<WatchlistState>(() => {
    if (!csvUrl) {
      return {
        symbols: [...DEFAULT_WATCHLIST_SYMBOLS],
        status: 'ok',
        error: null,
        source: 'default',
      }
    }
    return {
      symbols: [],
      status: 'loading',
      error: null,
      source: 'remote',
    }
  })

  useEffect(() => {
    if (!csvUrl) return

    let cancelled = false

    fetchWatchlistSymbols(csvUrl)
      .then((symbols) => {
        if (cancelled) return
        setState({
          symbols,
          status: 'ok',
          error: null,
          source: 'remote',
        })
      })
      .catch((e) => {
        if (cancelled) return
        setState({
          symbols: [],
          status: 'error',
          error: e instanceof Error ? e.message : 'Could not load watchlist',
          source: 'remote',
        })
      })

    return () => {
      cancelled = true
    }
  }, [csvUrl, loadKey])

  const retry = useCallback(() => {
    if (!csvUrl) return
    setState({
      symbols: [],
      status: 'loading',
      error: null,
      source: 'remote',
    })
    setLoadKey((k) => k + 1)
  }, [csvUrl])

  return { ...state, retry, hasRemoteUrl: Boolean(csvUrl) }
}
