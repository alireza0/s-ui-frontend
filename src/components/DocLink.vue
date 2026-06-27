<template>
  <a :href="url" target="_blank" rel="noopener noreferrer" class="text-decoration-none">
    <v-icon icon="mdi-information-outline" color="primary" size="small">
      <v-tooltip activator="parent" location="top">{{ $t('docs') }}</v-tooltip>
    </v-icon>
  </a>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import {
  inboundDoc, outboundDoc, endpointDoc, serviceDoc,
  TLS_DOC, DNS_SERVER_DOC, DNS_RULE_DOC, ROUTE_RULE_DOC, RULESET_DOC,
} from '@/plugins/docs'

const props = defineProps<{
  href?: string
  section?: 'inbound' | 'outbound' | 'endpoint' | 'service' | 'tls' | 'dnsServer' | 'dnsRule' | 'rule' | 'ruleset'
  type?: string
}>()

const url = computed(() => {
  if (props.href) return props.href
  switch (props.section) {
    case 'inbound': return inboundDoc(props.type ?? '')
    case 'outbound': return outboundDoc(props.type ?? '')
    case 'endpoint': return endpointDoc(props.type ?? '')
    case 'service': return serviceDoc(props.type ?? '')
    case 'tls': return TLS_DOC
    case 'dnsServer': return DNS_SERVER_DOC
    case 'dnsRule': return DNS_RULE_DOC
    case 'rule': return ROUTE_RULE_DOC
    case 'ruleset': return RULESET_DOC
    default: return ''
  }
})
</script>
