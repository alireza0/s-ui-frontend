<template>
  <v-select
    v-model="Network"
    hide-details
    :label="$t('network')"
    :items="networks"
  />
</template>

<script lang="ts">
import { PropType } from 'vue'

// The network field of the object this select edits.
interface NetworkData {
  network?: string
}

export default {
  props: {
    // Inbounds, outbounds and the out_json of an inbound all bind here, so the
    // prop asks only for an object and the narrowing happens below.
    data: { type: Object as PropType<object>, required: true }
  },
  data() {
    return {
      networks: [
        { title: "TCP/UDP", value: '' },
        { title: "TCP", value: 'tcp' },
        { title: "UDP", value: 'udp' },
      ],
    }
  },
  computed: {
    // Narrow once, since no caller hands over a type the template checker could
    // follow. The computed returns the same object, so edits reach the parent.
    target(): NetworkData { return <NetworkData>this.$props.data },
    Network: {
      get():string { return this.target.network?? '' },
      set(v:string) { this.target.network = v != '' ? v : undefined }
    }
  }
}
</script>