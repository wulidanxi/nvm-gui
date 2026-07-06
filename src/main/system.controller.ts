import { Controller, IpcHandle } from 'einf'
import { shell } from 'electron'

@Controller()
export class SystemController {
  @IpcHandle('openUrl')
  public async openUrl(url: string): Promise<void> {
    const parsedUrl = new URL(url)
    if (!['http:', 'https:'].includes(parsedUrl.protocol))
      throw new Error('Only http and https protocols are allowed')

    await shell.openExternal(url)
  }
}

