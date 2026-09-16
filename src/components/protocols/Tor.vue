<template>
  <v-card subtitle="Tor">
    <v-row>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.executable_path"
          :label="$t('types.tor.execPath')"
          hide-details
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.data_directory"
          :label="$t('types.tor.dataDir')"
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
        <v-text-field
          v-model="extra_args"
          :label="$t('types.tor.extArgs') + ' ' + $t('commaSeparated')"
          hide-details
        />
      </v-col>
    </v-row>
    <div
      class="v-card-subtitle"
      style="margin: 10px;"
    >
      Torrc
      <v-chip
        color="primary"
        density="compact"
        variant="elevated"
        @click="add_torrc_option"
      >
        <v-icon icon="mdi-plus" />
      </v-chip>
    </div>
    <v-row
      v-for="(torrc, index) in torrc_options"
      :key="index"
    >
      <v-col
        cols="auto"
        align-self="center"
        justify-self="center"
      >
        <v-icon
          color="error"
          icon="mdi-delete"
          @click="del_torrc_option(index)"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="torrc.name"
          :label="$t('objects.key')"
          hide-details
          @input="update_key(index,$event.target.value)"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="torrc.value"
          :label="$t('objects.value')"
          hide-details
          @input="update_value(index,$event.target.value)"
        />
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Outbound } from '@/types/outbounds'

type torrc_option = {
  name: string
  value: string
}

// Only the Tor outbound fields this form reads or writes. A torrc key may be
// repeated, so its value is either one string or a list of them.
interface TorData {
  executable_path?: string
  data_directory?: string
  extra_args?: string[]
  torrc?: Record<string, string | string[]>
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<Outbound>('data', { required: true })

// The parent holds a union and picks this component with a v-if on the type,
// which the template checker cannot follow, so narrow once here. The computed
// returns the same object, so edits still reach the parent.
const data = computed(() => model.value as unknown as TorData)

const torrc_options = computed({
  get: (): torrc_option[] => {
    const options: torrc_option[] = []
    const h = data.value.torrc
    if (h) {
      Object.keys(h).forEach(key => {
        const value = h[key]
        if (Array.isArray(value)){
          value.forEach((v:string) => options.push({ name: key, value: v }))
        } else {
          options.push({ name: key, value: value })
        }
      })
    }
    return options
  },
  set: (v:torrc_option[]) => {
    if (v.length>0) {
      const torrc: Record<string, string | string[]> = {}
      v.forEach((h:torrc_option) => {
        const current = torrc[h.name]
        if (current) {
          if (Array.isArray(current)) {
            current.push(h.value)
          } else {
            torrc[h.name] = [current, h.value]
          }
        } else {
          torrc[h.name] = h.value
        }
      })
      data.value.torrc = torrc
    } else {
      data.value.torrc = undefined
    }
  },
})

const extra_args = computed({
  get: (): string | undefined => data.value.extra_args?.join(','),
  set: (v:string) => { data.value.extra_args = v.length > 0 ? v.split(',') : undefined },
})

function add_torrc_option() {
  torrc_options.value = [...torrc_options.value, {name: "", value: ""}]
}

function del_torrc_option(i:number) {
  const h = torrc_options.value
  h.splice(i,1)
  torrc_options.value = h
}

function update_key(i:number,k:string) {
  const h = torrc_options.value
  h[i].name = k
  torrc_options.value = h
}

function update_value(i:number,v:string) {
  const h = torrc_options.value
  h[i].value = v
  torrc_options.value = h
}
</script>
