import { Controller, IpcHandle } from 'einf'
import { join } from 'path'
import { promises as fs } from 'fs'

@Controller()
export class ProjectController {

  @IpcHandle('check-nvmrc')
  public async checkNvmrc(path: string): Promise<string | null> {
    try {
      const nvmrcPath = join(path, '.nvmrc');
      const content = await fs.readFile(nvmrcPath, 'utf-8');
      return content.trim();
    } catch {
      return null;
    }
  }
}
