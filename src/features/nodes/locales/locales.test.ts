import { describe, expect, it } from 'vitest'
import { createI18n } from 'vue-i18n'
import { i18n, languages } from '@/locales'
import en from '@/locales/en'
import fa from '@/locales/fa'
import vi from '@/locales/vi'
import zhcn from '@/locales/zhcn'
import zhtw from '@/locales/zhtw'
import ru from '@/locales/ru'
import { nodeMessages } from './index'

const baseMessages = { en, fa, vi, zhHans: zhcn, zhHant: zhtw, ru }

function flatten(value: object, prefix = ''): Record<string, string> {
  return Object.fromEntries(Object.entries(value).flatMap(([key, item]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return typeof item === 'string' ? [[path, item]] : Object.entries(flatten(item, path))
  }))
}

const locales = Object.keys(nodeMessages) as (keyof typeof nodeMessages)[]
const referenceMessages = flatten(nodeMessages.en)
const expectedKeys = Object.keys(referenceMessages).sort()
const params = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort()

it('registers node messages for every language offered by the panel', () => {
  expect(locales.sort()).toEqual(languages.map(language => language.value).sort())
  for (const locale of locales) {
    for (const key of expectedKeys) expect(i18n.global.te(key, locale), `${locale}: ${key}`).toBe(true)
  }
})

describe.each(locales)('%s node translations', locale => {
  const messages = flatten(nodeMessages[locale])

  it('has the complete schema and preserves named parameters', () => {
    expect(Object.keys(messages).sort()).toEqual(expectedKeys)
    for (const [key, value] of Object.entries(messages)) {
      expect(value.trim(), key).not.toBe('')
      expect(value, key).not.toContain('\uFFFD')
      expect(params(value), key).toEqual(params(referenceMessages[key]))
    }
  })

  it('resolves every message and linked term without an English fallback', () => {
    const failures: string[] = []
    const translator = createI18n({
      legacy: false,
      locale,
      fallbackLocale: false,
      messages: { [locale]: { ...baseMessages[locale], ...nodeMessages[locale] } },
      missing: (_locale, key) => { failures.push(key) },
    })
    for (const key of expectedKeys) {
      const text = translator.global.t(key, { field: 'SNI', name: 'Example' })
      expect(text, key).not.toBe(key)
      expect(text, key).not.toContain('@:')
      expect(text, key).not.toMatch(/\{(?:field|name)\}/)
    }
    expect(failures).toEqual([])
  })

  it('keeps node messages separate and reuses the original panel terminology', () => {
    expect(Object.keys(nodeMessages[locale]).sort()).toEqual(['nodeOnboarding', 'nodeUI', 'nodes'])
    expect(Object.keys(nodeMessages[locale]).filter(key => key in baseMessages[locale])).toEqual([])
    expect(messages['nodeOnboarding.keyPEM']).toBe('@:tls.privKey')
    expect(messages['nodeUI.tlsSettings']).toBe('@:pages.tls')
    expect(messages['nodeUI.obfuscation']).toBe('@:types.snell.obfsMode')
    expect(messages['nodeUI.apiToken']).toBe('@:tls.provider.apiToken')
  })
})
