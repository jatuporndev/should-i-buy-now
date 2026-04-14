import type { Signal } from '@/features/quote/types'
import { buildLongTermChartPoints } from '@/features/quote/utils/chartSeries'
import { formatMoney } from '@/shared/utils/format'

type Props = {
  closes: number[]
  currency: string
  signal: Signal
}

/** Same gates as `computeSignal` (daily RSI(14)). */
const RSI_GATE_HIGH = 72
const RSI_GATE_LOW = 28

const VIEW_W = 420
const VIEW_H = 200
const RSI_VIEW_H = 104
const PAD_L = 46
const PAD_R = 10
const PAD_T = 12
const PAD_B = 22

function signalLabel(s: Signal): string {
  if (s === 'buy') return 'Buy'
  if (s === 'sell') return 'Sell'
  return 'Hold'
}

function toPolylinePoints(
  values: number[],
  yMin: number,
  yMax: number,
  count: number,
  plotH: number,
): string {
  const plotW = VIEW_W - PAD_L - PAD_R
  const denom = yMax - yMin
  const n = values.length
  if (n === 0) return ''
  const parts: string[] = []
  for (let i = 0; i < n; i++) {
    const x =
      PAD_L + (count > 1 ? (i / (count - 1)) * plotW : plotW / 2)
    const t = denom > 0 ? (values[i]! - yMin) / denom : 0.5
    const y = PAD_T + (1 - t) * plotH
    parts.push(`${x.toFixed(2)},${y.toFixed(2)}`)
  }
  return parts.join(' ')
}

function xy(
  i: number,
  value: number,
  count: number,
  yMin: number,
  yMax: number,
  plotH: number,
): { x: number; y: number } {
  const plotW = VIEW_W - PAD_L - PAD_R
  const denom = yMax - yMin
  const x =
    PAD_L + (count > 1 ? (i / (count - 1)) * plotW : plotW / 2)
  const t = denom > 0 ? (value - yMin) / denom : 0.5
  const y = PAD_T + (1 - t) * plotH
  return { x, y }
}

function yForRsi(
  rsi: number,
  plotH: number,
): number {
  return PAD_T + (1 - rsi / 100) * plotH
}

export function SignalDecisionChart({ closes, currency, signal }: Props) {
  const built = buildLongTermChartPoints(closes, 260)
  if (!built) {
    return (
      <div className="signal-chart signal-chart--empty signal-chart--embedded" role="status">
        <p className="signal-chart__note muted">
          Chart needs at least 200 trading days of closes (200-day average).
        </p>
      </div>
    )
  }

  const { points, yMin, yMax, rsi14 } = built
  const closesOnly = points.map((p) => p.close)
  const sma50s = points.map((p) => p.sma50)
  const sma200s = points.map((p) => p.sma200)
  const count = points.length

  const plotH = VIEW_H - PAD_T - PAD_B
  const gridY1 = PAD_T + plotH * 0.33
  const gridY2 = PAD_T + plotH * 0.67

  const rsiPlotH = RSI_VIEW_H - PAD_T - PAD_B
  const y72 = yForRsi(RSI_GATE_HIGH, rsiPlotH)
  const y28 = yForRsi(RSI_GATE_LOW, rsiPlotH)
  const y50 = yForRsi(50, rsiPlotH)

  const ariaLabel = `Long-term chart over ${count} trading days: close, 50 and 200-day moving averages, and RSI 14 with gates at ${RSI_GATE_HIGH} and ${RSI_GATE_LOW}. Current model decision is ${signalLabel(signal)}.`

  return (
    <div className="signal-chart signal-chart--embedded" role="region" aria-label={ariaLabel}>
      <div className="signal-chart__head">
        <p className="signal-chart__meta">
          <span className={`signal-chart__decision signal-chart__decision--${signal}`}>
            {signalLabel(signal)}
          </span>
          <span className="signal-chart__range muted">
            Last {count} trading days · price + RSI(14) vs gates
          </span>
        </p>
      </div>

      <p
        className="signal-chart__subtitle muted"
        title={`RSI(14) matches the badge: Buys pause when RSI ≥ ${RSI_GATE_HIGH}; in downtrends, Sells are avoided when RSI ≤ ${RSI_GATE_LOW} (Hold instead).`}
      >
        Gates: Buys pause if RSI ≥ {RSI_GATE_HIGH}; Sells avoided if RSI ≤{' '}
        {RSI_GATE_LOW} in downtrends.
      </p>

      <svg
        className="signal-chart__svg signal-chart__svg--price"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="signal-chart-close" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--text)" stopOpacity="0.14" />
            <stop offset="100%" stopColor="var(--text)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <line
          className="signal-chart__grid"
          x1={PAD_L}
          y1={gridY1}
          x2={VIEW_W - PAD_R}
          y2={gridY1}
        />
        <line
          className="signal-chart__grid"
          x1={PAD_L}
          y1={gridY2}
          x2={VIEW_W - PAD_R}
          y2={gridY2}
        />

        <text className="signal-chart__axis" x={4} y={PAD_T + 10}>
          {formatMoney(yMax, currency)}
        </text>
        <text className="signal-chart__axis" x={4} y={PAD_T + plotH / 2 + 4}>
          {formatMoney((yMin + yMax) / 2, currency)}
        </text>
        <text className="signal-chart__axis" x={4} y={VIEW_H - PAD_B}>
          {formatMoney(yMin, currency)}
        </text>

        {count > 1 ? (
          <polygon
            className="signal-chart__fill"
            fill="url(#signal-chart-close)"
            points={`${PAD_L},${VIEW_H - PAD_B} ${toPolylinePoints(closesOnly, yMin, yMax, count, plotH)} ${VIEW_W - PAD_R},${VIEW_H - PAD_B}`}
          />
        ) : null}

        {count > 1 ? (
          <>
            <polyline
              className="signal-chart__line signal-chart__line--200"
              fill="none"
              points={toPolylinePoints(sma200s, yMin, yMax, count, plotH)}
            />
            <polyline
              className="signal-chart__line signal-chart__line--50"
              fill="none"
              points={toPolylinePoints(sma50s, yMin, yMax, count, plotH)}
            />
            <polyline
              className="signal-chart__line signal-chart__line--close"
              fill="none"
              points={toPolylinePoints(closesOnly, yMin, yMax, count, plotH)}
            />
          </>
        ) : (
          <>
            <circle
              className="signal-chart__dot signal-chart__dot--200"
              r={3.5}
              cx={xy(0, sma200s[0]!, count, yMin, yMax, plotH).x}
              cy={xy(0, sma200s[0]!, count, yMin, yMax, plotH).y}
            />
            <circle
              className="signal-chart__dot signal-chart__dot--50"
              r={3.5}
              cx={xy(0, sma50s[0]!, count, yMin, yMax, plotH).x}
              cy={xy(0, sma50s[0]!, count, yMin, yMax, plotH).y}
            />
            <circle
              className="signal-chart__dot signal-chart__dot--close"
              r={3.5}
              cx={xy(0, closesOnly[0]!, count, yMin, yMax, plotH).x}
              cy={xy(0, closesOnly[0]!, count, yMin, yMax, plotH).y}
            />
          </>
        )}

        <text className="signal-chart__xlabel muted" x={PAD_L} y={VIEW_H - 4}>
          Older
        </text>
        <text
          className="signal-chart__xlabel muted"
          x={VIEW_W - PAD_R}
          y={VIEW_H - 4}
          textAnchor="end"
        >
          Now
        </text>
      </svg>

      <p className="signal-chart__panel-label">RSI(14)</p>

      <svg
        className="signal-chart__svg signal-chart__svg--rsi"
        viewBox={`0 0 ${VIEW_W} ${RSI_VIEW_H}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <rect
          className="signal-chart__rsi-band signal-chart__rsi-band--high"
          x={PAD_L}
          y={PAD_T}
          width={VIEW_W - PAD_L - PAD_R}
          height={Math.max(0, y72 - PAD_T)}
        />
        <rect
          className="signal-chart__rsi-band signal-chart__rsi-band--low"
          x={PAD_L}
          y={y28}
          width={VIEW_W - PAD_L - PAD_R}
          height={Math.max(0, RSI_VIEW_H - PAD_B - y28)}
        />

        <line
          className="signal-chart__grid"
          x1={PAD_L}
          y1={y50}
          x2={VIEW_W - PAD_R}
          y2={y50}
        />

        <line
          className="signal-chart__rsi-gate"
          x1={PAD_L}
          y1={y72}
          x2={VIEW_W - PAD_R}
          y2={y72}
        />
        <line
          className="signal-chart__rsi-gate"
          x1={PAD_L}
          y1={y28}
          x2={VIEW_W - PAD_R}
          y2={y28}
        />

        <text className="signal-chart__axis" x={4} y={PAD_T + 9}>
          100
        </text>
        <text className="signal-chart__axis signal-chart__axis--rsi-gate" x={4} y={y72 + 3}>
          {RSI_GATE_HIGH}
        </text>
        <text className="signal-chart__axis" x={4} y={y50 + 4}>
          50
        </text>
        <text className="signal-chart__axis signal-chart__axis--rsi-gate" x={4} y={y28 + 4}>
          {RSI_GATE_LOW}
        </text>
        <text className="signal-chart__axis" x={4} y={RSI_VIEW_H - PAD_B}>
          0
        </text>

        {count > 1 ? (
          <polyline
            className="signal-chart__line signal-chart__line--rsi"
            fill="none"
            points={toPolylinePoints(rsi14, 0, 100, count, rsiPlotH)}
          />
        ) : (
          <circle
            className="signal-chart__dot signal-chart__dot--rsi"
            r={3.5}
            cx={xy(0, rsi14[0]!, count, 0, 100, rsiPlotH).x}
            cy={xy(0, rsi14[0]!, count, 0, 100, rsiPlotH).y}
          />
        )}

        <text
          className="signal-chart__xlabel muted"
          x={PAD_L}
          y={RSI_VIEW_H - 4}
        >
          Older
        </text>
        <text
          className="signal-chart__xlabel muted"
          x={VIEW_W - PAD_R}
          y={RSI_VIEW_H - 4}
          textAnchor="end"
        >
          Now
        </text>
      </svg>

      <ul className="signal-chart__legend">
        <li title="Daily close (area under the line)">
          <span className="signal-chart__swatch signal-chart__swatch--close" />
          Close
        </li>
        <li title="50-day simple moving average of close">
          <span className="signal-chart__swatch signal-chart__swatch--50" />
          50-day SMA
        </li>
        <li title="200-day simple moving average of close">
          <span className="signal-chart__swatch signal-chart__swatch--200" />
          200-day SMA
        </li>
        <li title="14-period Wilder RSI on closes">
          <span className="signal-chart__swatch signal-chart__swatch--rsi" />
          RSI(14)
        </li>
        <li
          className="signal-chart__legend-gates"
          title={`Model uses RSI gates at ${RSI_GATE_HIGH} (overbought) and ${RSI_GATE_LOW} (oversold)`}
        >
          <span className="signal-chart__swatch signal-chart__swatch--gate" />
          Gates {RSI_GATE_HIGH} / {RSI_GATE_LOW}
        </li>
      </ul>
    </div>
  )
}
