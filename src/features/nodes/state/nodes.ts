import { defineStore } from 'pinia'
import HttpUtils from '@/plugins/httputil'
import type {
  NodesBundle,
  NodeRecord,
  NodeTemplate,
  NodeInbound,
  NodeInstallation,
  NodeJob,
  ResourceBundle,
  NodeProvisionRequest,
  NodeTLSProfile,
} from '@/features/nodes/types/nodes'
import { push } from 'notivue'
import { i18n } from '@/locales'

let requestSession = 0
export function invalidateNodesRequests() {
  requestSession++
}

// Remote objects have their own store and API. They never enter Data.inbounds.
export default defineStore('Nodes', {
  state: () => ({
    nodes: [] as NodeRecord[],
    templates: [] as NodeTemplate[],
    tlsProfiles: [] as NodeTLSProfile[],
    inbounds: [] as NodeInbound[],
    installations: [] as NodeInstallation[],
    nodejobs: [] as NodeJob[],
    loaded: false,
    loading: false,
    failed: false,
    lastSaveError: '',
    writeEpoch: 0,
    writes: 0,
    nodeaccess: [] as NonNullable<NodesBundle['nodeaccess']>,
    resources: { dnsprofiles: [], domains: [], certificates: [], dnsrecords: [] } as ResourceBundle,
    resourcesLoading: false,
    resourcesFailed: false,
  }),
  actions: {
    async provision(request: NodeProvisionRequest): Promise<NodeJob | undefined> {
      this.writeEpoch++
      this.writes++
      this.lastSaveError = ''
      const session = requestSession
      let job: NodeJob | undefined
      try {
        const result = await HttpUtils.post<NodeJob>('api/node-provision', { data: JSON.stringify(request) })
        if (session !== requestSession) return
        if (result.success) job = result.obj
        else this.lastSaveError = result.msg
      } catch {
        if (session !== requestSession) return
        this.lastSaveError = i18n.global.t('nodes.saveFailed')
      } finally {
        if (session === requestSession) this.writes = Math.max(0, this.writes - 1)
      }
      if (session !== requestSession) return
      await this.refreshAfterProvision(session)
      return session === requestSession ? job : undefined
    },
    async refreshAfterProvision(session: number) {
      const epoch = this.writeEpoch
      try {
        const bundle = await HttpUtils.get<NodesBundle>('api/nodes')
        if (session !== requestSession || epoch !== this.writeEpoch || this.writes) return
        if (bundle.success) this.setBundle(bundle.obj)
        else this.failed = true
      } catch {
        if (session === requestSession) this.failed = true
      }
    },
    setBundle(bundle: NodesBundle) {
      this.nodes = bundle.nodes
      this.templates = bundle.nodetemplates
      this.tlsProfiles = bundle.tls_profiles ?? []
      this.inbounds = bundle.nodeinbounds
      this.installations = bundle.installations ?? []
      this.nodejobs = bundle.nodejobs ?? []
      this.nodeaccess = bundle.nodeaccess ?? []
      this.loaded = true
      this.failed = false
    },
    async load() {
      if (this.loading || this.writes > 0) return
      const epoch = this.writeEpoch
      const session = requestSession
      this.loading = true
      try {
        const msg = await HttpUtils.get<NodesBundle>('api/nodes')
        if (session === requestSession && epoch === this.writeEpoch && !this.writes) {
          if (msg.success) this.setBundle(msg.obj)
          else this.failed = true
        }
      } catch {
        if (session === requestSession && epoch === this.writeEpoch) this.failed = true
      } finally {
        if (session === requestSession) this.loading = false
      }
    },
    async save(object: 'nodes' | 'nodetemplates', action: string, data: unknown) {
      this.lastSaveError = ''
      this.writeEpoch++
      this.writes++
      const session = requestSession
      try {
        const msg = await HttpUtils.post<NodesBundle>('api/save', {
          object,
          action,
          data: JSON.stringify(data),
        })
        if (session !== requestSession) return false
        if (msg.success) {
          this.setBundle(msg.obj)
          push.success({ message: i18n.global.t('nodes.saved') })
        } else this.lastSaveError = msg.msg
        return msg.success
      } catch {
        if (session === requestSession) this.lastSaveError = i18n.global.t('nodes.saveFailed')
        return false
      } finally {
        if (session === requestSession) this.writes = Math.max(0, this.writes - 1)
      }
    },
    async loadResources() {
      if (this.resourcesLoading || this.writes) return
      const session = requestSession,
        epoch = this.writeEpoch
      this.resourcesLoading = true
      try {
        const r = await HttpUtils.get<ResourceBundle>('api/node-resources')
        if (session === requestSession && epoch === this.writeEpoch) {
          if (r.success) {
            this.resources = r.obj
            this.resourcesFailed = false
          } else this.resourcesFailed = true
        }
      } catch {
        if (session === requestSession) this.resourcesFailed = true
      } finally {
        if (session === requestSession) this.resourcesLoading = false
      }
    },
    async resource(resource: string, action: string, data: unknown) {
      this.writes++
      this.writeEpoch++
      const session = requestSession
      this.lastSaveError = ''
      let success = false
      try {
        const r = await HttpUtils.post<ResourceBundle>('api/node-resource', {
          resource,
          action,
          data: JSON.stringify(data),
        })
        if (session === requestSession) {
          success = r.success
          if (!success) this.lastSaveError = r.msg
          else if (r.obj?.dnsprofiles) {
            this.resources = r.obj
            this.resourcesFailed = false
          }
        }
      } catch {
        if (session === requestSession) this.lastSaveError = i18n.global.t('nodes.saveFailed')
      } finally {
        if (session === requestSession) this.writes = Math.max(0, this.writes - 1)
      }
      if (success && session === requestSession) await this.loadResources()
      return success
    },
  },
})
