<template>
  <v-row>
    <v-col
      cols="12"
      sm="6"
      md="4"
    >
      <v-text-field
        v-model="transport.service_name"
        :label="$t('transport.grpcServiceName')"
        :hint="hasSlash ? $t('transport.grpcServiceNameSlash') : ''"
        :persistent-hint="hasSlash"
        :hide-details="!hasSlash"
        :base-color="hasSlash ? 'warning' : undefined"
        :color="hasSlash ? 'warning' : undefined"
      />
    </v-col>
    <v-col
      cols="12"
      sm="6"
      md="4"
    >
      <v-switch
        v-model="transport.permit_without_stream"
        color="primary"
        :label="$t('transport.grpcPws')"
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
        v-model.number="idle_timeout"
        :label="$t('transport.idleTimeout')"
        hide-details
        type="number"
        suffix="s"
        min="1"
      />
    </v-col>
    <v-col
      cols="12"
      sm="6"
      md="4"
    >
      <v-text-field
        v-model.number="ping_timeout"
        :label="$t('transport.pingTimeout')"
        hide-details
        type="number"
        suffix="s"
        min="1"
      />
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Transport } from '../../types/transport'

// Only the gRPC fields this form reads or writes.
interface GrpcData {
  service_name?: string
  permit_without_stream?: boolean
  idle_timeout?: string
  ping_timeout?: string
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<Transport>('transport', { required: true })

// The parent holds a union and picks this component with a v-if on the type,
// which the template checker cannot follow, so narrow once here. The computed
// returns the same object, so edits still reach the parent.
const transport = computed(() => model.value as unknown as GrpcData)

// Clients build the gRPC path from a name with "/" in different ways: the
// lite sing-box client escapes it, Xray reads a leading "/" as a custom path.
// Only another full-gRPC sing-box, such as another panel, matches this server.
const hasSlash = computed(() => (transport.value.service_name ?? '').includes('/'))

const idle_timeout = computed({
  get: (): number | '' => transport.value.idle_timeout ? parseInt(transport.value.idle_timeout.replace('s', '')) : '',
  set: (newValue: number) => { transport.value.idle_timeout = newValue ? newValue + 's' : '' },
})

const ping_timeout = computed({
  get: (): number | '' => transport.value.ping_timeout ? parseInt(transport.value.ping_timeout.replace('s', '')) : '',
  set: (newValue: number) => { transport.value.ping_timeout = newValue ? newValue + 's' : '' },
})
</script>
