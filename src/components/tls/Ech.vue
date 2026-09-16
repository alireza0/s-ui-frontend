<template>
  <v-card
    subtitle="ECH"
    style="background-color: inherit;"
  >
    <v-row>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-switch
          v-model="enabled"
          color="primary"
          :label="$t('enable')"
          hide-details
        />
      </v-col>
    </v-row>
    <template v-if="enabled">
      <v-row>
        <v-col cols="auto">
          <v-btn-toggle
            v-model="useEchPath"
            class="rounded-xl"
            density="compact"
            variant="outlined"
            shaped
            mandatory
          >
            <v-btn
              @click="delete ech.key"
            >
              {{ $t('tls.usePath') }}
            </v-btn>
            <v-btn
              @click="delete ech.key_path"
            >
              {{ $t('tls.useText') }}
            </v-btn>
          </v-btn-toggle>
        </v-col>
        <v-spacer />
        <v-col cols="auto">
          <v-btn
            variant="tonal"
            density="compact"
            icon="mdi-key-star"
            :loading="loading"
            @click="genECH"
          >
            <v-icon />
            <v-tooltip
              activator="parent"
              location="top"
            >
              {{ $t('actions.generate') }}
            </v-tooltip>
          </v-btn>
        </v-col>
      </v-row>
      <v-row v-if="useEchPath == 0">
        <v-col cols="12">
          <v-text-field
            v-model="ech.key_path"
            :label="$t('tls.keyPath')"
            hide-details
          />
        </v-col>
      </v-row>
      <v-row v-else>
        <v-col cols="12">
          <v-textarea
            v-model="echKeyText"
            :label="$t('tls.key')"
            hide-details
          />
        </v-col>
      </v-row>
      <v-row>
        <v-col
          v-if="oTls.ech"
          cols="12"
          sm="6"
        >
          <v-text-field
            v-model="oTls.ech.query_server_name"
            :label="$t('tls.queryServerName')"
            hide-details
            placeholder="ech.example.com"
          />
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12">
          <v-textarea
            v-model="echConfigText"
            :label="$t('tls.cert')"
            hide-details
          />
        </v-col>
      </v-row>
    </template>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { i18n } from '@/locales'
import HttpUtils from '@/plugins/httputil'
import { iTls as ITlsOptions, oTls as OTlsOptions } from '@/types/tls'
import { push } from 'notivue'

// Only the ECH fields this form reads or writes on the server half of a TLS
// config.
interface EchInTls {
  server_name?: string
  ech?: {
    enabled: boolean
    key?: string[]
    key_path?: string
  }
}

// The matching client half: it carries the published config rather than the
// key.
interface EchOutTls {
  ech?: {
    enabled?: boolean
    config?: string[]
    query_server_name?: string
  }
}

// The parent owns both objects and this component edits them in place, so they
// are models rather than plain props.
const iTlsModel = defineModel<ITlsOptions>('iTls', { required: true })
const oTlsModel = defineModel<OTlsOptions>('oTls', { required: true })

// Narrow once to the fields this form touches. The computeds return the same
// objects, so edits still reach the parent.
const iTls = computed(() => iTlsModel.value as unknown as EchInTls)
const oTls = computed(() => oTlsModel.value as unknown as EchOutTls)

const useEchPath = ref(iTls.value?.ech?.key ? 1 : 0)
const loading = ref(false)

const ech = computed(() => iTls.value.ech as NonNullable<EchInTls['ech']>)
// The client half is written whenever the server half is, so it is present
// wherever this form is shown.
const oEch = computed(() => oTls.value.ech as NonNullable<EchOutTls['ech']>)

const enabled = computed({
  get: (): boolean => ech.value?.enabled ?? false,
  set: (v: boolean) => {
    iTls.value.ech = v ? { enabled: true } : undefined
    oTls.value.ech = v ? {} : undefined
  },
})

const echKeyText = computed({
  get: (): string => ech.value?.key ? ech.value.key.join('\n') : '',
  set: (newValue: string) => { ech.value.key = newValue.split('\n') },
})

const echConfigText = computed({
  get: (): string => oTls.value.ech?.config ? oTls.value.ech.config.join('\n') : '',
  set: (newValue: string) => { oEch.value.config = newValue.split('\n') },
})

async function genECH() {
  loading.value = true
  // The endpoint answers with the generated PEM blocks, one line per entry.
  const msg = await HttpUtils.get<string[]>('api/keypairs', {
    k: "ech",
    o: iTls.value.server_name ?? "''"
  })
  loading.value = false
  if (msg.success && iTls.value.ech && oTls.value.ech) {
    iTls.value.ech.key_path = undefined
    useEchPath.value = 1
    if (msg.obj.length > 0) {
      let config = <string[]>[]
      let key = <string[]>[]
      let isConfig = false
      let isKey = false

      msg.obj.forEach((line: string) => {
        if (line === "-----BEGIN ECH CONFIGS-----") {
          isConfig = true
          isKey = false
          config.push(line)
        } else if (line === "-----END ECH CONFIGS-----") {
          isConfig = false
          config.push(line)
        } else if (line === "-----BEGIN ECH KEYS-----") {
          isKey = true
          isConfig = false
          key.push(line)
        } else if (line === "-----END ECH KEYS-----") {
          isKey = false
          key.push(line)
        } else if (isConfig) {
          config.push(line)
        } else if (isKey) {
          key.push(line)
        }
      })
      iTls.value.ech.key = key ?? undefined
      oTls.value.ech.config = config ?? undefined

    } else {
      push.error({
        message: i18n.global.t('error') + ": " + msg.obj
      })
    }
  }
}
</script>
