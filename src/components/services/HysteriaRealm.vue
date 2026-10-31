<template>
  <v-card subtitle="Hysteria Realm">
    <v-card-title>
      {{ $t('types.ocm.users') }}
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
            :aria-label="$t('actions.del')"
            color="error"
            icon="mdi-delete"
            @click="delUser(index)"
          />
        </v-col>
        <v-col
          cols="12"
          sm="3"
        >
          <v-text-field
            v-model="user.name"
            :label="$t('types.ocm.userName')"
            hide-details
          />
        </v-col>
        <v-col
          cols="12"
          sm="5"
        >
          <v-text-field
            v-model="user.token"
            :label="$t('types.ocm.userToken')"
            hide-details
          >
            <template #append-inner>
              <v-icon
                :aria-label="$t('actions.generate')"
                icon="mdi-refresh"
                @click="user.token = RandomUtil.randomSeq(32)"
              />
            </template>
          </v-text-field>
        </v-col>
        <v-col
          cols="12"
          sm="3"
        >
          <v-text-field
            v-model.number="user.max_realms"
            :label="$t('types.hy.maxRealms')"
            type="number"
            min="0"
            hide-details
          />
        </v-col>
      </v-row>
    </v-card>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import RandomUtil from '@/plugins/randomUtil'
import { HysteriaRealm, Srv } from '@/types/services'

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<Srv>('data', { required: true })

// The parent holds a union and picks this component with a v-if on the type,
// which the template checker cannot follow, so narrow once here. The computed
// returns the same object, so edits still reach the parent.
const data = computed(() => model.value as unknown as HysteriaRealm)

function addUser() {
  if (!data.value.users) data.value.users = []
  data.value.users.push({ name: '', token: RandomUtil.randomSeq(32) })
}

function delUser(i: number | string) {
  data.value.users?.splice(Number(i), 1)
}
</script>
