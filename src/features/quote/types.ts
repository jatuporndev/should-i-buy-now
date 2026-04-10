export type Signal = 'buy' | 'sell' | 'hold'

/** Values behind the badge; for display only. */
export type SignalBreakdown =
  | { status: 'need_history'; tradingDaysAvailable: number }
  | {
      status: 'ok'
      lastClose: number
      sma50: number
      sma200: number
      rsi14: number | null
      volume: 'weak' | 'ok' | 'unavailable'
      maTrend: 'uptrend' | 'downtrend' | 'sideways'
      /** Set when the badge is Hold but MAs were directional (RSI / volume gates). */
      holdFilter: string | null
    }

export type StockQuote = {
  symbol: string
  name: string
  currency: string
  price: number
  previousClose: number
  changePercent: number
  closes: number[]
  signal: Signal
  signalDetail: string
  signalBreakdown: SignalBreakdown
  /** When this snapshot was loaded in the app (ms); shown in UTC+7 (ICT). */
  lastUpdatedAt?: number
}
