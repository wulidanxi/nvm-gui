import { defineStore } from 'pinia'
import { ref } from 'vue'

export type AppLocale = 'zh-CN' | 'en-US'

export const appLocaleOptions = ['zh-CN', 'en-US'] as const

function normalizeLocale(value?: string): AppLocale {
  if (!value)
    return 'en-US'

  return value.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US'
}

function resolveInitialLocale(): AppLocale {
  if (typeof navigator === 'undefined')
    return 'en-US'

  const browserLocales = [navigator.language, ...navigator.languages]
    .filter(Boolean)

  return normalizeLocale(browserLocales[0])
}

export const useLocaleStore = defineStore('locale', () => {
  const locale = ref<AppLocale>(resolveInitialLocale())

  function setLocale(value: AppLocale) {
    locale.value = value
  }

  return {
    locale,
    setLocale,
  }
}, {
  persist: true,
})
