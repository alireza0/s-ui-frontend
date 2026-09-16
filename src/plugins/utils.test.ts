import { describe, it, expect, vi, afterEach } from 'vitest'
import { FindDiff, HumanReadable } from './utils'

// The formatters render through i18n, so these assert the English strings.
describe('HumanReadable.sizeFormat', () => {
  it('renders a dash for nothing to show', () => {
    expect(HumanReadable.sizeFormat(0)).toBe('-')
    expect(HumanReadable.sizeFormat(-1)).toBe('-')
  })

  it('keeps bytes whole and scales at every boundary', () => {
    expect(HumanReadable.sizeFormat(512)).toBe('512 B')
    expect(HumanReadable.sizeFormat(1023)).toBe('1023 B')
    expect(HumanReadable.sizeFormat(1024)).toBe('1.00 KB')
    expect(HumanReadable.sizeFormat(1024 ** 2)).toBe('1.00 MB')
    expect(HumanReadable.sizeFormat(1024 ** 3)).toBe('1.00 GB')
    expect(HumanReadable.sizeFormat(1024 ** 4)).toBe('1.00 TB')
    expect(HumanReadable.sizeFormat(1024 ** 5)).toBe('1.00 PB')
  })

  it('honours the requested precision', () => {
    expect(HumanReadable.sizeFormat(1536, 0)).toBe('2 KB')
    expect(HumanReadable.sizeFormat(1536, 3)).toBe('1.500 KB')
  })

  it('has no ceiling above petabytes', () => {
    expect(HumanReadable.sizeFormat(1024 ** 6)).toBe('1024.00 PB')
  })
})

// Packets count in thousands, not in 1024s. The two scales are easy to mix up.
describe('HumanReadable.packetFormat', () => {
  it('scales on decimal boundaries', () => {
    expect(HumanReadable.packetFormat(999)).toBe('999 p')
    expect(HumanReadable.packetFormat(1000)).toBe('1.00 Kp')
    expect(HumanReadable.packetFormat(1_000_000)).toBe('1.00 Mp')
    expect(HumanReadable.packetFormat(1_000_000_000)).toBe('1.00 Gp')
  })

  it('renders a dash for nothing to show', () => {
    expect(HumanReadable.packetFormat(0)).toBe('-')
    expect(HumanReadable.packetFormat(-5)).toBe('-')
  })
})

describe('HumanReadable.formatSecond', () => {
  it('scales through minutes, hours and days', () => {
    expect(HumanReadable.formatSecond(59)).toBe('59s')
    expect(HumanReadable.formatSecond(60)).toBe('1m')
    expect(HumanReadable.formatSecond(3599)).toBe('60m')
    expect(HumanReadable.formatSecond(3600)).toBe('1h')
    expect(HumanReadable.formatSecond(86400)).toBe('1d')
  })

  it('appends the leftover hours to a day count, and drops a zero remainder', () => {
    expect(HumanReadable.formatSecond(86400 + 7200)).toBe('1d 2h')
    expect(HumanReadable.formatSecond(86400 * 2)).toBe('2d')
  })

  it('renders a dash for nothing to show', () => {
    expect(HumanReadable.formatSecond(0)).toBe('-')
    expect(HumanReadable.formatSecond(-1)).toBe('-')
  })
})

describe('HumanReadable.remainedDays', () => {
  afterEach(() => { vi.useRealTimers() })

  const freeze = (iso: string) => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(iso))
  }

  it('treats zero as no expiry at all', () => {
    freeze('2026-01-01T00:00:00Z')
    expect(HumanReadable.remainedDays(0)).toBe('infinite')
  })

  it('reports a past expiry as expired', () => {
    freeze('2026-01-01T00:00:00Z')
    const yesterday = Date.now() / 1000 - 86400
    expect(HumanReadable.remainedDays(yesterday)).toBe('Expired')
  })

  it('floors the remaining days rather than rounding', () => {
    freeze('2026-01-01T00:00:00Z')
    const now = Date.now() / 1000
    expect(HumanReadable.remainedDays(now + 86400 * 3)).toBe('3 d')
    // 3 days and 23 hours is still 3 days, not 4
    expect(HumanReadable.remainedDays(now + 86400 * 3 + 3600 * 23)).toBe('3 d')
  })

  it('reports an expiry inside the next day as zero days, not as expired', () => {
    freeze('2026-01-01T00:00:00Z')
    expect(HumanReadable.remainedDays(Date.now() / 1000 + 3600)).toBe('0 d')
  })
})

describe('FindDiff.deepCompare', () => {
  it('compares primitives by identity, without coercing', () => {
    expect(FindDiff.deepCompare(1, 1)).toBe(true)
    expect(FindDiff.deepCompare(1, '1')).toBe(false)
    expect(FindDiff.deepCompare(null, null)).toBe(true)
  })

  it('compares arrays by order and length', () => {
    expect(FindDiff.deepCompare([1, 2], [1, 2])).toBe(true)
    expect(FindDiff.deepCompare([1, 2], [2, 1])).toBe(false)
    expect(FindDiff.deepCompare([1], [1, 2])).toBe(false)
  })

  it('recurses into nested objects', () => {
    expect(FindDiff.deepCompare({ a: { b: [1] } }, { a: { b: [1] } })).toBe(true)
    expect(FindDiff.deepCompare({ a: { b: [1] } }, { a: { b: [2] } })).toBe(false)
  })

  // This drives whether the panel thinks there is anything to save, so the
  // undefined handling is pinned deliberately rather than left to chance.
  it('ignores keys whose value is undefined on either side', () => {
    expect(FindDiff.deepCompare({ a: 1, b: undefined }, { a: 1 })).toBe(true)
    expect(FindDiff.deepCompare({ a: 1 }, { a: 1, b: undefined })).toBe(true)
  })

  it('does not treat a missing key as equal to a null one', () => {
    expect(FindDiff.deepCompare({ a: 1, b: null }, { a: 1 })).toBe(false)
  })

  it('rejects null and undefined against an object', () => {
    expect(FindDiff.deepCompare(null, {})).toBe(false)
    expect(FindDiff.deepCompare(undefined, {})).toBe(false)
  })

  // Characterisation, not an endorsement: the object branch compares by key, and
  // an array's keys are its indices, so an array and an object that happens to
  // carry the same index keys compare equal. Nothing in the panel puts an array
  // and an object at the same path today, which is why this has never bitten.
  it('does not distinguish an array from an object with the same index keys', () => {
    expect(FindDiff.deepCompare([], {})).toBe(true)
    expect(FindDiff.deepCompare([1, 2], { 0: 1, 1: 2 })).toBe(true)
  })
})
