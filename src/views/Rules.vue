<template>
  <RuleVue
    v-model="ruleModal.visible"
    :visible="ruleModal.visible"
    :index="ruleModal.index"
    :data="ruleModal.data"
    :clients="clients"
    :inTags="inboundTags"
    :outTags="outboundTags"
    :rsTags="rulesetTags"
    @close="closeRuleModal"
    @save="saveRuleModal"
  />
  <RulesetVue
    v-model="rulesetModal.visible"
    :visible="rulesetModal.visible"
    :index="rulesetModal.index"
    :data="rulesetModal.data"
    :outTags="outboundTags"
    @close="closeRulesetModal"
    @save="saveRulesetModal"
  />

  <!-- ───────────── Bulk Import Dialog ───────────── -->
  <v-dialog v-model="importDialog" max-width="700" scrollable>
    <v-card>
      <v-card-title class="d-flex align-center pa-4">
        <v-icon icon="mdi-download-multiple" class="mr-2" />
        Bulk import rulesets
        <v-spacer />
        <v-chip v-if="importPreview.length > 0" size="small" color="primary" variant="tonal">
          {{ importPreview.length }} URLs
        </v-chip>
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-4">

        <!-- Вкладки: textarea / file -->
        <v-tabs v-model="importTab" class="mb-4">
          <v-tab value="text">
            <v-icon icon="mdi-text" class="mr-1" size="small" />
            Paste URLs
          </v-tab>
          <v-tab value="file">
            <v-icon icon="mdi-file-upload" class="mr-1" size="small" />
            Upload .txt file
          </v-tab>
        </v-tabs>

        <v-window v-model="importTab">
          <!-- Tab: вставить текстом -->
          <v-window-item value="text">
            <p class="text-caption text-medium-emphasis mb-2">
              One URL per line. Tag is parsed from filename without extension.
            </p>
            <v-textarea
              v-model="importRawText"
              label="URLs"
              variant="outlined"
              rows="10"
              auto-grow
              hide-details
              spellcheck="false"
              placeholder="https://github.com/.../geoip-telegram.srs&#10;https://github.com/.../geosite-youtube.srs"
              style="font-family: monospace; font-size: 13px;"
            ></v-textarea>
          </v-window-item>

          <!-- Tab: загрузить файл -->
          <v-window-item value="file">
            <p class="text-caption text-medium-emphasis mb-2">
              Upload a .txt file with one URL per line.
            </p>
            <v-file-input
              label="Select .txt file"
              accept=".txt"
              variant="outlined"
              hide-details
              prepend-icon="mdi-file-document"
              @change="onFileUpload"
            ></v-file-input>
          </v-window-item>
        </v-window>

        <!-- Настройки -->
        <v-row class="mt-4">
          <v-col cols="12" sm="6" md="4">
            <v-select
              v-model="importFormat"
              :items="['binary', 'source']"
              label="Format"
              variant="outlined"
              hide-details
              density="compact"
            ></v-select>
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <v-select
              v-model="importDetour"
              :items="[{ title: '— none —', value: '' }, ...outboundTags]"
              label="Download detour"
              variant="outlined"
              hide-details
              density="compact"
              clearable
            ></v-select>
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <v-text-field
              v-model.number="importInterval"
              label="Update interval (days)"
              type="number"
              min="0"
              variant="outlined"
              hide-details
              density="compact"
            ></v-text-field>
          </v-col>
        </v-row>

        <!-- Preview таблица -->
        <template v-if="importPreview.length > 0">
          <v-divider class="my-4" />
          <p class="text-caption text-medium-emphasis mb-2">Preview — {{ importPreview.length }} rulesets to import ({{ importSkipped }} already exist, shown in grey)</p>
          <v-table density="compact" style="font-size: 13px;">
            <thead>
              <tr>
                <th>Tag</th>
                <th>Format</th>
                <th>URL</th>
                <th style="width:36px;"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, i) in importPreview" :key="i" :style="item.exists ? 'opacity:0.4' : ''">
                <td>
                  <v-text-field
                    v-model="item.tag"
                    variant="plain"
                    hide-details
                    density="compact"
                    style="font-family: monospace; min-width: 140px;"
                  ></v-text-field>
                </td>
                <td style="white-space: nowrap;">{{ item.format }}</td>
                <td style="font-family: monospace; word-break: break-all; font-size: 11px;">{{ item.url }}</td>
                <td>
                  <v-btn icon="mdi-close" size="x-small" variant="text" color="error" @click="importPreview.splice(i, 1)" />
                </td>
              </tr>
            </tbody>
          </v-table>
        </template>

      </v-card-text>
      <v-divider />
      <v-card-actions class="pa-3">
        <v-btn @click="importDialog = false" variant="text">Cancel</v-btn>
        <v-spacer />
        <v-btn
          @click="parseImport"
          variant="tonal"
          :disabled="importRawText.trim().length === 0"
        >
          <v-icon icon="mdi-magnify" class="mr-1" />
          Parse
        </v-btn>
        <v-btn
          @click="applyImport"
          color="primary"
          variant="flat"
          :disabled="importPreview.filter(i => !i.exists).length === 0"
        >
          <v-icon icon="mdi-download-multiple" class="mr-1" />
          Import {{ importPreview.filter(i => !i.exists).length > 0 ? importPreview.filter(i => !i.exists).length : '' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <!-- ──────────────────────────────────────────── -->

  <v-row>
    <v-col cols="12" justify="center" align="center">
      <v-btn color="primary" @click="showRuleModal(-1)" style="margin: 0 5px;">{{ $t('rule.add') }}</v-btn>
      <v-btn color="primary" @click="showRulesetModal(-1)" style="margin: 0 5px;">{{ $t('ruleset.add') }}</v-btn>
      <v-btn color="secondary" @click="openImportDialog" style="margin: 0 5px;">
        <v-icon icon="mdi-download-multiple" class="mr-1" />
        Import rulesets
      </v-btn>
      <v-btn variant="outlined" color="warning" @click="saveConfig" :loading="loading" :disabled="stateChange">
        {{ $t('actions.save') }}
      </v-btn>
    </v-col>
  </v-row>
  <v-row>
    <v-col class="v-card-subtitle" cols="12">{{ $t('basic.routing.title') }} </v-col>
    <v-col cols="12">
        <v-row>
          <v-col cols="12" sm="6" md="3" lg="2">
            <v-select
              hide-details
              :label="$t('basic.routing.defaultOut')"
              clearable
              @click:clear="delete route.final"
              :items="outboundTags"
              v-model="route.final">
            </v-select>
          </v-col>
          <v-col cols="12" sm="6" md="3" lg="2">
            <v-text-field
              v-model="route.default_interface"
              hide-details
              clearable
              @click:clear="delete route.default_interface"
              :label="$t('basic.routing.defaultIf')"
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6" md="3" lg="2">
            <v-text-field
              v-model.number="routeMark"
              hide-details
              type="number"
              min="0"
              :label="$t('basic.routing.defaultRm')"
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6" md="3" lg="2">
            <v-switch
              v-model="route.auto_detect_interface"
              color="primary"
              :label="$t('basic.routing.autoBind')"
              hide-details>
            </v-switch>
          </v-col>
        </v-row>
      </v-col>
  </v-row>
  <v-row>
    <v-col class="v-card-subtitle" cols="12">{{ $t('rule.ruleset') }}</v-col>
    <v-col cols="12" sm="4" md="3" lg="2" v-for="(item, index) in <any[]>rulesets" :key="item.tag">
      <v-card rounded="xl" elevation="5" min-width="200" :title="item.tag">
        <v-card-subtitle style="margin-top: -15px;">
          <v-row>
            <v-col>{{ $t('ruleset.' + item.type) }}</v-col>
          </v-row>
        </v-card-subtitle>
        <v-card-text>
          <v-row>
            <v-col>{{ $t('ruleset.format') }}</v-col>
            <v-col>
              {{ item.format }}
            </v-col>
          </v-row>
          <v-row>
            <v-col>{{ $t('actions.update') }}</v-col>
            <v-col>
              {{ item.update_interval?? '-' }}
            </v-col>
          </v-row>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions style="padding: 0;">
          <v-btn icon="mdi-file-edit" @click="showRulesetModal(index)">
            <v-icon />
            <v-tooltip activator="parent" location="top" :text="$t('actions.edit')"></v-tooltip>
          </v-btn>
          <v-btn icon="mdi-file-remove" style="margin-inline-start:0;" color="warning" @click="delRulesetOverlay[index] = true">
            <v-icon />
            <v-tooltip activator="parent" location="top" :text="$t('actions.del')"></v-tooltip>
          </v-btn>
          <v-overlay
            v-model="delRulesetOverlay[index]"
            contained
            class="align-center justify-center"
          >
            <v-card :title="$t('actions.del')" rounded="lg">
              <v-divider></v-divider>
              <v-card-text>{{ $t('confirm') }}</v-card-text>
              <v-card-actions>
                <v-btn color="error" variant="outlined" @click="delRuleset(index)">{{ $t('yes') }}</v-btn>
                <v-btn color="success" variant="outlined" @click="delRulesetOverlay[index] = false">{{ $t('no') }}</v-btn>
              </v-card-actions>
            </v-card>
          </v-overlay>
        </v-card-actions>
      </v-card>
    </v-col>
  </v-row>
  <v-row>
    <v-col class="v-card-subtitle" cols="12">{{ $t('pages.rules') }}</v-col>
    <v-col cols="12" sm="4" md="3" lg="2" v-for="(item, index) in <any[]>rules"
        :key="item.id"
        :draggable="true"
        @dragstart="onDragStart(index)"
        @dragover.prevent
        @drop="onDrop(index)"
      >
      <v-card rounded="xl" elevation="5" min-width="200" :title="index+1">
        <v-card-subtitle style="margin-top: -15px;">
          <v-row>
            <v-col>{{ item.type != undefined ? $t('rule.logical') + ' (' + item.mode + ')' : $t('rule.simple') }}</v-col>
          </v-row>
        </v-card-subtitle>
        <v-card-text>
          <v-row>
            <v-col>{{ $t('admin.action') }}</v-col>
            <v-col>
              {{ item.action }}
            </v-col>
          </v-row>
          <v-row>
            <v-col>{{ $t('objects.outbound') }}</v-col>
            <v-col>
              {{ item.outbound?? '-' }}
            </v-col>
          </v-row>
          <v-row>
            <v-col>{{ $t('pages.rules') }}</v-col>
            <v-col>
              {{ item.rules ? item.rules.length : Object.keys(item).filter(r => !actionKeys.includes(r)).length }}
            </v-col>
          </v-row>
          <v-row>
            <v-col>{{ $t('rule.invert') }}</v-col>
            <v-col>
              {{ $t( (item.invert?? false)? 'yes' : 'no') }}
            </v-col>
          </v-row>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions style="padding: 0;">
          <v-btn icon="mdi-file-edit" @click="showRuleModal(index)">
            <v-icon />
            <v-tooltip activator="parent" location="top" :text="$t('actions.edit')"></v-tooltip>
          </v-btn>
          <v-btn icon="mdi-file-remove" style="margin-inline-start:0;" color="warning" @click="delRuleOverlay[index] = true">
            <v-icon />
            <v-tooltip activator="parent" location="top" :text="$t('actions.del')"></v-tooltip>
          </v-btn>
          <v-overlay
            v-model="delRuleOverlay[index]"
            contained
            class="align-center justify-center"
          >
            <v-card :title="$t('actions.del')" rounded="lg">
              <v-divider></v-divider>
              <v-card-text>{{ $t('confirm') }}</v-card-text>
              <v-card-actions>
                <v-btn color="error" variant="outlined" @click="delRule(index)">{{ $t('yes') }}</v-btn>
                <v-btn color="success" variant="outlined" @click="delRuleOverlay[index] = false">{{ $t('no') }}</v-btn>
              </v-card-actions>
            </v-card>
          </v-overlay>
        </v-card-actions>
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import Data from '@/store/modules/data'
import { computed, ref, onBeforeMount } from 'vue'
import RuleVue from '@/layouts/modals/Rule.vue'
import RulesetVue from '@/layouts/modals/Ruleset.vue'
import { Config } from '@/types/config'
import { actionKeys, ruleset } from '@/types/rules'
import { FindDiff } from '@/plugins/utils'

const oldConfig = ref({})
const loading = ref(false)

const appConfig = computed((): Config => {
  return <Config> Data().config
})

onBeforeMount(async () => {
  loading.value = true
  while (Data().lastLoad == 0) {
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  oldConfig.value = JSON.parse(JSON.stringify(Data().config))
  loading.value = false
})

const routeMark = computed({
  get() { return route.value.default_mark?? 0 },
  set(v:number) { v>0 ? route.value.default_mark = v : delete appConfig.value.route.default_mark }
})

const stateChange = computed(() => {
  return FindDiff.deepCompare(appConfig.value,oldConfig.value)
})

const saveConfig = async () => {
  loading.value = true
  const success = await Data().save("config", "set", appConfig.value)
  if (success) {
    oldConfig.value = JSON.parse(JSON.stringify(Data().config))
    loading.value = false
  }
}

const clients = computed((): string[] => {
  return Data().clients.map((c:any) => c.name)
})

const route = computed((): any => {
  return appConfig.value.route?? {}
})

const rules = computed((): any[] => {
  const data = route.value
  if (!data){
    return []
  }
  if (!('rules' in data) || !Array.isArray(data.rules)) {
    data.rules = []
  }
  return data.rules
})

const rulesets = computed((): any[] => {
  const data = route.value
  if (!data){
    return []
  }
  if (!('rule_set' in data) || !Array.isArray(data.rule_set)) {
    data.rule_set = []
  }
  return data.rule_set
})

const rulesetTags = computed((): any[] => {
  return rulesets.value.map((rs:any) => rs.tag)
})

const outboundTags = computed((): string[] => {
  return [...Data().outbounds?.map((o:any) => o.tag), ...Data().endpoints?.map((e:any) => e.tag)]
})

const inboundTags = computed((): string[] => {
  return [...Data().inbounds?.map((o:any) => o.tag), ...Data().endpoints?.filter((e:any) => e.listen_port > 0).map((e:any) => e.tag)]
})

let delRuleOverlay = ref(new Array<boolean>)
let delRulesetOverlay = ref(new Array<boolean>)

const ruleModal = ref({
  visible: false,
  index: -1,
  data: "",
})

const showRuleModal = (index: number) => {
  ruleModal.value.index = index
  ruleModal.value.data = index == -1 ? '' : JSON.stringify(rules.value[index])
  ruleModal.value.visible = true
}

const closeRuleModal = () => {
  ruleModal.value.visible = false
}

const saveRuleModal = (data:any) => {
  if (ruleModal.value.index == -1) {
    rules.value.push(data)
  } else {
    rules.value[ruleModal.value.index] = data
  }
  ruleModal.value.visible = false
}

const delRule = (index: number) => {
  rules.value.splice(index,1)
  delRuleOverlay.value[index] = false
}

const rulesetModal = ref({
  visible: false,
  index: -1,
  data: "",
})

const showRulesetModal = (index: number) => {
  rulesetModal.value.index = index
  rulesetModal.value.data = index == -1 ? '' : JSON.stringify(rulesets.value[index])
  rulesetModal.value.visible = true
}

const closeRulesetModal = () => {
  rulesetModal.value.visible = false
}

const saveRulesetModal = (data:ruleset) => {
  if (rulesetModal.value.index == -1) {
    rulesets.value.push(data)
  } else {
    rulesets.value[rulesetModal.value.index] = data
  }
  rulesetModal.value.visible = false
}

const delRuleset = (index: number) => {
  rulesets.value.splice(index,1)
  delRulesetOverlay.value[index] = false
}

const draggedItemIndex = ref(null)

const onDragStart = (index: any) => {
  draggedItemIndex.value = index
}

const onDrop = (index: any) => {
  if (draggedItemIndex.value !== null) {
    const draggedItem = rules.value[draggedItemIndex.value]
    rules.value.splice(draggedItemIndex.value, 1)
    rules.value.splice(index, 0, draggedItem)
    draggedItemIndex.value = null
  }
}

// ─────────────────────────────────────────────
// Bulk Import logic
// ─────────────────────────────────────────────

const importDialog = ref(false)
const importTab = ref('text')
const importRawText = ref('')
const importFormat = ref('binary')
const importDetour = ref('')
const importInterval = ref(1)

interface ImportItem {
  tag: string
  url: string
  format: string
  exists: boolean
}

const importPreview = ref<ImportItem[]>([])

const importSkipped = computed(() => importPreview.value.filter(i => i.exists).length)

// Парсим имя файла из URL → тег
// https://.../geoip-telegram.srs  →  tag: "geoip-telegram"
function urlToTag(url: string): string {
  try {
    const pathname = new URL(url).pathname
    const filename = pathname.split('/').pop() ?? ''
    // убираем расширение
    return filename.replace(/\.[^.]+$/, '')
  } catch {
    // если URL кривой — берём последний сегмент как есть
    const parts = url.split('/')
    return parts[parts.length - 1].replace(/\.[^.]+$/, '') || url
  }
}

function openImportDialog() {
  importRawText.value = ''
  importPreview.value = []
  importTab.value = 'text'
  importDialog.value = true
}

function parseImport() {
  const existingTags = new Set(rulesetTags.value as string[])
  const lines = importRawText.value
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && l.startsWith('http'))

  // дедуп по URL внутри самого списка
  const seen = new Set<string>()
  importPreview.value = lines
    .filter(url => {
      if (seen.has(url)) return false
      seen.add(url)
      return true
    })
    .map(url => {
      const tag = urlToTag(url)
      return {
        tag,
        url,
        format: importFormat.value,
        exists: existingTags.has(tag),
      }
    })
}

function applyImport() {
  const toAdd = importPreview.value.filter(i => !i.exists)
  for (const item of toAdd) {
    const rs: any = {
      type: 'remote',
      tag: item.tag,
      format: item.format,
      url: item.url,
    }
    if (importDetour.value) rs.download_detour = importDetour.value
    if (importInterval.value > 0) rs.update_interval = importInterval.value + 'd'
    rulesets.value.push(rs)
  }
  importDialog.value = false
}

async function onFileUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const text = await file.text()
  importRawText.value = text
  // автоматически парсим после загрузки файла
  parseImport()
}
</script>
