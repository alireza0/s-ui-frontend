<template>
  <v-card subtitle="ShadowTls">
    <v-row>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-select
          v-model="version"
          hide-details
          :items="[1,2,3]"
          :label="$t('version')"
        />
      </v-col>
      <v-col
        v-if="data.version != undefined && data.version > 1"
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
    </v-row>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Outbound } from '@/types/outbounds'

// Outbound ShadowTLS: v1 carries no password, v2 and v3 do.
interface ShadowTlsData {
  version?: number
  password?: string
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<Outbound>('data', { required: true })

// The parent holds a union and picks this component with a v-if on the type,
// which the template checker cannot follow, so narrow once here. The computed
// returns the same object, so edits still reach the parent.
const data = computed(() => model.value as unknown as ShadowTlsData)

const version = computed({
  get: (): number => data.value.version ?? 3,
  set: (v: number) => {
    data.value.version = v
    if (v == 1) {
      delete data.value.password
    } else if (data.value.password === undefined) {
      data.value.password = ""
    }
  },
})
</script>
