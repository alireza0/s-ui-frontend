<template>
  <v-card subtitle="HTTP">
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
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.path"
          :label="$t('transport.path')"
          hide-details
        />
      </v-col>
    </v-row>
    <Headers :data="model" />
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Headers from '@/components/Headers.vue'
import { Outbound } from '@/types/outbounds'

// Outbound HTTP proxy: credentials are optional and removed when emptied, and
// the headers are owned by the Headers child.
interface HttpData {
  username?: string
  password?: string
  path?: string
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<Outbound>('data', { required: true })

// The parent holds a union and picks this component with a v-if on the type,
// which the template checker cannot follow, so narrow once here. The computed
// returns the same object, so edits still reach the parent.
const data = computed(() => model.value as unknown as HttpData)

const username = computed({
  get: (): string => {
    const v = data.value.username
    return v && v.length > 0 ? v : ''
  },
  set: (v: string) => { data.value.username = v.length > 0 ? v : undefined },
})

const password = computed({
  get: (): string => {
    const v = data.value.password
    return v && v.length > 0 ? v : ''
  },
  set: (v: string) => { data.value.password = v.length > 0 ? v : undefined },
})
</script>
