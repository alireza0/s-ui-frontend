<template>
  <v-card subtitle="Warp">
    <template v-if="data.id>0">
      <table
        dir="ltr"
        width="100%"
      >
        <tbody>
          <tr>
            <td>Device ID</td>
            <td>{{ data.ext.device_id }}</td>
          </tr>
          <tr>
            <td>Access Token</td>
            <td>{{ data.ext.access_token }}</td>
          </tr>
          <tr>
            <td>{{ $t('types.wg.privKey') }}</td>
            <td>{{ data.private_key }}</td>
          </tr>
          <tr>
            <td>{{ $t('types.wg.localIp') }}</td>
            <td>{{ data.address.join(',') }}</td>
          </tr>
          <tr>
            <td colspan="2">
              <v-text-field
                v-model="data.ext.license_key"
                label="License Key"
                hide-details
              />
            </td>
          </tr>
        </tbody>
      </table>
      <v-card :subtitle="$t('types.wg.peer')">
        <v-row>
          <v-col
            cols="12"
            sm="6"
          >
            <v-text-field
              v-model="data.peers[0].address"
              :label="$t('out.addr')"
              hide-details
            />
          </v-col>
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-text-field
              v-model.number="data.peers[0].port"
              :label="$t('out.port')"
              hide-details
              type="number"
              min="1"
            />
          </v-col>
        </v-row>
        <table
          dir="ltr"
          width="100%"
        >
          <tbody>
            <tr>
              <td>{{ $t('types.wg.pubKey') }}</td>
              <td>{{ data.peers[0].public_key }}</td>
            </tr>
            <tr>
              <td>{{ $t('types.wg.allowedIp') }}</td>
              <td>{{ data.peers[0].allowed_ips.join(',') }}</td>
            </tr>
            <tr>
              <td>Reserved</td>
              <td>[{{ data.peers[0].reserved.join(',') }}]</td>
            </tr>
          </tbody>
        </table>
      </v-card>
    </template>
    <v-row>
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
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Endpoint } from '@/types/endpoints'

// The Warp-specific bookkeeping the panel keeps alongside the endpoint.
interface WarpExt {
  device_id?: string
  access_token?: string
  license_key?: string
}

// Only the Warp endpoint fields this form reads or writes. The peer block and
// `ext` are filled in by the registration step, so they are read as present.
interface WarpPeer {
  address: string
  port: number
  public_key: string
  allowed_ips: string[]
  reserved: number[]
}

interface WarpData {
  id: number
  ext: WarpExt
  address: string[]
  private_key: string
  peers: WarpPeer[]
  udp_timeout?: string
  workers?: number
  mtu?: number
  system?: boolean
  name?: string
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<Endpoint>('data', { required: true })

// The parent holds a union and picks this component with a v-if on the type,
// which the template checker cannot follow, so narrow once here. The computed
// returns the same object, so edits still reach the parent.
const data = computed(() => model.value as unknown as WarpData)

const menu = ref(false)

const optionUdp = computed({
  get: (): boolean => data.value.udp_timeout != undefined,
  set: (v:boolean) => { data.value.udp_timeout = v ? "5m" : undefined },
})

const optionWorker = computed({
  get: (): boolean => data.value.workers != undefined,
  set: (v:boolean) => { data.value.workers = v ? 2 : undefined },
})

const optionMtu = computed({
  get: (): boolean => data.value.mtu != undefined,
  set: (v:boolean) => { data.value.mtu = v ? 1408 : undefined },
})

const ifName = computed({
  get: (): string => data.value.name ?? '',
  set: (v:string) => { data.value.name = v.length > 0 ? v : undefined },
})

const udp_timeout = computed({
  get: (): number => data.value.udp_timeout ? parseInt(data.value.udp_timeout.replace('m','')) : 5,
  set: (v:number) => { data.value.udp_timeout = v > 0 ? v + 'm' : '5m' },
})
</script>
