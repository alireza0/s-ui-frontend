<template>
  <v-card subtitle="TUIC">
    <v-row v-if="direction == 'out'">
      <v-col
        cols="12"
        sm="6"
      >
        <v-text-field
          v-model="data.uuid"
          label="UUID"
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
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <Network :data="model" />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-select
          v-model="data.udp_relay_mode"
          hide-details
          label="UDP Relay Mode"
          :items="['native', 'quic']"
          clearable
          @click:clear="delete data.udp_relay_mode"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-switch
          v-model="data.udp_over_stream"
          color="primary"
          label="UDP Over Stream"
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
        <v-select
          v-model="data.congestion_control"
          hide-details
          :label="$t('types.tuic.congControl')"
          :items="congestion_controls"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-switch
          v-model="data.zero_rtt_handshake"
          color="primary"
          label="Zero-RTT Handshake"
          hide-details
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col
        v-if="direction == 'in'"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model.number="auth_timeout"
          :label="$t('types.tuic.authTimeout')"
          hide-details
          type="number"
          :suffix="$t('date.s')"
          min="1"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model.number="heartbeat"
          :label="$t('types.tuic.hb')"
          hide-details
          type="number"
          :suffix="$t('date.s')"
          min="1"
        />
      </v-col>
    </v-row>
    <QuicFields
      :data="model"
      quic
    />
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import QuicFields from '@/components/QuicFields.vue'
import Network from '@/components/Network.vue'
import { Inbound } from '@/types/inbounds'
import { Outbound } from '@/types/outbounds'

// One form serves both directions, so it takes the widest shape either side
// can hold: only the outbound side carries the client credentials and the UDP
// relay options, only the inbound side carries the auth timeout.
interface TuicData {
  uuid?: string
  password?: string
  udp_relay_mode?: "native" | "quic"
  udp_over_stream?: boolean
  congestion_control?: ""|"cubic"|"new_reno"|"bbr"
  zero_rtt_handshake?: boolean
  auth_timeout?: string
  heartbeat?: string
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<Inbound | Outbound>('data', { required: true })

// The parent holds a union and picks this component with a v-if on the type,
// which the template checker cannot follow, so narrow once here. The computed
// returns the same object, so edits still reach the parent.
const data = computed(() => model.value as unknown as TuicData)

defineProps<{
  direction: 'in' | 'out'
}>()

const congestion_controls = [
  "cubic","new_reno", "bbr"
]

const auth_timeout = computed({
  get: (): number | '' => data.value.auth_timeout ? parseInt(data.value.auth_timeout.replace('s','')) : '',
  set: (newValue:number) => { data.value.auth_timeout = newValue ? newValue + 's' : '' },
})

const heartbeat = computed({
  get: (): number | '' => data.value.heartbeat ? parseInt(data.value.heartbeat.replace('s','')) : '',
  set: (newValue:number) => { data.value.heartbeat = newValue ? newValue + 's' : '' },
})
</script>
