<template>
  <v-card subtitle="VLESS">
    <v-row>
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
        <v-select
          v-model="data.flow"
          hide-details
          :label="$t('types.vless.flow')"
          :items="['','xtls-rprx-vision']"
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
          v-model="packet_encoding"
          hide-details
          :label="$t('types.vless.udpEnc')"
          :items="['none','packetaddr','xudp']"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <Network :data="model" />
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Network from '@/components/Network.vue'
import { Outbound } from '@/types/outbounds'

// Outbound VLESS; the network field is owned by the Network child.
interface VlessData {
  uuid?: string
  flow?: string
  packet_encoding?: string
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<Outbound>('data', { required: true })

// The parent holds a union and picks this component with a v-if on the type,
// which the template checker cannot follow, so narrow once here. The computed
// returns the same object, so edits still reach the parent.
const data = computed(() => model.value as unknown as VlessData)

const packet_encoding = computed({
  get: (): string => data.value.packet_encoding != undefined ? data.value.packet_encoding : 'none',
  set: (newValue: string) => { data.value.packet_encoding = newValue != "none" ? newValue : undefined },
})
</script>
