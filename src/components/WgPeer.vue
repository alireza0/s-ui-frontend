<template>
  <v-row>
    <v-col
      cols="12"
      sm="8"
    >
      <v-text-field
        v-model="privateKey"
        :label="$t('types.wg.privKey')"
        append-icon="mdi-key-star"
        hide-details
        @click:append="refreshKey"
      />
    </v-col>
    <v-col
      cols="12"
      sm="8"
    >
      <v-text-field
        v-model="publicKey"
        :label="$t('types.wg.pubKey')"
        hide-details
      />
    </v-col>
    <v-col
      cols="12"
      sm="8"
    >
      <v-text-field
        v-model="data.pre_shared_key"
        :label="$t('types.wg.psk')"
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
        v-model="address"
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
        v-model.number="port"
        :label="$t('out.port')"
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
        v-model.number="keepAlive"
        label="KeepAlive"
        type="number"
        min="0"
        :suffix="$t('date.s')"
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
        v-model="allowed_ips"
        :label="$t('types.wg.allowedIp') + ' ' + $t('commaSeparated')"
        hide-details
      />
    </v-col>
    <v-col
      cols="12"
      sm="6"
    >
      <v-text-field
        v-model="reserved"
        :label="'Reserved ' + $t('commaSeparated')"
        hide-details
      />
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { WgPeer } from '@/types/endpoints'

// One entry of the panel's own key store, which keeps the private key beside
// the public key sing-box is configured with.
interface WgKey {
  public_key: string
  private_key: string
}

// The panel-only extras carried beside the endpoint's sing-box options.
interface WgExt {
  keys: WgKey[]
}

// The peer fields this form edits. Emptying one removes it rather than writing
// an empty value, so each is optional here.
interface PeerData {
  address?: string
  port?: number
  public_key: string
  pre_shared_key?: string
  allowed_ips?: string[]
  persistent_keepalive_interval?: number
  reserved?: number[]
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<WgPeer>('data', { required: true })

// An emptied field is removed, which the declared peer shape does not allow,
// so narrow once here. The computed returns the same object, so edits still
// reach the parent.
const data = computed(() => model.value as unknown as PeerData)

const props = defineProps<{
  ext?: WgExt
}>()

const emit = defineEmits<{
  refreshPeerKey: []
}>()

const allowed_ips = computed({
  get: () => data.value.allowed_ips?.join(','),
  set: (v: string) => { data.value.allowed_ips = v.length > 0 ? v.split(',') : undefined },
})

const reserved = computed({
  get: () => data.value.reserved?.join(','),
  set: (v: string) => {
    if (!v.endsWith(',')) {
      data.value.reserved = v.length > 0 ? v.split(',').map(str => parseInt(str, 10)) : undefined
    }
  },
})

const address = computed({
  get: () => data.value.address,
  set: (v: string) => { data.value.address = v.length > 0 ? v : undefined },
})

const port = computed({
  get: () => data.value.port,
  set: (v: number) => { data.value.port = v > 0 ? v : undefined },
})

const keepAlive = computed({
  get: () => data.value.persistent_keepalive_interval ?? 0,
  set: (v: number) => { data.value.persistent_keepalive_interval = v > 0 ? v : undefined },
})

// The private key lives in the endpoint's key store, found by the public key
// the peer is configured with.
const privateKey = computed({
  get: (): string => {
    const keys = props.ext?.keys ?? []
    const indexKeys = keys.findIndex(key => key.public_key == data.value.public_key)
    return indexKeys > -1 ? keys[indexKeys].private_key : ''
  },
  set: (v: string) => {
    const keys = props.ext?.keys ?? []
    const indexKeys = keys.findIndex(key => key.public_key == data.value.public_key)
    // The getter above already allows for a peer the key store does not know,
    // such as one added outside the panel. There is nowhere to put a private
    // key for it, so do not write one rather than throwing on keys[-1].
    if (indexKeys > -1) keys[indexKeys].private_key = v
  },
})

const publicKey = computed({
  get: () => data.value.public_key,
  set: (v: string) => {
    const keys = props.ext?.keys ?? []
    const indexKeys = keys.findIndex(key => key.public_key == data.value.public_key)
    // Same as above: a peer the key store does not know still gets its own
    // public key updated, there is just no stored pair to keep in step.
    if (indexKeys > -1) keys[indexKeys].public_key = v
    data.value.public_key = v
  },
})

function refreshKey() {
  emit('refreshPeerKey')
}
</script>
