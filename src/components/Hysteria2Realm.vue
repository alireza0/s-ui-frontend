<template>
  <v-card :subtitle="$t('types.hy.realm')">
    <v-row>
      <v-col
        cols="12"
        sm="8"
      >
        <v-text-field
          v-model="data.server_url"
          :label="$t('types.hy.realmUrl')"
          placeholder="https://realm.example.com"
          hide-details
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.realm_id"
          :label="$t('types.hy.realmId')"
          hide-details
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="token"
          :label="$t('types.hy.token')"
          hide-details
        />
      </v-col>
      <v-col
        cols="12"
        sm="8"
      >
        <v-text-field
          v-model="stun_servers"
          :label="$t('types.hy.stunServers') + ' ' + $t('commaSeparated')"
          placeholder="stun.l.google.com:19302"
          hide-details
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-select
          v-model="ip_version"
          :label="$t('rule.ipVer')"
          :items="ipVersions"
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
        <v-switch
          v-model="portMapping"
          color="primary"
          :label="$t('types.hy.portMapping')"
          :disabled="data.ip_version == 6"
          hide-details
        />
      </v-col>
      <template v-if="data.port_mapping">
        <v-col
          cols="12"
          sm="6"
          md="4"
        >
          <v-text-field
            v-model="portMappingTimeout"
            :label="$t('types.hy.timeout')"
            placeholder="10s"
            hide-details
          />
        </v-col>
        <v-col
          cols="12"
          sm="6"
          md="4"
        >
          <v-text-field
            v-model="portMappingLifetime"
            :label="$t('types.hy.lifetime')"
            placeholder="10m"
            hide-details
          />
        </v-col>
      </template>
    </v-row>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { i18n } from '@/locales'
import { Hysteria2Realm } from '@/types/outbounds'

// The parent owns the realm object and this component edits it in place.
const data = defineModel<Hysteria2Realm>('data', { required: true })

const ipVersions = [
  { title: i18n.global.t('all'), value: 0 },
  { title: 'IPv4', value: 4 },
  { title: 'IPv6', value: 6 },
]

const token = computed({
  get: (): string => data.value.token ?? '',
  set: (v: string) => { data.value.token = v.length > 0 ? v : undefined },
})

// sing-box requires the list, so an empty field keeps an empty one.
const stun_servers = computed({
  get: (): string => data.value.stun_servers?.join(',') ?? '',
  set: (v: string) => { data.value.stun_servers = v.split(',').map(s => s.trim()).filter(s => s.length > 0) },
})

// Port mapping needs IPv4, so restricting the realm to IPv6 turns it off.
const ip_version = computed({
  get: (): number => data.value.ip_version ?? 0,
  set: (v: number) => {
    data.value.ip_version = v > 0 ? v as 4 | 6 : undefined
    if (v == 6) delete data.value.port_mapping
  },
})

const portMapping = computed({
  get: (): boolean => data.value.port_mapping?.enabled ?? false,
  set: (v: boolean) => { data.value.port_mapping = v ? { enabled: true } : undefined },
})

const portMappingTimeout = computed({
  get: (): string => data.value.port_mapping?.timeout ?? '',
  set: (v: string) => { if (data.value.port_mapping) data.value.port_mapping.timeout = v.length > 0 ? v : undefined },
})

const portMappingLifetime = computed({
  get: (): string => data.value.port_mapping?.lifetime ?? '',
  set: (v: string) => { if (data.value.port_mapping) data.value.port_mapping.lifetime = v.length > 0 ? v : undefined },
})
</script>
