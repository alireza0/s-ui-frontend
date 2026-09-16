<template>
  <v-row>
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
    <v-col
      cols="12"
      sm="6"
      md="4"
    >
      <v-text-field
        v-model="host"
        :label="$t('transport.host')"
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
      <v-text-field
        v-model.number="max_early_data"
        label="Max Early Data"
        hide-details
        type="number"
        min="0"
      />
    </v-col>
    <v-col
      cols="12"
      sm="6"
      md="4"
    >
      <v-text-field
        v-model="transport.early_data_header_name"
        label="Early Data Header Name"
        hide-details
      />
    </v-col>
  </v-row>
  <Headers :data="transport" />
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { Transport } from '../../types/transport'
import Headers from '../Headers.vue'

// Only the WebSocket fields this form reads or writes; headers is handed to
// Headers.vue, which edits it.
interface WebSocketData {
  path?: string
  headers?: { Host: string }
  max_early_data?: number
  early_data_header_name?: string
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<Transport>('transport', { required: true })

// The parent holds a union and picks this component with a v-if on the type,
// which the template checker cannot follow, so narrow once here. The computed
// returns the same object, so edits still reach the parent.
const transport = computed(() => model.value as unknown as WebSocketData)

const max_early_data = computed({
  get: (): number | '' => transport.value.max_early_data ? transport.value.max_early_data : '',
  set: (newValue: number) => { transport.value.max_early_data = newValue != 0 ? newValue : undefined },
})

const host = computed({
  get: (): string => transport.value.headers?.Host ? transport.value.headers.Host : '',
  set: (newValue: string) => {
    transport.value.headers = newValue != "" ? { Host: newValue } : undefined
  },
})

onMounted(() => {
  transport.value.early_data_header_name ??= 'Sec-WebSocket-Protocol'
  transport.value.path ??= '/'
})
</script>
