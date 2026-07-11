import { Controller, IpcHandle } from 'einf'
import { shell } from 'electron'
import type { ExternalLinkTarget } from '../common/types'
import { EXTERNAL_LINKS } from '../common/types'
import { assertExternalLinkTarget } from '../common/validation'

@Controller()
export class SystemController {
  @IpcHandle('openUrl')
  public async openUrl(target: ExternalLinkTarget): Promise<void> {
    assertExternalLinkTarget(target)
    const url = EXTERNAL_LINKS[target]
    await shell.openExternal(url)
  }
}

