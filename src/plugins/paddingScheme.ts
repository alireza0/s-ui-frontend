import RandomUtil from './randomUtil'

// The AnyTLS library default padding scheme, line for line. Every
// installation ships with it, and the AnyTLS FAQ lists that shared scheme
// as a fingerprint of its own: the packet-size distribution is identical
// everywhere. The scheme is only ever a shape -- the server pushes it to
// clients at runtime -- so each installation can safely carry a variant.
export const DefaultPaddingScheme: string[] = [
  'stop=8',
  '0=30-30',
  '1=100-400',
  '2=400-500,c,500-1000,c,500-1000,c,500-1000,c,500-1000',
  '3=9-9,500-1000',
  '4=500-1000',
  '5=500-1000',
  '6=500-1000',
  '7=500-1000',
]

// How far a range bound may move from the default, in percent, and the
// largest bound a generated scheme may use. The backend generator in
// service/anytls_padding.go applies the same rules; the two implementations
// produce different schemes, never shared ones, which is the point. These
// are the generator's only tuning knobs; the tests assert the shape
// invariants, never these values, so retuning needs no test surgery.
const JitterPct = 20
export const MaxBound = 1400

function jitterBound(bound: number): number {
  const pct = RandomUtil.randomIntRange(-JitterPct, JitterPct)
  const scaled = Math.floor((bound * (100 + pct)) / 100)
  return Math.max(10, Math.round(scaled / 10) * 10)
}

function jitterRange(lo: number, hi: number): [number, number] {
  let newLo = jitterBound(lo)
  let newHi = jitterBound(hi)
  if (newHi > MaxBound) newHi = MaxBound
  // Keep a usable width: at least a quarter of the original, never under 40.
  const minWidth = Math.max(40, Math.floor((hi - lo) / 4))
  if (newHi - newLo < minWidth) {
    newHi = newLo + minWidth
    if (newHi > MaxBound) {
      newHi = MaxBound
      newLo = newHi - minWidth
    }
  }
  return [newLo, newHi]
}

// Derive one installation's scheme from the default. The structure is
// preserved exactly -- same stop, same packet lines, same segment order,
// same check marks -- because the shape is what makes the traffic
// plausible. Only true ranges move. Fixed segments (30-30, 9-9) stay
// untouched; they are handshake-sized and are not where the fingerprint
// lives.
export function generatePaddingScheme(): string[] {
  return DefaultPaddingScheme.map((line) => {
    const eq = line.indexOf('=')
    if (eq < 0) return line
    const key = line.slice(0, eq)
    if (key === 'stop') return line
    const segments = line
      .slice(eq + 1)
      .split(',')
      .map((segment) => {
        const match = /^(\d+)-(\d+)$/.exec(segment)
        if (!match) return segment
        const lo = Number(match[1])
        const hi = Number(match[2])
        if (lo === hi) return segment
        const [newLo, newHi] = jitterRange(lo, hi)
        return `${newLo}-${newHi}`
      })
    return `${key}=${segments.join(',')}`
  })
}

export function isDefaultPaddingScheme(lines?: string[]): boolean {
  return !!lines && lines.join('\n') === DefaultPaddingScheme.join('\n')
}
