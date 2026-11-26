<template>
  <v-dialog
    :model-value="visible"
    width="800"
    scrollable
    transition="dialog-bottom-transition"
    :persistent="busy"
    @update:model-value="!$event&&emit('close')"
  >
    <v-card
      class="rounded-lg"
      :loading="busy"
    >
      <v-card-title>{{ $t(value ? 'nodeUI.dnsProfile' : 'nodeUI.addProfile') }}</v-card-title>
      <v-divider />
      <v-card-text class="py-0 px-4">
        <v-container>
          <v-row>
            <v-col
              cols="12"
              sm="6"
            >
              <v-text-field
                v-model="form.name"
                :label="$t('client.name')"
              />
            </v-col>
            <v-col
              cols="12"
              sm="6"
            >
              <v-select
                v-model="form.auth_type"
                :disabled="discovering||busy"
                :label="$t('nodeUI.authentication')"
                :items="[{title:$t('nodeUI.apiToken'),value:'token'},{title:$t('nodeUI.globalAPIKey'),value:'global_key'}]"
              />
            </v-col>
          </v-row>
          <v-text-field
            v-if="form.auth_type==='global_key'"
            v-model="form.email"
            :disabled="discovering||busy"
            :label="$t('nodeUI.cloudflareEmail')"
          />
          <v-text-field
            v-model="secret"
            :disabled="discovering||busy"
            type="password"
            autocomplete="new-password"
            :label="$t(form.auth_type==='token'?'nodeUI.apiToken':'nodeUI.globalAPIKey')"
            :placeholder="value?.secret_configured ? $t('nodeUI.secretConfigured') : undefined"
          />
          <v-btn
            class="my-3"
            variant="tonal"
            :loading="discovering"
            :disabled="!secret&&!value?.secret_configured"
            @click="discover"
          >
            {{ $t('nodeUI.getZones') }}
          </v-btn>
          <v-select
            v-if="available.length"
            v-model="selected"
            :items="available.map(z=>({title:z.name,value:z.id}))"
            :label="$t('nodeUI.allowedZones')"
            multiple
            chips
            @update:model-value="syncZones"
          />
          <v-expansion-panels>
            <v-expansion-panel :title="$t('nodeUI.manualZone')">
              <v-expansion-panel-text>
                <div
                  v-for="(zone,index) in form.zones"
                  :key="index"
                  class="d-flex flex-wrap ga-2"
                >
                  <v-text-field
                    v-model="zone.name"
                    :label="$t('nodeUI.zone')"
                  /><v-text-field
                    v-model="zone.id"
                    :label="$t('nodeUI.zoneID')"
                  /><v-btn
                    icon="mdi-close"
                    :aria-label="$t('actions.del')"
                    variant="text"
                    @click="form.zones.splice(index,1)"
                  />
                </div><v-btn @click="form.zones.push({id:'',name:''})">
                  {{ $t('nodeUI.addZone') }}
                </v-btn>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
          <v-alert
            v-if="error||localError"
            type="error"
            variant="tonal"
          >
            {{ error||localError }}
          </v-alert>
        </v-container>
      </v-card-text>
      <v-card-actions class="pt-0">
        <v-spacer />
        <v-btn
          color="primary"
          variant="outlined"
          :disabled="busy"
          @click="emit('close')"
        >
          {{ $t('actions.close') }}
        </v-btn><v-btn
          color="primary"
          variant="tonal"
          :loading="busy"
          :disabled="busy||!valid"
          @click="save"
        >
          {{ $t('actions.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DNSProfile } from '@/features/nodes/types/nodes'
import { clone } from '@/features/nodes/types/nodeSpec'
import Http from '@/plugins/httputil'
const props = defineProps<{ visible: boolean; value?: DNSProfile; busy: boolean; error: string }>(),
  emit = defineEmits<{ close: []; save: [unknown] }>(),
  { t } = useI18n()
const blank = (): DNSProfile => ({ name: '', auth_type: 'token', email: '', zones: [], version: 0 }),
  form = ref(blank()),
  secret = ref(''),
  available = ref<DNSProfile['zones']>([]),
  selected = ref<string[]>([]),
  discovering = ref(false),
  localError = ref('')
let ticket = 0
watch(
  () => props.visible,
  (v) => {
    ticket++
    discovering.value = false
    secret.value = ''
    localError.value = ''
    if (v) {
      form.value = clone(props.value ?? blank())
      available.value = clone(form.value.zones)
      selected.value = form.value.zones.map((z) => z.id)
    }
  },
)
const valid = computed(
  () =>
    form.value.name.trim() &&
    form.value.zones.length &&
    form.value.zones.every((z) => /^[0-9a-f]{32}$/.test(z.id) && z.name.includes('.')) &&
    (secret.value ||
      (props.value?.secret_configured &&
        props.value.auth_type === form.value.auth_type &&
        (props.value.email ?? '') === (form.value.email ?? ''))),
)
async function discover() {
  discovering.value = true
  localError.value = ''
  const n = ticket
  try {
    const r = await Http.post<DNSProfile['zones']>('api/node-dns-zones', {
      data: JSON.stringify({
        id: form.value.id,
        auth_type: form.value.auth_type,
        email: form.value.email ?? '',
        token: form.value.auth_type === 'token' ? secret.value : '',
        api_key: form.value.auth_type === 'global_key' ? secret.value : '',
      }),
    })
    if (n !== ticket) return
    if (r.success) available.value = r.obj
    else localError.value = t('nodeUI.zoneLookupFailed')
  } catch {
    if (n === ticket) localError.value = t('nodes.loadFailed')
  } finally {
    if (n === ticket) discovering.value = false
  }
}
function syncZones() {
  form.value.zones = available.value.filter((z) => selected.value.includes(z.id))
}
function save() {
  emit('save', {
    ...form.value,
    expected_version: form.value.version,
    version: undefined,
    secret_configured: undefined,
    provider: undefined,
    ...(form.value.auth_type === 'token' ? { token: secret.value } : { api_key: secret.value }),
  })
}
</script>
