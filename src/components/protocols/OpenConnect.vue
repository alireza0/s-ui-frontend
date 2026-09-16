<template>
  <v-card subtitle="OpenConnect">
    <v-row>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.server"
          :label="$t('types.openconnect.server')"
          hide-details
          placeholder="vpn.example.com"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-select
          v-model="data.flavor"
          hide-details
          :label="$t('types.openconnect.flavor')"
          :items="flavors"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.name"
          :label="$t('types.openconnect.interfaceName')"
          hide-details
          clearable
          @click:clear="delete data.name"
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
          v-model="data.username"
          :label="$t('types.un')"
          hide-details
          clearable
          @click:clear="delete data.username"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.password"
          :label="$t('types.pw')"
          hide-details
          type="password"
          clearable
          @click:clear="delete data.password"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.auth_group"
          :label="$t('types.openconnect.authGroup')"
          hide-details
          clearable
          @click:clear="delete data.auth_group"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-text-field
          v-model="data.cookie"
          :label="$t('types.openconnect.cookie')"
          hide-details
          type="password"
          clearable
          @click:clear="delete data.cookie"
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
          v-model.number="mtu"
          label="MTU"
          type="number"
          min="0"
          hide-details
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.udp_timeout"
          :label="$t('types.openconnect.udpTimeout')"
          hide-details
          clearable
          placeholder="5m"
          @click:clear="delete data.udp_timeout"
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
          v-model="data.system"
          color="primary"
          :label="$t('types.openconnect.system')"
          hide-details
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-switch
          v-model="data.no_udp"
          color="primary"
          :label="$t('types.openconnect.noUdp')"
          hide-details
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-switch
          v-model="data.ipv6_disabled"
          color="primary"
          :label="$t('types.openconnect.ipv6Disabled')"
          hide-details
        />
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Endpoint } from '@/types/endpoints'

// Only the OpenConnect endpoint fields this form edits.
interface OpenConnectData {
  server: string
  flavor?: 'anyconnect' | 'gp' | 'fortinet' | 'f5' | 'pulse' | 'nc'
  name?: string
  username?: string
  password?: string
  auth_group?: string
  cookie?: string
  mtu?: number
  udp_timeout?: string
  system?: boolean
  no_udp?: boolean
  ipv6_disabled?: boolean
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<Endpoint>('data', { required: true })

// The parent holds a union and picks this component with a v-if on the type,
// which the template checker cannot follow, so narrow once here. The computed
// returns the same object, so edits still reach the parent.
const data = computed(() => model.value as unknown as OpenConnectData)

const flavors = [
  { title: 'Cisco AnyConnect', value: 'anyconnect' },
  { title: 'Palo Alto GlobalProtect', value: 'gp' },
  { title: 'Fortinet', value: 'fortinet' },
  { title: 'F5 BIG-IP', value: 'f5' },
  { title: 'Juniper Pulse', value: 'pulse' },
  { title: 'Junos Network Connect', value: 'nc' },
]

const mtu = computed({
  get: (): number => data.value.mtu ?? 0,
  set: (v: number) => { data.value.mtu = v > 0 ? v : undefined },
})
</script>
