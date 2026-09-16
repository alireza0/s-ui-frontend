<template>
  <v-dialog
    transition="dialog-top-transition"
    width="800"
  >
    <v-card class="rounded-lg">
      <v-card-title>
        <v-row>
          <v-col>{{ $t('rule.import.title') }}</v-col>
          <v-col
            v-if="importPreview.length > 0"
            cols="auto"
          >
            <v-chip
              size="small"
              color="primary"
              variant="tonal"
            >
              {{ $t('count') }}: {{ importPreview.length }}
            </v-chip>
          </v-col>
        </v-row>
      </v-card-title>
      <v-divider />
      <v-card-text style="padding: 0 16px; overflow-y: scroll;">
        <v-tabs
          v-model="tab"
          @update:model-value="tabChanged"
        >
          <v-tab value="text">
            {{ $t('rule.import.pasteUrls') }}
          </v-tab>
          <v-tab value="file">
            {{ $t('rule.import.uploadTxt') }}
          </v-tab>
        </v-tabs>
        <v-window
          v-model="tab"
          class="mb-4"
        >
          <v-window-item value="text">
            <v-alert
              variant="text"
              type="info"
            >
              {{ $t('rule.import.urlsHint') }}
            </v-alert>
            <v-textarea
              v-model="importRawText"
              label="URLs"
              variant="outlined"
              rows="10"
              auto-grow
              hide-details
              spellcheck="false"
              placeholder="https://github.com/.../geoip-telegram.srs&#10;https://github.com/.../geosite-youtube.srs"
            />
          </v-window-item>
          <v-window-item value="file">
            <v-alert
              variant="text"
              type="info"
            >
              {{ $t('rule.import.fileHint') }}
            </v-alert>
            <v-file-input
              :label="$t('rule.import.selectTxt')"
              accept=".txt"
              variant="outlined"
              hide-details
              prepend-icon="mdi-file-document"
              @change="onFileUpload"
            />
          </v-window-item>
        </v-window>
        <v-row class="mb-4">
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-select
              v-model="importFormat"
              hide-details
              :label="$t('ruleset.format')"
              :items="['source', 'binary']"
            />
          </v-col>
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-select
              v-model="importDetour"
              hide-details
              :label="$t('objects.outbound')"
              :items="outTags"
              clearable
              @click:clear="importDetour=''"
            />
          </v-col>
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-text-field
              v-model.number="importInterval"
              :suffix="$t('date.d')"
              type="number"
              min="0"
              :label="$t('ruleset.interval')"
              hide-details
            />
          </v-col>
        </v-row>

        <template v-if="importPreview.length > 0">
          <v-divider class="my-4" />
          <span class="v-card-subtitle">
            {{ $t('rule.import.preview') }}
            <v-badge
              v-if="importPreview.length > 0"
              color="success"
              :content="importPreview.length"
              inline
            />
            <v-badge
              v-if="importSkipped > 0"
              v-tooltip:top="$t('rule.import.skipped')"
              color="warning"
              :content="importSkipped"
              inline
            />
          </span>
          <v-table
            density="compact"
            striped="even"
            class="mb-4"
          >
            <thead>
              <tr><th>{{ $t('objects.tag') }}</th><th>{{ $t('ruleset.format') }}</th><th>URL</th><th>{{ $t('actions.del') }}</th></tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, i) in importPreview"
                :key="i"
                :style="item.exists ? 'opacity:0.4' : ''"
              >
                <td>
                  {{ item.tag }}
                </td>
                <td>{{ item.format }}</td>
                <td
                  v-tooltip:top="item.url"
                  dir="ltr"
                >
                  .../{{ item.url.split('/').pop() ?? item.url }}
                </td>
                <td>
                  <v-icon
                    icon="mdi-delete"
                    color="error"
                    @click="importPreview.splice(i, 1)"
                  />
                </td>
              </tr>
            </tbody>
          </v-table>
        </template>
      </v-card-text>
      <v-divider />
      <v-card-actions class="pa-3">
        <v-btn
          variant="tonal"
          :disabled="importRawText.trim().length === 0"
          @click="parseImport"
        >
          <v-icon
            icon="mdi-magnify"
            class="mr-1"
          />{{ $t('rule.import.parse') }}
        </v-btn>
        <v-spacer />
        <v-btn
          variant="text"
          @click="close"
        >
          {{ $t('actions.close') }}
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :disabled="newCount === 0"
          @click="save"
        >
          {{ $t('actions.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { downloadHttpClient } from '@/plugins/httpClient'
import { ruleset } from '@/types/rules'
import type { PropType } from 'vue'
interface ImportItem { tag: string; url: string; format: ruleset['format']; exists: boolean }

export default {
  props: {
    visible: { type: Boolean, required: true },
    outTags: { type: Array as PropType<string[]>, required: true },
    rsTags: { type: Array as PropType<string[]>, required: true },
  },
  emits: ['save', 'close'],
  data() {
    return {
      tab: 'text',
      importRawText: '',
      importFormat: <ruleset['format']>'binary',
      importDetour: '',
      importInterval: 1,
      importPreview: [] as ImportItem[],
    }
  },
  computed: {
    importSkipped(): number {
      return this.importPreview.filter(i => i.exists).length
    },
    newCount(): number {
      return this.importPreview.filter(i => !i.exists).length
    },
  },
  watch: {
    visible(v) {
      if (v) {
        this.tab = 'text'
        this.tabChanged()
      }
    },
  },
  methods: {
    tabChanged() {
      this.importPreview = []
      this.importRawText = ''
    },
    urlToTag(url: string): string {
      try {
        const filename = new URL(url).pathname.split('/').pop() ?? ''
        return filename.replace(/\.[^.]+$/, '')
      } catch {
        const parts = url.split('/')
        return parts[parts.length - 1].replace(/\.[^.]+$/, '') || url
      }
    },
    close() {
      this.$emit('close')
    },
    parseImport() {
      const existingTags = new Set(this.rsTags)
      const seen = new Set<string>()
      this.importPreview = this.importRawText
        .split('\n').map(l => l.trim()).filter(l => l.length > 0 && l.startsWith('http'))
        .filter(url => { if (seen.has(url)) return false; seen.add(url); return true })
        .map(url => ({ tag: this.urlToTag(url), url, format: this.importFormat, exists: existingTags.has(this.urlToTag(url)) }))
    },
    save() {
      const toAdd = this.importPreview.filter(i => !i.exists).map(item => {
        const rs: ruleset = { type: 'remote', tag: item.tag, format: item.format, url: item.url }
        const httpClient = downloadHttpClient(this.importDetour)
        if (httpClient) rs.http_client = httpClient
        if (this.importInterval > 0) rs.update_interval = this.importInterval + 'd'
        return rs
      })
      this.$emit('save', toAdd)
    },
    async onFileUpload(event: Event) {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (!file) return
      this.importRawText = await file.text()
      this.parseImport()
    },
  },
}
</script>
