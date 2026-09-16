<template>
  <v-card subtitle="Shadowsocks">
    <v-row>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-select
          v-model="data.method"
          hide-details
          :label="$t('in.ssMethod')"
          :items="ssMethods"
          @update:model-value="direction == 'in' ? changeMethod($event) : undefined"
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
        v-if="direction == 'out'"
        cols="12"
        sm="6"
        md="4"
      >
        <UoT :data="data" />
      </v-col>
      <v-col
        v-if="direction == 'in'"
        cols="12"
        sm="6"
        md="4"
      >
        <v-switch
          v-model="data.managed"
          color="primary"
          :label="$t('in.ssManageable')"
          hide-details
        />
      </v-col>
    </v-row>
    <v-row v-if="data.method != 'none' || direction == 'out'">
      <v-col
        cols="12"
        sm="8"
      >
        <v-text-field
          v-model="data.password"
          :label="$t('types.pw')"
          hide-details
          :append-inner-icon="direction == 'in' ? 'mdi-refresh' : undefined"
          @click:append-inner="changeMethod(data.method)"
        />
      </v-col>
    </v-row>
    <v-row v-if="direction == 'out'">
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.plugin"
          label="Plugin"
          hide-details
          clearable
        />
      </v-col>
      <v-col
        v-if="data.plugin"
        cols="12"
        sm="8"
      >
        <v-text-field
          v-model="data.plugin_opts"
          label="Plugin Options"
          hide-details
        />
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Network from '@/components/Network.vue'
import UoT from '@/components/UoT.vue'
import RandomUtil from '@/plugins/randomUtil'
import { Inbound } from '@/types/inbounds'
import { Outbound } from '@/types/outbounds'

// One form serves both directions, so it takes the widest shape either side
// can hold: only the inbound side is manageable, and only the outbound side
// carries the SIP003 plugin fields.
interface ShadowsocksData {
  method: string
  password?: string
  managed?: boolean
  plugin?: string
  plugin_opts?: string
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<Inbound | Outbound>('data', { required: true })

// The parent holds a union and picks this component with a v-if on the type,
// which the template checker cannot follow, so narrow once here. The computed
// returns the same object, so edits still reach the parent.
const data = computed(() => model.value as unknown as ShadowsocksData)

defineProps<{
  direction: 'in' | 'out'
}>()

const ssMethods = [
  "none",
  "aes-128-gcm",
  "aes-192-gcm",
  "aes-256-gcm",
  "chacha20-ietf-poly1305",
  "xchacha20-ietf-poly1305",
  "2022-blake3-aes-128-gcm",
  "2022-blake3-aes-256-gcm",
  "2022-blake3-chacha20-poly1305"
]

function changeMethod(ssMethod :string) {
  if (ssMethod.startsWith('2022')) {
    data.value.password = ssMethod == "2022-blake3-aes-128-gcm" ? RandomUtil.randomShadowsocksPassword(16) : RandomUtil.randomShadowsocksPassword(32)
  } else if (ssMethod == 'none') {
    delete data.value.password
  } else {
    data.value.password = RandomUtil.randomSeq(10)
  }
}
</script>