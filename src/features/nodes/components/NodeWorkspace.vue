<template>
  <Stats
    :model-value="!!trafficNode"
    :visible="!!trafficNode"
    resource="node"
    :tag="String(trafficNode?.id ?? '')"
    :display-resource="$t('nodes.title')"
    :display-name="trafficNode?.name"
    @update:model-value="!$event && (trafficNode = undefined)"
    @close="trafficNode = undefined"
  />
  <NodeHostSetup
    :visible="hostOpen"
    :node="hostNode"
    :clone-node="hostClone"
    :installation="store.installations.find(i=>i.node_id===hostNode?.id)"
    :templates="store.templates"
    :profiles="store.resources.dnsprofiles"
    :tls-profiles="store.tlsProfiles"
    :recover="hostRecover"
    :busy="busy"
    :error="hostError"
    @close="hostOpen=false"
    @closed="restoreHostFocus"
    @profiles="openProfile()"
    @save="saveHost"
  />
  <NodeLiveTemplate
    :visible="templateOpen"
    :value="editingTemplate"
    :busy="busy"
    :error="error"
    :tls-profiles="store.tlsProfiles"
    @close="templateOpen=false"
    @save="saveTemplate"
    @restore="restoreTemplate"
  />
  <NodeDNSProfile
    :visible="profileOpen"
    :value="editingProfile"
    :busy="busy"
    :error="error"
    @close="profileOpen=false"
    @save="saveProfile"
  />
  <NodeResources
    v-if="selected"
    :visible="resourceOpen"
    :node="selected"
    :resources="store.resources"
    @close="resourceOpen=false"
    @profiles="resourceOpen=false;detailOpen=false;tab='dns'"
  />
  <NodeSpecEntry
    :visible="overrideOpen"
    :value="editingEntry"
    node-override
    :tls-profiles="store.tlsProfiles"
    :node-address="selected?.linkaddress"
    :node-domain="store.resources.domains.find(d => d.node_id === selectedId && d.state === 'ready')?.applied_fqdn"
    :node-ip="store.installations.find(i => i.node_id === selectedId)?.ip"
    :detour-targets="detourTargets"
    :busy="busy"
    :error="error"
    @close="overrideOpen=false"
    @save="saveOverride"
  />
  <div>
    <v-row>
      <v-col cols="12">
        <v-tabs
          v-model="tab"
          align-tabs="center"
        >
          <v-tab value="nodes">
            {{ $t('nodes.title') }}
          </v-tab><v-tab value="templates">
            {{ $t('nodeUI.inboundTemplates') }}
          </v-tab><v-tab value="dns">
            {{ $t('nodeUI.dnsProfiles') }}
          </v-tab>
        </v-tabs>
      </v-col>
    </v-row>
    <v-row>
      <v-col
        cols="12"
        align="center"
      >
        <v-btn
          v-if="tab==='nodes'"
          color="primary"
          :disabled="busy"
          :aria-label="$t('nodes.addNode')"
          @click="openHost()"
        >
          {{ $t('actions.add') }}
        </v-btn>
        <v-btn
          v-else-if="tab==='templates'"
          color="primary"
          :aria-label="$t('nodeUI.addInboundTemplate')"
          @click="openTemplate()"
        >
          {{ $t('actions.add') }}
        </v-btn>
        <v-btn
          v-else
          color="primary"
          :aria-label="$t('nodeUI.addProfile')"
          @click="openProfile()"
        >
          {{ $t('actions.add') }}
        </v-btn>
        <v-btn
          :aria-label="$t('actions.update')"
          icon="mdi-refresh"
          variant="text"
          density="comfortable"
          class="ml-2"
          @click="refresh"
        >
          <v-icon />
          <v-tooltip
            activator="parent"
            location="top"
            :text="$t('actions.update')"
          />
        </v-btn>
      </v-col>
    </v-row>
    <v-alert
      v-if="store.failed||store.resourcesFailed"
      type="error"
      variant="tonal"
      class="my-3"
    >
      {{ $t('nodes.loadFailed') }} <v-btn @click="refresh">
        {{ $t('nodes.retry') }}
      </v-btn>
    </v-alert>
    <v-alert
      v-if="error&&!detailOpen&&!templateOpen&&!profileOpen&&!deleteTarget"
      type="error"
      variant="tonal"
      class="my-3"
    >
      {{ error }}
    </v-alert>
    <template v-if="tab==='nodes'">
      <v-row>
        <v-col
          v-for="node in store.nodes"
          :key="node.id"
          cols="12"
          sm="4"
          md="3"
          lg="2"
        >
          <NodeCard
            v-model:dns-confirmed="dnsAlreadyRemoved"
            v-model:server-stopped-confirmed="serverAlreadyStopped"
            :title="node.name"
            :confirming="deleteTarget === 'node-'+node.id"
            :allow-dns-confirmation="allowDnsConfirmation"
            :require-stopped-confirmation="!node.disable_confirmed"
            :busy="busy"
            :error="error"
            :subtitle="store.resources.domains.find(d=>d.node_id===node.id)?.fqdn || node.linkaddress || '—'"
            :loading="!!activeNodeJob(node.id)"
            :disabled="!node.enable"
            @confirm="confirmAction"
            @cancel="closeDelete"
          >
            <template #append>
              <v-switch
                :model-value="node.enable"
                :loading="togglingNode===node.id"
                :disabled="busy||!canToggleNode(node)"
                :aria-label="$t('enable')+' '+node.name"
                color="success"
                density="compact"
                hide-details
                @update:model-value="value=>toggleNode(node,!!value)"
              />
            </template>
            <v-row>
              <v-col>{{ $t('nodes.status') }}</v-col>
              <v-col
                :class="{ 'text-error': cardState(node)==='error' }"
                :title="$t('nodes.state.'+cardState(node))"
              >
                {{ $t('nodes.state.'+cardState(node)) }}
              </v-col>
            </v-row>
            <v-row>
              <v-col>{{ $t('nodes.templates') }}</v-col>
              <v-col>{{ node.inbound_template_ids?.length ?? 0 }}</v-col>
            </v-row>
            <template #actions>
              <v-btn
                icon="mdi-file-edit"
                :aria-label="$t('nodes.openNode')+' '+node.name"
                @click="openDetails(node.id!)"
              >
                <v-icon />
                <v-tooltip
                  activator="parent"
                  location="top"
                  :text="$t('nodes.openNode')"
                />
              </v-btn>
              <v-btn
                icon="mdi-file-remove"
                :aria-label="$t('actions.del')+' '+node.name"
                :disabled="busy || !canRemoveNode(node)"
                color="warning"
                @click="removeNode(node)"
              >
                <v-icon />
                <v-tooltip
                  activator="parent"
                  location="top"
                  :text="$t('actions.del')"
                />
              </v-btn>
              <v-btn
                icon="mdi-content-duplicate"
                :aria-label="$t('actions.clone')+' '+node.name"
                :disabled="busy"
                @click="openHost(undefined,false,node)"
              >
                <v-icon />
                <v-tooltip
                  activator="parent"
                  location="top"
                  :text="$t('actions.clone')"
                />
              </v-btn>
              <v-btn
                v-if="data.enableTraffic && node.agent_traffic_available"
                icon="mdi-chart-line"
                :aria-label="$t('stats.graphTitle') + ' ' + node.name"
                @click="trafficNode = node"
              >
                <v-icon />
                <v-tooltip
                  activator="parent"
                  location="top"
                  :text="$t('stats.graphTitle')"
                />
              </v-btn>
            </template>
          </NodeCard>
        </v-col>
      </v-row>
      <v-dialog
        v-if="selected"
        v-model="detailOpen"
        width="800"
        scrollable
        transition="dialog-bottom-transition"
        @after-leave="restoreDetailFocus"
      >
        <v-card class="rounded-lg">
          <v-card-title class="flex-shrink-0">
            {{ selected.name }}
          </v-card-title>
          <v-divider class="flex-0-0-auto" />
          <v-tabs
            v-if="isLiveNode"
            v-model="detailTab"
            density="compact"
            class="flex-shrink-0"
            fixed-tabs
            align-tabs="center"
          >
            <v-tab value="inbounds">
              {{ $t('pages.inbounds') }}
            </v-tab>
            <v-tab value="server">
              {{ $t('dns.server') }}
            </v-tab>
            <v-tab value="status">
              {{ $t('nodes.status') }}
            </v-tab>
          </v-tabs>
          <v-card-text class="py-0 px-4">
            <v-container>
              <v-alert
                v-if="workspaceFailed||error&&!overrideOpen"
                type="error"
                variant="tonal"
                class="mb-3"
              >
                {{ workspaceFailed ? $t('nodes.loadFailed') : error }}
                <v-btn
                  v-if="workspaceFailed"
                  variant="text"
                  @click="refresh"
                >
                  {{ $t('nodes.retry') }}
                </v-btn>
              </v-alert>
              <v-alert
                v-for="(problem,index) in selectedProblems"
                :key="index"
                type="error"
                variant="tonal"
                density="compact"
                class="mb-3"
              >
                {{ problem }}
              </v-alert>
              <v-window
                v-if="isLiveNode"
                v-model="detailTab"
              >
                <v-window-item value="inbounds">
                  <v-alert
                    v-if="waitingFor&&!selectedProblems.length"
                    type="info"
                    variant="tonal"
                    class="mb-3"
                  >
                    {{ message(waitingFor) }}
                    <v-btn
                      v-if="waitingFor === 'node_domain_not_ready' || waitingFor === 'node_certificate_not_ready'"
                      variant="text"
                      @click="resourceOpen=true"
                    >
                      {{ $t('nodeUI.domainTLS') }}
                    </v-btn>
                  </v-alert>
                  <v-select
                    v-model="selectedInboundIds"
                    :items="availableInbounds"
                    :label="$t('nodeUI.inboundTemplates')"
                    hide-details
                    multiple
                    chips
                    closable-chips
                  />
                  <v-list
                    v-if="workspace?.spec?.entries.length"
                    class="mt-2 pa-0"
                    density="compact"
                  >
                    <v-list-item
                      v-for="entry in workspace.spec.entries"
                      :key="entry.connection_key"
                      :title="entry.name"
                      class="px-0 py-2"
                    >
                      <v-row
                        no-gutters
                        class="text-body-2"
                      >
                        <v-col cols="4">
                          {{ $t('type') }}
                        </v-col>
                        <v-col>{{ entry.protocol.toUpperCase() }}</v-col>
                      </v-row>
                      <v-row
                        no-gutters
                        class="text-body-2"
                      >
                        <v-col cols="4">
                          {{ $t('in.port') }}
                        </v-col>
                        <v-col>{{ connectionPort(entry.connection_key) ?? '—' }}</v-col>
                      </v-row>
                      <v-row
                        v-if="!entry.enable"
                        no-gutters
                        class="text-body-2"
                      >
                        <v-col cols="4">
                          {{ $t('nodes.status') }}
                        </v-col>
                        <v-col>{{ $t('nodeUI.off') }}</v-col>
                      </v-row>
                      <template #append>
                        <v-btn
                          icon="mdi-file-edit"
                          variant="text"
                          :aria-label="$t('nodeUI.override')+' '+entry.name"
                          @click="openOverride(entry)"
                        >
                          <v-icon />
                          <v-tooltip
                            activator="parent"
                            location="top"
                            :text="$t('nodeUI.override')"
                          />
                        </v-btn>
                        <v-btn
                          v-if="entryOverrides(entry.connection_key).length"
                          icon="mdi-restore"
                          variant="text"
                          :disabled="busy"
                          :aria-label="$t('nodeUI.inherit')+' '+entry.name"
                          @click="resetOverride(entry.connection_key)"
                        >
                          <v-icon />
                          <v-tooltip
                            activator="parent"
                            location="top"
                            :text="$t('nodeUI.inherit')"
                          />
                        </v-btn>
                      </template>
                    </v-list-item>
                  </v-list>
                </v-window-item>
                <v-window-item value="server">
                  <v-list
                    density="compact"
                    class="pa-0"
                  >
                    <v-list-item
                      append-icon="mdi-chevron-right"
                      @click="resourceOpen=true"
                    >
                      <v-row no-gutters>
                        <v-col
                          cols="12"
                          sm="5"
                        >
                          {{ $t('nodeUI.domainTLS') }}
                        </v-col>
                        <v-col class="text-break">
                          {{ selected.linkaddress || '—' }}
                        </v-col>
                      </v-row>
                    </v-list-item>
                    <template v-if="store.installations.some(i=>i.node_id===selectedId)">
                      <v-divider />
                      <v-list-item
                        :title="$t('nodeOnboarding.access')"
                        append-icon="mdi-chevron-right"
                        :disabled="busy||selectedInstalling"
                        @click="openHost(selected)"
                      />
                      <v-list-item
                        :title="$t('nodeOnboarding.recover')"
                        append-icon="mdi-chevron-right"
                        :disabled="busy||selectedInstalling"
                        @click="openHost(selected,true)"
                      />
                    </template>
                  </v-list>
                </v-window-item>
                <v-window-item value="status">
                  <v-alert
                    v-if="waitingFor && !selectedProblems.length"
                    type="info"
                    variant="tonal"
                    density="compact"
                    class="mb-3"
                  >
                    {{ message(waitingFor) }}
                  </v-alert>
                  <NodeOperationStatus
                    :node="selected"
                    :task="structureTask"
                    :access="access"
                    :domain="selectedDomain"
                    :certificate="selectedCertificate"
                  />
                  <v-expansion-panels
                    v-if="latestJob"
                    variant="accordion"
                    class="my-3"
                  >
                    <v-expansion-panel>
                      <v-expansion-panel-title>
                        <v-row no-gutters>
                          <v-col cols="6">
                            {{ $t('nodeOnboarding.progress') }}
                          </v-col>
                          <v-col>{{ $t('nodeOnboarding.stages.'+latestJob.stage) }}</v-col>
                        </v-row>
                      </v-expansion-panel-title>
                      <v-expansion-panel-text>
                        <v-progress-linear
                          v-if="selectedInstalling"
                          indeterminate
                        />
                        <p v-if="latestJob.error">
                          {{ message(latestJob.error) }}
                        </p>
                        <v-btn
                          v-if="['failed','interrupted'].includes(latestJob.state)"
                          variant="text"
                          @click="openHost(selected,latestJob.action==='recover')"
                        >
                          {{ $t('nodeOnboarding.retry') }}
                        </v-btn>
                        <v-row
                          v-for="(event,i) in jobStages"
                          :key="i"
                          no-gutters
                          class="text-body-2 py-1"
                        >
                          <v-col
                            cols="4"
                            sm="3"
                          >
                            {{ new Date(event.time*1000).toLocaleTimeString() }}
                          </v-col>
                          <v-col>
                            {{ $t('nodeOnboarding.stages.'+event.stage) }}
                            <div
                              v-if="event.error"
                              class="text-error"
                            >
                              {{ message(event.error) }}
                            </div>
                          </v-col>
                        </v-row>
                      </v-expansion-panel-text>
                    </v-expansion-panel>
                  </v-expansion-panels>
                  <NodeCertificateState
                    :report="selected.tls_status"
                    :inbounds="store.inbounds.filter(i=>i.node_id===selectedId)"
                    :node-id="selectedId"
                  />
                </v-window-item>
              </v-window>
              <p
                v-else
                class="text-body-2"
              >
                {{ $t('nodeUI.errors.unsupported_node_model') }}
              </p>
            </v-container>
          </v-card-text>
          <v-card-actions class="pt-0">
            <v-spacer />
            <v-btn
              color="primary"
              variant="outlined"
              @click="detailOpen=false"
            >
              {{ $t('actions.close') }}
            </v-btn>
            <v-btn
              v-if="isLiveNode && detailTab === 'inbounds'"
              color="primary"
              variant="tonal"
              :disabled="busy || selectedInstalling || !selectionChanged"
              @click="applyInbounds"
            >
              {{ $t('actions.apply') }}
            </v-btn>
            <v-btn
              v-if="isLiveNode && detailTab === 'status' && canRetry"
              color="primary"
              variant="tonal"
              :disabled="busy || selectedInstalling"
              @click="retry"
            >
              {{ $t('nodes.retryApply') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </template>
    <template v-if="tab==='templates'">
      <v-row>
        <v-col
          v-for="item in catalog"
          :key="item.id"
          cols="12"
          sm="4"
          md="3"
          lg="2"
        >
          <NodeCard
            :title="item.name"
            :confirming="deleteTarget === 'template-'+item.id"
            :busy="busy"
            :error="error"
            :subtitle="item.scope==='private' ? ($t('nodeUI.private')+' · '+(store.nodes.find(node=>node.id===item.owner_node_id)?.name??'—')) : $t('nodeUI.shared')"
            @confirm="confirmAction"
            @cancel="closeDelete"
          >
            <v-row>
              <v-col>{{ $t('type') }}</v-col>
              <v-col
                :title="item.protocol?.toUpperCase()"
              >
                {{ item.protocol?.toUpperCase() }}
              </v-col>
            </v-row>
            <v-row>
              <v-col>{{ $t('nodes.title') }}</v-col>
              <v-col>{{ store.nodes.filter(n=>n.inbound_template_ids?.includes(item.id!)).length }}</v-col>
            </v-row>
            <template #actions>
              <v-btn
                icon="mdi-file-edit"
                :aria-label="$t('actions.edit')+' '+item.name"
                @click="openTemplate(item)"
              >
                <v-icon />
                <v-tooltip
                  activator="parent"
                  location="top"
                  :text="$t('actions.edit')"
                />
              </v-btn>
              <v-btn
                icon="mdi-file-remove"
                :aria-label="$t('actions.del')+' '+item.name"
                color="warning"
                class="ml-0"
                :disabled="busy||store.nodes.some(n=>n.inbound_template_ids?.includes(item.id!))"
                @click="removeTemplate(item)"
              >
                <v-icon />
                <v-tooltip
                  activator="parent"
                  location="top"
                  :text="$t('actions.del')"
                />
              </v-btn>
              <v-btn
                icon="mdi-content-duplicate"
                :aria-label="$t('actions.clone')+' '+item.name"
                :disabled="busy"
                @click="cloneTemplate(item)"
              >
                <v-icon />
                <v-tooltip
                  activator="parent"
                  location="top"
                  :text="$t('actions.clone')"
                />
              </v-btn>
            </template>
          </NodeCard>
        </v-col>
      </v-row>
    </template>
    <template v-if="tab==='dns'">
      <v-row>
        <v-col
          v-for="p in store.resources.dnsprofiles"
          :key="p.id"
          cols="12"
          sm="4"
          md="3"
          lg="2"
        >
          <NodeCard
            :title="p.name"
            :confirming="deleteTarget === 'dns-'+p.id"
            :busy="busy"
            :error="error"
            subtitle="Cloudflare"
            @confirm="confirmAction"
            @cancel="closeDelete"
          >
            <v-row>
              <v-col>{{ $t('type') }}</v-col>
              <v-col
                :title="$t(p.auth_type==='token'?'nodeUI.apiToken':'nodeUI.globalAPIKey')"
              >
                {{ $t(p.auth_type==='token'?'nodeUI.apiToken':'nodeUI.globalAPIKey') }}
              </v-col>
            </v-row>
            <v-row>
              <v-col
                :title="$t('nodeUI.allowedZones')"
              >
                {{ $t('nodeUI.allowedZones') }}
              </v-col>
              <v-col
                :title="p.zones.map(z=>z.name).join(', ')"
              >
                {{ p.zones.map(z=>z.name).join(', ') }}
              </v-col>
            </v-row>
            <template #actions>
              <v-btn
                icon="mdi-file-edit"
                :aria-label="$t('actions.edit')+' '+p.name"
                @click="openProfile(p)"
              >
                <v-icon />
                <v-tooltip
                  activator="parent"
                  location="top"
                  :text="$t('actions.edit')"
                />
              </v-btn>
              <v-btn
                icon="mdi-file-remove"
                :aria-label="$t('actions.del')+' '+p.name"
                color="warning"
                class="ml-0"
                :disabled="busy"
                @click="removeProfile(p)"
              >
                <v-icon />
                <v-tooltip
                  activator="parent"
                  location="top"
                  :text="$t('actions.del')"
                />
              </v-btn>
              <v-btn
                icon="mdi-content-duplicate"
                :aria-label="$t('actions.clone')+' '+p.name"
                :disabled="busy"
                @click="cloneProfile(p)"
              >
                <v-icon />
                <v-tooltip
                  activator="parent"
                  location="top"
                  :text="$t('actions.clone')"
                />
              </v-btn>
            </template>
          </NodeCard>
        </v-col>
      </v-row>
    </template>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { isManagedNode } from '@/features/nodes/types/nodes'
import { useI18n } from 'vue-i18n'
import Nodes from '@/features/nodes/state/nodes'
import Data from '@/store/modules/data'
import Stats from '@/layouts/modals/Stats.vue'
import Http from '@/plugins/httputil'
import { nodeErrorCode } from '@/features/nodes/types/nodeErrors'
import type {
  NodeTemplate,
  DNSProfile,
  NodeWorkspace as Workspace,
  SpecEntry,
  NodeRecord,
  NodeProvisionRequest,
  TemplateSpec,
} from '@/features/nodes/types/nodes'
import { clone, inboundTemplateTitle, overrideFromEntry, setPath } from '@/features/nodes/types/nodeSpec'
import { nodeStatus } from '@/features/nodes/types/nodeForms'
import NodeHostSetup from '@/features/nodes/dialogs/NodeHostSetup.vue'
import NodeCertificateState from './NodeCertificateState.vue'
import NodeOperationStatus from './NodeOperationStatus.vue'
import NodeCard from './NodeCard.vue'
import NodeLiveTemplate from '@/features/nodes/dialogs/NodeLiveTemplate.vue'
import NodeDNSProfile from '@/features/nodes/dialogs/NodeDNSProfile.vue'
import NodeResources from '@/features/nodes/dialogs/NodeResources.vue'
import NodeSpecEntry from '@/features/nodes/dialogs/NodeSpecEntry.vue'
const store = Nodes(),
  { t, te } = useI18n(),
  tab = ref('nodes'),
  detailOpen = ref(false),
  selectedId = ref(0),
  busy = ref(false),
  error = ref(''),
  clock = ref(Date.now() / 1000),
  workspace = ref<Workspace>(),
  workspaceFailed = ref(false)
const data = Data()
const trafficNode = ref<NodeRecord>()
const hostOpen = ref(false),
  hostRecover = ref(false),
  hostNode = ref<NodeRecord>(),
  hostClone = ref<NodeRecord>(),
  hostError = ref('')
function nodeJob(id?: number) {
  return store.nodejobs
    .filter((j) => j.node_id === id && j.model_version === 2)
    .sort((a, b) => b.created - a.created || b.updated - a.updated)[0]
}
function activeNodeJob(id?: number) {
  const job = nodeJob(id)
  return job && ['queued', 'running'].includes(job.state) ? job : undefined
}
const latestJob = computed(() => nodeJob(selectedId.value)),
  selectedInstalling = computed(() => !!activeNodeJob(selectedId.value))
const jobStages = computed(() =>
  (latestJob.value?.events ?? []).filter((event, index, events) => {
    const previous = events[index - 1]
    return (
      !previous ||
      previous.stage !== event.stage ||
      previous.state !== event.state ||
      previous.error !== event.error
    )
  }),
)
const togglingNode = ref<number>()
function domainError(id?: number) {
  return store.resources.domains.find((domain) => domain.node_id === id)?.last_error
}
function certificateError(id?: number) {
  const error = store.resources.certificates.find((certificate) => certificate.node_id === id)?.last_error
  return error === 'certificate_pending' ? undefined : error
}
function cardState(node: NodeRecord) {
  const job = nodeJob(node.id)
  if (job && ['queued', 'running'].includes(job.state)) return 'installing'
  if (!node.enable) return node.disable_confirmed ? 'disabled' : 'pending'
  if (domainError(node.id) || certificateError(node.id)) return 'error'
  if (job?.error && !node.applied_revision) return 'error'
  return nodeStatus(node, clock.value)
}
const selectedProblems = computed(() => {
  const domain = domainError(selectedId.value)
  const certificate = certificateError(selectedId.value)
  const node = selected.value?.last_error
  const task = structureTask.value?.state !== 'waiting' ? structureTask.value?.last_error : undefined
  const structural = node || task
  const accessError = access.value?.last_error
  return [
    ...(domain ? [t('setting.domain') + ': ' + message(domain)] : []),
    ...(certificate ? [t('tls.cert') + ': ' + message(certificate)] : []),
    ...(structural &&
    !selectedInstalling.value &&
    !((domain || certificate || waitingFor.value) && structural === 'structural_update_failed')
      ? [message(structural)]
      : []),
    ...(accessError ? [message(accessError)] : []),
  ]
})
let hostTrigger: HTMLElement | undefined, detailTrigger: HTMLElement | undefined
function openDetails(id: number) {
  detailTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : undefined
  select(id)
}
function restoreDetailFocus() {
  if (detailTrigger?.isConnected) detailTrigger.focus({ preventScroll: true })
}
function restoreHostFocus() {
  if (hostTrigger?.isConnected) hostTrigger.focus({ preventScroll: true })
}
function openHost(node?: NodeRecord, recover = false, copy?: NodeRecord) {
  hostClone.value = copy
  hostTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : undefined
  hostNode.value = node ? clone(node) : undefined
  hostRecover.value = recover
  hostError.value = ''
  hostOpen.value = true
}
async function saveHost(request: NodeProvisionRequest) {
  busy.value = true
  hostError.value = ''
  try {
    const job = await store.provision(request)
    if (!alive) return
    if (job) {
      if (!detailOpen.value) {
        detailTrigger = hostTrigger
        hostTrigger = undefined
      }
      hostOpen.value = false
      select(job.node_id)
    } else hostError.value = message(store.lastSaveError || 'request_failed')
  } finally {
    busy.value = false
  }
}
const templateOpen = ref(false),
  editingTemplate = ref<NodeTemplate>(),
  profileOpen = ref(false),
  editingProfile = ref<DNSProfile>(),
  resourceOpen = ref(false),
  overrideOpen = ref(false),
  editingEntry = ref<SpecEntry>(),
  overrideVersion = ref(0)
const deleteTarget = ref('')
let confirmAction: () => Promise<void> = async () => {},
  workspaceTicket = 0,
  alive = true
const dnsAlreadyRemoved = ref(false)
const serverAlreadyStopped = ref(false)
const allowDnsConfirmation = ref(false)
const dnsCleanupErrors = new Set([
  'dns_api_rejected',
  'dns_api_unreachable',
  'dns_state_key_unavailable',
  'dns_profile_secret_mismatch',
  'dns_record_ownership_changed',
])
const selected = computed(() => store.nodes.find((n) => n.id === selectedId.value))
const access = computed(() => store.nodeaccess.find((a) => a.node_id === selectedId.value))
const selectedDomain = computed(() =>
  store.resources.domains.find((domain) => domain.node_id === selectedId.value),
)
const selectedCertificate = computed(() =>
  store.resources.certificates.find((certificate) => certificate.node_id === selectedId.value),
)
const structureTask = computed(() => workspace.value?.tasks.find((task) => task.kind === 'structure'))
const isLiveNode = computed(
  () => !!selected.value && isManagedNode(selected.value),
)
const catalog = computed(() => store.templates.filter((template) => template.kind === 'inbound'))
const availableInbounds = computed(() =>
  catalog.value
    .filter((template) => template.scope !== 'private' || template.owner_node_id === selectedId.value)
    .map((template) => ({ title: inboundTemplateTitle(template), value: template.id! })),
)
const detailTab = ref('inbounds')
const selectedInboundIds = ref<number[]>([])
const selectionVersion = ref(0)
const selectionChanged = computed(
  () =>
    JSON.stringify(selectedInboundIds.value) !== JSON.stringify(selected.value?.inbound_template_ids ?? []),
)
const detourTargets = computed(() =>
  (workspace.value?.spec?.entries ?? [])
    .filter(
      (entry) =>
        entry.enable &&
        entry.protocol === 'vless' &&
        entry.connection_key !== editingEntry.value?.connection_key,
    )
    .filter((entry) => {
      const transport = workspace.value?.connections.find(
        (connection) => connection.connection_key === entry.connection_key,
      )?.options.transport
      return (transport as { type?: string } | undefined)?.type !== 'quic'
    })
    .map((entry) => ({ title: entry.name, value: entry.connection_key })),
)
const waitingFor = computed(() =>
  structureTask.value?.state === 'waiting' ? structureTask.value.last_error : undefined,
)
const canRetry = computed(() => !!(selectedProblems.value.length || waitingFor.value))
function message(raw: string) {
  const code = nodeErrorCode(raw)
  return te('nodeUI.errors.' + code)
    ? t('nodeUI.errors.' + code)
    : t('nodeUI.operationFailed') + ' (' + code + ')'
}
function entryOverrides(key: string) {
  return workspace.value?.overrides.filter((o) => o.connection_key === key) ?? []
}
function connectionPort(key: string) {
  return workspace.value?.connections.find(
    (connection) => connection.connection_key === key && !connection.retired,
  )?.options.listen_port
}
async function loadWorkspace() {
  if (!alive || !detailOpen.value || !selectedId.value) return
  const id = selectedId.value,
    ticket = ++workspaceTicket
  try {
    const r = await Http.get<Workspace>('api/node-workspace', { id })
    if (alive && ticket === workspaceTicket) {
      if (r.success) {
        for (const entry of r.obj.spec?.entries ?? []) entry.sources ??= {}
        workspace.value = r.obj
        workspaceFailed.value = false
      } else workspaceFailed.value = true
    }
  } catch {
    if (alive && ticket === workspaceTicket) workspaceFailed.value = true
  }
}
async function refresh() {
  await Promise.all([store.load(), store.loadResources()])
  if (!busy.value && !overrideOpen.value) await loadWorkspace()
}
function select(id: number) {
  selectedId.value = id
  detailOpen.value = true
  detailTab.value = 'inbounds'
  workspace.value = undefined
  workspaceFailed.value = false
  selectedInboundIds.value = [...(selected.value?.inbound_template_ids ?? [])]
  selectionVersion.value = selected.value?.settings_version ?? 0
  error.value = ''
  void loadWorkspace()
}
async function perform(fn: () => Promise<boolean>) {
  busy.value = true
  error.value = ''
  try {
    const ok = await fn()
    if (!ok) error.value = message(store.lastSaveError || 'request_failed')
    return ok
  } finally {
    busy.value = false
    await refresh()
  }
}
function openTemplate(value?: NodeTemplate) {
  editingTemplate.value = value ? clone(value) : undefined
  error.value = ''
  templateOpen.value = true
}
async function saveTemplate(value: unknown) {
  if (await perform(() => store.save('nodetemplates', editingTemplate.value ? 'edit' : 'new', value)))
    templateOpen.value = false
}
async function restoreTemplate(version: number) {
  if (
    await perform(() =>
      store.save('nodetemplates', 'restoreversion', {
        id: editingTemplate.value!.id,
        version,
        expected_version: editingTemplate.value!.version,
      }),
    )
  )
    templateOpen.value = false
}
function openProfile(value?: DNSProfile) {
  editingProfile.value = value ? clone(value) : undefined
  error.value = ''
  profileOpen.value = true
}
async function saveProfile(value: unknown) {
  if (await perform(() => store.resource('dnsprofiles', 'save', value))) profileOpen.value = false
}
function confirm(target: string, action: () => Promise<void>) {
  closeDelete()
  deleteTarget.value = target
  confirmAction = action
}

function closeDelete() {
  deleteTarget.value = ''
  dnsAlreadyRemoved.value = false
  serverAlreadyStopped.value = false
  allowDnsConfirmation.value = false
  error.value = ''
}

function removeTemplate(value: NodeTemplate) {
  confirm('template-' + value.id, async () => {
    if (await perform(() => store.save('nodetemplates', 'del', value.id))) closeDelete()
  })
}

function removeProfile(value: DNSProfile) {
  confirm('dns-' + value.id, async () => {
    if (
      await perform(() =>
        store.resource('dnsprofiles', 'del', { id: value.id, expected_version: value.version }),
      )
    ) {
      closeDelete()
    }
  })
}

function canRemoveNode(node: NodeRecord) {
  return !node.enable && !activeNodeJob(node.id)
}

function removeNode(node: NodeRecord) {
  if (!canRemoveNode(node)) return
  confirm('node-' + node.id, async () => {
    const request = {
      id: node.id,
      dns_already_removed: dnsAlreadyRemoved.value,
      server_already_stopped: serverAlreadyStopped.value,
    }
    const removed = await perform(() => store.save('nodes', 'del', request))
    if (removed) {
      if (selectedId.value === node.id) detailOpen.value = false
      closeDelete()
    } else if (dnsCleanupErrors.has(nodeErrorCode(store.lastSaveError))) {
      allowDnsConfirmation.value = true
    }
  })
}

function copyName(name: string, existing: readonly { name: string }[]) {
  let result = name + '-copy'
  while (existing.some((item) => item.name === result)) result += '-copy'
  return result
}

async function cloneTemplate(template: NodeTemplate) {
  await perform(async () => {
    const result = await Http.get<{ spec: TemplateSpec }>('api/node-template-version', { id: template.id! })
    const original = result.success ? result.obj.spec.entries[0] : undefined
    if (!original) {
      store.lastSaveError = result.msg || 'request_failed'
      return false
    }
    const entry = clone(original)
    entry.connection_key = crypto.randomUUID()
    entry.name = copyName(template.name, catalog.value)
    entry.sources ??= {}
    entry.sources['/listen_port'] = { kind: 'node_generated', purpose: 'listen_port' }
    delete entry.options.listen_port
    delete entry.options.detour
    delete entry.options.realm
    delete entry.realm_server_secret
    delete entry.realm_client_secret
    if (entry.client_options) {
      delete entry.client_options.addresses
      delete entry.client_options.realm
    }
    return store.save('nodetemplates', 'new', {
      name: entry.name,
      kind: 'inbound',
      expected_version: 0,
      scope: template.scope,
      owner_node_id: template.owner_node_id,
      spec: { ...result.obj.spec, entries: [entry] },
    })
  })
}

function cloneProfile(profile: DNSProfile) {
  openProfile({
    ...clone(profile),
    id: undefined,
    name: copyName(profile.name, store.resources.dnsprofiles),
    version: 0,
    secret_configured: false,
  })
}

async function applyInbounds() {
  const ok = await perform(() =>
    store.save('nodes', 'selectinbounds', {
      id: selectedId.value,
      inbound_template_ids: selectedInboundIds.value,
      expected_version: selectionVersion.value,
    }),
  )
  if (ok) selectionVersion.value = selected.value?.settings_version ?? 0
}
function canToggleNode(node: NodeRecord) {
  return isManagedNode(node) && !activeNodeJob(node.id)
}

async function toggleNode(node: NodeRecord, enable: boolean) {
  if (busy.value || !canToggleNode(node) || node.enable === enable) return
  togglingNode.value = node.id
  try {
    await perform(() => store.save('nodes', 'edit', { id: node.id, enable }))
  } finally {
    togglingNode.value = undefined
  }
}
function openOverride(base: SpecEntry) {
  error.value = ''
  const entry = clone(base)
  for (const override of entryOverrides(base.connection_key)) {
    for (const path of Object.keys(entry.sources)) {
      if (path === override.path || path.startsWith(override.path + '/')) delete entry.sources[path]
    }
    if (override.operation === 'remove') setPath(entry.options, override.path, null, true)
    else if (override.source?.kind === 'literal') setPath(entry.options, override.path, override.source.value)
    else if (override.source) entry.sources[override.path] = clone(override.source)
  }
  if (entry.sources['/listen_port']?.kind === 'node_generated') {
    const applied = workspace.value?.connections.find(
      (connection) => connection.connection_key === entry.connection_key,
    )
    if (applied?.options.listen_port) entry.options.listen_port = applied.options.listen_port
  }
  editingEntry.value = entry
  overrideVersion.value = selected.value?.settings_version ?? 0
  overrideOpen.value = true
}
async function saveOverride(entry: SpecEntry) {
  const base = workspace.value?.spec?.entries.find((e) => e.connection_key === entry.connection_key)
  if (!base) return
  if (JSON.stringify(base.client_tls ?? {}) !== JSON.stringify(entry.client_tls ?? {})) {
    error.value = t('nodeUI.clientTLSInTemplate')
    return
  }
  const rows = new Map(entryOverrides(entry.connection_key).map((o) => [o.path, o]))
  for (const row of overrideFromEntry(base, entry)) rows.set(row.path, row)
  const overrides = [
    ...(workspace.value?.overrides.filter((o) => o.connection_key !== entry.connection_key) ?? []),
    ...rows.values(),
  ]
  if (
    await perform(() =>
      store.save('nodes', 'setoverrides', {
        id: selectedId.value,
        expected_version: overrideVersion.value,
        overrides,
      }),
    )
  )
    overrideOpen.value = false
}
async function resetOverride(key: string) {
  await perform(() =>
    store.save('nodes', 'setoverrides', {
      id: selectedId.value,
      expected_version: selected.value?.settings_version ?? 0,
      overrides: workspace.value?.overrides.filter((o) => o.connection_key !== key) ?? [],
    }),
  )
}
async function retry() {
  await perform(async () => {
    const a = await store.save('nodes', 'retry', { id: selectedId.value })
    if (store.resources.domains.some((d) => d.node_id === selectedId.value))
      await Http.post('api/node-resource-retry', { data: JSON.stringify({ node_id: selectedId.value }) })
    return a
  })
}
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  void refresh()
  timer = setInterval(() => {
    clock.value = Date.now() / 1000
    void refresh()
  }, 5000)
})
onUnmounted(() => {
  alive = false
  workspaceTicket++
  if (timer) clearInterval(timer)
})
</script>
