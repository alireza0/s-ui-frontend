<template>
  <v-dialog transition="dialog-bottom-transition" width="750" scrollable>
    <v-card class="rounded-lg" :loading="loading">
      <v-card-title>
        <v-row>
          <v-col cols="auto">
            {{ $t('sessions.title') }}
          </v-col>
          <v-spacer></v-spacer>
          <v-col cols="auto" class="d-flex align-center ga-3">
            <v-switch
              v-model="autoRefresh"
              color="primary"
              density="compact"
              hide-details
              style="flex: none"
              :label="$t('stats.autoRefresh')"
            ></v-switch>
            <v-icon icon="mdi-refresh" :class="{ 'mdi-spin': loading }" @click="loadData">
              <v-tooltip activator="parent" location="top">{{ $t('actions.update') }}</v-tooltip>
            </v-icon>
            <v-icon icon="mdi-close" @click="$emit('close')"></v-icon>
          </v-col>
        </v-row>
      </v-card-title>
      <v-card-subtitle style="margin-top: -20px">
        {{ $t('objects.' + resource) + " : " + tag }}
      </v-card-subtitle>
      <v-card-text>
        <v-alert :text="$t('sessions.empty')" type="info" variant="outlined" v-if="!loading && sessions.length == 0"></v-alert>
        <v-data-table
          v-else
          :items="sessions"
          :headers="headers"
          :loading="loading"
          :mobile="smAndDown"
          :hide-default-footer="sessions.length <= 10"
          items-per-page="10"
          density="compact"
        >
          <template v-slot:item.user="{ item }">
            <span class="d-inline-block text-truncate session-tag">{{ item.user }}</span>
            <v-tooltip activator="parent" location="top">{{ item.user }}</v-tooltip>
          </template>
          <template v-slot:item.inbound="{ item }">
            <span class="d-inline-block text-truncate session-tag">{{ item.inbound }}</span>
            <v-tooltip activator="parent" location="top">{{ item.inbound }}</v-tooltip>
          </template>
          <template v-slot:item.source="{ item }">
            <span class="d-inline-block text-truncate session-addr">{{ item.source }}</span>
            <v-tooltip activator="parent" location="top">{{ item.source }}</v-tooltip>
          </template>
          <template v-slot:item.destination="{ item }">
            <span class="d-inline-block text-truncate session-addr">{{ item.domain || item.destination }}</span>
            <v-tooltip activator="parent" location="top">
              <template v-if="item.domain && item.domain != item.destination.split(':')[0]">
                {{ item.domain }}<br />
              </template>
              {{ item.destination }}<br />
              {{ item.network }}
            </v-tooltip>
          </template>
          <template v-slot:item.outbound="{ item }">
            <span class="d-inline-block text-truncate session-tag">{{ item.outbound }}</span>
            <v-tooltip activator="parent" location="top" v-if="item.rule">
              {{ $t('objects.rule') }}: {{ item.rule }}
            </v-tooltip>
          </template>
          <template v-slot:item.up="{ item }">
            {{ fmt(item.up + item.down) }}
            <v-tooltip activator="parent" location="top">
              {{ $t('stats.upload') }}: {{ fmt(item.up) }}<br />
              {{ $t('stats.download') }}: {{ fmt(item.down) }}<br />
              {{ $t('sessions.duration') }}: {{ duration(item.createdAt) }}
            </v-tooltip>
          </template>
        </v-data-table>
      </v-card-text>
      <template v-if="resource == 'user'">
      <v-divider></v-divider>
      <v-card-actions>
        <v-btn
          color="error"
          variant="outlined"
          prepend-icon="mdi-close-network"
          :loading="closing"
          :disabled="sessions.length == 0"
          @click="closeSessions"
        >{{ $t('sessions.closeAll') }}</v-btn>
      </v-card-actions>
      </template>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import HttpUtils from '@/plugins/httputil'
import { HumanReadable } from '@/plugins/utils'
import { i18n } from '@/locales'
import { computed, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'

const props = defineProps<{ visible: boolean, resource: string, tag: string }>()
defineEmits(['close'])

const { smAndDown } = useDisplay()

const loading = ref(false)
const closing = ref(false)
const sessions = ref(<any[]>[])
const autoRefresh = ref(localStorage.getItem('sessionsAutoRefresh') === 'true')
let intervalId = <any>0

const headers = computed(() => {
  // The resource the list was opened from is already in the subtitle, so its
  // column is dropped and the client takes that place.
  const columns = [
    { title: i18n.global.t('sessions.source'), key: 'source' },
    { title: i18n.global.t('sessions.destination'), key: 'destination' },
    { title: i18n.global.t('stats.usage'), key: 'up', value: (item: any) => item.up + item.down, width: '90px' },
  ]
  const inbound = { title: i18n.global.t('objects.inbound'), key: 'inbound' }
  const outbound = { title: i18n.global.t('objects.outbound'), key: 'outbound' }
  const client = { title: i18n.global.t('objects.client'), key: 'user' }
  switch (props.resource) {
    case 'inbound':
      return [client, ...columns.slice(0, 2), outbound, columns[2]]
    case 'outbound':
      return [client, ...columns.slice(0, 2), inbound, columns[2]]
    case 'endpoint':
      // An endpoint can be on either side of a connection, so both tags stay:
      // they are what tells the two cases apart.
      return [client, inbound, ...columns.slice(0, 2), outbound, columns[2]]
    default:
      return [inbound, ...columns.slice(0, 2), outbound, columns[2]]
  }
})

const loadData = async () => {
  loading.value = true
  const msg = await HttpUtils.get('api/sessions', { resource: props.resource, tag: props.tag })
  sessions.value = msg.success ? (msg.obj ?? []) : []
  loading.value = false
}

const closeSessions = async () => {
  closing.value = true
  const msg = await HttpUtils.post('api/closeSessions', { u: props.tag })
  // Empty the list now rather than waiting for the next poll, so it matches
  // what the operator just did even with auto refresh off.
  if (msg.success) sessions.value = []
  closing.value = false
}

const fmt = (v: number) => HumanReadable.sizeFormat(v)

const duration = (createdAt: number) => {
  const seconds = Math.max(0, Math.floor(Date.now() / 1000) - createdAt)
  if (seconds < 60) return i18n.global.n(seconds) + i18n.global.t('date.s')
  if (seconds < 3600) return i18n.global.n(Math.floor(seconds / 60)) + i18n.global.t('date.m')
  return i18n.global.n(Math.floor(seconds / 3600)) + i18n.global.t('date.h')
}

const startAutoRefresh = () => {
  if (!intervalId) intervalId = setInterval(() => { loadData() }, 5000)
}
const stopAutoRefresh = () => {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = 0
  }
}

watch(() => props.visible, (v) => {
  if (v) {
    loadData()
    if (autoRefresh.value) startAutoRefresh()
  } else {
    sessions.value = []
    stopAutoRefresh()
  }
})

watch(autoRefresh, (v) => {
  localStorage.setItem('sessionsAutoRefresh', v ? 'true' : 'false')
  if (v && props.visible) startAutoRefresh()
  else stopAutoRefresh()
})
</script>

<style scoped>
/* Addresses and tags are cut to keep the row from growing; the full value is
   one hover away. */
.session-addr {
  max-width: 130px;
  vertical-align: middle;
}
.session-tag {
  max-width: 90px;
  vertical-align: middle;
}
</style>
