<template>
  <v-dialog transition="dialog-top-transition" width="600">
    <v-card class="rounded-lg">
      <v-card-title>
        <v-row>
          <v-col>{{ $t('ruleset.preset') }}</v-col>
          <v-col cols="auto" v-if="preview.length > 0">
            <v-chip size="small" color="primary" variant="tonal">
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
            ></v-select>
          </v-col>
        </v-row>
        <v-row class="mb-2">
          <v-col cols="12" sm="6">
            <v-select
              hide-details
              :label="$t('objects.outbound')"
              :items="outTags"
              clearable
              @click:clear="detour=''"
              v-model="detour">
            </v-select>
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field v-model.number="interval" :suffix="$t('date.d')" type="number" min="0" :label="$t('ruleset.interval')" hide-details></v-text-field>
          </v-col>
        </v-row>
        <v-divider class="my-2" />
        <v-row class="mb-2" align="center">
          <v-col cols="12" sm="6">
            <v-switch v-model="addRoute" color="primary" :label="$t('rule.add')" hide-details></v-switch>
          </v-col>
          <v-col cols="12" sm="6" v-if="addRoute">
            <v-select
              hide-details
              :label="$t('ruleset.routeTo')"
              :items="outTags"
              clearable
              @click:clear="routeTo=''"
              v-model="routeTo">
            </v-select>
          </v-col>
        </v-row>
        <template v-if="preview.length > 0">
          <v-divider class="my-2" />
          <span class="v-card-subtitle">
            {{ $t('rule.import.preview') }}
            <v-badge color="success" :content="newCount" inline />
            <v-badge v-if="skipped > 0" color="warning" :content="skipped" inline v-tooltip:top="$t('rule.import.skipped')" />
          </span>
          <v-table density="compact" striped="even" class="mb-4">
            <thead>
              <tr><th>{{ $t('objects.tag') }}</th><th>URL</th></tr>
            </thead>
            <tbody>
              <tr v-for="(item, i) in preview" :key="i" :style="item.exists ? 'opacity:0.4' : ''">
                <td>{{ item.tag }}</td>
                <td v-tooltip:top="item.url" dir="ltr">.../{{ item.url.split('/').pop() ?? item.url }}</td>
              </tr>
            </tbody>
          </v-table>
        </template>
      </v-card-text>
      <v-divider />
      <v-card-actions class="pa-3">
        <v-spacer />
        <v-btn @click="$emit('close')" variant="text">{{ $t('actions.close') }}</v-btn>
        <v-btn @click="save" color="primary" variant="flat" :disabled="newCount === 0 && !(addRoute && routeTo && preview.length > 0)">
          {{ $t('actions.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { geoCatalog, geoList } from '@/plugins/rulesetCatalog'

export default {
  props: ["visible", "outTags", "rsTags"],
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
    preview(): any[] {
      const existing = new Set(this.rsTags)
      return this.selected
        .map((tag: string) => geoCatalog.find(g => g.tag == tag))
        .filter((g: any) => g != undefined)
        .map((g: any) => ({ ...g, exists: existing.has(g.tag) }))
    },
    skipped(): number {
      return this.preview.filter((i: any) => i.exists).length
    },
    newCount(): number {
      return this.preview.filter((i: any) => !i.exists).length
    },
  },
  methods: {
    save() {
      const toAdd = this.preview.filter((i: any) => !i.exists).map((item: any) => {
        const rs: any = { type: 'remote', tag: item.tag, format: item.format, url: item.url }
        if (this.detour) rs.download_detour = this.detour
        if (this.interval > 0) rs.update_interval = this.interval + 'd'
        return rs
      })
      // Optionally create one routing rule sending the selected rule-sets
      // (including already existing ones) to the chosen outbound.
      const rule = this.addRoute && this.routeTo && this.preview.length > 0
        ? { rule_set: this.preview.map((i: any) => i.tag), action: 'route', outbound: this.routeTo }
        : null
      this.$emit('save', toAdd, rule)
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
}
</script>
