<template>
  <template v-if="report?.certificates?.length">
    <v-divider />
    <v-list
      density="compact"
      class="pa-0"
      :aria-label="$t('nodes.certificates')"
    >
      <v-list-subheader class="px-0">
        {{ $t('nodes.certificates') }}
      </v-list-subheader>
      <v-list-item
        v-for="item in report.certificates"
        :key="item.inbound"
        class="px-0 py-1"
      >
        <v-row
          no-gutters
          class="text-body-2"
        >
          <v-col
            cols="12"
            sm="5"
            class="text-break"
          >
            {{ inboundName(item.inbound) }}
          </v-col>
          <v-col class="text-break">
            {{ $t('nodes.certificateStates.' + item.state) }}
            <span
              v-if="item.server_name"
              class="ms-2 text-medium-emphasis"
            >{{ item.server_name }}</span>
          </v-col>
        </v-row>
        <v-row
          v-if="item.not_after"
          no-gutters
          class="text-caption text-medium-emphasis"
        >
          <v-col
            cols="12"
            sm="5"
          >
            {{ $t('nodes.validUntil') }}
          </v-col>
          <v-col>{{ new Date(item.not_after * 1000).toLocaleString() }}</v-col>
        </v-row>
      </v-list-item>
    </v-list>
  </template>
</template>

<script setup lang="ts">
import type { NodeInbound, NodeRecord } from '@/features/nodes/types/nodes'

const props = defineProps<{ report: NodeRecord['tls_status'], inbounds: NodeInbound[], nodeId: number }>()

function inboundName(tag: string) {
  const inbound = props.inbounds.find(value => tag === `node-${props.nodeId}-inbound-${value.id}`)
  return inbound?.display_name || inbound?.tag || tag
}
</script>
