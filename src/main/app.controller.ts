import { exec } from 'node:child_process'
import util from 'node:util'
import { Controller, IpcHandle } from 'einf'
import { shell } from 'electron'



@Controller()
export class AppController {

  @IpcHandle('runCmd')
  public async runExec(cmd: string): Promise<string> {
    const execFile = util.promisify(exec)
    const { stdout, stderr } = await execFile(cmd, {})
    return stdout
  }

  @IpcHandle('openUrl')
  public async openUrl(url: string) { 
    shell.openExternal(url)
  }
}
