<template>
  <v-card subtitle="URL Test">
    <v-row>
      <v-col
        cols="12"
        sm="6"
      >
        <v-combobox
          v-model="data.outbounds"
          :items="tags"
          :label="$t('pages.outbounds')"
          multiple
          chips
          hide-details
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col
        v-if="optionUrl"
        cols="12"
        sm="6"
      >
        <v-text-field
          v-model="data.url"
          :label="$t('types.lb.testUrl')"
          hide-details
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col
        v-if="optionInterval"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model.number="interval"
          :label="$t('types.lb.interval')"
          hide-details
          type="number"
          min="3"
          :suffix="$t('date.s')"
        />
      </v-col>
      <v-col
        v-if="optionTolerance"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model.number="tolerance"
          :label="$t('types.lb.tolerance')"
          hide-details
          type="number"
          min="0"
          :suffix="$t('date.ms')"
        />
      </v-col>
      <v-col
        v-if="optionIdle"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model.number="idle_timeout"
          :label="$t('transport.idleTimeout')"
          hide-details
          type="number"
          min="0"
          :suffix="$t('date.m')"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col
        cols="12"
        sm="6"
      >
        <v-switch
          v-model="data.interrupt_exist_connections"
          color="primary"
          :label="$t('types.lb.interruptConn')"
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
            {{ $t('types.lb.urlTestOptions') }}
          </v-btn>
        </template>
        <v-card>
          <v-list>
            <v-list-item>
              <v-switch
                v-model="optionUrl"
                color="primary"
                :label="$t('types.lb.testUrl')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionInterval"
                color="primary"
                :label="$t('types.lb.interval')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionTolerance"
                color="primary"
                :label="$t('types.lb.tolerance')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionIdle"
                color="primary"
                :label="$t('transport.idleTimeout')"
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
import { Outbound } from '@/types/outbounds'

// Only the URLTest outbound fields this form reads or writes.
interface UrlTestData {
  outbounds?: string[]
  url?: string
  interval?: string
  tolerance?: number
  idle_timeout?: string
  interrupt_exist_connections?: boolean
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<Outbound>('data', { required: true })

// The parent holds a union and picks this component with a v-if on the type,
// which the template checker cannot follow, so narrow once here. The computed
// returns the same object, so edits still reach the parent.
const data = computed(() => model.value as unknown as UrlTestData)

defineProps<{
  tags: string[]
}>()

const menu = ref(false)

const optionUrl = computed({
  get: (): boolean => data.value.url != undefined,
  set: (v:boolean) => { data.value.url = v ? 'https://www.gstatic.com/generate_204' : undefined },
})

const optionInterval = computed({
  get: (): boolean => data.value.interval != undefined,
  set: (v:boolean) => { data.value.interval = v ? '3s' : undefined },
})

const optionTolerance = computed({
  get: (): boolean => data.value.tolerance != undefined,
  set: (v:boolean) => { data.value.tolerance = v ? 50 : undefined },
})

const optionIdle = computed({
  get: (): boolean => data.value.idle_timeout != undefined,
  set: (v:boolean) => { data.value.idle_timeout = v ? '30m' : undefined },
})

const interval = computed({
  get: (): number => data.value.interval ? parseInt(data.value.interval.replace('s','')) : 3,
  set: (v:number) => { data.value.interval = v > 0 ? v + 's' : '3s' },
})

const tolerance = computed({
  get: (): number => data.value.tolerance ? parseInt(String(data.value.tolerance)) : 0,
  set: (v:number) => { data.value.tolerance = v > 0 ? v : 0 },
})

const idle_timeout = computed({
  get: (): number => data.value.idle_timeout ? parseInt(data.value.idle_timeout.replace('m','')) : 30,
  set: (v:number) => { data.value.idle_timeout = v > 0 ? v + 'm' : '0m' },
})
</script>
