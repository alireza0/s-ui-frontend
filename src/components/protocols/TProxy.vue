<template>
  <v-card subtitle="TProxy">
    <v-row>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <Network :data="inbound" />
      </v-col>
    </v-row>
  </v-card>
</template>

<script lang="ts">
import { PropType } from 'vue'
import Network from '@/components/Network.vue'
import { Inbound } from '@/types/inbounds'

export default {
  components: { Network },
  props: {
    inbound: { type: Object as PropType<Inbound>, required: true }
  },
  data() {
    return {
    }
  }
}
</script>