<template>
  <v-card
    :subtitle="$t('objects.dial')"
    style="background-color: inherit;"
  >
    <v-row>
      <v-col
        v-if="optionDetour"
        cols="12"
        sm="6"
        md="4"
      >
        <v-select
          v-model="dial.detour"
          hide-details
          :label="$t('dial.detourText')"
          :items="outTags"
        />
      </v-col>
      <v-col
        v-if="optionBind"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="dial.bind_interface"
          :label="$t('dial.bindIf')"
          hide-details
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col
        v-if="optionIPV4"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="dial.inet4_bind_address"
          :label="$t('dial.bindIp4')"
          hide-details
        />
      </v-col>
      <v-col
        v-if="optionIPV6"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="dial.inet6_bind_address"
          :label="$t('dial.bindIp6')"
          hide-details
        />
      </v-col>
      <v-col
        v-if="optionBindNoPort"
        cols="12"
        sm="6"
        md="4"
      >
        <v-switch
          v-model="dial.bind_address_no_port"
          color="primary"
          :label="$t('dial.bindNoPort')"
          hide-details
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col
        v-if="optionRM"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model.number="routingMark"
          label="Linux Routing Mark"
          hide-details
          type="number"
          min="0"
        />
      </v-col>
      <v-col
        v-if="optionRA"
        cols="12"
        sm="6"
        md="4"
      >
        <v-switch
          v-model="dial.reuse_addr"
          color="primary"
          :label="$t('dial.reuseAddr')"
          hide-details
        />
      </v-col>
    </v-row>
    <v-row v-if="optionTCP">
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-switch
          v-model="dial.tcp_fast_open"
          color="primary"
          label="TCP Fast Open"
          hide-details
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-switch
          v-model="dial.tcp_multi_path"
          color="primary"
          label="TCP Multi Path"
          hide-details
        />
      </v-col>
    </v-row>
    <v-row v-if="optionTcpKeepAlive">
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-switch
          v-model="dial.disable_tcp_keep_alive"
          color="primary"
          :label="$t('dial.disableTcpKeepAlive')"
          hide-details
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="dial.tcp_keep_alive"
          :label="$t('dial.tcpKeepAlive')"
          hide-details
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="dial.tcp_keep_alive_interval"
          :label="$t('dial.tcpKeepAliveInterval')"
          hide-details
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col
        v-if="optionUDP"
        cols="12"
        sm="6"
        md="4"
      >
        <v-switch
          v-model="dial.udp_fragment"
          color="primary"
          label="UDP Fragment"
          hide-details
        />
      </v-col>
      <v-col
        v-if="optionCT"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model.number="connectTimeout"
          :label="$t('dial.connTimeout')"
          hide-details
          type="number"
          min="1"
          :suffix="$t('date.s')"
        />
      </v-col>
    </v-row>
    <v-row v-if="optionDR">
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-select
          v-model="dial.domain_resolver"
          hide-details
          :label="$t('dial.domainResolver')"
          :items="dnsTags"
        />
      </v-col>
    </v-row>
    <v-card-actions class="pt-0">
      <v-spacer />
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
            {{ $t('dial.options') }}
          </v-btn>
        </template>
        <v-card>
          <v-list>
            <v-list-item v-if="mode != 'client'">
              <v-switch
                v-model="optionDetour"
                color="primary"
                :label="$t('listen.detour')"
                hide-details
              />
            </v-list-item>
            <v-list-item v-if="mode != 'client'">
              <v-switch
                v-model="optionBind"
                color="primary"
                :label="$t('dial.bindIf')"
                hide-details
              />
            </v-list-item>
            <v-list-item v-if="mode != 'client'">
              <v-switch
                v-model="optionIPV4"
                color="primary"
                :label="$t('dial.bindIp4')"
                hide-details
              />
            </v-list-item>
            <v-list-item v-if="mode != 'client'">
              <v-switch
                v-model="optionIPV6"
                color="primary"
                :label="$t('dial.bindIp6')"
                hide-details
              />
            </v-list-item>
            <v-list-item v-if="mode != 'client'">
              <v-switch
                v-model="optionBindNoPort"
                color="primary"
                :label="$t('dial.bindNoPort')"
                hide-details
              />
            </v-list-item>
            <v-list-item v-if="mode != 'client'">
              <v-switch
                v-model="optionRM"
                color="primary"
                label="Routing Mark"
                hide-details
              />
            </v-list-item>
            <v-list-item v-if="mode != 'client'">
              <v-switch
                v-model="optionRA"
                color="primary"
                :label="$t('dial.reuseAddr')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionTCP"
                color="primary"
                :label="$t('listen.tcpOptions')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionUDP"
                color="primary"
                :label="$t('listen.udpOptions')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionCT"
                color="primary"
                :label="$t('dial.connTimeout')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionTcpKeepAlive"
                color="primary"
                :label="$t('dial.tcpKeepAlive')"
                hide-details
              />
            </v-list-item>
            <v-list-item v-if="mode != 'client'">
              <v-switch
                v-model="optionDR"
                color="primary"
                :label="$t('dial.domainResolver')"
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
import Data from '@/store/modules/data'

// The dial options a sing-box object can carry. Only the fields this form
// reads or writes are listed; the object the parent owns holds plenty more.
interface DialOptions {
  detour?: string
  bind_interface?: string
  inet4_bind_address?: string
  inet6_bind_address?: string
  bind_address_no_port?: boolean
  routing_mark?: number
  reuse_addr?: boolean
  connect_timeout?: string
  tcp_fast_open?: boolean
  tcp_multi_path?: boolean
  disable_tcp_keep_alive?: boolean
  tcp_keep_alive?: string
  tcp_keep_alive_interval?: string
  udp_fragment?: boolean
  domain_resolver?: string
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop. Inbounds, outbounds, endpoints, DNS servers,
// NTP and the HTTP clients each bind their own shape here, so the model asks
// only for an object and the narrowing happens below.
const model = defineModel<object>('dial', { required: true })

// Narrow once, since no caller hands over a type the template checker could
// follow. The computed returns the same object, so edits still reach the parent.
const dial = computed(() => model.value as DialOptions)

defineProps<{
  mode?: string
}>()

const menu = ref(false)

const outTags = computed((): string[] => [...(Data().outbounds?.map((o) => o.tag) ?? []), ...(Data().endpoints?.map((e) => e.tag) ?? [])])

const connectTimeout = computed({
  get: (): number => dial.value.connect_timeout ? parseInt(dial.value.connect_timeout.replace('s','')) : 5,
  set: (newValue:number) => { dial.value.connect_timeout = newValue > 0 ? newValue + 's' : '5s' },
})

const routingMark = computed({
  get: (): number => dial.value.routing_mark?? 0,
  set: (newValue:number) => { dial.value.routing_mark = newValue > 0 ? newValue : 0 },
})

const optionDetour = computed({
  get: (): boolean => dial.value.detour != undefined,
  set: (v:boolean) => {
    if (v) dial.value.detour = outTags.value[0]?? ''
    else delete dial.value.detour
  },
})

const optionBind = computed({
  get: (): boolean => dial.value.bind_interface != undefined,
  set: (v:boolean) => {
    if (v) dial.value.bind_interface = ''
    else delete dial.value.bind_interface
  },
})

const optionIPV4 = computed({
  get: (): boolean => dial.value.inet4_bind_address != undefined,
  set: (v:boolean) => {
    if (v) dial.value.inet4_bind_address = ''
    else delete dial.value.inet4_bind_address
  },
})

const optionIPV6 = computed({
  get: (): boolean => dial.value.inet6_bind_address != undefined,
  set: (v:boolean) => {
    if (v) dial.value.inet6_bind_address = ''
    else delete dial.value.inet6_bind_address
  },
})

const optionBindNoPort = computed({
  get: (): boolean => dial.value.bind_address_no_port != undefined,
  set: (v:boolean) => {
    if (v) dial.value.bind_address_no_port = true
    else delete dial.value.bind_address_no_port
  },
})

const optionTcpKeepAlive = computed({
  get: (): boolean => {
    return dial.value.disable_tcp_keep_alive != undefined ||
           dial.value.tcp_keep_alive != undefined ||
           dial.value.tcp_keep_alive_interval != undefined
  },
  set: (v:boolean) => {
    if (v) {
      dial.value.tcp_keep_alive = '5m'
      dial.value.tcp_keep_alive_interval = '75s'
    } else {
      delete dial.value.disable_tcp_keep_alive
      delete dial.value.tcp_keep_alive
      delete dial.value.tcp_keep_alive_interval
    }
  },
})

const optionRM = computed({
  get: (): boolean => dial.value.routing_mark != undefined,
  set: (v:boolean) => {
    if (v) dial.value.routing_mark = 0
    else delete dial.value.routing_mark
  },
})

const optionRA = computed({
  get: (): boolean => dial.value.reuse_addr != undefined,
  set: (v:boolean) => {
    if (v) dial.value.reuse_addr = true
    else delete dial.value.reuse_addr
  },
})

const optionTCP = computed({
  get: (): boolean => {
    return dial.value.tcp_fast_open != undefined &&
           dial.value.tcp_multi_path != undefined
  },
  set: (v:boolean) => {
    if (v) {
      dial.value.tcp_fast_open = false
      dial.value.tcp_multi_path = false
    } else {
      delete dial.value.tcp_fast_open
      delete dial.value.tcp_multi_path
    }
  },
})

const optionUDP = computed({
  get: (): boolean => dial.value.udp_fragment != undefined,
  set: (v:boolean) => {
    if (v) dial.value.udp_fragment = true
    else delete dial.value.udp_fragment
  },
})

const optionCT = computed({
  get: (): boolean => dial.value.connect_timeout != undefined,
  set: (v:boolean) => {
    if (v) dial.value.connect_timeout = '5s'
    else delete dial.value.connect_timeout
  },
})

const optionDR = computed({
  get: (): boolean => dial.value.domain_resolver != undefined,
  set: (v:boolean) => { dial.value.domain_resolver = v ? dnsTags.value[0]?? '' : undefined },
})

const dnsTags = computed((): string[] => Data().config.dns?.servers?.map((d) => d.tag) ?? [])
</script>
