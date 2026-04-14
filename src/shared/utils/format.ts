export function formatMoney(n: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    /** Avoid "US$" on iPhone / many non-US locales where `symbol` disambiguates USD. */
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 2,
  }).format(n)
}

export function formatPct(n: number): string {
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}

/** Daily bar (date only), Asia/Bangkok; `tsSeconds` is Unix seconds (e.g. Yahoo chart). */
export function formatChartDayIct(tsSeconds: number): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(tsSeconds * 1000))
}

/** Same bar with clock time (24h), Asia/Bangkok — for crosshair readout. */
export function formatChartDateTimeIct(tsSeconds: number): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(tsSeconds * 1000))
}

/** Compact stamp in Asia/Bangkok, e.g. `11/04/26 02:59:10z+7`. */
export function formatLastUpdatedIct(ms: number): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok',
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date(ms))

  const v = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? ''

  return `${v('day')}/${v('month')}/${v('year')} ${v('hour')}:${v('minute')}:${v('second')}z+7`
}
