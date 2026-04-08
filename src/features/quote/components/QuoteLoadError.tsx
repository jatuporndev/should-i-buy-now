type Props = {
  message: string
  onRetry: () => void
}

export function QuoteLoadError({ message, onRetry }: Props) {
  return (
    <div className="error" role="alert">
      <p>{message}</p>
      <button type="button" className="btn" onClick={onRetry}>
        Retry
      </button>
    </div>
  )
}
