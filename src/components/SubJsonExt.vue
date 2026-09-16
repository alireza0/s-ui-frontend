<template>
  <Editor
    v-model="enableEditor"
    :data="settings.subJsonExt"
    :visible="enableEditor"
    :title="$t('editor') + ' - ' + $t('setting.jsonSub')"
    @close="enableEditor = false"
    @save="saveEditor"
  />
  <v-card>
    <v-row>
      <v-col
        cols="12"
        sm="6"
        md="3"
      >
        <v-select
          v-model="selectedDefaultRules"
          :items="defaultRuleItems"
          :label="$t('setting.defaultRules')"
          multiple
          chips
          hide-details
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="3"
        lg="2"
      >
        <v-select
          v-model="routeFinal"
          :items="[{ title: 'Proxy', value: 'proxy' }, { title: 'Direct', value: 'direct' }]"
          :label="$t('setting.routeFinal')"
          clearable
          hide-details
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col
        cols="12"
        sm="6"
        md="3"
      >
        <v-select
          v-model="ruleToProxy"
          :items="geoOptions"
          :label="$t('setting.toProxy')"
          multiple
          chips
          hide-details
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="3"
      >
        <v-select
          v-model="ruleToDirect"
          :items="geoOptions"
          :label="$t('setting.toDirect')"
          multiple
          chips
          hide-details
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="3"
      >
        <v-select
          v-model="ruleToBlock"
          :items="geoOptions"
          :label="$t('setting.toBlock')"
          multiple
          chips
          hide-details
        />
      </v-col>
    </v-row>
    <v-row v-if="enableLog">
      <v-col
        cols="12"
        sm="6"
        md="3"
        lg="2"
      >
        <v-select
          v-model="subJsonExt.log!.level"
          hide-details
          :label="$t('basic.log.level')"
          :items="levels"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="3"
        lg="2"
      >
        <v-switch
          v-model="subJsonExt.log!.timestamp"
          color="primary"
          :label="$t('setting.timestamp')"
          hide-details
        />
      </v-col>
    </v-row>
    <v-row v-if="enableDns">
      <v-col
        cols="12"
        sm="6"
        md="3"
        lg="2"
      >
        <v-select
          v-model="subJsonExt.dns!.final"
          hide-details
          :label="$t('dns.final')"
          :items="dnsTags"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="3"
        lg="2"
      >
        <SimpleDNS
          :data="proxyDns"
          :label="$t('setting.globalDns')"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="3"
        lg="2"
      >
        <SimpleDNS
          :data="directDns"
          :label="$t('setting.directDns')"
        />
      </v-col>
    </v-row>
    <v-row v-if="enableDns">
      <v-col
        cols="12"
        sm="6"
        md="3"
        lg="2"
      >
        <v-select
          v-model="subJsonExt.default_domain_resolver"
          hide-details
          :label="$t('basic.routing.defaultDns')"
          :items="dnsTags"
          clearable
          @click:clear="delete subJsonExt.default_domain_resolver"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="3"
      >
        <v-select
          v-model="dnsToDirect"
          :items="geositeOptions"
          :label="$t('setting.toDirectDns')"
          multiple
          chips
          hide-details
        />
      </v-col>
    </v-row>
    <template v-if="enableInb">
      <v-row>
        <v-col
          cols="12"
          sm="6"
          md="3"
        >
          <v-combobox
            v-model="inbounds[0].address"
            :items="defaultInb[0].address"
            chips
            multiple
            hide-details
            :label="$t('in.addr')"
          />
        </v-col>
        <v-col
          cols="12"
          sm="6"
          md="3"
          lg="2"
        >
          <v-text-field
            v-model.number="inbounds[0].mtu"
            type="number"
            hide-details
            label="MTU"
          />
        </v-col>
      </v-row>
      <v-row>
        <v-col
          cols="12"
          sm="6"
          md="3"
        >
          <v-combobox
            v-model="inbounds[0].exclude_package"
            :items="['ir.mci.ecareapp','com.myirancell']"
            chips
            multiple
            hide-details
            :label="$t('setting.excludePkg')"
          />
        </v-col>
        <v-col
          cols="12"
          sm="6"
          md="3"
          lg="2"
        >
          <v-switch
            v-model="platformProxy"
            hide-details
            color="primary"
            label="Platform HTTP proxy"
          />
        </v-col>
      </v-row>
    </template>
    <v-card-actions>
      <v-spacer />
      <v-btn
        variant="outlined"
        hide-details
        @click="openEditor"
      >
        {{ $t('editor') }}
      </v-btn>
      <v-menu
        v-model="menu"
        :close-on-content-click="false"
        location="start"
      >
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            hide-details
            variant="tonal"
          >
            {{ $t('setting.jsonSubOptions') }}
          </v-btn>
        </template>
        <v-card>
          <v-list>
            <v-list-item>
              <v-switch
                v-model="enableLog"
                color="primary"
                :label="$t('basic.log.title')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="enableDns"
                color="primary"
                label="DNS"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="enableInb"
                color="primary"
                :label="$t('objects.inbound')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="enableExp"
                color="primary"
                label="Experimental"
                hide-details
              />
            </v-list-item>
          </v-list>
        </v-card>
      </v-menu>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { PropType } from 'vue'
import Editor from './Editor.vue'
import SimpleDNS from './SimpleDNS.vue'
import { push } from 'notivue'
import { i18n } from '@/locales'
import { geoCatalog, geoList, geositeList } from '@/plugins/rulesetCatalog'

// The one setting this form reads and writes, as a string of sing-box JSON.
interface Settings {
  subJsonExt: string
}

// The config below is user-supplied sing-box JSON and carries far more than the
// panel touches. Each shape names only what the form reads or writes; anything
// else the user wrote is parsed, kept and written back untouched.
interface SbRule {
  action?: string
  outbound?: string
  protocol?: string
  clash_mode?: string
  rule_set?: string[]
}

interface SbDnsServer {
  type?: string
  tag?: string
  server?: string
  server_port?: number
  detour?: string
  domain_resolver?: string
}

interface SbDnsRule {
  action?: string
  server?: string
  clash_mode?: string
  source_ip_cidr?: string[]
  rule_set?: string[]
}

interface SbDns {
  servers: SbDnsServer[]
  rules: SbDnsRule[]
  final?: string
  strategy?: string
}

// A rule-set entry is matched against the catalog by tag; the rest of it is
// whatever the catalog or the user put there.
interface SbRuleSet {
  tag: string
}

interface SbInbound {
  type: string
  address?: string[]
  mtu?: number
  auto_route?: boolean
  strict_route?: boolean
  stack?: string
  exclude_package?: string[]
  listen?: string
  listen_port?: number
  users?: string[]
  platform?: {
    http_proxy: {
      enabled: boolean
      server: string
      server_port: number
    }
  }
}

interface SbLog {
  level: string
  timestamp: boolean
}

interface SbExperimental {
  clash_api: {
    external_controller: string
    external_ui: string
    secret: string
    external_ui_download_url: string
    external_ui_download_detour: string
    default_mode: string
  }
  cache_file: {
    enabled: boolean
    store_fakeip: boolean
  }
}

// Every section is optional: the switches in the options menu add and remove
// them, and an empty config is written back as an empty string.
interface SubJson {
  log?: SbLog
  dns?: SbDns
  inbounds?: SbInbound[]
  experimental?: SbExperimental
  rules?: SbRule[]
  rule_set?: SbRuleSet[]
  final?: string
  default_domain_resolver?: string
}

export default {
  components: { Editor, SimpleDNS },
  props: {
    settings: { type: Object as PropType<Settings>, required: true }
  },
  data() {
    return {
      menu: false,
      enableEditor: false,
      subJsonExt: <SubJson>{},
      levels: ["trace", "debug", "info", "warn", "error", "fatal", "panic"],
      defaultRules: [
        { action: "sniff" },
        { clash_mode: "Direct", action: "route", outbound: "direct" },
        { clash_mode: "Global", action: "route", outbound: "proxy" },
      ],
      defaultRuleItems: [
        { title: "Sniff", value: 0 },
        { title: "Clash Direct", value: 1 },
        { title: "Clash Global", value: 2 },
      ],
      defaultLog: {
        "level": "info",
        "timestamp": true
      },
      defaultInb: [
        {
          "type": "tun",
          "address": [
            "172.19.0.1/30",
            "fdfe:dcba:9876::1/126"
          ],
          "mtu": 9000,
          "auto_route": true,
          "strict_route": false,
          "stack": "mixed",
          "exclude_package": [],
          "platform": {
            "http_proxy": {
              "enabled": true,
              "server": "127.0.0.1",
              "server_port": 2080
            }
          }
        },
        {
          "type": "mixed",
          "listen": "127.0.0.1",
          "listen_port": 2080,
          "users": []
        }
      ],
      defaultExp: {
        "clash_api": {
          "external_controller": "127.0.0.1:9090",
          "external_ui": "ui",
          "secret": "",
          "external_ui_download_url": "https://mirror.ghproxy.com/https://github.com/MetaCubeX/Yacd-meta/archive/gh-pages.zip",
          "external_ui_download_detour": "direct",
          "default_mode": "rule"
        },
        "cache_file": {
          "enabled": true,
          "store_fakeip": false
        }
      },
      defaultDns: {
        "servers": [
          {
            "type": "tcp",
            "tag": "proxy-dns",
            "server": "8.8.8.8",
            "server_port": 53,
            "detour": "proxy",
            "domain_resolver": "local-dns",
          },
          { 
            "tag": "direct-dns",
            "type": "local",
          },
          {
            "tag": "local-dns",
            "type": "local",
          }
        ],
        "rules": [
          {
            "clash_mode": "Global",
            "source_ip_cidr": [
              "172.19.0.0/30",
              "fdfe:dcba:9876::1/126"
            ],
            "action": "route",
            "server": "proxy-dns"
          },
          {
            "clash_mode": "Direct",
            "action": "route",
            "server": "direct-dns"
          },
          {
            "source_ip_cidr": [
              "172.19.0.0/30",
              "fdfe:dcba:9876::1/126"
            ],
            "action": "route",
            "server": "proxy-dns"
          },
        ],
        "final": "local-dns",
        "strategy": "prefer_ipv4"
      },
      geositeList: geositeList,
      geoList: geoList,
      geo: geoCatalog,
    }
  },
  computed: {
    enableLog: {
      get() :boolean { return this.subJsonExt?.log != undefined },
      set(v:boolean) {
        if (v) this.subJsonExt.log = this.defaultLog
        else delete this.subJsonExt.log
      }
    },
    enableDns: {
      get() :boolean { return this.subJsonExt?.dns != undefined },
      set(v:boolean) {
        if (v) {
          this.subJsonExt.dns = this.defaultDns
          if (this.rules == undefined) this.subJsonExt.rules = [{ action: 'sniff' }]
          this.subJsonExt.rules!.unshift({ protocol: "dns", action: "hijack-dns" })
        } else {
          delete this.subJsonExt.dns
          const rules = this.subJsonExt?.rules?.filter((r) => r.protocol != "dns") ?? []
          if (rules.length >= 0) this.subJsonExt.rules = rules
          if (this.rules.length == 0) delete this.subJsonExt.rules
        }
      }
    },
    enableInb: {
      get() :boolean { return this.subJsonExt?.inbounds != undefined },
      set(v:boolean) {
        if (v) this.subJsonExt.inbounds = this.defaultInb.slice()
        else delete this.subJsonExt.inbounds
      }
    },
    enableExp: {
      get() :boolean { return this.subJsonExt?.experimental != undefined },
      set(v:boolean) {
        if (v) this.subJsonExt.experimental = this.defaultExp
        else delete this.subJsonExt.experimental
      }
    },
    // Absent until the DNS switch is turned on; every reader guards with ?.
    // before it reaches in.
    dns():SbDns { return <SbDns>this.subJsonExt?.dns?? undefined },
    proxyDns: {
      get() :SbDnsServer { return this.dns?.servers?.findLast((d) => d.tag == "proxy-dns")?? {} },
      set(v:SbDnsServer) { 
        let sIndex = this.dns.servers.findIndex((d) => d.tag == "proxy-dns")
        if (sIndex === -1 || sIndex == undefined) {
          this.dns.servers.push({ ...this.defaultDns.servers[0], ...v })
        } else {
          this.dns.servers[sIndex] = { ...this.defaultDns.servers[0], ...v }
        }
      }
    },
    directDns: {
      get() :SbDnsServer { return this.dns?.servers?.findLast((d) => d.tag == "direct-dns")?? {} },
      set(v:SbDnsServer) {
        const sIndex = this.dns.servers.findIndex((d) => d.tag == "direct-dns")
        if (sIndex === -1 || sIndex == undefined) {
          this.dns.servers.push({ ...this.defaultDns.servers[1], ...v })
        } else {
          this.dns.servers[sIndex] = { ...this.defaultDns.servers[1], ...v }
        }
      },
    },
    dnsTags() { return this.dns?.servers?.map((d) => d.tag) ?? [] },
    final: {
      get() :string { return this.dns.final?? "" },
      set(v:string) { this.dns.final = v.length>0 ? v : undefined }
    },
    dnsToDirect: {
      get() :string[] {
        const ruleIndex = this.dns?.rules?.findIndex((r) => r.server == "direct-dns" && Object.hasOwn(r,'rule_set'))
        return ruleIndex >= 0 ? <string[]>this.dns.rules[ruleIndex].rule_set : []
      },
      set(v:string[]) {
        const ruleIndex = this.dns?.rules?.findIndex((r) => r.server == "direct-dns" && Object.hasOwn(r,'rule_set'))
        if (v.length>0) {
          if (ruleIndex >= 0){
            this.dns.rules[ruleIndex].rule_set = v
          } else {
            this.dns.rules.push({ rule_set: v, action: "route", server: "direct-dns" })
          }
        } else {
          if (ruleIndex != -1) this.dns.rules.splice(ruleIndex,1)
        }
        this.updateRuleSets()
      }
    },
    // Absent until the inbound switch is turned on; every reader guards with ?.
    // before it reaches in.
    inbounds():SbInbound[] { return <SbInbound[]>this.subJsonExt?.inbounds?? undefined },
    platformProxy: {
      get() :boolean { return this.inbounds[0]?.platform != undefined },
      set(v:boolean) { this.subJsonExt.inbounds![0].platform = v ? this.defaultInb[0].platform : undefined }
    },
    // Absent until a rule is added; every reader guards with ?. before it
    // reaches in.
    rules():SbRule[] { return <SbRule[]>this.subJsonExt?.rules?? undefined },
    selectedDefaultRules: {
      get(): number[] {
        return this.defaultRules
          .map((d, i:number) => this.hasDefaultRule(d) ? i : -1)
          .filter((i:number) => i >= 0)
      },
      set(v:number[]) {
        this.defaultRules.forEach((d, i:number) => this.toggleDefaultRule(d, v.includes(i)))
      }
    },
    customRuleSetTags() :string[] {
      return (this.subJsonExt?.rule_set ?? [])
        .filter((rs) => !this.geo.some((g) => g.tag == rs.tag))
        .map((rs) => rs.tag)
    },
    geoOptions() :{ title: string, value: string }[] {
      return [...this.geoList, ...this.customRuleSetTags.map((t:string) => ({ title: t, value: t }))]
    },
    geositeOptions() :{ title: string, value: string }[] {
      return [...this.geositeList, ...this.customRuleSetTags.map((t:string) => ({ title: t, value: t }))]
    },
    routeFinal: {
      get() :string { return this.subJsonExt?.final ?? "" },
      set(v:string|null) {
        if (v && v.length > 0) this.subJsonExt.final = v
        else delete this.subJsonExt.final
      }
    },
    ruleToProxy: {
      get() :string[] {
        const ruleIndex = this.rules?.findIndex((r) => r.outbound == "proxy" && Object.hasOwn(r,'rule_set'))
        return ruleIndex >= 0 ? <string[]>this.rules[ruleIndex].rule_set : []
      },
      set(v:string[]) {
        const ruleIndex = this.rules?.findIndex((r) => r.outbound == "proxy" && Object.hasOwn(r,'rule_set'))
        if (v.length>0) {
          if (ruleIndex >= 0){
            this.rules[ruleIndex].rule_set = v
          } else {
            if (this.rules == undefined) this.subJsonExt.rules = []
            this.rules.push({ rule_set: v, action: "route", outbound: "proxy" })
          }
        } else {
          if (ruleIndex != -1) this.rules.splice(ruleIndex,1)
        }
        this.updateRuleSets()
      }
    },
    ruleToDirect: {
      get() :string[] {
        const ruleIndex = this.rules?.findIndex((r) => r.outbound == "direct" && Object.hasOwn(r,'rule_set'))
        return ruleIndex >= 0 ? <string[]>this.rules[ruleIndex].rule_set : []
      },
      set(v:string[]) {
        const ruleIndex = this.rules?.findIndex((r) => r.outbound == "direct" && Object.hasOwn(r,'rule_set'))
        if (v.length>0) {
          if (ruleIndex >= 0){
            this.rules[ruleIndex].rule_set = v
          } else {
            if (this.rules == undefined) this.subJsonExt.rules = []
            this.rules.push({ rule_set: v, action: "route", outbound: "direct" })
          }
        } else {
          if (ruleIndex != -1) this.rules.splice(ruleIndex,1)
        }
        this.updateRuleSets()
      }
    },
    ruleToBlock: {
      get() :string[] {
        const ruleIndex = this.rules?.findIndex((r) => r.action == "reject" && Object.hasOwn(r,'rule_set'))
        return ruleIndex >= 0 ? <string[]>this.rules[ruleIndex].rule_set : []
      },
      set(v:string[]) {
        const ruleIndex = this.rules?.findIndex((r) => r.action == "reject" && Object.hasOwn(r,'rule_set'))
        if (v.length>0) {
          if (ruleIndex >= 0){
            this.rules[ruleIndex].rule_set = v
          } else {
            if (this.rules == undefined) this.subJsonExt.rules = []
            this.rules.push({ rule_set: v, action: "reject" })
          }
        } else {
          if (ruleIndex != -1) this.rules.splice(ruleIndex,1)
        }
        this.updateRuleSets()
      }
    }
  },
  watch:{
    subJsonExt:{
      handler(v:SubJson) {
        this.$props.settings.subJsonExt = Object.keys(v).length>0 ? JSON.stringify(v, null, 2) : ""
      },
      deep: true
    },
  },
  mounted(){
    this.loadData()
  },
  methods: {
    loadData() {
      if (this.$props.settings?.subJsonExt?.length>0){
        this.subJsonExt = JSON.parse(this.$props.settings.subJsonExt)
      } else {
        this.subJsonExt = <SubJson>{}
      }
    },
    hasDefaultRule(rule:SbRule): boolean {
      return Array.isArray(this.rules) && this.rules.some((r) => JSON.stringify(r) === JSON.stringify(rule))
    },
    toggleDefaultRule(rule:SbRule, v:boolean) {
      if (v) {
        if (!Array.isArray(this.subJsonExt.rules)) this.subJsonExt.rules = []
        if (!this.subJsonExt.rules.some((r) => JSON.stringify(r) === JSON.stringify(rule))) {
          this.subJsonExt.rules.push(JSON.parse(JSON.stringify(rule)))
          this.normalizeRulesOrder()
        }
      } else if (Array.isArray(this.subJsonExt.rules)) {
        this.subJsonExt.rules = this.subJsonExt.rules.filter((r) => JSON.stringify(r) !== JSON.stringify(rule))
        if (this.subJsonExt.rules.length === 0) delete this.subJsonExt.rules
      }
    },
    ruleWeight(r:SbRule): number {
      if (r.protocol == "dns") return 0
      if (r.action == "sniff") return 1
      if (r.clash_mode == "Direct") return 2
      if (r.clash_mode == "Global") return 3
      return 4
    },
    normalizeRulesOrder() {
      if (Array.isArray(this.subJsonExt?.rules)) {
        this.subJsonExt.rules.sort((a,b) => this.ruleWeight(a) - this.ruleWeight(b))
      }
    },
    updateRuleSets(){
      let tags = <string[]>[]
      if (this.dns?.rules?.length>0) this.dns.rules.forEach((r) => { if (r.rule_set) tags.push(...r.rule_set) })
      if (this.rules?.length>0) this.rules.forEach((r) => { if (r.rule_set) tags.push(...r.rule_set) })
      const custom = (this.subJsonExt?.rule_set ?? []).filter((rs) => !this.geo.some((g) => g.tag == rs.tag))
      if (tags.length>0 || custom.length>0){
        this.subJsonExt.rule_set = [
          ...this.geo.filter((g) => tags.includes(g.tag)),
          ...custom,
        ]
      } else {
        delete this.subJsonExt.rule_set
      }
      if (this.rules?.length == 0) delete this.subJsonExt.rules
    },
    openEditor() {
      this.enableEditor = true
    },
    saveEditor(data:string) {
      try {
        this.subJsonExt = JSON.parse(data)
      } catch {
        push.error({
          message: i18n.global.t('failed') + ": " + i18n.global.t('error.invalidData'),
          duration: 5000,
        })
        return
      }
      this.enableEditor = false
    }
  }
}
</script>