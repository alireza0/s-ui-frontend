<template>
  <v-dialog
    :model-value="visible"
    width="800"
    scrollable
    transition="dialog-bottom-transition"
    :persistent="busy"
    @update:model-value="!$event && emit('close')"
    @after-leave="emit('closed')"
  >
    <v-card
      class="rounded-lg"
      :loading="busy"
    >
      <v-card-title>{{ $t(recover?'nodeOnboarding.recover':node?'nodeOnboarding.access':'nodes.addNode') }}</v-card-title>
      <v-divider />
      <v-card-text class="py-0 px-4">
        <v-container>
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="form.name"
                :label="$t('nodeOnboarding.name')"
                maxlength="80"
                autocomplete="off"
              />
            </v-col>
            <v-col
              cols="12"
              sm="8"
            >
              <v-text-field
                v-model="form.ip"
                :label="$t('nodeOnboarding.ip')"
                placeholder="203.0.113.10"
                autocomplete="off"
              />
            </v-col>
            <v-col
              cols="12"
              sm="4"
            >
              <v-text-field
                v-model.number="form.ssh_port"
                :label="$t('nodeOnboarding.port')"
                type="number"
                min="1"
                max="65535"
              />
            </v-col>
            <v-col
              cols="12"
              sm="5"
            >
              <v-text-field
                v-model="form.ssh_user"
                :label="$t('nodeOnboarding.user')"
                autocomplete="off"
              />
            </v-col>
            <v-col
              cols="12"
              sm="7"
            >
              <v-text-field
                v-model="form.password"
                :label="$t(node&&!form.replace_host_key?'nodeOnboarding.optionalPassword':'nodeOnboarding.password')"
                type="password"
                autocomplete="new-password"
              />
            </v-col>
          </v-row>
          <v-checkbox
            v-if="recover"
            v-model="form.replace_host_key"
            :label="$t('nodeOnboarding.replaceHostKey')"
            hide-details
          />
          <template v-if="!node">
            <v-select
              v-model="selectedTemplates"
              :items="templateItems"
              :label="$t('nodeUI.inboundTemplates')"
              :loading="templateLoading"
              class="mt-4"
              multiple
              chips
              closable-chips
              @update:model-value="loadTemplates"
            />
            <template v-if="needsDomain">
              <v-divider class="my-4" />
              <v-select
                v-model="domain.mode"
                :label="$t('nodeUI.dnsMode')"
                :items="[{title:$t('nodeUI.managedDNS'),value:'managed'},{title:$t('nodeUI.manualDNS'),value:'manual'}]"
              />
              <template v-if="domain.mode==='managed'">
                <v-btn
                  v-if="!profiles.length"
                  variant="text"
                  class="mb-3"
                  @click="emit('profiles')"
                >
                  {{ $t('nodeUI.addProfile') }}
                </v-btn>
                <v-select
                  :model-value="domain.profile_id || null"
                  :items="profiles.map(p=>({title:p.name,value:p.id}))"
                  :label="$t('nodeUI.dnsProfile')"
                  @update:model-value="domain.profile_id = $event ?? 0; selectZone()"
                />
                <v-select
                  v-model="domain.zone_id"
                  :items="zones.map(z=>({title:z.name,value:z.id}))"
                  :label="$t('nodeUI.zone')"
                />
                <v-switch
                  v-model="domain.automatic_prefix"
                  color="primary"
                  :label="$t('nodeOnboarding.random')"
                />
                <v-text-field
                  v-if="!domain.automatic_prefix"
                  v-model="domain.prefix"
                  :label="$t('nodeOnboarding.prefix')"
                  :suffix="zones.find(z=>z.id===domain.zone_id)?.name"
                />
              </template>
              <v-text-field
                v-else
                v-model="domain.fqdn"
                :label="$t('nodeOnboarding.fqdn')"
              />
              <v-select
                v-model="domain.certificate_mode"
                class="mt-3"
                :label="$t('nodeUI.certificateMode')"
                :items="[{title:$t('nodeUI.automatic'),value:'auto'},{title:$t('nodeUI.provided'),value:'provided'},{title:$t('nodeUI.nodeFiles'),value:'remote_paths'}]"
              />
              <template v-if="domain.certificate_mode==='provided'">
                <v-textarea
                  v-model="domain.certificate"
                  :label="$t('nodeOnboarding.certificatePEM')"
                  autocomplete="off"
                />
                <v-textarea
                  v-model="domain.key"
                  :label="$t('nodeOnboarding.keyPEM')"
                  autocomplete="off"
                />
              </template>
              <template v-if="domain.certificate_mode==='remote_paths'">
                <v-text-field
                  v-model="domain.certificate_path"
                  :label="$t('tls.certPath')"
                />
                <v-text-field
                  v-model="domain.key_path"
                  :label="$t('tls.keyPath')"
                />
              </template>
            </template>
          </template>
          <v-alert
            v-if="loadError || error"
            type="error"
            variant="tonal"
            class="mt-3"
          >
            {{ loadError || error }}
          </v-alert>
        </v-container>
      </v-card-text>
      <v-card-actions class="pt-0">
        <v-spacer />
        <v-btn
          color="primary"
          variant="outlined"
          :disabled="busy"
          @click="emit('close')"
        >
          {{ $t('actions.close') }}
        </v-btn>
        <v-btn
          color="primary"
          variant="tonal"
          :disabled="!valid || busy"
          :loading="busy"
          @click="submit"
        >
          {{ $t(recover?'nodeOnboarding.restore':node?'nodeOnboarding.apply':'nodeOnboarding.install') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  nodeSupportsTLS,
  type DNSProfile,
  type NodeInstallation,
  type NodeProvisionRequest,
  type NodeRecord,
  type NodeTemplate,
  type NodeTLSProfile,
  type ProvisionDomain,
  type TemplateSpec,
} from '@/features/nodes/types/nodes'
import Http from '@/plugins/httputil'
import { inboundTemplateTitle } from '@/features/nodes/types/nodeSpec'
const props = defineProps<{
  visible: boolean
  node?: NodeRecord
  cloneNode?: NodeRecord
  installation?: NodeInstallation
  templates: NodeTemplate[]
  profiles: DNSProfile[]
  tlsProfiles: NodeTLSProfile[]
  recover: boolean
  busy: boolean
  error: string
}>()
const emit = defineEmits<{ close: []; closed: []; profiles: []; save: [NodeProvisionRequest] }>()
const { t } = useI18n()
const empty = (): NodeProvisionRequest => ({
  model_version: 2,
  request_key: crypto.randomUUID(),
  name: '',
  ip: '',
  ssh_port: 22,
  ssh_user: 'root',
  password: '',
  protocols: [],
  template_id: 0,
  action: 'install',
  replace_host_key: false,
})
const blankDomain = (): ProvisionDomain => ({
  mode: 'managed',
  profile_id: 0,
  zone_id: '',
  prefix: '',
  automatic_prefix: true,
  fqdn: '',
  certificate_mode: 'auto',
  certificate_method: '',
  email: '',
  certificate: '',
  key: '',
  certificate_path: '',
  key_path: '',
})
const form = ref(empty()),
  domain = ref(blankDomain()),
  templateLoading = ref(false),
  templateNeedsDomain = ref(false),
  loadError = ref('')
let ticket = 0
const selectedTemplates = ref<number[]>([])
const templateItems = computed(() =>
  props.templates
    .filter((t) => t.kind === 'inbound' && t.scope !== 'private')
    .map((t) => ({ title: inboundTemplateTitle(t), value: t.id! })),
)
const zones = computed(() => props.profiles.find((p) => p.id === domain.value.profile_id)?.zones ?? [])
const needsDomain = computed(
  () =>
    !props.node &&
    (selectedTemplates.value.length
      ? templateNeedsDomain.value
      : form.value.protocols.some((p) => p !== 'vless' && nodeSupportsTLS(p))),
)
function domainReady() {
  const dnsReady =
    domain.value.mode === 'managed'
      ? !!domain.value.profile_id &&
        !!domain.value.zone_id &&
        (domain.value.automatic_prefix || !!domain.value.prefix.trim())
      : !!domain.value.fqdn.trim()
  if (!dnsReady) return false
  if (domain.value.certificate_mode === 'provided')
    return !!domain.value.certificate.trim() && !!domain.value.key.trim()
  if (domain.value.certificate_mode === 'remote_paths')
    return domain.value.certificate_path.startsWith('/') && domain.value.key_path.startsWith('/')
  return true
}
const valid = computed(
  () =>
    !!form.value.name.trim() &&
    !!form.value.ip.trim() &&
    !!form.value.ssh_user.trim() &&
    Number.isInteger(form.value.ssh_port) &&
    form.value.ssh_port >= 1 &&
    form.value.ssh_port <= 65535 &&
    (!!props.node || !!form.value.password) &&
    (!form.value.replace_host_key || !!form.value.password) &&
    !templateLoading.value &&
    !loadError.value &&
    (!needsDomain.value || domainReady()),
)
function selectZone() {
  if (!zones.value.some((z) => z.id === domain.value.zone_id))
    domain.value.zone_id = zones.value.length === 1 ? zones.value[0].id : ''
}
function defaultProfile() {
  if (!domain.value.profile_id && props.profiles.length === 1) {
    domain.value.profile_id = props.profiles[0].id!
    selectZone()
  }
}
watch(
  () => props.profiles,
  () => {
    if (props.visible) defaultProfile()
  },
)
watch(
  () => props.visible,
  (visible) => {
    ticket++
    templateLoading.value = false
    loadError.value = ''
    if (!visible) {
      form.value.password = ''
      domain.value.certificate = ''
      domain.value.key = ''
      return
    }
    const i = props.installation
    let action: NodeProvisionRequest['action'] = 'install'
    if (props.recover) action = 'recover'
    else if (props.node) action = 'update'
    form.value = {
      ...empty(),
      node_id: props.node?.id,
      expected_version: props.node?.settings_version ?? 0,
      name: props.node?.name ?? '',
      ip: i?.ip ?? '',
      ssh_port: i?.ssh_port ?? 22,
      ssh_user: i?.ssh_user ?? 'root',
      template_id: props.node?.template_id ?? 0,
      action,
    }
    domain.value = blankDomain()
    selectedTemplates.value = []
    templateNeedsDomain.value = false
    defaultProfile()
    if (props.cloneNode) {
      form.value.name = props.cloneNode.name + '-copy'
      const ids = new Set(props.cloneNode.inbound_template_ids ?? [])
      const templates = props.templates.filter(
        (template) => ids.has(template.id!) && template.kind === 'inbound',
      )
      selectedTemplates.value = templates
        .filter((template) => template.scope !== 'private')
        .map((template) => template.id!)
      const copied = templates
        .map((template) => template.protocol)
        .filter((protocol) => protocol !== undefined)
      if (copied.length) form.value.protocols = [...new Set(copied)]
      if (selectedTemplates.value.length) void loadTemplates(selectedTemplates.value)
    }
  },
  { immediate: true },
)
async function loadTemplates(ids: number[]) {
  const version = ++ticket
  loadError.value = ''
  templateNeedsDomain.value = false
  templateLoading.value = !!ids.length
  if (!ids.length) return
  try {
    const versions = await Promise.all(
      ids.map((id) => Http.get<{ spec: TemplateSpec }>('api/node-template-version', { id })),
    )
    if (version !== ticket) return
    if (versions.some((result) => !result.success)) {
      loadError.value = t('nodeUI.loadTemplateFailed')
      return
    }
    const entries = versions.flatMap((result) => result.obj.spec.entries).filter((entry) => entry.enable)
    if (!entries.length) {
      loadError.value = t('nodeUI.emptyConnections')
      return
    }
    templateNeedsDomain.value = entries.some((e) =>
      e.tls_profile_id
        ? !props.tlsProfiles.find((profile) => profile.id === e.tls_profile_id)?.reality
        : Object.values(e.sources ?? {}).some(
            (s) =>
              s.kind === 'node_certificate' || (s.kind === 'node_parameter' && s.name === 'primary_domain'),
          ),
    )
  } catch {
    if (version === ticket) loadError.value = t('nodes.loadFailed')
  } finally {
    if (version === ticket) templateLoading.value = false
  }
}
function submit() {
  if (!valid.value) return
  emit('save', {
    ...form.value,
    name: form.value.name.trim(),
    ip: form.value.ip.trim(),
    ssh_user: form.value.ssh_user.trim(),
    protocols: [...form.value.protocols],
    ...(selectedTemplates.value.length ? { inbound_template_ids: [...selectedTemplates.value] } : {}),
    ...(needsDomain.value
      ? { domain: { ...domain.value, certificate_method: domain.value.certificate_mode } }
      : {}),
  })
}
</script>
