import { computed } from 'vue'
import type { AppLocale } from '@render/stores/LocaleStore'
import { useLocaleStore } from '@render/stores/LocaleStore'
import { enUSMessages } from './locales/en-US'
import { zhCNMessages } from './locales/zh-CN'
import type { Messages } from './locales/zh-CN'

interface MessageTree {
  [key: string]: string | MessageTree
}
export type I18nParams = Record<string, string | number>
export type I18nKey = Leaves<Messages>

type Leaves<T, Prefix extends string = ''> = {
  [K in keyof T]: T[K] extends string
    ? `${Prefix}${K & string}`
    : T[K] extends Record<string, unknown>
      ? Leaves<T[K], `${Prefix}${K & string}.`>
      : never
}[keyof T]

const messages: Record<AppLocale, Messages> = {
  'zh-CN': zhCNMessages,
  'en-US': enUSMessages,
}

export const localeOptions: Array<{ label: string, value: AppLocale }> = [
  { label: zhCNMessages.locale.chinese, value: 'zh-CN' },
  { label: enUSMessages.locale.english, value: 'en-US' },
]

export function useI18n() {
  const localeStore = useLocaleStore()
  const locale = computed(() => localeStore.locale)

  function t(key: I18nKey, params?: I18nParams) {
    return translate(localeStore.locale, key, params)
  }

  return {
    locale,
    setLocale: localeStore.setLocale,
    t,
  }
}

function translate(locale: AppLocale, key: I18nKey, params?: I18nParams) {
  const template = getMessage(messages[locale], key) || getMessage(zhCNMessages, key) || key

  if (!params)
    return template

  return template.replace(/\{(\w+)\}/gu, (_, name: string) => {
    return params[name] === undefined ? `{${name}}` : String(params[name])
  })
}

function getMessage(source: MessageTree, key: string): string | undefined {
  const value = key.split('.').reduce<string | MessageTree | undefined>((current, segment) => {
    if (!current || typeof current === 'string')
      return undefined

    return current[segment]
  }, source)

  return typeof value === 'string' ? value : undefined
}
