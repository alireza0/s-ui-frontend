<template>
  <v-card>
    <v-card-subtitle v-if="direction != 'out_json'">
      Bridge
    </v-card-subtitle>
    <v-row>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.interface"
          :label="$t('types.bridge.interface')"
          hide-details
          clearable
          @click:clear="delete data.interface"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.bridge_name"
          :label="$t('types.bridge.bridgeName')"
          hide-details
          clearable
          @click:clear="delete data.bridge_name"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model.number="tableIndex"
          :label="$t('types.bridge.tableIndex')"
          type="number"
          min="0"
          hide-details
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model.number="ruleIndex"
          :label="$t('types.bridge.ruleIndex')"
          type="number"
          min="0"
          hide-details
        />
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Outbound } from '@/types/outbounds'

// Only the outbound side carries a bridge, so this is the outbound shape.
interface BridgeData {
  interface?: string
  bridge_name?: string
  iproute2_table_index?: number
  iproute2_rule_index?: number
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<Outbound>('data', { required: true })

// The parent holds a union and picks this component with a v-if on the type,
// which the template checker cannot follow, so narrow once here. The computed
// returns the same object, so edits still reach the parent.
const data = computed(() => model.value as unknown as BridgeData)

defineProps<{
  direction: 'in' | 'out' | 'out_json'
}>()

const tableIndex = computed({
  get: (): number => data.value.iproute2_table_index ?? 0,
  set: (v: number) => { data.value.iproute2_table_index = v > 0 ? v : undefined },
})

const ruleIndex = computed({
  get: (): number => data.value.iproute2_rule_index ?? 0,
  set: (v: number) => { data.value.iproute2_rule_index = v > 0 ? v : undefined },
})
</script>
