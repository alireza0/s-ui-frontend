<template>
  <TlsVue
    :id="modal.id"
    v-model="modal.visible"
    :visible="modal.visible"
    :data="modal.data"
    :providers="providerTags"
    @close="closeModal"
    @save="saveModal"
  />
  <CertProviderVue
    v-model="providerModal.visible"
    :visible="providerModal.visible"
    :index="providerModal.index"
    :data="providerModal.data"
    :tags="providerTags"
    @close="closeProviderModal"
    @save="saveProviderModal"
  />
  <v-row>
    <v-col
      cols="12"
      justify="center"
      align="center"
    >
      <v-btn
        color="primary"
        @click="showModal(0)"
      >
        {{ $t('actions.add') }}
      </v-btn>
    </v-col>
  </v-row>
  <v-row>
    <v-col
      v-for="(item, index) in <any[]>tlsConfigs"
      :key="item.id"
      cols="12"
      sm="4"
      md="3"
      lg="2"
    >
      <v-card
        rounded="xl"
        elevation="5"
        min-width="200"
        :title="item.name"
      >
        <v-card-subtitle style="margin-top: -15px;">
          {{ item.server?.server_name?.length>0 ? item.server.server_name : "-" }}
        </v-card-subtitle>
        <v-card-text>
          <v-row>
            <v-col>{{ $t('pages.inbounds') }}</v-col>
            <v-col>
              <template v-if="tlsInbounds(item.id).length>0">
                <v-tooltip
                  activator="parent"
                  dir="ltr"
                  location="bottom"
                >
                  <span
                    v-for="i in tlsInbounds(item.id)"
                    :key="i"
                  >{{ i }}<br></span>
                </v-tooltip>
                {{ tlsInbounds(item.id).length }}
              </template>
              <template v-else>
                -
              </template>
            </v-col>
          </v-row>
          <v-row>
            <v-col>{{ $t('tls.provider.title') }}</v-col>
            <v-col>{{ item.server?.certificate_provider ?? '-' }}</v-col>
          </v-row>
          <v-row>
            <v-col>ECH</v-col>
            <v-col>
              {{ $t(item.server?.ech == undefined ? 'no' : 'yes') }}
            </v-col>
          </v-row>
          <v-row>
            <v-col>Reality</v-col>
            <v-col>
              {{ $t(item.server?.reality == undefined ? 'no' : 'yes') }}
            </v-col>
          </v-row>
        </v-card-text>
        <v-divider />
        <v-card-actions style="padding: 0;">
          <v-btn
            icon="mdi-file-edit"
            @click="showModal(item.id)"
          >
            <v-icon />
            <v-tooltip
              activator="parent"
              location="top"
              :text="$t('actions.edit')"
            />
          </v-btn>
          <v-btn
            v-if="tlsInbounds(item.id).length == 0"
            icon="mdi-file-remove"
            style="margin-inline-start:0;"
            color="warning"
            @click="delOverlay[index] = true"
          >
            <v-icon />
            <v-tooltip
              activator="parent"
              location="top"
              :text="$t('actions.del')"
            />
          </v-btn>
          <v-overlay
            v-model="delOverlay[index]"
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
                  @click="delTls(item.id)"
                >
                  {{ $t('yes') }}
                </v-btn>
                <v-btn
                  color="success"
                  variant="outlined"
                  @click="delOverlay[index] = false"
                >
                  {{ $t('no') }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-overlay>
          <v-btn
            icon="mdi-content-duplicate"
            @click="clone(item)"
          >
            <v-icon />
            <v-tooltip
              activator="parent"
              location="top"
              :text="$t('actions.clone')"
            />
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-col>
  </v-row>

  <!-- Certificate providers are part of the base config rather than the TLS
       table, but they only exist to serve the configs above, so they are
       managed here. A TLS config points at one by tag. -->
  <v-divider class="mt-4" />
  <v-row>
    <v-col
      class="v-card-subtitle"
      cols="12"
    >
      {{ $t('tls.provider.title') }}
    </v-col>
    <v-col
      cols="12"
      justify="center"
      align="center"
    >
      <v-btn
        color="primary"
        :loading="providerLoading"
        @click="showProviderModal(-1)"
      >
        {{ $t('actions.add') }}
      </v-btn>
    </v-col>
  </v-row>
  <v-row>
    <v-col
      v-for="(item, index) in <any[]>providers"
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
          {{ providerTypeName(item.type) }}
        </v-card-subtitle>
        <v-card-text>
          <v-row>
            <v-col>{{ $t('rule.domain') }}</v-col>
            <v-col>
              <template v-if="item.domain?.length > 0">
                <v-tooltip
                  activator="parent"
                  dir="ltr"
                  location="bottom"
                >
                  <span
                    v-for="d in item.domain"
                    :key="d"
                  >{{ d }}<br></span>
                </v-tooltip>
                {{ item.domain.length }}
              </template>
              <template v-else>
                -
              </template>
            </v-col>
          </v-row>
          <v-row>
            <v-col>{{ $t('objects.tls') }}</v-col>
            <v-col>
              <template v-if="providerUsers(item.tag).length > 0">
                <v-tooltip
                  activator="parent"
                  dir="ltr"
                  location="bottom"
                >
                  <span
                    v-for="t in providerUsers(item.tag)"
                    :key="t"
                  >{{ t }}<br></span>
                </v-tooltip>
                {{ providerUsers(item.tag).length }}
              </template>
              <template v-else>
                -
              </template>
            </v-col>
          </v-row>
        </v-card-text>
        <v-divider />
        <v-card-actions style="padding: 0;">
          <v-btn
            icon="mdi-file-edit"
            @click="showProviderModal(index)"
          >
            <v-icon />
            <v-tooltip
              activator="parent"
              location="top"
              :text="$t('actions.edit')"
            />
          </v-btn>
          <!-- Deleting a provider a TLS config still references would leave a
               dangling tag, which stops the core from starting. -->
          <v-btn
            v-if="providerUsers(item.tag).length == 0"
            icon="mdi-file-remove"
            style="margin-inline-start:0;"
            color="warning"
            @click="delProviderOverlay[index] = true"
          >
            <v-icon />
            <v-tooltip
              activator="parent"
              location="top"
              :text="$t('actions.del')"
            />
          </v-btn>
          <v-overlay
            v-model="delProviderOverlay[index]"
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
                  @click="delProvider(index)"
                >
                  {{ $t('yes') }}
                </v-btn>
                <v-btn
                  color="success"
                  variant="outlined"
                  @click="delProviderOverlay[index] = false"
                >
                  {{ $t('no') }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-overlay>
          <v-btn
            icon="mdi-content-duplicate"
            @click="cloneProvider(index)"
          >
            <v-icon />
            <v-tooltip
              activator="parent"
              location="top"
              :text="$t('actions.clone')"
            />
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import TlsVue from '@/layouts/modals/Tls.vue'
import CertProviderVue from '@/layouts/modals/CertProvider.vue'
import Data from '@/store/modules/data'
import { computed, ref } from 'vue'
import { Inbound } from '@/types/inbounds'
import { tls, certProvider } from '@/types/tls'
import { Config } from '@/types/config'

// Certificate providers are not part of the generated Config type yet, so the
// config is read through a view of it that adds them.
type ConfigWithProviders = Config & { certificate_providers?: certProvider[] }

const tlsConfigs = computed((): tls[] => {
  return Data().tlsConfigs
})

const inbounds = computed((): Inbound[] => {
  return Data().inbounds
})

const tlsInbounds = (id: number): string[] => {
  return inbounds.value.filter(i => i.tls_id == id).map(i => i.tag)
}

const modal = ref({
  visible: false,
  id: 0,
  data: "",
})

const delOverlay = ref(new Array<boolean>(tlsConfigs.value.length).fill(false))

const showModal = (id: number) => {
  modal.value.id = id
  modal.value.data = id == 0 ? '{}' : JSON.stringify(tlsConfigs.value.findLast(t => t.id == id))
  modal.value.visible = true
}
const clone = (obj: tls) => {
  const data = <tls>JSON.parse(JSON.stringify(obj))
  data.id = 0
  while (tlsConfigs.value.findIndex(t => t.name == data.name) != -1){
    data.name += "-copy"
  }
  saveModal(data)
}
const closeModal = () => {
  modal.value.visible = false
}
const saveModal = async (data:tls) => {
  const success = await Data().save("tls", data.id > 0 ? "edit" : "new", data)
  if (success) modal.value.visible = false
}

const delTls = async (id: number) => {
  const index = tlsConfigs.value.findIndex(t => t.id == id)
  const success = await Data().save("tls", "del", id)
  if (success) delOverlay.value[index] = false
}

// Certificate providers live in the base config, so each change is written
// back through the config object as a whole, the same way the rules page does.
const appConfig = computed((): ConfigWithProviders => Data().config)

const providers = computed((): certProvider[] => {
  const config = appConfig.value
  if (!Array.isArray(config.certificate_providers)) config.certificate_providers = []
  return config.certificate_providers
})

const providerTags = computed((): string[] => providers.value.map(p => p.tag))

const providerUsers = (tag: string): string[] =>
  tlsConfigs.value.filter(t => t.server?.certificate_provider == tag).map(t => t.name)

const providerTypeNames: Record<string, string> = {
  'acme': 'ACME',
  'tailscale': 'Tailscale',
  'cloudflare-origin-ca': 'Cloudflare Origin CA',
}
const providerTypeName = (type: string): string => providerTypeNames[type] ?? type

const providerLoading = ref(false)
const delProviderOverlay = ref(new Array<boolean>(providers.value.length).fill(false))
const providerModal = ref({ visible: false, index: -1, data: "" })

const showProviderModal = (index: number) => {
  providerModal.value.index = index
  providerModal.value.data = index == -1 ? '' : JSON.stringify(providers.value[index])
  providerModal.value.visible = true
}
const closeProviderModal = () => { providerModal.value.visible = false }

const saveProviderModal = async (data: certProvider) => {
  const index = providerModal.value.index
  if (index == -1) providers.value.push(data)
  else providers.value[index] = data
  const success = await saveProviders()
  if (success) providerModal.value.visible = false
}

const cloneProvider = async (index: number) => {
  const copy = <certProvider>JSON.parse(JSON.stringify(providers.value[index]))
  while (providerTags.value.includes(copy.tag)) copy.tag += "-copy"
  providers.value.push(copy)
  await saveProviders()
}

const delProvider = async (index: number) => {
  providers.value.splice(index, 1)
  const success = await saveProviders()
  if (success) delProviderOverlay.value[index] = false
}

const saveProviders = async (): Promise<boolean> => {
  providerLoading.value = true
  const success = await Data().save("config", "set", appConfig.value)
  providerLoading.value = false
  return success
}
</script>
