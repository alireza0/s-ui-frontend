<template>
  <NodeSpecEntry
    :visible="visible"
    :value="entry"
    :busy="busy"
    :loading="loading"
    :load-error="loadError"
    :error="error"
    :tls-profiles="tlsProfiles"
    @close="emit('close')"
    @reload="load"
    @save="save"
  >
    <v-expansion-panels
      v-if="value"
      class="mt-3"
    >
      <v-expansion-panel
        :title="$t('nodeUI.history')"
        @group:selected="loadHistory"
      >
        <v-expansion-panel-text>
          <v-select
            v-model="restoreVersion"
            :items="history.filter(row => row.version !== value?.version).map(row => ({
              title: $t('nodeUI.version')+' '+row.version+' · '+new Date(row.created*1000).toLocaleString(),
              value: row.version
            }))"
            :label="$t('nodeUI.restore')"
          />
          <v-btn
            color="primary"
            variant="tonal"
            :disabled="!restoreVersion||busy"
            @click="emit('restore', restoreVersion)"
          >
            {{ $t('nodeUI.restore') }}
          </v-btn>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </NodeSpecEntry>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Http from '@/plugins/httputil'
import type { NodeTemplate, NodeTLSProfile, SpecEntry, TemplateSpec } from '@/features/nodes/types/nodes'
import { emptySpec } from '@/features/nodes/types/nodeSpec'
import NodeSpecEntry from './NodeSpecEntry.vue'

const props = defineProps<{visible:boolean;value?:NodeTemplate;busy:boolean;error:string;tlsProfiles:NodeTLSProfile[]}>()
const emit = defineEmits<{ close:[]; save:[unknown]; restore:[number] }>()
const { t } = useI18n()
const entry = ref<SpecEntry>()
const spec = ref(emptySpec())
const loading = ref(false)
const loadError = ref('')
const history = ref<{version:number;created:number}[]>([])
const restoreVersion = ref(0)
let ticket = 0

watch(() => props.visible, visible => {
  ticket++
  if (!visible) return
  entry.value = undefined
  spec.value = emptySpec()
  history.value = []
  restoreVersion.value = 0
  void load()
})

async function load() {
  const version = ++ticket
  loadError.value = ''
  loading.value = !!props.value
  if (!props.value) return
  try {
    const result = await Http.get<{spec:TemplateSpec}>('api/node-template-version', {id:props.value.id!})
    if (version !== ticket) return
    if (!result.success || result.obj.spec.entries.length !== 1) {
      loadError.value = t('nodeUI.loadTemplateFailed')
      return
    }
    spec.value = result.obj.spec
    entry.value = result.obj.spec.entries[0]
  } catch {
    if (version === ticket) loadError.value = t('nodeUI.loadTemplateFailed')
  } finally {
    if (version === ticket) loading.value = false
  }
}

async function loadHistory() {
  if (!props.value) return
  const version = ticket
  try {
    const result = await Http.get<typeof history.value>('api/node-template-history', {id:props.value.id!})
    if (version === ticket && result.success) history.value = result.obj
  } catch {
    if (version === ticket) loadError.value = t('nodes.loadFailed')
  }
}

function save(value: SpecEntry) {
  emit('save', {id:props.value?.id, name:value.name, kind:'inbound', expected_version:props.value?.version ?? 0, spec:{...spec.value, entries:[value]}})
}
</script>
