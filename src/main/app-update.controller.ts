import { Controller, IpcHandle } from 'einf'
import { appUpdateService } from './app-update.service'
import { assertUpdatePreference } from '../common/validation'

@Controller()
export class AppUpdateController {
  @IpcHandle('app-update-status')
  public status() {
    return appUpdateService.getStatus()
  }

  @IpcHandle('app-update-check')
  public async check(includePrerelease: boolean) {
    assertUpdatePreference(includePrerelease)
    return appUpdateService.check(includePrerelease)
  }

  @IpcHandle('app-update-download')
  public async download() {
    return appUpdateService.download()
  }

  @IpcHandle('app-update-quit-and-install')
  public quitAndInstall(): void {
    appUpdateService.quitAndInstall()
  }
}
