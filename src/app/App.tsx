import { useCallback, useState } from 'react'
import { WatchlistSection } from '@/features/quote/WatchlistSection'
import '@/app/app.css'

const GITHUB_REPO_URL = 'https://github.com/jatuporndev/should-i-buy-now'

function GitHubRepoLink({ className }: { className?: string }) {
  return (
    <a
      href={GITHUB_REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={['app-github-link', className].filter(Boolean).join(' ')}
      aria-label="View source on GitHub"
    >
      <svg
        className="app-github-icon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
        />
      </svg>
    </a>
  )
}

export default function App() {
  const [navOpen, setNavOpen] = useState(false)

  const closeNav = useCallback(() => {
    setNavOpen(false)
  }, [])

  return (
    <div className="app-root">
      <header className="app-header-mobile" aria-label="App">
        <div className="app-header-mobile__inner">
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
          <GitHubRepoLink />
        </div>
      </header>

      <div className="app-layout">
        <button
          type="button"
          className="app-nav-toggle"
          aria-expanded={navOpen}
          aria-controls="app-navigation"
          onClick={() => setNavOpen((v) => !v)}
        >
          <span className="app-nav-toggle__bars" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="sr-only">Menu</span>
        </button>

        {navOpen && (
          <button
            type="button"
            className="app-nav-backdrop"
            aria-label="Close menu"
            onClick={closeNav}
          />
        )}

        <aside
          id="app-navigation"
          className={['app-nav', navOpen && 'app-nav--open'].filter(Boolean).join(' ')}
        >
          <div className="app-nav__brand">
            <span className="header__mark" aria-hidden="true">
              <span className="header__mark-bar header__mark-bar--1" />
              <span className="header__mark-bar header__mark-bar--2" />
              <span className="header__mark-bar header__mark-bar--3" />
            </span>
            <div className="app-nav__titles">
              <p className="app-nav__product">Should I buy?</p>
              <p className="app-nav__tagline">
                Long-term buy / sell / hold from daily Yahoo data. You choose when
                to fetch.
              </p>
            </div>
          </div>

          <nav className="app-nav__menu" aria-label="Main">
            <a
              href="#main-content"
              className="app-nav__link app-nav__link--active"
              aria-current="page"
              onClick={closeNav}
            >
              Discover
            </a>
          </nav>
        </aside>

        <div className="app-column">
          <header className="app-topbar">
            <div className="app-topbar__inner">
              <h1 className="app-page-title">Discover</h1>
              <GitHubRepoLink />
            </div>
          </header>

          <div className="app-scroll">
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
        </div>
      </div>
    </div>
  )
}
