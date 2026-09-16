<template>
  <v-card :subtitle="$t('pages.basics')">
    <v-row>
      <v-col
        v-if="type == inTypes.SOCKS"
        cols="12"
        sm="6"
        md="4"
      >
        <v-select
          v-model="inData.out_json.version"
          hide-details
          :items="['4','4a','5']"
          :label="$t('version')"
        />
      </v-col>
      <v-col
        v-if="needNetwork"
        cols="12"
        sm="6"
        md="4"
      >
        <Network :data="inData.out_json" />
      </v-col>
      <v-col
        v-if="needUot"
        cols="12"
        sm="6"
        md="4"
      >
        <UoT :data="inData.out_json" />
      </v-col>
      <v-col
        v-if="type == inTypes.HTTP"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="inData.out_json.path"
          :label="$t('transport.path')"
          hide-details
        />
      </v-col>
      <v-col
        v-if="type == inTypes.VMess || type == inTypes.VLESS"
        cols="12"
        sm="6"
        md="4"
      >
        <v-select
          v-model="packet_encoding"
          hide-details
          :label="$t('types.vless.udpEnc')"
          :items="['none','packetaddr','xudp']"
        />
      </v-col>
      <template v-if="type == inTypes.VMess">
        <v-col
          cols="12"
          sm="6"
          md="4"
        >
          <v-select
            v-model="inData.out_json.security"
            hide-details
            :label="$t('types.vmess.security')"
            :items="vmessSecurities"
          />
        </v-col>
        <v-col
          cols="12"
          sm="6"
          md="4"
        >
          <v-switch
            v-model="inData.out_json.global_padding"
            color="primary"
            :label="$t('types.vmess.globalPadding')"
            hide-details
          />
        </v-col>
        <v-col
          cols="12"
          sm="6"
          md="4"
        >
          <v-switch
            v-model="inData.out_json.authenticated_length"
            color="primary"
            :label="$t('types.vmess.authLen')"
            hide-details
          />
        </v-col>
      </template>
      <!-- The QUIC stream window; recv_window was hysteria's own name for it. -->
      <v-col
        v-if="type == inTypes.Hysteria"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="hysteriaStreamWindow"
          :label="$t('quic.streamWindow')"
          placeholder="8mb"
          hide-details
          clearable
        />
      </v-col>
      <template v-if="type == inTypes.TUIC">
        <v-col
          cols="12"
          sm="6"
          md="4"
        >
          <v-select
            v-model="inData.out_json.udp_relay_mode"
            hide-details
            label="UDP Relay Mode"
            :items="['native', 'quic']"
            clearable
            @click:clear="delete inData.out_json.udp_relay_mode"
          />
        </v-col>
        <v-col
          cols="12"
          sm="6"
          md="4"
        >
          <v-switch
            v-model="inData.out_json.udp_over_stream"
            color="primary"
            label="UDP Over Stream"
            hide-details
          />
        </v-col>
      </template>
    </v-row>
    <v-row v-if="[inTypes.Hysteria, inTypes.Hysteria2].includes(type)">
      <v-col
        cols="12"
        sm="8"
      >
        <v-text-field
          v-model="server_ports"
          :label="$t('rule.portRange') + ' ' + $t('commaSeparated')"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model.number="hop_interval"
          :label="$t('ruleset.interval')"
          type="number"
          min="0"
          :suffix="$t('date.s')"
        />
      </v-col>
    </v-row>
    <Headers
      v-if="type == inTypes.HTTP"
      :data="inData.out_json"
    />
    <AnyTls
      v-if="type == inTypes.AnyTls"
      :data="outJson"
      direction="out_json"
    />
    <Naive
      v-if="type == inTypes.Naive"
      :data="outJson"
      direction="out_json"
    />
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { InTypes, Inbound } from '@/types/inbounds'
import { Outbound } from '@/types/outbounds'
import Network from './Network.vue'
import UoT from './UoT.vue'
import Headers from './Headers.vue'
import AnyTls from './protocols/AnyTls.vue'
import Naive from './protocols/Naive.vue'

// The outbound sing-box config this inbound hands to its clients: only the
// fields the panel lets the operator override are listed here.
interface OutJsonFields {
  version?: string
  path?: string
  network?: string
  udp_over_tcp?: { enabled: boolean, version: number }
  headers?: Record<string, string | string[]>
  security?: string
  global_padding?: boolean
  authenticated_length?: boolean
  packet_encoding?: string
  stream_receive_window?: number | string
  server_ports?: string[]
  hop_interval?: string
  udp_relay_mode?: 'native' | 'quic'
  udp_over_stream?: boolean
}

interface OutJsonHolder {
  out_json: OutJsonFields
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<Inbound>('inData', { required: true })

// The parent holds a union and out_json is untyped on it, so narrow once here.
// The computed returns the same object, so edits still reach the parent.
const inData = computed(() => model.value as unknown as OutJsonHolder)

const props = defineProps<{
  type: string
}>()

// AnyTls and Naive take a whole outbound; they edit the very same object.
const outJson = computed(() => inData.value.out_json as unknown as Outbound)

const inTypes = InTypes

const vmessSecurities = [
  "auto",
  "none",
  "zero",
  "aes-128-gcm",
  "aes-128-ctr",
  "chacha20-poly1305",
]

const haveNetwork: string[] = [
  InTypes.SOCKS,
  InTypes.Shadowsocks,
  InTypes.VMess,
  InTypes.Trojan,
  InTypes.Hysteria,
  InTypes.VLESS,
  InTypes.TUIC,
  InTypes.Hysteria2,
]

const havUoT: string[] = [
  InTypes.SOCKS,
  InTypes.Shadowsocks,
]

// Takes a number or a string with a unit ("8mb"); an empty value is
// removed, since sing-box rejects "" for a byte size.
const hysteriaStreamWindow = computed({
  get: (): string => String(inData.value.out_json.stream_receive_window ?? ''),
  set: (v: string) => {
    const trimmed = (v ?? '').trim()
    if (trimmed) inData.value.out_json.stream_receive_window = trimmed
    else delete inData.value.out_json.stream_receive_window
  },
})

const needNetwork = computed((): boolean => haveNetwork.includes(props.type))

const needUot = computed((): boolean => havUoT.includes(props.type))

const packet_encoding = computed({
  get: () => inData.value.out_json.packet_encoding != undefined ? inData.value.out_json.packet_encoding : 'none',
  set: (v: string) => { inData.value.out_json.packet_encoding = v != "none" ? v : undefined },
})

const server_ports = computed({
  get: (): string | never[] => inData.value.out_json.server_ports?.join(',') ?? [],
  set: (v: string) => { inData.value.out_json.server_ports = v.length > 0 ? v.split(',') : undefined },
})

const hop_interval = computed({
  get: () => inData.value.out_json.hop_interval ? parseInt(inData.value.out_json.hop_interval.replace('s', '')) : 0,
  set: (v: number) => { inData.value.out_json.hop_interval = v > 0 ? v + 's' : undefined },
})
</script>
