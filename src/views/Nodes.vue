<template>
  <v-container fluid class="pa-4">
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <h1 class="text-h5 font-weight-bold">{{ $t('node.title') }}</h1>
        <div class="text-subtitle-2 text-medium-emphasis">Manage multi-location remote S-UI nodes</div>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddModal">
        {{ $t('node.add') }}
      </v-btn>
    </div>

    <v-row v-if="nodes.length > 0">
      <v-col v-for="node in nodes" :key="node.id" cols="12" md="6" lg="4">
        <v-card variant="outlined" class="rounded-lg">
          <v-card-item>
            <template v-slot:title>
              <div class="d-flex align-center justify-space-between">
                <span class="text-h6 font-weight-bold">{{ node.name }}</span>
                <v-chip
                  :color="node.status === 'online' ? 'success' : node.status === 'offline' ? 'error' : 'grey'"
                  size="small"
                  variant="flat"
                >
                  <v-icon start :icon="node.status === 'online' ? 'mdi-check-circle' : 'mdi-alert-circle'" size="x-small" />
                  {{ node.status.toUpperCase() }}
                </v-chip>
              </div>
            </template>
            <template v-slot:subtitle>
              <span v-if="node.remark">{{ node.remark }}</span>
              <span v-else class="text-caption font-mono">{{ node.scheme }}://{{ node.address }}:{{ node.port }}{{ node.basePath }}</span>
            </template>
          </v-card-item>

          <v-divider />

          <v-card-text class="py-2">
            <v-row density="compact" class="text-caption">
              <v-col cols="6">
                <div class="text-medium-emphasis">Public Host:</div>
                <div class="font-weight-medium">{{ node.publicHost || 'Default' }}</div>
              </v-col>
              <v-col cols="6">
                <div class="text-medium-emphasis">Latency:</div>
                <div class="font-weight-medium">{{ node.latencyMs > 0 ? node.latencyMs + ' ms' : '-' }}</div>
              </v-col>
              <v-col cols="6">
                <div class="text-medium-emphasis">Core Status:</div>
                <v-chip :color="node.coreRunning ? 'primary' : 'warning'" size="x-small" variant="tonal">
                  {{ node.coreRunning ? 'Running' : 'Stopped' }}
                </v-chip>
              </v-col>
              <v-col cols="6">
                <div class="text-medium-emphasis">Sync Status:</div>
                <v-chip :color="node.configDirty ? 'warning' : 'success'" size="x-small" variant="tonal">
                  {{ node.configDirty ? 'Pending Sync' : 'Synced' }}
                </v-chip>
              </v-col>
              <v-col cols="12" v-if="node.lastError" class="mt-1">
                <v-alert type="error" density="compact" variant="tonal" class="text-caption py-1">
                  {{ node.lastError }}
                </v-alert>
              </v-col>
            </v-row>
          </v-card-text>

          <v-divider />

          <v-card-actions class="px-3 py-2">
            <v-btn
              icon="mdi-network"
              size="small"
              variant="text"
              color="info"
              :loading="testingId === node.id"
              @click="testNode(node)"
            />
            <v-switch
              v-model="node.enable"
              color="success"
              density="compact"
              hide-details
              class="ml-2"
              @change="toggleEnable(node)"
            />
            <v-spacer />
            <v-btn icon="mdi-pencil" size="small" variant="text" color="primary" @click="openEditModal(node)" />
            <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="confirmDelete(node)" />
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-card v-else variant="outlined" class="text-center pa-8 rounded-lg mt-4">
      <v-icon icon="mdi-server-network-off" size="64" color="grey" class="mb-4" />
      <h3 class="text-h6 font-weight-medium text-medium-emphasis mb-2">No Remote Nodes Configured</h3>
      <p class="text-body-2 text-medium-emphasis mb-4">
        Add remote S-UI nodes to enable multi-location VPN subscriptions and centralized client management.
      </p>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openAddModal">
        {{ $t('node.add') }}
      </v-btn>
    </v-card>

    <NodeModal v-model="showModal" :edit-node="selectedNode" @saved="onNodeSaved" />

    <v-dialog v-model="showDeleteModal" max-width="400">
      <v-card>
        <v-card-title class="text-h6">{{ $t('confirm') }}</v-card-title>
        <v-card-text>
          Are you sure you want to delete node <strong>{{ nodeToDelete?.name }}</strong>?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDeleteModal = false">{{ $t('no') }}</v-btn>
          <v-btn color="error" variant="flat" :loading="deleting" @click="deleteNode">{{ $t('yes') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Data from '@/store/modules/data'
import { Node } from '@/types/nodes'
import NodeModal from '@/layouts/modals/NodeModal.vue'

const nodes = computed<Node[]>(() => Data().nodes)
const showModal = ref(false)
const selectedNode = ref<Node | null>(null)
const testingId = ref<number | null>(null)

const showDeleteModal = ref(false)
const nodeToDelete = ref<Node | null>(null)
const deleting = ref(false)

onMounted(async () => {
  await Data().loadNodes()
})

const openAddModal = () => {
  selectedNode.value = null
  showModal.value = true
}

const openEditModal = (node: Node) => {
  selectedNode.value = node
  showModal.value = true
}

const onNodeSaved = async () => {
  await Data().loadNodes()
}

const toggleEnable = async (node: Node) => {
  await Data().setNodeEnable(node.id, node.enable)
}

const testNode = async (node: Node) => {
  testingId.value = node.id
  try {
    await Data().testNode(node)
    await Data().loadNodes()
  } finally {
    testingId.value = null
  }
}

const confirmDelete = (node: Node) => {
  nodeToDelete.value = node
  showDeleteModal.value = true
}

const deleteNode = async () => {
  if (!nodeToDelete.value) return
  deleting.value = true
  try {
    const ok = await Data().deleteNode(nodeToDelete.value.id)
    if (ok) {
      showDeleteModal.value = false
      nodeToDelete.value = null
    }
  } finally {
    deleting.value = false
  }
}
</script>
