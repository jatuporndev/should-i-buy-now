function rsiFromAvgs(avgGain: number, avgLoss: number): number {
  if (avgLoss === 0) return avgGain === 0 ? 50 : 100
  return 100 - 100 / (1 + avgGain / avgLoss)
}

/** Wilder RSI for the last bar; needs period + 1 closes. */
export function rsiWilderLast(closes: number[], period: number): number | null {
  if (closes.length < period + 1) return null
  const changes: number[] = []
  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i]! - closes[i - 1]!)
  }
  let avgGain = 0
  let avgLoss = 0
  for (let i = 0; i < period; i++) {
    const c = changes[i]!
    if (c > 0) avgGain += c
    else avgLoss += -c
  }
  avgGain /= period
  avgLoss /= period

  for (let i = period; i < changes.length; i++) {
    const c = changes[i]!
    const gain = c > 0 ? c : 0
    const loss = c < 0 ? -c : 0
    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period
  }

  return rsiFromAvgs(avgGain, avgLoss)
}

/** Wilder RSI for every bar in a single O(n) pass. Index i holds RSI at closes[i]. */
export function rsiWilderSeries(closes: number[], period: number): (number | null)[] {
  const n = closes.length
  const result: (number | null)[] = new Array(n).fill(null)
  if (n < period + 1) return result

  let avgGain = 0
  let avgLoss = 0
  for (let i = 0; i < period; i++) {
    const c = closes[i + 1]! - closes[i]!
    if (c > 0) avgGain += c
    else avgLoss += -c
  }
  avgGain /= period
  avgLoss /= period

  result[period] = rsiFromAvgs(avgGain, avgLoss)

  for (let i = period; i < n - 1; i++) {
    const c = closes[i + 1]! - closes[i]!
    const gain = c > 0 ? c : 0
    const loss = c < 0 ? -c : 0
    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period
    result[i + 1] = rsiFromAvgs(avgGain, avgLoss)
  }

  return result
}
