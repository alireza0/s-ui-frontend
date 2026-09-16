<template>
  <v-card :subtitle="$t('objects.tls')">
    <!-- OpenVPN does not use sing-box's TLS options; it defines its own set
         with its own names, and the same name means the opposite thing on the
         two sides: on a server `certificate` is its own and `client_certificate`
         is the CA that signs clients, while on a client `certificate` is the CA
         and `client_certificate` is its own. -->
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
      <v-spacer />
      <!-- Only the server has a certificate of its own to issue. A client's
           trust anchor belongs to whoever runs the server. -->
      <v-col
        v-if="isServer"
        cols="auto"
      >
        <v-btn
          variant="tonal"
          density="compact"
          icon="mdi-key-star"
          :loading="loading"
          @click="genSelfSigned"
        >
          <v-icon />
          <v-tooltip
            activator="parent"
            location="top"
          >
            {{ $t('actions.generate') }}
          </v-tooltip>
        </v-btn>
      </v-col>
    </v-row>

    <!-- A server has to present a certificate and key; a client has to be able
         to check the one it is shown, which is the CA below or, failing that,
         the peer fingerprint under the options menu. -->
    <v-row v-if="usePath == 0">
      <v-col
        cols="12"
        :sm="isServer ? 6 : 12"
      >
        <v-text-field
          v-model="tls.certificate_path"
          :label="isServer ? $t('tls.certPath') : $t('types.openvpn.tls.caPath')"
          :hint="isServer ? undefined : $t('types.openvpn.tls.caHint')"
          :persistent-hint="!isServer"
          :hide-details="isServer"
        />
      </v-col>
      <v-col
        v-if="isServer"
        cols="12"
        sm="6"
      >
        <v-text-field
          v-model="tls.key_path"
          :label="$t('tls.keyPath')"
          hide-details
        />
      </v-col>
    </v-row>
    <v-row v-else>
      <v-col cols="12">
        <v-textarea
          v-model="certText"
          :label="isServer ? $t('tls.cert') : $t('types.openvpn.tls.ca')"
          hide-details
        />
      </v-col>
      <v-col
        v-if="isServer"
        cols="12"
      >
        <v-textarea
          v-model="keyText"
          :label="$t('tls.key')"
          hide-details
        />
      </v-col>
    </v-row>

    <!-- A server asks every client for a certificate unless it is told not to,
         and then needs the CA that signs them; leaving this unset is what made
         an otherwise complete server refuse to start. -->
    <v-row v-if="isServer">
      <v-col
        cols="12"
        sm="6"
      >
        <v-select
          v-model="verifyClientCertificate"
          :label="$t('types.openvpn.tls.verifyClient')"
          :items="verifyModes"
          :hint="$t('types.openvpn.tls.verifyClientHint')"
          persistent-hint
        />
      </v-col>
      <v-col
        v-if="wantsClientCerts && usePath == 0"
        cols="12"
        sm="6"
      >
        <v-text-field
          v-model="tls.client_certificate_path"
          :label="$t('types.openvpn.tls.clientCaPath')"
          :hint="$t('types.openvpn.tls.clientCaHint')"
          persistent-hint
        />
      </v-col>
      <v-col
        v-if="wantsClientCerts && usePath != 0"
        cols="12"
      >
        <v-textarea
          v-model="clientCertText"
          :label="$t('types.openvpn.tls.clientCa')"
          :hint="$t('types.openvpn.tls.clientCaHint')"
          persistent-hint
        />
      </v-col>
    </v-row>

    <!-- A client presents a certificate of its own when the server asks. -->
    <template v-if="!isServer && optionMutual">
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
    </template>

    <!-- tls-auth / tls-crypt wrap the control channel in a pre-shared key.
         Most real deployments use one, and both ends have to agree on it. -->
    <template v-if="optionControlWrap && tls.control_wrap">
      <v-row>
        <v-col
          cols="12"
          sm="6"
          md="4"
        >
          <v-select
            v-model="tls.control_wrap.type"
            :label="$t('types.openvpn.tls.controlWrap')"
            :items="controlWrapTypes"
            hide-details
          />
        </v-col>
        <v-col
          v-if="usePath == 0"
          cols="12"
          sm="6"
          md="4"
        >
          <v-text-field
            v-model="tls.control_wrap.key_path"
            :label="$t('types.openvpn.tls.controlWrapKeyPath')"
            hide-details
          />
        </v-col>
        <v-col
          v-if="tls.control_wrap.type == 'tls_auth'"
          cols="12"
          sm="6"
          md="4"
        >
          <v-select
            v-model="tls.control_wrap.direction"
            :label="$t('types.openvpn.keyDirection')"
            :items="keyDirections"
            hide-details
          />
        </v-col>
      </v-row>
      <v-row v-if="usePath != 0">
        <v-col cols="12">
          <v-textarea
            v-model="controlWrapKeyText"
            :label="$t('types.openvpn.tls.controlWrapKey')"
            :hint="$t('types.openvpn.tls.controlWrapKeyHint')"
            persistent-hint
          />
        </v-col>
      </v-row>
      <v-row>
        <v-spacer />
        <v-col cols="auto">
          <v-btn
            variant="tonal"
            density="compact"
            icon="mdi-key-star"
            :loading="loading"
            @click="genStaticKey"
          >
            <v-icon />
            <v-tooltip
              activator="parent"
              location="top"
            >
              {{ $t('actions.generate') }}
            </v-tooltip>
          </v-btn>
        </v-col>
      </v-row>
    </template>

    <v-row v-if="optionFingerprint">
      <v-col cols="12">
        <v-combobox
          v-model="peerFingerprint"
          :label="$t('types.openvpn.tls.peerFingerprint')"
          :hint="$t('types.openvpn.tls.peerFingerprintHint')"
          persistent-hint
          multiple
          chips
          closable-chips
        />
      </v-col>
    </v-row>

    <v-row v-if="(optionServerName && !isServer) || optionCrl">
      <v-col
        v-if="optionServerName && !isServer"
        cols="12"
        sm="6"
      >
        <v-text-field
          v-model="tls.server_name"
          :label="$t('types.openvpn.tls.serverName')"
          hide-details
        />
      </v-col>
      <v-col
        v-if="optionCrl"
        cols="12"
        sm="6"
      >
        <v-text-field
          v-model="tls.crl_path"
          :label="$t('types.openvpn.tls.crlPath')"
          hide-details
        />
      </v-col>
    </v-row>

    <v-row v-if="optionVersions">
      <v-col
        cols="12"
        sm="6"
      >
        <v-select
          v-model="tls.version_min"
          :label="$t('tls.minVer')"
          :items="versions"
          hide-details
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
      >
        <v-select
          v-model="tls.version_max"
          :label="$t('tls.maxVer')"
          :items="versions"
          hide-details
        />
      </v-col>
    </v-row>

    <v-row v-if="optionProfile">
      <v-col
        cols="12"
        sm="6"
      >
        <v-select
          v-model="tls.remote_certificate_tls"
          :label="$t('types.openvpn.tls.remoteCertificateTls')"
          :items="remoteCertificateTls"
          hide-details
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
      >
        <v-select
          v-model="tls.certificate_profile"
          :label="$t('types.openvpn.tls.certificateProfile')"
          :items="certificateProfiles"
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
            <v-list-item v-if="!isServer">
              <v-switch
                v-model="optionMutual"
                color="primary"
                :label="$t('tls.mutual')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionControlWrap"
                color="primary"
                :label="$t('types.openvpn.tls.controlWrap')"
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
            <v-list-item v-if="!isServer">
              <v-switch
                v-model="optionServerName"
                color="primary"
                :label="$t('types.openvpn.tls.serverName')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionCrl"
                color="primary"
                :label="$t('types.openvpn.tls.crlPath')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionVersions"
                color="primary"
                :label="$t('tls.minVer')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionProfile"
                color="primary"
                :label="$t('types.openvpn.tls.certificateProfile')"
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
import HttpUtils from '@/plugins/httputil'
import { push } from 'notivue'
import { i18n } from '@/locales'
import { OpenVpnTls } from '@/types/endpoints'

// Material that sing-box takes either as a file path or as the PEM itself.
// Switching between the two clears the other, so only one ever reaches the
// config.
const pathFields = ['certificate_path', 'key_path', 'client_certificate_path', 'client_key_path'] as const
const textFields = ['certificate', 'key', 'client_certificate', 'client_key'] as const

type TextField = typeof textFields[number]

// Everything a mutual-authentication setup carries, so the option reads as on
// when the config already holds any of it.
const mutualFields = ['client_certificate', 'client_certificate_path', 'client_key', 'client_key_path'] as const

// The endpoint that owns the TLS block. OpenVPN defines its own TLS options,
// so they sit on the endpoint rather than in a panel TLS config.
interface TlsHolder {
  type: string
  tag: string
  tls?: OpenVpnTls
}

const staticKeyBegin = '-----BEGIN OpenVPN Static key V1-----'

// The keypair endpoint returns the private key and the certificate as one run
// of lines, so each block is taken from its own BEGIN/END markers.
function pemBlock(lines: string[], type: string): string[] {
  const start = lines.indexOf('-----BEGIN ' + type + '-----')
  const end = lines.indexOf('-----END ' + type + '-----')
  if (start == -1 || end < start) return []
  return lines.slice(start, end + 1)
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
      loading: false,
      usePath: 0,
      versions: ['1.0', '1.1', '1.2', '1.3'],
      verifyModes: [
        { title: 'Require', value: 'require' },
        { title: 'Optional', value: 'optional' },
        { title: 'None', value: 'none' },
      ],
      remoteCertificateTls: [
        { title: 'Server', value: 'server' },
        { title: 'Client', value: 'client' },
        { title: 'None', value: 'none' },
      ],
      certificateProfiles: ['legacy', 'preferred', 'insecure', 'suiteb'],
      controlWrapTypes: [
        { title: 'tls-auth', value: 'tls_auth' },
        { title: 'tls-crypt', value: 'tls_crypt' },
        { title: 'tls-crypt-v2', value: 'tls_crypt_v2' },
      ],
      keyDirections: [
        { title: 'Server', value: 'server' },
        { title: 'Client', value: 'client' },
      ],
    }
  },
  computed: {
    // Narrow once. The computed returns the same object, so edits reach the
    // parent.
    holder(): TlsHolder { return <TlsHolder>this.$props.data },
    tls(): OpenVpnTls {
      return <OpenVpnTls>this.holder.tls
    },
    isServer(): boolean {
      return this.holder.type === 'openvpn-server'
    },
    certText: {
      get(): string { return this.joined('certificate') },
      set(v: string) { this.split('certificate', v) }
    },
    keyText: {
      get(): string { return this.joined('key') },
      set(v: string) { this.split('key', v) }
    },
    clientCertText: {
      get(): string { return this.joined('client_certificate') },
      set(v: string) { this.split('client_certificate', v) }
    },
    clientKeyText: {
      get(): string { return this.joined('client_key') },
      set(v: string) { this.split('client_key', v) }
    },
    controlWrapKeyText: {
      get(): string { return this.tls.control_wrap?.key?.join('\n') ?? '' },
      set(v: string) {
        if (!this.tls.control_wrap) return
        if (v) this.tls.control_wrap.key = v.split('\n')
        else delete this.tls.control_wrap.key
      }
    },
    // sing-box takes a single string or a list; the panel always writes a list
    // so the field round-trips through one shape.
    peerFingerprint: {
      get(): string[] {
        const value: string | string[] | undefined = this.tls.peer_fingerprint
        if (value == undefined) return []
        return Array.isArray(value) ? value : [value]
      },
      set(v: string[]) { this.tls.peer_fingerprint = v ?? [] }
    },
    // An option is on when the config already carries it, so opening an
    // existing endpoint shows what it actually has.
    wantsClientCerts(): boolean {
      return this.tls.verify_client_certificate != 'none'
    },
    verifyClientCertificate: {
      get(): string { return this.tls.verify_client_certificate ?? 'none' },
      set(v: string) {
        this.tls.verify_client_certificate = <OpenVpnTls['verify_client_certificate']>v
        if (v == 'none') {
          delete this.tls.client_certificate
          delete this.tls.client_certificate_path
        }
      }
    },
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
        } else {
          for (const field of mutualFields) {
            delete this.tls[field]
          }
        }
      }
    },
    optionControlWrap: {
      get(): boolean { return this.tls.control_wrap != undefined },
      set(v: boolean) {
        if (v) this.tls.control_wrap = { type: 'tls_crypt' }
        else delete this.tls.control_wrap
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
    optionCrl: {
      get(): boolean { return this.tls.crl_path != undefined },
      set(v: boolean) {
        if (v) this.tls.crl_path = ''
        else delete this.tls.crl_path
      }
    },
    optionVersions: {
      get(): boolean { return this.tls.version_min != undefined || this.tls.version_max != undefined },
      set(v: boolean) {
        if (v) {
          this.tls.version_min = '1.2'
        } else {
          delete this.tls.version_min
          delete this.tls.version_max
        }
      }
    },
    optionProfile: {
      get(): boolean { return this.tls.remote_certificate_tls != undefined || this.tls.certificate_profile != undefined },
      set(v: boolean) {
        if (v) {
          // Each side checks that the other's certificate was issued for the
          // opposite role.
          this.tls.remote_certificate_tls = this.isServer ? 'client' : 'server'
        } else {
          delete this.tls.remote_certificate_tls
          delete this.tls.certificate_profile
        }
      }
    },
  },
  created() {
    // Every field below writes into data.tls, so it has to exist first. An
    // empty one is dropped again when the endpoint is saved.
    if (!this.holder.tls) this.holder.tls = {}
    const tls = <OpenVpnTls>this.holder.tls
    this.usePath = textFields.some(f => tls[f] != undefined) || tls.control_wrap?.key != undefined ? 1 : 0
    // sing-box reads an unset verify_client_certificate as "require", so a
    // server left alone would demand client certificates and then fail for
    // want of a CA to check them against. The panel makes the choice explicit.
    if (this.isServer && tls.verify_client_certificate == undefined) {
      tls.verify_client_certificate = 'none'
    }
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
      if (this.tls.control_wrap) delete this.tls.control_wrap.key
    },
    clearPaths() {
      for (const field of pathFields) delete this.tls[field]
      if (this.tls.control_wrap) delete this.tls.control_wrap.key_path
    },
    // A self-signed certificate is its own authority, so the same PEM is what a
    // client puts in its Certificate Authority field. The endpoint tag becomes
    // the common name, which is what a client's Expected Server Name matches.
    async genSelfSigned() {
      this.loading = true
      const msg = await HttpUtils.get<string[]>('api/keypairs', { k: 'tls', o: this.holder.tag ?? '' })
      this.loading = false
      if (!msg.success || msg.obj.length == 0) {
        push.error({ message: i18n.global.t('error') + ': ' + msg.obj })
        return
      }
      const key = pemBlock(msg.obj, 'PRIVATE KEY')
      const certificate = pemBlock(msg.obj, 'CERTIFICATE')
      if (key.length == 0 || certificate.length == 0) {
        push.error({ message: i18n.global.t('error') + ': ' + msg.obj })
        return
      }
      // The generated pair only exists here, so the form has to hold it as
      // text; there is no file on disk to point at.
      this.clearPaths()
      this.usePath = 1
      this.tls.key = key
      this.tls.certificate = certificate
    },
    // tls-auth and tls-crypt take an OpenVPN static key, not a PEM. Both ends
    // of the tunnel have to carry the same one, so the other side gets a copy
    // of what this produces.
    async genStaticKey() {
      this.loading = true
      const msg = await HttpUtils.get<string[]>('api/keypairs', { k: 'openvpn' })
      this.loading = false
      if (!msg.success || msg.obj.length == 0 || msg.obj.indexOf(staticKeyBegin) == -1) {
        push.error({ message: i18n.global.t('error') + ': ' + msg.obj })
        return
      }
      // The generated key only exists here, so the form has to hold it as
      // text; there is no file on disk to point at.
      this.clearPaths()
      this.usePath = 1
      // Only reachable while the control-wrap section is showing, which is
      // what puts control_wrap there.
      this.tls.control_wrap!.key = msg.obj
    },
  },
}
</script>
