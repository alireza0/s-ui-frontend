<template>
  <v-card
    rounded="xl"
    elevation="5"
    min-width="min(200px, 100%)"
    class="h-100 d-flex flex-column"
    :class="{ 'node-disabled': disabled && !confirming }"
    :title="title"
    :loading="loading"
  >
    <template
      v-if="$slots.append"
      #append
    >
      <slot name="append" />
    </template>
    <v-card-subtitle
      style="margin-top: -15px;"
      :title="subtitle"
    >
      <v-row>
        <v-col class="text-truncate">
          {{ subtitle }}
        </v-col>
      </v-row>
    </v-card-subtitle>
    <v-card-text class="flex-grow-1">
      <slot />
    </v-card-text>
    <v-divider class="flex-0-0-auto" />
    <v-card-actions class="pa-0">
      <slot name="actions" />
    </v-card-actions>
    <v-overlay
      v-if="confirming"
      :model-value="confirming"
      :persistent="busy"
      contained
      class="node-delete-overlay align-center justify-center"
      @update:model-value="!$event && emit('cancel')"
    >
      <v-card
        rounded="lg"
        class="d-flex flex-column node-delete-dialog"
        :title="$t('actions.del')"
      >
        <v-divider />
        <v-card-text class="node-delete-body overflow-y-auto">
          {{ $t('confirm') }}
          <v-checkbox
            v-if="requireStoppedConfirmation"
            v-model="serverStoppedConfirmed"
            :label="$t('nodeUI.serverAlreadyStopped')"
            :disabled="busy"
            density="compact"
            hide-details
          />
          <v-checkbox
            v-if="allowDnsConfirmation"
            v-model="dnsConfirmed"
            :label="$t('nodeUI.dnsAlreadyRemoved')"
            :disabled="busy"
            density="compact"
            hide-details
          />
          <v-alert
            v-if="error"
            type="error"
            variant="tonal"
            density="compact"
          >
            {{ error }}
          </v-alert>
        </v-card-text>
        <v-card-actions class="flex-0-0-auto flex-wrap">
          <v-btn
            color="error"
            variant="outlined"
            :loading="busy"
            :disabled="busy || requireStoppedConfirmation && !serverStoppedConfirmed"
            @click="emit('confirm')"
          >
            {{ $t('yes') }}
          </v-btn>
          <v-btn
            color="success"
            variant="outlined"
            :disabled="busy"
            @click="emit('cancel')"
          >
            {{ $t('no') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-overlay>
  </v-card>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  subtitle: string
  disabled?: boolean
  loading?: boolean
  confirming?: boolean
  busy?: boolean
  error?: string
  allowDnsConfirmation?: boolean
  requireStoppedConfirmation?: boolean
}>()
const dnsConfirmed = defineModel<boolean>('dnsConfirmed', { default: false })
const serverStoppedConfirmed = defineModel<boolean>('serverStoppedConfirmed', { default: false })
const emit = defineEmits<{confirm: []; cancel: []}>()
</script>

<style scoped>
.node-disabled {
  opacity: 0.6;
}

.node-delete-overlay :deep(.v-overlay__content) {
  display: flex;
  flex-direction: column;
  max-inline-size: calc(100% - 16px);
  max-block-size: calc(100% - 16px);
}

.node-delete-dialog,
.node-delete-body {
  min-block-size: 0;
}

.node-delete-body {
  overflow-wrap: anywhere;
}
</style>
