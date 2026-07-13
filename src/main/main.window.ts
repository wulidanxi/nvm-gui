import { join } from 'node:path'
import { BrowserWindow, app } from 'electron'
import { setIpcMainWindow, setTrustedDevOrigin } from './ipc-security'

const isDev = !app.isPackaged

export async function createWindow() {
  const win = new BrowserWindow({
    width: 1800,
    height: 1080,
    icon: join('./nvm-logo-color-avatar.png'),
    webPreferences: {
      // Renderer code must use the preload bridge instead of direct Node access.
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
  // Electron exposes this event at runtime but the bundled type declarations lag it.
  win.webContents.on('will-frame-navigate' as any, blockUntrustedNavigation)
  win.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false))
  injectCspHeaders(win)

  const URL = isDev
    ? process.env.DS_RENDERER_URL
    : 'app://nvm-gui/index.html'

  if (URL) {
    win.loadURL(URL)
  }

  // External links are opened only through the validated shell IPC.
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

export async function restoreOrCreateWindow() {
  let window = BrowserWindow.getAllWindows().find(w => !w.isDestroyed())

  if (window === undefined)
    window = await createWindow()

  if (window.isMinimized())
    window.restore()

  window.focus()
}
