<template>
  <v-dialog transition="dialog-bottom-transition" width="800">
    <v-card class="rounded-lg">
      <v-card-title>
        {{ $t('actions.' + title) + " " + $t('objects.endpoint') }}
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
        <Wireguard v-if="endpoint.type == epTypes.Wireguard" :data="endpoint" :options="options" @getWgPubKey="getWgPubKey" @newWgKey="newWgKey" />
        <Warp v-if="endpoint.type == epTypes.Warp" :data="endpoint" />
        <TailscaleVue v-if="endpoint.type == epTypes.Tailscale" :data="endpoint" />
        <Dial :dial="endpoint" :outTags="tags" />
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
import RandomUtil from '@/plugins/randomUtil'
import Dial from '@/components/Dial.vue'
import Wireguard from '@/components/protocols/Wireguard.vue'
import Warp from '@/components/protocols/Warp.vue'
import TailscaleVue from '@/components/protocols/Tailscale.vue'
import HttpUtils from '@/plugins/httputil'
import { push } from 'notivue'
import { i18n } from '@/locales'
export default {
  props: ['visible', 'data', 'id', 'tags'],
  emits: ['close', 'save'],
  data() {
    return {
      endpoint: createEndpoint("wireguard",{ "tag": "" }),
      title: "add",
      tab: "t1",
      loading: false,
      epTypes: EpTypes,
      options: <any>{},
    }
  },
  methods: {
    async updateData() {
      if (this.$props.id > 0) {
        const newData = JSON.parse(this.$props.data)
        this.endpoint = createEndpoint(newData.type, newData)
        this.options = {}
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
            peers: [{
              public_key: '',
              allowed_ips: ['0.0.0.0/0', '::/0']
            }]
          }
          this.options.public_key = wgKeys.public_key
          break
        case EpTypes.Warp:
          prevConfig = {
            tag: tag,
          }
          break
        case EpTypes.Tailscale:
          prevConfig = { tag: tag }
          break
      }
      this.endpoint = createEndpoint(this.endpoint.type, prevConfig)
    },
    closeModal() {
      this.updateData() // reset
      this.$emit('close')
    },
    saveChanges() {
      this.loading = true
      this.$emit('save', this.endpoint)
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
      const newKeys = await this.genWgKey()
      this.endpoint.private_key = newKeys.private_key
      this.options.public_key = newKeys.public_key
    },
    async getWgPubKey(private_key: string) {
      this.loading = true
      const msg = await HttpUtils.get('api/keypairs', { k: "wireguard", o: private_key })
      if (msg.success) {
        this.options.public_key = msg.obj        
      }
      this.loading = false
    }
  },
  watch: {
    visible(v) {
      if (v) {
        this.updateData()
      }
    },
  },
  components: { Dial, Wireguard, Warp, TailscaleVue }
}
</script>