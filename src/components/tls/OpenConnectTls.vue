<template>
  <v-card :subtitle="$t('objects.tls')">
    <!-- OpenConnect defines its own TLS options too, and names the trust anchor
         after its role rather than reusing the bare `certificate` sing-box's own
         TLS config uses. Left unset it trusts the system store, so nothing here
         is required. -->
    <v-row>
      <v-col>
        <v-btn-toggle v-model="usePath"
          class="rounded-xl"
          density="compact"
          variant="outlined"
          shaped
          mandatory>
          <v-btn @click="clearText">{{ $t('tls.usePath') }}</v-btn>
          <v-btn @click="clearPaths">{{ $t('tls.useText') }}</v-btn>
        </v-btn-toggle>
      </v-col>
    </v-row>

    <v-row v-if="usePath == 0">
      <v-col cols="12">
        <v-text-field
          :label="$t('types.openconnect.tls.caPath')"
          :hint="$t('types.openconnect.tls.caHint')"
          persistent-hint
          v-model="tls.certificate_authority_path">
        </v-text-field>
      </v-col>
    </v-row>
    <v-row v-else>
      <v-col cols="12">
        <v-textarea
          :label="$t('types.openconnect.tls.ca')"
          :hint="$t('types.openconnect.tls.caHint')"
          persistent-hint
          v-model="caText">
        </v-textarea>
      </v-col>
    </v-row>

    <!-- Mutual TLS: some deployments issue a client certificate instead of, or
         alongside, a password. -->
    <template v-if="optionMutual">
      <v-row v-if="usePath == 0">
        <v-col cols="12" sm="6">
          <v-text-field
            :label="$t('tls.clientCertPath')"
            hide-details
            v-model="tls.client_certificate_path">
          </v-text-field>
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field
            :label="$t('tls.clientKeyPath')"
            hide-details
            v-model="tls.client_key_path">
          </v-text-field>
        </v-col>
      </v-row>
      <v-row v-else>
        <v-col cols="12">
          <v-textarea
            :label="$t('tls.clientCert')"
            hide-details
            v-model="clientCertText">
          </v-textarea>
        </v-col>
        <v-col cols="12">
          <v-textarea
            :label="$t('tls.clientKey')"
            hide-details
            v-model="clientKeyText">
          </v-textarea>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12" sm="6">
          <v-text-field
            :label="$t('types.openconnect.tls.clientKeyPassword')"
            type="password"
            hide-details
            v-model="tls.client_key_password">
          </v-text-field>
        </v-col>
      </v-row>
    </template>

    <v-row v-if="optionFingerprint">
      <v-col cols="12">
        <v-combobox
          :label="$t('types.openvpn.tls.peerFingerprint')"
          :hint="$t('types.openconnect.tls.peerFingerprintHint')"
          persistent-hint
          multiple
          chips
          closable-chips
          v-model="peerFingerprint">
        </v-combobox>
      </v-col>
    </v-row>

    <v-row v-if="optionServerName">
      <v-col cols="12" sm="6">
        <v-text-field
          :label="$t('types.openconnect.tls.serverName')"
          hide-details
          v-model="tls.server_name">
        </v-text-field>
      </v-col>
    </v-row>

    <v-row v-if="optionVerify">
      <v-col cols="12" sm="6">
        <v-switch v-model="tls.insecure" color="primary" :label="$t('tls.insecure')" hide-details></v-switch>
      </v-col>
      <v-col cols="12" sm="6">
        <v-switch v-model="tls.system_trust_disabled" color="primary" :label="$t('types.openconnect.tls.systemTrustDisabled')" hide-details></v-switch>
      </v-col>
    </v-row>

    <v-card-actions class="pt-0">
      <v-spacer></v-spacer>
      <v-menu v-model="menu" :close-on-content-click="false" location="start">
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props" hide-details variant="tonal">{{ $t('tls.options') }}</v-btn>
        </template>
        <v-card>
          <v-list>
            <v-list-item>
              <v-switch v-model="optionMutual" color="primary" :label="$t('tls.mutual')" hide-details></v-switch>
            </v-list-item>
            <v-list-item>
              <v-switch v-model="optionFingerprint" color="primary" :label="$t('types.openvpn.tls.peerFingerprint')" hide-details></v-switch>
            </v-list-item>
            <v-list-item>
              <v-switch v-model="optionServerName" color="primary" :label="$t('types.openconnect.tls.serverName')" hide-details></v-switch>
            </v-list-item>
            <v-list-item>
              <v-switch v-model="optionVerify" color="primary" :label="$t('tls.insecure')" hide-details></v-switch>
            </v-list-item>
          </v-list>
        </v-card>
      </v-menu>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
// Material that sing-box takes either as a file path or as the PEM itself.
const pathFields = ['certificate_authority_path', 'client_certificate_path', 'client_key_path']
const textFields = ['certificate_authority', 'client_certificate', 'client_key']

export default {
  props: ['data'],
  data() {
    return {
      menu: false,
      usePath: 0,
    }
  },
  created() {
    // Every field below writes into data.tls, so it has to exist first. An
    // empty one is dropped again when the endpoint is saved.
    if (!this.$props.data.tls) this.$props.data.tls = {}
    const tls = this.$props.data.tls
    this.usePath = textFields.some(f => tls[f] != undefined) ? 1 : 0
  },
  computed: {
    tls(): any {
      return this.$props.data.tls
    },
    caText: {
      get(): string { return this.joined('certificate_authority') },
      set(v: string) { this.split('certificate_authority', v) }
    },
    clientCertText: {
      get(): string { return this.joined('client_certificate') },
      set(v: string) { this.split('client_certificate', v) }
    },
    clientKeyText: {
      get(): string { return this.joined('client_key') },
      set(v: string) { this.split('client_key', v) }
    },
    peerFingerprint: {
      get(): string[] {
        const value = this.tls.peer_fingerprint
        if (value == undefined) return []
        return Array.isArray(value) ? value : [value]
      },
      set(v: string[]) { this.tls.peer_fingerprint = v ?? [] }
    },
    // An option is on when the config already carries it, so opening an
    // existing endpoint shows what it actually has.
    optionMutual: {
      get(): boolean {
        return ['client_certificate', 'client_certificate_path', 'client_key', 'client_key_path', 'client_key_password']
          .some(f => this.tls[f] != undefined)
      },
      set(v: boolean) {
        if (v) {
          // Switching an option on has to leave something behind, or the
          // section it reveals would be hidden again by its own getter. The
          // empty placeholder is dropped when the endpoint is saved.
          if (this.usePath == 0) this.tls.client_certificate_path = ''
          else this.tls.client_certificate = []
          return
        }
        for (const field of ['client_certificate', 'client_certificate_path', 'client_key', 'client_key_path', 'client_key_password']) {
          delete this.tls[field]
        }
      }
    },
    optionFingerprint: {
      get(): boolean { return this.tls.peer_fingerprint != undefined },
      set(v: boolean) {
        if (v) this.tls.peer_fingerprint = []
        else delete this.tls.peer_fingerprint
      }
    },
    optionServerName: {
      get(): boolean { return this.tls.server_name != undefined },
      set(v: boolean) {
        if (v) this.tls.server_name = ''
        else delete this.tls.server_name
      }
    },
    optionVerify: {
      get(): boolean { return this.tls.insecure != undefined || this.tls.system_trust_disabled != undefined },
      set(v: boolean) {
        if (v) {
          this.tls.insecure = false
        } else {
          delete this.tls.insecure
          delete this.tls.system_trust_disabled
        }
      }
    },
  },
  methods: {
    joined(field: string): string {
      return this.tls[field]?.join('\n') ?? ''
    },
    split(field: string, value: string) {
      if (value) this.tls[field] = value.split('\n')
      else delete this.tls[field]
    },
    clearText() {
      for (const field of textFields) delete this.tls[field]
    },
    clearPaths() {
      for (const field of pathFields) delete this.tls[field]
    },
  },
}
</script>
