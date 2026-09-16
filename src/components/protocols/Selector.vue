<template>
  <v-card subtitle="Selector">
    <v-row>
      <v-col
        cols="12"
        sm="6"
      >
        <v-combobox
          v-model="data.outbounds"
          :items="tags"
          :label="$t('pages.outbounds')"
          multiple
          chips
          hide-details
          @update:model-value="updateDefault"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-combobox
          v-model="data.default"
          :items="data.outbounds"
          :label="$t('types.lb.defaultOut')"
          clearable
          hide-details
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
      >
        <v-switch
          v-model="data.interrupt_exist_connections"
          color="primary"
          :label="$t('types.lb.interruptConn')"
          hide-details
        />
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Outbound } from '@/types/outbounds'

// Selector is outbound only: it groups other outbounds and names one of them
// as the default.
interface SelectorData {
  outbounds?: string[]
  default?: string
  interrupt_exist_connections?: boolean
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<Outbound>('data', { required: true })

// The parent holds a union and picks this component with a v-if on the type,
// which the template checker cannot follow, so narrow once here. The computed
// returns the same object, so edits still reach the parent.
const data = computed(() => model.value as unknown as SelectorData)

defineProps<{
  tags: string[]
}>()

function updateDefault() {
  const def = data.value.default
  if (def === undefined || !data.value.outbounds?.includes(def)) {
    delete data.value.default
  }
}
</script>
