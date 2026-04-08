type Props = {
  message: string
  onRetry: () => void
}

export function QuoteLoadError({ message, onRetry }: Props) {
  return (
    <div className="error" role="alert">
      <p className="error__message">{message}</p>
      <button type="button" className="btn btn-primary btn-compact" onClick={onRetry}>
        Try again
      </button>
    </div>
  )
}
