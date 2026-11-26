<template>
  <v-dialog
    :model-value="visible"
    width="800"
    scrollable
    transition="dialog-bottom-transition"
    :persistent="busy"
    @update:model-value="!$event&&emit('close')"
  >
    <v-card
      rounded="lg"
      :loading="busy"
    >
      <v-card-title class="flex-shrink-0">
        {{ $t('nodeUI.domainTLS') }} · {{ node.name }}
      </v-card-title>
      <v-divider class="flex-0-0-auto" />
      <v-tabs
        v-model="tab"
        density="compact"
        class="flex-shrink-0"
        fixed-tabs
        align-tabs="center"
      >
        <v-tab value="domain">
          {{ $t('setting.domain') }}
        </v-tab><v-tab
          value="cert"
          :disabled="!currentDomain"
        >
          {{ $t('tls.cert') }}
        </v-tab>
      </v-tabs>
      <v-card-text class="py-0 px-4">
        <v-container>
          <template v-if="tab==='domain'">
            <v-select
              v-model="domain.mode"
              :label="$t('nodeUI.dnsMode')"
              :items="[{title:$t('nodeUI.managedDNS'),value:'managed'},{title:$t('nodeUI.manualDNS'),value:'manual'}]"
            />
            <template v-if="domain.mode==='managed'">
              <v-select
                :model-value="domain.profile_id || null"
                :items="resources.dnsprofiles.map(p=>({title:p.name,value:p.id}))"
                :label="$t('nodeUI.dnsProfile')"
                @update:model-value="domain.profile_id = $event ?? 0; domain.zone_id = ''"
              />
              <v-btn
                v-if="!resources.dnsprofiles.length"
                class="mb-3"
                variant="text"
                @click="emit('profiles')"
              >
                {{ $t('nodeUI.addProfile') }}
              </v-btn>
              <v-select
                v-model="domain.zone_id"
                :items="zones.map(z=>({title:z.name,value:z.id}))"
                :label="$t('nodeUI.zone')"
              />
              <v-switch
                v-model="domain.automatic_prefix"
                color="primary"
                :label="$t('nodeUI.randomPrefix')"
              />
              <v-text-field
                v-if="!domain.automatic_prefix"
                v-model="domain.prefix"
                :label="$t('nodeUI.prefix')"
                :suffix="zones.find(z=>z.id===domain.zone_id)?.name"
              />
            </template>
            <v-text-field
              v-else
              v-model="domain.fqdn"
              :label="$t('setting.domain')"
            />
            <v-text-field
              v-model="domain.ip"
              :label="$t('nodeUI.dnsIP')"
            />
            <v-select
              v-model="domain.certificate_mode"
              :label="$t('nodeUI.certificateMode')"
              :items="certModes"
            />
            <p
              v-if="currentDomain"
              class="text-body-2 mt-3"
            >
              {{ $t('nodeUI.savedDomain') }}: {{ currentDomain.fqdn }} · {{ status(currentDomain.state) }}
            </p>
            <v-alert
              v-if="currentDomain?.last_error"
              type="error"
              variant="tonal"
              class="mt-3"
            >
              {{ message(currentDomain.last_error) }}
            </v-alert>
          </template>
          <template v-else>
            <p class="text-body-2 mb-4">
              {{ currentDomain?.fqdn }}
            </p>
            <v-select
              v-model="cert.mode"
              :label="$t('nodeUI.certificateMode')"
              :items="certModes"
            />
            <template v-if="cert.mode==='auto'">
              <v-select
                :model-value="cert.dns_profile_id || null"
                clearable
                :items="resources.dnsprofiles.map(p=>({title:p.name,value:p.id}))"
                :label="$t('nodeUI.optionalDNS01')"
                @update:model-value="cert.dns_profile_id = $event ?? 0; cert.zone_id = ''"
              />
              <v-select
                v-if="cert.dns_profile_id"
                v-model="cert.zone_id"
                :items="certZones.map(z=>({title:z.name,value:z.id}))"
                :label="$t('nodeUI.zone')"
              />
              <v-text-field
                v-model="cert.email"
                :label="$t('nodeUI.acmeEmail')"
                type="email"
              />
            </template>
            <template v-if="cert.mode==='provided'">
              <v-textarea
                v-model="pem"
                :label="$t('tls.cert')"
                :spellcheck="false"
                rows="5"
              /><v-textarea
                v-model="key"
                :label="$t('tls.key')"
                :spellcheck="false"
                rows="4"
                autocomplete="off"
              />
            </template>
            <template v-if="cert.mode==='remote_paths'">
              <v-text-field
                v-model="cert.certificate_path"
                :label="$t('tls.certPath')"
              /><v-text-field
                v-model="cert.key_path"
                :label="$t('tls.keyPath')"
              />
            </template>
            <div
              v-if="currentCert"
              class="text-body-2 mt-3"
            >
              <p>{{ $t('nodeUI.installed') }}: {{ status(currentCert.state) }}</p><p v-if="currentCert.metadata?.not_after">
                {{ $t('nodeUI.expires') }}: {{ new Date(currentCert.metadata.not_after*1000).toLocaleString() }}
              </p><p>{{ $t('nodeUI.delivery') }}: {{ currentCert.applied_revision }} / {{ currentCert.desired_revision }}</p>
            </div>
            <v-alert
              v-if="currentCert?.last_error"
              type="error"
              variant="tonal"
              class="mt-3"
            >
              {{ message(currentCert.last_error) }}
            </v-alert>
            <v-btn
              v-if="['dns01','http01'].includes(currentCert?.mode??'')"
              class="mt-3"
              variant="outlined"
              :disabled="busy"
              @click="renew"
            >
              {{ $t('nodeUI.renew') }}
            </v-btn>
          </template>
          <v-alert
            v-if="error"
            type="error"
            variant="tonal"
            class="mt-3"
          >
            {{ error }}
          </v-alert>
          <v-alert
            v-if="saved"
            type="success"
            variant="tonal"
            class="mt-3"
          >
            {{ $t('nodeUI.intentSaved') }}
          </v-alert>
        </v-container>
      </v-card-text><v-card-actions class="pt-0">
        <v-spacer /><v-btn
          color="primary"
          variant="outlined"
          :disabled="busy"
          @click="emit('close')"
        >
          {{ $t('actions.close') }}
        </v-btn><v-btn
          color="primary"
          variant="tonal"
          :disabled="busy||!valid"
          :loading="busy"
          @click="save"
        >
          {{ $t('actions.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { nodeErrorCode } from '@/features/nodes/types/nodeErrors'
import type { NodeRecord, ResourceBundle } from '@/features/nodes/types/nodes'
import Nodes from '@/features/nodes/state/nodes'
import { clone } from '@/features/nodes/types/nodeSpec'
import { isPublishedAddress } from '@/features/nodes/types/nodeForms'
const props = defineProps<{ visible: boolean; node: NodeRecord; resources: ResourceBundle }>(),
  emit = defineEmits<{ close: []; profiles: [] }>(),
  store = Nodes(),
  { t, te } = useI18n()
const domainVersion = ref(0),
  certVersion = ref(0)
const tab = ref('domain'),
  busy = ref(false),
  error = ref(''),
  saved = ref(false),
  pem = ref(''),
  key = ref('')
const domain = ref({
    mode: 'managed',
    profile_id: 0,
    zone_id: '',
    prefix: '',
    automatic_prefix: true,
    fqdn: '',
    ip: '',
    certificate_mode: 'auto',
  }),
  cert = ref({ mode: 'auto', email: '', dns_profile_id: 0, zone_id: '', certificate_path: '', key_path: '' })
const currentDomain = computed(() => props.resources.domains.find((d) => d.node_id === props.node.id)),
  currentCert = computed(() => props.resources.certificates.find((c) => c.node_id === props.node.id))
const certModes = computed(() => [
  { title: t('nodeUI.automatic'), value: 'auto' },
  { title: t('nodeUI.provided'), value: 'provided' },
  { title: t('nodeUI.nodeFiles'), value: 'remote_paths' },
])
const zones = computed(
    () => props.resources.dnsprofiles.find((p) => p.id === domain.value.profile_id)?.zones ?? [],
  ),
  certZones = computed(
    () => props.resources.dnsprofiles.find((p) => p.id === cert.value.dns_profile_id)?.zones ?? [],
  )
watch(
  () => props.visible,
  (v) => {
    if (!v) {
      pem.value = ''
      key.value = ''
      return
    }
    tab.value = 'domain'
    error.value = ''
    saved.value = false
    const d = currentDomain.value,
      c = currentCert.value
    domainVersion.value = d?.generation ?? 0
    certVersion.value = c?.generation ?? 0
    domain.value = {
      mode: d?.mode ?? 'managed',
      profile_id: d?.profile_id ?? 0,
      zone_id: d?.zone_id ?? '',
      prefix: d?.prefix ?? '',
      automatic_prefix: d?.automatic_prefix ?? true,
      fqdn: d?.fqdn ?? '',
      ip: d?.ip ?? store.installations.find((i) => i.node_id === props.node.id)?.ip ?? '',
      certificate_mode: d?.certificate_mode ?? 'auto',
    }
    cert.value = {
      mode: c && ['provided', 'remote_paths'].includes(c.mode) ? c.mode : 'auto',
      email: c?.email ?? '',
      dns_profile_id: c?.dns_profile_id ?? 0,
      zone_id: c?.zone_id ?? '',
      certificate_path: c?.certificate_path ?? '',
      key_path: c?.key_path ?? '',
    }
    pem.value = ''
    key.value = ''
  },
  { immediate: true },
)
const valid = computed(() => {
  if (tab.value === 'domain') {
    const dnsReady =
      domain.value.mode === 'managed'
        ? !!domain.value.profile_id &&
          !!domain.value.zone_id &&
          (domain.value.automatic_prefix || !!domain.value.prefix.trim())
        : !!domain.value.fqdn.trim()
    return !!domain.value.ip && isPublishedAddress(domain.value.ip) && dnsReady
  }
  if (cert.value.mode === 'provided') return !!pem.value.trim() && !!key.value.trim()
  if (cert.value.mode === 'remote_paths')
    return cert.value.certificate_path.startsWith('/') && cert.value.key_path.startsWith('/')
  return !cert.value.dns_profile_id || !!cert.value.zone_id
})
function message(raw: string) {
  const code = nodeErrorCode(raw)
  return te('nodeUI.errors.' + code)
    ? t('nodeUI.errors.' + code)
    : t('nodeUI.operationFailed') + ' (' + code + ')'
}
function status(value: string) {
  return te('nodeUI.states.' + value) ? t('nodeUI.states.' + value) : value
}
async function save() {
  busy.value = true
  error.value = ''
  saved.value = false
  try {
    const isDomain = tab.value === 'domain'
    const data = isDomain
      ? { ...clone(domain.value), node_id: props.node.id, expected_version: domainVersion.value }
      : {
          ...clone(cert.value),
          node_id: props.node.id,
          expected_version: certVersion.value,
          ca: 'letsencrypt',
          certificate: pem.value,
          key: key.value,
        }
    if (await store.resource(isDomain ? 'domains' : 'certificates', 'save', data)) {
      saved.value = true
      domainVersion.value = currentDomain.value?.generation ?? domainVersion.value
      certVersion.value = currentCert.value?.generation ?? certVersion.value
      if (isDomain) {
        cert.value.mode = domain.value.certificate_mode
        tab.value = 'cert'
      } else {
        pem.value = ''
        key.value = ''
      }
    } else error.value = message(store.lastSaveError)
  } finally {
    busy.value = false
  }
}
async function renew() {
  busy.value = true
  try {
    if (
      !(await store.resource('certificates', 'renew', {
        node_id: props.node.id,
        expected_version: certVersion.value,
      }))
    )
      error.value = message(store.lastSaveError)
    else {
      saved.value = true
      certVersion.value = currentCert.value?.generation ?? certVersion.value
    }
  } finally {
    busy.value = false
  }
}
</script>
