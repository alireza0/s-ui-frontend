<template>
  <v-card subtitle="SSH">
    <template v-if="optionKey">
      <v-row>
        <v-col cols="auto">
          <v-btn-toggle
            v-model="usePath"
            class="rounded-xl"
            density="compact"
            variant="outlined"
            shaped
            mandatory
          >
            <v-btn
              @click="data.private_key=undefined; data.private_key_path=''"
            >
              {{ $t('tls.usePath') }}
            </v-btn>
            <v-btn
              @click="data.private_key_path=undefined; data.private_key=''"
            >
              {{ $t('tls.useText') }}
            </v-btn>
          </v-btn-toggle>
        </v-col>
      </v-row>
      <v-row v-if="usePath == 0">
        <v-col
          cols="12"
          sm="6"
        >
          <v-text-field
            v-model="data.private_key_path"
            :label="$t('tls.keyPath')"
            hide-details
          />
        </v-col>
      </v-row>
      <v-row v-else>
        <v-col
          cols="12"
          sm="6"
        >
          <v-textarea
            v-model="data.private_key"
            :label="$t('tls.key')"
            hide-details
          />
        </v-col>
      </v-row>
      <v-row>
        <v-col
          cols="12"
          sm="6"
        >
          <v-text-field
            v-model="data.private_key_passphrase"
            :label="$t('types.ssh.passphrase')"
            hide-details
          />
        </v-col>
      </v-row>
    </template>
    <template v-else>
      <v-row>
        <v-col
          cols="12"
          sm="6"
          md="4"
        >
          <v-text-field
            v-model="data.user"
            :label="$t('types.un')"
            hide-details
          />
        </v-col>
        <v-col
          cols="12"
          sm="6"
          md="4"
        >
          <v-text-field
            v-model="data.password"
            :label="$t('types.pw')"
            hide-details
          />
        </v-col>
      </v-row>
    </template>
    <v-row v-if="optionHostKey">
      <v-col
        cols="12"
        sm="6"
      >
        <v-textarea
          v-model="host_key"
          :label="$t('types.ssh.hostKey')"
          hide-details
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col
        v-if="data.host_key_algorithms != undefined"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="algorithms"
          :label="$t('types.ssh.algorithm') + ' ' + $t('commaSeparated')"
          hide-details
        />
      </v-col>
      <v-col
        v-if="data.client_version != undefined"
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.client_version"
          :label="$t('types.ssh.clientVer')"
          hide-details
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
            {{ $t('types.ssh.options') }}
          </v-btn>
        </template>
        <v-card>
          <v-list>
            <v-list-item>
              <v-switch
                v-model="optionKey"
                color="primary"
                label="SSH Key"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionHostKey"
                color="primary"
                :label="$t('types.ssh.hostKey')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionAlgorithms"
                color="primary"
                :label="$t('types.ssh.algorithm')"
                hide-details
              />
            </v-list-item>
            <v-list-item>
              <v-switch
                v-model="optionVer"
                color="primary"
                :label="$t('types.ssh.clientVer')"
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
import { Outbound } from '@/types/outbounds'

// Only the SSH outbound fields this form reads or writes. `host_key` holds ''
// between the option being switched on and a value being typed, which is why
// it is not just a list of lines.
interface SshData {
  user?: string
  password?: string
  private_key?: string
  private_key_path?: string
  private_key_passphrase?: string
  host_key?: string[] | ''
  host_key_algorithms?: string[]
  client_version?: string
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<Outbound>('data', { required: true })

// The parent holds a union and picks this component with a v-if on the type,
// which the template checker cannot follow, so narrow once here. The computed
// returns the same object, so edits still reach the parent.
const data = computed(() => model.value as unknown as SshData)

const menu = ref(false)
const usePath = ref(0)

const optionKey = computed({
  get: (): boolean => data.value.private_key != undefined || data.value.private_key_path != undefined,
  set: (v: boolean) => {
    usePath.value = 0
    if (v) {
      data.value.private_key_path = ""
      delete data.value.user
      delete data.value.password
    } else {
      delete data.value.private_key_path
      delete data.value.private_key
      delete data.value.private_key_passphrase
    }
  },
})

const optionHostKey = computed({
  get: (): boolean => data.value.host_key != undefined,
  set: (v: boolean) => { data.value.host_key = v ? '' : undefined },
})

const optionAlgorithms = computed({
  get: (): boolean => data.value.host_key_algorithms != undefined,
  set: (v: boolean) => { data.value.host_key_algorithms = v ? [] : undefined },
})

const optionVer = computed({
  get: (): boolean => data.value.client_version != undefined,
  set: (v: boolean) => { data.value.client_version = v ? 'SSH-2.0-OpenSSH_7.4p1' : undefined },
})

const host_key = computed({
  get: (): string => data.value.host_key ? data.value.host_key.join('\n') : '',
  set: (v: string) => { data.value.host_key = v.split('\n') },
})

const algorithms = computed({
  get: (): string => data.value.host_key_algorithms ? data.value.host_key_algorithms.join(',') : '',
  set: (v: string) => { data.value.host_key_algorithms = v.length > 0 ? v.split(',') : undefined },
})
</script>
