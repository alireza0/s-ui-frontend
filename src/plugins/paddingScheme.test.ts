import { describe, it, expect } from 'vitest'
import { DefaultPaddingScheme, MaxBound, generatePaddingScheme, isDefaultPaddingScheme } from './paddingScheme'

// A generated scheme must keep the default's shape exactly -- same lines,
// same segments, same check marks, same fixed sizes -- and move only the
// ranges. The generator's tuning values (jitter, cap, minimum width) are
// deliberately not asserted: retuning the generator must not break this
// test. It mirrors the backend test in service/anytls_padding_test.go.
describe('generatePaddingScheme', () => {
  it('keeps the default shape and only moves ranges', () => {
    const seen = new Set<string>()
    for (let run = 0; run < 100; run++) {
      const scheme = generatePaddingScheme()
      expect(scheme).toHaveLength(DefaultPaddingScheme.length)
      const joined = scheme.join('\n')
      expect(joined).not.toBe(DefaultPaddingScheme.join('\n'))
      seen.add(joined)
      scheme.forEach((line, i) => {
        const [key, value] = line.split(/=(.*)/s).slice(0, 2)
        const [defKey, defValue] = DefaultPaddingScheme[i].split(/=(.*)/s).slice(0, 2)
        expect(key).toBe(defKey)
        if (defKey === 'stop') {
          expect(line).toBe(DefaultPaddingScheme[i])
          return
        }
        const segments = value.split(',')
        const defSegments = defValue.split(',')
        expect(segments).toHaveLength(defSegments.length)
        segments.forEach((segment, j) => {
          const def = /^(\d+)-(\d+)$/.exec(defSegments[j])
          if (!def || def[1] === def[2]) {
            expect(segment).toBe(defSegments[j])
            return
          }
          const match = /^(\d+)-(\d+)$/.exec(segment)
          expect(match, `segment ${segment}`).not.toBeNull()
          const lo = Number(match![1])
          const hi = Number(match![2])
          expect(lo).toBeGreaterThanOrEqual(10)
          expect(hi).toBeLessThanOrEqual(MaxBound)
          expect(hi).toBeGreaterThan(lo)
        })
      })
    }
    expect(seen.size).toBeGreaterThanOrEqual(90)
  })

  it('recognizes the default scheme', () => {
    expect(isDefaultPaddingScheme([...DefaultPaddingScheme])).toBe(true)
    expect(isDefaultPaddingScheme(generatePaddingScheme())).toBe(false)
    expect(isDefaultPaddingScheme([])).toBe(false)
    expect(isDefaultPaddingScheme(undefined)).toBe(false)
  })
})
