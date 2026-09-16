<template>
  <v-card subtitle="Direct">
    <v-row>
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
        <v-text-field
          v-model="data.override_address"
          :label="$t('types.direct.overrideAddr')"
          hide-details
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model.number="override_port"
          :label="$t('types.direct.overridePort')"
          type="number"
          min="0"
          hide-details
        />
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Network from '@/components/Network.vue'
import { Inbound } from '@/types/inbounds'

// Direct is inbound only; the network field is owned by the Network child.
interface DirectData {
  override_address?: string
  override_port?: number
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<Inbound>('data', { required: true })

// The parent holds a union and picks this component with a v-if on the type,
// which the template checker cannot follow, so narrow once here. The computed
// returns the same object, so edits still reach the parent.
const data = computed(() => model.value as unknown as DirectData)

// v-model.number hands back a number when the field parses and the raw string
// when it does not, so both have to be accepted here.
const override_port = computed({
  get: (): number | string => data.value.override_port ? data.value.override_port : '',
  set: (newValue: number | string) => {
    const text = String(newValue)
    data.value.override_port = text.length == 0 || Number(text) == 0 ? undefined : parseInt(text)
  },
})
</script>
