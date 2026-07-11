import type { DesktopApi } from '@common/desktop-api'

// Resolve the preload bridge lazily so API modules remain importable in Node tests.
export const desktopApi = new Proxy({} as DesktopApi, {
  get: (_target, key: keyof DesktopApi) => window.nvmGui[key],
})
