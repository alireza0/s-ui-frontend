<template>
  <v-card subtitle="CCM (Claude Code Multiplexer)">
    <v-row>
      <v-col
        cols="12"
        sm="6"
      >
        <v-text-field
          v-model="data.credential_path"
          :label="$t('types.ccm.credentialPath')"
          hide-details
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
      >
        <v-text-field
          v-model="data.usages_path"
          :label="$t('types.ccm.usagesPath')"
          hide-details
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
      >
        <v-select
          v-model="data.detour"
          :label="$t('dial.detourText')"
          hide-details
          :items="outTags"
        />
      </v-col>
    </v-row>
    <v-card-title>
      {{ $t('types.ccm.users') }}
      <v-chip
        color="primary"
        density="compact"
        variant="elevated"
        @click="addUser"
      >
        <v-icon icon="mdi-plus" />
      </v-chip>
    </v-card-title>
    <v-card
      v-for="(user, index) in (data.users || [])"
      :key="index"
      class="border"
      style="margin: 4px; padding: 8px;"
      rounded="xl"
    >
      <v-row>
        <v-col
          cols="auto"
          align-self="center"
        >
          <v-icon
            color="error"
            icon="mdi-delete"
            @click="delUser(index)"
          />
        </v-col>
        <v-col
          cols="12"
          sm="4"
        >
          <v-text-field
            v-model="user.name"
            :label="$t('types.ccm.userName')"
            hide-details
          />
        </v-col>
        <v-col
          cols="12"
          sm="6"
        >
          <v-text-field
            v-model="user.token"
            :label="$t('types.ccm.userToken')"
            hide-details
            type="password"
          />
        </v-col>
      </v-row>
    </v-card>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Data from '@/store/modules/data'
import { Srv } from '@/types/services'

// Only the multiplexer fields this form edits.
interface MuxData {
  credential_path?: string
  usages_path?: string
  detour?: string
  users?: { name: string, token: string }[]
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<Srv>('data', { required: true })

// The parent holds a union and picks this component with a v-if on the type,
// which the template checker cannot follow, so narrow once here. The computed
// returns the same object, so edits still reach the parent.
const data = computed(() => model.value as unknown as MuxData)

const outTags = computed((): string[] => {
  return [...Data().outbounds?.map((o) => o.tag) ?? [], ...Data().endpoints?.map((e) => e.tag) ?? []]
})

function addUser() {
  if (!data.value.users) data.value.users = []
  data.value.users.push({ name: '', token: '' })
}

function delUser(i: number | string) {
  data.value.users?.splice(Number(i), 1)
}
</script>
