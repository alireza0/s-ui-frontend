<template>
  <v-dialog
    transition="dialog-bottom-transition"
    width="800"
  >
    <v-card class="rounded-lg">
      <v-card-title class="d-flex align-center">
        {{ $t('actions.' + title) + " " + $t('objects.dnsrule') }}
        <v-spacer />
        <DocLink section="dnsRule" />
      </v-card-title>
      <v-divider />
      <v-card-text style="padding: 0 16px;">
        <v-row>
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-switch
              v-model="logical"
              color="primary"
              :label="$t('rule.logical')"
              hide-details
            />
          </v-col>
          <v-spacer />
          <v-col
            v-if="logical"
            cols="auto"
            justify="center"
            align="center"
          >
            <v-btn
              color="primary"
              hide-details
              @click="ruleData.rules.push(<dnsRule>{})"
            >
              {{ $t('actions.add') + " " + $t('objects.rule') }}
            </v-btn>
          </v-col>
        </v-row>
        <template v-if="ruleData.type == 'logical'">
          <v-card
            v-for="(r, ruleIndex) in ruleData.rules"
            :key="ruleIndex"
            style="background-color: inherit; margin-bottom: 5px;"
          >
            <v-card-subtitle>
              {{ $t('objects.rule') + ' ' + (Number(ruleIndex)+1) }}
              <v-icon
                v-if="ruleData.rules.length>1"
                icon="mdi-delete"
                @click="ruleData.rules.splice(ruleIndex,1)"
              />
            </v-card-subtitle>
            <v-card-text style="padding: 0;">
              <RuleOptions
                :rule="r"
                :clients="clients"
                :in-tags="inTags"
                :rule-sets="ruleSets"
              />
            </v-card-text>
          </v-card>
        </template>
        <RuleOptions
          v-else
          :rule="ruleData.rules[0]"
          :clients="clients"
          :in-tags="inTags"
          :rule-sets="ruleSets"
        />
        <v-row>
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-select
              v-model="ruleData.action"
              :items="actions"
              :label="$t('dns.rule.action.title')"
              hide-details
            />
          </v-col>
          <v-col
            v-if="logical"
            cols="12"
            sm="6"
            md="4"
          >
            <v-combobox
              v-model="ruleData.mode"
              :items="['and', 'or']"
              :label="$t('rule.mode')"
              hide-details
            />
          </v-col>
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-switch
              v-model="ruleData.invert"
              color="primary"
              :label="$t('rule.invert')"
              hide-details
            />
          </v-col>
        </v-row>
        <v-card
          v-if="['route', 'route-options'].includes(ruleData.action ?? '')"
          :subtitle="$t('dns.rule.action.route')"
        >
          <v-row v-if="ruleData.action == 'route'">
            <v-col
              cols="12"
              sm="6"
              md="4"
            >
              <v-select
                v-model="ruleData.server"
                :items="serverTags"
                :label="$t('dns.server')"
                hide-details
              />
            </v-col>
            <v-col
              cols="12"
              sm="6"
              md="4"
            >
              <v-select
                v-model="ruleData.strategy"
                :items="strategies"
                :label="$t('rule.strategy')"
                clearable
                hide-details
                @click:clear="delete ruleData.strategy"
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col
              cols="12"
              sm="6"
              md="4"
            >
              <v-switch
                v-model="ruleData.disable_cache"
                :label="$t('dns.disableCache')"
                hide-details
              />
            </v-col>
            <v-col
              cols="12"
              sm="6"
              md="4"
            >
              <v-text-field
                v-model.number="ruleData.rewrite_ttl"
                type="number"
                min="0"
                :label="$t('dns.rule.action.rewriteTtl')"
                hide-details
              />
            </v-col>
            <v-col
              cols="12"
              sm="6"
              md="4"
            >
              <v-text-field
                v-model="ruleData.client_subnet"
                :label="$t('dns.rule.action.clientSubnet')"
                hide-details
              />
            </v-col>
          </v-row>
        </v-card>
        <v-card
          v-if="ruleData.action == 'reject'"
          :subtitle="$t('dns.rule.action.reject')"
        >
          <v-row>
            <v-col
              cols="12"
              sm="6"
              md="4"
            >
              <v-select
                v-model="ruleData.method"
                :items="[{ title: 'Default', value: 'default' },{ title: 'Drop', value: 'drop'}]"
                :label="$t('rule.method')"
                clearable
                hide-details
                @click:clear="delete ruleData.method"
              />
            </v-col>
            <v-col
              cols="12"
              sm="6"
              md="4"
            >
              <v-switch
                v-model="ruleData.no_drop"
                :label="$t('rule.noDrop')"
                hide-details
              />
            </v-col>
          </v-row>
        </v-card>
        <v-card
          v-if="ruleData.action == 'predefined'"
          :subtitle="$t('dns.rule.action.predefined')"
        >
          <v-row>
            <v-col
              cols="12"
              sm="6"
              md="4"
            >
              <v-select
                v-model="ruleData.rcode"
                :items="predefinedRcode"
                :label="$t('dns.rule.action.rcode')"
                clearable
                hide-details
                @click:clear="delete ruleData.rcode"
              />
            </v-col>
          </v-row>
          <v-row v-if="ruleData.rcode == 'NOERROR'">
            <v-col
              cols="12"
              sm="8"
            >
              <v-text-field
                v-model="answer"
                :label="$t('dns.rule.action.answer') + ' ' + $t('commaSeparated')"
                hide-details
              />
            </v-col>
            <v-col
              cols="12"
              sm="8"
            >
              <v-text-field
                v-model="ns"
                :label="$t('dns.rule.action.ns') + ' ' + $t('commaSeparated')"
                hide-details
              />
            </v-col>
            <v-col
              cols="12"
              sm="8"
            >
              <v-text-field
                v-model="extra"
                :label="$t('dns.rule.action.extra') + ' ' + $t('commaSeparated')"
                hide-details
              />
            </v-col>
          </v-row>
        </v-card>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          color="primary"
          variant="outlined"
          @click="closeModal"
        >
          {{ $t('actions.close') }}
        </v-btn>
        <v-btn
          color="primary"
          variant="tonal"
          :loading="loading"
          @click="saveChanges"
        >
          {{ $t('actions.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { PropType } from 'vue'
import { dnsRule, actionDnsRuleKeys } from '@/types/dns'


import RuleOptions from '@/components/DnsRule.vue'
import DocLink from '@/components/DocLink.vue'
import { i18n } from '@/locales'

// The form assembles a rule field by field and also addresses fields by key
// name at runtime, so it carries an index signature alongside what it reads.
interface DnsRuleFields {
  type?: string
  mode?: string
  rules?: dnsRule[]
  invert?: boolean
  action?: string
  server?: string
  strategy?: string
  disable_cache?: boolean
  rewrite_ttl?: number
  client_subnet?: string
  method?: string
  no_drop?: boolean
  rcode?: string
  answer?: string[]
  ns?: string[]
  extra?: string[]
  [key: string]: unknown
}

// `action` and `invert` stay optional: when an existing simple rule is
// loaded they are copied in field by field, so they are absent for a moment.
type DnsRuleDraft = DnsRuleFields & { type: string, mode: string, rules: dnsRule[] }

export default {
  components: { DocLink, RuleOptions },
  props: {
    visible: { type: Boolean, required: true },
    // A JSON string of the rule being edited, empty when adding a new one.
    data: { type: String, default: '' },
    index: { type: Number, required: true },
    clients: { type: Array as PropType<string[]>, default: () => [] },
    inTags: { type: Array as PropType<string[]>, default: () => [] },
    serverTags: { type: Array as PropType<string[]>, default: () => [] },
    ruleSets: { type: Array as PropType<string[]>, default: () => [] },
  },
  emits: ['close', 'save'],
  data() {
    return {
      title: 'add',
      loading: false,
      ruleData: <DnsRuleDraft>{
        type: 'logical',
        mode: 'and',
        rules: <dnsRule[]>[{}],
        invert: false,
        action: 'route',
        server: 'local',
      },
      actions: [
        { title: i18n.global.t('dns.rule.action.route'), value: 'route'},
        { title: i18n.global.t('dns.rule.action.routeOptions'), value: 'route-options'},
        { title: i18n.global.t('dns.rule.action.reject'), value: 'reject'},
        { title: i18n.global.t('dns.rule.action.predefined'), value: 'predefined'},
      ],
      strategies: [
        { title: 'Prefer IPv4', value: 'prefer_ipv4' },
        { title: 'Prefer IPv6', value: 'prefer_ipv6' },
        { title: 'IPv4 Only', value: 'ipv4_only' },
        { title: 'IPv6 Only', value: 'ipv6_only' },
      ],
      predefinedRcode: [
        { title: i18n.global.t('dns.rule.action.rcodes.noError'), value: 'NOERROR' },
        { title: i18n.global.t('dns.rule.action.rcodes.formerr'), value: 'FORMERR' },
        { title: i18n.global.t('dns.rule.action.rcodes.servFail'), value: 'SERVFAIL' },
        { title: i18n.global.t('dns.rule.action.rcodes.nxDomain'), value: 'NXDOMAIN' },
        { title: i18n.global.t('dns.rule.action.rcodes.notImp'), value: 'NOTIMP' },
        { title: i18n.global.t('dns.rule.action.rcodes.refused'), value: 'REFUSED' },
      ],
    }
  },
  computed: {
    logical: {
      get() { return this.ruleData.type == 'logical' },
      set(v:boolean) {
        this.ruleData.type = v? 'logical' : 'simple'
      }
    },
    answer: {
      get() { return this.ruleData.answer?.length ? this.ruleData.answer.join(',') : "" },
      set(v:string) { this.ruleData.answer = v.length > 0 ? v.split(',') : undefined }
    },
    ns: {
      get() { return this.ruleData.ns?.length ? this.ruleData.ns.join(',') : "" },
      set(v:string) { this.ruleData.ns = v.length > 0 ? v.split(',') : undefined }
    },
    extra: {
      get() { return this.ruleData.extra?.length ? this.ruleData.extra.join(',') : "" },
      set(v:string) { this.ruleData.extra = v.length > 0 ? v.split(',') : undefined }
    },
  },
  watch: {
    visible(newValue) {
      if (newValue) {
        this.updateData()
      }
    },
  },
  methods: {
    updateData() {
      if (this.$props.index != -1) {
        const newData = JSON.parse(this.$props.data)
        if (newData.type) {
          this.ruleData = newData
        } else {
          this.ruleData = {
            type: 'simple',
            mode: 'and',
            rules: <dnsRule[]>[{}],
          }
          Object.keys(newData).forEach(key => {
            if (actionDnsRuleKeys.includes(key)) {
              this.ruleData[key] = newData[key]
            } else {
              (this.ruleData.rules[0] as Record<string, unknown>)[key] = newData[key]
            }
          })
        }
        this.title = 'edit'
      }
      else {
        this.ruleData = <DnsRuleDraft>{
            type: 'simple',
            mode: 'and',
            rules: <dnsRule[]>[{}],
            invert: false,
            action: 'route',
            server: this.$props.serverTags[0]?? 'local',
          }
        this.title = 'add'
      }
    },
    closeModal() {
      this.$emit('close')
    },
    saveChanges() {
      this.loading = true
      let newRule: DnsRuleFields = {
        action: this.ruleData.action,
        invert: this.ruleData.invert? this.ruleData.invert : undefined,
      }

      // Filter action data
      switch (newRule.action){
        case 'route':
          newRule.server = this.ruleData.server
          newRule.strategy = (this.ruleData.strategy?.length ?? 0) > 0 ? this.ruleData.strategy : undefined
          newRule.disable_cache = this.ruleData.disable_cache? true : undefined
          newRule.rewrite_ttl = (this.ruleData.rewrite_ttl ?? 0) > 0 ? this.ruleData.rewrite_ttl : undefined
          newRule.client_subnet = (this.ruleData.client_subnet?.length ?? 0) > 0 ? this.ruleData.client_subnet : undefined
          break
        case 'route-options':
          newRule.disable_cache = this.ruleData.disable_cache? true : undefined
          newRule.rewrite_ttl = (this.ruleData.rewrite_ttl ?? 0) > 0 ? this.ruleData.rewrite_ttl : undefined
          newRule.client_subnet = (this.ruleData.client_subnet?.length ?? 0) > 0 ? this.ruleData.client_subnet : undefined
          break
        case 'reject':
          newRule.method = (this.ruleData.method?.length ?? 0) > 0 ? this.ruleData.method : undefined
          newRule.no_drop = this.ruleData.no_drop? true : undefined
          break
        case 'predefined':
          newRule.rcode = (this.ruleData.rcode?.length ?? 0) > 0 ? this.ruleData.rcode : undefined
          if (this.ruleData.rcode == 'NOERROR') {
            newRule.answer = this.ruleData.answer
            newRule.ns = this.ruleData.ns
            newRule.extra = this.ruleData.extra
          }
          break
      }

      // Add rules
      if (this.ruleData.type == 'simple'){
        newRule = { ...this.ruleData.rules[0], ...newRule }
      } else {
        newRule.type = 'logical'
        newRule.mode = this.ruleData.mode
        newRule.rules = this.ruleData.rules
      }
      this.$emit('save', newRule)
      this.loading = false
    },
    deleteRule(index:number) {
      this.ruleData.rules.splice(index,1)
    }
  }
}

</script>