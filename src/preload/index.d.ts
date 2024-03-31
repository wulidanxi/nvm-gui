import type { IpcRenderer } from 'electron'
import type { MessageApiInjection } from "naive-ui/lib/message/src/MessageProvider"

declare global {
  interface Window {
    ipcRenderer: IpcRenderer,
    versions: any,
    $message: MessageApiInjection
  }
}

export { }
