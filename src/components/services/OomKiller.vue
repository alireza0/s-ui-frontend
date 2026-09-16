<template>
  <v-card subtitle="OOM Killer">
    <v-row>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.memory_limit"
          :label="$t('types.oomKiller.memoryLimit')"
          hide-details
          clearable
          placeholder="1gb"
          @click:clear="delete data.memory_limit"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.safety_margin"
          :label="$t('types.oomKiller.safetyMargin')"
          hide-details
          clearable
          placeholder="128mb"
          @click:clear="delete data.safety_margin"
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
          v-model="data.min_interval"
          :label="$t('types.oomKiller.minInterval')"
          hide-details
          clearable
          placeholder="10s"
          @click:clear="delete data.min_interval"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.max_interval"
          :label="$t('types.oomKiller.maxInterval')"
          hide-details
          clearable
          placeholder="1m"
          @click:clear="delete data.max_interval"
        />
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Srv } from '@/types/services'

// Only the oom-killer fields this form edits.
interface OomKillerData {
  memory_limit?: string
  safety_margin?: string
  min_interval?: string
  max_interval?: string
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<Srv>('data', { required: true })

// The parent holds a union and picks this component with a v-if on the type,
// which the template checker cannot follow, so narrow once here. The computed
// returns the same object, so edits still reach the parent.
const data = computed(() => model.value as unknown as OomKillerData)
</script>
