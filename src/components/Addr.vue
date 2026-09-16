<template>
  <v-row>
    <v-col
      cols="12"
      sm="6"
      md="4"
    >
      <v-text-field
        v-model="addr.server"
        :label="$t('out.addr')"
        hide-details
        required
      />
    </v-col>
    <v-col
      cols="12"
      sm="6"
      md="4"
    >
      <v-text-field
        v-model.number="addr.server_port"
        :label="$t('out.port')"
        hide-details
        type="number"
        required
      />
    </v-col>
    <v-col
      v-if="optionRemark"
      cols="12"
      sm="6"
      md="4"
    >
      <v-text-field
        v-model="addr.remark"
        :label="$t('in.remark')"
        hide-details
      />
    </v-col>
  </v-row>
  <OutTLS
    v-if="optionTLS"
    :outbound="addr"
  />
  <v-row>
    <v-spacer />
    <v-col
      cols="auto"
      align="end"
      justify="center"
    >
      <v-menu
        v-model="menu"
        :close-on-content-click="false"
        location="start"
      >
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            hide-details
            variant="tonal"
          >
            {{ $t('in.mdOption') }}
          </v-btn>
        </template>
        <v-card>
          <v-list>
            <v-list-item>
              <v-switch
                v-model="optionRemark"
                color="primary"
                :label="$t('in.remark')"
                hide-details
              />
            </v-list-item>
            <v-list-item v-if="hasTls">
              <v-switch
                v-model="optionTLS"
                color="primary"
                :label="$t('objects.tls')"
                hide-details
              />
            </v-list-item>
          </v-list>
        </v-card>
      </v-menu>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import OutTLS from '@/components/tls/OutTLS.vue'
import { Addr } from '@/types/inbounds'
import { oTls } from '@/types/tls'

// The address row this form edits. The TLS switch stores the outbound TLS
// block itself, which OutTLS then fills in.
interface AddrData {
  server: string
  server_port: number
  remark?: string
  tls?: oTls
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<Addr>('addr', { required: true })

// Addr declares tls as a flag while the form keeps the TLS block there, so
// narrow once here. The computed returns the same object, so edits still reach
// the parent.
const addr = computed(() => model.value as unknown as AddrData)

defineProps<{
  hasTls: boolean
}>()

const menu = ref(false)

const optionTLS = computed({
  get: (): boolean => addr.value.tls != undefined,
  set: (v: boolean) => { addr.value.tls = v ? { enabled: true } : undefined },
})

const optionRemark = computed({
  get: (): boolean => addr.value.remark != undefined,
  set: (v: boolean) => { addr.value.remark = v ? '' : undefined },
})
</script>
