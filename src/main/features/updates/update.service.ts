import { BrowserWindow, app } from 'electron'
import { autoUpdater } from 'electron-updater'
import type { AppUpdateStatus } from '../../../common/types'
import { applyUpdateChannelPreference, findNewerRelease, type ReleaseCandidate } from './update-policy'
import { formatReleaseNotes } from './update-release-notes'

const RELEASE_API = 'https://api.github.com/repos/wulidanxi/nvm-gui/releases'

/** 管理跨平台更新检查状态；仅 Windows 支持应用内下载和安装。 */
export class AppUpdateService {
  private status: AppUpdateStatus = { phase: 'idle' }
  private configured = false

  /** 返回当前状态快照。 */
  public getStatus(): AppUpdateStatus {
    return this.status
  }

  /** Windows 委托 electron-updater，其余平台仅查询可手动下载的发布。 */
  public async check(includePrerelease: boolean): Promise<AppUpdateStatus> {
    if (!app.isPackaged) {
      this.setStatus({ phase: 'unsupported', error: 'Updates are available only in packaged builds.' })
      return this.status
    }

    this.setStatus({ phase: 'checking' })
    if (process.platform === 'win32') {
      this.configureWindowsUpdater()
      applyUpdateChannelPreference(autoUpdater, includePrerelease)
      try {
        await autoUpdater.checkForUpdates()
      }
      catch (error) {
        this.setStatus({ phase: 'error', error: messageFor(error) })
      }
      return this.status
    }

    try {
      const release = await this.findLatestRelease(includePrerelease)
      if (!release) {
        this.setStatus({ phase: 'up-to-date' })
      }
      else {
        this.setStatus({
          phase: 'available', version: release.version, releaseNotes: formatReleaseNotes(release.notes),
          manualDownload: true,
        })
      }
    }
    catch (error) {
      this.setStatus({ phase: 'error', error: messageFor(error) })
    }
    return this.status
  }

  /** 下载已发现的 Windows 更新，并保留失败后的重试状态。 */
  public async download(): Promise<AppUpdateStatus> {
    if (!app.isPackaged || process.platform !== 'win32')
      throw new Error('In-app download is supported only by packaged Windows builds.')
    if (this.status.phase !== 'available')
      throw new Error('No update is ready to download.')
    this.setStatus({ ...this.status, phase: 'downloading', progress: 0, error: undefined })
    try {
      await autoUpdater.downloadUpdate()
    }
    catch (error) {
      this.setStatus({
        ...this.status, phase: 'available', progress: undefined, error: messageFor(error),
      })
    }
    return this.status
  }

  /** 仅当 Windows 安装包已下载完成时退出并启动安装。 */
  public quitAndInstall(): void {
    if (process.platform !== 'win32' || this.status.phase !== 'downloaded')
      throw new Error('No downloaded Windows update is ready to install.')
    autoUpdater.quitAndInstall(false, true)
  }

  /** 只注册一次 updater 事件，并将其归一化为共享状态机。 */
  private configureWindowsUpdater(): void {
    if (this.configured)
      return
    this.configured = true
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = false
    autoUpdater.on('checking-for-update', () => this.setStatus({ phase: 'checking' }))
    autoUpdater.on('update-not-available', () => this.setStatus({ phase: 'up-to-date' }))
    autoUpdater.on('update-available', info => this.setStatus({
      phase: 'available', version: info.version, releaseNotes: formatReleaseNotes(info.releaseNotes),
      unsignedWarning: true,
    }))
    autoUpdater.on('download-progress', progress => this.setStatus({
      ...this.status, phase: 'downloading', progress: Math.round(progress.percent),
    }))
    autoUpdater.on('update-downloaded', info => this.setStatus({
      phase: 'downloaded', version: info.version, releaseNotes: formatReleaseNotes(info.releaseNotes), unsignedWarning: true,
    }))
    autoUpdater.on('error', (error) => {
      const canRetry = this.status.phase === 'available' || this.status.phase === 'downloading'
      this.setStatus({
        ...this.status,
        phase: canRetry ? 'available' : 'error',
        progress: undefined,
        error: messageFor(error),
      })
    })
  }

  /** 在非 Windows 平台从 GitHub Releases 中选择当前通道的新版本。 */
  private async findLatestRelease(includePrerelease: boolean): Promise<{ version: string, notes?: string } | undefined> {
    const response = await fetch(RELEASE_API, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'nvm-gui' },
    })
    if (!response.ok)
      throw new Error(`Update request failed: ${response.status}`)
    const releases = await response.json() as ReleaseCandidate[]
    return findNewerRelease(releases, app.getVersion(), includePrerelease)
  }

  /** 更新内存状态并广播给所有活动窗口。 */
  private setStatus(status: AppUpdateStatus): void {
    this.status = status
    for (const win of BrowserWindow.getAllWindows())
      win.webContents.send('app-update-status', status)
  }
}

/** 将未知异常转换为可传递给渲染进程的文本。 */
function messageFor(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export const appUpdateService = new AppUpdateService()
