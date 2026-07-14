import { ipcMain } from 'electron'
import type { BrowserWindow } from 'electron'

let mainWindow: BrowserWindow | undefined
let trustedDevOrigin: string | undefined

/** 更新唯一允许调用 IPC 的主窗口。 */
export function setIpcMainWindow(win: BrowserWindow | undefined): void {
  mainWindow = win
}

/** 设置开发服务器来源；生产环境固定信任 app://nvm-gui。 */
export function setTrustedDevOrigin(origin: string | undefined): void {
  trustedDevOrigin = origin
}

/**
 * 包装 ipcMain.handle，在每个业务处理器执行前统一验证发送方。
 * 应在 einf 注册控制器前安装，以覆盖所有后续通道。
 */
export function installIpcSecurityGuard(): void {
  const originalHandle = ipcMain.handle.bind(ipcMain)
  ipcMain.handle = ((channel: string, listener: (event: Electron.IpcMainInvokeEvent, ...args: any[]) => any) => {
    return originalHandle(channel, async (event, ...args) => {
      assertTrustedInvocation(event)
      return listener(event, ...args)
    })
  }) as typeof ipcMain.handle
}

/** 只允许当前主窗口的顶层、受信任页面发起调用。 */
function assertTrustedInvocation(event: Electron.IpcMainInvokeEvent): void {
  if (!mainWindow || mainWindow.isDestroyed() || event.sender.id !== mainWindow.webContents.id)
    throw new Error('IPC rejected: sender is not the active main window')
  const frame = event.senderFrame
  if (!frame || frame.parent)
    throw new Error('IPC rejected: only the main frame may invoke IPC')
  if (!isTrustedRendererUrl(frame.url))
    throw new Error(`IPC rejected: untrusted renderer URL: ${frame.url}`)
}

/** 同源比较开发地址，生产环境则校验私有协议和固定主机名。 */
function isTrustedRendererUrl(value: string): boolean {
  try {
    const url = new URL(value)
    if (trustedDevOrigin) {
      const dev = new URL(trustedDevOrigin)
      return url.protocol === dev.protocol && url.hostname === dev.hostname && url.port === dev.port
    }
    return url.protocol === 'app:' && url.host === 'nvm-gui'
  }
  catch { return false }
}
