<template>
  <v-card subtitle="VMESS">
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
        <v-text-field
          v-model.number="data.alter_id"
          label="Alter ID"
          hide-details
          type="number"
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
        <v-select
          v-model="data.security"
          hide-details
          :label="$t('types.vmess.security')"
          :items="securities"
        />
      </v-col>
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
        <Network :data="data" />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-switch
          v-model="data.global_padding"
          color="primary"
          :label="$t('types.vmess.globalPadding')"
          hide-details
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-switch
          v-model="data.authenticated_length"
          color="primary"
          :label="$t('types.vmess.authLen')"
          hide-details
        />
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Network from '@/components/Network.vue'
import { Outbound } from '@/types/outbounds'

// Only the VMess outbound fields this form edits.
interface VmessData {
  uuid: string
  alter_id: number
  security?: string
  global_padding?: boolean
  authenticated_length?: boolean
  packet_encoding?: string
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<Outbound>('data', { required: true })

// The parent holds a union and picks this component with a v-if on the type,
// which the template checker cannot follow, so narrow once here. The computed
// returns the same object, so edits still reach the parent.
const data = computed(() => model.value as unknown as VmessData)

const securities = [
  "auto",
  "none",
  "zero",
  "aes-128-gcm",
  "aes-128-ctr",
  "chacha20-poly1305",
]

const packet_encoding = computed({
  get: (): string => data.value.packet_encoding != undefined ? data.value.packet_encoding : 'none',
  set: (newValue: string) => { data.value.packet_encoding = newValue != "none" ? newValue : undefined },
})
</script>