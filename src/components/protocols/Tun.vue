<template>
  <v-card subtitle="Tun">
    <v-row>
      <v-col cols="12" sm="8">
        <v-text-field v-model="addrs" :label="$t('types.tun.addr') + ' ' + $t('commaSeparated')" placeholder="172.18.0.1/30" hide-details></v-text-field>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" sm="6" md="4">
        <v-text-field v-model="data.interface_name" :label="$t('types.tun.ifName')" placeholder="tun0" hide-details clearable @click:clear="delete data.interface_name"></v-text-field>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-text-field type="number" v-model.number="data.mtu" label="MTU" hide-details></v-text-field>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" sm="6" md="4">
        <v-text-field
          type="number"
          v-model.number="udpTimeout"
          label="UDP timeout"
          min="1"
          :suffix="$t('date.m')"
          hide-details>
        </v-text-field>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-select
          v-model="data.stack"
          label="Stack"
          :items="['system','gvisor','mixed']"
          hide-details
        ></v-select>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-switch v-model="data.endpoint_independent_nat" color="primary" label="Independent NAT" hide-details></v-switch>
      </v-col>
      <!-- 添加auto_route开关，用于控制是否自动添加路由 -->
      <v-col cols="12" sm="6" md="4">
        <v-switch v-model="data.auto_route" color="primary" label="Auto Route" hide-details></v-switch>
      </v-col>
      <!-- 添加auto_redirect开关，仅在auto_route启用时可用 -->
      <v-col cols="12" sm="6" md="4">
        <v-switch v-model="data.auto_redirect" :disabled="!data.auto_route" color="primary" label="Auto Redirect" hide-details></v-switch>
      </v-col>
    </v-row>
  </v-card>
</template>

<script lang="ts">

export default {
  props: ['data'],
  data() {
    return {
      menu: false
    }
  },
  computed: {
    addrs: {
      get() { return this.$props.data.address?.join(',') },
      set(v:string) { this.$props.data.address = v.length > 0 ? v.split(',') : undefined }
    },
    udpTimeout: {
      get() { return this.$props.data.udp_timeout ? parseInt(this.$props.data.udp_timeout.replace('m','')) : 5 },
      set(v:number) { this.$props.data.udp_timeout = v > 0 ? v + 'm' : '5m' }
    }
  },
  // 监听data变化，确保字段有默认值
  watch: {
    data: {
      handler(newData) {
        if (newData) {
          // 如果auto_route字段不存在，初始化为false
          if (typeof newData.auto_route === 'undefined') {
            newData.auto_route = false;
          }
          // 如果auto_redirect字段不存在，初始化为false
          if (typeof newData.auto_redirect === 'undefined') {
            newData.auto_redirect = false;
          }
          // 为address设置默认值
          if (!newData.address || newData.address.length === 0) {
            newData.address = ['172.18.0.1/30'];
          }
          // 为interface_name设置默认值
          if (!newData.interface_name) {
            newData.interface_name = 'tun0';
          }
        }
      },
      immediate: true,
      deep: true
    },
    // 监听auto_route变化，当关闭时自动关闭auto_redirect
    'data.auto_route': {
      handler(newVal) {
        if (!newVal && this.data.auto_redirect) {
          this.data.auto_redirect = false;
        }
      }
    }
  }
}
</script>
