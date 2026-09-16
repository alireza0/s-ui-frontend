import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import Data, { type LoadedData } from './data'

// checkTag and checkClientName raise a toast on a clash, which needs a mounted
// Vue app. The tests care about the verdict, not the toast.
vi.mock('notivue', () => ({
  push: { error: vi.fn(), success: vi.fn() },
}))

beforeEach(() => {
  setActivePinia(createPinia())
})

// api/load only ships a section when something changed since the last poll.
// Every other poll answers with onlines and maintenance alone, so a missing
// section has to mean "unchanged", never "empty".
describe('setNewData with a partial payload', () => {
  const seed = () => {
    const store = Data()
    store.setNewData({
      config: {},
      clients: [{ enable: true, name: 'alice', inbounds: [], volume: 0, expiry: 0, up: 0, down: 0, desc: '', group: '' }],
      inbounds: [{ id: 1, type: 'direct', tag: 'in-1' }],
      outbounds: [{ id: 1, type: 'direct', tag: 'out-1' }],
      services: [{ id: 1, type: 'derp', tag: 'srv-1' }],
      endpoints: [{ id: 1, type: 'wireguard', tag: 'ep-1' }],
      tls: [{ id: 1, name: 'tls-1' }],
      subURI: 'https://example.test/sub/',
      os: 'linux',
    } as unknown as LoadedData)
    return store
  }

  it('leaves every section alone when the poll carries none of them', () => {
    const store = seed()
    store.setNewData({} as LoadedData)
    expect(store.inbounds).toHaveLength(1)
    expect(store.outbounds).toHaveLength(1)
    expect(store.services).toHaveLength(1)
    expect(store.endpoints).toHaveLength(1)
    expect(store.clients).toHaveLength(1)
    expect(store.tlsConfigs).toHaveLength(1)
    expect(store.subURI).toBe('https://example.test/sub/')
    expect(store.os).toBe('linux')
  })

  it('replaces only the section it was sent', () => {
    const store = seed()
    store.setNewData({ inbounds: [] } as unknown as LoadedData)
    expect(store.inbounds).toHaveLength(0)
    expect(store.outbounds).toHaveLength(1)
    expect(store.clients).toHaveLength(1)
  })

  it('accepts an explicitly empty section as a real change', () => {
    const store = seed()
    store.setNewData({ clients: [] } as LoadedData)
    expect(store.clients).toHaveLength(0)
  })

  it('stamps the load time so the next poll can ask for changes only', () => {
    const store = Data()
    expect(store.lastLoad).toBe(0)
    store.setNewData({} as LoadedData)
    expect(store.lastLoad).toBeGreaterThan(0)
  })
})

// Regression: turning traffic accounting off sends false, and a truthiness test
// discarded it, so the panel kept showing accounting as on until a page reload.
describe('setNewData and enableTraffic', () => {
  it('applies a false the backend actually sent', () => {
    const store = Data()
    store.setNewData({ enableTraffic: true } as LoadedData)
    expect(store.enableTraffic).toBe(true)
    store.setNewData({ enableTraffic: false } as LoadedData)
    expect(store.enableTraffic).toBe(false)
  })

  it('keeps the current value when the key is absent', () => {
    const store = Data()
    store.setNewData({ enableTraffic: true } as LoadedData)
    store.setNewData({} as LoadedData)
    expect(store.enableTraffic).toBe(true)
  })
})

describe('checkTag', () => {
  beforeEach(() => {
    const store = Data()
    store.setNewData({
      inbounds: [{ id: 1, type: 'direct', tag: 'taken' }, { id: 2, type: 'direct', tag: 'other' }],
      outbounds: [{ id: 1, type: 'direct', tag: 'out-taken' }],
    } as unknown as LoadedData)
  })

  it('rejects a tag another object already holds', () => {
    expect(Data().checkTag('inbound', 0, 'taken')).toBe(true)
  })

  it('accepts a tag nobody holds', () => {
    expect(Data().checkTag('inbound', 0, 'free')).toBe(false)
  })

  it('lets an object keep its own tag while being edited', () => {
    expect(Data().checkTag('inbound', 1, 'taken')).toBe(false)
  })

  it('still rejects a sibling\'s tag while being edited', () => {
    expect(Data().checkTag('inbound', 1, 'other')).toBe(true)
  })

  it('keeps the lists separate, so an inbound tag frees the name for an outbound', () => {
    expect(Data().checkTag('outbound', 0, 'taken')).toBe(false)
  })

  it('passes an object kind it does not know', () => {
    expect(Data().checkTag('nonsense', 0, 'taken')).toBe(false)
  })
})

describe('checkClientName', () => {
  beforeEach(() => {
    const store = Data()
    store.setNewData({
      clients: [
        { id: 1, enable: true, name: 'alice', inbounds: [], volume: 0, expiry: 0, up: 0, down: 0, desc: '', group: '' },
        { id: 2, enable: true, name: 'bob', inbounds: [], volume: 0, expiry: 0, up: 0, down: 0, desc: '', group: '' },
      ],
    } as unknown as LoadedData)
  })

  it('rejects a name another client already holds', () => {
    expect(Data().checkClientName(0, 'alice')).toBe(true)
  })

  it('accepts a free name', () => {
    expect(Data().checkClientName(0, 'carol')).toBe(false)
  })

  it('lets a client keep its own name while being edited', () => {
    expect(Data().checkClientName(1, 'alice')).toBe(false)
  })

  it('still rejects another client\'s name while being edited', () => {
    expect(Data().checkClientName(1, 'bob')).toBe(true)
  })
})

describe('checkBulkClientNames', () => {
  beforeEach(() => {
    Data().setNewData({
      clients: [{ id: 1, enable: true, name: 'alice', inbounds: [], volume: 0, expiry: 0, up: 0, down: 0, desc: '', group: '' }],
    } as unknown as LoadedData)
  })

  it('rejects a batch that repeats a name inside itself', () => {
    expect(Data().checkBulkClientNames(['carol', 'carol'])).toBe(true)
  })

  it('rejects a batch that collides with an existing client', () => {
    expect(Data().checkBulkClientNames(['alice'])).toBe(true)
  })

  it('accepts a batch of names nobody holds', () => {
    expect(Data().checkBulkClientNames(['carol', 'dave'])).toBe(false)
  })
})
