<template>
  <v-card :subtitle="$t('objects.multiplex')">
    <v-row>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-switch
          v-model="muxEnable"
          color="primary"
          :label="$t('mux.enable')"
          hide-details
        />
      </v-col>
      <template v-if="muxEnable">
        <template v-if="direction=='out'">
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-select
              v-model="mux.protocol"
              hide-details
              :items="[ 'smux', 'yamux', 'h2mux']"
              :label="$t('protocol')"
              clearable
              @click:clear="delete mux?.protocol"
            />
          </v-col>
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-text-field
              v-model.number="max_connections"
              :label="$t('mux.maxConn')"
              hide-details
              type="number"
              min="0"
            />
          </v-col>
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-text-field
              v-model.number="min_streams"
              :label="$t('mux.minStr')"
              hide-details
              type="number"
              min="0"
            />
          </v-col>
          <v-col
            cols="12"
            sm="6"
            md="4"
          >
            <v-text-field
              v-model.number="max_streams"
              :label="$t('mux.maxStr')"
              hide-details
              type="number"
              :min="min_streams"
            />
          </v-col>
        </template>
        <v-col
          cols="12"
          sm="6"
          md="4"
        >
          <v-switch
            v-model="padding"
            color="primary"
            :label="$t('mux.padding')"
            hide-details
          />
        </v-col>
        <v-col
          cols="12"
          sm="6"
          md="4"
        >
          <v-switch
            v-model="burtalEnable"
            color="primary"
            :label="$t('mux.enableBrutal')"
            hide-details
          />
        </v-col>
      </template>
    </v-row>
    <v-row v-if="mux?.brutal?.enabled">
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model.number="up_mbps"
          :label="$t('stats.upload')"
          hide-details
          type="number"
          :suffix="$t('stats.Mbps')"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model.number="down_mbps"
          :label="$t('stats.download')"
          hide-details
          type="number"
          :suffix="$t('stats.Mbps')"
          min="0"
        />
      </v-col>
    </v-row>
  </v-card>
</template>

<script lang="ts">
import { PropType } from 'vue'
import { oMultiplex } from '@/types/multiplex'

// The inbound or outbound that owns the multiplex block.
interface MultiplexHolder {
  multiplex?: oMultiplex
}

export default {
  props: {
    // Inbounds, outbounds and the out_json of an inbound all bind here, so the
    // prop asks only for an object and the narrowing happens below.
    data: { type: Object as PropType<object>, required: true },
    direction: { type: String as PropType<'in' | 'out'>, required: true }
  },
  data() {
    return {}
  },
  computed: {
    // Narrow once, since no caller hands over a type the template checker could
    // follow. The computed returns the same object, so edits reach the parent.
    holder(): MultiplexHolder { return <MultiplexHolder>this.$props.data },
    mux(): oMultiplex {
      return <oMultiplex> this.holder.multiplex ?? null
    },
    muxEnable: {
      get(): boolean { return this.mux ? this.mux.enabled : false },
      set(newValue:boolean) { this.holder.multiplex = newValue ? { enabled: newValue } : undefined }
    },
    max_connections: {
      get(): number { return this.mux?.max_connections ? this.mux.max_connections : 0 },
      set(newValue:number) { this.mux.max_connections = newValue > 0 ? newValue : undefined }
    },
    min_streams: {
      get(): number { return this.mux?.min_streams ? this.mux.min_streams : 0 },
      set(newValue:number) { this.mux.min_streams = newValue > 0 ? newValue : undefined }
    },
    max_streams: {
      get(): number { return this.mux?.max_streams ? this.mux.max_streams : 0 },
      set(newValue:number) { this.mux.max_streams = newValue > 0 ? newValue : undefined }
    },
    padding: {
      get(): boolean { return this.mux?.padding ? this.mux.padding : false },
      set(newValue:boolean) { this.mux.padding = newValue ? true : undefined }
    },
    burtalEnable: {
      get(): boolean { return this.mux?.brutal ? this.mux.brutal.enabled : false },
      set(newValue:boolean) { this.mux.brutal = newValue ? { enabled: newValue, up_mbps: 100, down_mbps: 100 } : undefined }
    },
    down_mbps: {
      get() { return this.mux?.brutal && this.mux.brutal.down_mbps ? this.mux.brutal.down_mbps : 0 },
      // An emptied number field arrives as '', which reads back as 0.
      set(newValue:number|string) { 
        if (this.mux.brutal){
          this.mux.brutal.down_mbps = (<string>newValue).length != 0 ? <number>newValue : 0
        }
      }
    },
    up_mbps: {
      get() { return this.mux?.brutal && this.mux.brutal.up_mbps ? this.mux.brutal.up_mbps : 0 },
      // An emptied number field arrives as '', which reads back as 0.
      set(newValue:number|string) {
        if (this.mux.brutal){
          this.mux.brutal.up_mbps = (<string>newValue).length != 0 ? <number>newValue : 0
        }
      }
    },
  }
}
</script>