<template>
  <v-card :subtitle="$t('objects.listen')">
    <v-row>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.listen"
          :label="$t('in.addr')"
          hide-details
          required
        />
      </v-col>
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
          max="65535"
          required
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col
        v-if="optionDetour"
        cols="12"
        sm="6"
        md="4"
      >
        <v-select
          v-model="data.detour"
          :label="$t('listen.detourText')"
          hide-details
          :items="inTags"
        />
      </v-col>
    </v-row>
    <v-row v-if="optionTCP">
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-switch
          v-model="data.tcp_fast_open"
          color="primary"
          label="TCP Fast Open"
          hide-details
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-switch
          v-model="data.tcp_multi_path"
          color="primary"
          label="TCP Multi Path"
          hide-details
        />
      </v-col>
    </v-row>
    <v-row v-if="optionUDP">
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-switch
          v-model="data.udp_fragment"
          color="primary"
          label="UDP Fragment"
          hide-details
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model.number="udpTimeout"
          label="UDP NAT expiration"
          hide-details
          type="number"
          min="1"
          :suffix="$t('date.m')"
        />
      </v-col>
    </v-row>
    <v-row v-if="optionTcpKeepAlive">
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-switch
          v-model="data.disable_tcp_keep_alive"
          color="primary"
          :label="$t('listen.disableTcpKeepAlive')"
          hide-details
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.tcp_keep_alive"
          :label="$t('listen.tcpKeepAlive')"
          hide-details
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.tcp_keep_alive_interval"
          :label="$t('listen.tcpKeepAliveInterval')"
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
            {{ $t('listen.options') }}
          </v-btn>
        </template>
        <v-card>
          <v-list>
            <v-list-item>
              <v-switch
                v-model="optionDetour"
                color="primary"
                :label="$t('listen.detour')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionTCP"
                color="primary"
                :label="$t('listen.tcpOptions')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionUDP"
                color="primary"
                :label="$t('listen.udpOptions')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionTcpKeepAlive"
                color="primary"
                :label="$t('listen.tcpKeepAlive')"
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
import { ref, computed } from 'vue'
import { Inbound } from '@/types/inbounds'
import { Srv } from '@/types/services'

// The listen options this form edits. sing-box flattens them into whatever
// carries them, and an option that is switched off leaves no trace.
interface ListenData {
  listen: string
  listen_port: number
  detour?: string
  tcp_fast_open?: boolean
  tcp_multi_path?: boolean
  udp_fragment?: boolean
  udp_timeout?: string
  disable_tcp_keep_alive?: boolean
  tcp_keep_alive?: string
  tcp_keep_alive_interval?: string
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<Inbound | Srv>('data', { required: true })

// The parent holds a union and picks this component with a v-if, which the
// template checker cannot follow, so narrow once here. The computed returns the
// same object, so edits still reach the parent.
const data = computed(() => model.value as unknown as ListenData)

// Destructured so the name does not collide with the v-menu activator slot.
const { inTags } = defineProps<{
  inTags: string[]
}>()

const menu = ref(false)

const udpTimeout = computed({
  get: (): number => data.value.udp_timeout ? parseInt(data.value.udp_timeout.replace('m', '')) : 5,
  set: (newValue: number) => { data.value.udp_timeout = newValue > 0 ? newValue + 'm' : '5m' },
})

const optionTCP = computed({
  get: (): boolean => {
    return data.value.tcp_fast_open != undefined &&
           data.value.tcp_multi_path != undefined
  },
  set: (v: boolean) => {
    data.value.tcp_fast_open = v ? false : undefined
    data.value.tcp_multi_path = v ? false : undefined
  },
})

const optionUDP = computed({
  get: (): boolean => {
    return data.value.udp_fragment != undefined &&
           data.value.udp_timeout != undefined
  },
  set: (v: boolean) => {
    data.value.udp_fragment = v ? false : undefined
    data.value.udp_timeout = v ? '5m' : undefined
  },
})

const optionDetour = computed({
  get: (): boolean => data.value.detour != undefined,
  set: (v: boolean) => { data.value.detour = v ? inTags[0] ?? '' : undefined },
})

const optionTcpKeepAlive = computed({
  get: (): boolean => {
    return data.value.disable_tcp_keep_alive != undefined ||
           data.value.tcp_keep_alive != undefined ||
           data.value.tcp_keep_alive_interval != undefined
  },
  set: (v: boolean) => {
    if (v) {
      data.value.tcp_keep_alive = '5m'
      data.value.tcp_keep_alive_interval = '75s'
    } else {
      delete data.value.disable_tcp_keep_alive
      delete data.value.tcp_keep_alive
      delete data.value.tcp_keep_alive_interval
    }
  },
})
</script>
