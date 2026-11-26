<template>
  <v-list
    density="compact"
    class="pa-0"
  >
    <v-list-item
      v-for="row in rows"
      :key="row.title"
      class="px-0"
    >
      <v-row
        no-gutters
        class="text-body-2"
      >
        <v-col
          cols="12"
          sm="5"
        >
          {{ row.title }}
        </v-col>
        <v-col>
          <span>{{ row.state }}</span>
          <span
            v-if="row.detail"
            class="ms-2 text-medium-emphasis"
          >{{ row.detail }}</span>
        </v-col>
      </v-row>
    </v-list-item>
  </v-list>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { CertificateBinding, DomainBinding, NodeRecord, NodesBundle, NodeWorkspace } from '../types/nodes'

const props = defineProps<{
  node: NodeRecord
  task?: NodeWorkspace['tasks'][number]
  access?: NonNullable<NodesBundle['nodeaccess']>[number]
  domain?: DomainBinding
  certificate?: CertificateBinding
}>()
const { t, te } = useI18n()

const structureState = computed(() => {
  const { node, task } = props
  if (task?.state === 'rejected') return t('nodeUI.states.failed')
  if (task?.state === 'waiting') return t('nodeUI.states.pending')
  if (!node.applied_revision || node.applied_revision !== node.desired_revision ||
    task?.state === 'queued') return t('nodeUI.states.pending')
  return t('nodes.state.applied')
})

const accessState = computed(() => {
  const access = props.access
  if (!access?.applied_revision || access.applied_revision !== access.desired_revision || access.last_error) {
    return t('nodeUI.states.pending')
  }
  return t('nodeUI.accessConfirmed')
})

function resourceState(state: string) {
  const key = 'nodeUI.states.' + state
  return te(key) ? t(key) : state
}

const rows = computed(() => {
  const { node, access, domain, certificate } = props
  const items = [
    {
      title: t('nodeUI.structure'),
      state: structureState.value,
      detail: `${node.applied_revision} / ${node.desired_revision}`,
    },
    {
      title: t('nodeUI.access'),
      state: accessState.value,
      detail: access && `${access.applied_revision} / ${access.desired_revision}`,
    },
  ]
  if (domain) {
    items.push({
      title: t('setting.domain'),
      state: resourceState(domain.state),
      detail: domain.fqdn,
    })
  }
  if (certificate) {
    items.push({
      title: t('tls.cert'),
      state: resourceState(certificate.state),
      detail: certificate.desired_revision ? `${certificate.applied_revision} / ${certificate.desired_revision}` : undefined,
    })
  }
  if (node.sing_box_version) items.push({ title: 'sing-box', state: node.sing_box_version, detail: undefined })
  if (node.agent_upgrade_state && node.agent_upgrade_state !== 'ready') {
    items.push({
      title: t('nodeUI.agentUpdate'),
      state: t('nodeUI.agentUpdates.' + node.agent_upgrade_state),
      detail: undefined,
    })
  }
  return items
})
</script>
