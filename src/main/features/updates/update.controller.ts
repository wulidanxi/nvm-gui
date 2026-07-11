import { Controller, IpcHandle } from 'einf'
import { appUpdateService } from './update.service'
import type { AppUpdateService } from './update.service'
import { assertUpdatePreference } from '../../../common/validation'

@Controller()
export class AppUpdateController {
  public constructor(private readonly updates: AppUpdateService = appUpdateService) {}

  @IpcHandle('app-update-status')
  public status() {
    return this.updates.getStatus()
  }

  @IpcHandle('app-update-check')
  public async check(includePrerelease: boolean) {
    assertUpdatePreference(includePrerelease)
    return this.updates.check(includePrerelease)
  }

  @IpcHandle('app-update-download')
  public async download() {
    return this.updates.download()
  }

  @IpcHandle('app-update-quit-and-install')
  public quitAndInstall(): void {
    this.updates.quitAndInstall()
  }
}
