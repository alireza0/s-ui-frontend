<template>
  <v-card :subtitle="isServer ? 'OpenVPN Server' : 'OpenVPN Client'">
    <!-- Client dials a remote server; server listens locally. -->
    <v-row v-if="!isServer">
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.server"
          :label="$t('types.openvpn.server')"
          hide-details
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model.number="data.server_port"
          :label="$t('types.openvpn.serverPort')"
          type="number"
          min="1"
          max="65535"
          hide-details
        />
      </v-col>
    </v-row>
    <v-row v-else>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.listen"
          :label="$t('in.addr')"
          hide-details
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model.number="data.listen_port"
          :label="$t('in.port')"
          type="number"
          min="1"
          max="65535"
          hide-details
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model.number="maxClients"
          :label="$t('types.openvpn.maxClients')"
          type="number"
          min="0"
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
        <v-select
          v-model="mode"
          hide-details
          :label="$t('types.openvpn.mode')"
          :items="modes"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-select
          v-model="data.network"
          hide-details
          :label="$t('objects.network')"
          :items="networks"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.name"
          :label="$t('types.openvpn.interfaceName')"
          hide-details
          clearable
          @click:clear="delete data.name"
        />
      </v-col>
    </v-row>

    <!-- The server always assigns addresses; a static_key client must set its
         own, since there is no TLS session to push one over. -->
    <v-row v-if="isServer || data.mode == 'static_key'">
      <v-col cols="12">
        <v-combobox
          v-model="data.address"
          :label="$t('types.openvpn.address')"
          hide-details
          multiple
          chips
          closable-chips
        />
      </v-col>
    </v-row>

    <!-- static_key mode has no TLS session, so the peer address cannot be
         negotiated and has to be configured on both ends. -->
    <v-row v-if="!isServer && data.mode == 'static_key'">
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.peer_address"
          :label="$t('types.openvpn.peerAddress')"
          hide-details
          placeholder="10.8.0.1"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.peer_address_ipv6"
          :label="$t('types.openvpn.peerAddressIpv6')"
          hide-details
          clearable
          @click:clear="delete data.peer_address_ipv6"
        />
      </v-col>
    </v-row>

    <!-- static_key mode uses a shared key instead of TLS -->
    <v-row v-if="data.mode == 'static_key'">
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.static_key_path"
          :label="$t('types.openvpn.staticKeyPath')"
          hide-details
          clearable
          @click:clear="delete data.static_key_path"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-select
          v-model="data.key_direction"
          hide-details
          :label="$t('types.openvpn.keyDirection')"
          :items="keyDirections"
          clearable
          @click:clear="delete data.key_direction"
        />
      </v-col>
    </v-row>

    <v-row v-if="!isServer && data.mode == 'tls'">
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
      <!-- The two modes negotiate the data cipher differently, and sing-box
           rejects the option belonging to the other one: `cipher` names the
           single fixed cipher a static_key tunnel uses, while a TLS session
           negotiates one out of `data_ciphers`. -->
      <v-col
        v-if="data.mode == 'static_key'"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.cipher"
          :label="$t('types.openvpn.cipher')"
          hide-details
          clearable
          placeholder="AES-256-CBC"
          @click:clear="delete data.cipher"
        />
      </v-col>
      <v-col
        v-else
        cols="12"
        sm="6"
        md="4"
      >
        <v-combobox
          v-model="dataCiphers"
          :label="$t('types.openvpn.dataCiphers')"
          hide-details
          multiple
          chips
          closable-chips
          placeholder="AES-256-GCM"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.auth"
          :label="$t('types.openvpn.auth')"
          hide-details
          clearable
          placeholder="SHA256"
          @click:clear="delete data.auth"
        />
      </v-col>
    </v-row>
    <v-row v-if="data.mode != 'static_key'">
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.data_ciphers_fallback"
          :label="$t('types.openvpn.dataCiphersFallback')"
          hide-details
          clearable
          placeholder="AES-256-GCM"
          @click:clear="delete data.data_ciphers_fallback"
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
          :label="$t('types.openvpn.system')"
          hide-details
        />
      </v-col>
      <v-col
        v-if="isServer"
        cols="12"
        sm="6"
        md="4"
      >
        <v-switch
          v-model="data.duplicate_cn"
          color="primary"
          :label="$t('types.openvpn.duplicateCn')"
          hide-details
        />
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Endpoint } from '@/types/endpoints'

// One form serves both openvpn-client and openvpn-server, so it takes the
// widest shape either side can hold: the client dials `server`/`server_port`
// while the server listens on `listen`/`listen_port`, and only the server
// carries `max_clients`/`duplicate_cn`.
interface OpenVpnData {
  type: string
  server?: string
  server_port?: number
  listen?: string
  listen_port?: number
  max_clients?: number
  duplicate_cn?: boolean
  mode?: 'tls' | 'static_key'
  network?: 'udp' | 'udp4' | 'udp6' | 'tcp' | 'tcp4' | 'tcp6'
  name?: string
  address?: string[]
  peer_address?: string
  peer_address_ipv6?: string
  static_key_path?: string
  key_direction?: 'server' | 'client'
  username?: string
  password?: string
  mtu?: number
  cipher?: string
  data_ciphers?: string[]
  data_ciphers_fallback?: string
  auth?: string
  system?: boolean
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<Endpoint>('data', { required: true })

// The parent holds a union and picks this component with a v-if on the type,
// which the template checker cannot follow, so narrow once here. The computed
// returns the same object, so edits still reach the parent.
const data = computed(() => model.value as unknown as OpenVpnData)

const modes = [
  { title: 'TLS', value: 'tls' },
  { title: 'Static Key', value: 'static_key' },
]

const keyDirections = [
  { title: 'Server', value: 'server' },
  { title: 'Client', value: 'client' },
]

// Each mode rejects the other's cipher options outright, so switching has
// to clear the ones that no longer apply. static_key additionally requires
// a CBC cipher: GCM relies on the TLS key exchange for IV uniqueness, so
// sing-box will not use it without a TLS session.
const mode = computed({
  get: (): string | undefined => data.value.mode,
  set: (v: 'tls' | 'static_key') => {
    data.value.mode = v
    if (v === 'static_key') {
      delete data.value.data_ciphers
      delete data.value.data_ciphers_fallback
      if (!data.value.cipher || data.value.cipher.includes('GCM')) {
        data.value.cipher = 'AES-256-CBC'
      }
    } else {
      delete data.value.cipher
    }
  },
})

const dataCiphers = computed({
  get: (): string[] => data.value.data_ciphers ?? [],
  set: (v: string[]) => {
    if (v?.length) data.value.data_ciphers = v
    else delete data.value.data_ciphers
  },
})

const isServer = computed((): boolean => data.value.type === 'openvpn-server')

// The server accepts tcp/udp only; the client also takes the v4/v6 forms.
const networks = computed((): { title: string; value: string }[] => {
  const base = [
    { title: 'UDP', value: 'udp' },
    { title: 'TCP', value: 'tcp' },
  ]
  if (isServer.value) return base
  return base.concat([
    { title: 'UDPv4', value: 'udp4' },
    { title: 'UDPv6', value: 'udp6' },
    { title: 'TCPv4', value: 'tcp4' },
    { title: 'TCPv6', value: 'tcp6' },
  ])
})

const mtu = computed({
  get: (): number => data.value.mtu ?? 0,
  set: (v: number) => { data.value.mtu = v > 0 ? v : undefined },
})

const maxClients = computed({
  get: (): number => data.value.max_clients ?? 0,
  set: (v: number) => { data.value.max_clients = v > 0 ? v : undefined },
})
</script>
