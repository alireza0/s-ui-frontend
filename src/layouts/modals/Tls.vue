<template>
  <v-dialog
    transition="dialog-bottom-transition"
    width="800"
  >
    <v-card class="rounded-lg">
      <v-card-title class="d-flex align-center">
        {{ $t('actions.' + title) + " " + $t('objects.tls') }}
        <v-spacer />
        <DocLink section="tls" />
      </v-card-title>
      <v-divider />
      <v-card-text style="padding: 0 16px; overflow-y: scroll;">
        <v-card class="rounded-lg">
          <v-row>
            <v-col
              cols="12"
              sm="6"
              md="4"
            >
              <v-text-field
                v-model="tls.name"
                :label="$t('client.name')"
                hide-details
              />
            </v-col>
            <v-col align="end">
              <v-btn-toggle
                v-model="tlsType"
                class="rounded-xl"
                density="compact"
                variant="outlined"
                shaped
                mandatory
                @update:model-value="changeTlsType"
              >
                <v-btn>TLS</v-btn>
                <v-btn>Reality</v-btn>
              </v-btn-toggle>
            </v-col>
          </v-row>
          <v-row>
            <v-col
              v-if="inTls.server_name != undefined"
              cols="12"
              sm="6"
              md="4"
            >
              <v-text-field
                v-model="inTls.server_name"
                label="SNI"
                hide-details
              />
            </v-col>
            <template v-if="tlsType == 0">
              <v-col
                v-if="inTls.min_version"
                cols="12"
                sm="6"
                md="4"
              >
                <v-select
                  v-model="inTls.min_version"
                  hide-details
                  :label="$t('tls.minVer')"
                  :items="tlsVersions"
                />
              </v-col>
              <v-col
                v-if="inTls.max_version"
                cols="12"
                sm="6"
                md="4"
              >
                <v-select
                  v-model="inTls.max_version"
                  hide-details
                  :label="$t('tls.maxVer')"
                  :items="tlsVersions"
                />
              </v-col>
              <v-col
                v-if="inTls.alpn"
                cols="12"
                sm="6"
                md="4"
              >
                <v-select
                  v-model="inTls.alpn"
                  hide-details
                  label="ALPN"
                  multiple
                  :items="alpn"
                />
              </v-col>
              <v-col
                v-if="inTls.cipher_suites != undefined"
                cols="12"
                md="8"
              >
                <v-select
                  v-model="inTls.cipher_suites"
                  hide-details
                  :label="$t('tls.cs')"
                  multiple
                  :items="cipher_suites"
                />
              </v-col>
            </template>
          </v-row>
          <template v-if="tlsType == 0">
            <!-- A certificate provider issues the certificate itself, so
                 sing-box ignores any certificate given by hand once one is
                 chosen. Providers are defined on the TLS page. -->
            <v-row>
              <v-col
                cols="12"
                sm="6"
                md="4"
              >
                <v-select
                  v-model="inTls.certificate_provider"
                  hide-details
                  :label="$t('tls.provider.title')"
                  :items="providerTags"
                  :no-data-text="$t('tls.provider.none')"
                  clearable
                  @click:clear="inTls.certificate_provider = undefined"
                />
              </v-col>
            </v-row>
            <v-row v-if="inTls.certificate_provider == undefined">
              <v-col>
                <v-btn-toggle
                  v-model="usePath"
                  class="rounded-xl"
                  density="compact"
                  variant="outlined"
                  shaped
                  mandatory
                >
                  <v-btn
                    @click="inTls.key=undefined; inTls.certificate=undefined"
                  >
                    {{ $t('tls.usePath') }}
                  </v-btn>
                  <v-btn
                    @click="inTls.key_path=undefined; inTls.certificate_path=undefined"
                  >
                    {{ $t('tls.useText') }}
                  </v-btn>
                </v-btn-toggle>
              </v-col>
              <v-spacer />
              <v-col cols="auto">
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
            <v-row v-if="inTls.certificate_provider == undefined && usePath == 0">
              <v-col
                cols="12"
                sm="6"
              >
                <v-text-field
                  v-model="inTls.certificate_path"
                  :label="$t('tls.certPath')"
                  hide-details
                />
              </v-col>
              <v-col
                cols="12"
                sm="6"
              >
                <v-text-field
                  v-model="inTls.key_path"
                  :label="$t('tls.keyPath')"
                  hide-details
                />
              </v-col>
            </v-row>
            <v-row v-else-if="inTls.certificate_provider == undefined">
              <v-col cols="12">
                <v-textarea
                  v-model="certText"
                  :label="$t('tls.cert')"
                  hide-details
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="keyText"
                  :label="$t('tls.key')"
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
                  v-model="disableSni"
                  color="primary"
                  :label="$t('tls.disableSni')"
                  hide-details
                />
              </v-col>
              <v-col
                cols="12"
                sm="6"
                md="4"
              >
                <v-switch
                  v-model="insecure"
                  color="primary"
                  :label="$t('tls.insecure')"
                  hide-details
                />
              </v-col>
            </v-row>
          </template>
          <template v-if="outTls.reality && inTls.reality">
            <v-row>
              <v-col
                cols="12"
                sm="6"
                md="4"
              >
                <v-text-field
                  v-model="inTls.reality.handshake.server"
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
                  v-model="server_port"
                  :label="$t('out.port')"
                  type="number"
                  min="0"
                  hide-details
                />
              </v-col>
              <v-spacer />
              <v-col cols="auto">
                <v-btn
                  variant="tonal"
                  density="compact"
                  icon="mdi-key-star"
                  :loading="loading"
                  @click="genRealityKey"
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
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="inTls.reality.private_key"
                  :label="$t('tls.privKey')"
                  hide-details
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="outTls.reality.public_key"
                  :label="$t('tls.pubKey')"
                  hide-details
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="short_id"
                  label="Short IDs"
                  hide-details
                  append-icon="mdi-refresh"
                  @click:append="randomSID"
                />
              </v-col>
              <v-col
                v-if="optionTime"
                cols="12"
                sm="6"
                md="4"
              >
                <v-text-field
                  v-model="max_time"
                  label="Max Time Diference"
                  type="number"
                  min="1"
                  :suffix="$t('date.m')"
                  hide-details
                />
              </v-col>
            </v-row>
          </template>
          <v-row v-if="optionHandshake">
            <v-col
              cols="12"
              sm="6"
              md="4"
            >
              <v-text-field
                v-model.number="handshakeTimeout"
                :label="$t('tls.handshakeTimeout')"
                type="number"
                min="1"
                :suffix="$t('date.s')"
                hide-details
              />
            </v-col>
          </v-row>
          <v-row v-if="optionStore || optionKtls">
            <v-col
              v-if="optionStore"
              cols="12"
              sm="6"
              md="4"
            >
              <v-select
                v-model="inTls.store"
                hide-details
                :label="$t('tls.store')"
                :items="storeItems"
              />
            </v-col>
            <template v-if="optionKtls">
              <v-col
                cols="12"
                sm="6"
                md="4"
              >
                <v-switch
                  v-model="inTls.kernel_tx"
                  color="primary"
                  :label="$t('tls.kernelTx')"
                  hide-details
                />
              </v-col>
              <v-col
                cols="12"
                sm="6"
                md="4"
              >
                <v-switch
                  v-model="inTls.kernel_rx"
                  color="primary"
                  :label="$t('tls.kernelRx')"
                  hide-details
                />
              </v-col>
            </template>
          </v-row>
          <!-- Mutual TLS: the server verifies client certificates, and the
               client presents one. Endpoints reuse these when they reference
               this TLS config. Paths and inline text are exclusive, matching
               how the server certificate above is entered. -->
          <template v-if="optionClientAuth">
            <v-divider class="my-2" />
            <v-card-subtitle>{{ $t('tls.mutual') }}</v-card-subtitle>
            <v-row>
              <v-col
                cols="12"
                sm="6"
                md="4"
              >
                <v-select
                  v-model="inTls.client_authentication"
                  hide-details
                  :label="$t('tls.clientAuth')"
                  :items="clientAuthTypes"
                  clearable
                  @click:clear="inTls.client_authentication = undefined"
                />
              </v-col>
              <v-col
                cols="auto"
                align-self="center"
              >
                <v-btn-toggle
                  v-model="useClientPath"
                  class="rounded-xl"
                  density="compact"
                  variant="outlined"
                  shaped
                  mandatory
                >
                  <v-btn @click="switchClientTls(true)">
                    {{ $t('tls.usePath') }}
                  </v-btn>
                  <v-btn @click="switchClientTls(false)">
                    {{ $t('tls.useText') }}
                  </v-btn>
                </v-btn-toggle>
              </v-col>
            </v-row>

            <!-- Server side: the CAs a presented client certificate is checked against -->
            <template v-if="useClientPath == 0">
              <v-row>
                <v-col cols="12">
                  <v-combobox
                    v-model="inTls.client_certificate_path"
                    hide-details
                    :label="$t('tls.clientCaPath')"
                    multiple
                    chips
                    closable-chips
                  />
                </v-col>
              </v-row>
            </template>
            <template v-else>
              <v-row>
                <v-col cols="12">
                  <v-textarea
                    v-model="clientCaText"
                    hide-details
                    :label="$t('tls.clientCa')"
                  />
                </v-col>
              </v-row>
            </template>

            <!-- Client side: the certificate and key this panel presents -->
            <template v-if="useClientPath == 0">
              <v-row>
                <v-col
                  cols="12"
                  sm="6"
                >
                  <v-text-field
                    v-model="outTls.client_certificate_path"
                    hide-details
                    :label="$t('tls.clientCertPath')"
                  />
                </v-col>
                <v-col
                  cols="12"
                  sm="6"
                >
                  <v-text-field
                    v-model="outTls.client_key_path"
                    hide-details
                    :label="$t('tls.clientKeyPath')"
                  />
                </v-col>
              </v-row>
            </template>
            <template v-else>
              <v-row>
                <v-col cols="12">
                  <v-textarea
                    v-model="clientCertText"
                    hide-details
                    :label="$t('tls.clientCert')"
                  />
                </v-col>
                <v-col cols="12">
                  <v-textarea
                    v-model="clientKeyText"
                    hide-details
                    :label="$t('tls.clientKey')"
                  />
                </v-col>
              </v-row>
            </template>

            <v-row>
              <v-col cols="12">
                <v-combobox
                  v-model="inTls.client_certificate_public_key_sha256"
                  hide-details
                  :label="$t('tls.clientPin')"
                  multiple
                  chips
                  closable-chips
                  clearable
                  @click:clear="inTls.client_certificate_public_key_sha256 = undefined"
                />
              </v-col>
            </v-row>
          </template>
          <v-row v-if="outTls.utls != undefined">
            <v-col
              cols="12"
              sm="6"
              md="4"
            >
              <v-select
                v-model="outTls.utls.fingerprint"
                hide-details
                label="Fingerprint"
                :items="fingerprints"
              />
            </v-col>
          </v-row>
          <!-- Client side only, and refused by reality, so it is offered for
               plain TLS alone. The forged hostname has to differ from the SNI
               above for sing-box to accept it. -->
          <v-row v-if="tlsType == 0 && outTls.spoof != undefined">
            <v-col
              cols="12"
              sm="6"
              md="4"
            >
              <v-text-field
                v-model="spoof"
                hide-details
                :label="$t('tls.spoof')"
                placeholder="allowed.example.com"
              />
            </v-col>
            <v-col
              v-if="outTls.spoof"
              cols="12"
              sm="6"
              md="4"
            >
              <v-select
                v-model="outTls.spoof_method"
                hide-details
                :label="$t('tls.spoofMethod')"
                :items="spoofMethods"
              />
            </v-col>
          </v-row>
          <v-card-actions>
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
                  <template v-if="tlsType == 0">
                    <v-list-item>
                      <v-switch
                        v-model="optionSNI"
                        color="primary"
                        label="SNI"
                        hide-details
                      />
                    </v-list-item>
                    <v-list-item>
                      <v-switch
                        v-model="optionALPN"
                        color="primary"
                        label="ALPN"
                        hide-details
                      />
                    </v-list-item>
                    <v-list-item>
                      <v-switch
                        v-model="optionMinV"
                        color="primary"
                        :label="$t('tls.minVer')"
                        hide-details
                      />
                    </v-list-item>
                    <v-list-item>
                      <v-switch
                        v-model="optionMaxV"
                        color="primary"
                        :label="$t('tls.maxVer')"
                        hide-details
                      />
                    </v-list-item>
                    <v-list-item>
                      <v-switch
                        v-model="optionCS"
                        color="primary"
                        :label="$t('tls.cs')"
                        hide-details
                      />
                    </v-list-item>
                    <v-list-item>
                      <v-switch
                        v-model="optionFP"
                        color="primary"
                        label="UTLS"
                        hide-details
                      />
                    </v-list-item>
                    <v-list-item>
                      <v-switch
                        v-model="optionClientAuth"
                        color="primary"
                        :label="$t('tls.mutual')"
                        hide-details
                      />
                    </v-list-item>
                    <v-list-item>
                      <v-switch
                        v-model="optionStore"
                        color="primary"
                        :label="$t('tls.store')"
                        hide-details
                      />
                    </v-list-item>
                    <v-list-item>
                      <v-switch
                        v-model="optionKtls"
                        color="primary"
                        :label="$t('tls.ktls')"
                        hide-details
                      />
                    </v-list-item>
                    <v-list-item>
                      <v-switch
                        v-model="optionSpoof"
                        color="primary"
                        :label="$t('tls.spoof')"
                        hide-details
                      />
                    </v-list-item>
                  </template>
                  <template v-else>
                    <v-list-item>
                      <v-switch
                        v-model="optionTime"
                        color="primary"
                        label="Max Time Difference"
                        hide-details
                      />
                    </v-list-item>
                  </template>
                  <v-list-item>
                    <v-switch
                      v-model="optionHandshake"
                      color="primary"
                      :label="$t('tls.handshakeTimeout')"
                      hide-details
                    />
                  </v-list-item>
                </v-list>
              </v-card>
            </v-menu>
          </v-card-actions>
        </v-card>
        <EchVue
          :i-tls="inTls"
          :o-tls="outTls"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          color="primary"
          variant="outlined"
          @click="closeModal"
        >
          {{ $t('actions.close') }}
        </v-btn>
        <v-btn
          color="primary"
          variant="tonal"
          :loading="loading"
          @click="saveChanges"
        >
          {{ $t('actions.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { tls, iTls, defaultInTls, oTls, defaultOutTls, spoofMethods } from '@/types/tls'
import DocLink from '@/components/DocLink.vue'
import EchVue from '@/components/tls/Ech.vue'
import HttpUtils from '@/plugins/httputil'
import { push } from 'notivue'
import { i18n } from '@/locales'
import RandomUtil from '@/plugins/randomUtil'
import type { PropType } from 'vue'
export default {
  components: { DocLink, EchVue },
  props: {
    visible: { type: Boolean, required: true },
    data: { type: String, required: true },
    id: { type: Number, required: true },
    providers: { type: Array as PropType<string[]>, required: true },
  },
  emits: ['close', 'save'],
  data() {
    return {
      tls: <tls>{ id: 0, name: '', server: <iTls>{ enabled: true }, client: <oTls>{} },
      title: "add",
      loading: false,
      menu: false,
      tlsType: 0,
      usePath: 0,
      alpn: [
        { title: "H3", value: 'h3' },
        { title: "H2", value: 'h2' },
        { title: "Http/1.1", value: 'http/1.1' },
      ],
      tlsVersions: [ '1.0', '1.1', '1.2', '1.3' ],
      cipher_suites: [
        { title: "RSA-AES128-CBC-SHA", value: "TLS_RSA_WITH_AES_128_CBC_SHA" },
        { title: "RSA-AES256-CBC-SHA", value: "TLS_RSA_WITH_AES_256_CBC_SHA" },
        { title: "RSA-AES128-GCM-SHA256", value: "TLS_RSA_WITH_AES_128_GCM_SHA256" },
        { title: "RSA-AES256-GCM-SHA384", value: "TLS_RSA_WITH_AES_256_GCM_SHA384" },
        { title: "AES128-GCM-SHA256", value: "TLS_AES_128_GCM_SHA256" },
        { title: "AES256-GCM-SHA384", value: "TLS_AES_256_GCM_SHA384" },
        { title: "CHACHA20-POLY1305-SHA256", value: "TLS_CHACHA20_POLY1305_SHA256" },
        { title: "ECDHE-ECDSA-AES128-CBC-SHA", value: "TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA" },
        { title: "ECDHE-ECDSA-AES256-CBC-SHA", value: "TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA" },
        { title: "ECDHE-RSA-AES128-CBC-SHA", value: "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA" },
        { title: "ECDHE-RSA-AES256-CBC-SHA", value: "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA" },
        { title: "ECDHE-ECDSA-AES128-GCM-SHA256", value: "TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256" },
        { title: "ECDHE-ECDSA-AES256-GCM-SHA384", value: "TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384" },
        { title: "ECDHE-RSA-AES128-GCM-SHA256", value: "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256" },
        { title: "ECDHE-RSA-AES256-GCM-SHA384", value: "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384" },
        { title: "ECDHE-ECDSA-CHACHA20-POLY1305-SHA256", value: "TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256" },
        { title: "ECDHE-RSA-CHACHA20-POLY1305-SHA256", value: "TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256" }
      ],
      storeItems: [
        { title: "Mozilla", value: "mozilla" },
        { title: "Chrome", value: "chrome" },
      ],
      useClientPath: 0,
      clientAuthTypes: [
        { title: "No", value: "no" },
        { title: "Request", value: "request" },
        { title: "Require Any", value: "require-any" },
        { title: "Verify If Given", value: "verify-if-given" },
        { title: "Require And Verify", value: "require-and-verify" },
      ],
      spoofMethods,
      fingerprints: [
        { title: "Chrome", value: "chrome" },
        { title: "Firefox", value: "firefox" },
        { title: "Microsoft Edge", value: "edge" },
        { title: "Apple Safari", value: "safari" },
        { title: "360", value: "360" },
        { title: "QQ", value: "qq" },
        { title: "Apple IOS", value: "ios" },
        { title: "Android", value: "android" },
        { title: "Random", value: "random" },
        { title: "Randomized", value: "randomized" },
      ]
    }
  },
  computed: {
    providerTags(): string[] {
      return <string[]>(this.$props.providers ?? [])
    },
    inTls(): iTls {
      return this.tls.server
    },
    outTls(): oTls {
      return this.tls.client
    },
    clientCaText: {
      get(): string { return this.inTls.client_certificate ? this.inTls.client_certificate.join('\n') : '' },
      set(v: string) { this.inTls.client_certificate = v ? v.split('\n') : undefined }
    },
    clientCertText: {
      get(): string { return this.outTls.client_certificate ? this.outTls.client_certificate.join('\n') : '' },
      set(v: string) { this.outTls.client_certificate = v ? v.split('\n') : undefined }
    },
    clientKeyText: {
      get(): string { return this.outTls.client_key ? this.outTls.client_key.join('\n') : '' },
      set(v: string) { this.outTls.client_key = v ? v.split('\n') : undefined }
    },
    certText: {
      get(): string { return this.inTls.certificate ? this.inTls.certificate.join('\n') : '' },
      set(v:string) { this.inTls.certificate = v.split('\n') }
    },
    keyText: {
      get(): string { return this.inTls.key ? this.inTls.key.join('\n') : '' },
      set(v:string) { this.inTls.key = v.split('\n') }
    },
    disableSni: {
      get() { return this.outTls.disable_sni ?? false },
      set(v: boolean) { this.tls.client.disable_sni = v ? true : undefined }
    },
    insecure: {
      get() { return this.outTls.insecure ?? false },
      set(v: boolean) { this.tls.client.insecure = v ? true : undefined }
    },
    server_port: {
      get() { return this.inTls.reality?.handshake?.server_port ? this.inTls.reality.handshake.server_port : 443 },
      // The field is a plain v-model on a number input, so it arrives as a
      // string; a programmatic set may still hand over a number.
      set(v: string | number) {
        if (this.inTls.reality){
          const s = String(v)
          this.inTls.reality.handshake.server_port = s.length == 0 || Number(s) == 0 ? 443 : parseInt(s)
        }
      }
    },
    short_id: {
      get() { return this.inTls.reality?.short_id ? this.inTls.reality.short_id.join(',') : undefined },
      set(v: string) {
        if (this.inTls.reality){
          this.inTls.reality.short_id = v.length > 0 ? v.split(',') : []
        }
      }
    },
    max_time: {
      get() { return this.inTls?.reality?.max_time_difference ? this.inTls.reality.max_time_difference.replace('m','') : 1 },
      set(v: number) {
        if (this.inTls.reality){
          this.inTls.reality.max_time_difference = v > 0 ? v + 'm' : '1m'
        }
      }
    },
    optionClientAuth: {
      get(): boolean {
        return this.inTls.client_certificate_path != undefined
          || this.inTls.client_certificate != undefined
      },
      set(v: boolean) {
        if (v) {
          this.switchClientTls(true)
        } else {
          this.inTls.client_authentication = undefined
          this.inTls.client_certificate_path = undefined
          this.inTls.client_certificate = undefined
          this.outTls.client_certificate_path = undefined
          this.outTls.client_key_path = undefined
          this.outTls.client_certificate = undefined
          this.outTls.client_key = undefined
          this.inTls.client_certificate_public_key_sha256 = undefined
        }
      }
    },
    optionSNI: {
      get(): boolean { return this.inTls.server_name != undefined },
      set(v:boolean) { this.inTls.server_name = v ? '' : undefined }
    },
    optionALPN: {
      get(): boolean { return this.inTls.alpn != undefined },
      set(v:boolean) { this.inTls.alpn = v ? defaultInTls.alpn : undefined }
    },
    optionMinV: {
      get(): boolean { return this.inTls.min_version != undefined },
      set(v:boolean) { this.inTls.min_version = v ? defaultInTls.min_version : undefined }
    },
    optionMaxV: {
      get(): boolean { return this.inTls.max_version != undefined },
      set(v:boolean) { this.inTls.max_version = v ? defaultInTls.max_version : undefined }
    },
    optionCS: {
      get(): boolean { return this.inTls.cipher_suites != undefined },
      set(v:boolean) { this.inTls.cipher_suites = v ? defaultInTls.cipher_suites : undefined }
    },
    optionFP: {
      get(): boolean { return this.outTls.utls != undefined },
      set(v:boolean) { this.outTls.utls = v ? defaultOutTls.utls : undefined }
    },
    // Written on the server side alone; out_json hands the same value to the
    // client, as it does for the versions and cipher suites.
    handshakeTimeout: {
      get(): number { return parseInt(this.inTls.handshake_timeout?.replace('s', '') ?? '15') || 15 },
      set(v: number) { this.inTls.handshake_timeout = v > 0 ? `${v}s` : '15s' }
    },
    optionHandshake: {
      get(): boolean { return this.inTls.handshake_timeout != undefined },
      set(v: boolean) { this.inTls.handshake_timeout = v ? '15s' : undefined }
    },
    // sing-box refuses spoof_method on its own, so the method only exists
    // while a forged hostname is given.
    spoof: {
      get(): string { return this.outTls.spoof ?? '' },
      set(v: string) {
        this.outTls.spoof = v
        this.outTls.spoof_method = v.length > 0 ? (this.outTls.spoof_method ?? 'wrong-sequence') : undefined
      }
    },
    optionSpoof: {
      get(): boolean { return this.outTls.spoof != undefined },
      set(v: boolean) {
        if (v) {
          this.outTls.spoof = ''
        } else {
          this.outTls.spoof = undefined
          this.outTls.spoof_method = undefined
        }
      }
    },
    optionStore: {
      get(): boolean { return this.inTls.store != undefined },
      set(v:boolean) { this.inTls.store = v ? 'mozilla' : undefined }
    },
    optionKtls: {
      get(): boolean { return this.inTls.kernel_tx != undefined || this.inTls.kernel_rx != undefined },
      set(v:boolean) {
        if (v) {
          this.inTls.kernel_tx = false
          this.inTls.kernel_rx = false
        } else {
          delete this.inTls.kernel_tx
          delete this.inTls.kernel_rx
        }
      }
    },
    optionEch: {
      get(): boolean { return this.outTls.ech != undefined },
      set(v:boolean) { this.outTls.ech = v ? defaultOutTls.ech : undefined }
    },
    optionTime: {
      get(): boolean { return this.inTls?.reality?.max_time_difference != undefined },
      set(v:boolean) { if (this.inTls.reality) this.inTls.reality.max_time_difference = v ? "1m" : undefined }
    }
  },
  watch: {
    visible(v) {
      if (v) {
        this.updateData(this.$props.id)
      }
    },
  },
  methods: {
    switchClientTls(isPath: boolean) {
      if (isPath) {
        this.inTls.client_certificate = undefined
        this.outTls.client_certificate = undefined
        this.outTls.client_key = undefined
        this.inTls.client_certificate_path = []
        this.outTls.client_certificate_path = ''
        this.outTls.client_key_path = ''
      } else {
        this.inTls.client_certificate_path = undefined
        this.outTls.client_certificate_path = undefined
        this.outTls.client_key_path = undefined
        this.inTls.client_certificate = []
        this.outTls.client_certificate = []
        this.outTls.client_key = []
      }
    },
    updateData(id: number) {
      if (id > 0) {
        const newData = <tls>JSON.parse(this.$props.data)
        this.tls = newData
        if (this.tls.server == null) this.tls.server = { enabled: true }
        if (this.tls.client == null) this.tls.client = {}
        this.tlsType = newData.server?.reality == undefined ? 0 : 1
        this.usePath = newData.server?.key == undefined ? 0 : 1
        // A stored config that carries the certificates inline should open on
        // the text side of the toggle.
        this.useClientPath = (newData.server?.client_certificate == undefined
          && newData.client?.client_certificate == undefined
          && newData.client?.client_key == undefined) ? 0 : 1
        this.title = "edit"
      }
      else {
        this.tls = <tls>{ id: 0, name: '', server: {enabled: true}, client: {} }
        this.tlsType = 0
        this.usePath = 0
        this.useClientPath = 0
        this.title = "add"
      }
    },
    changeTlsType(){
      if (this.tlsType) {
        this.tls.server = <iTls>{
          enabled: true,
          reality: { enabled: true, handshake: { server_port: 443 }, short_id: RandomUtil.randomShortId() },
          server_name: ""
        }
        this.tls.client = <oTls>{ reality: { public_key: "" }, utls: defaultOutTls.utls }
      } else {
        this.tls.server = <iTls>{ enabled: true }
        this.tls.client = <oTls>{}
      }
    },
    closeModal() {
      this.updateData(0) // reset
      this.$emit('close')
    },
    saveChanges() {
      this.loading = true
      this.$emit('save', this.tls)
      this.loading = false
    },
    async genSelfSigned(){
      this.loading = true
      const msg = await HttpUtils.get<string[]>('api/keypairs', { k: "tls", o: this.inTls.server_name?? "''" })
      this.loading = false
      if (msg.success) {
        this.inTls.key_path=undefined
        this.inTls.certificate_path=undefined
        this.usePath = 1
        if (msg.obj.length>0){
          let privateKey = <string[]>[]
          let publicKey = <string[]>[]
          let isPrivateKey = false
          let isPublicKey = false

          msg.obj.forEach((line:string) => {
              if (line === "-----BEGIN PRIVATE KEY-----") {
                  isPrivateKey = true
                  isPublicKey = false
                  privateKey.push(line)
              } else if (line === "-----END PRIVATE KEY-----") {
                  isPrivateKey = false
                  privateKey.push(line)
              } else if (line === "-----BEGIN CERTIFICATE-----") {
                  isPublicKey = true
                  isPrivateKey = false
                  publicKey.push(line)
              } else if (line === "-----END CERTIFICATE-----") {
                  isPublicKey = false
                  publicKey.push(line)
              } else if (isPrivateKey) {
                  privateKey.push(line)
              } else if (isPublicKey) {
                  publicKey.push(line)
              }
          })
          this.inTls.key = privateKey?? undefined
          this.inTls.certificate = publicKey?? undefined

        } else {
          push.error({
            message: i18n.global.t('error') + ": " + msg.obj
          })
        }
      }
    },
    async genRealityKey(){
      this.loading = true
      const msg = await HttpUtils.get<string[]>('api/keypairs', { k: "reality" })
      this.loading = false
      if (msg.success) {
        msg.obj.forEach((line:string) => {
          if (this.inTls.reality && this.outTls.reality){
            if (line.startsWith("PrivateKey")){
              this.inTls.reality.private_key = line.substring(12)
            }
            if (line.startsWith("PublicKey")){
              this.outTls.reality.public_key = line.substring(11)
            }
          }
        })
      } else {
        push.error({
          message: i18n.global.t('error') + ": " + msg.obj
        })
      }
    },
    randomSID(){
      this.short_id = RandomUtil.randomShortId().join(',')
    }
  }
}
</script>