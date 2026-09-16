<template>
  <v-card :subtitle="$t('objects.transport')">
    <v-row>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-switch
          v-model="tpEnable"
          color="primary"
          :label="$t('transport.enable')"
          hide-details
        />
      </v-col>
      <v-col
        v-if="tpEnable"
        cols="12"
        sm="6"
        md="4"
      >
        <v-select
          v-model="transportType"
          hide-details
          :label="$t('type')"
          :items="Object.keys(trspTypes).map((key,index) => ({title: key, value: Object.values(trspTypes)[index]}))"
        />
      </v-col>
    </v-row>
    <Http
      v-if="Transport.type == trspTypes.HTTP"
      :transport="Transport"
    />
    <WebSocket
      v-if="Transport.type == trspTypes.WebSocket"
      :transport="Transport"
    />
    <GRPC
      v-if="Transport.type == trspTypes.gRPC"
      :transport="Transport"
    />
    <HttpUpgrade
      v-if="Transport.type == trspTypes.HTTPUpgrade"
      :transport="Transport"
    />
  </v-card>
</template>

<script lang="ts">
import { PropType } from 'vue'
import { TrspTypes, Transport } from '@/types/transport'
import Http from './transports/Http.vue'
import WebSocket from './transports/WebSocket.vue'
import GRPC from './transports/gRPC.vue'
import HttpUpgrade from './transports/HttpUpgrade.vue'

// The inbound or outbound that owns the transport block. The panel writes an
// empty object when the transport is switched off, so the key is always there.
interface TransportHolder {
  transport: Partial<Transport>
}

export default {
  components: { Http, WebSocket, GRPC, HttpUpgrade },
  props: {
    // Inbounds and outbounds both bind here, so the prop asks only for an
    // object and the narrowing happens below.
    data: { type: Object as PropType<object>, required: true }
  },
  data() {
    return {
      trspTypes: TrspTypes
    }
  },
  computed: {
    // Narrow once, since no caller hands over a type the template checker could
    // follow. The computed returns the same object, so edits reach the parent.
    holder(): TransportHolder { return <TransportHolder>this.$props.data },
    Transport() {
      return <Transport>this.holder.transport
    },
    tpEnable: {
      get() { return Object.hasOwn(this.holder.transport, 'type') },
      set(newValue: boolean) { this.holder.transport = newValue ? { type: 'http' } : {} }
    },
    transportType: {
      get() { return this.Transport.type },
      set(newValue: string) { this.holder.transport = { type: newValue } }
    }
  }
}
</script>