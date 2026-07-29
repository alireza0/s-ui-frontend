<template>
  <v-dialog v-model="visible" max-width="650px" persistent>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>{{ isEdit ? $t('node.edit') : $t('node.add') }}</span>
        <v-btn icon="mdi-close" variant="text" size="small" @click="close" />
      </v-card-title>
      <v-divider />

      <v-card-text>
        <v-form ref="formRef">
          <v-row density="compact">
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="node.name"
                :label="$t('node.name')"
                required
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="node.remark"
                :label="$t('node.remark')"
                variant="outlined"
                density="compact"
              />
            </v-col>

            <v-col cols="6" sm="3">
              <v-select
                v-model="node.scheme"
                :items="['http', 'https']"
                :label="$t('node.scheme')"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="node.address"
                :label="$t('node.address')"
                placeholder="1.2.3.4 or node.example.com"
                required
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="6" sm="3">
              <v-text-field
                v-model.number="node.port"
                :label="$t('node.port')"
                type="number"
                required
                variant="outlined"
                density="compact"
              />
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="node.basePath"
                :label="$t('node.basePath')"
                placeholder="/app/"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="node.apiToken"
                :label="$t('node.apiToken')"
                type="password"
                placeholder="Token generated on remote node"
                variant="outlined"
                density="compact"
              />
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="node.publicHost"
                :label="$t('node.publicHost')"
                placeholder="de.example.com (used for subscription links)"
                variant="outlined"
                density="compact"
              />
            </v-col>

            <v-col cols="12" sm="6">
              <v-select
                v-model="node.tlsVerifyMode"
                :items="[
                  { title: 'Verify TLS Certificate', value: 'verify' },
                  { title: 'Skip Verification (Self-signed)', value: 'skip' },
                  { title: 'Certificate Pinning (SHA-256)', value: 'pin' }
                ]"
                item-title="title"
                item-value="value"
                :label="$t('node.tlsVerifyMode')"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12" sm="6" v-if="node.tlsVerifyMode === 'pin'">
              <v-text-field
                v-model="node.pinnedCertSha256"
                :label="$t('node.pinnedCertSha256')"
                placeholder="SHA-256 fingerprint in hex or base64"
                variant="outlined"
                density="compact"
              />
            </v-col>

            <v-col cols="12" sm="6">
              <v-switch
                v-model="node.allowPrivateAddress"
                :label="$t('node.allowPrivate')"
                color="primary"
                density="compact"
                hide-details
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-switch
                v-model="node.enable"
                :label="$t('enable')"
                color="success"
                density="compact"
                hide-details
              />
            </v-col>
          </v-row>

          <v-alert v-if="probeResult" :type="probeResult.ok ? 'success' : 'error'" class="mt-3" density="compact" variant="tonal">
            <div class="d-flex align-center justify-space-between">
              <div>
                <strong>{{ probeResult.ok ? 'Connected!' : 'Connection Failed' }}</strong>
                <div v-if="probeResult.ok">Latency: {{ probeResult.latencyMs }}ms | Core: {{ probeResult.coreRunning ? 'Running' : 'Stopped' }}</div>
                <div v-else>{{ probeResult.error }}</div>
              </div>
            </div>
          </v-alert>
        </v-form>
      </v-card-text>

      <v-divider />
      <v-card-actions class="pa-3">
        <v-btn color="info" variant="tonal" :loading="testing" @click="testConnection">
          <v-icon prepend icon="mdi-network" class="mr-1" />
          {{ $t('node.test') }}
        </v-btn>
        <v-spacer />
        <v-btn variant="text" @click="close">{{ $t('reset') }}</v-btn>
        <v-btn color="primary" :loading="loading" @click="save">{{ $t('submit') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import Data from '@/store/modules/data'
import { Node, NodeProbeResult } from '@/types/nodes'

const props = defineProps<{
  modelValue: boolean
  editNode?: Node | null
}>()

const emit = defineEmits(['update:modelValue', 'saved'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const isEdit = computed(() => !!props.editNode && props.editNode.id > 0)
const loading = ref(false)
const testing = ref(false)
const probeResult = ref<NodeProbeResult | null>(null)

const defaultNode: Partial<Node> = {
  name: '',
  remark: '',
  scheme: 'http',
  address: '',
  port: 2095,
  basePath: '/app/',
  apiToken: '',
  publicHost: '',
  enable: true,
  allowPrivateAddress: true,
  tlsVerifyMode: 'skip',
  inboundSyncMode: 'selected',
}

const node = ref<Partial<Node>>({ ...defaultNode })

watch(() => props.editNode, (val) => {
  if (val) {
    node.value = { ...val }
  } else {
    node.value = { ...defaultNode }
  }
  probeResult.value = null
}, { immediate: true })

const close = () => {
  visible.value = false
}

const testConnection = async () => {
  testing.value = true
  probeResult.value = null
  try {
    const res = await Data().testNode(node.value)
    if (res && res.obj) {
      probeResult.value = res.obj
    } else {
      probeResult.value = { ok: false, error: res?.msg || 'Failed to connect', latencyMs: 0, statusCode: 0, coreRunning: false }
    }
  } catch (err: any) {
    probeResult.value = { ok: false, error: err.message || 'Network error', latencyMs: 0, statusCode: 0, coreRunning: false }
  } finally {
    testing.value = false
  }
}

const save = async () => {
  if (!node.value.name || !node.value.address) return
  loading.value = true
  try {
    const ok = await Data().saveNode(node.value)
    if (ok) {
      emit('saved')
      close()
    }
  } finally {
    loading.value = false
  }
}
</script>
