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
          <v-col>QrCode</v-col>
          <v-spacer />
          <v-col cols="auto">
            <v-icon
              :aria-label="$t('actions.close')"
              icon="mdi-close-box"
              @click="$emit('close')"
            />
          </v-col>
        </v-row>
      </v-card-title>
      <v-divider />
      <v-skeleton-loader
        v-if="loading"
        class="mx-auto border"
        width="80%"
        type="text, image, divider, text, image"
      />
      <v-card-text
        style="overflow-y: auto; padding: 0"
        :hidden="loading"
      >
        <v-tabs
          v-model="tab"
          density="compact"
          fixed-tabs
          align-tabs="center"
        >
          <v-tab value="sub">
            {{ $t('setting.sub') }}
          </v-tab>
          <v-tab value="link">
            {{ $t('client.links') }}
          </v-tab>
        </v-tabs>
        <v-window
          v-model="tab"
          style="margin-top: 10px;"
        >
          <v-window-item value="sub">
            <v-row>
              <v-col style="text-align: center;">
                <v-chip>{{ $t('setting.sub') }}</v-chip><br>
                <QrcodeVue
                  :value="clientSub"
                  :size="size"
                  :margin="1"
                  style="border-radius: 1rem; cursor: copy;"
                  @click="copyToClipboard(clientSub)"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col style="text-align: center;">
                <v-chip>{{ $t('setting.jsonSub') }}</v-chip><br>
                <QrcodeVue
                  :value="clientSub + '?format=json'"
                  :size="size"
                  :margin="1"
                  style="border-radius: 1rem; cursor: copy;"
                  @click="copyToClipboard(clientSub + '?format=json')"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col style="text-align: center;">
                <v-chip>{{ $t('setting.clashSub') }}</v-chip><br>
                <QrcodeVue
                  :value="clientSub + '?format=clash'"
                  :size="size"
                  :margin="1"
                  style="border-radius: 1rem; cursor: copy;"
                  @click="copyToClipboard(clientSub + '?format=clash')"
                />
                <div class="d-flex justify-center flex-wrap ga-2">
                  <v-btn
                    variant="text"
                    @click="copyToClipboard(clientSub+'?format=clash')"
                  >
                    {{ $t('nodeUI.copyClash') }}
                  </v-btn><v-btn
                    variant="text"
                    :href="clientSub+'?format=clash'"
                    target="_blank"
                    rel="noopener"
                  >
                    {{ $t('nodeUI.openClash') }}
                  </v-btn>
                </div>
              </v-col>
            </v-row>
            <v-row>
              <v-col style="text-align: center;">
                <v-chip>SING-BOX (scan only)</v-chip><br>
                <QrcodeVue
                  :value="singbox"
                  :size="size"
                  :margin="1"
                  style="border-radius: .8rem; cursor: not-allowed;"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col style="text-align: center;">
                <v-chip>HAPP (scan only)</v-chip><br>
                <QrcodeVue
                  :value="happ"
                  :size="size"
                  :margin="1"
                  style="border-radius: .8rem; cursor: not-allowed;"
                />
              </v-col>
            </v-row>
          </v-window-item>
          <v-window-item value="link">
            <NodeClientLinks
              v-slot="{ links: displayedLinks }"
              :client-id="id"
              :active="visible && tab === 'link' && !!client.nodes?.length"
              :local-links="clientLinks"
            >
              <v-row
                v-for="(l, index) in displayedLinks"
                :key="index"
              >
                <v-col style="text-align: center;">
                  <v-chip>{{ l.remark?? $t('client.' + l.type) }}</v-chip><br>
                  <QrcodeVue
                    :value="l.uri"
                    :size="size"
                    :margin="1"
                    style="border-radius: .5rem; cursor: copy;"
                    @click="copyToClipboard(l.uri)"
                  />
                </v-col>
              </v-row>
            </NodeClientLinks>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import QrcodeVue from 'qrcode.vue'
import NodeClientLinks from '@/features/nodes/components/NodeClientLinks.vue'
import Data from '@/store/modules/data'
import Clipboard from 'clipboard'
import { i18n } from '@/locales'
import { push } from 'notivue'
import { Client } from '@/types/clients'

export default {
  components: { QrcodeVue, NodeClientLinks },
  props: {
    id: { type: Number, required: true },
    visible: { type: Boolean, required: true },
  },
  emits: ['close'],
  data() {
    return {
      tab: "sub",
      client: <Client>{},
      loading: false,
    }
  },
  computed: {
    clientSub() {
      return Data().subURI + this.client.name
    },
    singbox() {
      const url = Data().subURI + this.client.name + "?format=json"
      return "sing-box://import-remote-profile?url=" +  encodeURIComponent(url) + "#" + this.client.name
    },
    // Happ takes the subscription URL as it is, unencoded, after happ://add/.
    happ() {
      return "happ://add/" + this.clientSub + "?format=happ"
    },
    clientLinks() {
      return this.client.links?? []
    },
    size() {
      if (window.innerWidth > 380) return 300
      if (window.innerWidth > 330) return 280
      return 250
    }
  },
  watch: {
    visible(v) {
      if (v) {
        this.tab = "sub"
        this.load()
      }
    },
  },
  methods: {
    async load() {
      this.loading = true
      const newData = await Data().loadClients(this.$props.id)
      this.client = newData
      this.loading = false
    },
    async copyToClipboard(txt:string) {
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(txt)
          push.success({ message: i18n.global.t('success') + ": " + i18n.global.t('copyToClipboard'), duration: 5000 })
          return
        } catch {
          // Older browsers and restricted contexts use the existing fallback.
        }
      }
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
    }
  }
}
</script>
