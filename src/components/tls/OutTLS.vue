<template>
  <v-card :subtitle="$t('objects.tls')">
    <v-row v-if="tlsOptional">
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-switch
          v-model="tlsEnable"
          color="primary"
          :label="$t('tls.enable')"
          hide-details
        />
      </v-col>
    </v-row>
    <template v-if="tls.enabled">
      <v-row>
        <v-col
          cols="12"
          sm="6"
          md="4"
        >
          <v-switch
            v-model="disable_sni"
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
      <v-row v-if="insecure">
        <v-col
          cols="12"
          sm="8"
        >
          <v-text-field
            v-model="pin_sha256"
            label="Base64 Pin SHA256 Fingerprint"
            :loading="loading"
            hide-details
          >
            <template #append>
              <v-icon-btn
                :loading="loading"
                icon="mdi-refresh"
                @click="pingCert()"
              />
            </template>
          </v-text-field>
        </v-col>
      </v-row>
      <template v-if="optionCert">
        <v-row>
          <v-col cols="auto">
            <v-btn-toggle
              v-model="usePath"
              class="rounded-xl"
              density="compact"
              variant="outlined"
              shaped
              mandatory
            >
              <v-btn
                @click="tls.certificate=undefined; tls.certificate_path=''"
              >
                {{ $t('tls.usePath') }}
              </v-btn>
              <v-btn
                @click="tls.certificate_path=undefined; tls.certificate=''"
              >
                {{ $t('tls.useText') }}
              </v-btn>
            </v-btn-toggle>
          </v-col>
        </v-row>
        <v-row v-if="usePath == 0">
          <v-col
            cols="12"
            sm="6"
          >
            <v-text-field
              v-model="tls.certificate_path"
              :label="$t('tls.certPath')"
              hide-details
            />
          </v-col>
        </v-row>
        <v-row v-else>
          <v-col
            cols="12"
            sm="6"
          >
            <v-textarea
              v-model="tls.certificate"
              :label="$t('tls.cert')"
              hide-details
            />
          </v-col>
        </v-row>
      </template>
      <v-row>
        <v-col
          v-if="tls.server_name != undefined"
          cols="12"
          sm="6"
          md="4"
        >
          <v-text-field
            v-model="tls.server_name"
            label="SNI"
            hide-details
          />
        </v-col>
        <v-col
          v-if="tls.alpn"
          cols="12"
          sm="6"
          md="4"
        >
          <v-select
            v-model="tls.alpn"
            hide-details
            label="ALPN"
            multiple
            :items="alpn"
          />
        </v-col>
      </v-row>
      <v-row>
        <v-col
          v-if="tls.min_version"
          cols="12"
          sm="6"
          md="4"
        >
          <v-select
            v-model="tls.min_version"
            hide-details
            :label="$t('tls.minVer')"
            :items="tlsVersions"
          />
        </v-col>
        <v-col
          v-if="tls.max_version"
          cols="12"
          sm="6"
          md="4"
        >
          <v-select
            v-model="tls.max_version"
            hide-details
            :label="$t('tls.maxVer')"
            :items="tlsVersions"
          />
        </v-col>
      </v-row>
      <v-row v-if="tls.cipher_suites != undefined">
        <v-col
          cols="12"
          md="8"
        >
          <v-select
            v-model="tls.cipher_suites"
            hide-details
            :label="$t('tls.cs')"
            multiple
            :items="cipher_suites"
          />
        </v-col>
      </v-row>
      <v-row v-if="tls.utls != undefined">
        <v-col
          cols="12"
          md="6"
        >
          <v-select
            v-model="tls.utls.fingerprint"
            hide-details
            label="Fingerprint"
            :items="fingerprints"
          />
        </v-col>
      </v-row>
      <v-row v-if="tls.reality != undefined">
        <v-col
          cols="12"
          md="6"
        >
          <v-text-field
            v-model="tls.reality.public_key"
            :label="$t('tls.pubKey')"
            hide-details
          />
        </v-col>
        <v-col
          cols="12"
          md="4"
        >
          <v-text-field
            v-model="tls.reality.short_id"
            label="Short ID"
            hide-details
          />
        </v-col>
      </v-row>
      <template v-if="tls.ech != undefined">
        <v-row>
          <v-col class="v-card-subtitle">
            ECH
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="auto">
            <v-btn-toggle
              v-model="useEchPath"
              class="rounded-xl"
              density="compact"
              variant="outlined"
              shaped
              mandatory
            >
              <v-btn
                @click="delete tls.ech?.config"
              >
                {{ $t('tls.usePath') }}
              </v-btn>
              <v-btn
                @click="delete tls.ech?.config_path"
              >
                {{ $t('tls.useText') }}
              </v-btn>
            </v-btn-toggle>
          </v-col>
        </v-row>
        <v-row v-if="useEchPath == 0">
          <v-col
            cols="12"
            sm="6"
          >
            <v-text-field
              v-model="tls.ech.config_path"
              :label="$t('tls.certPath')"
              hide-details
            />
          </v-col>
          <v-col
            cols="12"
            sm="6"
          >
            <v-text-field
              v-model="tls.ech.query_server_name"
              :label="$t('tls.queryServerName')"
              hide-details
              placeholder="ech.example.com"
            />
          </v-col>
        </v-row>
        <v-row v-else>
          <v-col
            cols="12"
            sm="6"
          >
            <v-textarea
              v-model="echConfigText"
              :label="$t('tls.cert')"
              hide-details
            />
          </v-col>
          <v-col
            cols="12"
            sm="6"
          >
            <v-text-field
              v-model="tls.ech.query_server_name"
              :label="$t('tls.queryServerName')"
              hide-details
              placeholder="ech.example.com"
            />
          </v-col>
        </v-row>
      </template>
      <v-row v-if="tls.handshake_timeout != undefined">
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
      <!-- Refused by reality, so it is offered only for plain TLS. The forged
           hostname has to differ from the SNI, which must be set. -->
      <v-row v-if="tls.reality == undefined && tls.spoof != undefined">
        <v-col
          cols="12"
          sm="6"
          md="4"
        >
          <v-text-field
            v-model="spoof"
            :label="$t('tls.spoof')"
            placeholder="allowed.example.com"
            hide-details
          />
        </v-col>
        <v-col
          v-if="tls.spoof"
          cols="12"
          sm="6"
          md="4"
        >
          <v-select
            v-model="tls.spoof_method"
            hide-details
            :label="$t('tls.spoofMethod')"
            :items="spoofMethods"
          />
        </v-col>
      </v-row>
      <v-row v-if="tls.fragment != undefined">
        <v-col
          cols="12"
          sm="6"
          md="4"
        >
          <v-switch
            v-model="tls.fragment"
            color="primary"
            :label="$t('tls.fragment')"
            hide-details
          />
        </v-col>
        <v-col
          v-if="tls.fragment"
          cols="12"
          sm="6"
          md="4"
        >
          <v-switch
            v-model="tls.record_fragment"
            color="primary"
            :label="$t('tls.recordFragment')"
            hide-details
          />
        </v-col>
        <v-col
          v-if="tls.fragment"
          cols="12"
          sm="6"
          md="4"
        >
          <v-text-field
            v-model.number="fragmentFallbackDelay"
            :label="$t('tls.fragmentDelay')"
            hide-details
            type="number"
            min="0"
            :suffix="$t('date.ms')"
          />
        </v-col>
      </v-row>
    </template>
    <v-card-actions v-if="tls.enabled">
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
                v-model="optionCert"
                color="primary"
                :label="$t('tls.cert')"
                hide-details
              />
            </v-list-item>
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
                v-model="optionReality"
                color="primary"
                label="Reality"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionEch"
                color="primary"
                label="ECH"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionFragment"
                color="primary"
                :label="$t('tls.fragment')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionHandshake"
                color="primary"
                :label="$t('tls.handshakeTimeout')"
                hide-details
              />
            </v-list-item>
            <v-list-item v-if="tls.reality == undefined">
              <v-switch
                v-model="optionSpoof"
                color="primary"
                :label="$t('tls.spoof')"
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
import HttpUtils from '@/plugins/httputil';
import { oTls, defaultOutTls, spoofMethods } from '@/types/tls'

// The object that owns the client TLS block: an outbound, one of an inbound's
// extra addresses, or a DERP mesh node. Only what this form reads is listed.
interface TlsHolder {
  type?: string
  server?: string
  server_port?: number
  tls: oTls
}

// What api/getCertPing answers with.
interface CertPing {
  leafHash: string
}

export default {
  props: {
    // Outbounds, address rows and mesh nodes all bind here, so the prop asks
    // only for an object and the narrowing happens below.
    outbound: { type: Object as PropType<object>, required: true }
  },
  data() {
    const outbound = <TlsHolder>this.$props.outbound
    return {
      menu: false,
      usePath: outbound?.tls?.certificate? 1:0,
      useEchPath: outbound?.tls.ech?.config? 1:0,
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
  computed: {
    // Narrow once, since no caller hands over a type the template checker could
    // follow. The computed returns the same object, so edits reach the parent.
    holder(): TlsHolder { return <TlsHolder>this.$props.outbound },
    tls(): oTls {
      return <oTls> this.holder.tls
    },
    tlsEnable: {
      get() { return Object.hasOwn(this.tls, 'enabled') ? this.tls.enabled : false },
      set(newValue: boolean) { this.holder.tls = newValue ? { enabled: true } : { enabled: false } }
    },
    disable_sni: {
      get() { return this.tls.disable_sni ?? false },
      set(newValue: boolean) { this.holder.tls.disable_sni = newValue ? true : undefined }
    },
    insecure: {
      get() { return this.tls.insecure ?? false },
      set(newValue: boolean) { this.holder.tls.insecure = newValue ? true : undefined }
    },
    tlsOptional(): boolean {
      // Address rows and mesh nodes carry no type, and so match nothing here.
      return !['hysteria','hysteria2','tuic','shadowtls', 'anytls', 'naive'].includes(<string>this.holder.type)
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
          this.holder.tls.certificate_path = ""
        } else {
          delete this.holder.tls.certificate_path
          delete this.holder.tls.certificate
        }
      }
    },
    optionSNI: {
      get(): boolean { return this.tls.server_name != undefined },
      set(v:boolean) { this.holder.tls.server_name = v ? '' : undefined }
    },
    optionALPN: {
      get(): boolean { return this.tls.alpn != undefined },
      set(v:boolean) { this.holder.tls.alpn = v ? defaultOutTls.alpn : undefined }
    },
    optionMinV: {
      get(): boolean { return this.tls.min_version != undefined },
      set(v:boolean) { this.holder.tls.min_version = v ? defaultOutTls.min_version : undefined }
    },
    optionMaxV: {
      get(): boolean { return this.tls.max_version != undefined },
      set(v:boolean) { this.holder.tls.max_version = v ? defaultOutTls.max_version : undefined }
    },
    optionCS: {
      get(): boolean { return this.tls.cipher_suites != undefined },
      set(v:boolean) { this.holder.tls.cipher_suites = v ? defaultOutTls.cipher_suites : undefined }
    },
    optionFP: {
      get(): boolean { return this.tls.utls != undefined },
      set(v:boolean) { this.holder.tls.utls = v ? defaultOutTls.utls : undefined }
    },
    optionReality: {
      get(): boolean { return this.tls.reality != undefined },
      set(v:boolean) {
        this.holder.tls.reality = v ? defaultOutTls.reality : undefined
        // reality rejects a spoofed ClientHello, so the two cannot coexist.
        if (v) this.optionSpoof = false
      }
    },
    handshakeTimeout: {
      get(): number { return parseInt(this.tls.handshake_timeout?.replace('s', '') ?? '15') || 15 },
      set(v:number) { this.holder.tls.handshake_timeout = v > 0 ? `${v}s` : '15s' }
    },
    optionHandshake: {
      get(): boolean { return this.tls.handshake_timeout != undefined },
      set(v:boolean) {
        if (v) {
          this.holder.tls.handshake_timeout = '15s'
        } else {
          delete this.holder.tls.handshake_timeout
        }
      }
    },
    // sing-box refuses spoof_method on its own, so the method only exists
    // while a forged hostname is given.
    spoof: {
      get(): string { return this.tls.spoof ?? '' },
      set(v:string) {
        this.holder.tls.spoof = v
        if (v.length > 0) {
          this.holder.tls.spoof_method = this.tls.spoof_method ?? 'wrong-sequence'
        } else {
          delete this.holder.tls.spoof_method
        }
      }
    },
    optionSpoof: {
      get(): boolean { return this.tls.spoof != undefined },
      set(v:boolean) {
        if (v) {
          this.holder.tls.spoof = ''
        } else {
          delete this.holder.tls.spoof
          delete this.holder.tls.spoof_method
        }
      }
    },
    optionEch: {
      get(): boolean { return this.tls.ech != undefined },
      set(v:boolean) { this.holder.tls.ech = v ? defaultOutTls.ech : undefined }
    },
    optionFragment: {
      get(): boolean { return this.tls.fragment != undefined },
      set(v:boolean) { 
        if (v) {
          this.holder.tls.fragment = false
        } else {
          delete this.holder.tls.fragment
          delete this.holder.tls.fragment_fallback_delay
          delete this.holder.tls.record_fragment
        }
      }
    },
    fragmentFallbackDelay: {
      get(): number { return parseInt(this.tls.fragment_fallback_delay?.replace('ms','')?? '500')?? 500 },
      set(v:number) { this.holder.tls.fragment_fallback_delay = v>0 ? `${v}ms` : undefined }
    },
    pin_sha256: {
      get(): string { return this.tls.certificate_public_key_sha256?.join(',') ?? '' },
      set(v: string) { this.holder.tls.certificate_public_key_sha256 = v.length > 0 ? v.split(',') : undefined }
    }
  },
  methods: {
    async pingCert() {
      this.loading = true
      const msg = await HttpUtils.post<CertPing>('api/getCertPing', {
        domain: this.holder.server,
        port: this.holder.server_port,
      })
      this.loading = false
      if (msg.success) {
        this.pin_sha256 = msg.obj.leafHash
      }
    }
  }
}
</script>