import { describe, expect, it } from 'vitest'
import { formatLastUpdatedIct } from '@/shared/utils/format'

describe('formatLastUpdatedIct', () => {
  it('formats as DD/MM/YY HH:MM:SSz+7 in Asia/Bangkok', () => {
    const ms = Date.UTC(2026, 3, 11, 5, 30, 0)
    const s = formatLastUpdatedIct(ms)
    expect(s).toMatch(
      /^\d{2}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}z\+7$/,
    )
    expect(s).toContain('11/04/26')
    expect(s).toContain('12:30:00')
  })
})
