<template>
  <RuleVue
    v-model="ruleModal.visible"
    :visible="ruleModal.visible"
    :index="ruleModal.index"
    :data="ruleModal.data"
    :clients="clients"
    :in-tags="inboundTags"
    :out-tags="outboundTags"
    :rs-tags="rulesetTags"
    @close="closeRuleModal"
    @save="saveRuleModal"
  />
  <RulesetVue
    v-model="rulesetModal.visible"
    :visible="rulesetModal.visible"
    :index="rulesetModal.index"
    :data="rulesetModal.data"
    :out-tags="outboundTags"
    @close="closeRulesetModal"
    @save="saveRulesetModal"
  />
  <RuleImport
    v-model="importRulesModal.visible"
    :visible="importRulesModal.visible"
    :existing-rules-count="rules.length"
    :existing-rulesets-count="rulesets.length"
    :existing-ruleset-tags="rulesetTags"
    @save="saveImportRule"
    @close="closeImportRule"
  />
  <RulesetImport
    v-model="importRulesetsModal.visible"
    :visible="importRulesetsModal.visible"
    :out-tags="outboundTags"
    :rs-tags="rulesetTags"
    @save="saveImportRulesets"
    @close="closeImportRulesets"
  />
  <RulesetPreset
    v-model="presetRulesetsModal.visible"
    :visible="presetRulesetsModal.visible"
    :out-tags="outboundTags"
    :rs-tags="rulesetTags"
    @save="savePresetRulesets"
    @close="presetRulesetsModal.visible = false"
  />
  <v-row>
    <v-col
      cols="12"
      justify="center"
      align="center"
    >
      <v-btn
        color="primary"
        style="margin: 0 5px;"
        @click="showRuleModal(-1)"
      >
        {{ $t('rule.add') }}
      </v-btn>
      <v-btn
        color="primary"
        style="margin: 0 5px;"
        @click="showRulesetModal(-1)"
      >
        {{ $t('ruleset.add') }}
      </v-btn>
      <v-menu
        v-model="actionMenu"
        :close-on-content-click="false"
        location="bottom center"
      >
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            hide-details
            variant="text"
            icon
          >
            <v-icon
              icon="mdi-tools"
              color="primary"
            />
          </v-btn>
        </template>
        <v-list
          density="compact"
          nav
        >
          <v-list-item
            link
            @click="showImportRule"
          >
            <template #prepend>
              <v-icon icon="mdi-routes" />
            </template>
            <v-list-item-title>{{ $t('rule.import.rulesTitle') }}</v-list-item-title>
          </v-list-item>
          <v-list-item
            link
            @click="showImportRulesets"
          >
            <template #prepend>
              <v-icon icon="mdi-download-multiple" />
            </template>
            <v-list-item-title>{{ $t('rule.import.title') }}</v-list-item-title>
          </v-list-item>
          <v-list-item
            link
            @click="presetRulesetsModal.visible = true; actionMenu = false"
          >
            <template #prepend>
              <v-icon icon="mdi-star-box-multiple" />
            </template>
            <v-list-item-title>{{ $t('ruleset.preset') }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      <v-btn
        variant="outlined"
        color="warning"
        :loading="loading"
        :disabled="stateChange"
        @click="saveConfig"
      >
        {{ $t('actions.save') }}
      </v-btn>
    </v-col>
  </v-row>
  <v-row>
    <v-col
      class="v-card-subtitle"
      cols="12"
    >
      {{ $t('basic.routing.title') }}
    </v-col>
    <v-col cols="12">
      <v-row>
        <v-col
          cols="12"
          sm="6"
          md="3"
          lg="2"
        >
          <v-select
            v-model="route.final"
            hide-details
            :label="$t('basic.routing.defaultOut')"
            clearable
            :items="outboundTags"
            @click:clear="delete route.final"
          />
        </v-col>
        <v-col
          cols="12"
          sm="6"
          md="3"
          lg="2"
        >
          <!-- Which DNS server resolves the domains outbounds dial. sing-box
               guesses when several servers exist and none is named. -->
          <v-select
            v-model="route.default_domain_resolver"
            hide-details
            :label="$t('basic.routing.defaultDns')"
            clearable
            :items="dnsTags"
            @click:clear="delete route.default_domain_resolver"
          />
        </v-col>
        <v-col
          cols="12"
          sm="6"
          md="3"
          lg="2"
        >
          <v-text-field
            v-model="route.default_interface"
            hide-details
            clearable
            :label="$t('basic.routing.defaultIf')"
            @click:clear="delete route.default_interface"
          />
        </v-col>
        <v-col
          cols="12"
          sm="6"
          md="3"
          lg="2"
        >
          <v-text-field
            v-model.number="routeMark"
            hide-details
            type="number"
            min="0"
            :label="$t('basic.routing.defaultRm')"
          />
        </v-col>
        <v-col
          cols="12"
          sm="6"
          md="3"
          lg="2"
        >
          <!-- Which shared client downloads the rule-sets that name none. -->
          <v-select
            v-model="route.default_http_client"
            hide-details
            :label="$t('basic.httpClient.title')"
            clearable
            :items="httpClients"
            :no-data-text="$t('basic.httpClient.none')"
            @click:clear="delete route.default_http_client"
          />
        </v-col>
        <v-col
          cols="12"
          sm="6"
          md="3"
          lg="2"
        >
          <v-switch
            v-model="route.auto_detect_interface"
            color="primary"
            :label="$t('basic.routing.autoBind')"
            hide-details
          />
        </v-col>
      </v-row>
    </v-col>
  </v-row>
  <v-row>
    <v-col
      class="v-card-subtitle"
      cols="12"
    >
      {{ $t('rule.ruleset') }}
    </v-col>
    <v-col
      v-for="(item, index) in <any[]>rulesets"
      :key="item.tag"
      cols="12"
      sm="4"
      md="3"
      lg="2"
    >
      <v-card
        rounded="xl"
        elevation="5"
        min-width="200"
        :title="item.tag"
      >
        <v-card-subtitle style="margin-top: -15px;">
          <v-row><v-col>{{ $t('ruleset.' + item.type) }}</v-col></v-row>
        </v-card-subtitle>
        <v-card-text>
          <v-row><v-col>{{ $t('ruleset.format') }}</v-col><v-col>{{ item.format }}</v-col></v-row>
          <v-row><v-col>{{ $t('objects.outbound') }}</v-col><v-col>{{ item.http_client?.detour ?? '-' }}</v-col></v-row>
          <v-row><v-col>{{ $t('actions.update') }}</v-col><v-col>{{ item.update_interval ?? '-' }}</v-col></v-row>
        </v-card-text>
        <v-divider />
        <v-card-actions style="padding: 0;">
          <v-btn
            icon="mdi-file-edit"
            @click="showRulesetModal(index)"
          >
            <v-icon /><v-tooltip
              activator="parent"
              location="top"
              :text="$t('actions.edit')"
            />
          </v-btn>
          <v-btn
            icon="mdi-file-remove"
            style="margin-inline-start:0;"
            color="warning"
            @click="delRulesetOverlay[index] = true"
          >
            <v-icon /><v-tooltip
              activator="parent"
              location="top"
              :text="$t('actions.del')"
            />
          </v-btn>
          <v-overlay
            v-model="delRulesetOverlay[index]"
            contained
            class="align-center justify-center"
          >
            <v-card
              :title="$t('actions.del')"
              rounded="lg"
            >
              <v-divider />
              <v-card-text>{{ $t('confirm') }}</v-card-text>
              <v-card-actions>
                <v-btn
                  color="error"
                  variant="outlined"
                  @click="delRuleset(index)"
                >
                  {{ $t('yes') }}
                </v-btn>
                <v-btn
                  color="success"
                  variant="outlined"
                  @click="delRulesetOverlay[index] = false"
                >
                  {{ $t('no') }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-overlay>
        </v-card-actions>
      </v-card>
    </v-col>
  </v-row>
  <v-row>
    <v-col
      class="v-card-subtitle"
      cols="12"
    >
      {{ $t('pages.rules') }}
    </v-col>
    <v-col
      v-for="(item, index) in <any[]>rules"
      :key="item.id"
      cols="12"
      sm="4"
      md="3"
      lg="2"
      :draggable="true"
      @dragstart="onDragStart(index)"
      @dragover.prevent
      @drop="onDrop(index)"
    >
      <v-card
        rounded="xl"
        elevation="5"
        min-width="200"
        :title="index+1"
      >
        <v-card-subtitle style="margin-top: -15px;">
          <v-row><v-col>{{ item.type != undefined ? $t('rule.logical') + ' (' + item.mode + ')' : $t('rule.simple') }}</v-col></v-row>
        </v-card-subtitle>
        <v-card-text>
          <v-row><v-col>{{ $t('admin.action') }}</v-col><v-col>{{ item.action }}</v-col></v-row>
          <v-row><v-col>{{ $t('objects.outbound') }}</v-col><v-col>{{ item.outbound ?? '-' }}</v-col></v-row>
          <v-row><v-col>{{ $t('pages.rules') }}</v-col><v-col>{{ item.rules ? item.rules.length : Object.keys(item).filter(r => !actionKeys.includes(r)).length }}</v-col></v-row>
          <v-row><v-col>{{ $t('rule.invert') }}</v-col><v-col>{{ $t((item.invert ?? false) ? 'yes' : 'no') }}</v-col></v-row>
        </v-card-text>
        <v-divider />
        <v-card-actions style="padding: 0;">
          <v-btn
            icon="mdi-file-edit"
            @click="showRuleModal(index)"
          >
            <v-icon /><v-tooltip
              activator="parent"
              location="top"
              :text="$t('actions.edit')"
            />
          </v-btn>
          <v-btn
            icon="mdi-file-remove"
            style="margin-inline-start:0;"
            color="warning"
            @click="delRuleOverlay[index] = true"
          >
            <v-icon /><v-tooltip
              activator="parent"
              location="top"
              :text="$t('actions.del')"
            />
          </v-btn>
          <v-overlay
            v-model="delRuleOverlay[index]"
            contained
            class="align-center justify-center"
          >
            <v-card
              :title="$t('actions.del')"
              rounded="lg"
            >
              <v-divider />
              <v-card-text>{{ $t('confirm') }}</v-card-text>
              <v-card-actions>
                <v-btn
                  color="error"
                  variant="outlined"
                  @click="delRule(index)"
                >
                  {{ $t('yes') }}
                </v-btn>
                <v-btn
                  color="success"
                  variant="outlined"
                  @click="delRuleOverlay[index] = false"
                >
                  {{ $t('no') }}
                </v-btn>
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
import { httpClientTags } from '@/plugins/httpClient'
import { computed, ref, onBeforeMount } from 'vue'
import RuleVue from '@/layouts/modals/Rule.vue'
import RulesetVue from '@/layouts/modals/Ruleset.vue'
import RulesetImport from '@/layouts/modals/RulesetImport.vue'
import RulesetPreset from '@/layouts/modals/RulesetPreset.vue'
import RuleImport from '@/layouts/modals/RuleImport.vue'
import { Config } from '@/types/config'
import { actionKeys, logicalRule, rule, ruleset } from '@/types/rules'
import { FindDiff } from '@/plugins/utils'

// A routing rule as this page moves it around. The rule modal fills in a whole
// one, but an imported or preset rule carries only the keys it sets, and a
// logical rule carries its own, so nothing here is required.
type RuleEntry = Partial<rule & logicalRule>

// The route block as this page edits it: every field is optional, because the
// template clears them one at a time, and the rules and rule-sets are the
// shapes the modals produce rather than the narrower ones the generated config
// declares.
interface RouteBlock {
  rules?: RuleEntry[]
  rule_set?: ruleset[]
  final?: string
  default_domain_resolver?: string
  default_interface?: string
  default_http_client?: string
  default_mark?: number
  auto_detect_interface?: boolean
}

// What the rule-import modal hands back: the route block it parsed out of a
// pasted config.
interface ImportedRouteBlock {
  rules?: RuleEntry[]
  rule_set?: ruleset[]
  final?: string
}

const oldConfig = ref({})
const loading = ref(false)
const actionMenu = ref(false)
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
  get() { return route.value.default_mark ?? 0 },
  set(v:number) {
    if (v > 0) route.value.default_mark = v
    else delete appConfig.value.route.default_mark
  }
})

const stateChange = computed(() => FindDiff.deepCompare(appConfig.value, oldConfig.value))

const saveConfig = async () => {
  loading.value = true
  const success = await Data().save("config", "set", appConfig.value)
  if (success) {
    oldConfig.value = JSON.parse(JSON.stringify(Data().config))
    loading.value = false
  }
}

const clients = computed((): string[] => Data().clients.map(c => c.name))
const route = computed((): RouteBlock => (appConfig.value.route as unknown as RouteBlock) ?? {})

const rules = computed((): RuleEntry[] => {
  const data = route.value
  if (!data) return []
  if (!('rules' in data) || !Array.isArray(data.rules)) data.rules = []
  return data.rules
})

const rulesets = computed((): ruleset[] => {
  const data = route.value
  if (!data) return []
  if (!('rule_set' in data) || !Array.isArray(data.rule_set)) data.rule_set = []
  return data.rule_set
})

const rulesetTags = computed((): string[] => rulesets.value.map(rs => rs.tag))

const httpClients = computed((): string[] => httpClientTags())

const dnsTags = computed((): string[] =>
  (appConfig.value.dns?.servers ?? []).map(s => s.tag).filter((t: string) => t?.length > 0))

const outboundTags = computed((): string[] => [
  ...(Data().outbounds?.map(o => o.tag) ?? []),
  ...(Data().endpoints?.map(e => e.tag) ?? [])
])

const inboundTags = computed((): string[] => [
  ...(Data().inbounds?.map(o => o.tag) ?? []),
  ...(Data().endpoints?.filter(e => e.listen_port > 0).map(e => e.tag) ?? [])
])

let delRuleOverlay = ref(new Array<boolean>)
let delRulesetOverlay = ref(new Array<boolean>)

const ruleModal = ref({ visible: false, index: -1, data: "" })
const showRuleModal = (index: number) => {
  ruleModal.value.index = index
  ruleModal.value.data = index == -1 ? '' : JSON.stringify(rules.value[index])
  ruleModal.value.visible = true
}
const closeRuleModal = () => { ruleModal.value.visible = false }
const saveRuleModal = (data:RuleEntry) => {
  if (ruleModal.value.index == -1) rules.value.push(data)
  else rules.value[ruleModal.value.index] = data
  ruleModal.value.visible = false
}
const delRule = (index: number) => { rules.value.splice(index, 1); delRuleOverlay.value[index] = false }

const rulesetModal = ref({ visible: false, index: -1, data: "" })
const showRulesetModal = (index: number) => {
  rulesetModal.value.index = index
  rulesetModal.value.data = index == -1 ? '' : JSON.stringify(rulesets.value[index])
  rulesetModal.value.visible = true
}
const closeRulesetModal = () => { rulesetModal.value.visible = false }
const saveRulesetModal = (data:ruleset) => {
  if (rulesetModal.value.index == -1) rulesets.value.push(data)
  else rulesets.value[rulesetModal.value.index] = data
  rulesetModal.value.visible = false
}
const delRuleset = (index: number) => { rulesets.value.splice(index, 1); delRulesetOverlay.value[index] = false }

const draggedItemIndex = ref<number | null>(null)
const onDragStart = (index: number) => { draggedItemIndex.value = index }
const onDrop = (index: number) => {
  if (draggedItemIndex.value !== null) {
    const draggedItem = rules.value[draggedItemIndex.value]
    rules.value.splice(draggedItemIndex.value, 1)
    rules.value.splice(index, 0, draggedItem)
    draggedItemIndex.value = null
  }
}

const importRulesModal = ref({ visible: false })

function showImportRule() {
  importRulesModal.value.visible = true
}

function closeImportRule() {
  importRulesModal.value.visible = false
}

function saveImportRule(block: ImportedRouteBlock, mode: 'merge' | 'replace', applyFinal: boolean) {
  if (mode === 'replace') {
    route.value.rules = block.rules ?? []
    route.value.rule_set = block.rule_set ?? []
  } else {
    const existingTags = new Set(rulesetTags.value)
    if (block.rules) rules.value.push(...block.rules)
    if (block.rule_set) {
      for (const rs of block.rule_set) {
        if (!existingTags.has(rs.tag)) rulesets.value.push(rs)
      }
    }
  }
  if (applyFinal && block.final) route.value.final = block.final
  importRulesModal.value.visible = false
}

const importRulesetsModal = ref({ visible: false })

function showImportRulesets() {
  importRulesetsModal.value.visible = true
}

function closeImportRulesets() {
  importRulesetsModal.value.visible = false
}

function saveImportRulesets(items: ruleset[]) {
  rulesets.value.push(...items)
  importRulesetsModal.value.visible = false
}

const presetRulesetsModal = ref({ visible: false })

function savePresetRulesets(items: ruleset[], rule: RuleEntry | null) {
  rulesets.value.push(...items)
  if (rule) rules.value.push(rule)
  presetRulesetsModal.value.visible = false
}
</script>
