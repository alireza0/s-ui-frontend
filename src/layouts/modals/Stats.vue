<template>
  <v-dialog transition="dialog-bottom-transition" width="800">
    <v-card class="rounded-lg" :loading="loading">
      <v-card-title>
        <v-row>
          <v-col cols="auto">
            {{ $t('stats.graphTitle') }}
          </v-col>
          <v-spacer></v-spacer>
          <v-col cols="auto"><v-icon icon="mdi-close" @click="$emit('close')"></v-icon></v-col>
        </v-row>
      </v-card-title>
      <v-card-subtitle style="margin-top: -20px">
        {{ $t('objects.' + resource) + " : " + tag }}
      </v-card-subtitle>
      <v-card-text class="text-center" style="padding: 0">
        <v-btn-toggle v-model="limit"
          @update:model-value="selectPreset" density="compact"
          color="primary" :loading="loading"
          border mandatory group
          inline hide-details>
          <v-btn v-for="p in periods" :value="p.value">{{ p.title }}</v-btn>
          <v-btn :value="0"><v-icon icon="mdi-calendar-range" /></v-btn>
        </v-btn-toggle>
        <v-row dense align="center" justify="center" class="mt-2 mb-1 px-2" v-if="limit === 0">
          <v-col cols="12" sm="5">
            <DatePick :expiry="rangeStart" :label="$t('stats.from')" inputId="statsFrom" @submit="setRangeStart" />
          </v-col>
          <v-col cols="12" sm="5">
            <DatePick :expiry="rangeEnd" :label="$t('stats.to')" inputId="statsTo" @submit="setRangeEnd" />
          </v-col>
        </v-row>
        <v-container id="container" style="height: 400px;">
          <v-skeleton-loader
            class="mx-auto border"
            type="image"
            v-if="loading"
          ></v-skeleton-loader>
          <template v-else>
            <v-alert :text="$t('noData')" type="warning" variant="outlined" v-if="alert"></v-alert>
            <Line v-if="loaded" :data="usage" :options="<any>options" />
          </template>
        </v-container>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { i18n } from '@/locales'
import HttpUtils from '@/plugins/httputil'
import { HumanReadable } from '@/plugins/utils'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { ref } from 'vue'
import { useTheme } from 'vuetify'
import { Line } from 'vue-chartjs'
import DatePick from '@/components/DateTime.vue'
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)
ChartJS.defaults.font.family = 'Vazirmatn'
export default {
  components: {
    Line,
    DatePick
  },
  props: ['visible','resource','tag'],
  data() {
    return {
      theme: useTheme(),
      loading: false,
      loaded: false,
      alert: false,
      intervalId: <any>0,
      limit: 1,
      rangeStart: 0,
      rangeEnd: 0,
      periods: [
        { value: 1, title: i18n.global.n(1) + i18n.global.t('date.h')},
        { value: 6, title: i18n.global.n(6) + i18n.global.t('date.h')},
        { value: 12, title: i18n.global.n(12) + i18n.global.t('date.h')},
        { value: 24, title: i18n.global.n(1) + i18n.global.t('date.d')},
        { value: 48, title: i18n.global.n(2) + i18n.global.t('date.d')},
        { value: 240, title: i18n.global.n(10) + i18n.global.t('date.d')},
        { value: 480, title: i18n.global.n(20) + i18n.global.t('date.d')},
        { value: 720, title: i18n.global.n(30) + i18n.global.t('date.d')},
      ],
      baseOptions: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        elements: {
          point: { pointStyle: 'circle', radius: 0, hitRadius: 10 },
          line: { tension: 0.3, borderWidth: 2 },
        },
        plugins: {
          tooltip: {
            callbacks: {
              footer: (items:any[]) => {
                return HumanReadable.sizeFormat(items.reduce((acc, c) => acc + c.raw, 0))
              }
            }
          }
        },
        scales: {
          y: {
            grid: {
              color: '#777777',
            },
            beginAtZero: true,
            ticks: {
              callback: function(label:any, index: number) {
                return label == 0 ? 0 : HumanReadable.sizeFormat(label,0)
              },
              count: 10
            }
          }
        }
      },
      usage: ref(<any>{}),
    }
  },
  computed: {
    options() {
      const onSurface = this.theme.current.colors['on-surface']
      const text = onSurface
      const gridY = '#888888'
      const gridX = onSurface
      return {
        ...this.baseOptions,
        plugins: {
          ...this.baseOptions.plugins,
          legend: { labels: { color: text } },
        },
        scales: {
          y: {
            ...this.baseOptions.scales.y,
            grid: { color: gridY },
            ticks: { ...this.baseOptions.scales.y.ticks, color: text },
          },
          x: {
            grid: { color: gridX },
            ticks: { color: text },
          },
        },
      }
    },
  },
  methods: {
    async loadData() {
      this.loading = true
      let params: any = { resource: this.resource, tag: this.tag }
      let span = this.limit
      if (this.limit === 0) {
        if (!this.rangeStart || !this.rangeEnd || this.rangeEnd <= this.rangeStart) {
          this.alert = true
          this.loaded = false
          this.loading = false
          return
        }
        params.start = this.rangeStart
        params.end = this.rangeEnd
        span = Math.max(1, Math.round((this.rangeEnd - this.rangeStart) / 3600))
      } else {
        params.limit = this.limit
      }
      const data = await HttpUtils.get('api/stats', params)
      if (data.success && data.obj.stats) {
        const {stats, bucketSpan, startTime} = data.obj
        const count = data.obj.numBuckets ?? 360
        const l = String(i18n.global.locale) == 'fa' ? "fa-IR" : "en-US"
        const labels = <string[]>[]
        const uplinkData = <(number|null)[]>[]
        const downlinkData = <(number|null)[]>[]
        for (let i = 0; i<count; i++) {
          const step = startTime + (i*bucketSpan)
          labels.push(this.genLable(step*1000,l,span))
          if (!stats[i]) {
            uplinkData.push(null)
            downlinkData.push(null)
          } else {
            uplinkData.push(stats[i][0])
            downlinkData.push(stats[i][1])
          }
        }
        this.usage = {
          labels: labels,
          datasets: [
            {
              label: i18n.global.t('stats.upload'),
              backgroundColor: 'rgba(255, 165, 0, 0.4)',
              borderColor: 'rgba(255, 165, 0)',
              fill: true,
              data: uplinkData
            },
            {
              label: i18n.global.t('stats.download'),
              backgroundColor: 'rgba(0, 128, 0, 0.2)',
              borderColor: 'rgba(0, 128, 0)',
              fill: true,
              data: downlinkData
            }
          ],
        }
        this.loaded = true
        this.alert = false
      } else {
        this.alert = true
        this.loaded = false
      }
      this.loading = false
    },
    selectPreset(v:number) {
      if (v === 0) {
        // Custom range mode: default to the last 24h, stop the live refresh
        if (!this.rangeStart || !this.rangeEnd) {
          const now = Math.floor(Date.now() / 1000)
          this.rangeEnd = now
          this.rangeStart = now - 86400
        }
        if (this.intervalId) {
          clearInterval(this.intervalId)
          this.intervalId = 0
        }
      } else if (!this.intervalId) {
        // Back to a preset: resume live mode
        this.intervalId = setInterval(() => { this.loadData() }, 10000)
      }
      this.loadData()
    },
    setRangeStart(v:number) {
      this.rangeStart = v
      this.loadData()
    },
    setRangeEnd(v:number) {
      this.rangeEnd = v
      this.loadData()
    },
    genLable(step:number, locale: string, limit: number) {
      return new Date(step).toLocaleString(locale,{
        month: limit < 480 ? undefined : '2-digit',
        day: limit < 24 ? undefined : '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    },
  },
  watch: {
    visible(v) {
      if (v) {
        this.limit = 1
        this.rangeStart = 0
        this.rangeEnd = 0
        this.loadData()
        this.intervalId = setInterval(() => {
          this.loadData()
        }, 10000)
      } else {
        this.loaded = false
        this.alert = false
        this.usage.labels = []
        if (this.usage.datasets) {
          this.usage.datasets[0].data = []
          this.usage.datasets[1].data = []
        }
        if (this.intervalId && this.intervalId != 0) {
          clearInterval(this.intervalId)
        }
      }
    }
  }
}
</script>