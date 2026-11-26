import type { Inbound } from '@/types/inbounds'

export interface NodeRecord {
  id?: number
  name: string
  enable: boolean
  address: string
  linkaddress: string
  template_id: number
  inbound_template_ids?: number[]
  desired_revision: number
  applied_revision: number
  last_seen: number
  last_error?: string
  assignment_mode?: string
  agent_protocol?: number
  agent_extended_inbounds?: boolean
  agent_running?: boolean
  sing_box_version?: string
  agent_upgrade_state?: 'ready' | 'waiting' | 'updating' | 'failed'
  agent_traffic_available?: boolean
  template_target_version?: number
  materialized_template_version?: number
  applied_template_version?: number
  settings_version?: number
  pending?: boolean
  disable_confirmed?: boolean
  config?: Record<string, unknown> | null
  tls_status?: { revision:number, observed_at:number, certificates:NodeCertificateStatus[] | null } | null
}

export function isManagedNode(node: NodeRecord): boolean {
  return node.assignment_mode === 'node' && node.agent_protocol === 2 && !!node.template_target_version
}

export interface NodeCertificateStatus {
  inbound:string
  provider?:string
  server_name?:string
  state:string
  not_before?:number
  not_after?:number
  sha256?:string
}

export interface NodeTemplate {
  id?: number
  name: string
  config: Record<string, unknown>
  version?: number
  schema_version?: number
  kind?: 'inbound' | 'deployment'
  protocol?: SpecEntry['protocol']
  scope?: 'shared' | 'private'
  owner_node_id?: number
  parent_template_id?: number
}

export const nodeInboundProtocols = ['vless', 'tuic', 'hysteria2', 'vmess', 'trojan', 'anytls', 'shadowsocks', 'snell', 'shadowtls', 'hysteria', 'naive', 'http', 'socks', 'mixed'] as const
export const nodeSupportsTLS = (kind:string) => !['shadowsocks','snell','shadowtls','socks','mixed'].includes(kind)
export type NodeInboundProtocol = typeof nodeInboundProtocols[number]

export interface NodeInbound {
  tag: string
  type: NodeInboundProtocol
  enable: boolean
  options: Partial<Inbound> & Record<string, unknown>
  client_tls: Record<string, unknown> | null
  id?: number
  node_id: number
  source_template_id?: number
  template_key?: string
  display_name?: string
  connection_key?: string
  retired?: boolean
}

export interface NodesBundle {
  nodes: NodeRecord[]
  nodetemplates: NodeTemplate[]
  nodeinbounds: NodeInbound[]
  installations?: NodeInstallation[]
  nodejobs?: NodeJob[]
  tls_profiles?: NodeTLSProfile[]
  nodeaccess?: {node_id:number;desired_revision:number;applied_revision:number;last_error?:string}[]
}

export interface ValueSource { kind:'literal'|'node_parameter'|'node_generated'|'node_certificate'|'profile'; name?:string; purpose?:string; value?:unknown }
export interface NodeTLSProfile { id: number; name: string; reality: boolean }
export interface SpecEntry {
  connection_key: string
  name: string
  protocol: NodeInboundProtocol
  enable: boolean
  options: Record<string, unknown>
  sources: Record<string, ValueSource>
  tls_profile_id?: number
  client_tls?: Record<string, unknown>
  client_options?: Record<string, unknown>
  realm_server_secret?: string
  realm_client_secret?: string
}
export interface TemplateSpec { schema_version:1; config:Record<string,unknown>; entries:SpecEntry[] }
export interface SpecOverride { connection_key:string; path:string; operation:'set'|'remove'; source?:ValueSource }
export interface DNSProfile {id?:number;name:string;provider?:string;auth_type:'token'|'global_key';email?:string;zones:{id:string;name:string}[];version:number;secret_configured?:boolean}
export interface DomainBinding {node_id:number;mode:'manual'|'managed';fqdn:string;profile_id?:number;zone_id?:string;prefix?:string;automatic_prefix:boolean;ip:string;generation:number;state:string;applied_fqdn?:string;last_error?:string;certificate_mode:string}
export interface CertificateBinding {node_id:number;mode:string;ca:string;email?:string;dns_profile_id?:number;zone_id?:string;generation:number;state:string;last_error?:string;desired_revision:number;applied_revision:number;metadata?:{domain:string;not_after:number;sha256:string};certificate_path?:string;key_path?:string}
export interface ResourceBundle {dnsprofiles:DNSProfile[];domains:DomainBinding[];certificates:CertificateBinding[];dnsrecords:{id:number;node_id:number;name:string;type:string;retired:boolean;challenge:boolean}[]}
export interface NodeWorkspace {spec?:TemplateSpec;overrides:SpecOverride[];connections:{id:number;connection_key:string;display_name:string;type:string;enable:boolean;retired:boolean;options:Record<string,unknown>}[];tasks:{kind:string;state:string;last_error?:string}[]}

export interface NodeInstallation {
  node_id:number; ip:string; ssh_port:number; ssh_user:string; host_fingerprint:string
  domain:string; protocols:string[]; control_port:number; ready:boolean
}
export interface NodeJob {
  model_version?:number
  id:string; node_id:number; action:string; state:string; stage:string; error:string
  created:number; updated:number; events:{time:number;stage:string;state:string;error?:string}[]
}
export interface ProvisionDomain {mode:string;profile_id:number;zone_id:string;prefix:string;automatic_prefix:boolean;fqdn:string;certificate_mode:string;certificate_method:string;email:string;certificate:string;key:string;certificate_path:string;key_path:string}
export interface NodeProvisionRequest { model_version?:number;request_key?:string;expected_version?:number;domain?:ProvisionDomain;node_id?:number; name:string; ip:string; ssh_port:number; ssh_user:string; password:string; protocols:string[]; template_id:number; inbound_template_ids?:number[]; action:string; replace_host_key:boolean }
