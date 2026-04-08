import { WatchlistSection } from '@/features/quote/WatchlistSection'
import '@/app/app.css'

export default function App() {
  return (
    <div className="app">
      <header className="header">
        <div className="header__brand">
          <span className="header__mark" aria-hidden="true" />
          <div className="header__titles">
            <h1 className="title">Should I Buy?</h1>
            <p className="tagline">
              Rules-based buy / sell / hold from Yahoo daily data — on your
              tap, not auto-polling.
            </p>
          </div>
        </div>
      </header>

      <WatchlistSection />

      <footer className="footer">
        <p>
          Not a broker or financial service. Yahoo feeds can lag or fail;
          confirm with your broker. You bear all trading risk.
        </p>
      </footer>
    </div>
  )
}
