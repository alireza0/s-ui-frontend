<template>
  <v-card :subtitle="$t('objects.tls')">
    <!-- OpenConnect defines its own TLS options too, and names the trust anchor
         after its role rather than reusing the bare `certificate` sing-box's own
         TLS config uses. Left unset it trusts the system store, so nothing here
         is required. -->
    <v-row>
      <v-col>
        <v-btn-toggle
          v-model="usePath"
          class="rounded-xl"
          density="compact"
          variant="outlined"
          shaped
          mandatory
        >
          <v-btn @click="clearText">
            {{ $t('tls.usePath') }}
          </v-btn>
          <v-btn @click="clearPaths">
            {{ $t('tls.useText') }}
          </v-btn>
        </v-btn-toggle>
      </v-col>
    </v-row>

    <v-row v-if="usePath == 0">
      <v-col cols="12">
        <v-text-field
          v-model="tls.certificate_authority_path"
          :label="$t('types.openconnect.tls.caPath')"
          :hint="$t('types.openconnect.tls.caHint')"
          persistent-hint
        />
      </v-col>
    </v-row>
    <v-row v-else>
      <v-col cols="12">
        <v-textarea
          v-model="caText"
          :label="$t('types.openconnect.tls.ca')"
          :hint="$t('types.openconnect.tls.caHint')"
          persistent-hint
        />
      </v-col>
    </v-row>

    <!-- Mutual TLS: some deployments issue a client certificate instead of, or
         alongside, a password. -->
    <template v-if="optionMutual">
      <v-row v-if="usePath == 0">
        <v-col
          cols="12"
          sm="6"
        >
          <v-text-field
            v-model="tls.client_certificate_path"
            :label="$t('tls.clientCertPath')"
            hide-details
          />
        </v-col>
        <v-col
          cols="12"
          sm="6"
        >
          <v-text-field
            v-model="tls.client_key_path"
            :label="$t('tls.clientKeyPath')"
            hide-details
          />
        </v-col>
      </v-row>
      <v-row v-else>
        <v-col cols="12">
          <v-textarea
            v-model="clientCertText"
            :label="$t('tls.clientCert')"
            hide-details
          />
        </v-col>
        <v-col cols="12">
          <v-textarea
            v-model="clientKeyText"
            :label="$t('tls.clientKey')"
            hide-details
          />
        </v-col>
      </v-row>
      <v-row>
        <v-col
          cols="12"
          sm="6"
        >
          <v-text-field
            v-model="tls.client_key_password"
            :label="$t('types.openconnect.tls.clientKeyPassword')"
            type="password"
            hide-details
          />
        </v-col>
      </v-row>
    </template>

    <v-row v-if="optionFingerprint">
      <v-col cols="12">
        <v-combobox
          v-model="peerFingerprint"
          :label="$t('types.openvpn.tls.peerFingerprint')"
          :hint="$t('types.openconnect.tls.peerFingerprintHint')"
          persistent-hint
          multiple
          chips
          closable-chips
        />
      </v-col>
    </v-row>

    <v-row v-if="optionServerName">
      <v-col
        cols="12"
        sm="6"
      >
        <v-text-field
          v-model="tls.server_name"
          :label="$t('types.openconnect.tls.serverName')"
          hide-details
        />
      </v-col>
    </v-row>

    <v-row v-if="optionVerify">
      <v-col
        cols="12"
        sm="6"
      >
        <v-switch
          v-model="tls.insecure"
          color="primary"
          :label="$t('tls.insecure')"
          hide-details
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
      >
        <v-switch
          v-model="tls.system_trust_disabled"
          color="primary"
          :label="$t('types.openconnect.tls.systemTrustDisabled')"
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
            {{ $t('tls.options') }}
          </v-btn>
        </template>
        <v-card>
          <v-list>
            <v-list-item>
              <v-switch
                v-model="optionMutual"
                color="primary"
                :label="$t('tls.mutual')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionFingerprint"
                color="primary"
                :label="$t('types.openvpn.tls.peerFingerprint')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionServerName"
                color="primary"
                :label="$t('types.openconnect.tls.serverName')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionVerify"
                color="primary"
                :label="$t('tls.insecure')"
                hide-details
              />
            </v-list-item>
          </v-list>
        </v-card>
      </v-menu>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { PropType } from 'vue'
import { OpenConnectTls } from '@/types/endpoints'

// Material that sing-box takes either as a file path or as the PEM itself.
const pathFields = ['certificate_authority_path', 'client_certificate_path', 'client_key_path'] as const
const textFields = ['certificate_authority', 'client_certificate', 'client_key'] as const

type TextField = typeof textFields[number]

// Everything a mutual-authentication setup carries, so the option reads as on
// when the config already holds any of it.
const mutualFields = ['client_certificate', 'client_certificate_path', 'client_key', 'client_key_path', 'client_key_password'] as const

// The endpoint that owns the TLS block. OpenConnect defines its own TLS
// options, so they sit on the endpoint rather than in a panel TLS config.
interface TlsHolder {
  tls?: OpenConnectTls
}

export default {
  props: {
    // The modal holds the endpoint union and picks this form with a v-if on
    // the type, which the template checker cannot follow, so it is narrowed by
    // the computed below.
    data: { type: Object as PropType<object>, required: true }
  },
  data() {
    return {
      menu: false,
      usePath: 0,
    }
  },
  computed: {
    // Narrow once. The computed returns the same object, so edits reach the
    // parent.
    holder(): TlsHolder { return <TlsHolder>this.$props.data },
    tls(): OpenConnectTls {
      return <OpenConnectTls>this.holder.tls
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
        // sing-box takes a single string or a list here, so a config written
        // by hand can carry either.
        const value: string | string[] | undefined = this.tls.peer_fingerprint
        if (value == undefined) return []
        return Array.isArray(value) ? value : [value]
      },
      set(v: string[]) { this.tls.peer_fingerprint = v ?? [] }
    },
    // An option is on when the config already carries it, so opening an
    // existing endpoint shows what it actually has.
    optionMutual: {
      get(): boolean {
        return mutualFields
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
        for (const field of mutualFields) {
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
  created() {
    // Every field below writes into data.tls, so it has to exist first. An
    // empty one is dropped again when the endpoint is saved.
    if (!this.holder.tls) this.holder.tls = {}
    const tls = <OpenConnectTls>this.holder.tls
    this.usePath = textFields.some(f => tls[f] != undefined) ? 1 : 0
  },
  methods: {
    joined(field: TextField): string {
      return this.tls[field]?.join('\n') ?? ''
    },
    split(field: TextField, value: string) {
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
