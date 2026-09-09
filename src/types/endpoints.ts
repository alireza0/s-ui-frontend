import { Dial } from "./dial"

export const EpTypes = {
  Wireguard: 'wireguard',
  Warp: 'warp',
  Tailscale: 'tailscale',
  OpenConnect: 'openconnect',
  OpenVPNClient: 'openvpn-client',
  OpenVPNServer: 'openvpn-server',
}

type EpType = typeof EpTypes[keyof typeof EpTypes]

interface EndpointBasics {
  id: number
  type: EpType
  tag: string
}

export interface WgPeer {
  address: string
  port: number
  public_key: string
  pre_shared_key?: string
  allowed_ips?: string[]
  persistent_keepalive_interval?: number
  reserved?: number[]
}

export interface WireGuard extends EndpointBasics, Dial {
  system?: boolean
  name?: string
  mtu?: number
  address: string[]
  private_key: string
  listen_port: number
  peers: WgPeer[]
  udp_timeout?: string
  workers?: number
  ext: any
}

export interface Warp extends WireGuard {}

export interface Tailscale extends EndpointBasics, Dial {
  state_directory?: string
  auth_key?: string
  control_url?: string
  ephemeral?: boolean
  hostname?: string
  accept_routes?: boolean
  exit_node?: string
  exit_node_allow_lan_access?: boolean
  advertise_routes?: string[]
  advertise_exit_node?: boolean
  relay_server_port?: number
  relay_server_static_endpoints?: string[]
  system_interface?: boolean
  system_interface_name?: string
  system_interface_mtu?: number
  udp_timeout?: string
}

// OpenConnect and OpenVPN expose far more options than are modelled here.
// Anything not listed is preserved as-is when an endpoint is edited, so a
// config written by hand keeps working.
//
// Each of them defines its own TLS options rather than using sing-box's, down
// to the field names, so they carry their own `tls` block instead of pointing
// at a panel TLS config.
export interface OpenConnectTls {
  insecure?: boolean
  server_name?: string
  peer_fingerprint?: string[]
  system_trust_disabled?: boolean
  certificate_authority?: string[]
  certificate_authority_path?: string
  client_certificate?: string[]
  client_certificate_path?: string
  client_key?: string[]
  client_key_path?: string
  client_key_password?: string
}

// Named for what OpenVPN calls them, which is not what the other side calls
// them: on a server `certificate` is its own and `client_certificate` is the CA
// that signs clients, on a client it is the other way round.
export interface OpenVpnTls {
  certificate?: string[]
  certificate_path?: string
  key?: string[]
  key_path?: string
  client_certificate?: string[]
  client_certificate_path?: string
  client_key?: string[]
  client_key_path?: string
  verify_client_certificate?: 'require' | 'optional' | 'none'
  server_name?: string
  peer_fingerprint?: string[]
  crl_path?: string
  remote_certificate_tls?: 'server' | 'client' | 'none'
  certificate_profile?: 'legacy' | 'preferred' | 'insecure' | 'suiteb'
  version_min?: '1.0' | '1.1' | '1.2' | '1.3'
  version_max?: '1.0' | '1.1' | '1.2' | '1.3'
  control_wrap?: {
    type?: 'tls_auth' | 'tls_crypt' | 'tls_crypt_v2'
    key?: string[]
    key_path?: string
    direction?: 'server' | 'client'
  }
}

export interface OpenConnect extends EndpointBasics, Dial {
  server: string
  flavor?: 'anyconnect' | 'gp' | 'fortinet' | 'f5' | 'pulse' | 'nc'
  username?: string
  password?: string
  auth_group?: string
  cookie?: string
  name?: string
  system?: boolean
  mtu?: number
  no_udp?: boolean
  udp_timeout?: string
  ipv6_disabled?: boolean
  allow_insecure_crypto?: boolean
  tls?: OpenConnectTls
}

export interface OpenVPNClient extends EndpointBasics, Dial {
  server: string
  server_port: number
  mode?: 'tls' | 'static_key'
  // Required in static_key mode; in tls mode the server pushes them.
  address?: string[]
  peer_address?: string
  peer_address_ipv6?: string
  network?: 'udp' | 'udp4' | 'udp6' | 'tcp' | 'tcp4' | 'tcp6'
  username?: string
  password?: string
  name?: string
  system?: boolean
  mtu?: number
  // static_key mode only; a TLS session negotiates out of data_ciphers instead.
  cipher?: string
  data_ciphers?: string[]
  data_ciphers_fallback?: string
  auth?: string
  static_key_path?: string
  key_direction?: 'server' | 'client'
  tls?: OpenVpnTls
}

export interface OpenVPNServer extends EndpointBasics {
  listen: string
  listen_port: number
  mode?: 'tls' | 'static_key'
  network?: 'tcp' | 'udp'
  address: string[]
  max_clients?: number
  duplicate_cn?: boolean
  users?: { username: string; password: string }[]
  name?: string
  system?: boolean
  mtu?: number
  // static_key mode only; a TLS session negotiates out of data_ciphers instead.
  cipher?: string
  data_ciphers?: string[]
  data_ciphers_fallback?: string
  auth?: string
  static_key_path?: string
  key_direction?: 'server' | 'client'
  tls?: OpenVpnTls
}

// Create interfaces dynamically based on EpTypes keys
type InterfaceMap = {
  [Key in keyof typeof EpTypes]: {
    type: string
    [otherProperties: string]: any // You can add other properties as needed
  }
}

// Create union type from InterfaceMap
export type Endpoint = InterfaceMap[keyof InterfaceMap]

// Create defaultValues object dynamically
const defaultValues: Record<EpType, Endpoint> = {
  wireguard: { type: EpTypes.Wireguard, address: ['10.0.0.2/32','fe80::2/128'], private_key: '', listen_port: 0, ext: { public_key: '', keys: [] } },
  warp: { type: EpTypes.Warp, address: [], private_key: '', listen_port: 0, mtu: 1420, peers: [{ address: '', port: 0, public_key: ''}], ext: {} },
  tailscale: { type: EpTypes.Tailscale, domain_resolver: 'local' },
  openconnect: { type: EpTypes.OpenConnect, server: '', flavor: 'anyconnect' },
  'openvpn-client': { type: EpTypes.OpenVPNClient, server: '', server_port: 1194, mode: 'tls', network: 'udp' },
  'openvpn-server': { type: EpTypes.OpenVPNServer, mode: 'tls', network: 'udp', address: ['10.8.0.1/24'] },
}

export function createEndpoint<T extends Endpoint>(type: string,json?: Partial<T>): Endpoint {
  const defaultObject: Endpoint = { ...defaultValues[type], ...(json || {}) }
  return defaultObject
}