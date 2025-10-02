<template>
  <v-dialog transition="dialog-bottom-transition" width="400">
    <v-card class="rounded-lg" id="qrcode-modal" :loading="loading">
      <v-card-title>
        <v-row>
          <v-col>QrCode</v-col>
          <v-spacer></v-spacer>
          <v-col cols="auto"
            ><v-icon icon="mdi-close-box" @click="$emit('close')"
          /></v-col>
        </v-row>
      </v-card-title>
      <v-divider></v-divider>
      <v-skeleton-loader
        class="mx-auto border"
        width="80%"
        type="text, image, divider, text, image"
        v-if="loading"
      ></v-skeleton-loader>
      <v-card-text style="overflow-y: auto; padding: 0" :hidden="loading">
        <v-tabs v-model="tab" density="compact" fixed-tabs align-tabs="center">
          <v-tab value="sub">{{ $t("setting.sub") }}</v-tab>
          <v-tab value="link">{{ $t("client.links") }}</v-tab>
        </v-tabs>
        <v-window v-model="tab" style="margin-top: 10px; padding: 0 16px">
          <v-window-item value="sub">
            <v-row>
              <v-col style="text-align: center; padding: 16px 8px 8px 8px">
                <v-chip-group
                  v-model="selectedSubType"
                  mandatory
                  selected-class="text-primary"
                  style="justify-content: center"
                >
                  <v-chip value="sub" variant="outlined" size="small">
                    {{ $t("setting.sub") }}
                  </v-chip>
                  <v-chip value="json" variant="outlined" size="small">
                    {{ $t("setting.jsonSub") }}
                  </v-chip>
                  <v-chip value="clash" variant="outlined" size="small">
                    {{ $t("setting.clashSub") }}
                  </v-chip>
                  <v-chip value="singbox" variant="outlined" size="small">
                    SING-BOX
                  </v-chip>
                </v-chip-group>
              </v-col>
            </v-row>
            <v-row>
              <v-col style="text-align: center; padding: 12px 8px 20px 8px">
                <QrcodeVue
                  v-if="selectedSubType === 'sub'"
                  :value="clientSub"
                  :size="size"
                  @click="copyToClipboard(clientSub)"
                  :margin="1"
                  style="border-radius: 1rem; cursor: copy"
                />
                <QrcodeVue
                  v-else-if="selectedSubType === 'json'"
                  :value="clientSub + '?format=json'"
                  :size="size"
                  @click="copyToClipboard(clientSub + '?format=json')"
                  :margin="1"
                  style="border-radius: 1rem; cursor: copy"
                />
                <QrcodeVue
                  v-else-if="selectedSubType === 'clash'"
                  :value="clientSub + '?format=clash'"
                  :size="size"
                  @click="copyToClipboard(clientSub + '?format=clash')"
                  :margin="1"
                  style="border-radius: 1rem; cursor: copy"
                />
                <QrcodeVue
                  v-else-if="selectedSubType === 'singbox'"
                  :value="singbox"
                  :size="size"
                  :margin="1"
                  style="border-radius: 0.8rem; cursor: not-allowed"
                />
                <div style="margin-top: 10px; color: #666; font-size: 0.85em">
                  <span v-if="selectedSubType !== 'singbox'">
                    {{ $t("clickToCopy") ?? "点击二维码复制" }}
                  </span>
                  <span v-else> {{ $t("scanOnly") }} </span>
                </div>
              </v-col>
            </v-row>
          </v-window-item>
          <v-window-item value="link">
            <v-row v-if="clientLinks.length > 0">
              <v-col style="text-align: center; padding: 16px 8px 8px 8px">
                <v-chip-group
                  v-model="selectedLinkIndex"
                  mandatory
                  selected-class="text-primary"
                  style="justify-content: center"
                >
                  <v-chip
                    v-for="(l, index) in clientLinks"
                    :key="index"
                    :value="index"
                    variant="outlined"
                    size="small"
                  >
                    {{ l.remark ?? $t("client." + l.type) }}
                  </v-chip>
                </v-chip-group>
              </v-col>
            </v-row>
            <v-row v-if="clientLinks.length > 0">
              <v-col style="text-align: center; padding: 12px 8px 20px 8px">
                <QrcodeVue
                  :value="clientLinks[selectedLinkIndex].uri"
                  :size="size"
                  @click="copyToClipboard(clientLinks[selectedLinkIndex].uri)"
                  :margin="1"
                  style="border-radius: 0.5rem; cursor: copy"
                />
                <div style="margin-top: 10px; color: #666; font-size: 0.85em">
                  {{ $t("clickToCopy") ?? "点击二维码复制" }}
                </div>
              </v-col>
            </v-row>
            <v-row v-else>
              <v-col style="text-align: center; padding: 40px 16px">
                <div style="color: #999">{{ $t("noLinks") ?? "暂无链接" }}</div>
              </v-col>
            </v-row>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import QrcodeVue from "qrcode.vue";
import Data from "@/store/modules/data";
import Clipboard from "clipboard";
import { i18n } from "@/locales";
import { push } from "notivue";

export default {
  props: ["id", "visible"],
  data() {
    return {
      tab: "sub",
      client: <any>{},
      loading: false,
      selectedSubType: "sub",
      selectedLinkIndex: 0,
    };
  },
  methods: {
    async load() {
      this.loading = true;
      const newData = await Data().loadClients(this.$props.id);
      this.client = newData;
      this.loading = false;
    },
    copyToClipboard(txt: string) {
      const hiddenButton = document.createElement("button");
      hiddenButton.className = "clipboard-btn";
      document.body.appendChild(hiddenButton);

      const clipboard = new Clipboard(".clipboard-btn", {
        text: () => txt,
        container: document.getElementById("qrcode-modal") ?? undefined,
      });

      clipboard.on("success", () => {
        clipboard.destroy();
        push.success({
          message:
            i18n.global.t("success") + ": " + i18n.global.t("copyToClipboard"),
          duration: 5000,
        });
      });

      clipboard.on("error", () => {
        clipboard.destroy();
        push.error({
          message:
            i18n.global.t("failed") + ": " + i18n.global.t("copyToClipboard"),
          duration: 5000,
        });
      });

      // Perform click on hidden button to trigger copy
      hiddenButton.click();
      document.body.removeChild(hiddenButton);
    },
  },
  computed: {
    clientSub() {
      return Data().subURI + this.client.name;
    },
    singbox() {
      const url = this.clientSub + "?format=json";

      return (
        "sing-box://import-remote-profile?url=" +
        encodeURIComponent(url) +
        "#" +
        this.client.name
      );
    },
    clientLinks() {
      return this.client.links ?? [];
    },
    size() {
      if (window.innerWidth > 380) return 300;
      if (window.innerWidth > 330) return 280;
      return 250;
    },
  },
  watch: {
    visible(v) {
      if (v) {
        this.tab = "sub";
        this.selectedSubType = "sub";
        this.selectedLinkIndex = 0;
        this.load();
      }
    },
  },
  components: { QrcodeVue },
};
</script>
