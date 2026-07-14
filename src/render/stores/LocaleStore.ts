import { defineStore } from 'pinia'
import { ref } from 'vue'

export type AppLocale = 'zh-CN' | 'en-US'

export const appLocaleOptions = ['zh-CN', 'en-US'] as const

/** 将浏览器或历史持久化值收敛到应用支持的语言。 */
function normalizeLocale(value?: string): AppLocale {
  if (!value)
    return 'en-US'

  return value.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US'
}

/** 首次启动跟随系统语言；服务端或测试环境默认英文。 */
function resolveInitialLocale(): AppLocale {
  if (typeof navigator === 'undefined')
    return 'en-US'

  const browserLocales = [navigator.language, ...navigator.languages]
    .filter(Boolean)

  return normalizeLocale(browserLocales[0])
}

/** 持久化用户手动选择的界面语言。 */
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
