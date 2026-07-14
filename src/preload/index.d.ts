import type { MessageApiInjection } from 'naive-ui/lib/message/src/MessageProvider'
import type { DesktopApi } from '../common/desktop-api'

declare global {
  /** preload 桥接及 Naive UI 全局反馈句柄。 */
  interface Window {
    nvmGui: DesktopApi
    $message: MessageApiInjection
    $dialog: any
  }
}

export { }
