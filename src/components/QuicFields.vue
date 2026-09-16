<template>
  <v-card
    :subtitle="quic ? 'QUIC' : 'HTTP/2'"
    style="background-color: inherit;"
  >
    <v-row>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-switch
          v-model="show"
          color="primary"
          :label="$t('enable')"
          hide-details
        />
      </v-col>
    </v-row>
    <template v-if="show">
      <v-row>
        <v-col
          cols="12"
          sm="6"
          md="4"
        >
          <v-text-field
            v-model="idleTimeout"
            :label="$t('quic.idleTimeout')"
            placeholder="30s"
            hide-details
            clearable
          />
        </v-col>
        <v-col
          cols="12"
          sm="6"
          md="4"
        >
          <v-text-field
            v-model="keepAlivePeriod"
            :label="$t('quic.keepAlive')"
            placeholder="0s"
            hide-details
            clearable
          />
        </v-col>
        <v-col
          cols="12"
          sm="6"
          md="4"
        >
          <v-text-field
            v-model.number="maxConcurrentStreams"
            :label="$t('quic.maxStreams')"
            type="number"
            min="0"
            hide-details
          />
        </v-col>
      </v-row>
      <!-- Byte sizes take a plain number or a string with a unit, e.g. 8mb. -->
      <v-row>
        <v-col
          cols="12"
          sm="6"
        >
          <v-text-field
            v-model="streamReceiveWindow"
            :label="$t('quic.streamWindow')"
            placeholder="8mb"
            hide-details
            clearable
          />
        </v-col>
        <v-col
          cols="12"
          sm="6"
        >
          <v-text-field
            v-model="connectionReceiveWindow"
            :label="$t('quic.connectionWindow')"
            placeholder="16mb"
            hide-details
            clearable
          />
        </v-col>
      </v-row>
      <v-row v-if="quic">
        <v-col
          cols="12"
          sm="6"
          md="4"
        >
          <v-text-field
            v-model.number="initialPacketSize"
            :label="$t('quic.initialPacketSize')"
            type="number"
            min="0"
            hide-details
          />
        </v-col>
        <v-col
          cols="12"
          sm="6"
          md="4"
          align-self="center"
        >
          <v-switch
            v-model="data.disable_path_mtu_discovery"
            color="primary"
            :label="$t('quic.disableMtuDiscovery')"
            hide-details
          />
        </v-col>
      </v-row>
    </template>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { HttpClient } from '@/types/httpClient'
import { Inbound } from '@/types/inbounds'
import { Outbound } from '@/types/outbounds'

// The transport tuning sing-box flattens into whatever carries it. Every field
// is optional, and an empty one is removed rather than written out: sing-box
// rejects "" for a duration or a byte size, so a revealed but unfilled group
// has to leave no trace.
const http2Keys = [
  'idle_timeout',
  'keep_alive_period',
  'stream_receive_window',
  'connection_receive_window',
  'max_concurrent_streams',
] as const
const quicKeys = ['initial_packet_size', 'disable_path_mtu_discovery'] as const

type FieldKey = typeof http2Keys[number] | typeof quicKeys[number]
// The keys whose value is typed in as text; the rest are numbers or switches.
type TextKey = 'idle_timeout' | 'keep_alive_period' | 'stream_receive_window' | 'connection_receive_window'

// The tuning fields this form edits, as they sit on their carrier. Byte sizes
// take a number or a string with a unit ("8mb").
interface TuningData {
  idle_timeout?: string
  keep_alive_period?: string
  stream_receive_window?: number | string
  connection_receive_window?: number | string
  max_concurrent_streams?: number
  initial_packet_size?: number
  disable_path_mtu_discovery?: boolean
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<HttpClient | Inbound | Outbound>('data', { required: true })

// The carriers are unions the template checker cannot narrow, so narrow once
// here. The computed returns the same object, so edits still reach the parent.
const data = computed(() => model.value as unknown as TuningData)

const props = defineProps<{
  quic?: boolean
}>()

// Revealing the group writes nothing, so clearing the last field does
// not make it collapse under the operator.
const show = ref(false)

const fields = computed((): FieldKey[] => props.quic ? [...http2Keys, ...quicKeys] : [...http2Keys])

const idleTimeout = computed({
  get: (): string => text('idle_timeout'),
  set: (v: string) => { setText('idle_timeout', v) },
})

const keepAlivePeriod = computed({
  get: (): string => text('keep_alive_period'),
  set: (v: string) => { setText('keep_alive_period', v) },
})

const streamReceiveWindow = computed({
  get: (): string => String(data.value.stream_receive_window ?? ''),
  set: (v: string) => { setText('stream_receive_window', v) },
})

const connectionReceiveWindow = computed({
  get: (): string => String(data.value.connection_receive_window ?? ''),
  set: (v: string) => { setText('connection_receive_window', v) },
})

const maxConcurrentStreams = computed({
  get: (): number => data.value.max_concurrent_streams ?? 0,
  set: (v: number) => {
    if (v > 0) data.value.max_concurrent_streams = v
    else delete data.value.max_concurrent_streams
  },
})

const initialPacketSize = computed({
  get: (): number => data.value.initial_packet_size ?? 0,
  set: (v: number) => {
    if (v > 0) data.value.initial_packet_size = v
    else delete data.value.initial_packet_size
  },
})

// Turning the group off clears what it owns; the fields themselves are
// already removed as they are emptied.
watch(show, (v: boolean) => {
  if (!v) fields.value.forEach(key => delete data.value[key])
})

watch(model, () => { syncShow() }, { immediate: true })

function syncShow() {
  show.value = fields.value.some(key => data.value?.[key] != undefined)
}

function text(key: 'idle_timeout' | 'keep_alive_period'): string {
  return data.value?.[key] ?? ''
}

function setText(key: TextKey, value: string) {
  const trimmed = (value ?? '').trim()
  if (trimmed) data.value[key] = trimmed
  else delete data.value[key]
}
</script>
