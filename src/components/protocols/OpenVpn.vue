<template>
  <v-card :subtitle="isServer ? 'OpenVPN Server' : 'OpenVPN Client'">
    <!-- Client dials a remote server; server listens locally. -->
    <v-row v-if="!isServer">
      <v-col cols="12" sm="6" md="4">
        <v-text-field
          :label="$t('types.openvpn.server')"
          hide-details
          v-model="data.server">
        </v-text-field>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-text-field
          :label="$t('types.openvpn.serverPort')"
          type="number"
          min="1"
          max="65535"
          hide-details
          v-model.number="data.server_port">
        </v-text-field>
      </v-col>
    </v-row>
    <v-row v-else>
      <v-col cols="12" sm="6" md="4">
        <v-text-field :label="$t('in.addr')" hide-details v-model="data.listen"></v-text-field>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-text-field
          :label="$t('in.port')"
          type="number"
          min="1"
          max="65535"
          hide-details
          v-model.number="data.listen_port">
        </v-text-field>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-text-field
          :label="$t('types.openvpn.maxClients')"
          type="number"
          min="0"
          hide-details
          v-model.number="maxClients">
        </v-text-field>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" sm="6" md="4">
        <v-select hide-details :label="$t('types.openvpn.mode')" :items="modes" v-model="mode"></v-select>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-select hide-details :label="$t('objects.network')" :items="networks" v-model="data.network"></v-select>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-text-field
          :label="$t('types.openvpn.interfaceName')"
          hide-details
          clearable
          @click:clear="delete data.name"
          v-model="data.name">
        </v-text-field>
      </v-col>
    </v-row>

    <!-- The server always assigns addresses; a static_key client must set its
         own, since there is no TLS session to push one over. -->
    <v-row v-if="isServer || data.mode == 'static_key'">
      <v-col cols="12">
        <v-combobox
          :label="$t('types.openvpn.address')"
          hide-details
          multiple
          chips
          closable-chips
          v-model="data.address">
        </v-combobox>
      </v-col>
    </v-row>

    <!-- static_key mode has no TLS session, so the peer address cannot be
         negotiated and has to be configured on both ends. -->
    <v-row v-if="!isServer && data.mode == 'static_key'">
      <v-col cols="12" sm="6" md="4">
        <v-text-field
          :label="$t('types.openvpn.peerAddress')"
          hide-details
          placeholder="10.8.0.1"
          v-model="data.peer_address">
        </v-text-field>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-text-field
          :label="$t('types.openvpn.peerAddressIpv6')"
          hide-details
          clearable
          @click:clear="delete data.peer_address_ipv6"
          v-model="data.peer_address_ipv6">
        </v-text-field>
      </v-col>
    </v-row>

    <!-- static_key mode uses a shared key instead of TLS -->
    <v-row v-if="data.mode == 'static_key'">
      <v-col cols="12" sm="6" md="4">
        <v-text-field
          :label="$t('types.openvpn.staticKeyPath')"
          hide-details
          clearable
          @click:clear="delete data.static_key_path"
          v-model="data.static_key_path">
        </v-text-field>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-select
          hide-details
          :label="$t('types.openvpn.keyDirection')"
          :items="keyDirections"
          clearable
          @click:clear="delete data.key_direction"
          v-model="data.key_direction">
        </v-select>
      </v-col>
    </v-row>

    <v-row v-if="!isServer && data.mode == 'tls'">
      <v-col cols="12" sm="6" md="4">
        <v-text-field
          :label="$t('types.un')"
          hide-details
          clearable
          @click:clear="delete data.username"
          v-model="data.username">
        </v-text-field>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-text-field
          :label="$t('types.pw')"
          hide-details
          type="password"
          clearable
          @click:clear="delete data.password"
          v-model="data.password">
        </v-text-field>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" sm="6" md="4">
        <v-text-field label="MTU" type="number" min="0" hide-details v-model.number="mtu"></v-text-field>
      </v-col>
      <!-- The two modes negotiate the data cipher differently, and sing-box
           rejects the option belonging to the other one: `cipher` names the
           single fixed cipher a static_key tunnel uses, while a TLS session
           negotiates one out of `data_ciphers`. -->
      <v-col cols="12" sm="6" md="4" v-if="data.mode == 'static_key'">
        <v-text-field
          :label="$t('types.openvpn.cipher')"
          hide-details
          clearable
          placeholder="AES-256-CBC"
          @click:clear="delete data.cipher"
          v-model="data.cipher">
        </v-text-field>
      </v-col>
      <v-col cols="12" sm="6" md="4" v-else>
        <v-combobox
          :label="$t('types.openvpn.dataCiphers')"
          hide-details
          multiple
          chips
          closable-chips
          placeholder="AES-256-GCM"
          v-model="dataCiphers">
        </v-combobox>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-text-field
          :label="$t('types.openvpn.auth')"
          hide-details
          clearable
          placeholder="SHA256"
          @click:clear="delete data.auth"
          v-model="data.auth">
        </v-text-field>
      </v-col>
    </v-row>
    <v-row v-if="data.mode != 'static_key'">
      <v-col cols="12" sm="6" md="4">
        <v-text-field
          :label="$t('types.openvpn.dataCiphersFallback')"
          hide-details
          clearable
          placeholder="AES-256-GCM"
          @click:clear="delete data.data_ciphers_fallback"
          v-model="data.data_ciphers_fallback">
        </v-text-field>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" sm="6" md="4">
        <v-switch v-model="data.system" color="primary" :label="$t('types.openvpn.system')" hide-details></v-switch>
      </v-col>
      <v-col cols="12" sm="6" md="4" v-if="isServer">
        <v-switch v-model="data.duplicate_cn" color="primary" :label="$t('types.openvpn.duplicateCn')" hide-details></v-switch>
      </v-col>
    </v-row>

  </v-card>
</template>

<script lang="ts">
export default {
  props: ['data'],
  data() {
    return {
      modes: [
        { title: 'TLS', value: 'tls' },
        { title: 'Static Key', value: 'static_key' },
      ],
      keyDirections: [
        { title: 'Server', value: 'server' },
        { title: 'Client', value: 'client' },
      ],
    }
  },
  computed: {
    // Each mode rejects the other's cipher options outright, so switching has
    // to clear the ones that no longer apply. static_key additionally requires
    // a CBC cipher: GCM relies on the TLS key exchange for IV uniqueness, so
    // sing-box will not use it without a TLS session.
    mode: {
      get(): string { return this.$props.data.mode },
      set(v: string) {
        this.$props.data.mode = v
        if (v === 'static_key') {
          delete this.$props.data.data_ciphers
          delete this.$props.data.data_ciphers_fallback
          if (!this.$props.data.cipher || this.$props.data.cipher.includes('GCM')) {
            this.$props.data.cipher = 'AES-256-CBC'
          }
        } else {
          delete this.$props.data.cipher
        }
      }
    },
    dataCiphers: {
      get(): string[] { return this.$props.data.data_ciphers ?? [] },
      set(v: string[]) {
        if (v?.length) this.$props.data.data_ciphers = v
        else delete this.$props.data.data_ciphers
      }
    },
    isServer(): boolean {
      return this.$props.data.type === 'openvpn-server'
    },
    // The server accepts tcp/udp only; the client also takes the v4/v6 forms.
    networks(): { title: string; value: string }[] {
      const base = [
        { title: 'UDP', value: 'udp' },
        { title: 'TCP', value: 'tcp' },
      ]
      if (this.isServer) return base
      return base.concat([
        { title: 'UDPv4', value: 'udp4' },
        { title: 'UDPv6', value: 'udp6' },
        { title: 'TCPv4', value: 'tcp4' },
        { title: 'TCPv6', value: 'tcp6' },
      ])
    },
    mtu: {
      get(): number { return this.$props.data?.mtu ?? 0 },
      set(v: number) { this.$props.data.mtu = v > 0 ? v : undefined }
    },
    maxClients: {
      get(): number { return this.$props.data?.max_clients ?? 0 },
      set(v: number) { this.$props.data.max_clients = v > 0 ? v : undefined }
    },
  },
}
</script>
