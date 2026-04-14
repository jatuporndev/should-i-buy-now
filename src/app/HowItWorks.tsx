export function HowItWorks() {
  return (
    <article className="how-it-works" aria-labelledby="how-it-works-title">
      <h2 id="how-it-works-title" className="how-it-works__title">
        How it works
      </h2>
      <p className="how-it-works__lead">
        This app gives you Buy, Hold, or Sell recommendations based on long-term
        daily price trends — not intraday moves or news. Recommendations are
        computed only after you load data; nothing polls your watchlist in the
        background.
      </p>

      <section className="how-it-works__section" aria-labelledby="how-model">
        <h3 id="how-model" className="how-it-works__h3">
          The trend model
        </h3>
        <p>
          Each ticker uses about two years of <strong>daily closing prices</strong>{' '}
          from Yahoo Finance. From that series we derive:
        </p>
        <ul className="how-it-works__list">
          <li>
            <strong>50-day</strong> and <strong>200-day</strong> simple moving
            averages (SMAs) of the close.
          </li>
          <li>
            A small <strong>buffer</strong> (about 0.3%) so tiny wiggles around
            the averages do not flip the read every day.
          </li>
          <li>
            <strong>RSI(14)</strong> on closes — when the long-term picture would
            say Buy but RSI is very high (≥ 72), the badge stays{' '}
            <strong>Hold</strong> (extended rally). When it would say Sell but RSI
            is very low (≤ 28), it stays <strong>Hold</strong> (possibly exhausted
            dip).
          </li>
          <li>
            <strong>Volume</strong> vs a longer baseline — if price looks bullish
            but recent volume is clearly weak, the model stays{' '}
            <strong>Hold</strong> instead of Buy.
          </li>
        </ul>
        <p>
          We need <strong>at least 200 trading days</strong> of history to compute
          the 200-day average. With less data, you will see a Hold-style message
          explaining that the model is not ready.
        </p>
      </section>

      <section className="how-it-works__section" aria-labelledby="how-badges">
        <h3 id="how-badges" className="how-it-works__h3">
          What our recommendations mean
        </h3>
        <ul className="how-it-works__list">
          <li>
            <strong>Buy</strong> — We recommend buying. The long-term trend is in
            your favor: price is above both averages in a bullish alignment
            (50-day above 200-day), and momentum and volume confirm the move.
          </li>
          <li>
            <strong>Sell</strong> — We recommend selling or avoiding new
            positions. The long-term trend has turned against this stock: price
            is below both averages in a bearish alignment, and RSI is not in the
            deep oversold zone where a bounce could be near.
          </li>
          <li>
            <strong>Hold</strong> — We recommend waiting. Conditions are not
            clear enough to act — the trend may be mixed, a filter (RSI or
            volume) flagged caution, or there is not enough data yet.
          </li>
        </ul>
      </section>

      <section className="how-it-works__section" aria-labelledby="how-data">
        <h3 id="how-data" className="how-it-works__h3">
          Data and limits
        </h3>
        <p>
          Quotes come from Yahoo’s public endpoints; they can be delayed, revised,
          or rate-limited. Our recommendations are based on a mechanical model —
          always confirm live prices with your broker and consider your own risk
          tolerance before acting.
        </p>
      </section>
    </article>
  )
}
