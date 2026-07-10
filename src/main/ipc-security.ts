import { ipcMain } from 'electron'
import type { BrowserWindow } from 'electron'

let mainWindow: BrowserWindow | undefined
let trustedDevOrigin: string | undefined

export function setIpcMainWindow(win: BrowserWindow | undefined): void {
  mainWindow = win
}

export function setTrustedDevOrigin(origin: string | undefined): void {
  trustedDevOrigin = origin
}

export function installIpcSecurityGuard(): void {
  const originalHandle = ipcMain.handle.bind(ipcMain)
  ipcMain.handle = ((channel: string, listener: (event: Electron.IpcMainInvokeEvent, ...args: any[]) => any) => {
    return originalHandle(channel, async (event, ...args) => {
      assertTrustedInvocation(event)
      return listener(event, ...args)
    })
  }) as typeof ipcMain.handle
}

function assertTrustedInvocation(event: Electron.IpcMainInvokeEvent): void {
  if (!mainWindow || mainWindow.isDestroyed() || event.sender.id !== mainWindow.webContents.id)
    throw new Error('IPC rejected: sender is not the active main window')
  const frame = event.senderFrame
  if (!frame || frame.parent)
    throw new Error('IPC rejected: only the main frame may invoke IPC')
  if (!isTrustedRendererUrl(frame.url))
    throw new Error(`IPC rejected: untrusted renderer URL: ${frame.url}`)
}

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
