<template>
  <v-card>
    <v-card-subtitle v-if="direction != 'out_json'">
      Snell
    </v-card-subtitle>
    <v-row>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-select
          v-model="version"
          hide-details
          :label="$t('types.snell.version')"
          :items="versions"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.psk"
          :label="$t('types.snell.psk')"
          hide-details
          :append-inner-icon="direction == 'in' ? 'mdi-refresh' : undefined"
          @click:append-inner="generatePsk"
        />
      </v-col>
      <v-col
        v-if="direction === 'out'"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.userkey"
          :label="$t('types.snell.userKey')"
          hide-details
          clearable
          @click:clear="delete data.userkey"
        />
      </v-col>
    </v-row>
    <!-- v5 (inbound) and v4 (outbound) carry obfs; v6 carries a mode -->
    <v-row v-if="obfsVersion">
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-select
          v-model="data.obfs_mode"
          hide-details
          :label="$t('types.snell.obfsMode')"
          :items="obfsModes"
          clearable
          @click:clear="delete data.obfs_mode"
        />
      </v-col>
      <v-col
        v-if="direction === 'out'"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.obfs_host"
          :label="$t('types.snell.obfsHost')"
          hide-details
          clearable
          @click:clear="delete data.obfs_host"
        />
      </v-col>
    </v-row>
    <v-row v-if="data.version == 6">
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-select
          v-model="data.mode"
          hide-details
          :label="$t('types.snell.mode')"
          :items="modes"
          clearable
          @click:clear="delete data.mode"
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
          v-model="data.reuse"
          color="primary"
          :label="$t('types.snell.reuse')"
          hide-details
        />
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import RandomUtil from '@/plugins/randomUtil'
import { Inbound } from '@/types/inbounds'
import { Outbound } from '@/types/outbounds'

// One form serves both directions, so it takes the widest shape either side
// can hold: the version numbers differ (v5 in, v4 out) and only the outbound
// side carries the client fields.
interface SnellData {
  version: number
  psk: string
  userkey?: string
  obfs_mode?: 'none' | 'http' | 'tls'
  obfs_host?: string
  mode?: 'default' | 'unshaped' | 'unsafe-raw'
  reuse?: boolean
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<Inbound | Outbound>('data', { required: true })

// The parent holds a union and picks this component with a v-if on the type,
// which the template checker cannot follow, so narrow once here. The computed
// returns the same object, so edits still reach the parent.
const data = computed(() => model.value as unknown as SnellData)

const props = defineProps<{
  direction: 'in' | 'out' | 'out_json'
}>()

const obfsModes = [
  { title: 'None', value: 'none' },
  { title: 'HTTP', value: 'http' },
  { title: 'TLS', value: 'tls' },
]

const modes = [
  { title: 'Default', value: 'default' },
  { title: 'Unshaped', value: 'unshaped' },
  { title: 'Unsafe Raw', value: 'unsafe-raw' },
]

// Inbounds support v5 and v6, outbounds v4 and v6.
const legacyVersion = computed((): number => props.direction === 'in' ? 5 : 4)

const versions = computed((): { title: string, value: number }[] => [
  { title: 'v' + legacyVersion.value, value: legacyVersion.value },
  { title: 'v6', value: 6 },
])

const obfsVersion = computed((): boolean => data.value.version === legacyVersion.value)

const version = computed({
  get: (): number => data.value.version,
  // The version selects which extra options apply, so drop the ones
  // belonging to the version being left behind.
  set: (v: number) => {
    data.value.version = v
    if (v === 6) {
      delete data.value.obfs_mode
      delete data.value.obfs_host
    } else {
      delete data.value.mode
    }
  },
})

function generatePsk() {
  // sing-box requires 12-255 bytes.
  data.value.psk = RandomUtil.randomSeq(32)
}
</script>
