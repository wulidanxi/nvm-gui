<script setup lang="ts">
import { computed } from 'vue'
import {
  darkTheme,
  dateEnUS,
  dateZhCN,
  enUS,
  NConfigProvider,
  NDialogProvider,
  NMessageProvider,
  zhCN,
} from 'naive-ui'
import type { GlobalThemeOverrides } from 'naive-ui'
import { getThemeAccent, useThemeStore } from '@render/stores/ThemeStore'
import { useLocaleStore } from '@render/stores/LocaleStore'
import useMessageComponents from '@render/components/useMessageComponents.vue'

const store = useThemeStore()
const localeStore = useLocaleStore()

const theme = computed(() => store.theme === 'dark' ? darkTheme : null)

const naiveLocale = computed(() => localeStore.locale === 'zh-CN' ? zhCN : enUS)

const naiveDateLocale = computed(() => localeStore.locale === 'zh-CN' ? dateZhCN : dateEnUS)

const themeClass = computed(() => {
  return store.theme === 'dark' ? 'app-theme-dark' : 'app-theme-light'
})

const accent = computed(() => getThemeAccent(store.accent))

const accentClass = computed(() => `app-accent-${accent.value.key}`)

// 将强调色映射为应用自有 CSS 变量，供非 Naive UI 区域复用。
const themeStyle = computed<Record<string, string>>(() => {
  const current = accent.value
  const isDark = store.theme === 'dark'

  return {
    '--app-accent': current.primary,
    '--app-accent-hover': current.hover,
    '--app-accent-pressed': current.pressed,
    '--app-accent-suppl': current.suppl,
    '--app-accent-soft': isDark ? current.darkSoft : current.lightSoft,
    '--app-accent-strong': isDark ? current.darkStrong : current.lightStrong,
  }
})

// 同步覆盖 Naive UI 设计令牌，保证亮暗主题与自有样式使用同一套颜色。
const themeOverrides = computed<GlobalThemeOverrides>(() => {
  const isDark = store.theme === 'dark'
  const current = accent.value

  return {
    common: {
      primaryColor: current.primary,
      primaryColorHover: current.hover,
      primaryColorPressed: current.pressed,
      primaryColorSuppl: current.suppl,
      borderRadius: '8px',
      borderRadiusSmall: '6px',
      bodyColor: isDark ? '#111513' : '#f5f7f4',
      cardColor: isDark ? '#181d1a' : '#ffffff',
      modalColor: isDark ? '#181d1a' : '#ffffff',
      popoverColor: isDark ? '#181d1a' : '#ffffff',
      tableColor: isDark ? '#181d1a' : '#ffffff',
      tableHeaderColor: isDark ? '#202720' : '#f0f5ef',
      textColorBase: isDark ? '#f1f5f0' : '#1f2a24',
      textColor2: isDark ? '#c7d0c7' : '#47554c',
      textColor3: isDark ? '#8f9b90' : '#6b766d',
      borderColor: isDark ? '#2a332c' : '#dde7dc',
    },
    Button: {
      borderRadiusMedium: '8px',
      borderRadiusSmall: '7px',
      fontWeightStrong: '600',
    },
    Card: {
      borderRadius: '8px',
      paddingMedium: '18px',
      titleFontWeight: '700',
    },
    DataTable: {
      borderRadius: '8px',
      thFontWeight: '700',
    },
    Layout: {
      color: isDark ? '#111513' : '#f5f7f4',
      siderColor: isDark ? '#151a17' : '#fbfdfb',
      headerColor: isDark ? '#151a17' : '#fbfdfb',
    },
    Menu: {
      borderRadius: '8px',
      itemTextColorActive: current.primary,
      itemIconColorActive: current.primary,
    },
    Tag: {
      borderRadius: '999px',
    },
  }
})
</script>

<template>
  <NConfigProvider
    :theme="theme"
    :theme-overrides="themeOverrides"
    :locale="naiveLocale"
    :date-locale="naiveDateLocale"
  >
    <div class="app-theme" :class="[themeClass, accentClass]" :style="themeStyle">
      <NMessageProvider>
        <NDialogProvider>
          <RouterView />
          <useMessageComponents />
        </NDialogProvider>
      </NMessageProvider>
    </div>
  </NConfigProvider>
</template>
