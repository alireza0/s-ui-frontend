<template>
  <v-dialog transition="dialog-bottom-transition" width="800">
    <v-card class="rounded-lg" :loading="loading">
      <v-card-title>
        <v-row>
          <v-col cols="auto">
            {{ $t('client.trafficHistory') }}
          </v-col>
          <v-spacer></v-spacer>
          <v-col cols="auto"><v-icon icon="mdi-close" @click="$emit('close')"></v-icon></v-col>
        </v-row>
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text>
        <div style="text-align: center; margin-bottom: 16px;">
          <v-chip color="primary" label>{{ clientName }}</v-chip>
        </div>
        
        <v-alert 
          v-if="!loading && histories.length === 0" 
          :text="$t('client.noTrafficHistory')" 
          type="info" 
          variant="outlined"
        ></v-alert>
        
        <v-data-table
          v-if="histories.length > 0"
          :headers="headers"
          :items="histories"
          :items-per-page="pageSize"
          :page="page"
          :items-length="total"
          @update:page="onPageChange"
          @update:items-per-page="onPageSizeChange"
          class="elevation-1"
        >
          <template v-slot:item.endTime="{ item }">
            {{ formatDate(item.endTime) }}
          </template>
          <template v-slot:item.startTime="{ item }">
            {{ formatDate(item.startTime) }}
          </template>
          <template v-slot:item.up="{ item }">
            <v-chip size="small" color="success" variant="tonal" label>
              ↑ {{ HumanReadable.sizeFormat(item.up) }}
            </v-chip>
          </template>
          <template v-slot:item.down="{ item }">
            <v-chip size="small" color="info" variant="tonal" label>
              ↓ {{ HumanReadable.sizeFormat(item.down) }}
            </v-chip>
          </template>
          <template v-slot:item.total="{ item }">
            <v-chip size="small" color="primary" variant="flat" label>
              {{ HumanReadable.sizeFormat(item.up + item.down) }}
            </v-chip>
          </template>
          <template v-slot:item.resetMode="{ item }">
            <v-chip size="small" :color="item.resetMode === 1 ? 'warning' : 'secondary'" variant="outlined" label>
              {{ item.resetMode === 1 ? $t('client.resetModes.monthly') : $t('client.resetModes.periodic') }}
            </v-chip>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { i18n } from '@/locales'
import HttpUtils from '@/plugins/httputil'
import { HumanReadable } from '@/plugins/utils'

interface TrafficHistoryItem {
  id: number
  clientId: number
  clientName: string
  startTime: number
  endTime: number
  up: number
  down: number
  resetMode: number
}

export default {
  props: ['visible', 'clientId', 'clientName'],
  emits: ['close'],
  data() {
    return {
      loading: false,
      histories: [] as TrafficHistoryItem[],
      total: 0,
      page: 1,
      pageSize: 10,
      HumanReadable,
      headers: [
        { title: i18n.global.t('client.resetTime'), key: 'endTime' },
        { title: i18n.global.t('client.periodStart'), key: 'startTime' },
        { title: i18n.global.t('stats.upload'), key: 'up', sortable: false },
        { title: i18n.global.t('stats.download'), key: 'down', sortable: false },
        { title: i18n.global.t('stats.total'), key: 'total', sortable: false },
        { title: i18n.global.t('client.resetMode'), key: 'resetMode', sortable: false },
      ],
    }
  },
  watch: {
    visible(v: boolean) {
      if (v && this.clientId > 0) {
        this.page = 1
        this.loadData()
      }
    }
  },
  methods: {
    async loadData() {
      this.loading = true
      try {
        const msg = await HttpUtils.get('api/traffic-history', {
          clientId: this.clientId,
          page: this.page,
          pageSize: this.pageSize,
        })
        if (msg.success) {
          this.histories = msg.obj.histories || []
          this.total = msg.obj.total || 0
        }
      } catch (e) {
        console.error('Failed to load traffic history:', e)
      }
      this.loading = false
    },
    onPageChange(newPage: number) {
      this.page = newPage
      this.loadData()
    },
    onPageSizeChange(newSize: number) {
      this.pageSize = newSize
      this.page = 1
      this.loadData()
    },
    formatDate(timestamp: number): string {
      if (!timestamp) return '-'
      const date = new Date(timestamp * 1000)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    },
  },
}
</script>
