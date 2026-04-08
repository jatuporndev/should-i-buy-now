import type { StockQuote } from '@/features/quote/types'

type Props = {
  signal: StockQuote['signal']
  emphasis?: boolean
}

export function SignalBadge({ signal, emphasis }: Props) {
  const label =
    signal === 'buy' ? 'Buy' : signal === 'sell' ? 'Sell' : 'Hold'
  return (
    <span
      className={[
        'signal-badge',
        `signal-badge--${signal}`,
        emphasis ? 'signal-badge--emphasis' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="status"
    >
      {label}
    </span>
  )
}
