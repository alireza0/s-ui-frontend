<template>
  <v-card
    style="padding: 8px;"
    rounded="xl"
    class="border"
  >
    <v-card-subtitle>
      Shadowsocks API
      <v-chip
        color="primary"
        density="compact"
        variant="elevated"
        @click="add_server"
      >
        <v-icon icon="mdi-plus" />
      </v-chip>
    </v-card-subtitle>
    <v-row
      v-for="(server, index) in servers"
      :key="index"
    >
      <v-col
        cols="auto"
        align-self="center"
        justify-self="center"
      >
        <v-icon
          color="error"
          icon="mdi-delete"
          @click="del_server(index)"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="server.name"
          :label="$t('transport.path')"
          hide-details
          @input="update_key(index,$event.target.value)"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-select
          v-model="server.value"
          :label="$t('objects.inbound')"
          hide-details
          :items="ssTags"
          @update:model-value="update_value(index,$event)"
        />
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Srv } from '@/types/services'

// One row of the server editor: a path and the shadowsocks inbound tag it maps
// to. The stored form keys by path and allows either one tag or a list, which
// is why the getter flattens and the setter regroups.
type Server = {
  name: string
  value: string
}

// Only the SSM-API service field this form reads or writes.
interface SsmApiData {
  servers?: Record<string, string | string[]>
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<Srv>('data', { required: true })

// The parent holds a union and picks this component with a v-if on the type,
// which the template checker cannot follow, so narrow once here. The computed
// returns the same object, so edits still reach the parent.
const data = computed(() => model.value as unknown as SsmApiData)

const props = defineProps<{
  ssTags: string[]
}>()

const servers = computed({
  get: (): Server[] => {
    const servers: Server[] = []
    const h = data.value.servers
    if (h) {
      Object.keys(h).forEach(key => {
        const entry = h[key]
        if (Array.isArray(entry)){
          entry.forEach(v => servers.push({ name: key, value: v }))
        } else {
          servers.push({ name: key, value: entry })
        }
      })
    }
    return servers
  },
  set: (v: Server[]) => {
    if (v.length>0) {
      const servers: Record<string, string | string[]> = {}
      v.forEach(h => {
        const existing = servers[h.name]
        if (existing) {
          if (Array.isArray(existing)) {
            existing.push(h.value)
          } else {
            servers[h.name] = [existing, h.value]
          }
        } else {
          servers[h.name] = h.value
        }
      })
      data.value.servers = servers
    } else {
      data.value.servers = undefined
    }
  }
})

function add_server() {
  servers.value = [...servers.value, {name: "/ss" + servers.value.length, value: props.ssTags[0] || ""}]
}

function del_server(i: number) {
  const h = servers.value
  h.splice(i,1)
  servers.value = h
}

function update_key(i: number, k: string) {
  const h = servers.value
  h[i].name = k
  servers.value = h
}

function update_value(i: number, v: string) {
  const h = servers.value
  h[i].value = v
  servers.value = h
}
</script>
