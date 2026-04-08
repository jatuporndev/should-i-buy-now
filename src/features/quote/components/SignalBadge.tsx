import type { StockQuote } from '@/features/quote/types'

type Props = { signal: StockQuote['signal'] }

export function SignalBadge({ signal }: Props) {
  const label =
    signal === 'buy' ? 'Buy' : signal === 'sell' ? 'Sell' : 'Hold'
  return (
    <span className={`signal-badge signal-badge--${signal}`} role="status">
      {label}
    </span>
  )
}
