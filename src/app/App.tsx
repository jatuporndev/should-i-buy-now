import { AmznQuoteSection } from '@/features/quote/AmznQuoteSection'
import '@/app/app.css'

export default function App() {
  return (
    <div className="app">
      <header className="header">
        <h1 className="title">Should I Buy?</h1>
        <p className="subtitle">
          Personal AMZN view: price from Yahoo chart data with a rules-based
          buy / sell / hold badge. You choose every trade; this app does not
          connect to a broker and is not a financial service.
        </p>
      </header>

      <AmznQuoteSection />
    </div>
  )
}
