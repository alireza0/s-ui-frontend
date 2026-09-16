<template>
  <v-card subtitle="Hysteria">
    <v-row>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model.number="up_mbps"
          :label="$t('stats.upload')"
          hide-details
          type="number"
          :suffix="$t('stats.Mbps')"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model.number="down_mbps"
          :label="$t('stats.download')"
          hide-details
          type="number"
          :suffix="$t('stats.Mbps')"
          min="0"
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
          v-model="data.obfs"
          :label="$t('types.hy.obfs')"
          hide-details
        />
      </v-col>
      <v-col
        v-if="direction=='out'"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.auth_str"
          :label="$t('types.hy.auth')"
          hide-details
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col
        v-if="direction=='out'"
        cols="12"
        sm="6"
        md="4"
      >
        <Network :data="model" />
      </v-col>
    </v-row>
    <v-row v-if="direction=='out'">
      <v-col
        v-if="optionMPort"
        cols="12"
        sm="8"
      >
        <v-text-field
          v-model="server_ports"
          :label="$t('rule.portRange') + ' ' + $t('commaSeparated')"
        />
      </v-col>
      <v-col
        v-if="optionMPort"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model.number="hop_interval"
          label="Hop interval"
          type="number"
          min="0"
          :suffix="$t('date.s')"
        />
      </v-col>
    </v-row>
    <v-card-actions>
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
            {{ $t('types.hy.hyOptions') }}
          </v-btn>
        </template>
        <v-card>
          <v-list>
            <v-list-item v-if="direction=='out'">
              <v-switch
                v-model="optionMPort"
                color="primary"
                :label="$t('rule.portRange')"
                hide-details
              />
            </v-list-item>
          </v-list>
        </v-card>
      </v-menu>
    </v-card-actions>
    <QuicFields
      :data="model"
      quic
    />
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import QuicFields from '@/components/QuicFields.vue'
import Network from '@/components/Network.vue'
import { Inbound } from '@/types/inbounds'
import { Outbound } from '@/types/outbounds'

// One form serves both directions, so it takes the widest shape either side
// can hold: only the outbound side carries the auth string, the port hopping
// and the network field.
interface HysteriaData {
  up_mbps?: number
  // v-model.number hands back the raw string when the field does not parse.
  down_mbps?: number | string
  down?: string
  obfs?: string
  auth_str?: string
  server_ports?: string[]
  hop_interval?: string
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<Inbound | Outbound>('data', { required: true })

// The parent holds a union and picks this component with a v-if on the type,
// which the template checker cannot follow, so narrow once here. The computed
// returns the same object, so edits still reach the parent.
const data = computed(() => model.value as unknown as HysteriaData)

defineProps<{
  direction: 'in' | 'out' | 'out_json'
}>()

const menu = ref(false)

const optionMPort = computed({
  get: (): boolean => data.value.server_ports != undefined,
  set: (v: boolean) => { data.value.server_ports = v ? [] : undefined },
})

const server_ports = computed({
  get: (): string => data.value.server_ports?.join(',') ?? '',
  set: (v: string) => { data.value.server_ports = v.length > 0 ? v.split(',').map((s: string) => s.trim()) : undefined },
})

const hop_interval = computed({
  get: (): number => {
    const v = data.value.hop_interval
    return v ? parseInt(v.replace('s', '')) : 0
  },
  set: (v: number) => { data.value.hop_interval = v > 0 ? v + 's' : undefined },
})

const down_mbps = computed({
  get: (): number | string => data.value.down_mbps ? data.value.down_mbps : 0,
  set: (newValue: number | string) => {
    if (typeof newValue != 'string' || newValue.length != 0) {
      data.value.down_mbps = newValue
      data.value.down = "" + newValue + " Mbps"
    } else {
      data.value.down_mbps = 0
      data.value.down = "0 Mbps"
    }
  },
})

const up_mbps = computed({
  get: (): number => data.value.up_mbps ? data.value.up_mbps : 0,
  set: (newValue: number) => { data.value.up_mbps = newValue > 0 ? newValue : 0 },
})
</script>
