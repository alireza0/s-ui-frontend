<template>
  <v-card subtitle="SOCKS">
    <v-row>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="username"
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
          v-model="password"
          :label="$t('types.pw')"
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
          v-model="data.version"
          hide-details
          :items="['4','4a','5']"
          :label="$t('version')"
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
        <UoT :data="data" />
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Network from '@/components/Network.vue'
import UoT from '@/components/UoT.vue'
import { Outbound } from '@/types/outbounds'

// Only the SOCKS outbound fields this form edits. Credentials are dropped
// entirely when left blank, so they are optional.
interface SocksData {
  version?: '4' | '4a' | '5'
  username?: string
  password?: string
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<Outbound>('data', { required: true })

// The parent holds a union and picks this component with a v-if on the type,
// which the template checker cannot follow, so narrow once here. The computed
// returns the same object, so edits still reach the parent.
const data = computed(() => model.value as unknown as SocksData)

const username = computed({
  get: (): string => {
    const v = data.value.username
    return v != undefined && v.length > 0 ? v : ''
  },
  set: (v: string) => { data.value.username = v.length > 0 ? v : undefined },
})

const password = computed({
  get: (): string => {
    const v = data.value.password
    return v != undefined && v.length > 0 ? v : ''
  },
  set: (v: string) => { data.value.password = v.length > 0 ? v : undefined },
})
</script>