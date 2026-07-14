import { Controller, IpcHandle } from 'einf'
import { dialog } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'
import { parseNvmrc } from './nvmrc'

@Controller()
/** 提供项目目录选择和 .nvmrc 探测能力。 */
export class ProjectController {
  @IpcHandle('open-directory-dialog')
  public async openDirectoryDialog(): Promise<string | null> {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    })

    if (result.canceled || result.filePaths.length === 0)
      return null

    return result.filePaths[0]
  }

  /** 读取所选目录的 .nvmrc；文件不存在或不可读时视为未配置。 */
  @IpcHandle('check-nvmrc')
  public async checkNvmrc(path: string): Promise<string | null> {
    try {
      const nvmrcPath = join(path, '.nvmrc')
      const content = await fs.readFile(nvmrcPath, 'utf-8')
      return parseNvmrc(content)
    }
    catch {
      return null
    }
  }
}
