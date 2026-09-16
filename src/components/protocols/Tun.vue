<template>
  <v-card subtitle="Tun">
    <v-row>
      <v-col
        cols="12"
        sm="8"
      >
        <v-text-field
          v-model="addrs"
          :label="$t('types.tun.addr') + ' ' + $t('commaSeparated')"
          placeholder="172.18.0.1/30"
          hide-details
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.interface_name"
          :label="$t('types.tun.ifName')"
          placeholder="tun0"
          hide-details
          clearable
          @click:clear="delete data.interface_name"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model.number="data.mtu"
          type="number"
          label="MTU"
          hide-details
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model.number="udpTimeout"
          type="number"
          label="UDP timeout"
          min="1"
          :suffix="$t('date.m')"
          hide-details
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-select
          v-model="data.stack"
          label="Stack"
          :items="['system','gvisor','mixed']"
          hide-details
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-switch
          v-model="autoRoute"
          color="primary"
          label="Auto Route"
          hide-details
        />
      </v-col>
      <v-col
        v-if="autoRoute"
        cols="12"
        sm="6"
        md="4"
      >
        <v-switch
          v-model="data.auto_redirect"
          color="primary"
          label="Auto Redirect"
          hide-details
        />
      </v-col>
      <v-col
        v-if="autoRoute"
        cols="12"
        sm="6"
        md="4"
      >
        <v-switch
          v-model="data.strict_route"
          color="primary"
          label="Strict Route"
          hide-details
        />
      </v-col>
      <v-col
        v-if="autoRoute && data.auto_redirect"
        cols="12"
        sm="6"
        md="4"
      >
        <v-switch
          v-model="data.exclude_mptcp"
          color="primary"
          :label="$t('types.tun.excludeMptcp')"
          hide-details
        />
      </v-col>
      <v-col
        v-if="autoRoute && data.auto_redirect"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model.number="fallbackRuleIndex"
          type="number"
          :label="$t('types.tun.fallbackRuleIndex')"
          min="0"
          hide-details
        />
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Inbound } from '@/types/inbounds'

// Only the Tun inbound fields this form reads or writes.
interface TunData {
  address?: string[]
  interface_name?: string
  mtu?: number
  udp_timeout?: string
  stack?: string
  auto_route?: boolean
  strict_route?: boolean
  auto_redirect?: boolean
  exclude_mptcp?: boolean
  auto_redirect_iproute2_fallback_rule_index?: number
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<Inbound>('data', { required: true })

// The parent holds a union and picks this component with a v-if on the type,
// which the template checker cannot follow, so narrow once here. The computed
// returns the same object, so edits still reach the parent.
const data = computed(() => model.value as unknown as TunData)

const addrs = computed({
  get: (): string | undefined => data.value.address?.join(','),
  set: (v:string) => { data.value.address = v.length > 0 ? v.split(',') : undefined },
})

const udpTimeout = computed({
  get: (): number => data.value.udp_timeout ? parseInt(data.value.udp_timeout.replace('m','')) : 5,
  set: (v:number) => { data.value.udp_timeout = v > 0 ? v + 'm' : '5m' },
})

const autoRoute = computed({
  get: (): boolean => data.value.auto_route ?? false,
  set: (v:boolean) => {
    data.value.auto_route = v
    data.value.auto_redirect = v ? false : undefined
    data.value.strict_route = v ? false : undefined
  },
})

const fallbackRuleIndex = computed({
  get: (): number => data.value.auto_redirect_iproute2_fallback_rule_index ?? 32768,
  set: (v: number) => {
    const val = typeof v === 'number' && !isNaN(v) && v >= 0 ? v : undefined
    data.value.auto_redirect_iproute2_fallback_rule_index = val
  },
})
</script>
