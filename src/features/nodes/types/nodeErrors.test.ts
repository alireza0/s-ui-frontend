import {expect, it} from 'vitest'
import {nodeErrorCode} from './nodeErrors'

it('recognizes node error codes in both API envelope forms', () => {
  expect(nodeErrorCode('save Nodes: template_version_conflict')).toBe('template_version_conflict')
  expect(nodeErrorCode(': resource_version_conflict')).toBe('resource_version_conflict')
  expect(nodeErrorCode('template_version_conflict')).toBe('template_version_conflict')
  expect(nodeErrorCode('Unexpected response')).toBe('Unexpected response')
})
