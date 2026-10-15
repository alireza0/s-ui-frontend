<template>
  <v-col cols="auto">
    <v-switch
      v-model="enabled"
      color="primary"
      :label="$t('urlTest.custom')"
      hide-details
      density="compact"
    />
  </v-col>
  <v-col
    v-if="enabled"
    cols="12"
    sm="6"
    md="4"
  >
    <v-text-field
      v-model.trim="url"
      :label="$t('urlTest.url')"
      placeholder="https://www.gstatic.com/generate_204"
      :error-messages="url != '' && !valid ? $t('urlTest.invalid') : undefined"
      density="compact"
      hide-details="auto"
    />
  </v-col>
</template>

<script setup lang="ts">
import { useUrlTestTarget } from '@/composables/useUrlTestTarget'

const { enabled, url, valid } = useUrlTestTarget()
</script>
