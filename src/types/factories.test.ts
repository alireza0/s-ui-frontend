import { describe, it, expect } from 'vitest'
import { InTypes, createInbound } from './inbounds'
import { OutTypes, createOutbound } from './outbounds'
import { EpTypes, createEndpoint } from './endpoints'
import { SrvTypes, createSrv } from './services'
import { DnsTypes, createDnsServer } from './dns'

// The five factories have unrelated return types, so the shared table below
// addresses them through the one shape every result has.
type Made = { type: string, tag?: string }
type Factory = (type: string, json?: Record<string, unknown>) => Made

// Each factory reads a defaults table keyed by protocol. Adding a protocol to
// the type list and forgetting the table entry produces an object with no type
// at all, which the panel then saves. These tests exist to catch that drift.
describe.each([
  ['inbound', InTypes, createInbound as Factory],
  ['outbound', OutTypes, createOutbound as Factory],
  ['endpoint', EpTypes, createEndpoint as Factory],
  ['service', SrvTypes, createSrv as Factory],
  ['dns server', DnsTypes, createDnsServer as Factory],
] as const)('%s defaults', (_label, types, create) => {
  const values = Object.values(types) as string[]

  it('covers every declared type', () => {
    for (const type of values) {
      const made = create(type)
      expect(made, `no defaults for ${type}`).toBeDefined()
      expect(made.type, `wrong type for ${type}`).toBe(type)
    }
  })

  it('hands back a fresh object each time, not the shared default', () => {
    for (const type of values) {
      expect(create(type)).not.toBe(create(type))
    }
  })

  it('lets the caller override the defaults', () => {
    for (const type of values) {
      expect(create(type, { tag: 'chosen-tag' }).tag).toBe('chosen-tag')
    }
  })
})

// Mutating a returned object must not leak into the next one. A defaults table
// holding a shared array or object would fail this.
describe('defaults are not shared between instances', () => {
  it('keeps a nested array private to the instance it came from', () => {
    const first = createInbound(InTypes.AnyTls) as { padding_scheme?: string[] }
    const second = createInbound(InTypes.AnyTls) as { padding_scheme?: string[] }
    first.padding_scheme?.push('injected')
    expect(second.padding_scheme).not.toContain('injected')
  })

  it('keeps a nested object private to the instance it came from', () => {
    const first = createInbound(InTypes.ShadowTLS) as { handshake?: { server_port?: number } }
    const second = createInbound(InTypes.ShadowTLS) as { handshake?: { server_port?: number } }
    if (first.handshake) first.handshake.server_port = 1
    expect(second.handshake?.server_port).toBe(443)
  })
})

// sing-box refuses to start an inbound of these types without the secret, so
// the factory fills one in rather than leaving the panel to save a dead config.
describe('inbound secrets', () => {
  it('gives snell a psk of the length sing-box requires', () => {
    const snell = createInbound(InTypes.Snell) as { psk?: string }
    expect(snell.psk).toHaveLength(32)
  })

  it('keeps a psk the caller supplied', () => {
    const snell = createInbound(InTypes.Snell, { psk: 'kept' }) as { psk?: string }
    expect(snell.psk).toBe('kept')
  })

  it('gives shadowtls v2 a password and v3 none', () => {
    const v2 = createInbound(InTypes.ShadowTLS, { version: 2 }) as { password?: string }
    const v3 = createInbound(InTypes.ShadowTLS, { version: 3 }) as { password?: string }
    expect(v2.password).toHaveLength(16)
    expect(v3.password).toBeUndefined()
  })

  it('defaults shadowtls to v3, which carries no inbound password', () => {
    const made = createInbound(InTypes.ShadowTLS) as { version?: number, password?: string }
    expect(made.version).toBe(3)
    expect(made.password).toBeUndefined()
  })

  it('leaves protocols that need no inbound secret alone', () => {
    const direct = createInbound(InTypes.Direct) as { psk?: string, password?: string }
    expect(direct.psk).toBeUndefined()
    expect(direct.password).toBeUndefined()
  })
})
