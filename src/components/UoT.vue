<template>
  <v-select
    v-model="udp_over_tcp"
    hide-details
    label="UDP over TCP"
    :items="versions"
  />
</template>

<script lang="ts">
import { PropType } from 'vue'

// sing-box also accepts a bare boolean here, but the panel only ever writes the
// versioned object form.
interface UotData {
  udp_over_tcp?: { enabled: boolean, version: number }
}

export default {
  props: {
    // Outbounds and the out_json of an inbound both bind here, so the prop asks
    // only for an object and the narrowing happens below.
    data: { type: Object as PropType<object>, required: true }
  },
  data() {
    return {
      versions: [
        { title: this.$t('disable'), value: 0 },
        { title: "1", value: 1 },
        { title: "2", value: 2 },
      ],
    }
  },
  computed: {
    // Narrow once, since no caller hands over a type the template checker could
    // follow. The computed returns the same object, so edits reach the parent.
    target(): UotData { return <UotData>this.$props.data },
    udp_over_tcp: {
      get():number { return this.target.udp_over_tcp?.version?? 0 },
      set(v:number) { this.target.udp_over_tcp = v > 0 ? { enabled: true, version: v } : undefined }
    }
  }
}
</script>