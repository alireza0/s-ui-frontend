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
          :type="showPassword ? 'text' : 'password'"
          clearable
          append-inner-icon="mdi-refresh"
          @click:clear="delete data.password"
          @click:append-inner="genPassword"
        />
      </v-col>
    </v-row>
    <v-row v-if="optionCookie">
      <v-col cols="12">
        <v-text-field
          v-model="data.cookie"
          :label="$t('types.openconnect.cookie')"
          hide-details
          type="password"
        />
      </v-col>
    </v-row>
    <v-row v-if="optionAuthGroup || optionName || optionMtu || optionUdpTimeout">
      <v-col
        v-if="optionAuthGroup"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.auth_group"
          :label="$t('types.openconnect.authGroup')"
          hide-details
        />
      </v-col>
      <v-col
        v-if="optionName"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.name"
          :label="$t('types.openconnect.interfaceName')"
          hide-details
        />
      </v-col>
      <v-col
        v-if="optionMtu"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model.number="data.mtu"
          label="MTU"
          type="number"
          min="0"
          hide-details
        />
      </v-col>
      <v-col
        v-if="optionUdpTimeout"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.udp_timeout"
          :label="$t('types.openconnect.udpTimeout')"
          hide-details
          placeholder="5m"
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
    <v-card-actions class="pt-0">
      <v-spacer />
      <v-menu
        v-model="menu"
        :close-on-content-click="false"
        location="start"
      >
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            hide-details
            variant="tonal"
          >
            {{ $t('types.openconnect.options') }}
          </v-btn>
        </template>
        <v-card>
          <v-list>
            <v-list-item>
              <v-switch
                v-model="optionAuthGroup"
                color="primary"
                :label="$t('types.openconnect.authGroup')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionCookie"
                color="primary"
                :label="$t('types.openconnect.cookie')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionName"
                color="primary"
                :label="$t('types.openconnect.interfaceName')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionMtu"
                color="primary"
                label="MTU"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionUdpTimeout"
                color="primary"
                :label="$t('types.openconnect.udpTimeout')"
                hide-details
              />
            </v-list-item>
          </v-list>
        </v-card>
      </v-menu>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Endpoint } from '@/types/endpoints'
import RandomUtil from '@/plugins/randomUtil'

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

const menu = ref(false)

// A typed-in password stays masked, but a generated one is shown, since it
// still has to be copied to the account on the server.
const showPassword = ref(false)

const genPassword = () => {
  data.value.password = RandomUtil.randomSeq(16)
  showPassword.value = true
}

// Optional fields stay out of the form, and out of the saved config, until
// switched on from the options menu.
const optionAuthGroup = computed({
  get: (): boolean => data.value.auth_group !== undefined,
  set: (v: boolean) => {
    if (v) data.value.auth_group = ''
    else delete data.value.auth_group
  },
})

const optionCookie = computed({
  get: (): boolean => data.value.cookie !== undefined,
  set: (v: boolean) => {
    if (v) data.value.cookie = ''
    else delete data.value.cookie
  },
})

const optionName = computed({
  get: (): boolean => data.value.name !== undefined,
  set: (v: boolean) => {
    if (v) data.value.name = ''
    else delete data.value.name
  },
})

const optionMtu = computed({
  get: (): boolean => data.value.mtu !== undefined,
  set: (v: boolean) => {
    if (v) data.value.mtu = 1500
    else delete data.value.mtu
  },
})

const optionUdpTimeout = computed({
  get: (): boolean => data.value.udp_timeout !== undefined,
  set: (v: boolean) => {
    if (v) data.value.udp_timeout = '5m'
    else delete data.value.udp_timeout
  },
})
</script>
