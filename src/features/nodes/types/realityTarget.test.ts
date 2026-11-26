import { describe, expect, it } from 'vitest'
import { realityTargetIsListener } from './realityTarget'

describe('REALITY target selection', () => {
  it('blocks the confirmed node domain on the same socket', () => {
    expect(realityTargetIsListener('::', 443, 443, 'NODE.EXAMPLE.', true, '192.0.2.10')).toBe(true)
    expect(realityTargetIsListener('192.0.2.10', 443, 443, 'node.example', true, '192.0.2.10')).toBe(true)
  })

  it('allows a native TLS service on a different port or address', () => {
    expect(realityTargetIsListener('::', 443, 8443, 'node.example', true, '192.0.2.10')).toBe(false)
    expect(realityTargetIsListener('192.0.2.10', 443, 443, '127.0.0.1', false)).toBe(false)
    expect(realityTargetIsListener('0.0.0.0', 443, 443, '[::1]', false)).toBe(false)
  })

  it('allows an external target and defers allocation-dependent checks to the panel', () => {
    expect(realityTargetIsListener('::', 443, 443, 'external.example', false)).toBe(false)
    expect(realityTargetIsListener('::', undefined, 443, 'node.example', true)).toBe(false)
  })

  it('recognizes loopback and mapped IPv4 addresses', () => {
    expect(realityTargetIsListener('::', 443, 443, 'localhost', false)).toBe(true)
    expect(realityTargetIsListener('192.0.2.10', 443, 443, '[::ffff:192.0.2.10]', false)).toBe(true)
  })
})
