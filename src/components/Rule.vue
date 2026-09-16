<template>
  <ExpTextarea
    v-model="expTextarea.visible"
    :visible="expTextarea.visible"
    :label="expTextarea.title"
    :content="expTextarea.content"
    @update="saveExpTextarea"
    @close="closeExpTextarea"
  />
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
        v-if="optionNetwork"
        cols="12"
        sm="6"
        md="4"
      >
        <v-select
          v-model="rule.network"
          hide-details
          multiple
          chips
          :label="$t('network')"
          :items="['tcp','udp','icmp']"
        />
      </v-col>
      <v-col
        v-if="optionProtocol"
        cols="12"
        sm="6"
      >
        <v-select
          v-model="rule.protocol"
          :items="protocols"
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
        <v-textarea
          v-model="domain"
          :label="$t('rule.domain')"
          hide-details
          rows="5"
          no-resize
          density="compact"
          append-icon="mdi-arrow-expand"
          @click:append="openExpTextarea($t('rule.domain'), 'domain')"
        />
      </v-col>
      <v-col
        v-if="rule.domain_suffix != undefined"
        cols="12"
        sm="6"
      >
        <v-textarea
          v-model="domain_suffix"
          :label="$t('rule.domainSufix')"
          hide-details
          rows="5"
          no-resize
          density="compact"
          append-icon="mdi-arrow-expand"
          @click:append="openExpTextarea($t('rule.domainSufix'), 'domain_suffix')"
        />
      </v-col>
      <v-col
        v-if="rule.domain_keyword != undefined"
        cols="12"
        sm="6"
      >
        <v-textarea
          v-model="domain_keyword"
          :label="$t('rule.domainKw')"
          hide-details
          rows="5"
          no-resize
          density="compact"
          append-icon="mdi-arrow-expand"
          @click:append="openExpTextarea($t('rule.domainKw'), 'domain_keyword')"
        />
      </v-col>
      <v-col
        v-if="rule.domain_regex != undefined"
        cols="12"
        sm="6"
      >
        <v-textarea
          v-model="domain_regex"
          :label="$t('rule.domainRgx')"
          hide-details
          rows="5"
          no-resize
          density="compact"
          append-icon="mdi-arrow-expand"
          @click:append="openExpTextarea($t('rule.domainRgx'), 'domain_regex')"
        />
      </v-col>
      <v-col
        v-if="rule.ip_cidr != undefined"
        cols="12"
        sm="6"
      >
        <v-textarea
          v-model="ip_cidr"
          :label="$t('rule.ip')"
          hide-details
          rows="5"
          no-resize
          density="compact"
          append-icon="mdi-arrow-expand"
          @click:append="openExpTextarea($t('rule.ip'), 'ip_cidr')"
        />
      </v-col>
      <v-col
        v-if="rule.ip_is_private != undefined"
        cols="12"
        sm="6"
      >
        <v-switch
          v-model="rule.ip_is_private"
          color="primary"
          :label="$t('rule.privateIp')"
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
        <v-textarea
          v-model="port"
          :label="$t('rule.port')"
          hide-details
          rows="5"
          no-resize
          density="compact"
          append-icon="mdi-arrow-expand"
          @click:append="openExpTextarea($t('rule.port'), 'port')"
        />
      </v-col>
      <v-col
        v-if="rule.port_range != undefined"
        cols="12"
        sm="6"
      >
        <v-textarea
          v-model="port_range"
          :label="$t('rule.portRange')"
          hide-details
          rows="5"
          no-resize
          density="compact"
          append-icon="mdi-arrow-expand"
          @click:append="openExpTextarea($t('rule.portRange'), 'port_range')"
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
      <v-col
        v-if="rule.source_ip_cidr != undefined"
        cols="12"
        sm="6"
      >
        <v-textarea
          v-model="source_ip_cidr"
          :label="$t('rule.srcCidr')"
          hide-details
          rows="5"
          no-resize
          density="compact"
          append-icon="mdi-arrow-expand"
          @click:append="openExpTextarea($t('rule.srcCidr'), 'source_ip_cidr')"
        />
      </v-col>
      <v-col
        v-if="rule.source_ip_is_private != undefined"
        cols="12"
        sm="6"
      >
        <v-switch
          v-model="rule.source_ip_is_private"
          color="primary"
          :label="$t('rule.srcPrivateIp')"
          hide-details
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
        <v-textarea
          v-model="source_port"
          :label="$t('rule.srcPort')"
          hide-details
          rows="5"
          no-resize
          density="compact"
          append-icon="mdi-arrow-expand"
          @click:append="openExpTextarea($t('rule.srcPort'), 'source_port')"
        />
      </v-col>
      <v-col
        v-if="rule.source_port_range != undefined"
        cols="12"
        sm="6"
      >
        <v-textarea
          v-model="source_port_range"
          :label="$t('rule.srcPortRange')"
          hide-details
          rows="5"
          no-resize
          density="compact"
          append-icon="mdi-arrow-expand"
          @click:append="openExpTextarea($t('rule.srcPortRange'), 'source_port_range')"
        />
      </v-col>
    </v-row>
    <v-row v-if="optionPreferredBy">
      <v-col
        cols="12"
        sm="6"
      >
        <v-combobox
          v-model="rule.preferred_by"
          :items="outTags || inTags"
          :label="$t('rule.preferredBy')"
          multiple
          chips
          hide-details
        />
      </v-col>
    </v-row>
    <v-row v-if="optionInterface">
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-select
          v-model="interfaceOption"
          hide-details
          :items="interfaceKeys"
          @update:model-value="updateInterfaceOption($event)"
        />
      </v-col>
      <v-col
        v-if="rule.interface_address != undefined || rule.network_interface_address != undefined || rule.default_interface_address != undefined"
        cols="12"
        sm="6"
      >
        <v-textarea
          v-model="interface_addr"
          :label="$t('rule.interfaceAddr')"
          hide-details
          rows="5"
          no-resize
          density="compact"
          append-icon="mdi-arrow-expand"
          @click:append="openExpTextarea($t('rule.interfaceAddr'), 'interface_address')"
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
          :items="rsTags"
          :label="$t('rule.ruleset')"
          multiple
          chips
          hide-details
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
      >
        <v-switch
          v-model="rule.rule_set_ip_cidr_match_source"
          color="primary"
          :label="$t('rule.rulesetMatchSrc')"
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
                v-model="optionNetwork"
                color="primary"
                :label="$t('network')"
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
                v-model="optionPreferredBy"
                color="primary"
                :label="$t('rule.preferredBy')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionInterface"
                color="primary"
                :label="$t('rule.interfaceAddr')"
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
import ExpTextarea from '@/components/ExpTextarea.vue'
import type { rule as RouteRule } from '@/types/rules'

// Only the fields this form reads or writes. The option groups are addressed
// by key name at runtime, so the shape also carries a string index.
interface RuleShape {
  [key: string]: unknown
  inbound?: string[]
  auth_user?: string[]
  ip_version?: number
  network?: string[]
  protocol?: string[]
  domain?: string[]
  domain_suffix?: string[]
  domain_keyword?: string[]
  domain_regex?: string[]
  ip_cidr?: string[]
  ip_is_private?: boolean
  port?: number[]
  port_range?: string[]
  source_ip_cidr?: string[]
  source_ip_is_private?: boolean
  source_port?: number[]
  source_port_range?: string[]
  preferred_by?: string[]
  interface_address?: string[]
  network_interface_address?: string[]
  default_interface_address?: string[]
  rule_set?: string[]
  rule_set_ip_cidr_match_source?: boolean
}

// The parent owns the rule object and this form edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<RouteRule>('rule', { required: true })

// The parent holds a wider rule type than this form touches, so narrow once
// here. The computed returns the same object, so edits still reach the parent.
const rule = computed(() => model.value as unknown as RuleShape)

defineProps<{
  clients?: string[]
  inTags?: string[]
  outTags?: string[]
  rsTags?: string[]
  deleteable?: boolean
}>()

const menu = ref(false)
const domainKeys = ['domain', 'domain_suffix', 'domain_keyword', 'domain_regex', 'ip_cidr', 'ip_is_private']
const interfaceKeys = ['interface_address', 'network_interface_address', 'default_interface_address']
const portKeys = ['port', 'port_range']
const srcIPKeys = ['source_ip_cidr', 'source_ip_is_private']
const srcPortKeys = ['source_port', 'source_port_range']
const domainOption = ref('domain')
const interfaceOption = ref('interface_address')
const portOption = ref('port')
const srcIPOption = ref('source_ip_cidr')
const srcPortOption = ref('source_port')
const protocols = [
  { title: 'HTTP', value: 'http' },
  { title: 'TLS', value: 'tls' },
  { title: 'QUIC', value: 'quic' },
  { title: 'STUN', value: 'stun' },
  { title: 'DNS', value: 'dns' },
  { title: 'BitTorrent', value: 'bittorrent' },
  { title: 'DTLS', value: 'dtls' },
  { title: 'SSH', value: 'ssh' },
  { title: 'RDP', value: 'rdp' },
  { title: 'NTP', value: 'ntp' },
]
const expTextarea = ref<{ visible: boolean, title: string, content: string, object: string }>({
  visible: false,
  title: '',
  content: '',
  object: '',
})

// The list fields are edited as newline separated text; a missing field reads
// as an empty box.
function toLines(v: unknown): string {
  return Array.isArray(v) ? v.join('\n') : ''
}

function splitLines(v: string): string[] {
  return v.length > 0 ? v.split('\n').map((s: string) => s.trim()).filter((s: string) => s.length > 0) : []
}

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
const optionPreferredBy = computed({
  get() { return rule.value.preferred_by != undefined },
  set(v: boolean) { rule.value.preferred_by = v ? [] : undefined }
})
const optionInterface = computed({
  get() { return interfaceKeys.some(k => rule.value[k] != undefined) },
  set(v: boolean) {
    if (v) {
      rule.value.interface_address = []
    } else {
      interfaceKeys.forEach(k => delete rule.value[k])
    }
    interfaceOption.value = 'interface_address'
  }
})
const optionRuleSet = computed({
  get() { return rule.value.rule_set != undefined },
  set(v: boolean) {
    if (v) {
      rule.value.rule_set = []
      rule.value.rule_set_ip_cidr_match_source = false
    } else {
      delete rule.value.rule_set
      delete rule.value.rule_set_ip_cidr_match_source
    }
  }
})
const optionNetwork = computed({
  get() { return rule.value.network != undefined },
  set(v: boolean) { rule.value.network = v ? [] : undefined }
})
const domain = computed({
  get() { return rule.value.domain?.join('\n') ?? '' },
  set(v: string) { rule.value.domain = splitLines(v) }
})
const domain_suffix = computed({
  get() { return rule.value.domain_suffix?.join('\n') ?? '' },
  set(v: string) { rule.value.domain_suffix = splitLines(v) }
})
const domain_keyword = computed({
  get() { return rule.value.domain_keyword?.join('\n') ?? '' },
  set(v: string) { rule.value.domain_keyword = splitLines(v) }
})
const domain_regex = computed({
  get() { return rule.value.domain_regex?.join('\n') ?? '' },
  set(v: string) { rule.value.domain_regex = splitLines(v) }
})
const ip_cidr = computed({
  get() { return rule.value.ip_cidr?.join('\n') ?? '' },
  set(v: string) { rule.value.ip_cidr = splitLines(v) }
})
const port = computed({
  get() { return rule.value.port?.join('\n') ?? '' },
  set(v: string) {
    const lines = splitLines(v)
    if (!v.endsWith('\n')) {
      rule.value.port = lines.length > 0 ? lines.map((str: string) => parseInt(str, 10)).filter((n: number) => !isNaN(n)) : []
    }
  }
})
const port_range = computed({
  get() { return rule.value.port_range?.join('\n') ?? '' },
  set(v: string) { rule.value.port_range = splitLines(v) }
})
const source_ip_cidr = computed({
  get() { return rule.value.source_ip_cidr?.join('\n') ?? '' },
  set(v: string) { rule.value.source_ip_cidr = splitLines(v) }
})
const source_port = computed({
  get() { return rule.value.source_port?.join('\n') ?? '' },
  set(v: string) {
    const lines = splitLines(v)
    if (!v.endsWith('\n')) {
      rule.value.source_port = lines.length > 0 ? lines.map((str: string) => parseInt(str, 10)).filter((n: number) => !isNaN(n)) : []
    }
  }
})
const source_port_range = computed({
  get() { return rule.value.source_port_range?.join('\n') ?? '' },
  set(v: string) { rule.value.source_port_range = splitLines(v) }
})
const interface_addr = computed({
  get() {
    const k = interfaceKeys.find(k => rule.value[k] != undefined)
    return k ? toLines(rule.value[k]) : ''
  },
  set(v: string) {
    const k = interfaceKeys.find(k => rule.value[k] != undefined)
    if (k) rule.value[k] = splitLines(v)
  }
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
  if (optionInterface.value) {
    const enabledOption = interfaceKeys.filter(k => ruleKeys.includes(k))
    interfaceOption.value = enabledOption.length>0 ? enabledOption[0] : 'interface_address'
  }
})

function updateDomainOption(option: string) {
  domainKeys.forEach(k => delete rule.value[k])
  rule.value[option] = option == 'ip_is_private' ? false : []
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
function updateInterfaceOption(option: string) {
  interfaceKeys.forEach(k => delete rule.value[k])
  rule.value[option] = []
}
function openExpTextarea(title: string, object: string) {
  expTextarea.value.visible = !expTextarea.value.visible
  expTextarea.value.title = title
  expTextarea.value.content = toLines(rule.value[object])
  expTextarea.value.object = object
}
function saveExpTextarea(results: string[]) {
  rule.value[expTextarea.value.object] = results
  closeExpTextarea()
}
function closeExpTextarea() {
  expTextarea.value.visible = false
  expTextarea.value.title = ''
  expTextarea.value.object = ''
}
</script>
