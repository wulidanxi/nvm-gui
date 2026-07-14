import { Controller, IpcHandle } from 'einf'
import { dialog } from 'electron'
import type { CommandLogQuery } from '../common/types'
import { assertCommandLogQuery } from '../common/validation'
import { getCommandLogService } from './command-log.service'
import type { CommandLogService } from './command-log.service'
import { writeFile } from 'node:fs/promises'

@Controller()
/** 对渲染进程暴露命令日志查询、清理和导出能力。 */
export class CommandLogController {
  public constructor(private readonly commandLog: CommandLogService = getCommandLogService()) {}

  @IpcHandle('command-log-list')
  public async list(query?: CommandLogQuery) {
    assertCommandLogQuery(query)
    return this.commandLog.list(query)
  }

  @IpcHandle('command-log-remove')
  public async remove(id: string): Promise<void> {
    if (!id || id.length > 100)
      throw new Error('Invalid command log id')
    await this.commandLog.remove(id)
  }

  @IpcHandle('command-log-clear')
  public async clear(): Promise<void> {
    await this.commandLog.clear()
  }

  /** 由主进程显示保存对话框，渲染进程不接触任意文件写入能力。 */
  @IpcHandle('command-log-export')
  public async export(): Promise<string | null> {
    const result = await dialog.showSaveDialog({
      title: 'Export command logs',
      defaultPath: `nvm-gui-command-log-${new Date().toISOString().slice(0, 10)}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    })
    if (result.canceled || !result.filePath)
      return null
    await writeFile(result.filePath, await this.commandLog.export(), 'utf-8')
    return result.filePath
  }
}
