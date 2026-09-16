<template>
  <v-dialog
    transition="dialog-bottom-transition"
    width="800"
  >
    <v-card class="rounded-lg">
      <v-card-title class="d-flex align-center">
        {{ $t('actions.' + title) + " " + $t('objects.rule') }}
        <v-spacer />
        <DocLink section="rule" />
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
              @click="ruleData.rules.push(<rule>{})"
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
                :out-tags="outTags"
                :rs-tags="rsTags"
              />
            </v-card-text>
          </v-card>
        </template>
        <RuleOptions
          v-else
          :rule="ruleData.rules[0]"
          :clients="clients"
          :in-tags="inTags"
          :out-tags="outTags"
          :rs-tags="rsTags"
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
              :label="$t('admin.action')"
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
          v-if="ruleData.action == 'route'"
          subtitle="Route"
        >
          <v-row>
            <v-col
              cols="12"
              sm="6"
              md="4"
            >
              <v-select
                v-model="ruleData.outbound"
                :items="outTags"
                :label="$t('objects.outbound')"
                hide-details
              />
            </v-col>
          </v-row>
        </v-card>
        <v-card
          v-if="ruleData.action == 'route-options'"
          subtitle="Route Option"
        >
          <v-row>
            <v-col
              cols="12"
              sm="6"
              md="4"
            >
              <v-text-field
                v-model="ruleData.override_address"
                :label="$t('types.direct.overrideAddr')"
                hide-details
              />
            </v-col>
            <v-col
              cols="12"
              sm="6"
              md="4"
            >
              <v-text-field
                v-model.number="ruleData.override_port"
                type="number"
                min="0"
                max="65534"
                :label="$t('types.direct.overridePort')"
                hide-details
              />
            </v-col>
            <v-col
              cols="12"
              sm="6"
              md="4"
            >
              <v-switch
                v-model="ruleData.udp_disable_domain_unmapping"
                :label="$t('rule.udpDisableDomainUnmapping')"
                hide-details
              />
            </v-col>
            <v-col
              cols="12"
              sm="6"
              md="4"
            >
              <v-switch
                v-model="ruleData.udp_connect"
                :label="$t('rule.udpConnect')"
                hide-details
              />
            </v-col>
            <v-col
              cols="12"
              sm="6"
              md="4"
            >
              <v-text-field
                v-model="ruleData.udp_timeout"
                :label="$t('rule.udpTimeout')"
                hide-details
              />
            </v-col>
          </v-row>
        </v-card>
        <v-card
          v-if="ruleData.action == 'reject'"
          subtitle="Reject"
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
          v-if="ruleData.action == 'sniff'"
          subtitle="Sniff"
        >
          <v-row>
            <v-col
              cols="12"
              sm="6"
              md="4"
            >
              <v-select
                v-model="ruleData.sniffer"
                :items="sniffers"
                :label="$t('rule.sniffer')"
                multiple
                chips
                hide-details
              />
            </v-col>
            <v-col
              cols="12"
              sm="6"
              md="4"
            >
              <v-text-field
                v-model="ruleData.timeout"
                :label="$t('rule.timeout')"
                hide-details
              />
            </v-col>
          </v-row>
        </v-card>
        <v-card
          v-if="ruleData.action == 'resolve'"
          subtitle="Resolve"
        >
          <v-row>
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
            <v-col
              cols="12"
              sm="6"
              md="4"
            >
              <v-text-field
                v-model="ruleData.server"
                :label="$t('basic.dns.server')"
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
import { rule, actionKeys } from '@/types/rules'
import RuleOptions from '@/components/Rule.vue'
import DocLink from '@/components/DocLink.vue'

// The form assembles a rule field by field and also addresses fields by key
// name at runtime, so it carries an index signature alongside what it reads.
interface RuleFields {
  type?: string
  mode?: string
  rules?: rule[]
  invert?: boolean
  action?: string
  outbound?: string
  override_address?: string
  override_port?: number
  network_strategy?: string
  fallback_delay?: string
  udp_disable_domain_unmapping?: boolean
  udp_connect?: boolean
  udp_timeout?: string
  sniffer?: string[]
  timeout?: string
  method?: string
  no_drop?: boolean
  server?: string
  strategy?: string
  [key: string]: unknown
}

// The form's own state always has the core fields; a rule being assembled
// for saving starts empty and fills in as the action is inspected.
// `action` and `invert` stay optional: when an existing simple rule is
// loaded they are copied in field by field, so they are absent for a moment.
type RuleDraft = RuleFields & { type: string, mode: string, rules: rule[] }

export default {
  components: { DocLink, RuleOptions },
  props: {
    visible: { type: Boolean, required: true },
    // A JSON string of the rule being edited, empty when adding a new one.
    data: { type: String, default: '' },
    index: { type: Number, required: true },
    clients: { type: Array as PropType<string[]>, default: () => [] },
    inTags: { type: Array as PropType<string[]>, default: () => [] },
    outTags: { type: Array as PropType<string[]>, default: () => [] },
    rsTags: { type: Array as PropType<string[]>, default: () => [] },
  },
  emits: ['close', 'save'],
  data() {
    return {
      title: 'add',
      loading: false,
      ruleData: <RuleDraft>{
        type: 'logical',
        mode: 'and',
        rules: <rule[]>[{}],
        invert: false,
        action: 'route',
        outbound: 'direct',
      },
      actions: [
        { title: 'Route', value: 'route'},
        { title: 'Route Options', value: 'route-options'},
        { title: 'Bypass', value: 'bypass'},
        { title: 'Reject', value: 'reject'},
        { title: 'Hijack DNS', value: 'hijack-dns'},
        { title: 'Sniff', value: 'sniff'},
        { title: 'Resolve', value: 'resolve'}
      ],
      sniffers: [
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
      ],
      strategies: [
        { title: 'Prefer IPv4', value: 'prefer_ipv4' },
        { title: 'Prefer IPv6', value: 'prefer_ipv6' },
        { title: 'IPv4 Only', value: 'ipv4_only' },
        { title: 'IPv6 Only', value: 'ipv6_only' },
      ]
    }
  },
  computed: {
    logical: {
      get() { return this.ruleData.type == 'logical' },
      set(v:boolean) {
        this.ruleData.type = v? 'logical' : 'simple'
      }
    }
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
            rules: <rule[]>[{}],
          }
          Object.keys(newData).forEach(key => {
            if (actionKeys.includes(key)) {
              this.ruleData[key] = newData[key]
            } else {
              (this.ruleData.rules[0] as Record<string, unknown>)[key] = newData[key]
            }
          })
        }
        this.title = 'edit'
      }
      else {
        this.ruleData = <RuleDraft>{
            type: 'simple',
            mode: 'and',
            rules: <rule[]>[{}],
            invert: false,
            action: 'route',
            outbound: this.$props.outTags[0]?? 'direct',
          }
        this.title = 'add'
      }
    },
    closeModal() {
      this.updateData() // reset
      this.$emit('close')
    },
    saveChanges() {
      this.loading = true
      let newRule: RuleFields = {
        action: this.ruleData.action,
        invert: this.ruleData.invert? this.ruleData.invert : undefined,
      }

      // Filter action data
      switch (newRule.action){
        case 'route':
          newRule.outbound = this.ruleData.outbound
          break
        case 'route-options':
          newRule.override_address = (this.ruleData.override_address?.length ?? 0) > 0 ? this.ruleData.override_address : undefined
          newRule.override_port = (this.ruleData.override_port ?? 0) > 0 ? this.ruleData.override_port : undefined
          newRule.network_strategy = (this.ruleData.network_strategy?.length ?? 0) > 0 ? this.ruleData.network_strategy : undefined
          newRule.fallback_delay = (this.ruleData.fallback_delay?.length ?? 0) > 0 ? this.ruleData.fallback_delay : undefined
          newRule.udp_disable_domain_unmapping = this.ruleData.udp_disable_domain_unmapping? true : undefined
          newRule.udp_connect = this.ruleData.udp_connect? true : undefined
          newRule.udp_timeout = (this.ruleData.udp_timeout?.length ?? 0) > 0 ? this.ruleData.udp_timeout : undefined
          break
        case 'reject':
          newRule.method = (this.ruleData.method?.length ?? 0) > 0 ? this.ruleData.method : undefined
          newRule.no_drop = this.ruleData.no_drop? true : undefined
          break
        case 'sniff':
          newRule.sniffer = (this.ruleData.sniffer?.length ?? 0) > 0 ? this.ruleData.sniffer : undefined
          newRule.timeout = (this.ruleData.timeout?.length ?? 0) > 0 ? this.ruleData.timeout : undefined
          break
        case 'resolve':
          newRule.strategy = (this.ruleData.strategy?.length ?? 0) > 0 ? this.ruleData.strategy : undefined
          newRule.server = (this.ruleData.server?.length ?? 0) > 0 ? this.ruleData.server : undefined
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