export interface Node {
  id: number
  name: string
  remark?: string
  scheme: 'http' | 'https'
  address: string
  port: number
  basePath: string
  apiToken?: string
  enable: boolean
  allowPrivateAddress: boolean
  tlsVerifyMode: 'verify' | 'skip' | 'pin'
  pinnedCertSha256?: string
  publicHost?: string
  inboundSyncMode: 'selected' | 'all'
  inboundTags?: string
  status: 'online' | 'offline' | 'unknown'
  lastHeartbeat: number
  latencyMs: number
  panelVersion?: string
  coreRunning: boolean
  cpuPercent: number
  memPercent: number
  uptime: number
  lastError?: string
  configDirty: boolean
  configDirtyAt: number
  createdAt: number
  updatedAt: number
}

export interface NodeProbeResult {
  ok: boolean
  latencyMs: number
  statusCode: number
  coreRunning: boolean
  raw?: any
  error?: string
  certSha256B64?: string
}
