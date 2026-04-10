import { describe, expect, it } from 'vitest'
import {
  cacheBustedCsvUrl,
  parseWatchlistCsv,
} from '@/features/quote/services/watchlistCsv'

describe('parseWatchlistCsv', () => {
  it('reads first column, ignores header', () => {
    expect(
      parseWatchlistCsv('Symbol\nAAPL\nMSFT\n'),
    ).toEqual(['AAPL', 'MSFT'])
  })

  it('accepts ticker header and strips BOM', () => {
    expect(
      parseWatchlistCsv('\uFEFFTicker\nbrk-b\n^GSPC\n'),
    ).toEqual(['BRK-B', '^GSPC'])
  })

  it('dedupes and skips blanks', () => {
    expect(parseWatchlistCsv('AAPL\n\naapl\nGOOG\n')).toEqual(['AAPL', 'GOOG'])
  })

  it('allows futures-style symbols', () => {
    expect(parseWatchlistCsv('GC=F\n')).toEqual(['GC=F'])
  })

  it('returns empty when no valid rows', () => {
    expect(parseWatchlistCsv('BAD@SYM\n')).toEqual([])
  })
})

describe('cacheBustedCsvUrl', () => {
  it('appends _ to absolute URLs', () => {
    const out = cacheBustedCsvUrl(
      'https://docs.google.com/spreadsheets/d/e/x/pub?output=csv',
    )
    expect(out).toContain('output=csv')
    expect(out).toMatch(/[?&]_=\d+/)
  })

  it('prefixes relative proxy path', () => {
    expect(cacheBustedCsvUrl('/api/watchlist-csv')).toMatch(
      /^\/api\/watchlist-csv\?_=\d+$/,
    )
  })
})
