import { join } from 'node:path'
import { BrowserWindow, app } from 'electron'

const isDev = !app.isPackaged

export async function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 845,
    icon: join('./nvm-logo-color-avatar.png'),
    webPreferences: {
      // Renderer code must use the preload bridge instead of direct Node access.
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, '../preload/index.js'),
      devTools: isDev,
    },
    autoHideMenuBar: true,
  })

  const URL = isDev
    ? process.env.DS_RENDERER_URL
    : `file://${join(app.getAppPath(), 'dist/render/index.html')}`

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
    win.destroy()
  })

  return win
}

export async function restoreOrCreateWindow() {
  let window = BrowserWindow.getAllWindows().find(w => !w.isDestroyed())

  if (window === undefined)
    window = await createWindow()

  if (window.isMinimized())
    window.restore()

  window.focus()
}
