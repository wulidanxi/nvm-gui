import { defineStore } from 'pinia'
import { ref } from 'vue'

export const themeAccentOptions = [
  {
    key: 'node-green',
    label: 'Node Green',
    primary: '#2f9e44',
    hover: '#37b24d',
    pressed: '#2b8a3e',
    suppl: '#51cf66',
    lightSoft: 'rgba(47, 158, 68, 0.1)',
    lightStrong: 'rgba(47, 158, 68, 0.18)',
    darkSoft: 'rgba(81, 207, 102, 0.14)',
    darkStrong: 'rgba(81, 207, 102, 0.24)',
  },
  {
    key: 'sky-blue',
    label: 'Sky Blue',
    primary: '#228be6',
    hover: '#339af0',
    pressed: '#1c7ed6',
    suppl: '#74c0fc',
    lightSoft: 'rgba(34, 139, 230, 0.1)',
    lightStrong: 'rgba(34, 139, 230, 0.2)',
    darkSoft: 'rgba(116, 192, 252, 0.15)',
    darkStrong: 'rgba(116, 192, 252, 0.26)',
  },
  {
    key: 'violet',
    label: 'Violet',
    primary: '#7048e8',
    hover: '#7950f2',
    pressed: '#6741d9',
    suppl: '#9775fa',
    lightSoft: 'rgba(112, 72, 232, 0.1)',
    lightStrong: 'rgba(112, 72, 232, 0.2)',
    darkSoft: 'rgba(151, 117, 250, 0.16)',
    darkStrong: 'rgba(151, 117, 250, 0.28)',
  },
  {
    key: 'amber',
    label: 'Amber',
    primary: '#f08c00',
    hover: '#f59f00',
    pressed: '#e67700',
    suppl: '#ffd43b',
    lightSoft: 'rgba(240, 140, 0, 0.12)',
    lightStrong: 'rgba(240, 140, 0, 0.22)',
    darkSoft: 'rgba(255, 212, 59, 0.16)',
    darkStrong: 'rgba(255, 212, 59, 0.3)',
  },
  {
    key: 'rose',
    label: 'Rose',
    primary: '#e64980',
    hover: '#f06595',
    pressed: '#d6336c',
    suppl: '#faa2c1',
    lightSoft: 'rgba(230, 73, 128, 0.1)',
    lightStrong: 'rgba(230, 73, 128, 0.2)',
    darkSoft: 'rgba(250, 162, 193, 0.15)',
    darkStrong: 'rgba(250, 162, 193, 0.27)',
  },
] as const

export type ThemeMode = 'light' | 'dark'
export type ThemeAccentKey = typeof themeAccentOptions[number]['key']

export function getThemeAccent(value?: string) {
  return themeAccentOptions.find(item => item.key === value) || themeAccentOptions[0]
}

function normalizeThemeMode(value: string): ThemeMode {
  return value === 'dark' ? 'dark' : 'light'
}

function normalizeAccent(value: string): ThemeAccentKey {
  return getThemeAccent(value).key
}

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<ThemeMode>('light')
  const accent = ref<ThemeAccentKey>('node-green')

  function setThemeMode(value: string) {
    theme.value = normalizeThemeMode(value)
  }

  function setAccent(value: string) {
    accent.value = normalizeAccent(value)
  }

  function toggleTheme(value: string) {
    setThemeMode(value)
  }

  return {
    theme,
    accent,
    setThemeMode,
    setAccent,
    toggleTheme,
  }
}, {
  persist: true,
})
