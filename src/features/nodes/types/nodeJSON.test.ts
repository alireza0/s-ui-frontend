import { expect, it } from 'vitest'
import { reactive } from 'vue'
import { clone } from './nodeJSON'

it('creates independent JSON snapshots of nested Vue drafts', () => {
  const nested = reactive({ port: 443, optional: undefined })
  const draft = reactive({ nested, values: [nested], date: new Date('2026-01-01T00:00:00Z') })
  const snapshot = clone(draft)
  expect(snapshot).toEqual({ nested: { port: 443 }, values: [{ port: 443 }], date: '2026-01-01T00:00:00.000Z' })
  snapshot.nested.port = 8443
  expect(draft.nested.port).toBe(443)
  expect(snapshot.values[0].port).toBe(443)
})
