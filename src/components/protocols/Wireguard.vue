<template>
  <v-card subtitle="Wireguard">
    <v-row>
      <v-col
        cols="12"
        sm="8"
      >
        <v-text-field
          v-model="data.private_key"
          :label="$t('types.wg.privKey')"
          append-icon="mdi-key-star"
          hide-details
          @click:append="newKey()"
        />
      </v-col>
      <v-col
        cols="12"
        sm="8"
      >
        <v-text-field
          v-model="public_key"
          readonly
          :label="$t('tls.pubKey')"
          append-icon="mdi-refresh"
          hide-details
          @click:append="getWgPubKey()"
        />
      </v-col>
      <v-col
        cols="12"
        sm="8"
      >
        <v-text-field
          v-model="address"
          :label="$t('types.wg.localIp') + ' ' + $t('commaSeparated')"
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
        <v-text-field
          v-model.number="data.listen_port"
          :label="$t('in.port')"
          hide-details
          type="number"
          min="1"
        />
      </v-col>
      <v-col
        v-if="data.udp_timeout != undefined"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model.number="udp_timeout"
          label="UDP Timeout"
          hide-details
          type="number"
          min="0"
          :suffix="$t('date.m')"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col
        v-if="data.workers != undefined"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model.number="data.workers"
          :label="$t('types.wg.worker')"
          hide-details
          type="number"
          min="1"
        />
      </v-col>
      <v-col
        v-if="data.mtu != undefined"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model.number="data.mtu"
          label="MTU"
          hide-details
          type="number"
          min="0"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col
        cols="12"
        sm="8"
      >
        <v-text-field
          v-model="data.ext.server"
          :label="$t('types.wg.server')"
          hide-details
        />
      </v-col>
      <v-col
        cols="12"
        sm="8"
      >
        <v-text-field
          v-model="data.ext.dns"
          :label="$t('dns.title') + ' ' + $t('commaSeparated')"
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
          :label="$t('types.wg.sysIf')"
          hide-details
        />
      </v-col>
      <v-col
        v-if="data.system"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="ifName"
          :label="$t('types.wg.ifName')"
          hide-details
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
            {{ $t('types.wg.options') }}
          </v-btn>
        </template>
        <v-card>
          <v-list>
            <v-list-item>
              <v-switch
                v-model="optionUdp"
                color="primary"
                label="UDP Timeout"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionWorker"
                color="primary"
                :label="$t('types.wg.worker')"
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
          </v-list>
        </v-card>
      </v-menu>
    </v-card-actions>
  </v-card>
  <v-card v-if="data.peers != undefined">
    <v-card-subtitle>
      {{ $t('types.wg.peers') }}
      <v-chip
        color="primary"
        density="compact"
        variant="elevated"
        @click="addPeer"
      >
        <v-icon icon="mdi-plus" />
      </v-chip>
    </v-card-subtitle>
    <template
      v-for="(p, index) in data.peers"
      :key="index"
    >
      <v-card style="margin-top: 1rem;">
        <v-card-subtitle>
          {{ $t('types.wg.peer') + ' ' + (Number(index)+1) }} <v-icon
            color="error"
            icon="mdi-delete"
            @click="delPeer(Number(index))"
          />
        </v-card-subtitle>
        <Peer
          :data="p"
          :ext="data.ext"
          @refresh-peer-key="refreshPeerKey(index)"
        />
      </v-card>
    </template>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Peer from '@/components/WgPeer.vue'
import { Endpoint, WgPeer } from '@/types/endpoints'

// The panel-only extras carried beside the endpoint's sing-box options: the
// public key derived from the private one, the key store the peers read their
// private keys from, and the hints handed to the generated client config.
interface WgExt {
  public_key?: string
  server?: string
  dns?: string
  keys: { public_key: string, private_key: string }[]
}

// The WireGuard endpoint this form edits. An option that is switched off is
// removed rather than written out, so those fields are optional here.
interface WireguardData {
  private_key: string
  listen_port: number
  address?: string[]
  name?: string
  system?: boolean
  mtu?: number
  workers?: number
  udp_timeout?: string
  peers?: WgPeer[]
  ext: WgExt
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<Endpoint>('data', { required: true })

// The parent holds a union and picks this component with a v-if on the type,
// which the template checker cannot follow, so narrow once here. The computed
// returns the same object, so edits still reach the parent.
const data = computed(() => model.value as unknown as WireguardData)

const emit = defineEmits<{
  newWgKey: []
  getWgPubKey: [privKey: string]
  addPeer: []
  delPeer: [id: number]
  refreshPeerKey: [id: number]
}>()

const menu = ref(false)

const optionUdp = computed({
  get: (): boolean => data.value.udp_timeout != undefined,
  set: (v: boolean) => { data.value.udp_timeout = v ? "5m" : undefined },
})

const optionWorker = computed({
  get: (): boolean => data.value.workers != undefined,
  set: (v: boolean) => { data.value.workers = v ? 2 : undefined },
})

const optionMtu = computed({
  get: (): boolean => data.value.mtu != undefined,
  set: (v: boolean) => { data.value.mtu = v ? 1408 : undefined },
})

const ifName = computed({
  get: () => data.value.name ?? '',
  set: (v: string) => { data.value.name = v.length > 0 ? v : undefined },
})

const address = computed({
  get: () => data.value.address?.join(','),
  set: (v: string) => { data.value.address = v.length > 0 ? v.split(',') : undefined },
})

const udp_timeout = computed({
  get: () => data.value.udp_timeout ? parseInt(data.value.udp_timeout.replace('m', '')) : 5,
  set: (v: number) => { data.value.udp_timeout = v > 0 ? v + 'm' : '5m' },
})

const public_key = computed({
  get: () => data.value.ext?.public_key ?? '',
  set: (v: string) => { data.value.ext.public_key = v },
})

function addPeer() {
  emit('addPeer')
}

function delPeer(id: number) {
  emit('delPeer', id)
}

function refreshPeerKey(id: number) {
  emit('refreshPeerKey', id)
}

function newKey() {
  emit('newWgKey')
}

function getWgPubKey() {
  const privKey = data.value.private_key
  if (privKey.length == 0) return
  emit('getWgPubKey', privKey)
}
</script>
