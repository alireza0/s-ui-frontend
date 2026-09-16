<template>
  <v-dialog
    transition="dialog-bottom-transition"
    width="800"
  >
    <v-card class="rounded-lg">
      <v-card-title class="d-flex align-center">
        {{ $t('actions.' + title) + " " + $t('objects.dnsserver') }}
        <v-spacer />
        <DocLink section="dnsServer" />
      </v-card-title>
      <v-divider />
      <v-card-text>
        <v-row>
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-select
              v-model="dnsServer.type"
              :items="dnsTypes"
              :label="$t('type')"
              hide-details
              @update:model-value="changeType"
            />
          </v-col>
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-text-field
              v-model="dnsServer.tag"
              :label="$t('objects.tag')"
              hide-details
            />
          </v-col>
        </v-row>
        <v-row v-if="HasServer.includes(dnsServer.type)">
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-text-field
              v-model="dnsServer.server"
              :label="$t('in.addr')"
              hide-details
            />
          </v-col>
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-text-field
              v-model.number="dnsServer.server_port"
              type="number"
              min="0"
              :label="$t('in.port')"
              hide-details
            />
          </v-col>
        </v-row>
        <v-row v-if="HasHeaders.includes(dnsServer.type)">
          <v-col
            cols="12"
            sm="8"
          >
            <v-text-field
              v-model="dnsServer.path"
              :label="$t('transport.path')"
              hide-details
            />
          </v-col>
        </v-row>
        <DialVue
          v-if="!WithoutDial.includes(dnsServer.type)"
          :dial="dnsServer"
        />
        <oTlsVue
          v-if="HasTls.includes(dnsServer.type)"
          :outbound="dnsServer"
        />
        <Headers
          v-if="HasHeaders.includes(dnsServer.type)"
          :data="dnsServer"
        />
        <template v-if="dnsServer.type == 'hosts'">
          <v-row>
            <v-col
              cols="12"
              sm="6"
            >
              <v-text-field
                v-model="hostsPath"
                :label="$t('transport.path') + $t('commaSeparated')"
                hide-details
              />
            </v-col>
          </v-row>
          <v-card>
            <v-card-subtitle>
              Predefined
              <v-chip
                color="primary"
                density="compact"
                variant="elevated"
                @click="addHostsPredefined"
              >
                <v-icon icon="mdi-plus" />
              </v-chip>
            </v-card-subtitle>
            <v-row
              v-for="(pd, pdIndex) in hostsPredefined"
              :key="pdIndex"
            >
              <v-col
                cols="12"
                sm="6"
                md="4"
              >
                <v-text-field
                  v-model="pd.name"
                  :label="$t('setting.domain')"
                  hide-details
                  @input="update_pds_key(pdIndex,$event.target.value)"
                />
              </v-col>
              <v-col
                cols="12"
                sm="6"
              >
                <v-text-field
                  v-model="pd.value"
                  :label="$t('types.tun.addr') + $t('commaSeparated')"
                  hide-details
                  @input="update_pds_value(pdIndex,$event.target.value)"
                >
                  <template #append>
                    <v-icon
                      color="error"
                      icon="mdi-delete"
                      @click="delHostsPredefined(pdIndex)"
                    />
                  </template>
                </v-text-field>
              </v-col>
            </v-row>
          </v-card>
        </template>
        <v-row v-if="dnsServer.type == 'local'">
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-switch
              v-model="dnsServer.prefer_go"
              color="primary"
              :label="$t('dns.local.preferGo')"
              hide-details
            />
          </v-col>
        </v-row>
        <v-row v-if="dnsServer.type == 'dhcp'">
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-text-field
              v-model="dnsServer.interface"
              :label="$t('types.tun.ifName')"
              hide-details
            />
          </v-col>
        </v-row>
        <v-row v-if="dnsServer.type == 'fakeip'">
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-text-field
              v-model="dnsServer.inet4_range"
              :label="$t('dns.rule.inet4Range')"
              hide-details
            />
          </v-col>
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-text-field
              v-model="dnsServer.inet6_range"
              :label="$t('dns.rule.inet6Range')"
              hide-details
            />
          </v-col>
        </v-row>
        <v-row v-if="dnsServer.type == 'tailscale' || dnsServer.type == 'resolved'">
          <v-col
            v-if="dnsServer.type == 'tailscale'"
            cols="12"
            sm="6"
            md="4"
          >
            <v-select
              v-model="dnsServer.endpoint"
              :label="$t('objects.endpoint')"
              :items="tsTags"
              hide-details
            />
          </v-col>
          <v-col
            v-if="dnsServer.type == 'resolved'"
            cols="12"
            sm="6"
            md="4"
          >
            <v-select
              v-model="dnsServer.service"
              :label="$t('objects.service')"
              :items="rslvdTags"
              hide-details
            />
          </v-col>
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-switch
              v-model="dnsServer.accept_default_resolvers"
              :label="$t('dns.rule.acceptDefault')"
              hide-details
            />
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          color="primary"
          variant="outlined"
          @click="close"
        >
          {{ $t('actions.close') }}
        </v-btn>
        <v-btn
          color="primary"
          variant="tonal"
          @click="save"
        >
          {{ $t('actions.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import DialVue from '@/components/Dial.vue'
import DocLink from '@/components/DocLink.vue'
import oTlsVue from '@/components/tls/OutTLS.vue'
import Headers from '@/components/Headers.vue'
import RandomUtil from '@/plugins/randomUtil'
import { PropType } from 'vue'
import { DnsTypes, createDnsServer } from '@/types/dns'

// One row of the predefined-hosts editor: a hostname and its comma-joined
// answers, which the getter flattens from the stored record and the setter
// splits back out.
interface PredefinedHost {
  name: string
  value: string
}
export default {
  components: { DocLink, DialVue, oTlsVue, Headers },
  props: {
    visible: { type: Boolean, required: true },
    // A JSON string of the DNS server being edited, empty when adding one.
    data: { type: String, default: '' },
    index: { type: Number, required: true },
    tsTags: { type: Array as PropType<string[]>, default: () => [] },
    rslvdTags: { type: Array as PropType<string[]>, default: () => [] },
  },
  emits: ['close', 'save'],
  data() {
    return {
      title: "add",
      dnsServer: createDnsServer("local",{tag: "dns-" + RandomUtil.randomSeq(3)}),
      dnsTypes: Object.keys(DnsTypes).map((key,index) => ({title: key, value: Object.values(DnsTypes)[index]})),
      HasServer: [DnsTypes.TCP, DnsTypes.UDP, DnsTypes.TLS, DnsTypes.QUIC, DnsTypes.HTTPS, DnsTypes.HTTP3],
      HasHeaders: [DnsTypes.HTTPS, DnsTypes.HTTP3],
      HasTls: [DnsTypes.TLS, DnsTypes.QUIC, DnsTypes.HTTPS, DnsTypes.HTTP3],
      WithoutDial: [DnsTypes.Hosts, DnsTypes.Tailscale, DnsTypes.FakeIP, DnsTypes.Resolved],
    }
  },
  computed:{
    hostsPath: {
      get() { return this.dnsServer.path },
      set(v: string) {
        this.dnsServer.path = v.length > 0 ? v.split(',').map((item: string) => item.trim()) : undefined
      }
    },
    hostsPredefined: {
      get(): PredefinedHost[] {
        const pds: PredefinedHost[] = []
        const h = this.dnsServer.predefined
        if (h) {
          Object.keys(h).forEach(key => {
            if (Array.isArray(h[key])){
              pds.push({ name: key, value: h[key].join(',') })
            } else {
              pds.push({ name: key, value: h[key] })
            }
          })
        }
        return pds
       },
      set(v: PredefinedHost[]) {
        if (v.length>0) {
          const pds: Record<string, string[]> = {}
          v.forEach(pd => {
            pds[pd.name] = pd.value.split(',').map((item: string) => item.trim())
          })
          this.dnsServer.predefined = pds
        } else {
          this.dnsServer.predefined = undefined
        }
      }
    },
  },
  watch: {
    visible(v) {
      if (v) {
        this.updateData()
      }
    },
  },
  methods: {
    updateData() {
      if (this.$props.index != -1) {
        this.dnsServer = JSON.parse(this.$props.data)
        this.title = 'edit'
      }
      else {
        this.dnsServer = createDnsServer("local",{tag: "dns-" + RandomUtil.randomSeq(3)})
        this.title = 'add'
      }
    },
    changeType(dnsType: string) {
      this.dnsServer = createDnsServer(dnsType,{tag: this.dnsServer.tag})
    },
    close() {
      this.$emit('close')
    },
    save() {
      this.$emit('save', this.dnsServer)
    },
    addHostsPredefined() {
      const newPredefined = { name:'localhost', value: '127.0.0.1,::1' }
      this.hostsPredefined = [...this.hostsPredefined, newPredefined]
    },
    delHostsPredefined(i:number) {
      let pds = this.hostsPredefined
      pds.splice(i,1)
      this.hostsPredefined = pds
    },
    update_pds_key(i:number,k:string) {
      let pds = this.hostsPredefined
      pds[i].name = k
      this.hostsPredefined = pds
    },
    update_pds_value(i:number,v:string) {
      let pds = this.hostsPredefined
      pds[i].value = v
      this.hostsPredefined = pds
    },
  }
}
</script>
