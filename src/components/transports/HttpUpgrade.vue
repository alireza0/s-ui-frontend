<template>
  <v-row>
    <v-col
      cols="12"
      sm="6"
      md="4"
    >
      <v-text-field
        v-model="transport.host"
        :label="$t('transport.hosts')"
        hide-details
      />
    </v-col>
    <v-col
      cols="12"
      sm="6"
      md="4"
    >
      <v-text-field
        v-model="transport.path"
        :label="$t('transport.path')"
        hide-details
      />
    </v-col>
  </v-row>
  <Headers :data="transport" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Transport } from '../../types/transport'
import Headers from '../Headers.vue'

// Only the httpupgrade fields this form reads or writes; headers is handed to
// Headers.vue, which edits it.
interface HttpUpgradeData {
  host?: string
  path?: string
  headers?: Record<string, string | string[]>
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<Transport>('transport', { required: true })

// The parent holds a union and picks this component with a v-if on the type,
// which the template checker cannot follow, so narrow once here. The computed
// returns the same object, so edits still reach the parent.
const transport = computed(() => model.value as unknown as HttpUpgradeData)
</script>
