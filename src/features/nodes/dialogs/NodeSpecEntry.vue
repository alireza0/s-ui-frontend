<template>
  <TlsModal
    :id="1"
    :model-value="tlsOpen"
    :visible="tlsOpen"
    :data="JSON.stringify(tlsData)"
    :providers="[]"
    :show-name="false"
    managed-material
    :server-only="nodeOverride"
    :allow-reality="allowReality"
    :handshake-from-source="sourceMode(tlsHandshakeSource) !== 'manual'"
    :validate-reality-target="(server, port) => handshakeError(tlsHandshakeSource, server, port)"
    :context-name="form.tag"
    @close="tlsOpen=false; tlsVisited=true"
    @save="saveTLS"
  >
    <template #server-name="{ server }">
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-select
          :model-value="sourceMode(tlsSniSource)"
          :items="sourceItems(sniPath, true, false)"
          :label="$t('nodeUI.fieldSource', { field: 'SNI' })"
          hide-details
          @update:model-value="tlsSniSource = valueSource(sniPath, $event)"
        />
      </v-col>
      <v-col
        v-if="sourceMode(tlsSniSource) === 'manual'"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="server.server_name"
          label="SNI"
          hide-details
        />
      </v-col>
    </template>
    <template #handshake-source="{ port }">
      <v-select
        :model-value="sourceMode(tlsHandshakeSource)"
        :items="sourceItems(handshakePath, true, true, mode => handshakeLoops(valueSource(handshakePath, mode), '', port))"
        :label="$t('nodeUI.fieldSource', { field: $t('types.shdwTls.hs') })"
        hide-details
        @update:model-value="selectHandshakeSource($event, port)"
      />
    </template>
  </TlsModal>
  <v-dialog
    :model-value="visible"
    width="800"
    scrollable
    transition="dialog-bottom-transition"
    :persistent="busy"
    @update:model-value="!$event && emit('close')"
  >
    <v-card
      class="rounded-lg"
      :loading="loading||busy"
    >
      <v-card-title>{{ $t(nodeOverride ? 'nodeUI.override' : value ? 'nodeUI.editInboundTemplate' : 'nodeUI.addInboundTemplate') }}</v-card-title>
      <v-divider />
      <v-card-text class="py-0 px-4">
        <v-container>
          <v-skeleton-loader
            v-if="loading"
            type="list-item-two-line, list-item-three-line"
          />
          <v-alert
            v-else-if="loadError"
            type="error"
            variant="tonal"
          >
            {{ loadError }}
            <v-btn
              variant="text"
              @click="emit('reload')"
            >
              {{ $t('nodes.retry') }}
            </v-btn>
          </v-alert>
          <template v-else>
            <v-row>
              <v-col
                cols="12"
                sm="4"
              >
                <v-select
                  v-model="form.type"
                  :disabled="!!value?.connection_key"
                  :items="protocolItems"
                  :label="$t('type')"
                  @update:model-value="changeProtocol"
                />
              </v-col><v-col
                cols="12"
                sm="5"
              >
                <v-text-field
                  v-model="form.tag"
                  :readonly="nodeOverride"
                  :label="$t('objects.tag')"
                />
              </v-col><v-col
                cols="12"
                sm="3"
              >
                <v-switch
                  v-model="form.enable"
                  :disabled="nodeOverride"
                  :label="$t('enable')"
                  color="primary"
                />
              </v-col>
            </v-row>
            <v-tabs
              v-if="!nodeOverride"
              v-model="side"
              density="compact"
              fixed-tabs
              align-tabs="center"
            >
              <v-tab value="server">
                {{ $t('in.sSide') }}
              </v-tab>
              <v-tab value="client">
                {{ $t('in.cSide') }}
              </v-tab>
            </v-tabs>
            <template v-if="side === 'server'">
              <v-select
                v-model="portMode"
                :items="[{title:$t('nodeUI.autoPort'),value:'auto'},{title:$t('nodeUI.manual'),value:'manual'}]"
                :label="$t('in.port')"
                @update:model-value="portTouched=true"
              />
              <Listen
                :data="form"
                :in-tags="detourTargets ?? []"
                :allow-detour="(form.type === 'vless' || form.type === 'shadowtls') && !quicTransport && !!detourTargets?.length"
                :auto-port="portMode==='auto'"
                :address-from-source="sourceMode(sources['/listen']) !== 'manual'"
                @port-input="portTouched=true"
              >
                <template
                  v-if="sourceMode(entry.sources['/listen']) !== 'manual'"
                  #address-source
                >
                  <v-select
                    :model-value="sourceMode(sources['/listen'])"
                    :items="sourceItems('/listen', false, false)"
                    :label="$t('nodeUI.fieldSource', { field: $t('in.addr') })"
                    hide-details
                    @update:model-value="setSource('/listen', $event)"
                  />
                </template>
              </Listen>
              <Tuic
                v-if="form.type==='tuic'"
                :data="form"
                direction="in"
              /><Hysteria2
                v-if="form.type==='hysteria2'"
                :data="form"
                direction="in"
                managed-obfs
                :obfs-label="t('nodeUI.obfuscation')"
                :hide-realm-token="nodeOverride"
                :realm-token-configured="!!entry.realm_server_secret"
              />
              <AnyTls
                v-if="form.type==='anytls'"
                :data="form"
                direction="in"
              />
              <Hysteria
                v-if="form.type==='hysteria'"
                :data="form"
                direction="in"
              />
              <Naive
                v-if="form.type==='naive'"
                :data="form"
                direction="in"
              />
              <Shadowsocks
                v-if="form.type==='shadowsocks'"
                :data="form"
                direction="in"
                :allowed-methods="shadowsocksMethods"
                hide-managed
                hide-password
                :method-readonly="nodeOverride"
              />
              <Snell
                v-if="form.type==='snell'"
                :data="form"
                direction="in"
                hide-psk
              />
              <ShadowTls
                v-if="form.type==='shadowtls'"
                :data="form"
                :allowed-versions="[3]"
                hide-password
              />
              <Transport
                v-if="Object.hasOwn(form, 'transport')"
                :data="form"
                :host-from-source="sourceMode(sources[hostPath]) !== 'manual'"
              >
                <template #host-source>
                  <v-select
                    :model-value="sourceMode(sources[hostPath])"
                    :items="sourceItems(hostPath, true, true)"
                    :label="$t('nodeUI.fieldSource', { field: $t('transport.hosts') })"
                    hide-details
                    @update:model-value="setSource(hostPath, $event)"
                  />
                </template>
              </Transport>
              <Multiplex
                v-if="muxAvailable"
                :data="form"
                direction="in"
              />
              <v-card
                v-if="nodeSupportsTLS(form.type)"
                variant="outlined"
                class="my-4"
              >
                <v-card-text>
                  <v-select
                    v-if="!nodeOverride || profileId"
                    v-model="profileId"
                    :items="profileOptions"
                    :label="$t('nodeUI.tlsTemplate')"
                    :readonly="nodeOverride"
                    class="mb-3"
                    hide-details
                  />
                  <template v-if="!profileId">
                    <div class="d-flex flex-wrap align-center ga-3">
                      <v-switch
                        v-model="tlsData.server.enabled"
                        :label="tlsData.server.reality?.enabled ? $t('enable') + ' REALITY' : $t('tls.enable')"
                        :disabled="ordinaryTLSRequired"
                        hide-details
                        color="primary"
                      /><v-btn
                        variant="tonal"
                        :disabled="!tlsData.server.enabled"
                        @click="openTLS"
                      >
                        {{ $t(allowReality ? 'nodeUI.tlsSettings' : 'pages.tls') }}
                      </v-btn><span v-if="tlsData.server.enabled && tlsData.server.reality?.enabled">REALITY</span>
                    </div>
                  </template>
                </v-card-text>
              </v-card>
            </template>
            <template v-else>
              <OutJson
                :in-data="form"
                :type="form.type"
                managed-realm-token
                :realm-token-configured="!!entry.realm_client_secret"
              />
              <Multiplex
                v-if="!quicTransport && muxAvailable && form.out_json"
                :data="form.out_json"
                direction="out"
              />
              <Dial
                v-if="form.out_json"
                :dial="form.out_json"
                mode="client"
              />
              <v-card v-if="!viaRealm">
                <v-card-text>
                  <v-card-subtitle>
                    {{ $t('in.multiDomain') }}
                    <v-chip
                      :aria-label="$t('actions.add')"
                      color="primary"
                      density="compact"
                      variant="elevated"
                      @click="addAddress"
                    >
                      <v-icon icon="mdi-plus" />
                    </v-chip>
                  </v-card-subtitle>
                  <template
                    v-for="(address, index) in form.addrs"
                    :key="index"
                  >
                    <v-btn
                      :aria-label="$t('actions.del')"
                      icon="mdi-delete"
                      color="error"
                      variant="text"
                      @click="form.addrs?.splice(index, 1)"
                    />
                    <AddrVue
                      :addr="address"
                      :has-tls="!!profileId || !!tlsData.server.enabled"
                    />
                  </template>
                </v-card-text>
              </v-card>
            </template>
            <slot />
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
            v-if="validation && (validation !== $t('nodeUI.targetRequired') || !!value || tlsVisited)"
            type="warning"
            variant="tonal"
            class="mt-3"
          >
            {{ validation }}
          </v-alert>
        </v-container>
      </v-card-text>
      <v-card-actions class="pt-0">
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
          :disabled="!!validation||busy||loading||!!loadError"
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
import {
  nodeInboundProtocols,
  nodeSupportsTLS,
  type NodeTLSProfile,
  type SpecEntry,
  type ValueSource,
} from '@/features/nodes/types/nodes'
import type { tls } from '@/types/tls'
import Hysteria from '@/components/protocols/Hysteria.vue'
import Naive from '@/components/protocols/Naive.vue'
import Shadowsocks from '@/components/protocols/Shadowsocks.vue'
import Snell from '@/components/protocols/Snell.vue'
import ShadowTls from '@/components/protocols/ShadowTls.vue'
import {
  clone,
  handshakePath,
  hostPath,
  newEntry,
  openEntry,
  saveEntry,
} from '@/features/nodes/types/nodeSpec'
import Listen from '@/components/Listen.vue'
import Tuic from '@/components/protocols/Tuic.vue'
import Hysteria2 from '@/components/protocols/Hysteria2.vue'
import AnyTls from '@/components/protocols/AnyTls.vue'
import Transport from '@/components/Transport.vue'
import Multiplex from '@/components/Multiplex.vue'
import TlsModal from '@/layouts/modals/Tls.vue'
import OutJson from '@/components/OutJson.vue'
import AddrVue from '@/components/Addr.vue'
import Dial from '@/components/Dial.vue'
import { isPublishedAddress } from '@/features/nodes/types/nodeForms'
import { normalizeRealityHost, realityTargetIsListener } from '@/features/nodes/types/realityTarget'

const props = defineProps<{
  visible: boolean
  value?: SpecEntry
  loading?: boolean
  loadError?: string
  busy?: boolean
  error?: string
  nodeOverride?: boolean
  tlsProfiles: NodeTLSProfile[]
  nodeAddress?: string
  nodeDomain?: string
  nodeIP?: string
  detourTargets?: { title: string; value: string }[]
}>()
const emit = defineEmits<{ close: []; save: [SpecEntry]; reload: [] }>()
const { t } = useI18n()

const sniPath = '/tls/server_name'
const shadowsocksMethods = [
  'aes-128-gcm',
  'aes-192-gcm',
  'aes-256-gcm',
  'chacha20-ietf-poly1305',
  'xchacha20-ietf-poly1305',
  '2022-blake3-aes-128-gcm',
  '2022-blake3-aes-256-gcm',
]
function protocolTitle(protocol: string) {
  if (protocol === 'anytls') return 'AnyTLS'
  if (protocol === 'vmess') return 'VMess'
  return protocol.toUpperCase()
}
const protocolItems = nodeInboundProtocols.map((value) => ({ value, title: protocolTitle(value) }))
const entry = ref(newEntry())
const initial = openEntry(entry.value)
const form = ref(initial.form)
const tlsData = ref(initial.tls)
const profileId = ref(0)
const sources = ref<Record<string, ValueSource>>(clone(entry.value.sources))
const tlsOpen = ref(false)
const tlsHandshakeSource = ref<ValueSource>()
const tlsSniSource = ref<ValueSource>()
const quicTransport = computed(() => 'transport' in form.value && form.value.transport?.type === 'quic')
const allowReality = computed(() => form.value.type === 'vless' && !quicTransport.value)
const tlsVisited = ref(false)
const muxAvailable = computed(() => ['vless', 'vmess', 'trojan', 'shadowsocks'].includes(form.value.type))
const ordinaryTLSRequired = computed(
  () => quicTransport.value || ['tuic', 'hysteria2', 'hysteria', 'naive', 'anytls'].includes(form.value.type),
)
const profileOptions = computed(() => [
  { title: t('nodeUI.inlineTLS'), value: 0 },
  ...props.tlsProfiles.map((profile) => ({
    title: profile.name,
    value: profile.id,
    props: { disabled: profile.reality && (form.value.type !== 'vless' || quicTransport.value) },
  })),
])
const portMode = ref('auto')
const side = ref<'server' | 'client'>('server')
const viaRealm = computed(() => 'realm' in form.value && !!form.value.realm)
const portTouched = ref(false)
const sniTouched = ref(false)

type SourceMode = 'manual' | 'primary_domain' | 'node_address' | 'existing'

function sourceMode(source?: ValueSource): SourceMode {
  if (!source || source.kind === 'literal') return 'manual'
  if (
    source.kind === 'node_parameter' &&
    (source.name === 'primary_domain' || source.name === 'node_address')
  )
    return source.name
  return 'existing'
}

function sourceItems(
  path: string,
  domain: boolean,
  address: boolean,
  isDisabled?: (mode: SourceMode) => boolean,
) {
  const original = entry.value.sources[path]
  const originalMode = sourceMode(original)
  const items: { title: string; value: SourceMode; props?: { disabled: boolean } }[] = [
    { title: t('nodeUI.manual'), value: 'manual' },
  ]
  if (domain || originalMode === 'primary_domain') {
    items.push({
      title: t('nodeUI.nodeDomain'),
      value: 'primary_domain',
      props: { disabled: isDisabled?.('primary_domain') ?? false },
    })
  }
  if (address || originalMode === 'node_address') {
    items.push({
      title: t('nodeUI.nodeIP'),
      value: 'node_address',
      props: { disabled: isDisabled?.('node_address') ?? false },
    })
  }
  if (originalMode === 'existing') {
    let title = t('nodeUI.existingSource')
    if (original.kind === 'profile') title = t('nodeUI.profileSource', { name: original.name })
    if (original.kind === 'node_parameter' && original.name === 'node_name') title = t('nodeUI.nodeName')
    items.push({ title, value: 'existing', props: { disabled: isDisabled?.('existing') ?? false } })
  }
  return items
}

function valueSource(path: string, mode: SourceMode): ValueSource | undefined {
  if (mode === 'manual') return
  if (mode === 'existing') return entry.value.sources[path]
  return { kind: 'node_parameter', name: mode }
}

function setSource(path: string, mode: SourceMode) {
  const source = valueSource(path, mode)
  if (source) sources.value[path] = source
  else delete sources.value[path]
}

const reality = computed(() => {
  const server = tlsData.value.server
  return server.enabled && server.reality?.enabled ? server.reality : undefined
})
const listenerPort = computed(() => {
  if (portMode.value === 'manual') return form.value.listen_port
  if (props.nodeOverride && entry.value.sources['/listen_port']?.kind === 'node_generated') {
    return Number(entry.value.options.listen_port)
  }
  return undefined
})

function handshakeTarget(mode: SourceMode, server: string) {
  if (mode === 'primary_domain') return props.nodeDomain ?? 'node.invalid'
  if (mode === 'node_address') return props.nodeAddress ?? 'node.invalid'
  return server
}

function handshakeLoops(source: ValueSource | undefined, server: string, port: number) {
  if (sourceMode(sources.value['/listen']) !== 'manual') return false
  const mode = sourceMode(source)
  const localSource = mode === 'primary_domain' || mode === 'node_address'
  const target = handshakeTarget(mode, server)
  const local =
    localSource ||
    [props.nodeDomain, props.nodeAddress, props.nodeIP].some(
      (address) => !!address && normalizeRealityHost(address) === normalizeRealityHost(target),
    )
  return realityTargetIsListener(
    form.value.listen ?? '',
    listenerPort.value,
    port,
    target,
    local,
    local ? props.nodeIP : undefined,
  )
}

function handshakeError(source: ValueSource | undefined, server: string, port: number) {
  if (!Number.isInteger(port) || port < 1 || port > 65535) return t('nodeUI.portInvalid')
  if (sourceMode(source) === 'manual' && !server.trim()) return t('nodeUI.targetRequired')
  return handshakeLoops(source, server, port) ? t('nodeUI.errors.node_reality_handshake_loop') : ''
}

function selectHandshakeSource(mode: SourceMode, port: number) {
  const source = valueSource(handshakePath, mode)
  if (!handshakeLoops(source, '', port)) tlsHandshakeSource.value = source
}

watch(
  [() => props.visible, () => props.value],
  ([visible, value]) => {
    if (!visible) return
    entry.value = clone(value ?? newEntry())
    entry.value.sources ??= {}
    sources.value = clone(entry.value.sources)
    for (const path of ['/listen', hostPath, handshakePath, sniPath]) {
      if (sources.value[path]?.kind === 'literal') delete sources.value[path]
    }
    const state = openEntry(entry.value)
    form.value = state.form
    form.value.listen_port ||= 443
    tlsData.value = state.tls
    profileId.value = entry.value.tls_profile_id ?? 0
    portMode.value = sources.value['/listen_port']?.kind === 'node_generated' ? 'auto' : 'manual'
    side.value = 'server'
    portTouched.value = false
    sniTouched.value = false
    tlsOpen.value = false
    tlsVisited.value = false
  },
  { immediate: true },
)

function validateTLSProfile() {
  if (props.nodeOverride) return ''
  const profile = props.tlsProfiles.find((row) => row.id === profileId.value)
  if (!profile) return t('nodeUI.errors.node_tls_profile_not_found')
  if (profile.reality && (form.value.type !== 'vless' || quicTransport.value))
    return t('nodes.quicTlsRequired')
  return ''
}

function validateTLS() {
  const server = tlsData.value.server
  if (profileId.value) return validateTLSProfile()
  if (ordinaryTLSRequired.value && (!server.enabled || server.reality?.enabled))
    return t('nodeUI.regularTLSRequired')
  if (!server.enabled) return ''
  if (reality.value) {
    const error = handshakeError(
      sources.value[handshakePath],
      reality.value.handshake?.server ?? '',
      reality.value.handshake?.server_port || 443,
    )
    if (error) return error
  }
  if (server.enabled && sourceMode(sources.value[sniPath]) === 'manual' && !server.server_name?.trim()) {
    return t('nodeUI.sniRequired')
  }
  return ''
}

const validation = computed(() => {
  const { tag, listen_port } = form.value
  if (!tag.trim()) return t('nodeUI.nameRequired')
  if (
    form.value.detour &&
    (!props.detourTargets?.some((item) => item.value === form.value.detour) || quicTransport.value)
  ) {
    return t('nodeUI.errors.invalid_node_detour')
  }
  if (
    !viaRealm.value &&
    form.value.addrs?.some(
      (addr) =>
        !isPublishedAddress(addr.server) ||
        !Number.isInteger(addr.server_port) ||
        addr.server_port < 1 ||
        addr.server_port > 65535,
    )
  )
    return t('nodes.invalidPublicAddress')
  if (
    portMode.value === 'manual' &&
    (!Number.isInteger(listen_port) || listen_port < 1 || listen_port > 65535)
  ) {
    return t('nodeUI.portInvalid')
  }
  return validateTLS()
})

function addAddress() {
  form.value.addrs ??= []
  form.value.addrs.push({ server: '', server_port: form.value.listen_port || 443 })
}

function changeProtocol() {
  const protocol = form.value.type as SpecEntry['protocol']
  const draft = newEntry(protocol)
  draft.name = form.value.tag
  draft.enable = form.value.enable !== false
  const state = openEntry(draft)
  form.value = state.form
  form.value.listen_port = 443
  tlsData.value = state.tls
  profileId.value = 0
  const port = sources.value['/listen_port']
  sources.value = { ...draft.sources }
  if (port) sources.value['/listen_port'] = port
  else delete sources.value['/listen_port']
}

function openTLS() {
  tlsSniSource.value = sources.value[sniPath]
  tlsHandshakeSource.value = sources.value[handshakePath]
  tlsOpen.value = true
}

watch(quicTransport, (quic) => {
  if (!quic) return
  tlsData.value.server.enabled = true
  delete tlsData.value.server.reality
  delete sources.value[handshakePath]
})

function saveTLS(value: tls) {
  if (props.nodeOverride) value = { ...value, client: tlsData.value.client }
  sniTouched.value ||=
    sources.value[sniPath] !== tlsSniSource.value ||
    tlsData.value.server.server_name !== value.server.server_name
  if (tlsSniSource.value) sources.value[sniPath] = tlsSniSource.value
  else delete sources.value[sniPath]
  tlsData.value = clone(value)
  if (form.value.type !== 'vless') delete tlsData.value.server.reality
  if (reality.value && tlsHandshakeSource.value) sources.value[handshakePath] = tlsHandshakeSource.value
  else delete sources.value[handshakePath]
  tlsOpen.value = false
}

function save() {
  if (validation.value || props.busy || props.loading || props.loadError) return
  const next = clone(sources.value)
  if (portMode.value === 'auto') {
    next['/listen_port'] = { kind: 'node_generated', purpose: 'listen_port' }
  } else {
    delete next['/listen_port']
    if (props.nodeOverride && portTouched.value)
      next['/listen_port'] = { kind: 'literal', value: form.value.listen_port }
  }
  if (props.nodeOverride && sniTouched.value && sourceMode(next[sniPath]) === 'manual') {
    next[sniPath] = { kind: 'literal', value: tlsData.value.server.server_name }
  }
  const saved = saveEntry(entry.value, form.value, tlsData.value, next)
  if (profileId.value) saved.tls_profile_id = profileId.value
  emit('save', saved)
}
</script>
