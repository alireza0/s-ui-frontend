import { describe, it, expect } from 'vitest'
import { createClient, randomConfigs, updateConfigs, shuffleConfigs } from './clients'

describe('createClient', () => {
  it('names a new client instead of leaving it blank', () => {
    expect(createClient().name).toHaveLength(8)
  })

  it('gives every client its own name', () => {
    expect(createClient().name).not.toBe(createClient().name)
  })

  // The factory used to write the generated name onto the shared default before
  // copying it, so the "default" drifted with every call.
  it('does not let one client\'s fields reach the next', () => {
    const first = createClient()
    first.inbounds.push(99)
    first.desc = 'edited'
    const second = createClient()
    expect(second.inbounds).toEqual([])
    expect(second.desc).toBe('')
  })

  it('lets the caller override any field', () => {
    const made = createClient({ name: 'chosen', volume: 42 })
    expect(made.name).toBe('chosen')
    expect(made.volume).toBe(42)
  })

  it('fills in credentials for every protocol', () => {
    expect(Object.keys(createClient().config ?? {}).length).toBeGreaterThan(0)
  })

  it('keeps credentials the caller supplied and adds the missing ones', () => {
    const made = createClient({ config: { mixed: { username: 'kept', password: 'kept-pass' } } })
    expect(made.config?.mixed.username).toBe('kept')
    expect(made.config?.vmess).toBeDefined()
  })
})

describe('randomConfigs', () => {
  it('carries the given name into every protocol that identifies by one', () => {
    const configs = randomConfigs('alice')
    for (const [protocol, config] of Object.entries(configs)) {
      const label = config.name ?? config.username
      expect(label, `${protocol} carries no name`).toBe('alice')
    }
  })

  it('does not repeat itself between calls', () => {
    expect(randomConfigs('alice')).not.toEqual(randomConfigs('alice'))
  })
})

describe('updateConfigs', () => {
  it('renames through whichever field the protocol uses', () => {
    const configs = updateConfigs(randomConfigs('alice'), 'bob')
    for (const [protocol, config] of Object.entries(configs)) {
      const label = config.name ?? config.username
      expect(label, `${protocol} kept the old name`).toBe('bob')
    }
  })

  it('leaves the credentials themselves untouched', () => {
    const before = randomConfigs('alice')
    const password = before.mixed.password
    expect(updateConfigs(before, 'bob').mixed.password).toBe(password)
  })
})

describe('shuffleConfigs', () => {
  it('replaces every credential when no protocol is named', () => {
    const configs = randomConfigs('alice')
    const before = structuredClone(configs)
    shuffleConfigs(configs)
    expect(configs.mixed.password).not.toBe(before.mixed.password)
    expect(configs.vmess.uuid).not.toBe(before.vmess.uuid)
  })

  it('touches only the protocol it was given', () => {
    const configs = randomConfigs('alice')
    const before = structuredClone(configs)
    shuffleConfigs(configs, 'vmess')
    expect(configs.vmess.uuid).not.toBe(before.vmess.uuid)
    expect(configs.mixed.password).toBe(before.mixed.password)
  })

  it('leaves the name alone while rotating the secret', () => {
    const configs = randomConfigs('alice')
    shuffleConfigs(configs)
    expect(configs.mixed.username).toBe('alice')
  })
})
