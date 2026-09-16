<template>
  <v-dialog
    transition="dialog-bottom-transition"
    width="800"
  >
    <v-card class="rounded-lg">
      <v-card-title class="d-flex align-center">
        {{ $t('actions.' + title) + " " + $t('objects.ruleset') }}
        <v-spacer />
        <DocLink section="ruleset" />
      </v-card-title>
      <v-divider />
      <v-card-text style="padding: 0 16px;">
        <v-row>
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-select
              v-model="rule_set.type"
              hide-details
              :label="$t('type')"
              :items="[{title: $t('ruleset.local'), value: 'local'},{ title: $t('ruleset.remote'), value: 'remote'}]"
              @update:model-value="updateType($event)"
            />
          </v-col>
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-text-field
              v-model="rule_set.tag"
              :label="$t('objects.tag')"
              hide-details
            />
          </v-col>
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-select
              v-model="rule_set.format"
              hide-details
              :label="$t('ruleset.format')"
              :items="['source', 'binary']"
            />
          </v-col>
        </v-row>
        <v-row v-if="rule_set.type == 'local'">
          <v-col cols="12">
            <v-text-field
              v-model="rule_set.path"
              :label="$t('transport.path')"
              hide-details
            />
          </v-col>
        </v-row>
        <v-row v-else>
          <v-col cols="12">
            <v-text-field
              v-model="rule_set.url"
              label="URL"
              hide-details
            />
          </v-col>
          <!-- Download over a shared client, or over a single outbound. The
               two are alternatives, so choosing one clears the other. -->
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-select
              v-model="http_client"
              hide-details
              :label="$t('basic.httpClient.title')"
              :items="httpClients"
              :no-data-text="$t('basic.httpClient.none')"
              clearable
            />
          </v-col>
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-select
              v-model="download_detour"
              hide-details
              :label="$t('objects.outbound')"
              :items="outTags"
              clearable
            />
          </v-col>
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-text-field
              v-model.number="update_intervals"
              :suffix="$t('date.d')"
              type="number"
              min="0"
              :label="$t('ruleset.interval')"
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
import RandomUtil from '@/plugins/randomUtil'
import { ruleset } from '@/types/rules'
import DocLink from '@/components/DocLink.vue'
import { downloadHttpClient, httpClientTags, refDetour, refTag } from '@/plugins/httpClient'
import type { PropType } from 'vue'
export default {
  components: { DocLink },
  props: {
    visible: { type: Boolean, required: true },
    data: { type: String, required: true },
    index: { type: Number, required: true },
    outTags: { type: Array as PropType<string[]>, required: true },
  },
  emits: ['close', 'save'],
  data() {
    return {
      title: "add",
      loading: false,
      rule_set: <ruleset>{},
    }
  },
  computed: {
    httpClients(): string[] {
      return httpClientTags()
    },
    // Naming a shared client replaces any inline options, since http_client
    // holds one or the other.
    http_client: {
      get() { return refTag(this.rule_set.http_client) },
      set(v: string | undefined) {
        if (v) this.rule_set.http_client = v
        else delete this.rule_set.http_client
      }
    },
    // The inline form, carrying just the outbound to download over. An empty
    // choice drops http_client entirely rather than leaving an empty transport.
    download_detour: {
      get() { return refDetour(this.rule_set.http_client) },
      set(v: string | undefined) {
        const httpClient = v ? downloadHttpClient(v) : undefined
        if (httpClient) this.rule_set.http_client = httpClient
        else delete this.rule_set.http_client
      }
    },
    update_intervals: {
      get() { return this.rule_set.update_interval != undefined ? parseInt(this.rule_set.update_interval.replace('d','')) : 0 },
      set(v:number) { this.rule_set.update_interval = v>0 ?  v + 'd' : undefined }
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
        this.title = "edit"
        this.rule_set = <ruleset>JSON.parse(this.$props.data)
      }
      else {
        this.title = "add"
        this.rule_set = <ruleset>{type: 'local', tag: "rs-" + RandomUtil.randomSeq(3), format: 'binary'}
      }
    },
    updateType(t:string) {
      if (t == 'local') {
        delete this.rule_set.url
        delete this.rule_set.http_client
        delete this.rule_set.update_interval
      } else {
        delete this.rule_set.path
      }
    },
    closeModal() {
      this.$emit('close')
    },
    saveChanges() {
      this.loading = true
      this.$emit('save', this.rule_set)
      this.loading = false
    }
  },
}
</script>