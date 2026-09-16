<template>
  <v-card subtitle="Hysteria2">
    <v-row>
      <v-col
        v-if="direction == 'in'"
        cols="12"
        sm="6"
        md="4"
      >
        <v-switch
          v-model="data.ignore_client_bandwidth"
          color="primary"
          :label="$t('types.hy.ignoreBw')"
          hide-details
        />
      </v-col>
      <v-col
        v-if="!data.ignore_client_bandwidth"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model.number="up_mbps"
          :label="$t('stats.upload')"
          hide-details
          type="number"
          :suffix="$t('stats.Mbps')"
          min="0"
        />
      </v-col>
      <v-col
        v-if="!data.ignore_client_bandwidth"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model.number="down_mbps"
          :label="$t('stats.download')"
          hide-details
          type="number"
          :suffix="$t('stats.Mbps')"
          min="0"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col
        v-if="data.obfs != undefined"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.obfs.password"
          :label="$t('types.hy.obfs')"
          hide-details
        />
      </v-col>
    </v-row>
    <template v-if="direction == 'in'">
      <v-card
        v-if="data.masquerade != undefined"
        subtitle="Hysteria2 Masquerade"
      >
        <v-row>
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-select
              v-model="masqueradeType"
              hide-details
              :label="$t('type')"
              :items="masqTypes"
            />
          </v-col>
          <v-col
            v-if="masqueradeType == ''"
            cols="12"
            sm="8"
          >
            <v-text-field
              v-model="data.masquerade"
              label="HTTP3 server on auth fails"
              placeholder="file:///var/www | http://127.0.0.1:8080"
              hide-details
            />
          </v-col>
          <v-col
            v-if="masqueradeType == 'file'"
            cols="12"
            sm="8"
          >
            <v-text-field
              v-model="masquerade.directory"
              label="File server root directory"
              placeholder="/var/www"
              hide-details
            />
          </v-col>
          <v-col
            v-if="masqueradeType == 'string'"
            cols="12"
            sm="6"
            md="4"
          >
            <v-text-field
              v-model.number="masquerade.status_code"
              label="HTTP Code"
              type="number"
              min="100"
              max="599"
              hide-details
            />
          </v-col>
        </v-row>
        <v-row v-if="masqueradeType == 'proxy'">
          <v-col
            cols="12"
            sm="6"
          >
            <v-text-field
              v-model="masquerade.url"
              label="Target URL"
              placeholder="http://example.com:8080"
              hide-details
            />
          </v-col>
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-switch
              v-model="masquerade.rewrite_host"
              label="Rewrite Host"
              color="primary"
              hide-details
            />
          </v-col>
        </v-row>
        <template v-if="masqueradeType == 'string'">
          <v-row>
            <v-col
              cols="12"
              sm="8"
            >
              <v-text-field
                v-model="masquerade.content"
                label="Content"
                hide-details
              />
            </v-col>
          </v-row>
          <Headers :data="masquerade" />
        </template>
      </v-card>
    </template>
    <template v-else>
      <v-row>
        <v-col
          cols="12"
          sm="6"
          md="4"
        >
          <v-text-field
            v-model="data.password"
            :label="$t('types.pw')"
            hide-details
          />
        </v-col>
        <v-col
          cols="12"
          sm="6"
          md="4"
        >
          <Network :data="model" />
        </v-col>
        <v-col
          v-if="optionMPort"
          cols="12"
          sm="8"
        >
          <v-text-field
            v-model="server_ports"
            :label="$t('rule.portRange') + ' ' + $t('commaSeparated')"
          />
        </v-col>
        <v-col
          v-if="optionMPort"
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
    </template>
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
            {{ $t('types.hy.hy2Options') }}
          </v-btn>
        </template>
        <v-card>
          <v-list>
            <v-list-item>
              <v-switch
                v-model="optionObfs"
                color="primary"
                :label="$t('types.hy.obfs')"
                hide-details
              />
            </v-list-item>
            <template v-if="direction == 'in'">
              <v-list-item>
                <v-switch
                  v-model="optionMasq"
                  color="primary"
                  label="Masquerade"
                  hide-details
                />
              </v-list-item>
            </template>
            <template v-else>
              <v-list-item>
                <v-switch
                  v-model="optionMPort"
                  color="primary"
                  :label="$t('rule.portRange')"
                  hide-details
                />
              </v-list-item>
            </template>
          </v-list>
        </v-card>
      </v-menu>
    </v-card-actions>
    <QuicFields
      :data="model"
      quic
    />
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import QuicFields from '@/components/QuicFields.vue'
import Network from '@/components/Network.vue'
import Headers from '@/components/Headers.vue'
import { i18n } from '@/locales'
import { Inbound } from '@/types/inbounds'
import { Outbound } from '@/types/outbounds'

// The masquerade is either a bare URL string or one of the object forms; the
// type field picks which of the object fields apply.
interface Hysteria2Masquerade {
  type: string
  directory?: string
  url?: string
  rewrite_host?: boolean
  status_code?: number
  content?: string
  headers?: Record<string, string | string[]>
}

// One form serves both directions, so it takes the widest shape either side
// can hold: only the inbound side carries the masquerade and the bandwidth
// override, only the outbound side the password and the port hopping.
interface Hysteria2Data {
  ignore_client_bandwidth?: boolean
  up_mbps?: number
  down_mbps?: number
  obfs?: {
    type?: "salamander"
    password: string
  }
  masquerade?: string | Hysteria2Masquerade
  password?: string
  server_ports?: string[]
  hop_interval?: string
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<Inbound | Outbound>('data', { required: true })

// The parent holds a union and picks this component with a v-if on the type,
// which the template checker cannot follow, so narrow once here. The computed
// returns the same object, so edits still reach the parent.
const data = computed(() => model.value as unknown as Hysteria2Data)

defineProps<{
  direction: 'in' | 'out' | 'out_json'
}>()

const menu = ref(false)

const masqTypes = [
  { title: i18n.global.t('rule.simple'), value: '' },
  { title: "File server", value: "file" },
  { title: "Reverse Proxy", value: "proxy" },
  { title: "Fixed response", value: "string" },
]

// The masquerade type select decides which shape the field holds, which the
// template checker cannot follow either, so expose the object form once here.
const masquerade = computed(() => data.value.masquerade as Hysteria2Masquerade)

const down_mbps = computed({
  get: (): number => data.value.down_mbps ?? 0,
  set: (v: number) => { data.value.down_mbps = v > 0 ? v : undefined },
})

const up_mbps = computed({
  get: (): number => data.value.up_mbps ?? 0,
  set: (v: number) => { data.value.up_mbps = v > 0 ? v : undefined },
})

const server_ports = computed({
  get: (): string | string[] => data.value.server_ports?.join(',') ?? [],
  set: (v: string) => { data.value.server_ports = v.length > 0 ? v.split(',') : undefined },
})

const masqueradeType = computed({
  get: (): string => typeof data.value.masquerade === 'object' ? data.value.masquerade.type ?? '' : '',
  set: (v: string) => {
    if (v == '') {
      data.value.masquerade = ''
    } else {
      data.value.masquerade = { type: v }
    }
  },
})

const hop_interval = computed({
  get: (): number => {
    const v = data.value.hop_interval
    return v ? parseInt(v.replace('s', '')) : 0
  },
  set: (v: number) => { data.value.hop_interval = v > 0 ? v + 's' : undefined },
})

const optionObfs = computed({
  get: (): boolean => data.value.obfs != undefined,
  set: (v: boolean) => { data.value.obfs = v ? { type: "salamander", password: "" } : undefined },
})

const optionMasq = computed({
  get: (): boolean => data.value.masquerade != undefined,
  set: (v: boolean) => { data.value.masquerade = v ? "" : undefined },
})

const optionMPort = computed({
  get: (): boolean => data.value.server_ports != undefined,
  set: (v: boolean) => { data.value.server_ports = v ? [] : undefined },
})
</script>
