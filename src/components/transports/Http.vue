<template>
  <v-row>
    <v-col
      cols="12"
      sm="6"
      md="4"
    >
      <v-text-field
        v-model="hosts"
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
    <v-col
      cols="12"
      sm="6"
      md="4"
    >
      <v-select
        v-model="transport.method"
        :label="$t('transport.httpMethod')"
        hide-details
        clearable
        :items="methodList"
        @click:clear="delete transport.method"
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
        v-model.number="idle_timeout"
        :label="$t('transport.idleTimeout')"
        hide-details
        type="number"
        suffix="s"
        min="1"
      />
    </v-col>
    <v-col
      cols="12"
      sm="6"
      md="4"
    >
      <v-text-field
        v-model.number="ping_timeout"
        :label="$t('transport.pingTimeout')"
        hide-details
        type="number"
        suffix="s"
        min="1"
      />
    </v-col>
  </v-row>
  <Headers :data="transport" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Transport } from '../../types/transport'
import Headers from '../Headers.vue'

// Only the HTTP fields this form reads or writes; headers is handed to
// Headers.vue, which edits it.
interface HttpData {
  host?: string[]
  path?: string
  method?: string
  headers?: Record<string, string | string[]>
  idle_timeout?: string
  ping_timeout?: string
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<Transport>('transport', { required: true })

// The parent holds a union and picks this component with a v-if on the type,
// which the template checker cannot follow, so narrow once here. The computed
// returns the same object, so edits still reach the parent.
const transport = computed(() => model.value as unknown as HttpData)

const methodList = ['POST', 'GET', 'PUT', 'PATCH', 'DELETE']

const hosts = computed({
  get: (): string => transport.value.host ? transport.value.host.join(',') : '',
  set: (newValue: string) => { transport.value.host = newValue.length > 0 ? newValue.split(',') : [] },
})

const idle_timeout = computed({
  get: (): number | '' => transport.value.idle_timeout ? parseInt(transport.value.idle_timeout.replace('s', '')) : '',
  set: (newValue: number) => { transport.value.idle_timeout = newValue ? newValue + 's' : '' },
})

const ping_timeout = computed({
  get: (): number | '' => transport.value.ping_timeout ? parseInt(transport.value.ping_timeout.replace('s', '')) : '',
  set: (newValue: number) => { transport.value.ping_timeout = newValue ? newValue + 's' : '' },
})
</script>
