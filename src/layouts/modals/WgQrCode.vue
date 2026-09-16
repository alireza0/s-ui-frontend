<template>
  <v-dialog
    transition="dialog-bottom-transition"
    width="400"
  >
    <v-card
      id="qrcode-modal"
      class="rounded-lg"
      :loading="loading"
    >
      <v-card-title>
        <v-row>
          <v-col>Wireguard QrCode</v-col>
          <v-spacer />
          <v-col cols="auto">
            <v-icon
              icon="mdi-close-box"
              @click="$emit('close')"
            />
          </v-col>
        </v-row>
      </v-card-title>
      <v-divider />
      <v-row
        v-for="(l, i) in wgLinks"
        :key="i"
      >
        <v-col
          v-if="l.length>0"
          style="text-align: center;"
        >
          <v-chip>{{ $t('types.wg.peer') + ' ' + (i+1) }}</v-chip> <v-icon
            icon="mdi-download"
            @click="download(l,i)"
          /><br>
          <QrcodeVue
            :value="l"
            :size="size"
            :margin="1"
            style="border-radius: .5rem; cursor: copy;"
            @click="copyToClipboard(l)"
          />
        </v-col>
      </v-row>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import QrcodeVue from 'qrcode.vue'
import Clipboard from 'clipboard'
import { i18n } from '@/locales'
import { push } from 'notivue'
import type { PropType } from 'vue'
import { Endpoint, WgPeer } from '@/types/endpoints'

// The panel-side extras kept beside a WireGuard endpoint: the interface public
// key and the key pair of every peer the panel generated.
interface WgKey {
  public_key: string
  private_key: string
}

export default {
  components: { QrcodeVue },
  props: {
    data: { type: Object as PropType<Endpoint>, required: true },
    visible: { type: Boolean, required: true },
  },
  emits: ['close'],
  data() {
    return {
      wgData: <Endpoint>{},
      wgLinks: <string[]>[],
      loading: false,
    }
  },
  computed: {
    size() {
      if (window.innerWidth > 380) return 300
      if (window.innerWidth > 330) return 280
      return 250
    }
  },
  watch: {
    visible(v) {
      if (v) {
        this.load()
      }
    },
  },
  methods: {
    async load() {
      this.wgData = this.$props.data
      this.wgLinks = []
      const address = this.wgData.ext?.server || location.hostname
      this.wgData.peers.forEach((_: WgPeer, index: number) => {
        this.wgLinks.push(this.getWireguardLink(index, address))
      })
    },
    getWireguardLink(peerId: number, address: string) {
      const peerData = this.wgData.peers[peerId]
      const keys = this.wgData.ext?.keys?.find((key: WgKey) => key.public_key == peerData.public_key)
      if (!keys || !this.wgData.ext?.public_key) return ''
      let txt = `[Interface]\n`
      txt += `PrivateKey = ${keys.private_key}\n`
      txt += `Address = ${peerData.allowed_ips.join(',')}\n`
      txt += `DNS = ${this.wgData.ext?.dns?.length>0 ? this.wgData.ext.dns : '1.1.1.1, 9.9.9.9'}\n`
      if (this.wgData.mtu) {
          txt += `MTU = ${this.wgData.mtu}\n`
      }
      txt += `\n# ${this.wgData.tag} - ${peerId}\n`
      txt += `[Peer]\n`
      txt += `PublicKey = ${this.wgData.ext.public_key}\n`
      txt += `AllowedIPs = 0.0.0.0/0, ::/0\n`
      txt += `Endpoint = ${address}:${this.wgData.listen_port}\n`
      if (peerData.pre_shared_key) {
          txt += `\nPresharedKey = ${peerData.pre_shared_key}`
      }
      if (peerData.persistent_keepalive_interval) {
          txt += `\nPersistentKeepalive = ${peerData.persistent_keepalive_interval}\n`
      }
      return txt;
    },
    copyToClipboard(txt:string) {
      const hiddenButton = document.createElement('button')
      hiddenButton.className = 'clipboard-btn'
      document.body.appendChild(hiddenButton)

      const clipboard = new Clipboard('.clipboard-btn', {
        text: () => txt,
        container: document.getElementById('qrcode-modal')?? undefined
      });

      clipboard.on('success', () => {
        clipboard.destroy()
        push.success({
          message: i18n.global.t('success') + ": " + i18n.global.t('copyToClipboard'),
          duration: 5000,
        })
      })

      clipboard.on('error', () => {
        clipboard.destroy()
        push.error({
          message: i18n.global.t('failed') + ": " + i18n.global.t('copyToClipboard'),
          duration: 5000,
        })
      })

      // Perform click on hidden button to trigger copy
      hiddenButton.click()
      document.body.removeChild(hiddenButton)
    },
    download(text: string, i: number) {
      let filename = this.wgData.tag + '_peer_' + (i+1) + '.conf';
      let element = document.createElement('a');
      element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(text));
      element.setAttribute('download', filename);

      element.style.display = 'none';
      document.body.appendChild(element);

      element.click();
      document.body.removeChild(element);     
    }
  }
}
</script>