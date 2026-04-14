import { useEffect, useRef } from 'react'
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  type ChartConfiguration,
  type Plugin,
} from 'chart.js'
import { buildLongTermChartPoints } from '@/features/quote/utils/chartSeries'
import { formatMoney } from '@/shared/utils/format'

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale)

const RSI_GATE_HIGH = 72
const RSI_GATE_LOW = 28

const COLORS = {
  price: '#ffffff',
  sma50: '#58a6ff',
  sma200: '#7fb77e',
  /** --chart-rsi */
  rsi: '#d4a32c',
} as const

function blankLabels(n: number): string[] {
  return Array.from({ length: n }, () => '')
}

/** Bands + dashed gates + mid grid (matches old SVG); drawn before RSI line. */
const rsiDecorationPlugin: Plugin = {
  id: 'rsiSvgStyleDecoration',
  beforeDatasetsDraw(chart) {
    const yAxis = chart.scales.y
    const { ctx, chartArea } = chart
    if (!chartArea || !yAxis) return
    const { left, right, top, bottom } = chartArea
    const w = right - left
    const y72 = yAxis.getPixelForValue(RSI_GATE_HIGH)
    const y28 = yAxis.getPixelForValue(RSI_GATE_LOW)
    const y50 = yAxis.getPixelForValue(50)

    ctx.save()

    ctx.globalAlpha = 0.11
    ctx.fillStyle = 'rgba(255, 107, 107, 1)'
    ctx.fillRect(left, top, w, Math.max(0, y72 - top))
    ctx.fillStyle = 'rgba(127, 183, 126, 1)'
    ctx.fillRect(left, y28, w, Math.max(0, bottom - y28))
    ctx.globalAlpha = 1

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
    ctx.lineWidth = 1
    ctx.setLineDash([3, 5])
    ctx.beginPath()
    ctx.moveTo(left, y50)
    ctx.lineTo(right, y50)
    ctx.stroke()

    ctx.strokeStyle = 'rgba(126, 184, 255, 0.42)'
    ctx.setLineDash([4, 4])
    for (const g of [RSI_GATE_HIGH, RSI_GATE_LOW]) {
      const y = yAxis.getPixelForValue(g)
      ctx.beginPath()
      ctx.moveTo(left, y)
      ctx.lineTo(right, y)
      ctx.stroke()
    }
    ctx.setLineDash([])
    ctx.restore()
  },
}

/** ~8px label stack; matches legacy `.signal-chart__axis` */
const CHART_TICK_FONT = {
  size: 10,
  family: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  weight: 500,
} as const

const CHART_TICK_MUTED = '#8b949e'
const CHART_TICK_GATE = '#9ec5e8'

type Props = {
  closes: number[]
  currency: string
}

export function LongTermDashboardChart({ closes, currency }: Props) {
  const priceCanvasRef = useRef<HTMLCanvasElement>(null)
  const rsiCanvasRef = useRef<HTMLCanvasElement>(null)
  const priceChartRef = useRef<Chart | null>(null)
  const rsiChartRef = useRef<Chart | null>(null)

  const preview = buildLongTermChartPoints(closes, 260)

  useEffect(() => {
    const built = buildLongTermChartPoints(closes, 260)
    priceChartRef.current?.destroy()
    rsiChartRef.current?.destroy()
    priceChartRef.current = null
    rsiChartRef.current = null

    if (!built || !priceCanvasRef.current || !rsiCanvasRef.current) return

    const { points, rsi14 } = built
    const n = points.length
    const labels = blankLabels(n)
    const closesOnly = points.map((p) => p.close)
    const sma50s = points.map((p) => p.sma50)
    const sma200s = points.map((p) => p.sma200)

    const hiddenX = {
      x: {
        display: false,
        border: { display: false },
        grid: { display: false, drawTicks: false, drawOnChartArea: false },
        ticks: { display: false },
      },
    } as const

    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { intersect: false, mode: 'index' as const },
      layout: {
        /* Inset chart area; extra left inset reserves space so Y labels sit off the plot */
        padding: { top: 12, right: 14, bottom: 12, left: 20 },
      },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
    } satisfies ChartConfiguration['options']

    const yAxisNoGrid = {
      border: { display: false },
      grid: { display: false, drawTicks: false, drawOnChartArea: false },
    } as const

    priceChartRef.current = new Chart(priceCanvasRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Close',
            data: closesOnly,
            borderColor: COLORS.price,
            borderWidth: 1.5,
            tension: 0.2,
            pointRadius: 0,
            pointHoverRadius: 0,
          },
          {
            label: 'SMA 50',
            data: sma50s,
            borderColor: COLORS.sma50,
            borderWidth: 1.25,
            tension: 0.2,
            pointRadius: 0,
            pointHoverRadius: 0,
          },
          {
            label: 'SMA 200',
            data: sma200s,
            borderColor: COLORS.sma200,
            borderWidth: 1.25,
            tension: 0.2,
            pointRadius: 0,
            pointHoverRadius: 0,
          },
        ],
      },
      options: {
        ...commonOptions,
        scales: {
          ...hiddenX,
          y: {
            position: 'left',
            min: built.yMin,
            max: built.yMax,
            ...yAxisNoGrid,
            afterBuildTicks: (scale) => {
              const lo = scale.min
              const hi = scale.max
              scale.ticks = [
                { value: hi },
                { value: (lo + hi) / 2 },
                { value: lo },
              ]
            },
            ticks: {
              display: true,
              autoSkip: false,
              /** Default `crossAlign` is `'far'`, which ignores `padding` — use `'near'` so gap label ↔ plot works */
              crossAlign: 'near',
              font: { ...CHART_TICK_FONT },
              color: CHART_TICK_MUTED,
              padding: 26,
              callback: (v) => formatMoney(Number(v), currency),
            },
          },
        },
      },
    })

    rsiChartRef.current = new Chart(rsiCanvasRef.current, {
      type: 'line',
      plugins: [rsiDecorationPlugin],
      data: {
        labels,
        datasets: [
          {
            label: 'RSI(14)',
            data: rsi14,
            borderColor: COLORS.rsi,
            borderWidth: 1.75,
            tension: 0.2,
            pointRadius: 0,
            pointHoverRadius: 0,
          },
        ],
      },
      options: {
        ...commonOptions,
        scales: {
          ...hiddenX,
          y: {
            position: 'left',
            min: 0,
            max: 100,
            ...yAxisNoGrid,
            afterBuildTicks: (scale) => {
              scale.ticks = [100, 72, 50, 28, 0].map((value) => ({ value }))
            },
            ticks: {
              display: true,
              autoSkip: false,
              crossAlign: 'near',
              font: { ...CHART_TICK_FONT },
              padding: 26,
              color: (ctx) => {
                const v = ctx.tick?.value
                if (v === RSI_GATE_HIGH || v === RSI_GATE_LOW) return CHART_TICK_GATE
                return CHART_TICK_MUTED
              },
              callback: (raw) => String(Math.round(Number(raw))),
            },
          },
        },
      },
    })

    return () => {
      priceChartRef.current?.destroy()
      rsiChartRef.current?.destroy()
      priceChartRef.current = null
      rsiChartRef.current = null
    }
  }, [closes, currency])

  if (!preview) {
    return (
      <div className="dashboard-chart dashboard-chart--empty" role="status">
        <p className="dashboard-chart__empty-note muted">
          Chart needs at least 200 trading days of closes (200-day average).
        </p>
      </div>
    )
  }

  return (
    <div
      className="dashboard-chart"
      role="region"
      aria-label="Price and RSI charts with legend"
    >
      <div className="dashboard-chart__panel">
        <p className="dashboard-chart__panel-label">Price · 50/200 SMA</p>
        <div className="dashboard-chart__canvas-wrap dashboard-chart__canvas-wrap--price">
          <canvas ref={priceCanvasRef} />
        </div>
      </div>
      <div className="dashboard-chart__panel">
        <p className="dashboard-chart__panel-label">RSI(14)</p>
        <div className="dashboard-chart__canvas-wrap dashboard-chart__canvas-wrap--rsi">
          <canvas ref={rsiCanvasRef} />
        </div>
      </div>

      <ul className="dashboard-chart__legend" aria-label="What each line and zone means">
        <li
          title="Daily closing price"
          className="dashboard-chart__legend-item"
        >
          <span
            className="dashboard-chart__swatch dashboard-chart__swatch--close"
            aria-hidden
          />
          <span>
            <strong className="dashboard-chart__legend-name">Close</strong>
            <span className="dashboard-chart__legend-desc muted">
              {' '}
              — daily closing price vs the averages
            </span>
          </span>
        </li>
        <li
          title="50-day simple moving average of close"
          className="dashboard-chart__legend-item"
        >
          <span
            className="dashboard-chart__swatch dashboard-chart__swatch--sma50"
            aria-hidden
          />
          <span>
            <strong className="dashboard-chart__legend-name">50-day SMA</strong>
            <span className="dashboard-chart__legend-desc muted">
              {' '}
              — medium-term trend (~2½ mo.)
            </span>
          </span>
        </li>
        <li
          title="200-day simple moving average of close"
          className="dashboard-chart__legend-item"
        >
          <span
            className="dashboard-chart__swatch dashboard-chart__swatch--sma200"
            aria-hidden
          />
          <span>
            <strong className="dashboard-chart__legend-name">200-day SMA</strong>
            <span className="dashboard-chart__legend-desc muted">
              {' '}
              — long-term trend (~10 mo.)
            </span>
          </span>
        </li>
        <li
          title="14-period Wilder RSI on closes"
          className="dashboard-chart__legend-item"
        >
          <span
            className="dashboard-chart__swatch dashboard-chart__swatch--rsi"
            aria-hidden
          />
          <span>
            <strong className="dashboard-chart__legend-name">RSI(14)</strong>
            <span className="dashboard-chart__legend-desc muted">
              {' '}
              — momentum / overbought-oversold read
            </span>
          </span>
        </li>
        <li
          className="dashboard-chart__legend-item dashboard-chart__legend-item--gates"
          title="Model uses RSI gates at 72 (overbought) and 28 (oversold)"
        >
          <span
            className="dashboard-chart__swatch dashboard-chart__swatch--gate"
            aria-hidden
          />
          <span>
            <strong className="dashboard-chart__legend-name">Gates 72 / 28</strong>
            <span className="dashboard-chart__legend-desc muted">
              {' '}
              — buy pause high / sell-guard low in the model
            </span>
          </span>
        </li>
      </ul>
    </div>
  )
}
