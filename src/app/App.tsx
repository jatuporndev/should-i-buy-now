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
                Simple buy / sell / hold from daily Yahoo data. You choose when
                to fetch — we don’t poll in the background.
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
            Not advice. Data can be late or wrong — double-check your broker. You
            own the risk.
          </p>
        </div>
      </footer>
    </div>
  )
}
