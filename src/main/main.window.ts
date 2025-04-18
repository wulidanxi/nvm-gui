import { join } from 'node:path'
import { BrowserWindow, app } from 'electron'

const isDev = !app.isPackaged

// 导出一个异步函数createWindow
export async function createWindow() {
  // 创建一个BrowserWindow实例
  const win = new BrowserWindow({
    // 设置窗口宽度
    width: 1024,
    // 设置窗口高度
    height: 768,
    // 设置窗口图标
    icon: join('./nvm-logo-color-avatar.png'),
    // 设置webPreferences
    webPreferences: {
      nodeIntegration: false, // 尝试全局暴露node api
      contextIsolation: true,
      preload: join(__dirname, '../preload/index.js'),
      devTools: isDev,
    },
    autoHideMenuBar: true,//!isDev,
  })

  const URL = isDev
    ? process.env.DS_RENDERER_URL
    : `file://${join(app.getAppPath(), 'dist/render/index.html')}`

  win.loadURL(URL)

 if (isDev)
    win.webContents.openDevTools()
  else win.removeMenu()

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
