export type Signal = 'buy' | 'sell' | 'hold'

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
}
