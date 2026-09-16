<template>
  <v-card>
    <v-card-subtitle v-if="direction != 'out_json'">
      Naive
    </v-card-subtitle>
    <!-- Inbound -->
    <template v-if="direction === 'in'">
      <v-row>
        <v-col
          cols="12"
          sm="6"
          md="4"
        >
          <Network :data="data" />
        </v-col>
        <v-col
          cols="12"
          sm="6"
          md="4"
        >
          <v-select
            v-model="data.quic_congestion_control"
            hide-details
            :label="$t('types.naive.quicCongestion')"
            :items="inbCngs"
            clearable
            @click:clear="delete data.quic_congestion_control"
          />
        </v-col>
      </v-row>
    </template>
    <!-- Outbound -->
    <template v-if="['out', 'out_json'].includes(direction)">
      <v-row v-if="direction === 'out'">
        <v-col
          cols="12"
          sm="6"
          md="4"
        >
          <v-text-field
            v-model="data.username"
            :label="$t('types.un')"
            hide-details
          />
        </v-col>
        <v-col
          cols="12"
          sm="6"
          md="4"
        >
          <v-text-field
            v-model="data.password"
            :label="$t('types.pw')"
            hide-details
            type="password"
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
            v-model.number="insecure_concurrency"
            :label="$t('types.naive.insecureConcurrency')"
            type="number"
            min="0"
            hide-details
          />
        </v-col>
        <v-col
          cols="12"
          sm="6"
          md="4"
        >
          <v-switch
            v-model="udpOverTcp"
            color="primary"
            :label="$t('types.naive.udpOverTcp')"
            hide-details
          />
        </v-col>
      </v-row>
      <v-row v-if="direction === 'out'">
        <v-col
          cols="12"
          sm="6"
          md="4"
        >
          <v-switch
            v-model="data.quic"
            color="primary"
            :label="$t('types.naive.quic')"
            hide-details
          />
        </v-col>
        <v-col
          v-if="data.quic"
          cols="12"
          sm="6"
          md="4"
        >
          <v-select
            v-model="data.quic_congestion_control"
            hide-details
            :label="$t('types.naive.quicCongestion')"
            :items="outCngs"
            clearable
            @click:clear="delete data.quic_congestion_control"
          />
        </v-col>
      </v-row>
      <Headers :data="extra_headers" />
    </template>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Network from '@/components/Network.vue'
import Headers from '@/components/Headers.vue'
import { Inbound } from '@/types/inbounds'
import { Outbound } from '@/types/outbounds'

// One form serves both directions, so it takes the widest shape either side
// can hold: the inbound side only picks a congestion control, while the
// client fields, the extra headers and the QUIC toggle belong to the
// outbound side.
interface NaiveData {
  quic_congestion_control?: 'bbr' | 'bbr_standard' | 'bbr2' | 'bbr2_variant' | 'cubic' | 'reno'
  username?: string
  password?: string
  insecure_concurrency?: number
  // sing-box accepts either a bare boolean or the versioned object form.
  udp_over_tcp?: boolean | { enabled?: boolean, version?: number }
  quic?: boolean
  extra_headers?: Record<string, string | string[]>
}

// Headers.vue edits a `headers` field, which this protocol calls
// `extra_headers`, so it is handed a view carrying that one name.
interface HeadersView {
  headers?: Record<string, string | string[]>
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<Inbound | Outbound>('data', { required: true })

// The parent holds a union and picks this component with a v-if on the type,
// which the template checker cannot follow, so narrow once here. The computed
// returns the same object, so edits still reach the parent.
const data = computed(() => model.value as unknown as NaiveData)

defineProps<{
  direction: 'in' | 'out' | 'out_json'
}>()

const inbCngs = [
  { title: 'BBR', value: 'bbr'},
  { title: 'BBR Standard', value: 'bbr_standard'},
  { title: 'BBRv2', value: 'bbr2'},
  { title: 'BBRv2 variant', value: 'bbr2_variant'},
  { title: 'Cubic', value: 'cubic'},
  { title: 'New Reno', value: 'reno'},
]

const outCngs = [
  { title: 'BBR', value: 'bbr'},
  { title: 'BBR2', value: 'bbr2'},
  { title: 'Cubic', value: 'cubic'},
  { title: 'Reno', value: 'reno'},
]

const udpOverTcp = computed({
  get: (): boolean => {
    const u = data.value.udp_over_tcp
    return u === true || (typeof u === 'object' && u != null && u.enabled === true)
  },
  set: (v: boolean) => {
    if (v) {
      data.value.udp_over_tcp = { enabled: true }
    } else {
      data.value.udp_over_tcp = false
    }
  },
})

const insecure_concurrency = computed({
  get: (): number => data.value.insecure_concurrency ?? 0,
  set: (v: number) => {
    data.value.insecure_concurrency = v > 0 ? v : undefined
  },
})

const extra_headers = computed((): HeadersView => {
  const d = data.value
  return new Proxy({} as HeadersView, {
    get(_, prop) {
      if (prop === 'headers') return d?.extra_headers ?? {}
      return undefined
    },
    set(_, prop, value) {
      if (prop === 'headers') {
        d.extra_headers = value
        return true
      }
      return false
    }
  })
})
</script>
