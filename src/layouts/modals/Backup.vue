<template>
  <v-dialog
    transition="dialog-bottom-transition"
    width="90%"
    max-width="500"
  >
    <v-card class="rounded-lg">
      <v-card-title>
        <v-row>
          <v-col>{{ $t('main.backup.title') }}</v-col>
          <v-spacer />
          <v-col cols="auto">
            <v-icon
              icon="mdi-close"
              @click="model.visible = false"
            />
          </v-col>
        </v-row>
      </v-card-title>
      <v-divider />
      <v-card-text>
        <v-row>
          <v-col cols="auto">
            <v-checkbox
              v-model="exclude"
              :label="$t('main.backup.exclStats')"
              value="stats"
              hide-details
            />
          </v-col>
          <v-col cols="auto">
            <v-checkbox
              v-model="exclude"
              :label="$t('main.backup.exclChanges')"
              value="changes"
              hide-details
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col
            cols="auto"
            align-self="center"
          >
            <v-btn
              color="primary"
              hide-details
              @click="backup()"
            >
              {{ $t('main.backup.backup') }}
            </v-btn>
          </v-col>
          <v-spacer />
          <v-col
            cols="auto"
            align-self="center"
          >
            <v-btn
              color="primary"
              hide-details
              @click="restore()"
            >
              {{ $t('main.backup.restore') }}
            </v-btn>
          </v-col>
        </v-row>
        <v-row>
          <v-divider />
          <v-col
            cols="auto"
            align-self="center"
          >
            <v-btn
              color="primary"
              hide-details
              @click="config()"
            >
              {{ $t('main.backup.sbConfig') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import HttpUtils from '@/plugins/httputil'

// The dialog handle the parent owns and this modal closes.
interface ModalControl {
  visible: boolean
}

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<ModalControl>('control', { required: true })

const props = defineProps<{
  visible: boolean
}>()

const exclude = ref<string[]>(["stats", "changes"])

watch(() => props.visible, (v) => {
  if (v) {
    exclude.value = ["stats", "changes"]
  }
})

function backup() {
  const excludeOption = exclude.value.length>0 ? '?exclude=' +exclude.value.join(',') : ''
  window.location.href = 'api/getdb' + excludeOption
}

function config() {
  window.location.href = 'api/singbox-config'
}

function restore() {
  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.accept = '.db'

  fileInput.addEventListener('change', async (event: Event) => {
    const inputElement = event.target as HTMLInputElement
    const dbFile = inputElement.files ? inputElement.files[0] : null

    if (dbFile) {
      const formData = new FormData()
      formData.append('db', dbFile)

      model.value.visible = false

      const uploadMsg = await HttpUtils.post('api/importdb', formData, {
          headers: {
              'Content-Type': 'multipart/form-data',
          },
      })

      if (uploadMsg.success) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        location.reload()
      }
    }
  })

  fileInput.click()
}
</script>