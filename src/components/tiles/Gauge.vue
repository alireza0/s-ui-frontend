<script lang="ts" setup>
import { HumanReadable } from '@/plugins/utils'
import { computed } from 'vue'

// One resource reading. Memory, disk and swap report a pair; cpu is a percent.
interface Usage {
  current: number
  total: number
}

interface TilesData {
  cpu?: number
  mem?: Usage
  dsk?: Usage
  swp?: Usage
}

// A gauge shows either a single label (cpu, or the empty dash) or a
// current-over-total pair, each number carrying its own unit suffix.
interface GaugeReading {
  percent: number
  text?: string
  pair?: {
    current: string
    currentUnit: string
    total: string
    totalUnit: string
  }
}

const props = defineProps<{
  tilesData: TilesData
  type: string
}>()

const gaugeData = (d?: Usage): GaugeReading => {
  if (!d) return { percent: 0, text: '-' }
  const curr = HumanReadable.sizeFormat(d.current, 0).split(' ')
  const total = HumanReadable.sizeFormat(d.total, 0).split(' ')
  if (curr[1] == total[1]) curr[1] = ''
  return {
    percent: Math.ceil(d.current * 100 / d.total),
    pair: {
      current: curr[0],
      currentUnit: curr[1] ?? ' ',
      total: total[0],
      totalUnit: total[1] ?? '',
    }
  }
}

const data = computed((): GaugeReading => {
  const d = props.tilesData
  if (!d.mem && !d.cpu) return { percent: 0, text: '-' }
  switch (props.type) {
    case 'g-cpu':
      return { percent: d.cpu ?? 0, text: Math.ceil(d.cpu ?? 0) + "%" }
    case 'g-mem':
      return gaugeData(d.mem)
    case 'g-dsk':
      return gaugeData(d.dsk)
    case 'g-swp':
      return gaugeData(d.swp)
  }
  return { percent: 0, text: '-'}
})

const cssTransformRotateValue = computed(() => {
  const percentageAsFraction = data.value.percent / 100
  const halfPercentage = percentageAsFraction / 2

  return `${halfPercentage}turn`
})

const gaugeColor = computed(() => {
  if (data.value.percent > 90) return 'error'
  if (data.value.percent > 70) return 'warning'
  return 'info'
})
</script>

<template>
  <div class="gauge__outer">
    <div class="gauge__inner">
      <div
        class="gauge__fill" 
        :style="{ 
          transform: `rotate(${cssTransformRotateValue})`,
          background: `rgb(var(--v-theme-${gaugeColor}))`
        }"
      />
      <div class="gauge__cover">
        <span dir="ltr">
          <template v-if="data.pair">
            {{ data.pair.current }}<sup>{{ data.pair.currentUnit }}</sup>/{{ data.pair.total }}<sup>{{ data.pair.totalUnit }}</sup>
          </template>
          <template v-else>{{ data.text }}</template>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gauge__outer {
  width: 100%;
  max-width: 250px;
}

.gauge__inner {
  width: 100%;
  height: 0;
  padding-bottom: 50%;
  background: rgb(var(--v-theme-surface));
  position: relative;
  border-top-left-radius: 100% 200%;
  border-top-right-radius: 100% 200%;
  overflow: hidden;
}

.gauge__fill {
  position: absolute;
  top: 100%;
  left: 0;
  width: inherit;
  height: 100%;
  background: rgb(var(--v-theme-primary));
  transform-origin: center top;
  transform: rotate(0turn);
  transition: transform 0.2s ease-out;
}

.gauge__cover {
  width: 75%;
  height: 150%;
  background: rgb(var(--v-theme-background));
  position: absolute;
  top: 25%;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 50%;

  /* Text */
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 25%;
  box-sizing: border-box;
  font-weight: bold;
  font-size: 32px;
}

sup {
  font-size: 16px;
}
</style>
