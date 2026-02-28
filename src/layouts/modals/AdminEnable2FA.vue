<template>
  <v-dialog transition="dialog-bottom-transition" width="auto">
    <v-card class="rounded-lg">
      <v-card-title>
        {{ $t('admin.enable2FA') + " " + user.username }}
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text>
		<v-row>
          <v-col>{{ $t('admin.rescanQr') }}</v-col>
        </v-row>
		<v-row>
          <v-col>{{ $t('admin.rescanQrHint') }}</v-col>
        </v-row>
		<v-row>
          <v-col class="d-flex justify-center">
            <QrcodeVue :value="newData.secretUrl" :size="size" :margin="1" style="border-radius: 1rem;" />
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-text-field v-model="newData.passcode" :label="$t('admin.passcode')" :rules="passcodeRules" required></v-text-field>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          variant="outlined"
          @click="closeModal"
        >
          {{ $t('actions.close') }}
        </v-btn>
        <v-btn
		  variant="tonal"
          @click="enable2FA"
        >
          {{ $t('actions.enable') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import QrcodeVue from 'qrcode.vue'
import HttpUtils from '@/plugins/httputil'
import { i18n } from '@/locales'

export default {
  props: ['visible', 'user'],
  data() {
    return {
      newData: {
		secretUrl: "",
		passcode: "",
		loading: false
      },
      passcodeRules: [
        (value: string) => {
          if (value?.length == 6) return true
          return i18n.global.t('login.passcodeRules')
        },
      ]
    }
  },
  methods: {
	async load() {
      this.newData.loading = true
      const response = await HttpUtils.get('api/prepare2fa')   
      this.newData.loading = false
	  if (response.success) {
		this.newData.secretUrl = response.obj
	  }
    },
    resetData() {
	  this.newData.secretUrl = ""
	  this.newData.passcode = ""
    },
    closeModal() {
      this.resetData() // reset
      this.$emit('close')
    },
    enable2FA() {
      this.$emit('save', this.newData)
    },
  },
  computed: {
    size() {
      if (window.innerWidth > 380) return 300
      if (window.innerWidth > 330) return 280
      return 250
    },
  },
  watch: {
    visible(newValue) {
      if (newValue) {
        this.resetData()
		this.load()
      }
    },
  },
  components: { QrcodeVue }
}

</script>