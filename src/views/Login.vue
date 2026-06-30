<template>
    <div class="login-wrap">
      <v-card class="login-card pa-2">
        <v-card-title class="text-h5 text-center text-no-wrap" v-text="$t('login.title')"></v-card-title>
        <v-card-text>
          <v-form @submit.prevent="login" ref="form">
            <v-text-field v-model="username" :label="$t('login.username')" :rules="usernameRules" required class="mb-2"></v-text-field>
            <v-text-field v-model="password" :label="$t('login.password')" :rules="passwordRules" type="password" required class="mb-2"></v-text-field>
            <v-btn :loading="loading" type="submit" color="primary" block size="large" class="mt-2" v-text="$t('actions.submit')"></v-btn>
          </v-form>
          <v-row class="mt-4" align="center" justify="center" no-gutters>
            <v-col cols="auto">
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn v-bind="props" variant="text" size="small">
                    <v-icon icon="mdi-translate" start></v-icon>
                    <span class="text-no-wrap">{{ currentLanguageTitle }}</span>
                  </v-btn>
                </template>
                <v-list density="compact" nav>
                  <v-list-item
                    v-for="lang in languages"
                    :key="lang.value"
                    @click="changeLocale(lang.value)"
                    :active="isActiveLocale(lang.value)"
                  >
                    <v-list-item-title>{{ lang.title }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </v-col>
            <v-col cols="auto">
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn v-bind="props" variant="text" size="small">
                    <v-icon :icon="currentThemeIcon" start></v-icon>
                    <span class="text-no-wrap">{{ $t(`theme.${currentThemeValue}`) }}</span>
                  </v-btn>
                </template>
                <v-list density="compact" nav>
                  <v-list-item
                    v-for="th in themes"
                    :key="th.value"
                    @click="changeTheme(th.value)"
                    :prepend-icon="th.icon"
                    :active="isActiveTheme(th.value)"
                  >
                    <v-list-item-title>{{ $t(`theme.${th.value}`) }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </div>
  </template>
  
<script lang="ts" setup>
import { computed, ref } from "vue"
import { useLocale } from 'vuetify'
import { i18n, languages } from '@/locales'
import { useRouter } from 'vue-router'
import HttpUtil from '@/plugins/httputil'
import { useThemeSwitcher } from '@/composables/useThemeSwitcher'


const vuetifyLocale = useLocale()
const { themes, changeTheme, isActiveTheme } = useThemeSwitcher()

const username = ref('')
const usernameRules = [
  (value: string) => {
    if (value?.length > 0) return true
    return i18n.global.t('login.unRules')
  },
]

const password = ref('')
const passwordRules = [
  (value: string) => {
    if (value?.length > 0) return true
    return i18n.global.t('login.pwRules')
  },
]

const loading = ref(false)
const router = useRouter()

const currentLanguageTitle = computed(() =>
  languages.find(l => l.value === i18n.global.locale.value)?.title ?? 'English'
)
const currentThemeValue = computed(() => localStorage.getItem('theme') ?? 'system')
const currentThemeIcon = computed(() =>
  themes.find(t => t.value === currentThemeValue.value)?.icon ?? 'mdi-laptop'
)

const isActiveLocale = (l: string) => i18n.global.locale.value === l

const login = async () => {
  if (username.value == '' || password.value == '') return
  loading.value=true
  const response = await HttpUtil.post('api/login',{user: username.value, pass: password.value})
  if(response.success){
    setTimeout(() => {
      loading.value=false
      router.push('/')
    }, 500)
  } else {
    loading.value=false
  }
}
const changeLocale = (l: string) => {
  const v = (l ?? 'en') as typeof i18n.global.locale.value
  i18n.global.locale.value = v
  vuetifyLocale.current.value = v
  localStorage.setItem('locale', l ?? 'en')
  window.location.reload()
}
</script>

<style scoped>
.login-wrap {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
}
.login-card {
  width: 100%;
  max-width: 460px;
}
</style>
  