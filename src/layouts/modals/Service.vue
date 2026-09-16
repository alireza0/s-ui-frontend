<template>
  <v-dialog
    transition="dialog-bottom-transition"
    width="800"
  >
    <v-card class="rounded-lg">
      <v-card-title class="d-flex align-center">
        {{ $t('actions.' + title) + " " + $t('objects.service') }}
        <v-spacer />
        <DocLink
          section="service"
          :type="srv.type"
        />
      </v-card-title>
      <v-divider />
      <v-card-text style="padding: 0 16px; overflow-y: scroll;">
        <v-row>
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-select
              v-model="srv.type"
              hide-details
              :label="$t('type')"
              :items="Object.keys(srvTypes).map((key,index) => ({title: key, value: Object.values(srvTypes)[index]}))"
              @update:model-value="changeType"
            />
          </v-col>
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-text-field
              v-model="srv.tag"
              :label="$t('objects.tag')"
              hide-details
            />
          </v-col>
        </v-row>

        <Listen
          v-if="!NoListen.includes(srv.type)"
          :data="srv"
          :in-tags="inTags"
        />
        <Derp
          v-if="srv.type == srvTypes.DERP"
          :data="srv"
          :in-tags="inTags"
          :ts-tags="tsTags"
        />
        <SSMapi
          v-if="srv.type == srvTypes.SSMAPI"
          :data="srv"
          :ss-tags="ssTags"
        />
        <Ocm
          v-if="srv.type == srvTypes.OCM"
          :data="srv"
        />
        <Ccm
          v-if="srv.type == srvTypes.CCM"
          :data="srv"
        />
        <Api
          v-if="srv.type == srvTypes.API"
          :data="srv"
        />
        <OomKiller
          v-if="srv.type == srvTypes.OOMKiller"
          :data="srv"
        />
        <InTLS
          v-if="HasTls.includes(srv.type)"
          :inbound="srv"
          :tls-configs="tlsConfigs"
          :tls_id="srv.tls_id"
        />
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
import { SrvTypes, createSrv, Srv } from '@/types/services'
import { tls } from '@/types/tls'
import DocLink from '@/components/DocLink.vue'
import RandomUtil from '@/plugins/randomUtil'
import Listen from '@/components/Listen.vue'
import Derp from '@/components/services/Derp.vue'
import Ocm from '@/components/services/Ocm.vue'
import Ccm from '@/components/services/Ccm.vue'
import Api from '@/components/services/Api.vue'
import OomKiller from '@/components/services/OomKiller.vue'
import InTLS from '@/components/tls/InTLS.vue'
import SSMapi from '@/components/services/SSMAPI.vue'
import Data from '@/store/modules/data'
export default {
  components: { DocLink, Listen, InTLS, Derp, Ocm, Ccm, SSMapi, Api, OomKiller },
  props: {
    visible: { type: Boolean, required: true },
    // A JSON string of the service being edited, empty when adding a new one.
    data: { type: String, default: '' },
    id: { type: Number, required: true },
    inTags: { type: Array as PropType<string[]>, default: () => [] },
    tsTags: { type: Array as PropType<string[]>, default: () => [] },
    ssTags: { type: Array as PropType<string[]>, default: () => [] },
    tlsConfigs: { type: Array as PropType<tls[]>, default: () => [] },
  },
  emits: ['close'],
  data() {
    return {
      srv: createSrv("derp",{ "tag": "" }),
      title: "add",
      tab: "t1",
      loading: false,
      srvTypes: SrvTypes,
      HasTls: [SrvTypes.DERP, SrvTypes.SSMAPI, SrvTypes.OCM, SrvTypes.CCM, SrvTypes.API],
      // oom-killer has no listen options at all
      NoListen: [SrvTypes.OOMKiller],
    }
  },
  watch: {
    visible(v) {
      if (v) {
        this.updateData(this.$props.id)
      }
    },
  },
  methods: {
    async updateData(id: number) {
      if (id > 0) {
        const newData = JSON.parse(this.$props.data)
        this.srv = createSrv(newData.type, newData)
        this.title = "edit"
      }
      else {
        const port = RandomUtil.randomIntRange(10000, 60000)
        this.srv = createSrv("derp", {
          tag: "derp-" + RandomUtil.randomSeq(3),
          listen: '::',
          listen_port: port,
        })
        this.title = "add"
      }
      this.tab = "t1"
    },
    changeType() {
      // Tag change only in add service
      const tag = this.$props.id > 0 ? this.srv.tag : this.srv.type + "-" + RandomUtil.randomSeq(3)
      // Use previous data
      // Only carry the listen settings across to a type that actually listens;
      // sing-box rejects listen options on oom-killer.
      const prevConfig: Record<string, unknown> = { id: this.srv.id, tag: tag }
      if (!this.NoListen.includes(this.srv.type)) {
        prevConfig.listen = this.srv.listen
        prevConfig.listen_port = this.srv.listen_port
      }
      this.srv = createSrv(this.srv.type, prevConfig)
    },
    closeModal() {
      this.updateData(0) // reset
      this.$emit('close')
    },
    async saveChanges() {
      if (!this.$props.visible) return

      // check duplicate tag
      const isDuplicatedTag = Data().checkTag("service",this.srv.id, this.srv.tag)
      if (isDuplicatedTag) return

      // A service switched over from a listening type may still carry listen
      // settings the new type does not accept.
      if (this.NoListen.includes(this.srv.type)) {
        const srv = this.srv as Partial<Srv>
        delete srv.listen
        delete srv.listen_port
        delete srv.tls_id
      }

      // save data
      this.loading = true
      const success = await Data().save("services", this.$props.id == 0 ? "new" : "edit", this.srv)
      if (success) this.closeModal()
      this.loading = false
    },
  },
}
</script>