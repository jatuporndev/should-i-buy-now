import { WatchlistSection } from '@/features/quote/WatchlistSection'
import '@/app/app.css'

export default function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <div className="header__brand">
            <span className="header__mark" aria-hidden="true">
              <span className="header__mark-bar header__mark-bar--1" />
              <span className="header__mark-bar header__mark-bar--2" />
              <span className="header__mark-bar header__mark-bar--3" />
            </span>
            <div className="header__titles">
              <h1 className="title">Should I buy?</h1>
              <p className="tagline">
                Long-term buy / sell / hold from daily Yahoo data (50- & 200-day
                trend model). You choose when to fetch — we don’t poll in the
                background.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="app-main" id="main-content">
        <div className="app-main__inner">
          <WatchlistSection />
        </div>
      </main>

      <footer className="app-footer">
        <div className="app-footer__inner">
          <p className="app-footer__disclaimer">
            Not advice. Signals are a long-term daily trend read (50- & 200-day
            averages), not day trading. Data can be late or wrong — double-check
            your broker. You own the risk.
          </p>
        </div>
      </footer>
    </div>
  )
}
