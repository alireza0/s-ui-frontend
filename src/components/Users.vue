<template>
  <v-card :subtitle="$t('pages.clients')">
    <v-row>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-select
          v-model="data.model"
          :items="initUsersModels"
          hide-details
          @update:model-value="data.values = []"
        />
      </v-col>
      <v-col
        v-if="data.model == 'group'"
        cols="12"
        sm="6"
        md="4"
      >
        <v-select
          v-model="groupValues"
          multiple
          chips
          :items="groupNames"
          :label="$t('client.group')"
          hide-details
        />
      </v-col>
      <v-col
        v-if="data.model == 'client'"
        cols="12"
        sm="8"
      >
        <v-select
          v-model="clientValues"
          multiple
          chips
          :items="clientNames"
          :label="$t('pages.clients')"
          hide-details
        />
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { i18n } from '@/locales'
import { Client } from '@/types/clients'

// The client selection this form edits: how the clients are picked, and the
// group names or client ids that were picked.
interface UsersSelection {
  model: string
  values: (number | string)[]
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const data = defineModel<UsersSelection>('data', { required: true })

const props = defineProps<{
  clients: Client[]
}>()

const initUsersModels = [
  { title: i18n.global.t('none'), value: 'none' },
  { title: i18n.global.t('all'), value: 'all' },
  { title: i18n.global.t('client.group'), value: 'group' },
  { title: i18n.global.t('pages.clients'), value: 'client' },
]

const clientNames = computed(() => props.clients.map(c => { return { title: c.name, value: c.id } }))

const groupNames = computed(() => Array.from(new Set(props.clients.map(c => c.group))))

// The two selects put different things in the same list — group names on one
// side, client ids on the other — so each gets its own view of it.
const groupValues = computed({
  get: () => data.value.values as string[],
  set: (v: string[]) => { data.value.values = v },
})

const clientValues = computed({
  get: () => data.value.values as number[],
  set: (v: number[]) => { data.value.values = v },
})
</script>
