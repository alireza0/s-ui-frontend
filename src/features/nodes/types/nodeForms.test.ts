import { describe, expect, it } from 'vitest'
import { isPublishedAddress, nodeStatus, openNodeInbound, serializeNodeInbound } from './nodeForms'
import type { NodeRecord, NodeInbound } from './nodes'

const node: NodeRecord = { id: 1, name: 'node', address: 'https://node.example', linkaddress: 'node.example', enable: true, template_id: 0, desired_revision: 7, applied_revision: 7, last_seen: 100 }
describe('node management forms', () => {
  it('accepts hostnames and rejects URLs/whitespace as published addresses', () => {
    expect(isPublishedAddress('server.example')).toBe(true)
    expect(isPublishedAddress('192.0.2.10')).toBe(true)
    expect(isPublishedAddress('server example')).toBe(false)
    expect(isPublishedAddress('https://server.example')).toBe(false)
    expect(isPublishedAddress('server.example:443')).toBe(false)
    expect(isPublishedAddress('2001:db8::1')).toBe(true)
    expect(isPublishedAddress('[2001:db8::1]')).toBe(true)
  })
  it('distinguishes saved intent, acknowledgement, offline, failure and confirmed disable', () => {
    expect(nodeStatus(node,101)).toBe('applied')
    expect(nodeStatus({...node,pending:true},101)).toBe('pending')
    expect(nodeStatus({...node,desired_revision:8},101)).toBe('pending')
    expect(nodeStatus({...node,last_error:'deployment_rejected'},101)).toBe('error')
    expect(nodeStatus({...node,last_error:'control_unreachable'},101)).toBe('offline')
    expect(nodeStatus(node,121)).toBe('offline')
    expect(nodeStatus({...node,enable:false},101)).toBe('disabled')
  })
  it('keeps TLS and protocol edits separate from all local IDs and generated users', () => {
    const source: NodeInbound = { id: 1, node_id: 2, tag: 'same-tag', type: 'vless', enable: true, options: { listen: '::', listen_port: 14443, tls: { enabled: true, server_name: 'node.example' } }, client_tls: {} }
    const opened = openNodeInbound(source)
    opened.form.listen_port = 15555;opened.tls.server.server_name='override.example'
    const saved=serializeNodeInbound(opened.form,opened.tls)
    expect(source.options.listen_port).toBe(14443)
    expect((source.options.tls as { server_name?: string }).server_name).toBe('node.example')
    expect(saved.options.listen_port).toBe(15555)
    expect((saved.options.tls as { server_name?: string }).server_name).toBe('override.example')
    expect(saved.options).not.toHaveProperty('id')
    expect(saved.options).not.toHaveProperty('tls_id')
    expect(saved.options).not.toHaveProperty('users')
    expect(saved.options).not.toHaveProperty('transport')
  })
})
