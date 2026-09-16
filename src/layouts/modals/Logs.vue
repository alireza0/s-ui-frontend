<template>
  <v-dialog
    transition="dialog-bottom-transition"
    width="90%"
    max-width="1200"
    :loading="loading"
  >
    <v-card class="rounded-lg">
      <v-card-title>
        <v-row>
          <v-col>{{ $t('basic.log.title') }}</v-col>
          <v-spacer />
          <v-col cols="auto">
            <v-icon
              icon="mdi-close"
              @click="model.visible = false"
            />
          </v-col>
        </v-row>
      </v-card-title>
      <v-divider />
      <v-card-text>
        <v-row>
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-select
              v-model="logLevel"
              hide-details
              :label="$t('basic.log.level')"
              :items="logLevels"
              @update:model-value="loadData"
            />
          </v-col>
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-select
              v-model.number="logCount"
              hide-details
              :label="$t('count')"
              :items="[10,20,30,50,100]"
              @update:model-value="loadData"
            />
          </v-col>
          <v-col
            cols="auto"
            align="center"
            justify="center"
          >
            <v-btn
              icon="mdi-refresh"
              variant="tonal"
              :loading="loading"
              @click="loadData"
            >
              <v-icon />
            </v-btn>
          </v-col>
        </v-row>
        <!-- Text, not v-html. These are sing-box log lines, and they quote
             values that come from whoever connected: a hostname, an SNI, a
             URL. Rendering them as markup let anyone who could reach a proxy
             port put script into the operator's browser. -->
        <v-card
          style="margin-top: .5rem;"
          color="background"
          dir="ltr"
        >
          <pre class="log-lines">{{ lines.join('\n') }}</pre>
        </v-card>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import HttpUtils from '@/plugins/httputil'

// The dialog handle the parent owns and this modal closes.
interface ModalControl {
  visible: boolean
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<ModalControl>('control', { required: true })

const props = defineProps<{
  visible: boolean
}>()

const loading = ref(false)
const lines = ref<string[]>([])
const logLevel = ref('info')
const logLevels = [
  { title: 'DEBUG', value: 'debug' },
  { title: 'INFO', value: 'info' },
  { title: 'WARNING', value: 'warning' },
  { title: 'ERROR', value: 'err' },
]
const logCount = ref(10)

watch(() => props.visible, (v) => {
  lines.value = []
  logLevel.value = 'info'
  logCount.value = 10
  if (v) {
    loadData()
  }
})

async function loadData() {
  loading.value = true
  const data = await HttpUtils.get<string[]>('api/logs',{ c: logCount.value, l: logLevel.value })
  if (data.success) {
    lines.value = data.obj?? []
    loading.value = false
  }
}
</script>

<style scoped>
.log-lines {
  margin: 0;
  padding: .5rem;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-family: monospace;
  font-size: .8rem;
}
</style>
