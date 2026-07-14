import { join } from 'node:path'
import { BrowserWindow, app } from 'electron'
import { setIpcMainWindow, setTrustedDevOrigin } from './ipc-security'

const isDev = !app.isPackaged

/** 创建启用沙箱、上下文隔离和导航限制的唯一主窗口。 */
export async function createWindow() {
  const win = new BrowserWindow({
    width: 1800,
    height: 1080,
    icon: join('./nvm-logo-color-avatar.png'),
    webPreferences: {
      // 渲染进程只能使用 preload 桥接，不能直接访问 Node.js。
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: join(__dirname, '../preload/index.js'),
      devTools: isDev,
    },
    autoHideMenuBar: true,
  })

  setIpcMainWindow(win)
  setTrustedDevOrigin(isDev ? process.env.DS_RENDERER_URL : undefined)
  const blockUntrustedNavigation = (event: Electron.Event, url: string) => {
    if (!isTrustedNavigation(url))
      event.preventDefault()
  }
  win.webContents.on('will-navigate', blockUntrustedNavigation)
  // Electron 运行时提供该事件，但当前捆绑的类型声明尚未同步。
  win.webContents.on('will-frame-navigate' as any, blockUntrustedNavigation)
  win.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false))
  injectCspHeaders(win)

  const URL = isDev
    ? process.env.DS_RENDERER_URL
    : 'app://nvm-gui/index.html'

  if (URL) {
    win.loadURL(URL)
  }

  // 外部链接只能通过经过白名单校验的 shell IPC 打开。
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  if (isDev)
    win.webContents.openDevTools()
  else
    win.removeMenu()

  win.on('closed', () => {
    setIpcMainWindow(undefined)
    win.destroy()
  })

  return win
}

/** 判断窗口导航是否仍属于当前开发源或生产私有协议。 */
function isTrustedNavigation(value: string): boolean {
  try {
    const url = new URL(value)
    if (isDev && process.env.DS_RENDERER_URL) {
      const dev = new URL(process.env.DS_RENDERER_URL)
      return url.protocol === dev.protocol && url.hostname === dev.hostname && url.port === dev.port
    }
    return url.protocol === 'app:' && url.host === 'nvm-gui'
  }
  catch { return false }
}

/** 为渲染响应注入严格 CSP，关闭对象、框架和非白名单网络来源。 */
function injectCspHeaders(win: BrowserWindow): void {
  const csp = [
    "default-src 'none'", "script-src 'self'", "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:", "font-src 'self' data:", `connect-src 'self'${isDev ? ' ws:' : ''}`,
    "object-src 'none'", "base-uri 'none'", "frame-src 'none'",
  ].join('; ')
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({ responseHeaders: { ...details.responseHeaders, 'content-security-policy': [csp] } })
  })
}

/** 激活已有窗口，或在应用重新激活时创建新窗口。 */
export async function restoreOrCreateWindow() {
  let window = BrowserWindow.getAllWindows().find(w => !w.isDestroyed())

  if (window === undefined)
    window = await createWindow()

  if (window.isMinimized())
    window.restore()

  window.focus()
}
