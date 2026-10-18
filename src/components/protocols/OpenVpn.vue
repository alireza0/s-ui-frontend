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
          :label="$t('network')"
          :items="networks"
        />
      </v-col>
      <!-- static_key has no TLS session to negotiate a cipher, so its single
           fixed one is always set (the mode switch fills in a default). -->
      <v-col
        v-if="data.mode == 'static_key'"
        cols="12"
        sm="6"
        md="4"
      >
        <v-select
          v-model="data.cipher"
          :label="$t('types.openvpn.cipher')"
          :items="staticCiphers"
          hide-details
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
        v-if="optionPeerIpv6"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.peer_address_ipv6"
          :label="$t('types.openvpn.peerAddressIpv6')"
          hide-details
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

    <v-row v-if="!isServer && data.mode == 'tls' && optionCredentials">
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.username"
          :label="$t('types.un')"
          hide-details
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
        />
      </v-col>
    </v-row>

    <!-- A TLS session negotiates one cipher out of `data_ciphers`, in the
         order listed, so the full width keeps several chips readable. -->
    <template v-if="data.mode != 'static_key' && optionDataCiphers">
      <v-row>
        <v-col cols="12">
          <v-select
            v-model="data.data_ciphers"
            :label="$t('types.openvpn.dataCiphers')"
            :items="tlsCiphers"
            hide-details
            multiple
            chips
            closable-chips
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
            v-model="data.data_ciphers_fallback"
            :label="$t('types.openvpn.dataCiphersFallback')"
            :items="tlsCiphers"
            hide-details
            clearable
            @click:clear="delete data.data_ciphers_fallback"
          />
        </v-col>
      </v-row>
    </template>

    <v-row v-if="optionAuth || optionName || optionMtu || (isServer && optionMaxClients)">
      <v-col
        v-if="optionAuth"
        cols="12"
        sm="6"
        md="4"
      >
        <v-select
          v-model="data.auth"
          :label="$t('types.openvpn.auth')"
          :items="digests"
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
          :label="$t('types.openvpn.interfaceName')"
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
        v-if="isServer && optionMaxClients"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model.number="data.max_clients"
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
            {{ $t('types.openvpn.options') }}
          </v-btn>
        </template>
        <v-card>
          <v-list>
            <v-list-item v-if="!isServer && data.mode == 'tls'">
              <v-switch
                v-model="optionCredentials"
                color="primary"
                :label="$t('types.openvpn.credentials')"
                hide-details
              />
            </v-list-item>
            <v-list-item v-if="!isServer && data.mode == 'static_key'">
              <v-switch
                v-model="optionPeerIpv6"
                color="primary"
                :label="$t('types.openvpn.peerAddressIpv6')"
                hide-details
              />
            </v-list-item>
            <v-list-item v-if="data.mode != 'static_key'">
              <v-switch
                v-model="optionDataCiphers"
                color="primary"
                :label="$t('types.openvpn.dataCiphers')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionAuth"
                color="primary"
                :label="$t('types.openvpn.auth')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionName"
                color="primary"
                :label="$t('types.openvpn.interfaceName')"
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
            <v-list-item v-if="isServer">
              <v-switch
                v-model="optionMaxClients"
                color="primary"
                :label="$t('types.openvpn.maxClients')"
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

const menu = ref(false)

const modes = [
  { title: 'TLS', value: 'tls' },
  { title: 'Static Key', value: 'static_key' },
]

const keyDirections = [
  { title: 'Server', value: 'server' },
  { title: 'Client', value: 'client' },
]

// The names sing-openvpn accepts (options_validation.go). A static_key tunnel
// can only use the CBC ones; a TLS session also takes the AEAD ciphers, which
// lead the list as the ones to prefer, and the CFB/OFB stream forms.
const cbcCiphers = [
  'AES-256-CBC', 'AES-192-CBC', 'AES-128-CBC',
  'CAMELLIA-256-CBC', 'CAMELLIA-192-CBC', 'CAMELLIA-128-CBC',
  'ARIA-256-CBC', 'ARIA-192-CBC', 'ARIA-128-CBC',
  'SEED-CBC', 'SM4-CBC', 'CAST5-CBC', 'BF-CBC',
  'DES-EDE3-CBC', 'DES-EDE-CBC', 'DES-CBC',
]
const staticCiphers = [...cbcCiphers, 'NONE']
const tlsCiphers = [
  'AES-256-GCM', 'AES-192-GCM', 'AES-128-GCM', 'CHACHA20-POLY1305',
  ...cbcCiphers,
  'AES-256-CFB', 'AES-192-CFB', 'AES-128-CFB',
  'AES-256-OFB', 'AES-192-OFB', 'AES-128-OFB',
]
const digests = ['SHA256', 'SHA384', 'SHA512', 'SHA224', 'SHA1', 'RIPEMD160', 'MD5', 'NONE']

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
      if (!data.value.cipher || !staticCiphers.includes(data.value.cipher)) {
        data.value.cipher = 'AES-256-CBC'
      }
    } else {
      delete data.value.cipher
    }
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

// Optional fields stay out of the form, and out of the saved config, until
// switched on from the options menu.
const optionCredentials = computed({
  get: (): boolean => data.value.username !== undefined || data.value.password !== undefined,
  set: (v: boolean) => {
    if (v) {
      data.value.username = ''
      data.value.password = ''
    } else {
      delete data.value.username
      delete data.value.password
    }
  },
})

const optionPeerIpv6 = computed({
  get: (): boolean => data.value.peer_address_ipv6 !== undefined,
  set: (v: boolean) => {
    if (v) data.value.peer_address_ipv6 = ''
    else delete data.value.peer_address_ipv6
  },
})

// Starts from OpenVPN's own default list, so turning it on changes nothing
// until the list is edited.
const optionDataCiphers = computed({
  get: (): boolean => data.value.data_ciphers !== undefined || data.value.data_ciphers_fallback !== undefined,
  set: (v: boolean) => {
    if (v) {
      data.value.data_ciphers = ['AES-256-GCM', 'AES-128-GCM', 'CHACHA20-POLY1305']
    } else {
      delete data.value.data_ciphers
      delete data.value.data_ciphers_fallback
    }
  },
})

const optionAuth = computed({
  get: (): boolean => data.value.auth !== undefined,
  set: (v: boolean) => {
    if (v) data.value.auth = 'SHA256'
    else delete data.value.auth
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

const optionMaxClients = computed({
  get: (): boolean => data.value.max_clients !== undefined,
  set: (v: boolean) => {
    if (v) data.value.max_clients = 100
    else delete data.value.max_clients
  },
})
</script>
