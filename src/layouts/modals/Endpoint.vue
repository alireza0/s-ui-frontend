<template>
  <v-dialog transition="dialog-bottom-transition" width="800">
    <v-card class="rounded-lg">
      <v-card-title class="d-flex align-center">
        {{ $t('actions.' + title) + " " + $t('objects.endpoint') }}
        <v-spacer></v-spacer>
        <DocLink section="endpoint" :type="endpoint.type" />
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text style="padding: 0 16px; overflow-y: scroll;">
        <v-row>
          <v-col cols="12" sm="6" md="4">
            <v-select
            hide-details
            :disabled="endpoint.id > 0"
            :label="$t('type')"
            :items="Object.keys(epTypes).map((key,index) => ({title: key, value: Object.values(epTypes)[index]}))"
            v-model="endpoint.type"
            @update:modelValue="changeType">
            </v-select>
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <v-text-field v-model="endpoint.tag" :label="$t('objects.tag')" hide-details></v-text-field>
          </v-col>
        </v-row>
        <Wireguard v-if="endpoint.type == epTypes.Wireguard && endpoint.ext"
          :data="endpoint"
          @getWgPubKey="getWgPubKey"
          @newWgKey="newWgKey"
          @addPeer="addWgPeer"
          @delPeer="delWgPeer"
          @refreshPeerKey="refreshWgPeerKey" />
        <Warp v-if="endpoint.type == epTypes.Warp && endpoint.ext" :data="endpoint" />
        <TailscaleVue v-if="endpoint.type == epTypes.Tailscale" :data="endpoint" />
        <OpenConnect v-if="endpoint.type == epTypes.OpenConnect" :data="endpoint" />
        <OpenConnectTls v-if="endpoint.type == epTypes.OpenConnect" :data="endpoint" />
        <OpenVpn v-if="isOpenVpn" :data="endpoint" />
        <!-- static_key mode has no TLS session to configure. -->
        <OpenVpnTls v-if="isOpenVpn && endpoint.mode == 'tls'" :data="endpoint" />
        <Dial v-if="!NoDial.includes(endpoint.type)" :dial="endpoint" />
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
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
import { EpTypes, createEndpoint } from '@/types/endpoints'
import DocLink from '@/components/DocLink.vue'
import RandomUtil from '@/plugins/randomUtil'
import Dial from '@/components/Dial.vue'
import Wireguard from '@/components/protocols/Wireguard.vue'
import Warp from '@/components/protocols/Warp.vue'
import TailscaleVue from '@/components/protocols/Tailscale.vue'
import OpenConnect from '@/components/protocols/OpenConnect.vue'
import OpenVpn from '@/components/protocols/OpenVpn.vue'
import OpenVpnTls from '@/components/tls/OpenVpnTls.vue'
import OpenConnectTls from '@/components/tls/OpenConnectTls.vue'
import HttpUtils from '@/plugins/httputil'
import { push } from 'notivue'
import { i18n } from '@/locales'
import Data from '@/store/modules/data'
export default {
  props: ['visible', 'data', 'id', 'tags'],
  emits: ['close'],
  data() {
    return {
      endpoint: createEndpoint("wireguard",{ "tag": "" }),
      title: "add",
      tab: "t1",
      loading: false,
      epTypes: EpTypes,
      // openvpn-server listens rather than dials, so it takes no dialer options.
      NoDial: [EpTypes.OpenVPNServer],
    }
  },
  methods: {
    async updateData(id: number) {
      if (id > 0) {
        const newData = JSON.parse(this.$props.data)
        this.endpoint = createEndpoint(newData.type, newData)
        this.title = "edit"
      }
      else {
        this.endpoint.type = "wireguard"
        this.endpoint.listen_port = RandomUtil.randomIntRange(10000, 60000)
        this.changeType()
        this.title = "add"
      }
      this.tab = "t1"
    },
    async changeType() {
      // Tag change only in add endpoint
      const tag = this.endpoint.type + "-" + RandomUtil.randomSeq(3)
      
      // Use previous data
      let prevConfig = {}
      switch (this.endpoint.type) {
        case EpTypes.Wireguard:
          const wgKeys = (await this.genWgKey())
          const randomIPoctet = RandomUtil.randomIntRange(1, 255)
          prevConfig = {
            tag: tag,
            listen_port: this.endpoint.listen_port ?? RandomUtil.randomIntRange(10000, 60000),
            address: ['10.0.0.'+ randomIPoctet.toString() +'/32','fe80::'+ randomIPoctet.toString(16) +'/128'],
            private_key: wgKeys.private_key,
            peers: [],
            ext: {
              public_key: wgKeys.public_key,
              keys: []
            }
          }
          break
        case EpTypes.Warp:
          prevConfig = {
            tag: tag,
          }
          break
        case EpTypes.Tailscale:
          prevConfig = { tag: tag }
          break
        case EpTypes.OpenConnect:
        case EpTypes.OpenVPNClient:
          prevConfig = { tag: tag }
          break
        case EpTypes.OpenVPNServer:
          prevConfig = {
            tag: tag,
            listen: '::',
            listen_port: this.endpoint.listen_port ?? RandomUtil.randomIntRange(10000, 60000),
          }
          break
      }
      this.endpoint = createEndpoint(this.endpoint.type, prevConfig)
    },
    closeModal() {
      this.updateData(0) // reset
      this.$emit('close')
    },
    // Drops empty strings, empty lists and objects left empty by the above,
    // one nesting level down (control_wrap).
    pruneEmpty(target: any) {
      for (const [key, value] of Object.entries(target)) {
        if (value != null && typeof value === 'object' && !Array.isArray(value)) {
          this.pruneEmpty(value)
        }
        const isEmpty = value === '' || value == null ||
          (Array.isArray(value) && value.length == 0) ||
          (typeof value === 'object' && !Array.isArray(value) && Object.keys(<any>value).length == 0)
        if (isEmpty) delete target[key]
      }
    },
    async saveChanges() {
      if (!this.$props.visible) return
      
      // check duplicate tag
      const isDuplicatedTag = Data().checkTag("endpoint",this.endpoint.id, this.endpoint.tag)
      if (isDuplicatedTag) return

      // A field the operator emptied has to leave as a missing key, not as "":
      // sing-box reads an empty path as one it cannot open. An option switched
      // on and then left alone drops out the same way, and a TLS form that ends
      // up with nothing in it at all goes with it.
      if (this.endpoint.tls) {
        this.pruneEmpty(this.endpoint.tls)
        if (Object.keys(this.endpoint.tls).length == 0) delete this.endpoint.tls
      }

      // save data
      this.loading = true
      const success = await Data().save("endpoints", this.$props.id == 0 ? "new" : "edit", this.endpoint)
      if (success) this.closeModal()
      this.loading = false
    },
    async genWgKey(){
      this.loading = true
      const msg = await HttpUtils.get('api/keypairs', { k: "wireguard" })
      this.loading = false
      let result = { private_key: "", public_key: "" }
      if (msg.success) {
        msg.obj.forEach((line:string) => {
          if (line.startsWith("PrivateKey")){
            result.private_key = line.substring(12)
          }
          if (line.startsWith("PublicKey")){
            result.public_key = line.substring(11)
          }
        })
      } else {
        push.error({
          message: i18n.global.t('error') + ": " + msg.obj
        })
      }
      return result
    },
    async newWgKey(){
      this.loading = true
      const newKeys = await this.genWgKey()
      this.endpoint.private_key = newKeys.private_key
      if (!this.endpoint.ext) this.endpoint.ext = {keys: []}
      this.endpoint.ext.public_key = newKeys.public_key
      this.loading = false
    },
    async getWgPubKey(private_key: string) {
      if (!this.endpoint.ext) this.endpoint.ext = {keys: []}
      this.loading = true
      const msg = await HttpUtils.get('api/keypairs', { k: "wireguard", o: private_key })
      if (msg.success) {
        this.endpoint.ext.public_key = msg.obj[0]
      }
      this.loading = false
    },
    async addWgPeer(){
      if (this.endpoint.type != EpTypes.Wireguard) return
      this.loading = true
      const newKeys = await this.genWgKey()
      if (!this.endpoint.ext) this.endpoint.ext = {keys: []}
      this.endpoint.ext.keys.push(newKeys)
      this.endpoint.peers.push({
        public_key: newKeys.public_key,
        allowed_ips: [this.findFreeIP()]
      })
      this.loading = false
    },
    findFreeIP(): string{
      const peerAllowedIPs = this.endpoint.peers.map((peer: any) => peer.allowed_ips).flat()
      for (let i = 2; i < 255; i++) {
        const newIP = '10.0.1.'+ i.toString() +'/32'
        if (!peerAllowedIPs.includes(newIP)) return newIP
      }
      return '0.0.0.0/0'
    },
    delWgPeer(index: number){
      if (this.endpoint.type != EpTypes.Wireguard) return
      this.endpoint.ext.keys = this.endpoint.ext.keys.filter((key: any) => key.public_key != this.endpoint.peers[index].public_key)
      this.endpoint.peers.splice(index, 1)
    },
    async refreshWgPeerKey(index: number) {
      this.loading = true
      const newKeys = await this.genWgKey()
      if (!this.endpoint.ext) this.endpoint.ext = {keys: []}
      const indexKeys = this.endpoint.ext.keys.findIndex((key: any) => key.public_key == this.endpoint.peers[index].public_key)
      this.endpoint.ext.keys[indexKeys == -1 ? this.endpoint.ext.keys.length : indexKeys] = newKeys
      this.endpoint.peers[index].public_key = newKeys.public_key
      this.loading = false
    },
  },
  watch: {
    visible(v) {
      if (v) {
        this.updateData(this.$props.id)
      }
    },
  },
  computed: {
    isOpenVpn(): boolean {
      return [EpTypes.OpenVPNClient, EpTypes.OpenVPNServer].includes(this.endpoint.type)
    },
  },
  components: { DocLink, Dial, Wireguard, Warp, TailscaleVue, OpenConnect, OpenConnectTls, OpenVpn, OpenVpnTls }
}
</script>