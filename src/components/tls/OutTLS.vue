<template>
  <v-card :subtitle="$t('objects.tls')">
    <v-row v-if="tlsOptional">
      <v-col cols="12" sm="6" md="4">
        <v-switch color="primary" :label="$t('tls.enable')" v-model="tlsEnable" hide-details></v-switch>
      </v-col>
    </v-row>
    <template v-if="tls.enabled">
      <v-row>
        <v-col cols="12" sm="6" md="4">
          <v-switch color="primary" :label="$t('tls.disableSni')" v-model="disable_sni" hide-details></v-switch>
        </v-col>
        <v-col cols="12" sm="6" md="4">
          <v-switch color="primary" :label="$t('tls.insecure')" v-model="insecure" hide-details></v-switch>
        </v-col>
      </v-row>
      <v-row v-if="insecure">
        <v-col cols="12" sm="8">
          <v-text-field
            label="Base64 Pin SHA256 Fingerprint"
            :loading="loading"
            hide-details
            v-model="pin_sha256">
            <template v-slot:append>
              <v-icon-btn @click="pingCert()" :loading="loading" icon="mdi-refresh" />
            </template>
          </v-text-field>
        </v-col>
      </v-row>
      <template v-if="optionCert">
        <v-row>
          <v-col cols="auto">
            <v-btn-toggle v-model="usePath"
            class="rounded-xl"
            density="compact"
            variant="outlined"
            shaped
            mandatory>
              <v-btn
                @click="tls.certificate=undefined; tls.certificate_path=''"
              >{{ $t('tls.usePath') }}</v-btn>
              <v-btn
                @click="tls.certificate_path=undefined; tls.certificate=''"
              >{{ $t('tls.useText') }}</v-btn>
            </v-btn-toggle>
          </v-col>
        </v-row>
        <v-row v-if="usePath == 0">
          <v-col cols="12" sm="6">
            <v-text-field
              :label="$t('tls.certPath')"
              hide-details
              v-model="tls.certificate_path">
            </v-text-field>
          </v-col>
        </v-row>
        <v-row v-else>
          <v-col cols="12" sm="6">
            <v-textarea
              :label="$t('tls.cert')"
              hide-details
              v-model="tls.certificate">
            </v-textarea>
          </v-col>
        </v-row>
      </template>
      <v-row>
        <v-col cols="12" sm="6" md="4" v-if="tls.server_name != undefined">
          <v-text-field
            label="SNI"
            hide-details
            v-model="tls.server_name">
          </v-text-field>
        </v-col>
        <v-col cols="12" sm="6" md="4" v-if="tls.alpn">
          <v-select
            hide-details
            label="ALPN"
            multiple
            :items="alpn"
            v-model="tls.alpn">
          </v-select>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12" sm="6" md="4" v-if="tls.min_version">
          <v-select
            hide-details
            :label="$t('tls.minVer')"
            :items="tlsVersions"
            v-model="tls.min_version">
          </v-select>
        </v-col>
        <v-col cols="12" sm="6" md="4" v-if="tls.max_version">
          <v-select
            hide-details
            :label="$t('tls.maxVer')"
            :items="tlsVersions"
            v-model="tls.max_version">
          </v-select>
        </v-col>
      </v-row>
      <v-row v-if="tls.cipher_suites != undefined">
        <v-col cols="12" md="8">
          <v-select
            hide-details
            :label="$t('tls.cs')"
            multiple
            :items="cipher_suites"
            v-model="tls.cipher_suites">
          </v-select>
        </v-col>
      </v-row>
      <v-row v-if="tls.utls != undefined">
        <v-col cols="12" md="6">
          <v-select
            hide-details
            label="Fingerprint"
            :items="fingerprints"
            v-model="tls.utls.fingerprint">
          </v-select>
        </v-col>
      </v-row>
      <v-row v-if="tls.reality != undefined">
        <v-col cols="12" md="6">
          <v-text-field
          :label="$t('tls.pubKey')"
            hide-details
            v-model="tls.reality.public_key">
          </v-text-field>
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field
            label="Short ID"
            hide-details
            v-model="tls.reality.short_id">
          </v-text-field>
        </v-col>
      </v-row>
      <template v-if="tls.ech != undefined">
        <v-row>
          <v-col class="v-card-subtitle">ECH</v-col>
        </v-row>
        <v-row>
          <v-col cols="auto">
            <v-btn-toggle v-model="useEchPath"
            class="rounded-xl"
            density="compact"
            variant="outlined"
            shaped
            mandatory>
              <v-btn
                @click="delete tls.ech?.config"
              >{{ $t('tls.usePath') }}</v-btn>
              <v-btn
                @click="delete tls.ech?.config_path"
              >{{ $t('tls.useText') }}</v-btn>
            </v-btn-toggle>
          </v-col>
        </v-row>
        <v-row v-if="useEchPath == 0">
          <v-col cols="12" sm="6">
            <v-text-field
              :label="$t('tls.certPath')"
              hide-details
              v-model="tls.ech.config_path">
            </v-text-field>
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              :label="$t('tls.queryServerName')"
              hide-details
              v-model="tls.ech.query_server_name"
              placeholder="ech.example.com">
            </v-text-field>
          </v-col>
        </v-row>
        <v-row v-else>
          <v-col cols="12" sm="6">
            <v-textarea
              :label="$t('tls.cert')"
              hide-details
              v-model="echConfigText">
            </v-textarea>
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              :label="$t('tls.queryServerName')"
              hide-details
              v-model="tls.ech.query_server_name"
              placeholder="ech.example.com">
            </v-text-field>
          </v-col>
        </v-row>
      </template>
      <v-row v-if="tls.handshake_timeout != undefined">
        <v-col cols="12" sm="6" md="4">
          <v-text-field
            :label="$t('tls.handshakeTimeout')"
            type="number"
            min="1"
            :suffix="$t('date.s')"
            hide-details
            v-model.number="handshakeTimeout">
          </v-text-field>
        </v-col>
      </v-row>
      <!-- Refused by reality, so it is offered only for plain TLS. The forged
           hostname has to differ from the SNI, which must be set. -->
      <v-row v-if="tls.reality == undefined && tls.spoof != undefined">
        <v-col cols="12" sm="6" md="4">
          <v-text-field
            :label="$t('tls.spoof')"
            placeholder="allowed.example.com"
            hide-details
            v-model="spoof">
          </v-text-field>
        </v-col>
        <v-col cols="12" sm="6" md="4" v-if="tls.spoof">
          <v-select
            hide-details
            :label="$t('tls.spoofMethod')"
            :items="spoofMethods"
            v-model="tls.spoof_method">
          </v-select>
        </v-col>
      </v-row>
      <v-row v-if="tls.fragment != undefined">
        <v-col cols="12" sm="6" md="4">
          <v-switch color="primary" :label="$t('tls.fragment')" v-model="tls.fragment" hide-details></v-switch>
        </v-col>
        <v-col cols="12" sm="6" md="4" v-if="tls.fragment">
          <v-switch color="primary" :label="$t('tls.recordFragment')" v-model="tls.record_fragment" hide-details></v-switch>
        </v-col>
        <v-col cols="12" sm="6" md="4" v-if="tls.fragment">
          <v-text-field
          :label="$t('tls.fragmentDelay')"
          hide-details
          type="number"
          min=0
          :suffix="$t('date.ms')"
          v-model.number="fragmentFallbackDelay">
          </v-text-field>
        </v-col>
      </v-row>
    </template>
    <v-card-actions v-if="tls.enabled">
      <v-spacer></v-spacer>
      <v-menu v-model="menu" :close-on-content-click="false" location="start">
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" hide-details variant="tonal">{{ $t('tls.options') }}</v-btn>
          </template>
          <v-card>
            <v-list>
              <v-list-item>
                <v-switch v-model="optionCert" color="primary" :label="$t('tls.cert')" hide-details></v-switch>
              </v-list-item>
              <v-list-item>
                <v-switch v-model="optionSNI" color="primary" label="SNI" hide-details></v-switch>
              </v-list-item>
              <v-list-item>
                <v-switch v-model="optionALPN" color="primary" label="ALPN" hide-details></v-switch>
              </v-list-item>
              <v-list-item>
                <v-switch v-model="optionMinV" color="primary" :label="$t('tls.minVer')" hide-details></v-switch>
              </v-list-item>
              <v-list-item>
                <v-switch v-model="optionMaxV" color="primary" :label="$t('tls.maxVer')" hide-details></v-switch>
              </v-list-item>
              <v-list-item>
                <v-switch v-model="optionCS" color="primary" :label="$t('tls.cs')" hide-details></v-switch>
              </v-list-item>
              <v-list-item>
                <v-switch v-model="optionFP" color="primary" label="UTLS" hide-details></v-switch>
              </v-list-item>
              <v-list-item>
                <v-switch v-model="optionReality" color="primary" label="Reality" hide-details></v-switch>
              </v-list-item>
              <v-list-item>
                <v-switch v-model="optionEch" color="primary" label="ECH" hide-details></v-switch>
              </v-list-item>
              <v-list-item>
                <v-switch v-model="optionFragment" color="primary" :label="$t('tls.fragment')" hide-details></v-switch>
              </v-list-item>
              <v-list-item>
                <v-switch v-model="optionHandshake" color="primary" :label="$t('tls.handshakeTimeout')" hide-details></v-switch>
              </v-list-item>
              <v-list-item v-if="tls.reality == undefined">
                <v-switch v-model="optionSpoof" color="primary" :label="$t('tls.spoof')" hide-details></v-switch>
              </v-list-item>
            </v-list>
          </v-card>
        </v-menu>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import HttpUtils from '@/plugins/httputil';
import { oTls, defaultOutTls, spoofMethods } from '@/types/tls'
export default {
  props: ['outbound'],
  data() {
    return {
      menu: false,
      usePath: this.$props.outbound?.tls?.certificate? 1:0,
      useEchPath: this.$props.outbound?.tls.ech?.config? 1:0,
      defaults: defaultOutTls,
      alpn: [
        { title: "H3", value: 'h3' },
        { title: "H2", value: 'h2' },
        { title: "Http/1.1", value: 'http/1.1' },
      ],
      tlsVersions: [ '1.0', '1.1', '1.2', '1.3' ],
      spoofMethods,
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
      ],
      loading: false
    }
  },
  methods: {
    async pingCert() {
      this.loading = true
      const msg = await HttpUtils.post('api/getCertPing', {
        domain: this.$props.outbound.server,
        port: this.$props.outbound.server_port,
      })
      this.loading = false
      if (msg.success) {
        this.pin_sha256 = msg.obj.leafHash
      }
    }
  },
  computed: {
    tls(): oTls {
      return <oTls> this.$props.outbound.tls
    },
    tlsEnable: {
      get() { return Object.hasOwn(this.tls, 'enabled') ? this.tls.enabled : false },
      set(newValue: boolean) { this.$props.outbound.tls = newValue ? { enabled: true } : { enabled: false } }
    },
    disable_sni: {
      get() { return this.tls.disable_sni ?? false },
      set(newValue: boolean) { this.$props.outbound.tls.disable_sni = newValue ? true : undefined }
    },
    insecure: {
      get() { return this.tls.insecure ?? false },
      set(newValue: boolean) { this.$props.outbound.tls.insecure = newValue ? true : undefined }
    },
    tlsOptional(): boolean {
      return !['hysteria','hysteria2','tuic','shadowtls', 'anytls', 'naive'].includes(this.$props.outbound.type)
    },
    echConfigText: {
      get(): string { return this.tls.ech?.config ? this.tls.ech.config.join('\n') : '' },
      set(newValue:string) { if (this.tls.ech) this.tls.ech.config = newValue.split('\n') }
    },
    optionCert: {
      get(): boolean { return this.tls.certificate != undefined || this.tls.certificate_path != undefined },
      set(v:boolean) {
        this.usePath = 0
        if (v) {
          this.$props.outbound.tls.certificate_path = ""
        } else {
          delete this.$props.outbound.tls.certificate_path
          delete this.$props.outbound.tls.certificate
        }
      }
    },
    optionSNI: {
      get(): boolean { return this.tls.server_name != undefined },
      set(v:boolean) { this.$props.outbound.tls.server_name = v ? '' : undefined }
    },
    optionALPN: {
      get(): boolean { return this.tls.alpn != undefined },
      set(v:boolean) { this.$props.outbound.tls.alpn = v ? defaultOutTls.alpn : undefined }
    },
    optionMinV: {
      get(): boolean { return this.tls.min_version != undefined },
      set(v:boolean) { this.$props.outbound.tls.min_version = v ? defaultOutTls.min_version : undefined }
    },
    optionMaxV: {
      get(): boolean { return this.tls.max_version != undefined },
      set(v:boolean) { this.$props.outbound.tls.max_version = v ? defaultOutTls.max_version : undefined }
    },
    optionCS: {
      get(): boolean { return this.tls.cipher_suites != undefined },
      set(v:boolean) { this.$props.outbound.tls.cipher_suites = v ? defaultOutTls.cipher_suites : undefined }
    },
    optionFP: {
      get(): boolean { return this.tls.utls != undefined },
      set(v:boolean) { this.$props.outbound.tls.utls = v ? defaultOutTls.utls : undefined }
    },
    optionReality: {
      get(): boolean { return this.tls.reality != undefined },
      set(v:boolean) {
        this.$props.outbound.tls.reality = v ? defaultOutTls.reality : undefined
        // reality rejects a spoofed ClientHello, so the two cannot coexist.
        if (v) this.optionSpoof = false
      }
    },
    handshakeTimeout: {
      get(): number { return parseInt(this.tls.handshake_timeout?.replace('s', '') ?? '15') || 15 },
      set(v:number) { this.$props.outbound.tls.handshake_timeout = v > 0 ? `${v}s` : '15s' }
    },
    optionHandshake: {
      get(): boolean { return this.tls.handshake_timeout != undefined },
      set(v:boolean) {
        if (v) {
          this.$props.outbound.tls.handshake_timeout = '15s'
        } else {
          delete this.$props.outbound.tls.handshake_timeout
        }
      }
    },
    // sing-box refuses spoof_method on its own, so the method only exists
    // while a forged hostname is given.
    spoof: {
      get(): string { return this.tls.spoof ?? '' },
      set(v:string) {
        this.$props.outbound.tls.spoof = v
        if (v.length > 0) {
          this.$props.outbound.tls.spoof_method = this.tls.spoof_method ?? 'wrong-sequence'
        } else {
          delete this.$props.outbound.tls.spoof_method
        }
      }
    },
    optionSpoof: {
      get(): boolean { return this.tls.spoof != undefined },
      set(v:boolean) {
        if (v) {
          this.$props.outbound.tls.spoof = ''
        } else {
          delete this.$props.outbound.tls.spoof
          delete this.$props.outbound.tls.spoof_method
        }
      }
    },
    optionEch: {
      get(): boolean { return this.tls.ech != undefined },
      set(v:boolean) { this.$props.outbound.tls.ech = v ? defaultOutTls.ech : undefined }
    },
    optionFragment: {
      get(): boolean { return this.tls.fragment != undefined },
      set(v:boolean) { 
        if (v) {
          this.$props.outbound.tls.fragment = false
        } else {
          delete this.$props.outbound.tls.fragment
          delete this.$props.outbound.tls.fragment_fallback_delay
          delete this.$props.outbound.tls.record_fragment
        }
      }
    },
    fragmentFallbackDelay: {
      get(): number { return parseInt(this.tls.fragment_fallback_delay?.replace('ms','')?? '500')?? 500 },
      set(v:number) { this.$props.outbound.tls.fragment_fallback_delay = v>0 ? `${v}ms` : undefined }
    },
    pin_sha256: {
      get(): string { return this.tls.certificate_public_key_sha256?.join(',') ?? '' },
      set(v: string) { this.$props.outbound.tls.certificate_public_key_sha256 = v.length > 0 ? v.split(',') : undefined }
    }
  }
}
</script>