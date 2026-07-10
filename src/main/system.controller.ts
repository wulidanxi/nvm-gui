import { Controller, IpcHandle } from 'einf'
import { shell } from 'electron'
import type { ExternalLinkTarget } from '../common/types'
import { EXTERNAL_LINKS } from '../common/types'

@Controller()
export class SystemController {
  @IpcHandle('openUrl')
  public async openUrl(target: ExternalLinkTarget): Promise<void> {
    const url = EXTERNAL_LINKS[target]
    if (!url)
      throw new Error(`Unknown external link target: ${target}`)
    await shell.openExternal(url)
  }
}

