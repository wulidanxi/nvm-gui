import { BrowserWindow, app } from 'electron'
import { autoUpdater } from 'electron-updater'
import type { AppUpdateStatus } from '../common/types'

const RELEASE_API = 'https://api.github.com/repos/wulidanxi/nvm-gui/releases'

interface GithubRelease {
  tag_name?: string
  body?: string
  draft?: boolean
  prerelease?: boolean
}

export class AppUpdateService {
  private status: AppUpdateStatus = { phase: 'idle' }
  private configured = false

  public getStatus(): AppUpdateStatus {
    return this.status
  }

  public async check(): Promise<AppUpdateStatus> {
    if (!app.isPackaged) {
      this.setStatus({ phase: 'unsupported', error: 'Updates are available only in packaged builds.' })
      return this.status
    }

    this.setStatus({ phase: 'checking' })
    if (process.platform === 'win32') {
      this.configureWindowsUpdater()
      try {
        await autoUpdater.checkForUpdates()
      }
      catch (error) {
        this.setStatus({ phase: 'error', error: messageFor(error) })
      }
      return this.status
    }

    try {
      const release = await this.findLatestRelease()
      if (!release) {
        this.setStatus({ phase: 'up-to-date' })
      }
      else {
        this.setStatus({
          phase: 'available', version: release.version, releaseNotes: release.notes,
          manualDownload: true,
        })
      }
    }
    catch (error) {
      this.setStatus({ phase: 'error', error: messageFor(error) })
    }
    return this.status
  }

  public async download(): Promise<AppUpdateStatus> {
    if (!app.isPackaged || process.platform !== 'win32')
      throw new Error('In-app download is supported only by packaged Windows builds.')
    if (this.status.phase !== 'available')
      throw new Error('No update is ready to download.')
    try {
      await autoUpdater.downloadUpdate()
    }
    catch (error) {
      this.setStatus({ phase: 'error', error: messageFor(error) })
    }
    return this.status
  }

  public quitAndInstall(): void {
    if (process.platform !== 'win32' || this.status.phase !== 'downloaded')
      throw new Error('No downloaded Windows update is ready to install.')
    autoUpdater.quitAndInstall(false, true)
  }

  private configureWindowsUpdater(): void {
    if (this.configured)
      return
    this.configured = true
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = false
    autoUpdater.allowPrerelease = isPrerelease(app.getVersion())
    autoUpdater.allowDowngrade = false
    autoUpdater.on('checking-for-update', () => this.setStatus({ phase: 'checking' }))
    autoUpdater.on('update-not-available', () => this.setStatus({ phase: 'up-to-date' }))
    autoUpdater.on('update-available', info => this.setStatus({
      phase: 'available', version: info.version, releaseNotes: stringifyReleaseNotes(info.releaseNotes),
      unsignedWarning: true,
    }))
    autoUpdater.on('download-progress', progress => this.setStatus({
      ...this.status, phase: 'downloading', progress: Math.round(progress.percent),
    }))
    autoUpdater.on('update-downloaded', info => this.setStatus({
      phase: 'downloaded', version: info.version, releaseNotes: stringifyReleaseNotes(info.releaseNotes), unsignedWarning: true,
    }))
    autoUpdater.on('error', error => this.setStatus({ phase: 'error', error: messageFor(error) }))
  }

  private async findLatestRelease(): Promise<{ version: string, notes?: string } | undefined> {
    const response = await fetch(RELEASE_API, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'nvm-gui' },
    })
    if (!response.ok)
      throw new Error(`Update request failed: ${response.status}`)
    const releases = await response.json() as GithubRelease[]
    const prerelease = isPrerelease(app.getVersion())
    const release = releases.find(item => !item.draft && item.prerelease === prerelease && item.tag_name)
    if (!release?.tag_name)
      return undefined
    const version = release.tag_name.replace(/^v/, '')
    return compareVersions(version, app.getVersion()) > 0
      ? { version, notes: release.body }
      : undefined
  }

  private setStatus(status: AppUpdateStatus): void {
    this.status = status
    for (const win of BrowserWindow.getAllWindows())
      win.webContents.send('app-update-status', status)
  }
}

function isPrerelease(version: string): boolean {
  return version.includes('-')
}

function compareVersions(left: string, right: string): number {
  const parse = (value: string) => value.replace(/^v/, '').split(/[.-]/).map(part => /^\d+$/.test(part) ? Number(part) : part)
  const a = parse(left)
  const b = parse(right)
  for (let index = 0; index < Math.max(a.length, b.length); index++) {
    const first = a[index] ?? 0
    const second = b[index] ?? 0
    if (first === second) continue
    if (typeof first === 'number' && typeof second === 'number') return first > second ? 1 : -1
    return String(first).localeCompare(String(second))
  }
  return 0
}

function stringifyReleaseNotes(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (!Array.isArray(value)) return undefined
  return value.map((item: { note?: unknown }) => typeof item.note === 'string' ? item.note : '').filter(Boolean).join('\n') || undefined
}

function messageFor(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export const appUpdateService = new AppUpdateService()
