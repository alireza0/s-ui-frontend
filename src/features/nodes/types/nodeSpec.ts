import {
  nodeSupportsTLS,
  type NodeTemplate,
  type SpecEntry,
  type TemplateSpec,
  type ValueSource,
  type SpecOverride,
} from './nodes'
import { openNodeInbound, serializeNodeInbound } from './nodeForms'
import type { Inbound } from '@/types/inbounds'
import type { tls } from '@/types/tls'
export const handshakePath = '/tls/reality/handshake/server'
export const hostPath = '/transport/host'
import { clone } from './nodeJSON'
export { clone } from './nodeJSON'
export const emptySpec = (): TemplateSpec => ({
  schema_version: 1,
  config: { outbounds: [{ type: 'direct', tag: 'direct' }], route: { final: 'direct' } },
  entries: [],
})
export function inboundTemplateTitle(template: NodeTemplate): string {
  const protocol = template.protocol?.toUpperCase()
  return protocol && template.name.toUpperCase() !== protocol
    ? template.name + ' · ' + protocol
    : template.name
}
export function newEntry(protocol: SpecEntry['protocol'] = 'vless'): SpecEntry {
  const options: SpecEntry['options'] = { listen: '::' }
  const sources: SpecEntry['sources'] = { '/listen_port': { kind: 'node_generated', purpose: 'listen_port' } }
  if (nodeSupportsTLS(protocol)) {
    options.tls = {
      enabled: true,
      ...(['hysteria', 'hysteria2', 'tuic'].includes(protocol) ? { alpn: ['h3'] } : {}),
    }
    sources['/tls/server_name'] = { kind: 'node_parameter', name: 'primary_domain' }
    sources['/tls/certificate_binding'] = { kind: 'node_certificate', name: 'primary' }
  }
  if (protocol === 'shadowsocks') options.method = '2022-blake3-aes-128-gcm'
  if (protocol === 'snell') options.version = 6
  if (protocol === 'shadowtls')
    Object.assign(options, { version: 3, handshake: { server: '', server_port: 443 } })
  if (protocol === 'hysteria') Object.assign(options, { up_mbps: 100, down_mbps: 100 })
  return {
    connection_key: crypto.randomUUID(),
    name: protocol.toUpperCase(),
    protocol,
    enable: true,
    options,
    sources,
  }
}
export function openEntry(entry: SpecEntry) {
  const options = clone(entry.options)
  for (const [path, source] of Object.entries(entry.sources ?? {}))
    if (source.kind === 'literal') setPath(options, path, source.value)
  const state = openNodeInbound({
    tag: entry.name,
    type: entry.protocol,
    enable: entry.enable,
    options,
    client_tls: clone(entry.client_tls ?? {}),
  })
  const { addresses, ...client } = clone(entry.client_options ?? {})
  state.form.out_json = client
  if (Array.isArray(addresses)) state.form.addrs = addresses
  return state
}
function removeTLSSources(sources: Record<string, ValueSource>, prefix: string) {
  for (const path of Object.keys(sources)) {
    if (path.startsWith(prefix)) delete sources[path]
  }
}

function prepareTLSOptions(server: Record<string, unknown>, sources: Record<string, ValueSource>) {
  for (const key of ['certificate', 'key', 'certificate_path', 'key_path', 'certificate_provider'])
    delete server[key]
  const reality = server.reality as Record<string, unknown> | undefined
  if (server.enabled && reality?.enabled) {
    const handshake = reality.handshake as Record<string, unknown> | undefined
    if (handshake && (handshake.server || sources[handshakePath])) handshake.server_port ||= 443
  } else {
    removeTLSSources(sources, '/tls/reality/')
  }
  if (reality?.enabled) {
    delete reality.private_key
    delete reality.short_id
    delete sources['/tls/certificate_binding']
    sources['/tls/reality/private_key'] = { kind: 'node_generated', purpose: 'reality_private_key' }
    sources['/tls/reality/short_id'] = { kind: 'node_generated', purpose: 'reality_short_id' }
  } else {
    delete server.reality
    if (server.enabled) sources['/tls/certificate_binding'] = { kind: 'node_certificate', name: 'primary' }
  }
  if (!server.enabled) removeTLSSources(sources, '/tls/')
}

function prepareServerOptions(
  form: Inbound,
  options: Record<string, unknown>,
  sources: Record<string, ValueSource>,
) {
  prepareTLSOptions(options.tls as Record<string, unknown>, sources)
  const obfs = options.obfs as Record<string, unknown> | undefined
  if (form.type === 'hysteria2' && obfs) {
    delete obfs.password
    sources['/obfs/password'] = { kind: 'node_generated', purpose: 'hysteria2_obfs_password' }
  } else {
    delete sources['/obfs/password']
  }
  const transport = options.transport as { type?: string } | undefined
  if (transport?.type !== 'http' && transport?.type !== 'httpupgrade') delete sources[hostPath]
  if (!nodeSupportsTLS(form.type)) delete options.tls
  if (form.type === 'shadowsocks' || form.type === 'shadowtls') delete options.password
  if (form.type === 'snell') delete options.psk
  if (sources['/listen_port']) delete options.listen_port
}

function prepareClientOptions(form: Inbound, viaRealm: boolean) {
  const options = clone(form.out_json ?? {})
  if (form.addrs?.length && !viaRealm) options.addresses = clone(form.addrs)
  if (viaRealm) {
    delete options.server_ports
    delete options.hop_interval
  } else {
    delete options.realm
  }
  return options
}

export function saveEntry(
  entry: SpecEntry,
  form: Inbound,
  tls: tls,
  sources: Record<string, ValueSource>,
): SpecEntry {
  const { options } = serializeNodeInbound(form, tls)
  const next = clone(sources)
  prepareServerOptions(form, options, next)
  const client = clone(tls.client) as Record<string, unknown>
  delete client.reality
  const clientOptions = prepareClientOptions(form, Boolean(options.realm))
  return {
    connection_key: entry.connection_key,
    name: form.tag.trim(),
    protocol: form.type as SpecEntry['protocol'],
    enable: form.enable !== false,
    options,
    sources: next,
    client_tls: client,
    ...(Object.keys(clientOptions).length ? { client_options: clientOptions } : {}),
    ...(options.realm && entry.realm_server_secret ? { realm_server_secret: entry.realm_server_secret } : {}),
    ...(options.realm && entry.realm_client_secret ? { realm_client_secret: entry.realm_client_secret } : {}),
  }
}
function pathParts(path: string) {
  return path
    .slice(1)
    .split('/')
    .map((part) => part.replaceAll('~1', '/').replaceAll('~0', '~'))
}
export function setPath(root: Record<string, unknown>, path: string, value: unknown, remove = false) {
  const parts = pathParts(path)
  let target = root
  for (const part of parts.slice(0, -1)) {
    if (!target[part] || typeof target[part] !== 'object') target[part] = {}
    target = target[part] as Record<string, unknown>
  }
  if (remove) delete target[parts.at(-1)!]
  else target[parts.at(-1)!] = clone(value)
}
function valueAtPath(options: Record<string, unknown>, path: string): unknown {
  return pathParts(path).reduce<unknown>(
    (value, key) =>
      value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined,
    options,
  )
}
export function overrideFromEntry(base: SpecEntry, edited: SpecEntry): SpecOverride[] {
  const result: SpecOverride[] = []
  function walk(a: Record<string, unknown>, b: Record<string, unknown>, prefix = '') {
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
      const path = prefix + '/' + key.replaceAll('~', '~0').replaceAll('/', '~1'),
        av = a[key],
        bv = b[key]
      if (JSON.stringify(av) === JSON.stringify(bv)) continue
      if (
        (av === undefined || (av && typeof av === 'object' && !Array.isArray(av))) &&
        bv &&
        typeof bv === 'object' &&
        !Array.isArray(bv) &&
        Object.keys(bv).length
      )
        walk((av ?? {}) as Record<string, unknown>, bv as Record<string, unknown>, path)
      else
        result.push(
          bv === undefined
            ? { connection_key: base.connection_key, path, operation: 'remove' }
            : {
                connection_key: base.connection_key,
                path,
                operation: 'set',
                source: { kind: 'literal', value: bv },
              },
        )
    }
  }
  const before = clone(base.options),
    after = clone(edited.options)
  for (const [path, s] of Object.entries(base.sources))
    if (s.kind === 'literal') setPath(before, path, s.value)
  for (const [path, s] of Object.entries(edited.sources))
    if (s.kind === 'literal') setPath(after, path, s.value)
  walk(before, after)
  for (const path of Object.keys(base.sources)) {
    if (edited.sources[path] || result.some((row) => row.path === path)) continue
    const value = valueAtPath(after, path)
    result.push(
      value === undefined
        ? { connection_key: base.connection_key, path, operation: 'remove' }
        : { connection_key: base.connection_key, path, operation: 'set', source: { kind: 'literal', value } },
    )
  }
  for (const [path, source] of Object.entries(edited.sources))
    if (JSON.stringify(source) !== JSON.stringify(base.sources[path]))
      result.push({ connection_key: base.connection_key, path, operation: 'set', source: clone(source) })
  // A parent removal or a dynamic source replaces its entire subtree.
  const unique = [...new Map(result.map((row) => [row.path, row])).values()]
  return unique.filter(
    (row) =>
      !unique.some(
        (other) =>
          other !== row &&
          (other.operation === 'remove' || other.source?.kind !== 'literal') &&
          row.path.startsWith(other.path + '/'),
      ),
  )
}
