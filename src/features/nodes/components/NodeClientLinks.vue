<template>
  <slot :links="displayedLinks" />
  <v-progress-linear
    v-if="loading && !links.length"
    indeterminate
    class="my-2"
  />
  <v-alert
    v-if="failed"
    type="error"
    density="compact"
    variant="tonal"
    class="my-2"
  >
    {{ $t('nodes.linksFailed') }}
  </v-alert>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import HttpUtils from '@/plugins/httputil'
import type { Link } from '@/types/clients'

const props = defineProps<{ clientId: number, active: boolean, localLinks: Link[] }>()
defineSlots<{ default(props: { links: Link[] }): unknown }>()

type NodeLink = { remark: string, uri: string }
const links = ref<NodeLink[]>([])
const loading = ref(false)
const failed = ref(false)
const displayedLinks = computed<Link[]>(() => [
  ...props.localLinks,
  ...links.value.map(link => ({ ...link, type: 'local' as const })),
])

watch([() => props.clientId, () => props.active], ([clientId, active], _, onCleanup) => {
  links.value = []
  loading.value = false
  failed.value = false
  if (!active || clientId <= 0) return

  let cancelled = false
  async function load() {
    if (loading.value) return
    loading.value = true
    try {
      const result = await HttpUtils.get<NodeLink[]>('api/node-links', { id: clientId })
      if (cancelled) return
      if (result.success && Array.isArray(result.obj)) {
        links.value = result.obj
        failed.value = false
      } else {
        failed.value = true
      }
    } catch {
      if (!cancelled) failed.value = true
    } finally {
      if (!cancelled) loading.value = false
    }
  }

  const timer = setInterval(() => void load(), 5000)
  onCleanup(() => {
    cancelled = true
    clearInterval(timer)
  })
  void load()
}, { immediate: true })
</script>
