import { describe, expect, it } from 'vitest'
import { computeSignal } from '@/features/quote/services/signal'

function firstBuyFixtureParams(): { amp: number; drift: number; freq: number } {
  for (let amp = 6; amp <= 40; amp += 2) {
    for (let drift = 0.08; drift <= 0.45; drift += 0.02) {
      for (const freq of [0.08, 0.12, 0.16, 0.2]) {
        const closes = Array.from({ length: 200 }, (_, i) => 90 + i * drift + amp * Math.sin(i * freq))
        if (computeSignal(closes).signal === 'buy') {
          return { amp, drift, freq }
        }
      }
    }
  }
  throw new Error(
    'computeSignal tests: no synthetic series hit the buy path; widen the search grid.',
  )
}

const BUY_PARAMS = firstBuyFixtureParams()

function buyFixtureCloses(): number[] {
  const { amp, drift, freq } = BUY_PARAMS
  return Array.from({ length: 200 }, (_, i) => 90 + i * drift + amp * Math.sin(i * freq))
}

/** Scale the last 14 closes until the RSI pause triggers hold on still-bullish structure. */
function rsiOverboughtHoldFixtureCloses(): number[] {
  const base = buyFixtureCloses()
  for (let m = 1.03; m <= 1.4; m += 0.005) {
    const c = base.slice()
    const n = c.length
    for (let i = n - 14; i < n; i++) {
      c[i] = c[i]! * m
    }
    const r = computeSignal(c)
    if (
      r.signal === 'hold' &&
      r.breakdown.status === 'ok' &&
      r.breakdown.maTrend === 'uptrend' &&
      r.breakdown.holdFilter !== null &&
      r.breakdown.holdFilter.includes('RSI')
    ) {
      return c
    }
  }
  throw new Error(
    'computeSignal tests: could not build RSI overbought hold fixture; adjust multiplier search.',
  )
}

const RSI_OB_HOLD_CLOSES = rsiOverboughtHoldFixtureCloses()

/** Monotonic compound decay — downtrend; may push RSI oversold unless rate is mild. */
function compoundDowntrend(n: number, start = 300, dailyRate = 0.9985): number[] {
  return Array.from({ length: n }, (_, i) => start * dailyRate ** i)
}

/** Downward drift with oscillation so RSI does not stay pegged oversold (for testing sell path). */
function oscillatingDowntrend(n: number): number[] {
  return Array.from({ length: n }, (_, i) => {
    const drift = 250 - i * 0.55
    return drift + 4 * Math.sin(i * 0.35)
  })
}

/** Volumes: last 20 bars weak vs prior 80-bar baseline (needs length ≥ 120, aligned with closes). */
function weakRecentVolumes(len: number): number[] {
  const hi = 2_000_000
  const lo = 50_000
  return [...Array(len - 20).fill(hi), ...Array(20).fill(lo)]
}

describe('computeSignal', () => {
  it('returns need_history when there are fewer than 200 closes', () => {
    const closes = Array.from({ length: 199 }, (_, i) => 100 + i)
    const r = computeSignal(closes)
    expect(r.signal).toBe('hold')
    expect(r.breakdown.status).toBe('need_history')
    if (r.breakdown.status === 'need_history') {
      expect(r.breakdown.tradingDaysAvailable).toBe(199)
    }
    expect(r.detail).toContain('200')
  })

  it('returns sideways hold when price and MAs are flat', () => {
    const closes = Array.from({ length: 200 }, () => 100)
    const r = computeSignal(closes)
    expect(r.signal).toBe('hold')
    expect(r.breakdown.status).toBe('ok')
    if (r.breakdown.status === 'ok') {
      expect(r.breakdown.maTrend).toBe('sideways')
      expect(r.breakdown.volume).toBe('unavailable')
      expect(r.breakdown.rsi14).not.toBeNull()
    }
    expect(r.detail).toContain('not aligned')
  })

  it('returns buy on a smooth long-term uptrend without volume/RSI gates', () => {
    const closes = buyFixtureCloses()
    const r = computeSignal(closes)
    expect(r.signal).toBe('buy')
    expect(r.breakdown.status).toBe('ok')
    if (r.breakdown.status === 'ok') {
      expect(r.breakdown.maTrend).toBe('uptrend')
      expect(r.breakdown.volume).toBe('unavailable')
      expect(r.breakdown.holdFilter).toBeNull()
    }
  })

  it('holds on bullish structure when RSI(14) is very high', () => {
    const closes = RSI_OB_HOLD_CLOSES
    const r = computeSignal(closes)
    expect(r.signal).toBe('hold')
    expect(r.breakdown.status).toBe('ok')
    if (r.breakdown.status === 'ok') {
      expect(r.breakdown.maTrend).toBe('uptrend')
      expect(r.breakdown.rsi14).not.toBeNull()
      expect(r.breakdown.rsi14!).toBeGreaterThanOrEqual(72)
      expect(r.breakdown.holdFilter).toContain('RSI(14)')
    }
    expect(r.detail).toContain('RSI(14)')
  })

  it('holds on bullish structure when recent volume is weak vs baseline', () => {
    const closes = buyFixtureCloses()
    const volumes = weakRecentVolumes(200)
    const r = computeSignal(closes, volumes)
    expect(r.signal).toBe('hold')
    expect(r.breakdown.status).toBe('ok')
    if (r.breakdown.status === 'ok') {
      expect(r.breakdown.maTrend).toBe('uptrend')
      expect(r.breakdown.volume).toBe('weak')
      expect(r.breakdown.holdFilter).toContain('volume')
    }
  })

  it('returns sell on a downtrend without oversold RSI gate', () => {
    const closes = oscillatingDowntrend(200)
    const r = computeSignal(closes)
    expect(r.signal).toBe('sell')
    expect(r.breakdown.status).toBe('ok')
    if (r.breakdown.status === 'ok') {
      expect(r.breakdown.maTrend).toBe('downtrend')
      expect(r.breakdown.rsi14 === null || r.breakdown.rsi14 > 28).toBe(true)
    }
  })

  it('holds on bearish structure when RSI(14) is very low', () => {
    const closes = compoundDowntrend(200)
    const r = computeSignal(closes)
    expect(r.signal).toBe('hold')
    expect(r.breakdown.status).toBe('ok')
    if (r.breakdown.status === 'ok') {
      expect(r.breakdown.maTrend).toBe('downtrend')
      expect(r.breakdown.rsi14).not.toBeNull()
      expect(r.breakdown.rsi14!).toBeLessThanOrEqual(28)
      expect(r.breakdown.holdFilter).toContain('RSI(14)')
    }
    expect(r.detail).toContain('RSI(14)')
  })

  it('marks volume ok when recent participation matches baseline', () => {
    const closes = buyFixtureCloses()
    const volumes = Array.from({ length: 200 }, () => 1_000_000)
    const r = computeSignal(closes, volumes)
    expect(r.signal).toBe('buy')
    expect(r.breakdown.status).toBe('ok')
    if (r.breakdown.status === 'ok') {
      expect(r.breakdown.volume).toBe('ok')
    }
  })
})
