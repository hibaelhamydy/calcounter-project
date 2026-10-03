import { describe, expect, it } from 'vitest'
import { formatDateLabel } from './dateFormat'

describe('formatDateLabel', () => {
  it('formats a YYYY-MM-DD key as a short weekday/month/day label', () => {
    // 2026-01-15 is a Thursday.
    expect(formatDateLabel('2026-01-15')).toBe('Thu, Jan 15')
  })

  it('parses the date in local time, not UTC (no off-by-one day shift)', () => {
    // A naive `new Date('2026-01-01')` parses as UTC midnight, which rolls
    // back to Dec 31 in any timezone behind UTC. formatDateLabel builds the
    // Date from separate y/m/d parts specifically to avoid that.
    const label = formatDateLabel('2026-01-01')
    expect(label).toContain('Jan 1')
    expect(label).not.toContain('Dec 31')
  })

  it('handles single-digit months and days', () => {
    expect(formatDateLabel('2026-03-05')).toBe('Thu, Mar 5')
  })
})
