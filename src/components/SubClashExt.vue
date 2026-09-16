<template>
  <Editor
    v-model="enableEditor"
    :data="model.subClashExt"
    :visible="enableEditor"
    :title="$t('editor') + ' - ' + $t('setting.clashSub')"
    @close="enableEditor = false"
    @save="saveEditor"
  />
  <v-card>
    <v-row>
      <v-col
        v-if="optionMixed"
        cols="12"
        sm="6"
        md="3"
        lg="2"
      >
        <v-text-field
          v-model.number="mixedPort"
          type="number"
          min="1"
          max="65535"
          :label="$t('setting.mixedPort')"
          hide-details
        />
      </v-col>
      <v-col
        v-if="optionMixed"
        cols="12"
        sm="6"
        md="3"
        lg="2"
      >
        <v-switch
          v-model="allowLan"
          color="primary"
          :label="$t('types.ts.allowLanAccess')"
          hide-details
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col
        v-if="optionExt"
        cols="12"
        sm="6"
        md="3"
        lg="2"
      >
        <v-text-field
          v-model="externalController"
          :label="$t('basic.exp.extController')"
          hide-details
        />
      </v-col>
      <v-col
        v-if="optionLog"
        cols="12"
        sm="6"
        md="3"
        lg="2"
      >
        <v-select
          v-model="logLevel"
          :items="['debug', 'info', 'warning', 'error']"
          :label="$t('basic.log.title') + ' - ' + $t('basic.log.level')"
          hide-details
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col
        v-if="optionTun"
        cols="12"
        sm="6"
        md="3"
        lg="2"
      >
        <v-switch
          v-model="tun"
          color="primary"
          :label="$t('setting.tun')"
          hide-details
        />
      </v-col>
      <v-col
        v-if="optionDns"
        cols="12"
        sm="6"
        md="3"
        lg="2"
      >
        <v-switch
          v-model="dns"
          color="primary"
          :label="$t('pages.dns')"
          hide-details
        />
      </v-col>
    </v-row>
    <v-row v-if="optionRules">
      <v-col
        cols="12"
        sm="12"
        md="6"
        lg="4"
      >
        <v-select
          v-model="rules"
          :items="rulesIP"
          chips
          closable-chips
          multiple
          hide-details
          :label="$t('pages.rules')"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col
        cols="12"
        sm="6"
        md="3"
        lg="2"
      >
        <v-switch
          v-model="subClashNoDefGrp"
          color="primary"
          :label="$t('setting.clashNoDefGrp')"
          hide-details
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="3"
        lg="2"
      >
        <v-switch
          v-model="subClashSprtAll"
          color="primary"
          :label="$t('setting.clashSprtAll')"
          hide-details
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="3"
        lg="2"
      >
        <v-switch
          v-model="subClashUdp"
          color="primary"
          :label="$t('setting.clashUdp')"
          hide-details
        />
      </v-col>
    </v-row>
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
                v-model="optionMixed"
                color="primary"
                :label="$t('setting.mixedPort')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionTun"
                color="primary"
                :label="$t('setting.tun')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionExt"
                color="primary"
                :label="$t('basic.exp.extController')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionLog"
                color="primary"
                :label="$t('basic.log.title')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionDns"
                color="primary"
                :label="$t('pages.dns')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionRules"
                color="primary"
                :label="$t('pages.rules')"
                hide-details
              />
            </v-list-item>
          </v-list>
        </v-card>
      </v-menu>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { push } from 'notivue'
import Editor from './Editor.vue'
import yaml from 'yaml'
import { i18n } from '@/locales'

// Only the settings rows this form touches. The parent owns the whole
// settings object and keeps the rest of it.
interface ClashSettings {
  subClashExt: string
  subClashNoDefGrp: string
  subClashSprtAll: string
  subClashUdp: string
}

// The clash config the editor round-trips, parsed out of the stored YAML.
// Its values are whatever the operator typed, so every read asserts the
// shape it expects.
type MetaJson = Record<string, unknown>

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<ClashSettings>('settings', { required: true })

const enableEditor = ref(false)
const menu = ref(false)

const defaultConfig = {
  "mixed-port": 7890,
  "allow-lan": false,
  "mode": "rule",
  "log-level": "info",
  "external-controller": "127.0.0.1:9090",
  "tun": {
    "enable": true,
    "stack": "system",
    "auto-route": true,
    "auto-detect-interface": true,
    "dns-hijack": ["any:53"],
  },
  "dns": {
    "enable": true,
    "ipv6": false,
    "enhanced-mode": "fake-ip",
    "fake-ip-range": "198.18.0.1/16",
    "default-nameserver": ["8.8.8.8","1.1.1.1"],
    "nameserver": [
      "https://doh.pub/dns-query",
      "https://1.0.0.1/dns-query"
    ],
    "fallback": ["tcp://9.9.9.9:53"],
    "fake-ip-filter": ["*.lan", "localhost", "*.local"]
  },
  "rules": [
    "GEOIP,Private,DIRECT",
    "MATCH,Proxy"
  ]
}

const rulesIP = [
  { title: 'Private-Direct', value: 'GEOIP,Private,DIRECT' },
  { title: 'Private-Block', value: 'GEOIP,Private,REJECT' },
  { title: 'LAN-Direct', value: 'GEOIP,LAN,DIRECT' },
  { title: 'LAN-Block', value: 'GEOIP,LAN,REJECT' },
  { title: 'Ads-Direct', value: 'GEOIP,Ads,DIRECT' },
  { title: 'Ads-Block', value: 'GEOIP,Ads,REJECT' },
  { title: '🇨🇳 China-Direct', value: 'GEOIP,CN,DIRECT' },
  { title: '🇨🇳 China-Block', value: 'GEOIP,CN,REJECT' },
  { title: '🇮🇷 Iran-Direct', value: 'GEOIP,CATEGORY-IR,DIRECT' },
  { title: '🇮🇷 Iran-Block', value: 'GEOIP,CATEGORY-IR,REJECT' },
  { title: '🇻🇳 Vietnam-Direct', value: 'GEOIP,CATEGORY-VN,DIRECT' },
  { title: '🇻🇳 Vietnam-Block', value: 'GEOIP,CATEGORY-VN,REJECT' },
  { title: '🇯🇵 Japan-Direct', value: 'GEOIP,JP,DIRECT' },
  { title: '🇯🇵 Japan-Block', value: 'GEOIP,JP,REJECT' },
]

const metaJson = computed({
  get: (): MetaJson => {
    try {
      return yaml.parse(model.value.subClashExt)??{}
    } catch {
      return {}
    }
  },
  set: (v:MetaJson) => {
    model.value.subClashExt = Object.keys(v).length==0 ? "" : yaml.stringify(v)
  },
})

const optionMixed = computed({
  get: (): boolean => (metaJson.value['mixed-port'] as number)>0,
  set: (v:boolean) => {
    updateMetaJson(v ? defaultConfig['mixed-port'] : null, 'mixed-port')
    updateMetaJson(v ? defaultConfig['allow-lan'] : null, 'allow-lan')
  },
})

const optionTun = computed({
  get: (): boolean => (metaJson.value['tun'] as MetaJson | undefined)?.['enable'] as boolean?? false,
  set: (v:boolean) => { updateMetaJson(v ? defaultConfig['tun'] : null, 'tun') },
})

const optionExt = computed({
  get: (): boolean => ((metaJson.value['external-controller'] as string | undefined)?.length?? 0)>0,
  set: (v:boolean) => { updateMetaJson(v ? defaultConfig['external-controller'] : null, 'external-controller') },
})

const optionLog = computed({
  get: (): boolean => ((metaJson.value['log-level'] as string | undefined)?.length?? 0)>0,
  set: (v:boolean) => { updateMetaJson(v ? defaultConfig['log-level'] : null, 'log-level') },
})

const optionDns = computed({
  get: (): boolean => (metaJson.value['dns'] as MetaJson | undefined)?.['enable'] as boolean?? false,
  set: (v:boolean) => { updateMetaJson(v ? defaultConfig['dns'] : null, 'dns') },
})

const optionRules = computed({
  get: (): boolean => ((metaJson.value['rules'] as string[] | undefined)?.length?? 0)>0,
  set: (v:boolean) => {
    updateMetaJson(v ? defaultConfig['rules'] : null, 'rules')
    updateMetaJson(v ? defaultConfig['mode'] : null, 'mode')
  },
})

const mixedPort = computed({
  get: (): number => metaJson.value['mixed-port'] as number,
  set: (v:number) => { updateMetaJson(v, 'mixed-port') },
})

const allowLan = computed({
  get: (): boolean => metaJson.value['allow-lan'] as boolean,
  set: (v:boolean) => { updateMetaJson(v, 'allow-lan') },
})

const externalController = computed({
  get: (): string => metaJson.value['external-controller'] as string,
  set: (v:string) => { updateMetaJson(v, 'external-controller') },
})

const logLevel = computed({
  get: (): string => metaJson.value['log-level'] as string,
  set: (v:string) => { updateMetaJson(v, 'log-level') },
})

const dns = computed({
  get: (): boolean => (metaJson.value['dns'] as MetaJson | undefined)?.['enable'] as boolean ?? false,
  set: (v:boolean) => { updateMetaJson({ ...(metaJson.value['dns'] as MetaJson | undefined), 'enable': v }, 'dns') },
})

const tun = computed({
  get: (): boolean => (metaJson.value['tun'] as MetaJson | undefined)?.['enable'] as boolean ?? false,
  set: (v:boolean) => { updateMetaJson({ ...(metaJson.value['tun'] as MetaJson | undefined), 'enable': v }, 'tun') },
})

const rules = computed({
  get: (): string[] => {
    const current = metaJson.value.rules as string[]
    return current.length > 0 ? current.filter((r:string) => r != "MATCH,Proxy") : []
  },
  set: (v:string[]) => {
    let newRules = <string[]>[]
    v.forEach((r:string) => { newRules.push(r) })
    updateMetaJson([ ...newRules, "MATCH,Proxy" ], 'rules')
  },
})

const subClashNoDefGrp = computed({
  get: (): boolean => model.value.subClashNoDefGrp == "true",
  set: (v:boolean) => { model.value.subClashNoDefGrp = v ? "true" : "false" },
})

const subClashSprtAll = computed({
  get: (): boolean => model.value.subClashSprtAll == "true",
  set: (v:boolean) => { model.value.subClashSprtAll = v ? "true" : "false" },
})

const subClashUdp = computed({
  get: (): boolean => model.value.subClashUdp == "true",
  set: (v:boolean) => { model.value.subClashUdp = v ? "true" : "false" },
})

function openEditor() {
  enableEditor.value = true
}

function saveEditor(data:string) {
  try {
    const result = yaml.parse(data)
    if (typeof result != 'object' || Array.isArray(result)) throw new Error()
  } catch {
    push.error({
      message: i18n.global.t('failed') + ": " + i18n.global.t('error.invalidData'),
      duration: 5000,
    })
    return
  }
  model.value.subClashExt = data
  enableEditor.value = false
}

function updateMetaJson(data:unknown, key:string) {
  let newMetaJson = metaJson.value
  if (data==null) {
    delete newMetaJson[key]
  } else {
    newMetaJson[key] = data
  }
  metaJson.value = newMetaJson
}
</script>