<template>
  <v-card style="background-color: inherit;">
    <v-row>
      <v-col
        v-if="optionInbound"
        cols="12"
      >
        <v-combobox
          v-model="rule.inbound"
          :items="inTags"
          :label="$t('pages.inbounds')"
          multiple
          chips
          hide-details
        />
      </v-col>
      <v-col
        v-if="optionClient"
        cols="12"
      >
        <v-combobox
          v-model="rule.auth_user"
          :items="clients"
          :label="$t('pages.clients')"
          multiple
          chips
          hide-details
        />
      </v-col>
      <v-col
        v-if="optionIPver"
        cols="12"
        sm="6"
        md="4"
      >
        <v-select
          v-model.number="rule.ip_version"
          hide-details
          :label="$t('rule.ipVer')"
          :items="[4,6]"
        />
      </v-col>
      <v-col
        v-if="optionProtocol"
        cols="12"
        sm="6"
      >
        <v-combobox
          v-model="rule.protocol"
          :items="['http','tls', 'quic', 'stun', 'dns']"
          :label="$t('protocol')"
          multiple
          chips
          hide-details
        />
      </v-col>
    </v-row>
    <v-row v-if="optionDomain">
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-select
          v-model="domainOption"
          hide-details
          :items="domainKeys"
          @update:model-value="updateDomainOption($event)"
        />
      </v-col>
      <v-col
        v-if="rule.domain != undefined"
        cols="12"
        sm="6"
      >
        <v-text-field
          v-model="domain"
          :label="$t('rule.domain') + ' ' + $t('commaSeparated')"
          hide-details
        />
      </v-col>
      <v-col
        v-if="rule.domain_suffix != undefined"
        cols="12"
        sm="6"
      >
        <v-text-field
          v-model="domain_suffix"
          :label="$t('rule.domainSufix') + ' ' + $t('commaSeparated')"
          hide-details
        />
      </v-col>
      <v-col
        v-if="rule.domain_keyword != undefined"
        cols="12"
        sm="6"
      >
        <v-text-field
          v-model="domain_keyword"
          :label="$t('rule.domainKw') + ' ' + $t('commaSeparated')"
          hide-details
        />
      </v-col>
      <v-col
        v-if="rule.domain_regex != undefined"
        cols="12"
        sm="6"
      >
        <v-text-field
          v-model="domain_regex"
          :label="$t('rule.domainRgx') + ' ' + $t('commaSeparated')"
          hide-details
        />
      </v-col>
    </v-row>
    <v-row v-if="optionPort">
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-select
          v-model="portOption"
          hide-details
          :items="portKeys"
          @update:model-value="updatePortOption($event)"
        />
      </v-col>
      <v-col
        v-if="rule.port != undefined"
        cols="12"
        sm="6"
      >
        <v-text-field
          v-model="port"
          :label="$t('rule.port') + ' ' + $t('commaSeparated')"
          hide-details
        />
      </v-col>
      <v-col
        v-if="rule.port_range != undefined"
        cols="12"
        sm="6"
      >
        <v-text-field
          v-model="port_range"
          :label="$t('rule.portRange') + ' ' + $t('commaSeparated')"
          hide-details
        />
      </v-col>
    </v-row>
    <v-row v-if="optionSrcIP">
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-select
          v-model="srcIPOption"
          hide-details
          :items="srcIPKeys"
          @update:model-value="updateSrcIPOption($event)"
        />
      </v-col>
    </v-row>
    <v-row v-if="optionSrcPort">
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-select
          v-model="srcPortOption"
          hide-details
          :items="srcPortKeys"
          @update:model-value="updateSrcPortOption($event)"
        />
      </v-col>
      <v-col
        v-if="rule.source_port != undefined"
        cols="12"
        sm="6"
      >
        <v-text-field
          v-model="source_port"
          :label="$t('rule.srcPort') + ' ' + $t('commaSeparated')"
          hide-details
        />
      </v-col>
      <v-col
        v-if="rule.source_port_range != undefined"
        cols="12"
        sm="6"
      >
        <v-text-field
          v-model="source_port_range"
          :label="$t('rule.srcPortRange') + ' ' + $t('commaSeparated')"
          hide-details
        />
      </v-col>
    </v-row>
    <v-row v-if="optionRuleSet">
      <v-col
        cols="12"
        sm="6"
      >
        <v-combobox
          v-model="rule.rule_set"
          :items="ruleSets"
          :label="$t('rule.ruleset')"
          multiple
          chips
          hide-details
        />
      </v-col>
    </v-row>
    <v-card-actions>
      <v-spacer />
      <v-menu
        v-model="menu"
        :close-on-content-click="false"
        location="start"
      >
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            hide-details
            variant="tonal"
          >
            {{ $t('rule.options') }}
          </v-btn>
        </template>
        <v-card>
          <v-list>
            <v-list-item>
              <v-switch
                v-model="optionInbound"
                color="primary"
                :label="$t('pages.inbounds')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionClient"
                color="primary"
                :label="$t('pages.clients')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionIPver"
                color="primary"
                :label="$t('rule.ipVer')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionProtocol"
                color="primary"
                :label="$t('protocol')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionDomain"
                color="primary"
                :label="$t('rule.domainRules')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionPort"
                color="primary"
                :label="$t('in.port')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionSrcIP"
                color="primary"
                :label="$t('rule.srcIpRules')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionSrcPort"
                color="primary"
                :label="$t('rule.srcPortRules')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionRuleSet"
                color="primary"
                :label="$t('rule.ruleset')"
                hide-details
              />
            </v-list-item>
          </v-list>
        </v-card>
      </v-menu>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { dnsRule as DnsRuleType } from '@/types/dns'

// Only the fields this form reads or writes. The option groups are addressed
// by key name at runtime, so the shape also carries a string index.
interface DnsRuleShape {
  [key: string]: unknown
  inbound?: string[]
  auth_user?: string[]
  ip_version?: number
  protocol?: string[]
  domain?: string[]
  domain_suffix?: string[]
  domain_keyword?: string[]
  domain_regex?: string[]
  port?: number[]
  port_range?: string[]
  source_ip_cidr?: string[]
  source_ip_is_private?: boolean
  source_port?: number[]
  source_port_range?: string[]
  rule_set?: string[]
}

// The parent owns the rule object and this form edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<DnsRuleType>('rule', { required: true })

// The parent holds a wider rule type than this form touches, so narrow once
// here. The computed returns the same object, so edits still reach the parent.
const rule = computed(() => model.value as unknown as DnsRuleShape)

defineProps<{
  clients?: string[]
  inTags?: string[]
  rsTags?: string[]
  deleteable?: boolean
  ruleSets?: string[]
}>()

const menu = ref(false)
const domainKeys = ['domain', 'domain_suffix', 'domain_keyword', 'domain_regex']
const portKeys = ['port', 'port_range']
const srcIPKeys = ['source_ip_cidr', 'source_ip_is_private']
const srcPortKeys = ['source_port', 'source_port_range']
const domainOption = ref('domain')
const portOption = ref('port')
const srcIPOption = ref('source_ip_cidr')
const srcPortOption = ref('source_port')

const optionInbound = computed({
  get() { return rule.value.inbound != undefined },
  set(v: boolean) { rule.value.inbound = v ? [] : undefined }
})
const optionClient = computed({
  get() { return rule.value.auth_user != undefined },
  set(v: boolean) { rule.value.auth_user = v ? [] : undefined }
})
const optionIPver = computed({
  get() { return rule.value.ip_version != undefined },
  set(v: boolean) { rule.value.ip_version = v ? 4 : undefined }
})
const optionProtocol = computed({
  get() { return rule.value.protocol != undefined },
  set(v: boolean) { rule.value.protocol = v ? ['http'] : undefined }
})
const optionDomain = computed({
  get() { return Object.keys(rule.value).some(r => domainKeys.includes(r)) },
  set(v: boolean) {
    if (v) {
      rule.value.domain = []
    } else {
      domainKeys.forEach(k => delete rule.value[k])
    }
    domainOption.value = 'domain'
  }
})
const optionPort = computed({
  get() { return Object.keys(rule.value).some(r => portKeys.includes(r)) },
  set(v: boolean) {
    if (v) {
      rule.value.port = []
    } else {
      portKeys.forEach(k => delete rule.value[k])
    }
    portOption.value = 'port'
  }
})
const optionSrcIP = computed({
  get() { return Object.keys(rule.value).some(r => srcIPKeys.includes(r)) },
  set(v: boolean) {
    if (v) {
      rule.value.source_ip_cidr = []
    } else {
      srcIPKeys.forEach(k => delete rule.value[k])
    }
    srcIPOption.value = 'source_ip_cidr'
  }
})
const optionSrcPort = computed({
  get() { return Object.keys(rule.value).some(r => srcPortKeys.includes(r)) },
  set(v: boolean) {
    if (v) {
      rule.value.source_port = []
    } else {
      srcPortKeys.forEach(k => delete rule.value[k])
    }
    srcPortOption.value = 'source_port'
  }
})
const optionRuleSet = computed({
  get() { return rule.value.rule_set != undefined },
  set(v: boolean) {
    if (v) {
      rule.value.rule_set = []
    } else {
      delete rule.value.rule_set
    }
  }
})
const domain = computed({
  get() { return rule.value.domain?.join(',') },
  set(v: string) { rule.value.domain = v.length>0 ? v.split(',') : [] }
})
const domain_suffix = computed({
  get() { return rule.value.domain_suffix?.join(',') },
  set(v: string) { rule.value.domain_suffix = v.length>0 ? v.split(',') : [] }
})
const domain_keyword = computed({
  get() { return rule.value.domain_keyword?.join(',') },
  set(v: string) { rule.value.domain_keyword = v.length>0 ? v.split(',') : [] }
})
const domain_regex = computed({
  get() { return rule.value.domain_regex?.join(',') },
  set(v: string) { rule.value.domain_regex = v.length>0 ? v.split(',') : [] }
})
const port = computed({
  get() { return rule.value.port?.join(',') },
  set(v: string) {
    if(!v.endsWith(',')) {
      rule.value.port = v.length > 0 ? v.split(',').map(str => parseInt(str, 10)) : []
    }
  }
})
const port_range = computed({
  get() { return rule.value.port_range?.join(',') },
  set(v: string) { rule.value.port_range = v.length>0 ? v.split(',') : [] }
})
const source_port = computed({
  get() { return rule.value.source_port?.join(',') },
  set(v: string) {
    if(!v.endsWith(',')) {
      rule.value.source_port = v.length > 0 ? v.split(',').map(str => parseInt(str, 10)) : []
    }
  }
})
const source_port_range = computed({
  get() { return rule.value.source_port_range?.join(',') },
  set(v: string) { rule.value.source_port_range = v.length>0 ? v.split(',') : [] }
})

onMounted(() => {
  const ruleKeys = Object.keys(rule.value)
  if (optionDomain.value) {
    const enabledOption = domainKeys.filter(k => ruleKeys.includes(k))
    domainOption.value = enabledOption.length>0 ? enabledOption[0] : 'domain'
  }
  if (optionPort.value) {
    const enabledOption = portKeys.filter(k => ruleKeys.includes(k))
    portOption.value = enabledOption.length>0 ? enabledOption[0] : 'port'
  }
  if (optionSrcIP.value) {
    const enabledOption = srcIPKeys.filter(k => ruleKeys.includes(k))
    srcIPOption.value = enabledOption.length>0 ? enabledOption[0] : 'source_ip_cidr'
  }
  if (optionSrcPort.value) {
    const enabledOption = srcPortKeys.filter(k => ruleKeys.includes(k))
    srcPortOption.value = enabledOption.length>0 ? enabledOption[0] : 'source_port'
  }
})

function updateDomainOption(option: string) {
  domainKeys.forEach(k => delete rule.value[k])
  rule.value[option] = []
}
function updatePortOption(option: string) {
  portKeys.forEach(k => delete rule.value[k])
  rule.value[option] = []
}
function updateSrcIPOption(option: string) {
  srcIPKeys.forEach(k => delete rule.value[k])
  rule.value[option] = option == 'source_ip_is_private' ? false : []
}
function updateSrcPortOption(option: string) {
  srcPortKeys.forEach(k => delete rule.value[k])
  rule.value[option] = []
}
</script>
