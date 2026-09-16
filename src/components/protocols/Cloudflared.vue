<template>
  <v-card>
    <v-card-subtitle>Cloudflared</v-card-subtitle>
    <v-row>
      <v-col
        cols="12"
        md="8"
      >
        <v-text-field
          v-model="data.token"
          :label="$t('types.cloudflared.token')"
          hide-details
          type="password"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-select
          v-model="data.protocol"
          hide-details
          :label="$t('types.cloudflared.protocol')"
          :items="protocols"
          clearable
          @click:clear="delete data.protocol"
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
          v-model.number="haConnections"
          :label="$t('types.cloudflared.haConnections')"
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
        <v-select
          v-model="data.edge_ip_version"
          hide-details
          :label="$t('types.cloudflared.edgeIpVersion')"
          :items="edgeIpVersions"
          clearable
          @click:clear="delete data.edge_ip_version"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-select
          v-model="data.datagram_version"
          hide-details
          :label="$t('types.cloudflared.datagramVersion')"
          :items="datagramVersions"
          clearable
          @click:clear="delete data.datagram_version"
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
          v-model="data.region"
          :label="$t('types.cloudflared.region')"
          hide-details
          clearable
          @click:clear="delete data.region"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.grace_period"
          :label="$t('types.cloudflared.gracePeriod')"
          hide-details
          clearable
          placeholder="30s"
          @click:clear="delete data.grace_period"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-switch
          v-model="data.post_quantum"
          color="primary"
          :label="$t('types.cloudflared.postQuantum')"
          hide-details
        />
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Inbound } from '@/types/inbounds'

// Cloudflared is inbound only; every option besides the token is optional and
// is removed rather than written out when cleared.
interface CloudflaredData {
  token?: string
  protocol?: string
  ha_connections?: number
  edge_ip_version?: number
  datagram_version?: string
  region?: string
  grace_period?: string
  post_quantum?: boolean
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<Inbound>('data', { required: true })

// The parent holds a union and picks this component with a v-if on the type,
// which the template checker cannot follow, so narrow once here. The computed
// returns the same object, so edits still reach the parent.
const data = computed(() => model.value as unknown as CloudflaredData)

const protocols = [
  { title: 'Auto', value: 'auto' },
  { title: 'QUIC', value: 'quic' },
  { title: 'HTTP/2', value: 'http2' },
  { title: 'h2mux', value: 'h2mux' },
]

const edgeIpVersions = [
  { title: 'Auto', value: 0 },
  { title: 'IPv4', value: 4 },
  { title: 'IPv6', value: 6 },
]

const datagramVersions = [
  { title: 'v2', value: 'v2' },
  { title: 'v3', value: 'v3' },
]

const haConnections = computed({
  get: (): number => data.value.ha_connections ?? 0,
  set: (v: number) => { data.value.ha_connections = v > 0 ? v : undefined },
})
</script>
