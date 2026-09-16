<template>
  <v-dialog
    v-model="dialog"
    max-width="620"
  >
    <v-card>
      <v-card-title>{{ label }}</v-card-title>
      <v-divider />
      <v-card-text>
        <v-row>
          <v-col>{{ $t('rule.etaHint') }}</v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-textarea
              v-model="localText"
              :label="label"
              variant="outlined"
              rows="16"
              :counter="$t('count')"
              persistent-counter
              :counter-value="(v: string) => v.split('\n').filter((l: string) => l.trim().length > 0).length"
              spellcheck="false"
            />
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-btn
          color="error"
          variant="plain"
          @click="resetChanges"
        >
          {{ $t('reset') }}
        </v-btn>
        <v-spacer />
        <v-btn
          color="primary"
          variant="outlined"
          @click="closeModal"
        >
          {{ $t('actions.close') }}
        </v-btn>
        <v-btn
          color="primary"
          variant="tonal"
          @click="saveChanges"
        >
          {{ $t('actions.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">

export default {
  props: {
    visible: { type: Boolean, required: true },
    label: { type: String, required: true },
    content: { type: String, required: true }
  },
  emits: ['update', 'close'],
  data() {
    return {
      dialog: false,
      localText: '',
    }
  },
  computed: {
  },
  watch: {
    visible(v) {
      if (v) {
        this.localText = this.content
      }
    },
  },
  methods: {
    saveChanges() {
      const unique = [
        ...new Set(
          this.localText
            .split('\n')
            .map((l: string) => l.trim())
            .filter((l: string) => l.length > 0)
        ),
      ]
      this.$emit('update', unique)
      this.dialog = false
    },
    resetChanges() {
      this.localText = this.content
    },
    closeModal() {
      this.$emit('close')
    },
  },
}
</script>
