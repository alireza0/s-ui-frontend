<template>
  <v-card subtitle="Talescale">
    <v-row>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-switch
          v-model="data.ephemeral"
          color="primary"
          :label="$t('types.ts.ephemeral')"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-switch
          v-model="data.accept_routes"
          color="primary"
          :label="$t('types.ts.acceptRoutes')"
        />
      </v-col>
    </v-row>
    <v-row v-if="optionStateDir">
      <v-col
        cols="12"
        sm="8"
      >
        <v-text-field
          v-model="data.state_directory"
          :label="$t('types.ts.stateDir')"
        />
      </v-col>
    </v-row>
    <v-row v-if="optionAuth">
      <v-col
        cols="12"
        sm="8"
      >
        <v-text-field
          v-model="data.auth_key"
          :label="$t('types.ts.authKey')"
        />
      </v-col>
    </v-row>
    <v-row v-if="optionCtrlUrl">
      <v-col
        cols="12"
        sm="8"
      >
        <v-text-field
          v-model="data.control_url"
          :label="$t('types.ts.controlUrl')"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col
        v-if="optionHostname"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.hostname"
          :label="$t('types.ts.hostname')"
        />
      </v-col>
      <v-col
        v-if="optionUdpTimeout"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model.number="udpTimeout"
          type="number"
          min="1"
          :suffix="$t('date.s')"
          :label="$t('types.ts.udpTimeout')"
        />
      </v-col>
    </v-row>
    <v-row v-if="optionExitNode">
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.exit_node"
          :label="$t('types.ts.exitNode')"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-switch
          v-model="data.exit_node_allow_lan_access"
          color="primary"
          :label="$t('types.ts.allowLanAccess')"
        />
      </v-col>
    </v-row>
    <v-row v-if="optionRelay">
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model.number="data.relay_server_port"
          type="number"
          min="0"
          :label="$t('types.ts.relayServerPort')"
          hide-details
        />
      </v-col>
      <v-col
        cols="12"
        sm="8"
      >
        <v-text-field
          v-model="relay_endpoints"
          :label="$t('types.ts.relayEndpoints') + ' ' + $t('commaSeparated')"
          hide-details
        />
      </v-col>
    </v-row>
    <v-row v-if="optionSysIf">
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-switch
          v-model="data.system_interface"
          color="primary"
          :label="$t('types.ts.systemInterface')"
        />
      </v-col>
      <v-col
        v-if="data.system_interface"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.system_interface_name"
          :label="$t('types.ts.sysIfName')"
          hide-details
        />
      </v-col>
      <v-col
        v-if="data.system_interface"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model.number="data.system_interface_mtu"
          type="number"
          min="0"
          :label="$t('types.ts.sysIfMtu')"
          hide-details
        />
      </v-col>
    </v-row>
    <v-row v-if="optionAdvRoutes">
      <v-col
        cols="12"
        sm="8"
      >
        <v-text-field
          v-model="advertise_routes"
          :label="$t('types.ts.advRoutes') + ' ' + $t('commaSeparated')"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-switch
          v-model="data.advertise_exit_node"
          color="primary"
          :label="$t('types.ts.advExitNode')"
        />
      </v-col>
    </v-row>
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
            {{ $t('types.ts.options') }}
          </v-btn>
        </template>
        <v-card>
          <v-list>
            <v-list-item>
              <v-switch
                v-model="optionStateDir"
                color="primary"
                :label="$t('types.ts.stateDir')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionAuth"
                color="primary"
                :label="$t('types.ts.authKey')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionCtrlUrl"
                color="primary"
                :label="$t('types.ts.controlUrl')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionHostname"
                color="primary"
                :label="$t('types.ts.hostname')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionExitNode"
                color="primary"
                :label="$t('types.ts.exitNode')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionRelay"
                color="primary"
                :label="$t('types.ts.relayServer')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionSysIf"
                color="primary"
                :label="$t('types.ts.systemInterface')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionAdvRoutes"
                color="primary"
                :label="$t('types.ts.advRoutes')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionUdpTimeout"
                color="primary"
                :label="$t('types.ts.udpTimeout')"
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
import { Endpoint } from '@/types/endpoints'

// Only the Tailscale endpoint fields this form reads or writes.
interface TailscaleData {
  state_directory?: string
  auth_key?: string
  control_url?: string
  ephemeral?: boolean
  hostname?: string
  accept_routes?: boolean
  exit_node?: string
  exit_node_allow_lan_access?: boolean
  advertise_routes?: string[]
  advertise_exit_node?: boolean
  relay_server_port?: number
  relay_server_static_endpoints?: string[]
  system_interface?: boolean
  system_interface_name?: string
  system_interface_mtu?: number
  udp_timeout?: string
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<Endpoint>('data', { required: true })

// The parent holds a union and picks this component with a v-if on the type,
// which the template checker cannot follow, so narrow once here. The computed
// returns the same object, so edits still reach the parent.
const data = computed(() => model.value as unknown as TailscaleData)

const menu = ref(false)

const optionStateDir = computed({
  get: (): boolean => data.value.state_directory !== undefined,
  set: (v: boolean) => { data.value.state_directory = v ? "$HOME/.tailscale" : undefined },
})

const optionAuth = computed({
  get: (): boolean => data.value.auth_key !== undefined,
  set: (v: boolean) => { data.value.auth_key = v ? "" : undefined },
})

const optionCtrlUrl = computed({
  get: (): boolean => data.value.control_url !== undefined,
  set: (v: boolean) => { data.value.control_url = v ? "https://controlplane.tailscale.com" : undefined },
})

const optionHostname = computed({
  get: (): boolean => data.value.hostname !== undefined,
  set: (v: boolean) => { data.value.hostname = v ? "localhost" : undefined },
})

const optionExitNode = computed({
  get: (): boolean => data.value.exit_node !== undefined,
  set: (v: boolean) => {
    if (v) {
      data.value.exit_node = ""
    } else {
      delete data.value.exit_node
      delete data.value.exit_node_allow_lan_access
    }
  },
})

const optionAdvRoutes = computed({
  get: (): boolean => data.value.advertise_routes !== undefined,
  set: (v: boolean) => {
    if (v) {
      data.value.advertise_routes = []
    } else {
      delete data.value.advertise_routes
      delete data.value.advertise_exit_node
    }
  },
})

const optionRelay = computed({
  get: (): boolean => data.value.relay_server_port !== undefined || (data.value.relay_server_static_endpoints?.length ?? 0) > 0,
  set: (v: boolean) => {
    if (v) {
      data.value.relay_server_port = 0
      data.value.relay_server_static_endpoints = []
    } else {
      delete data.value.relay_server_port
      delete data.value.relay_server_static_endpoints
    }
  },
})

const optionSysIf = computed({
  get: (): boolean => data.value.system_interface !== undefined,
  set: (v: boolean) => {
    if (v) {
      data.value.system_interface = false
    } else {
      delete data.value.system_interface
      delete data.value.system_interface_name
      delete data.value.system_interface_mtu
    }
  },
})

const optionUdpTimeout = computed({
  get: (): boolean => data.value.udp_timeout !== undefined,
  set: (v: boolean) => { data.value.udp_timeout = v ? '30s' : undefined },
})

const udpTimeout = computed({
  get: (): string => data.value.udp_timeout ? data.value.udp_timeout.replace('s','') : '',
  set: (v: number) => { data.value.udp_timeout = v>1 ? v + 's' : '30s' },
})

const advertise_routes = computed({
  get: (): string => data.value.advertise_routes?.join(',') ?? "",
  set: (v: string) => { data.value.advertise_routes = v.length > 0 ? v.split(',') : [] },
})

const relay_endpoints = computed({
  get: (): string => data.value.relay_server_static_endpoints?.join(',') ?? "",
  set: (v: string) => { data.value.relay_server_static_endpoints = v.length > 0 ? v.split(',') : [] },
})
</script>
