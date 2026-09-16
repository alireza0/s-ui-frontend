<template>
  <v-dialog
    transition="dialog-top-transition"
    width="600"
  >
    <v-card class="rounded-lg">
      <v-card-title>
        <v-row>
          <v-col>{{ $t('ruleset.preset') }}</v-col>
          <v-col
            v-if="preview.length > 0"
            cols="auto"
          >
            <v-chip
              size="small"
              color="primary"
              variant="tonal"
            >
              {{ $t('count') }}: {{ preview.length }}
            </v-chip>
          </v-col>
        </v-row>
      </v-card-title>
      <v-divider />
      <v-card-text style="padding: 0 16px; overflow-y: scroll;">
        <v-row class="mt-1">
          <v-col cols="12">
            <v-select
              v-model="selected"
              :items="catalogItems"
              :label="$t('objects.ruleset')"
              multiple
              chips
              clearable
              hide-details
            />
          </v-col>
        </v-row>
        <v-row class="mb-2">
          <v-col
            cols="12"
            sm="6"
          >
            <v-select
              v-model="detour"
              hide-details
              :label="$t('objects.outbound')"
              :items="outTags"
              clearable
              @click:clear="detour=''"
            />
          </v-col>
          <v-col
            cols="12"
            sm="6"
          >
            <v-text-field
              v-model.number="interval"
              :suffix="$t('date.d')"
              type="number"
              min="0"
              :label="$t('ruleset.interval')"
              hide-details
            />
          </v-col>
        </v-row>
        <v-divider class="my-2" />
        <v-row
          class="mb-2"
          align="center"
        >
          <v-col
            cols="12"
            sm="6"
          >
            <v-switch
              v-model="addRoute"
              color="primary"
              :label="$t('rule.add')"
              hide-details
            />
          </v-col>
          <v-col
            v-if="addRoute"
            cols="12"
            sm="6"
          >
            <v-select
              v-model="routeTo"
              hide-details
              :label="$t('ruleset.routeTo')"
              :items="outTags"
              clearable
              @click:clear="routeTo=''"
            />
          </v-col>
        </v-row>
        <template v-if="preview.length > 0">
          <v-divider class="my-2" />
          <span class="v-card-subtitle">
            {{ $t('rule.import.preview') }}
            <v-badge
              color="success"
              :content="newCount"
              inline
            />
            <v-badge
              v-if="skipped > 0"
              v-tooltip:top="$t('rule.import.skipped')"
              color="warning"
              :content="skipped"
              inline
            />
          </span>
          <v-table
            density="compact"
            striped="even"
            class="mb-4"
          >
            <thead>
              <tr><th>{{ $t('objects.tag') }}</th><th>URL</th></tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, i) in preview"
                :key="i"
                :style="item.exists ? 'opacity:0.4' : ''"
              >
                <td>{{ item.tag }}</td>
                <td
                  v-tooltip:top="item.url"
                  dir="ltr"
                >
                  .../{{ item.url.split('/').pop() ?? item.url }}
                </td>
              </tr>
            </tbody>
          </v-table>
        </template>
      </v-card-text>
      <v-divider />
      <v-card-actions class="pa-3">
        <v-spacer />
        <v-btn
          variant="text"
          @click="$emit('close')"
        >
          {{ $t('actions.close') }}
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :disabled="newCount === 0 && !(addRoute && routeTo && preview.length > 0)"
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
import { CatalogRuleset, geoCatalog, geoList } from '@/plugins/rulesetCatalog'
import { ruleset } from '@/types/rules'
import type { PropType } from 'vue'

// A catalog entry plus whether the config already has a rule-set with that tag.
type PresetItem = CatalogRuleset & { exists: boolean }

export default {
  props: {
    visible: { type: Boolean, required: true },
    outTags: { type: Array as PropType<string[]>, required: true },
    rsTags: { type: Array as PropType<string[]>, required: true },
  },
  emits: ['save', 'close'],
  data() {
    return {
      selected: [] as string[],
      detour: '',
      interval: 1,
      addRoute: false,
      routeTo: '',
      catalogItems: geoList,
    }
  },
  computed: {
    preview(): PresetItem[] {
      const existing = new Set(this.rsTags)
      return this.selected
        .map((tag: string) => geoCatalog.find(g => g.tag == tag))
        .filter((g): g is CatalogRuleset => g != undefined)
        .map(g => ({ ...g, exists: existing.has(g.tag) }))
    },
    skipped(): number {
      return this.preview.filter(i => i.exists).length
    },
    newCount(): number {
      return this.preview.filter(i => !i.exists).length
    },
  },
  watch: {
    visible(v) {
      if (v) {
        this.selected = []
        this.detour = ''
        this.interval = 1
        this.addRoute = false
        this.routeTo = ''
      }
    },
  },
  methods: {
    save() {
      const toAdd = this.preview.filter(i => !i.exists).map(item => {
        const rs: ruleset = { type: 'remote', tag: item.tag, format: item.format, url: item.url }
        const httpClient = downloadHttpClient(this.detour)
        if (httpClient) rs.http_client = httpClient
        if (this.interval > 0) rs.update_interval = this.interval + 'd'
        return rs
      })
      // Optionally create one routing rule sending the selected rule-sets
      // (including already existing ones) to the chosen outbound.
      const rule = this.addRoute && this.routeTo && this.preview.length > 0
        ? { rule_set: this.preview.map(i => i.tag), action: 'route', outbound: this.routeTo }
        : null
      this.$emit('save', toAdd, rule)
    },
  },
}
</script>
