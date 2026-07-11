import type { MessageApiInjection } from 'naive-ui/lib/message/src/MessageProvider'
import type { DesktopApi } from '../common/desktop-api'

declare global {
  interface Window {
    nvmGui: DesktopApi
    $message: MessageApiInjection
    $dialog: any
  }
}

export { }
