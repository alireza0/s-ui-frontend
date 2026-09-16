
<template>
  <ClientModal 
    :id="modal.id"
    v-model="modal.visible"
    :visible="modal.visible"
    :groups="groups"
    :inbound-tags="inboundTags"
    @close="closeModal"
  />
  <ClientAddBulk 
    v-model="addBulkModal"
    :visible="addBulkModal"
    :groups="groups"
    :inbound-tags="inboundTags"
    @close="closeAddBulk"
  />
  <ClientEditBulk 
    v-model="editBulkModal"
    :visible="editBulkModal"
    :inbound-tags="inboundTags"
    :clients="clients"
    @close="closeEditBulk"
  />
  <QrCode
    :id="qrcode.id"
    v-model="qrcode.visible"
    :visible="qrcode.visible"
    @close="closeQrCode"
  />
  <Stats
    v-model="stats.visible"
    :visible="stats.visible"
    :resource="stats.resource"
    :tag="stats.tag"
    @close="closeStats"
  />
  <Sessions
    v-model="sessions.visible"
    :visible="sessions.visible"
    resource="user"
    :tag="sessions.tag"
    @close="closeSessions"
  />
  <v-dialog
    v-model="resetTrafficModal"
    width="auto"
  >
    <v-card
      rounded="lg"
      :title="$t('actions.resetTraffic')"
    >
      <v-divider />
      <v-card-text>{{ $t('confirm') }}</v-card-text>
      <v-card-actions>
        <v-btn
          color="error"
          variant="outlined"
          :loading="resetTrafficLoading"
          @click="resetTraffic"
        >
          {{ $t('yes') }}
        </v-btn>
        <v-btn
          color="success"
          variant="outlined"
          @click="resetTrafficModal = false"
        >
          {{ $t('no') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-row
    justify="center"
    align="center"
  >
    <v-col cols="auto">
      <v-btn
        color="primary"
        @click="showModal(0)"
      >
        {{ $t('actions.add') }}
      </v-btn>
    </v-col>
    <v-col cols="auto">
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
            @click="addBulk"
          >
            <template #prepend>
              <v-icon icon="mdi-account-multiple-plus" />
            </template>
            <v-list-item-title>{{ $t('actions.addbulk') }}</v-list-item-title>
          </v-list-item>
          <v-list-item
            link
            @click="editBulk"
          >
            <template #prepend>
              <v-icon icon="mdi-account-multiple-check" />
            </template>
            <v-list-item-title>{{ $t('actions.editbulk') }}</v-list-item-title>
          </v-list-item>
          <v-list-item
            link
            @click="confirmResetTraffic"
          >
            <template #prepend>
              <v-icon icon="mdi-restore" />
            </template>
            <v-list-item-title>{{ $t('actions.resetTraffic') }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-col>
    <v-col cols="auto">
      <v-menu
        v-model="filterMenu"
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
              :icon="filterSettings.enabled ? 'mdi-filter-check-outline' : 'mdi-filter-menu-outline'"
              :color="filterSettings.enabled ? 'primary' : ''"
            />
          </v-btn>
        </template>
        <v-card>
          <v-container>
            <v-row>
              <v-col>
                <v-select
                  v-model="filterSettings.state"
                  variant="underlined"
                  density="compact"
                  :label="$t('type')"
                  :items="filterItems"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col>
                <v-select
                  v-model="filterSettings.group"
                  variant="underlined"
                  density="compact"
                  :label="$t('client.group')"
                  :items="[ {title: $t('all'), value: '-'}, ...groups.map(g => ({ title: g.length>0 ? g : $t('none'), value: g}))]"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col>
                <v-text-field
                  v-model="filterSettings.text"
                  variant="underlined"
                  density="compact"
                  :label="$t('client.name')"
                />
              </v-col>
            </v-row>
          </v-container>
          <v-card-actions>
            <v-card-actions>
              <v-spacer />
              <v-btn
                color="primary"
                variant="outlined"
                @click="clearFilter"
              >
                {{ $t('actions.del') }}
              </v-btn>
              <v-btn
                color="primary"
                variant="tonal"
                @click="doFilter"
              >
                {{ $t('actions.update') }}
              </v-btn>
            </v-card-actions>
          </v-card-actions>
        </v-card>
      </v-menu>
    </v-col>
  </v-row>
  <v-row>
    <v-col cols="12">
      <v-data-table
        :headers="headers"
        :items="filterSettings.enabled ? filterSettings.filteredClients : clients"
        :hide-default-footer="filterSettings.enabled ? filterSettings.filteredClients.length<=10 : clients.length<=10"
        :items-per-page="itemPerPage"
        hide-no-data
        fixed-header
        item-value="name"
        :mobile="smAndDown"
        mobile-breakpoint="sm"
        width="100%"
        class="elevation-3 rounded"
        @update:items-per-page="setItemPerPage($event)"
      >
        <template #item.enable="{ item }">
          <v-switch
            :model-value="item.enable"
            :loading="toggling[item.id]"
            :disabled="toggling[item.id]"
            color="success"
            density="compact"
            hide-details
            @update:model-value="(val:any) => toggleEnable(item, !!val)"
          />
        </template>
        <template #item.inbounds="{ item }">
          <span>
            <v-tooltip
              v-if="item.inbounds?.length != 0"
              activator="parent"
              dir="ltr"
              location="start"
            >
              <span
                v-for="i in item.inbounds"
                :key="i"
              >{{ inbounds.find(inb => inb.id == i)?.tag }}<br></span>
            </v-tooltip>
            {{ item.inbounds?.length }}
          </span>
        </template>
        <template #item.volume="{ item }">
          <div
            v-tooltip:top="'↓' + HumanReadable.sizeFormat(item.down) + ' - ' + HumanReadable.sizeFormat(item.up) + '↑'"
            class="text-start"
          >
            <v-chip
              size="small"
              :color="item.volume==0 ? 'success' : item.volume<=(item.up + item.down)? 'error': ''"
              label
            >
              {{ HumanReadable.sizeFormat(item.up + item.down) + ' / ' + (item.volume == 0 ? $t('unlimited') : HumanReadable.sizeFormat(item.volume)) }}
            </v-chip>
          </div>
          <v-progress-linear
            v-if="item.volume>0"
            :model-value="percent(item)"
            :color="percentColor(item)"
            bottom
          />
        </template>
        <template #item.expiry="{ item }">
          <div class="text-start">
            <v-tooltip
              v-if="item.expiry>0"
              activator="parent"
              location="top"
              :text="new Date(item.expiry * 1000).toLocaleString(locale)"
            />
            <v-chip
              size="small"
              :color="item.expiry==0 ? 'success' : item.expiry<=Date.now()/1000? 'error': ''"
              label
            >
              {{ HumanReadable.remainedDays(item.expiry) }}
            </v-chip>
          </div>
        </template>
        <template #item.online="{ item }">
          <div class="text-start">
            <template v-if="isOnline(item.name).value">
              <v-chip
                density="comfortable"
                size="small"
                color="success"
                variant="flat"
                link
                @click="showSessions(item.name)"
              >
                {{ $t('online') }}
                <v-tooltip
                  activator="parent"
                  location="top"
                  :text="$t('sessions.title')"
                />
              </v-chip>
            </template>
            <template v-else>
              -
            </template>
          </div>
        </template>
        <template #item.createdAt="{ item }">
          <div class="text-start">
            <template v-if="item.createdAt>0">
              <v-tooltip
                activator="parent"
                location="top"
                :text="new Date(item.createdAt * 1000).toLocaleString(locale)"
              />
              {{ new Date(item.createdAt * 1000).toLocaleDateString(locale) }}
            </template>
            <template v-else>
              -
            </template>
          </div>
        </template>
        <template #item.onlineAt="{ item }">
          <div class="text-start">
            <template v-if="item.onlineAt>0">
              <v-tooltip
                activator="parent"
                location="top"
                :text="new Date(item.onlineAt * 1000).toLocaleString(locale)"
              />
              {{ new Date(item.onlineAt * 1000).toLocaleString(locale) }}
            </template>
            <template v-else>
              -
            </template>
          </div>
        </template>
        <template #item.actions="{ item }">
          <v-icon
            class="me-2"
            @click="showModal(item.id)"
          >
            mdi-pencil
          </v-icon>
          <v-menu
            v-model="delOverlay[clients.findIndex(c => c.id == item.id)]"
            :close-on-content-click="false"
            location="top center"
          >
            <template #activator="{ props }">
              <v-icon
                class="me-2"
                color="error"
                v-bind="props"
              >
                mdi-delete
              </v-icon>
            </template>
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
                  @click="delClient(item.id)"
                >
                  {{ $t('yes') }}
                </v-btn>
                <v-btn
                  color="success"
                  variant="outlined"
                  @click="delOverlay[clients.findIndex(c => c.id == item.id)] = false"
                >
                  {{ $t('no') }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-menu>
          <v-icon
            class="me-2"
            @click="showQrCode(item.id)"
          >
            mdi-qrcode
          </v-icon>
          <v-icon
            v-if="Data().enableTraffic"
            icon="mdi-chart-line"
            @click="showStats(item.name)"
          >
            <v-tooltip
              activator="parent"
              location="top"
              :text="$t('stats.graphTitle')"
            />
          </v-icon>
        </template>
      </v-data-table>
    </v-col>
  </v-row>
</template>
<script lang="ts" setup>
import Data from '@/store/modules/data'
import ClientModal from '@/layouts/modals/Client.vue'
import ClientAddBulk from '@/layouts/modals/ClientAddBulk.vue'
import ClientEditBulk from '@/layouts/modals/ClientEditBulk.vue'
import QrCode from '@/layouts/modals/QrCode.vue'
import Stats from '@/layouts/modals/Stats.vue'
import Sessions from '@/layouts/modals/Sessions.vue'
import { Client } from '@/types/clients'
import { Inbound } from '@/types/inbounds'
import { computed, ref } from 'vue'
import { HumanReadable } from '@/plugins/utils'
import { i18n, locale } from '@/locales'
import { useDisplay } from 'vuetify'
import HttpUtils from '@/plugins/httputil'

const { smAndDown } = useDisplay()

// A client as it comes back from the panel: saved, so it carries the id and
// the timestamps that only a client built in the browser is still without.
type ClientRow = Client & {
  id: number
  createdAt: number
  onlineAt: number
}

const clients = computed((): ClientRow[] => {
  return <ClientRow[]> Data().clients
})

const isOnline = (cname: string) => computed(() => {
  return Data().onlines?.user?.includes(cname) ?? false
})

const inbounds = computed((): Inbound[] => {
  return Data().inbounds?? []
})

// Only the inbound types that declare users are in the union, but any inbound
// can carry one, so the field is read through a shape that only says that.
const inboundTags = computed((): { title: string, value: number }[] => {
  if (!inbounds.value) return []
  return inbounds.value?.filter(i => i.tag != "" && (i as { users?: unknown }).users).map(i => { return { title: i.tag, value: i.id } })
})

const groups = computed((): string[] => {
  if (!clients.value) return []
  if (filterSettings?.value.enabled) return Array.from(new Set(filterSettings.value.filteredClients?.map(c => c.group)))
  return Array.from(new Set(clients.value?.map(c => c.group)))
})

const actionMenu = ref(false)
const filterMenu = ref(false)
const filterSettings = ref({
  enabled: false,
  state: '',
  group: '-',
  text: '',
  filteredClients: <ClientRow[]>[]
})

const filterItems = [
  { title: i18n.global.t('none'), value: '' },
  { title: i18n.global.t('disable'), value: 'disable' },
  { title: i18n.global.t('date.expired'), value: 'expired' },
  { title: i18n.global.t('online'), value: 'online' },
]

const headers = [
  { title: i18n.global.t('client.name'), key: 'name' },
  { title: i18n.global.t('enable'), key: 'enable' },
  { title: i18n.global.t('client.desc'), key: 'desc' },
  { title: i18n.global.t('client.group'), key: 'group' },
  { title: i18n.global.t('pages.inbounds'), key: 'inbounds', width: 10 },
  { title: i18n.global.t('actions.action'), key: 'actions', sortable: false },
  { title: i18n.global.t('stats.volume'), key: 'volume' },
  { title: i18n.global.t('date.expiry'), key: 'expiry' },
  { title: i18n.global.t('online'), key: 'online' },
  { title: i18n.global.t('date.created'), key: 'createdAt' },
  { title: i18n.global.t('date.lastOnline'), key: 'onlineAt' },
  { key: 'data-table-group', width: 0 },
]

const itemPerPage = ref(localStorage.getItem('items-per-page') || '10')

const setItemPerPage = (items: number) => {
  itemPerPage.value = items.toString()
  localStorage.setItem('items-per-page', items.toString())
}

const modal = ref({
  visible: false,
  id: 0,
})

const delOverlay = ref(new Array<boolean>(clients.value.length).fill(false))

const showModal = async (id: number) => {
  modal.value.id = id
  modal.value.visible = true
}
const closeModal = () => {
  modal.value.visible = false
}

const toggling = ref<Record<number, boolean>>({})

const toggleEnable = async (item: ClientRow, val: boolean) => {
  if (item.enable === val) return
  toggling.value = { ...toggling.value, [item.id]: true }
  const full = await Data().loadClients(item.id)
  if (full?.id) {
    full.enable = val
    await Data().save("clients", "edit", full)
  }
  toggling.value = { ...toggling.value, [item.id]: false }
}

const delClient = async (id: number) => {
  const index = clients.value.findIndex(c => c.id === id)
  const success = await Data().save("clients", "del", id)
  if (success) delOverlay.value[index] = false
}

const qrcode = ref({
  visible: false,
  id: 0,
})

const showQrCode = (id: number) => {
  qrcode.value.id = id
  qrcode.value.visible = true
}
const closeQrCode = () => {
  qrcode.value.visible = false
}

const stats = ref({
  visible: false,
  resource: "user",
  tag: "",
})

const showStats = (tag: string) => {
  stats.value.tag = tag
  stats.value.visible = true
}
const closeStats = () => {
  stats.value.visible = false
}

const sessions = ref({
  visible: false,
  tag: "",
})

const showSessions = (tag: string) => {
  sessions.value.tag = tag
  sessions.value.visible = true
}
const closeSessions = () => {
  sessions.value.visible = false
}

const doFilter = () => {
  let filteredClients = clients.value.slice()
  if (filterSettings.value.group != '-') {
    filteredClients = filteredClients.filter(c => c.group == filterSettings.value.group)
  }
  if (filterSettings.value.text.length>0) {
    // includes, not search: String.search compiles its argument as a regular
    // expression, so typing "a.b" matched anything with a character between a
    // and b, and an unbalanced "(" threw out of the filter entirely.
    const txt = filterSettings.value.text.toLowerCase()
    filteredClients = filteredClients.filter(c =>
      (c.name ?? '').toLowerCase().includes(txt) || (c.desc ?? '').toLowerCase().includes(txt))
  }
  switch (filterSettings.value.state) {
    case "disable":
      filteredClients = filteredClients.filter(c => c.enable == false)
      break
    case "expired":
      filteredClients = filteredClients.filter(c => c.expiry > 0 && c.expiry < (Date.now()/1000) )
      break
    case "online":
      filteredClients = filteredClients.filter(c => Data().onlines?.user?.includes(c.name))
      break
  }
  filterSettings.value.filteredClients = filteredClients
  filterSettings.value.enabled = true
  filterMenu.value = false
}

const clearFilter = () => {
  filterSettings.value = {
    enabled: false,
    state: '',
    group: '-',
    text: '',
    filteredClients: <ClientRow[]>[]
  }
  filterMenu.value = false
}

const addBulkModal = ref(false)

const addBulk = () => {
  addBulkModal.value = true
  actionMenu.value = false
}

const closeAddBulk = () => {
  addBulkModal.value = false
}

const editBulkModal = ref(false)

const editBulk = () => {
  editBulkModal.value = true
  actionMenu.value = false
}

const closeEditBulk = () => {
  editBulkModal.value = false
}

const resetTrafficModal = ref(false)
const resetTrafficLoading = ref(false)

const confirmResetTraffic = () => {
  resetTrafficModal.value = true
  actionMenu.value = false
}

const resetTraffic = async () => {
  resetTrafficLoading.value = true
  const msg = await HttpUtils.post('api/resetTraffic', {})
  resetTrafficLoading.value = false
  if (msg.success) {
    resetTrafficModal.value = false
    await Data().loadData()
  }
}

const percent = (c: Client) => { return c.volume>0 ? Math.round((c.up+c.down) *100 / c.volume) : 0 }
const percentColor = (c: Client) => { return (c.up+c.down) >= c.volume ? 'error' : percent(c)>90 ? 'warning' : 'success' }

</script>
<style>
.v-data-table__tr--mobile td {
  height: fit-content;
  min-height: 36px !important;
}
.v-data-table__tr--mobile td div {
  width:max-content;
}
</style>