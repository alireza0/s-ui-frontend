<template>
  <v-card subtitle="ShadowTls">
    <v-row>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-select
          v-model="version"
          hide-details
          :items="[1,2,3]"
          :label="$t('version')"
          :disabled="data.id > 0"
        />
      </v-col>
      <v-col
        v-if="data.password != undefined"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.password"
          :label="$t('types.pw')"
          hide-details
        />
      </v-col>
      <v-col
        v-if="data.wildcard_sni != undefined"
        cols="12"
        sm="6"
        md="4"
      >
        <v-select
          v-model="data.wildcard_sni"
          label="Wildcard SNI"
          :items="['off', 'authed', 'all']"
          clearable
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
          v-model="data.handshake.server"
          :label="$t('types.shdwTls.hs')"
          hide-details
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model.number="server_port"
          :label="$t('out.port')"
          type="number"
          min="0"
          hide-details
        />
      </v-col>
    </v-row>
    <Dial :dial="data.handshake" />
    <v-row v-if="data.handshake_for_server_name != undefined">
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="handshake_server"
          :label="$t('types.shdwTls.addHS')"
          hide-details
        >
          <template #append>
            <v-chip 
              color="primary"
              density="compact"
              variant="elevated"
              :disabled="handshake_server == ''"
              @click="addHandshakeServer()"
            >
              <v-icon icon="mdi-plus" />
            </v-chip>
          </template>
        </v-text-field>
      </v-col>
    </v-row>
    <v-card
      v-for="(value, key) in data.handshake_for_server_name"
      :key="key"
      border
      density="compact"
      style="margin: 5px;"
      color="background"
    >
      <v-card-title>
        <v-row>
          <v-col>
            {{ key }}
            <v-icon
              icon="mdi-delete"
              color="error"
              size="small"
              @click="data.handshake_for_server_name ? delete data.handshake_for_server_name[key] : null"
            />
          </v-col>
        </v-row>
      </v-card-title>
      <v-row>
        <v-col
          cols="12"
          sm="6"
          md="4"
        >
          <v-text-field
            v-model="value.server"
            :label="$t('types.shdwTls.hs')"
            hide-details
          />
        </v-col>
        <v-col
          cols="12"
          sm="6"
          md="4"
        >
          <v-text-field
            v-model.number="value.server_port"
            :label="$t('out.port')"
            type="number"
            min="0"
            hide-details
          />
        </v-col>
      </v-row>
      <Dial :dial="value" />
    </v-card>
  </v-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Inbound } from '@/types/inbounds'
import RandomUtil from '@/plugins/randomUtil'
import Dial from '../Dial.vue'

// The default handshake target and the per-SNI overrides share this shape;
// both are filled in by hand, so they start out empty.
interface ShadowTlsHandshake {
  server?: string
  server_port?: number
}

// Only the ShadowTLS inbound fields this form reads or writes. Which of the
// optional ones apply depends on the version, and the setter below adds and
// removes them as the version changes.
interface ShadowTlsData {
  id: number
  version: 1 | 2 | 3
  password?: string
  handshake: ShadowTlsHandshake
  handshake_for_server_name?: Record<string, ShadowTlsHandshake>
  wildcard_sni?: string
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<Inbound>('data', { required: true })

// The parent holds a union and picks this component with a v-if on the type,
// which the template checker cannot follow, so narrow once here. The computed
// returns the same object, so edits still reach the parent.
const data = computed(() => model.value as unknown as ShadowTlsData)

const handshake_server = ref('')

const version = computed({
  get: (): 1 | 2 | 3 => data.value.version,
  set: (newValue: 1 | 2 | 3) => {
    switch (newValue) {
    case 1:
      delete data.value.password
      delete data.value.handshake_for_server_name
      delete data.value.wildcard_sni
      break
    case 2:
      if (!data.value.password) {
        data.value.password = RandomUtil.randomSeq(16)
      }
      if (!data.value.handshake_for_server_name) {
        data.value.handshake_for_server_name = {}
      }
      delete data.value.wildcard_sni
      break
    case 3:
      delete data.value.password
      if (!data.value.handshake_for_server_name) {
        data.value.handshake_for_server_name = {}
      }
      if (!data.value.wildcard_sni) {
        data.value.wildcard_sni = ""
      }
      break
    }
    data.value.version = newValue
  },
})

const server_port = computed({
  get: (): number => data.value.handshake.server_port ? data.value.handshake.server_port : 443,
  // v-model.number hands back the raw string whenever it cannot be parsed.
  set: (newValue: string | number) => {
    data.value.handshake.server_port = (typeof newValue === 'string' && newValue.length == 0) || newValue == 0 ? 443 : parseInt(String(newValue))
  },
})

// normalise fields for the current version once, instead of inside the getter
version.value = data.value.version

onMounted(() => {
  version.value = data.value.version
})

function addHandshakeServer() {
  const servers = data.value.handshake_for_server_name ??= {}
  servers[handshake_server.value] = {}
  // Clear the input field after adding the server
  handshake_server.value = ''
}
</script>
