import { Controller, IpcHandle } from 'einf'
import { shell } from 'electron'
import type { ExternalLinkTarget } from '../common/types'
import { EXTERNAL_LINKS } from '../common/types'
import { assertExternalLinkTarget } from '../common/validation'

@Controller()
/** 承载需要 Electron 主进程权限的系统级操作。 */
export class SystemController {
  /** 仅打开预定义的外部链接，不接受渲染进程提供的任意 URL。 */
  @IpcHandle('openUrl')
  public async openUrl(target: ExternalLinkTarget): Promise<void> {
    assertExternalLinkTarget(target)
    const url = EXTERNAL_LINKS[target]
    await shell.openExternal(url)
  }
}

