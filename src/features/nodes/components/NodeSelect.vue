<template>
  <v-select
    :model-value="modelValue"
    :items="items"
    :label="$t('nodes.title')"
    multiple
    chips
    clearable
    :loading="store.loading"
    :disabled="store.loading && !store.loaded"
    hide-details
    @update:model-value="emit('update:modelValue', $event ?? [])"
  >
    <template #append>
      <v-icon
        v-tooltip:top="$t('all')"
        icon="mdi-set-all"
        role="button"
        :aria-label="$t('all')"
        :aria-disabled="!canSelectAll"
        :tabindex="canSelectAll ? 0 : -1"
        :class="{ 'opacity-50': !canSelectAll }"
        @click.stop="selectAll"
        @keydown.enter.stop.prevent="selectAll"
        @keydown.space.stop.prevent="selectAll"
      />
    </template>
  </v-select>
  <v-alert
    v-if="store.failed"
    type="error"
    variant="tonal"
    density="compact"
    class="mt-2"
  >
    {{ $t('nodes.loadFailed') }} <v-btn @click="store.load()">
      {{ $t('nodes.retry') }}
    </v-btn>
  </v-alert>
</template>
<script setup lang="ts">
import { isManagedNode } from '@/features/nodes/types/nodes'
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import Nodes from '@/features/nodes/state/nodes'
const props = defineProps<{ modelValue: number[] }>()
const emit = defineEmits<{ 'update:modelValue': [number[]] }>()
const store = Nodes()
const { t } = useI18n()
const assignable = computed(() => store.nodes.flatMap(node =>
  isManagedNode(node) && node.id !== undefined
    ? [{ value: node.id, title: node.name + (node.pending ? ' · ' + t('nodes.state.pending') : '') }]
    : []))
const items = computed(() => {
  const result = [...assignable.value]
  for (const id of props.modelValue) {
    if (!result.some(item => item.value === id)) result.push({ value: id, title: t('nodes.unavailable') + ' #' + id })
  }
  return result
})
const canSelectAll = computed(() => store.loaded && !store.loading && !store.failed && assignable.value.length > 0)

function selectAll() {
  if (canSelectAll.value) emit('update:modelValue', assignable.value.map(item => item.value))
}

onMounted(() => store.load())
</script>
