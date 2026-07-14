import type { DesktopApi } from '@common/desktop-api'

// 延迟读取 preload 桥接，使 API 模块在没有 window 的 Node.js 测试中仍可导入。
export const desktopApi = new Proxy({} as DesktopApi, {
  get: (_target, key: keyof DesktopApi) => window.nvmGui[key],
})
