<template>
  <v-dialog
    transition="dialog-bottom-transition"
    width="800"
  >
    <v-card class="rounded-lg">
      <v-card-title>
        {{ $t('actions.addbulk') }}
      </v-card-title>
      <v-divider />
      <v-card-text style="padding: 0 16px; overflow-y: scroll;">
        <v-container style="padding: 0;">
          <v-row>
            <v-col
              cols="12"
              sm="6"
              md="4"
            >
              <v-text-field
                v-model.number="count"
                type="number"
                min="1"
                max="100"
                :label="$t('count')"
                hide-details
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col
              cols="12"
              sm="8"
            >
              <v-combobox
                v-model="bulkData.name"
                chips
                multiple
                :items="patterns"
                :label="$t('client.name')"
                hide-details
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col
              cols="12"
              sm="8"
            >
              <v-combobox
                v-model="bulkData.desc"
                chips
                multiple
                :items="patterns"
                :label="$t('client.desc')"
                hide-details
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col
              cols="12"
              sm="6"
              md="4"
            >
              <v-combobox
                v-model="bulkData.group"
                :items="groups"
                :label="$t('client.group')"
                hide-details
              />
            </v-col>
            <v-col
              cols="12"
              sm="6"
              md="4"
            >
              <v-text-field
                v-model.number="bulkData.Volume"
                type="number"
                min="0"
                :label="$t('stats.volume')"
                suffix="GiB"
                hide-details
              />
            </v-col>
            <v-col
              v-if="!(bulkData.delayStart && !bulkData.autoReset)"
              cols="12"
              sm="6"
              md="4"
            >
              <DatePick
                :expiry="bulkData.expiry"
                @submit="setDate"
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
                v-model="bulkData.delayStart"
                color="primary"
                :label="$t('client.delayStart')"
                hide-details
              />
            </v-col>
            <v-col
              cols="12"
              sm="6"
              md="4"
            >
              <v-switch
                v-model="bulkData.autoReset"
                color="primary"
                :label="$t('client.autoReset')"
                hide-details
              />
            </v-col>
            <v-col
              v-if="bulkData.autoReset || bulkData.delayStart"
              cols="12"
              sm="6"
              md="4"
            >
              <v-text-field
                v-model.number="bulkData.resetDays"
                type="number"
                min="1"
                :label="$t('client.resetDays')"
                hide-details
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-select
                v-model="bulkData.clientInbounds"
                :items="inboundTags"
                :label="$t('client.inboundTags')"
                multiple
                chips
                hide-details
              >
                <template #append>
                  <v-icon
                    v-tooltip:top="$t('all')"
                    icon="mdi-set-all"
                    @click="setAllInbounds"
                  />
                </template>
              </v-select>
            </v-col>
          </v-row>
        </v-container>
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
import DatePick from '@/components/DateTime.vue'
import { push } from 'notivue'
import RandomUtil from '@/plugins/randomUtil'
import { Client, createClient, randomConfigs } from '@/types/clients'
import { i18n } from '@/locales'
import Data from '@/store/modules/data'
import type { PropType } from 'vue'

// An inbound the clients can be attached to, as the parent lists them.
interface InboundTag {
  title: string
  value: number
}

// A name or description is built from literal text and generator tokens picked
// out of `patterns`.
interface PatternToken {
  title: string
  value: string
}
type PatternPart = string | PatternToken

export default {
  components: { DatePick },
  props: {
    visible: { type: Boolean, required: true },
    inboundTags: { type: Array as PropType<InboundTag[]>, required: true },
    groups: { type: Array as PropType<string[]>, required: true },
  },
  emits: ['close'],
  data() {
    return {
      count: 1,
      clients: <Client[]>[],
      bulkData: {
        name: <PatternPart[]>[],
        desc: <PatternPart[]>[],
        group: '',
        clientInbounds: <number[]>[],
        expiry: 0,
        Volume: 0,
        delayStart: false,
        autoReset: false,
        resetDays: 0,
      },
      patterns: [
        { title: i18n.global.t("bulk.random"), value: "random" },
        { title: i18n.global.t("bulk.order"), value: "order" },
      ],
      loading: false,
    }
  },
  computed: {},
  watch: {
    visible(newValue) {
      if (newValue) {
        this.resetData()
      }
    },
  },
  methods: {
    resetData() {
      this.count = 1
      this.clients = []
      this.bulkData = {
        name: [this.patterns[1], "-", this.patterns[0]],
        desc: [],
        group: '',
        clientInbounds: [],
        expiry: 0,
        Volume: 0,
        delayStart: false,
        autoReset: false,
        resetDays: 0,
      }
    },
    closeModal() {
      this.$emit('close')
    },
    async saveChanges() {
      if (!this.$props.visible) return
      if (this.bulkData.name.findIndex(n => typeof(n) == 'object') == -1) {
        push.error(i18n.global.t('error.dplData'))
        return
      }
      this.clients = []
      this.loading = true
      for(let i=0;i<this.count;i++){
        const name = this.genByPattern(this.bulkData.name, i)
        this.clients.push(createClient({
          enable: true,
          name: name,
          config: randomConfigs(name),
          inbounds: this.bulkData.clientInbounds.length > 0 ? this.bulkData.clientInbounds.sort() : [],
          links: [],
          volume: this.bulkData.Volume*(1024 ** 3),
          expiry: (this.bulkData.delayStart && !this.bulkData.autoReset) ? 0 : this.bulkData.expiry,
          up: 0,
          down: 0,
          desc: this.genByPattern(this.bulkData.desc, i),
          group: this.bulkData.group,
          delayStart: this.bulkData.delayStart,
          autoReset: this.bulkData.autoReset,
          resetDays: this.bulkData.resetDays,
        }))
      }
      // Check duplicate names
      const isDuplicateName = Data().checkBulkClientNames(this.clients.map(c => c.name))
      if (isDuplicateName) return
      const success = await Data().save("clients", "addbulk", this.clients)
      if (success) this.closeModal()
      this.loading = false
    },
    genByPattern(pattern: PatternPart[], order :number){
      if (pattern.length == 0) return RandomUtil.randomSeq(8)
      let result = ''
      pattern.forEach(p => {
        switch(typeof p){
          case 'object':
            switch(p.value){
              case "random":
                result += RandomUtil.randomSeq(8)
                break
              case "order":
                result += order+1
            }
            break
          default:
            result += p
        }
      })
      return result
    },
    setDate(v:number){
      this.bulkData.expiry = v
    },
    setAllInbounds(){
      this.bulkData.clientInbounds = this.inboundTags.map(i => i.value).sort()
    }
  },
}

</script>