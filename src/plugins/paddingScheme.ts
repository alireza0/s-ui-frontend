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
// largest bound a generated scheme may use. These are the generator's only
// tuning knobs; the tests assert the shape invariants, never these values,
// so retuning needs no test surgery.
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

// Processes a single segment string (e.g., "100-400" or "c").
// If it's a jitter-able range, returns a new jittered range string.
// Otherwise, returns the original segment.
function processSegment(segment: string): string {
  const match = /^(\d+)-(\d+)$/.exec(segment)
  if (!match) return segment // Not a range (e.g., "c")

  const lo = Number(match[1])
  const hi = Number(match[2])
  if (lo === hi) return segment // Fixed range (e.g., "30-30")

  const [newLo, newHi] = jitterRange(lo, hi)
  return `${newLo}-${newHi}`
}

// Derive one installation's scheme from the default. The structure is
// preserved exactly -- same stop, same packet lines, same segment order,
// same check marks -- because the shape is what makes the traffic
// plausible. Only true ranges move. Fixed segments (30-30, 9-9) stay
// untouched; they are handshake-sized and are not where the fingerprint
// lives.
export function generatePaddingScheme(): string[] {
  return DefaultPaddingScheme.map((line) => {
    const [key, value] = line.split('=', 2)
    if (value === undefined || key === 'stop') {
      return line
    }
    const newSegments = value.split(',').map(processSegment)
    return `${key}=${newSegments.join(',')}`
  })
}

export function isDefaultPaddingScheme(lines?: string[]): boolean {
  if (!lines || lines.length !== DefaultPaddingScheme.length) {
    return false
  }
  return lines.every((line, index) => line === DefaultPaddingScheme[index])
}

// Which side of the form's Default / Random switch a scheme belongs to.
// An empty field is the default side: leaving the scheme empty means the
// core default, and it keeps following the library when the library's
// default changes, so empty must never read as "random".
export function paddingSchemeMode(lines?: string[]): 'default' | 'random' {
  if (!lines || lines.join('').trim() === '') {
    return 'default'
  }
  return isDefaultPaddingScheme(lines) ? 'default' : 'random'
}
