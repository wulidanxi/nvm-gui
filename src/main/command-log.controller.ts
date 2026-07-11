import { Controller, IpcHandle } from 'einf'
import { dialog } from 'electron'
import type { CommandLogQuery } from '../common/types'
import { assertCommandLogQuery } from '../common/validation'
import { getCommandLogService } from './command-log.service'
import { writeFile } from 'node:fs/promises'

@Controller()
export class CommandLogController {
  private readonly commandLog = getCommandLogService()

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
