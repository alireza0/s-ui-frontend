<template>
  <v-card
    subtitle="Cloudflare Origin CA"
    style="background-color: inherit;"
  >
    <v-row>
      <v-col cols="12">
        <v-text-field
          v-model="domains"
          :label="$t('rule.domain') + ' ' + $t('commaSeparated')"
          hide-details
        />
      </v-col>
    </v-row>
    <!-- Either credential works; the API token is the narrower of the two. -->
    <v-row>
      <v-col
        cols="12"
        sm="6"
      >
        <v-text-field
          v-model="data.api_token"
          :label="$t('tls.provider.apiToken')"
          type="password"
          hide-details
          clearable
          @click:clear="delete data.api_token"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
      >
        <v-text-field
          v-model="data.origin_ca_key"
          :label="$t('tls.provider.originCaKey')"
          type="password"
          hide-details
          clearable
          @click:clear="delete data.origin_ca_key"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-select
          v-model="data.request_type"
          :label="$t('tls.provider.requestType')"
          :items="requestTypes"
          hide-details
          clearable
          @click:clear="delete data.request_type"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-select
          v-model="data.requested_validity"
          :label="$t('tls.provider.validity')"
          :items="validities"
          hide-details
          clearable
          @click:clear="delete data.requested_validity"
        />
      </v-col>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-text-field
          v-model="data.data_directory"
          :label="$t('tls.acme.dataDir')"
          hide-details
          clearable
          @click:clear="delete data.data_directory"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-select
          v-model="data.http_client"
          :label="$t('basic.httpClient.title')"
          :items="httpClients"
          :no-data-text="$t('basic.httpClient.none')"
          hide-details
          clearable
          @click:clear="delete data.http_client"
        />
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { httpClientTags } from '@/plugins/httpClient'
import { certProvider, originCaProvider } from '@/types/tls'

// The parent owns the object and this component edits it in place, so it is a
// model rather than a plain prop.
const model = defineModel<certProvider>('data', { required: true })

// The parent holds a union and picks this component with a v-else-if on the
// type, which the template checker cannot follow, so narrow once here. The
// computed returns the same object, so edits still reach the parent.
const data = computed(() => model.value as unknown as originCaProvider)

const requestTypes: { title: string, value: 'origin-rsa' | 'origin-ecc' }[] = [
  { title: 'RSA', value: 'origin-rsa' },
  { title: 'ECC', value: 'origin-ecc' },
]

// The only validities Cloudflare accepts, in days.
const validities: number[] = [7, 30, 90, 365, 730, 1095, 5475]

const httpClients = computed((): string[] => httpClientTags())

const domains = computed({
  get: (): string => data.value.domain ? data.value.domain.join(',') : '',
  set: (v: string) => {
    if (!v.endsWith(',')) {
      data.value.domain = v.length > 0 ? v.split(',') : []
    }
  },
})
</script>
