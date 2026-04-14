import { useEffect, useRef } from 'react'
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  type ChartConfiguration,
  type Plugin,
} from 'chart.js'
import { buildLongTermChartPoints } from '@/features/quote/utils/chartSeries'
import { useMatchMedia } from '@/shared/hooks/useMatchMedia'
import { formatChartDateTimeIct, formatMoney } from '@/shared/utils/format'

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler)

const RSI_GATE_HIGH = 72
const RSI_GATE_LOW = 28

/** Keep in sync with `index.css` chart tokens. */
const COLORS = {
  price: '#f0f0f0',
  sma50: '#6eb0ff',
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

    ctx.strokeStyle = 'rgba(176, 176, 176, 0.5)'
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

type PriceCrosshairOpts = {
  closesOnly: number[]
  barTimestampsSec: (number | null)[]
  currency: string
  compact: boolean
}

/** Vertical hover line + on-canvas time & close price at that bar. */
function createPriceCrosshairPlugin(opts: PriceCrosshairOpts): Plugin {
  return {
    id: 'priceHoverCrosshair',
    afterDatasetsDraw(chart) {
      const active = chart.getActiveElements()
      if (!active.length) return
      const { ctx, chartArea } = chart
      if (!chartArea) return
      const idx = active[0]!.index
      const meta = chart.getDatasetMeta(0)
      const pt = meta.data[idx] as { x?: number } | undefined
      const x = pt && typeof pt.x === 'number' ? pt.x : undefined
      if (x === undefined) return

      const sec = opts.barTimestampsSec[idx]
      const rawClose = opts.closesOnly[idx]
      const timeStr =
        sec != null ? formatChartDateTimeIct(sec) : 'No time'
      const priceStr =
        typeof rawClose === 'number' && Number.isFinite(rawClose)
          ? formatMoney(rawClose, opts.currency)
          : '—'

      const fontSize = opts.compact ? 9 : 10
      const padX = opts.compact ? 8 : 10
      const padY = opts.compact ? 6 : 8
      const lineGap = opts.compact ? 2 : 3

      ctx.save()
      ctx.font = `${CHART_TICK_FONT.weight} ${fontSize}px ${CHART_TICK_FONT.family}`
      ctx.textBaseline = 'middle'
      const w = Math.max(
        ctx.measureText(timeStr).width,
        ctx.measureText(priceStr).width,
      )
      const lineH = fontSize + lineGap
      const boxW = w + padX * 2
      const boxH = lineH * 2 + padY * 2 - lineGap

      let boxLeft = x - boxW / 2
      const margin = 4
      if (boxLeft < chartArea.left + margin) {
        boxLeft = chartArea.left + margin
      }
      if (boxLeft + boxW > chartArea.right - margin) {
        boxLeft = chartArea.right - margin - boxW
      }
      const boxTop = chartArea.top + margin

      ctx.fillStyle = 'rgba(28, 28, 30, 0.94)'
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)'
      ctx.lineWidth = 1
      const r = 4
      ctx.beginPath()
      ctx.roundRect(boxLeft, boxTop, boxW, boxH, r)
      ctx.fill()
      ctx.stroke()

      ctx.fillStyle = '#c8c8c8'
      const cx = boxLeft + padX
      let ty = boxTop + padY + fontSize / 2
      ctx.fillText(timeStr, cx, ty)
      ty += lineH
      ctx.fillStyle = COLORS.price
      ctx.fillText(priceStr, cx, ty)

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, chartArea.top)
      ctx.lineTo(x, chartArea.bottom)
      ctx.stroke()
      ctx.restore()
    },
  }
}

/** ~8px label stack; matches legacy `.signal-chart__axis` */
const CHART_TICK_FONT = {
  size: 10,
  family: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  weight: 500,
} as const

const CHART_TICK_MUTED = '#9a9a9a'
const CHART_TICK_GATE = '#c4c4c4'

type Props = {
  closes: number[]
  closeTimestamps?: number[]
  currency: string
}

export function LongTermDashboardChart({ closes, closeTimestamps, currency }: Props) {
  const priceCanvasRef = useRef<HTMLCanvasElement>(null)
  const rsiCanvasRef = useRef<HTMLCanvasElement>(null)
  const priceChartRef = useRef<Chart | null>(null)
  const rsiChartRef = useRef<Chart | null>(null)
  const narrowChart = useMatchMedia('(max-width: 768px)')

  const preview = buildLongTermChartPoints(closes, 260, closeTimestamps)

  useEffect(() => {
    const built = buildLongTermChartPoints(closes, 260, closeTimestamps)
    priceChartRef.current?.destroy()
    rsiChartRef.current?.destroy()
    priceChartRef.current = null
    rsiChartRef.current = null

    if (!built || !priceCanvasRef.current || !rsiCanvasRef.current) return

    const { points, rsi14, barTimestampsSec } = built
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

    const layoutPadding = narrowChart
      ? { top: 8, right: 4, bottom: 8, left: 6 }
      : { top: 12, right: 14, bottom: 12, left: 20 }
    const yTickPadding = narrowChart ? 10 : 26
    const tickFont = narrowChart ? { ...CHART_TICK_FONT, size: 9 } : CHART_TICK_FONT

    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { intersect: false, mode: 'index' as const },
      layout: {
        padding: layoutPadding,
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

    const priceCrosshairPlugin = createPriceCrosshairPlugin({
      closesOnly,
      barTimestampsSec,
      currency,
      compact: narrowChart,
    })

    priceChartRef.current = new Chart(priceCanvasRef.current, {
      type: 'line',
      plugins: [priceCrosshairPlugin],
      data: {
        labels,
        datasets: [
          {
            label: 'Close',
            data: closesOnly,
            borderColor: COLORS.price,
            backgroundColor: 'rgba(255, 255, 255, 0.07)',
            borderWidth: 1.5,
            tension: 0.2,
            fill: 'start',
            pointRadius: 0,
            pointHoverRadius: 0,
          },
          {
            label: 'SMA 50',
            data: sma50s,
            borderColor: COLORS.sma50,
            borderWidth: 1.25,
            tension: 0.2,
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 0,
          },
          {
            label: 'SMA 200',
            data: sma200s,
            borderColor: COLORS.sma200,
            borderWidth: 1.25,
            tension: 0.2,
            fill: false,
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
              font: { ...tickFont },
              color: CHART_TICK_MUTED,
              padding: yTickPadding,
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
              font: { ...tickFont },
              padding: yTickPadding,
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
  }, [closes, closeTimestamps, currency, narrowChart])

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
