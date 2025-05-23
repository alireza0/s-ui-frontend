<template>
  <v-row style="margin-bottom: 10px;">
    <v-col cols="12" justify="center" align="center">
      <v-btn variant="outlined" color="warning" @click="saveConfig" :loading="loading" :disabled="stateChange">
        {{ $t('actions.save') }}
      </v-btn>
    </v-col>
  </v-row>
  <v-expansion-panels>
    <v-expansion-panel :title="$t('basic.log.title')">
      <v-expansion-panel-text>
        <v-row>
          <v-col cols="12" sm="6" md="3" lg="2">
            <v-switch v-model="appConfig.log.disabled" color="primary" :label="$t('disable')" hide-details></v-switch>
          </v-col>
          <v-col cols="12" sm="6" md="3" lg="2">
            <v-select
              hide-details
              :label="$t('basic.log.level')"
              :items="levels"
              clearable
              @click:clear="delete appConfig.log.level"
              v-model="appConfig.log.level">
            </v-select>
          </v-col>
          <v-col cols="12" sm="6" md="3" lg="2">
            <v-text-field
              v-model="appConfig.log.output"
              hide-details
              :label="$t('basic.log.output')"
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6" md="3" lg="2">
            <v-switch v-model="appConfig.log.timestamp" color="primary" :label="$t('basic.log.timestamp')" hide-details></v-switch>
          </v-col>
        </v-row>
      </v-expansion-panel-text>
    </v-expansion-panel>
    <v-expansion-panel title="DNS">
      <v-expansion-panel-text>
        <v-row>
          <v-col cols="12" sm="6" md="3" lg="2">
            <v-select
              hide-details
              :label="$t('basic.dns.final')"
              :items="[ {title: $t('basic.dns.firstServer'), value: ''}, ...dnsServersTags]"
              v-model="finalDns">
            </v-select>
          </v-col>
          <v-col cols="12" sm="6" md="3" lg="2">
            <v-select
              hide-details
              :label="$t('listen.domainStrategy')"
              clearable
              @click:clear="delete appConfig.dns.strategy"
              :items="['prefer_ipv4','prefer_ipv6','ipv4_only','ipv6_only']"
              v-model="appConfig.dns.strategy">
            </v-select>
          </v-col>
          <v-col cols="12" sm="6" md="3" lg="2">
            <v-text-field
              v-model="appConfig.dns.client_subnet" hide-details
              clearable @click:clear="delete appConfig.dns.client_subnet"
              label="Client Subnet"></v-text-field>
          </v-col>
          <v-col cols="auto">
            <v-text-field
              v-model.number="appConfig.dns.cache_capacity"
              type="number" min="0" hide-details
              clearable @click:clear="delete appConfig.dns.cache_capacity"
              label="Cache Capacity"></v-text-field>
          </v-col>
          <v-col cols="auto">
            <v-checkbox v-model="appConfig.dns.disable_cache" hide-details label="Disable Cache" />
          </v-col>
          <v-col cols="auto">
            <v-checkbox v-model="appConfig.dns.disable_expire" hide-details label="Disable Expire" />
          </v-col>
          <v-col cols="auto">
            <v-checkbox v-model="appConfig.dns.independent_cache" hide-details label="Independent Cache" />
          </v-col>
          <v-col cols="auto">
            <v-checkbox v-model="appConfig.dns.reverse_mapping" hide-details label="Reverse Mapping" />
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" sm="6" md="3" lg="2" align-self="center">
            <v-btn @click="addDnsServer" rounded>
              <v-icon icon="mdi-plus" />{{ $t('basic.dns.server') }}
            </v-btn>
          </v-col>
        </v-row>
        <template v-for="(s, index) in appConfig.dns.servers">
          {{ $t('basic.dns.server') + ' ' + (index+1) }} <v-icon icon="mdi-delete" @click="appConfig.dns.servers.splice(index,1)" />
          <v-divider></v-divider>
          <v-row>
            <v-col cols="12" sm="6" md="3" lg="2">
              <v-text-field
                v-model="s.tag"
                hide-details
                clearable
                @click:clear="delete s.tag"
                :label="$t('objects.tag')"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6" md="3" lg="2">
              <v-text-field
                v-model="s.address"
                hide-details
                :label="$t('out.addr')"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6" md="3" lg="2">
              <v-text-field
                v-model="s.address_resolver"
                hide-details
                clearable
                @click:clear="delete s.address_resolver"
                :label="$t('basic.dns.addrResolver')"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6" md="3" lg="2">
              <v-select
                hide-details
                :label="$t('objects.outbound')"
                clearable
                @click:clear="delete s.detour"
                :items="outboundTags"
                v-model="s.detour">
              </v-select>
            </v-col>
            <v-col cols="12" sm="6" md="3" lg="2">
              <v-select
                hide-details
                :label="$t('listen.domainStrategy')"
                clearable
                @click:clear="delete s.strategy"
                :items="['prefer_ipv4','prefer_ipv6','ipv4_only','ipv6_only']"
                v-model="s.strategy">
              </v-select>
            </v-col>
          </v-row>
        </template>
      </v-expansion-panel-text>
    </v-expansion-panel>
    <v-expansion-panel title="NTP">
      <v-expansion-panel-text>
        <v-row>
          <v-col cols="12" sm="6" md="3" lg="2">
            <v-switch v-model="enableNtp" color="primary" :label="$t('enable')" hide-details></v-switch>
          </v-col>
          <v-col cols="12" sm="6" md="3" lg="2" v-if="appConfig.ntp?.enabled">
            <v-text-field
              v-model="appConfig.ntp.server"
              hide-details
              :label="$t('out.addr')"
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6" md="3" lg="2" v-if="appConfig.ntp?.enabled">
            <v-text-field
              v-model="appConfig.ntp.server_port"
              hide-details
              type="number"
              clearable
              @click:clear="delete appConfig.ntp?.server_port"
              :label="$t('out.port')"
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6" md="3" lg="2" v-if="appConfig.ntp?.enabled">
            <v-text-field
              v-model="ntpInterval"
              hide-details
              :suffix="$t('date.m')"
              min="0"
              type="number"
              :label="$t('ruleset.interval')"
            ></v-text-field>
          </v-col>
        </v-row>
        <Dial :dial="appConfig.ntp" :outTags="outboundTags" v-if="appConfig.ntp?.enabled" />
      </v-expansion-panel-text>
    </v-expansion-panel>
    <v-expansion-panel :title="$t('basic.routing.title')">
      <v-expansion-panel-text>
        <v-row>
          <v-col cols="12" sm="6" md="3" lg="2">
            <v-select
              hide-details
              :label="$t('basic.routing.defaultOut')"
              clearable
              @click:clear="delete appConfig.route.final"
              :items="outboundTags"
              v-model="appConfig.route.final">
            </v-select>
          </v-col>
          <v-col cols="12" sm="6" md="3" lg="2">
            <v-text-field
              v-model="appConfig.route.default_interface"
              hide-details
              clearable
              @click:clear="delete appConfig.route.default_interface"
              :label="$t('basic.routing.defaultIf')"
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6" md="3" lg="2">
            <v-text-field
              v-model.number="routeMark"
              hide-details
              type="number"
              min="0"
              :label="$t('basic.routing.defaultRm')"
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6" md="3" lg="2">
            <v-switch
              v-model="appConfig.route.auto_detect_interface"
              color="primary"
              :label="$t('basic.routing.autoBind')"
              hide-details>
            </v-switch>
          </v-col>
        </v-row>
      </v-expansion-panel-text>
    </v-expansion-panel>
    <v-expansion-panel title="Experimental">
      <v-expansion-panel-text>
        Cache File
        <v-divider></v-divider>
        <v-row>
          <v-col cols="12" sm="6" md="3" lg="2">
            <v-switch v-model="enableCacheFile" color="primary" :label="$t('enable')" hide-details></v-switch>
          </v-col>
          <v-col cols="12" sm="6" md="3" lg="2" v-if="appConfig.experimental.cache_file">
            <v-text-field
              v-model="appConfig.experimental.cache_file.path"
              hide-details
              :label="$t('transport.path')"
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6" md="3" lg="2" v-if="appConfig.experimental.cache_file">
            <v-text-field
              v-model="appConfig.experimental.cache_file.cache_id"
              hide-details
              label="Cache ID"
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6" md="3" lg="2" v-if="appConfig.experimental.cache_file">
            <v-switch v-model="appConfig.experimental.cache_file.store_fakeip"
              color="primary"
              :label="$t('basic.exp.storeFakeIp')"
              hide-details></v-switch>
          </v-col>
        </v-row>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script lang="ts" setup>
import Data from '@/store/modules/data'
import Dial from '@/components/Dial.vue'
import { computed, ref, onMounted } from 'vue'
import { Config, Ntp } from '@/types/config'
import { FindDiff } from '@/plugins/utils'

const oldConfig = ref({})
const loading = ref(false)

const appConfig = computed((): Config => {
  return <Config> Data().config
})

onMounted(async () => {
  oldConfig.value = JSON.parse(JSON.stringify(Data().config))
})

const stateChange = computed(() => {
  return FindDiff.deepCompare(appConfig.value,oldConfig.value)
})

const saveConfig = async () => {
  loading.value = true
  const success = await Data().save("config", "set", appConfig.value)
  if (success) {
    oldConfig.value = JSON.parse(JSON.stringify(Data().config))
    loading.value = false
  }
}

const outboundTags = computed((): string[] => {
  return [...Data().outbounds?.map((o:any) => o.tag), ...Data().endpoints?.map((e:any) => e.tag)]
})

const levels = ["trace", "debug", "info", "warn", "error", "fatal", "panic"]

const dnsServersTags = computed((): string[] => {
  const s = <string[]>appConfig.value.dns.servers?.filter(s => s.tag && s.tag != "")?.map(s => s.tag)
  return s?? <string[]>[]
})

const finalDns = computed({
  get() { return appConfig.value.dns.final?? '' },
  set(v:string) { appConfig.value.dns.final = v.length>0 ? v : undefined }
})

const addDnsServer = () => {
  if (!appConfig.value.dns.servers) appConfig.value.dns.servers = []
  appConfig.value.dns.servers.push({address: 'local'})
}

const routeMark = computed({
  get() { return appConfig.value.route.default_mark?? 0 },
  set(v:number) { v>0 ? appConfig.value.route.default_mark = v : delete appConfig.value.route.default_mark }
})

const enableNtp = computed({
  get() { return appConfig.value.ntp?.enabled?? false },
  set(v:boolean) { 
    if (v){
      appConfig.value.ntp = <Ntp>{ enabled: true, server: 'time.apple.com', server_port: 123, interval: '30m'}
    } else { appConfig.value.ntp = <Ntp>{}  }
  }
})

const ntpInterval = computed({
  get():any { return appConfig.value.ntp?.interval? parseInt(appConfig.value.ntp?.interval.replace('m','')) : null },
  set(v:number) { if (appConfig.value.ntp) v>0 ? appConfig.value.ntp.interval =  v + 'm' : delete appConfig.value.ntp.interval }
})

const enableCacheFile = computed({
  get() { return appConfig.value.experimental.cache_file?.enabled?? false },
  set(v:boolean) { 
    if (v){
      appConfig.value.experimental.cache_file = { enabled: true }
    } else { delete appConfig.value.experimental.cache_file  }
  }
})

</script>