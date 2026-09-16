import HttpUtils from '@/plugins/httputil'
import { defineStore } from 'pinia'
import { push } from 'notivue'
import { i18n } from '@/locales'
import { Inbound } from '@/types/inbounds'
import { Client } from '@/types/clients'
import { Outbound } from '@/types/outbounds'
import { Srv } from '@/types/services'
import { Endpoint } from '@/types/endpoints'
import { Config } from '@/types/config'
import { tls } from '@/types/tls'

// Online tags, by kind. The backend marks each list `omitempty`, so a poll
// with nobody online answers with {} rather than three empty lists. Every
// reader guards accordingly.
export interface Onlines {
  inbound?: string[]
  outbound?: string[]
  user?: string[]
}

// Everything the panel keeps in sync with api/load. Only `onlines`,
// `maintenance` and sometimes `lastLog` ride on every poll; the rest is sent
// only when something actually changed since the last one, which is why every
// field here is optional and setNewData tests for presence before assigning.
export interface LoadedData {
  onlines?: Onlines
  maintenance?: boolean
  lastLog?: string
  subURI?: string
  os?: string
  enableTraffic?: boolean
  config?: Config
  clients?: Client[]
  inbounds?: Inbound[]
  outbounds?: Outbound[]
  services?: Srv[]
  endpoints?: Endpoint[]
  tls?: tls[]
}

// The duplicate-tag check works on any of the four lists without caring which
// one it was handed.
type Tagged = Inbound | Outbound | Srv | Endpoint

const Data = defineStore('Data', {
  state: () => ({ 
    lastLoad: 0,
    reloadItems: localStorage.getItem("reloadItems")?.split(',')?? <string[]>[],
    subURI: "",
    os: "",
    enableTraffic: false,
    // The core is stopped on purpose. Polled with the rest so every page can
    // say so, not just the one that turned it on.
    maintenance: false,
    onlines: <Onlines>{inbound: [], outbound: [], user: []},
    config: <Config>{},
    inbounds: <Inbound[]>[],
    outbounds: <Outbound[]>[],
    services: <Srv[]>[],
    endpoints: <Endpoint[]>[],
    clients: <Client[]>[],
    tlsConfigs: <tls[]>[],
  }),
  actions: {
    async loadData() {
      const msg = await HttpUtils.get<LoadedData>('api/load', this.lastLoad >0 ? {lu: this.lastLoad} : {} )
      if(msg.success) {
        if (msg.obj.onlines) this.onlines = msg.obj.onlines
        this.maintenance = msg.obj.maintenance ?? false
        if (msg.obj.lastLog) {
          push.error({
            title: i18n.global.t('error.core'),
            duration: 5000,
            message: msg.obj.lastLog
          })
        }
        
        if (msg.obj.config) {
          this.setNewData(msg.obj)
        }
      }
    },
    setNewData(data: LoadedData) {
      this.lastLoad = Math.floor((new Date()).getTime()/1000)
      if (data.subURI) this.subURI = data.subURI
      if (data.os) this.os = data.os
      // hasOwn, not truthiness: turning traffic accounting off sends false,
      // which the old test discarded, so the panel kept showing it as on until
      // the page was reloaded.
      if (Object.hasOwn(data, 'enableTraffic')) this.enableTraffic = data.enableTraffic ?? false
      if (data.config) this.config = data.config
      if (Object.hasOwn(data, 'clients')) this.clients = data.clients ?? []
      if (Object.hasOwn(data, 'inbounds')) this.inbounds = data.inbounds ?? []
      if (Object.hasOwn(data, 'outbounds')) this.outbounds = data.outbounds ?? []
      if (Object.hasOwn(data, 'services')) this.services = data.services ?? []
      if (Object.hasOwn(data, 'endpoints')) this.endpoints = data.endpoints ?? []
      if (Object.hasOwn(data, 'tls')) this.tlsConfigs = data.tls ?? []
    },
    async loadInbounds(ids: number[]): Promise<Inbound[]> {
      const options = ids.length > 0 ? {id: ids.join(",")} : {}
      const msg = await HttpUtils.get<{ inbounds: Inbound[] }>('api/inbounds', options)
      if(msg.success) {
        return msg.obj.inbounds
      }
      return <Inbound[]>[]
    },
    async loadClients(id: number): Promise<Client> {
      const options = id > 0 ? {id: id} : {}
      const msg = await HttpUtils.get<{ clients: Client[] }>('api/clients', options)
      if(msg.success) {
        return <Client>msg.obj.clients[0]??{}
      }
      return <Client>{}
    },
    async save (object: string, action: string, data: unknown, initUsers?: number[]): Promise<boolean> {
      const postData = {
        object: object,
        action: action,
        data: JSON.stringify(data, null, 2),
        initUsers: initUsers?.join(',') ?? undefined
      }
      const msg = await HttpUtils.post<LoadedData>('api/save', postData)
      if (msg.success) {
        const objectName = ['tls', 'config'].includes(object) ? object : object.substring(0, object.length - 1)
        push.success({
          title: i18n.global.t('success'),
          duration: 5000,
          message: i18n.global.t('actions.' + action) + " " + i18n.global.t('objects.' + objectName)
        })
        this.setNewData(msg.obj)
      }
      return msg.success
    },
    // Check duplicate client name
    checkClientName (id: number, newName: string): boolean {
      const oldName = id > 0 ? this.clients.findLast(i => i.id == id)?.name : null
      if (newName != oldName && this.clients.findIndex(c => c.name == newName) != -1) {
        push.error({
          message: i18n.global.t('error.dplData') + ": " + i18n.global.t('client.name')
        })
        return true
      }
      return false
    },
    // Check bulk client names
    checkBulkClientNames (names: string[]): boolean {
      const newNames = new Set(names)
      const oldNames = new Set(this.clients.map(c => c.name))
      const allNames = new Set([...oldNames, ...newNames])
      if (newNames.size != names.length || oldNames.size + newNames.size != allNames.size) {
        push.error({
          message: i18n.global.t('error.dplData') + ": " + i18n.global.t('client.name')
        })
        return true
      }
      return false
    },
    // check duplicate tag
    checkTag (object: string, id: number, tag: string): boolean {
      let objects: Tagged[]
      switch (object) {
        case 'inbound':
          objects = this.inbounds
          break
        case 'outbound':
          objects = this.outbounds
          break
        case 'service':
          objects = this.services
          break
        case 'endpoint':
          objects = this.endpoints
          break
        default:
          return false
      }
      const oldObject = id > 0 ? objects.findLast(i => i.id == id) : null
      if (tag != oldObject?.tag && objects.findIndex(i => i.tag == tag) != -1) {
        push.error({
          message: i18n.global.t('error.dplData') + ": " + i18n.global.t('objects.tag')
        })
        return true
      }
      return false
    },
  }
})

export default Data