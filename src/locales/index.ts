import { createI18n } from 'vue-i18n'
import en from './en'
import fa from './fa'
import vi from './vi'
import zhcn from './zhcn'
import zhtw from './zhtw'
import ru from './ru'

export const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem("locale") ?? 'en',
  fallbackLocale: 'en',
  messages: {
    en: en,
    fa: fa,
    vi: vi,
    zhHans: zhcn,
    zhHant: zhtw,
    ru: ru
  },
})

// Screen readers pick their voice from the page language, and index.html can
// only say "en". A locale change reloads the page, so setting it once is enough.
document.documentElement.lang = ({ zhHans: 'zh-Hans', zhHant: 'zh-Hant' } as Record<string, string>)[i18n.global.locale.value] ?? i18n.global.locale.value

export const locale = (() => {
  const l = i18n.global.locale.value
  switch (l) {
    case "zhHans":
      return "zh-cn"
    case "zhHant":
      return "zh-tw"
    default:
      return l
  }
})()

export const languages = [
  { title: 'English', value: 'en' },
  { title: 'فارسی', value: 'fa' },
  { title: 'Tiếng Việt', value: 'vi' },
  { title: '简体中文', value: 'zhHans' },
  { title: '繁體中文', value: 'zhHant' },
  { title: 'Русский', value: 'ru' },
]
