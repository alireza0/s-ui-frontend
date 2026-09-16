<template>
  <v-card subtitle="DERP">
    <v-row>
      <v-col
        cols="12"
        sm="8"
      >
        <v-text-field
          v-model="data.config_path"
          :label="$t('types.derp.configPath')"
          hide-details
        />
      </v-col>
    </v-row>
    <v-row v-if="optionHome">
      <v-col
        cols="12"
        sm="8"
      >
        <v-text-field
          v-model="data.home"
          :label="$t('pages.home')"
          hide-details
          placeholder="blank | http[s]://example.com:port/path"
        />
      </v-col>
    </v-row>
    <v-row v-if="optionVerifyCE">
      <v-col
        cols="12"
        sm="8"
      >
        <v-select
          v-model="data.verify_client_endpoint"
          :label="$t('types.derp.verifyClientEndpoint')"
          hide-details
          :items="tsTags"
          multiple
        />
      </v-col>
    </v-row>
    <template v-if="optionVerifyCU">
      <v-card-title>
        <v-row>
          <v-col>{{ $t('types.derp.verifyClientUrl') }}</v-col>
          <v-col
            cols="auto"
            align-self="center"
            justify-self="center"
          >
            <v-chip
              color="primary"
              density="compact"
              variant="elevated"
              @click="data.verify_client_url?.push({url: ''})"
            >
              <v-icon icon="mdi-plus" />
            </v-chip>
          </v-col>
        </v-row>
      </v-card-title>
      <v-card
        v-for="clientUrl, index in data.verify_client_url"
        :key="index"
        class="border"
        style="padding: 8px;"
        rounded="xl"
      >
        <v-row>
          <v-col
            cols="auto"
            align-self="center"
            justify-self="center"
          >
            <v-icon
              color="error"
              icon="mdi-delete"
              @click="data.verify_client_url?.splice(index, 1)"
            />
          </v-col>
          <v-col cols="11">
            <v-text-field
              v-model="clientUrl.url"
              :label="$t('types.derp.verifyClientUrl')"
              hide-details
            />
            <Dial :dial="clientUrl" />     
          </v-col>
        </v-row>
      </v-card>
    </template>
    <template v-if="optionMesh">
      <v-card-title>
        <v-row>
          <v-col>{{ $t('types.derp.meshWith') }}</v-col>
          <v-col
            cols="auto"
            align-self="center"
            justify-self="center"
          >
            <v-chip
              color="primary"
              density="compact"
              variant="elevated"
              @click="data.mesh_with?.push({tls: {}})"
            >
              <v-icon icon="mdi-plus" />
            </v-chip>
          </v-col>
        </v-row>
      </v-card-title>
      <v-card
        v-for="mesh, index in data.mesh_with"
        :key="index"
        class="border"
        style="padding: 8px;"
        rounded="xl"
      >
        <v-row>
          <v-col
            cols="auto"
            align-self="center"
            justify-self="center"
          >
            <v-icon
              color="error"
              icon="mdi-delete"
              @click="data.mesh_with?.splice(index, 1)"
            />
          </v-col>
          <v-col cols="11">
            <v-row>
              <v-col
                cols="12"
                sm="6"
                md="4"
              >
                <v-text-field
                  v-model="mesh.server"
                  :label="$t('out.addr')"
                  hide-details
                />
              </v-col>
              <v-col
                cols="12"
                sm="6"
                md="4"
              >
                <v-text-field
                  v-model.number="mesh.server_port"
                  :label="$t('out.port')"
                  hide-details
                  type="number"
                />
              </v-col>
              <v-col
                cols="12"
                sm="6"
                md="4"
              >
                <v-text-field
                  v-model="mesh.host"
                  :label="$t('transport.host')"
                  hide-details
                />
              </v-col>
            </v-row>
            <Dial :dial="mesh" />     
            <OutTLS :outbound="mesh" />
          </v-col>
        </v-row>
      </v-card>
      <v-row>
        <v-col cols="auto">
          <v-btn-toggle
            v-model="usePskText"
            class="rounded-xl"
            density="compact"
            variant="outlined"
            shaped
            mandatory
          >
            <v-btn
              @click="delete data.mesh_psk_file"
            >
              {{ $t('types.derp.meshPsk') }}
            </v-btn>
            <v-btn
              @click="delete data.mesh_psk"
            >
              {{ $t('types.derp.meshPskFile') }}
            </v-btn>
          </v-btn-toggle>
        </v-col>
      </v-row>
      <v-row v-if="usePskText == 1">
        <v-col cols="12">
          <v-text-field
            v-model="data.mesh_psk_file"
            :label="$t('types.derp.meshPskFile')"
            hide-details
          />
        </v-col>
      </v-row>
      <v-row v-else>
        <v-col cols="12">
          <v-text-field
            v-model="data.mesh_psk"
            :label="$t('types.derp.meshPsk')"
            hide-details
          />
        </v-col>
      </v-row>
    </template>
    <template v-if="optionStun">
      <v-card
        :title="$t('types.derp.stun')"
        class="border"
        style="padding: 8px;"
        rounded="xl"
      >
        <Listen
          :data="stun"
          :in-tags="inTags"
        />
      </v-card>
    </template>
    <v-card-actions>
      <v-spacer />
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
            {{ $t('types.derp.options') }}
          </v-btn>
        </template>
        <v-card>
          <v-list>
            <v-list-item>
              <v-switch
                v-model="optionVerifyCE"
                color="primary"
                :label="$t('types.derp.verifyClientEndpoint')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionVerifyCU"
                color="primary"
                :label="$t('types.derp.verifyClientUrl')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionHome"
                color="primary"
                :label="$t('pages.home')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionMesh"
                color="primary"
                :label="$t('types.derp.meshWith')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionStun"
                color="primary"
                :label="$t('types.derp.stun')"
                hide-details
              />
            </v-list-item>
          </v-list>
        </v-card>
      </v-menu>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import Dial from '@/components/Dial.vue'
import OutTLS from '../tls/OutTLS.vue'
import Listen from '../Listen.vue'
import { Dial as DialOptions } from '@/types/dial'
import { Listen as ListenOptions } from '@/types/inbounds'
import { oTls } from '@/types/tls'
import { Srv } from '@/types/services'

// A client the DERP server verifies over HTTP; Dial.vue edits the dial fields.
interface VerifyClientUrl extends DialOptions {
  url: string
}

// A peer this server meshes with; Dial.vue and OutTLS.vue edit the rest.
interface MeshNode extends DialOptions {
  server?: string
  server_port?: number
  host?: string
  tls?: oTls
}

// The embedded STUN server; Listen.vue edits the listen fields inside it.
interface StunOptions extends Partial<ListenOptions> {
  enabled?: boolean
}

// Only the derp fields this form reads or writes.
interface DerpData {
  config_path?: string
  home?: string
  verify_client_endpoint?: string[]
  verify_client_url?: VerifyClientUrl[]
  mesh_with?: MeshNode[]
  mesh_psk?: string
  mesh_psk_file?: string
  stun?: StunOptions
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<Srv>('data', { required: true })

// The parent holds a union and picks this component with a v-if on the type,
// which the template checker cannot follow, so narrow once here. The computed
// returns the same object, so edits still reach the parent.
const data = computed(() => model.value as unknown as DerpData)

defineProps<{
  tsTags: string[]
  inTags: string[]
}>()

// Listen.vue edits the listen options of whatever object it is given, and the
// STUN section only renders once stun exists.
const stun = computed(() => data.value.stun as unknown as Srv)

const menu = ref(false)
const usePskText = ref(data.value.mesh_psk == undefined ? 1 : 0)

const optionVerifyCE = computed({
  get: (): boolean => data.value.verify_client_endpoint != undefined,
  set: (v: boolean) => { data.value.verify_client_endpoint = v ? [] : undefined },
})

const optionVerifyCU = computed({
  get: (): boolean => data.value.verify_client_url != undefined,
  set: (v: boolean) => { data.value.verify_client_url = v ? [{ url: '' }] : undefined },
})

const optionHome = computed({
  get: (): boolean => data.value.home != undefined,
  set: (v: boolean) => { data.value.home = v ? '' : undefined },
})

const optionMesh = computed({
  get: (): boolean => data.value.mesh_with != undefined,
  set: (v: boolean) => {
    if (v) {
      data.value.mesh_with = [{ tls: {} }]
      delete data.value.mesh_psk_file
      data.value.mesh_psk = ''
    } else {
      delete data.value.mesh_with
      delete data.value.mesh_psk_file
      delete data.value.mesh_psk
    }
  },
})

const optionStun = computed({
  get: (): boolean => data.value.stun != undefined,
  set: (v: boolean) => { data.value.stun = v ? { enabled: true } : undefined },
})
</script>
