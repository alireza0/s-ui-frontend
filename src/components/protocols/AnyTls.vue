<template>
  <v-card>
    <v-card-subtitle v-if="direction != 'out_json'">
      AnyTls
    </v-card-subtitle>
    <v-row v-if="direction == 'in'">
      <v-col
        cols="12"
        sm="8"
      >
        <v-textarea
          v-model="padding_scheme"
          label="Padding scheme"
          auto-grow
          hide-details
        />
        <v-btn-toggle
          :model-value="schemeMode"
          mandatory
          density="compact"
          variant="outlined"
          class="mt-3"
        >
          <v-btn
            value="default"
            size="small"
            @click="useDefaultScheme"
          >
            {{ $t('types.anytls.paddingDefault') }}
          </v-btn>
          <v-btn
            value="random"
            size="small"
            @click="useRandomScheme"
          >
            {{ $t('types.anytls.paddingRandom') }}
          </v-btn>
        </v-btn-toggle>
      </v-col>
    </v-row>
    <v-row v-else>
      <v-col
        v-if="direction == 'out'"
        cols="12"
        sm="8"
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
        <v-text-field
          v-model.number="idleInterval"
          :label="$t('types.anytls.idleInterval')"
          type="number"
          min="0"
          hide-details
          :suffix="$t('date.s')"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model.number="idleTimeout"
          :label="$t('types.anytls.idleTimeout')"
          type="number"
          min="0"
          hide-details
          :suffix="$t('date.s')"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model.number="minIdle"
          :label="$t('types.anytls.minIdle')"
          type="number"
          min="0"
          hide-details
        />
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Inbound } from '@/types/inbounds'
import { Outbound } from '@/types/outbounds'
import { DefaultPaddingScheme, generatePaddingScheme, isDefaultPaddingScheme } from '@/plugins/paddingScheme'

// One form serves both directions: the inbound side carries the padding
// scheme, the outbound side the password and the idle session tuning.
interface AnyTlsData {
  padding_scheme?: string[]
  password?: string
  idle_session_check_interval?: string
  idle_session_timeout?: string
  min_idle_session?: number
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<Inbound | Outbound>('data', { required: true })

// The parent holds a union and picks this component with a v-if on the type,
// which the template checker cannot follow, so narrow once here. The computed
// returns the same object, so edits still reach the parent.
const data = computed(() => model.value as unknown as AnyTlsData)

defineProps<{
  direction: 'in' | 'out' | 'out_json'
}>()

const padding_scheme = computed({
  get: (): string => {
    const scheme = data.value.padding_scheme
    return scheme && scheme.length > 0 ? scheme.join("\n") : ''
  },
  set: (v: string) => { data.value.padding_scheme = v.length > 0 ? v.split("\n") : undefined },
})

// The scheme switch under the textarea. Its state is derived from the text:
// the library default reads as "default", anything else as "random".
// Picking a side rewrites the text -- default restores the library scheme,
// random rolls a fresh generated one -- and the textarea stays editable
// either way, so a hand-tuned scheme is just a scheme that is not default.
const schemeMode = computed(() => (isDefaultPaddingScheme(data.value.padding_scheme) ? 'default' : 'random'))
const useDefaultScheme = () => { data.value.padding_scheme = [...DefaultPaddingScheme] }
const useRandomScheme = () => { data.value.padding_scheme = generatePaddingScheme() }

const idleInterval = computed({
  get: (): number => {
    const v = data.value.idle_session_check_interval
    return v && v.length > 0 ? parseInt(v.replace('s', '')) : 30
  },
  set: (v: number) => { data.value.idle_session_check_interval = v && v >= 0 ? `${v}s` : undefined },
})

const idleTimeout = computed({
  get: (): number => {
    const v = data.value.idle_session_timeout
    return v && v.length > 0 ? parseInt(v.replace('s', '')) : 30
  },
  set: (v: number) => { data.value.idle_session_timeout = v && v >= 0 ? `${v}s` : undefined },
})

const minIdle = computed({
  get: (): number => data.value.min_idle_session != undefined ? data.value.min_idle_session : 0,
  set: (v: number) => { data.value.min_idle_session = v > 0 ? v : undefined },
})
</script>
