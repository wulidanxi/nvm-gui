import { createHash } from 'node:crypto'
import { existsSync, mkdirSync } from 'node:fs'
import { mkdir, rename, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import type { NvmManagerProvider, NvmManagerSource } from '../common/types'
import type { CommandRunner } from './command-runner'
import { DEFAULT_COMMAND_TIMEOUT_MS } from './command-runner'
import {
  WINDOWS_NVM_RECOMMENDED_VERSION,
  githubAssetUrl,
  managerAssetName,
  normalizeManagerVersion,
  validateManagerVersion,
  trustedManagerHash,
} from './nvm-manager.shared'
import { shellQuote } from './nvm-provider'

export interface ElectronAppAdapter {
  isPackaged: boolean
  getPath: (name: 'userData') => string
}

// Installer logic is isolated because it is the main-process area most likely
// to require elevation, filesystem writes, and remote downloads.
export class NvmInstaller {
  constructor(
    private readonly provider: NvmManagerProvider,
    private readonly runner: CommandRunner,
    private readonly posixNvmDir: () => string,
    private readonly platform: NodeJS.Platform = process.platform,
    private readonly appAdapter?: ElectronAppAdapter,
  ) {}

  public async install(
    version: string,
    source: NvmManagerSource,
    writeProfile: boolean,
  ): Promise<void> {
    const normalized = validateManagerVersion(this.provider, version)
    if (this.provider === 'nvm-windows')
      await this.installWindowsManager(normalized, source)
    else
      await this.installPosixManager(normalized, writeProfile)
  }

  public async resolveWindowsInstaller(version: string, source: NvmManagerSource): Promise<{ path: string, hash: string }> {
    const normalized = validateManagerVersion('nvm-windows', version)
    const hash = trustedManagerHash('nvm-windows', normalized)
    if (!hash)
      throw new Error(`Version ${normalized} is not in the trusted NVM manager manifest`)
    const path = source === 'embedded'
      ? await this.resolveEmbeddedWindowsInstaller(normalized)
      : await this.downloadWindowsInstaller(normalized, hash)
    return { path, hash }
  }

  public getEmbeddedWindowsInstallerPath(): string | undefined {
    const packagedPath = join(process.resourcesPath, 'nvm-manager', managerAssetName('nvm-windows'))
    if (this.getElectronApp().isPackaged)
      return packagedPath

    return join(process.cwd(), 'resources', 'nvm-windows', managerAssetName('nvm-windows'))
  }

  private async installWindowsManager(version: string, source: NvmManagerSource) {
    const installer = source === 'embedded'
      ? await this.resolveEmbeddedWindowsInstaller(version)
      : await this.downloadWindowsInstaller(version)

    await this.runner.run(installer, ['/VERYSILENT', '/SUPPRESSMSGBOXES', '/NORESTART'], {
      timeout: DEFAULT_COMMAND_TIMEOUT_MS * 5,
    })
  }

  private async resolveEmbeddedWindowsInstaller(version: string): Promise<string> {
    if (version !== WINDOWS_NVM_RECOMMENDED_VERSION)
      return this.downloadWindowsInstaller(version)

    const embeddedPath = this.getEmbeddedWindowsInstallerPath()
    if (embeddedPath && existsSync(embeddedPath))
      return embeddedPath

    return this.downloadWindowsInstaller(version)
  }

  private async downloadWindowsInstaller(version: string, expectedHash?: string): Promise<string> {
    const hash = expectedHash || trustedManagerHash('nvm-windows', version)
    if (!hash)
      throw new Error(`Version ${version} is not in the trusted NVM manager manifest`)
    const url = githubAssetUrl('nvm-windows', version)
    const target = join(this.getDownloadCacheDir(), `nvm-windows-${version}`, managerAssetName('nvm-windows'))
    await this.downloadFile(url, target, hash)
    return target
  }

  private async installPosixManager(version: string, writeProfile: boolean) {
    const installScriptUrl = githubAssetUrl('nvm-sh', version)
    const tmpFile = join(this.getDownloadCacheDir(), `nvm-install-${normalizeManagerVersion('nvm-sh', version)}.sh`)
    await this.downloadFile(installScriptUrl, tmpFile)

    const nvmDir = this.posixNvmDir()
    await mkdir(nvmDir, { recursive: true })
    await this.ensurePosixProfileFile(writeProfile)

    const profile = writeProfile ? '' : '/dev/null'
    const script = [
      `export NVM_DIR=${shellQuote(nvmDir)}`,
      profile ? `export PROFILE=${shellQuote(profile)}` : '',
      `bash ${shellQuote(tmpFile)}`,
      `[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"`,
      'nvm --version',
    ].filter(Boolean).join(' && ')

    await this.runner.runShell(script, {
      timeout: DEFAULT_COMMAND_TIMEOUT_MS * 5,
    })
  }

  private async downloadFile(url: string, target: string, expectedHash?: string): Promise<void> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 300_000)
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'nvm-gui' }, signal: controller.signal, redirect: 'error',
      })

      if (!response.ok)
        throw new Error(`Download failed: ${response.status} ${response.statusText}`)
      const maxSize = 200 * 1024 * 1024
      const contentLength = response.headers.get('content-length')
      if (contentLength && Number(contentLength) > maxSize)
        throw new Error('Download exceeds the 200 MB limit')

      const data = Buffer.from(await response.arrayBuffer())
      if (data.length > maxSize)
        throw new Error('Download exceeds the 200 MB limit')
      if (expectedHash && createHash('sha256').update(data).digest('hex') !== expectedHash.toLowerCase())
        throw new Error('Downloaded NVM installer SHA-256 verification failed')
      await mkdir(dirname(target), { recursive: true })
      const temp = `${target}.tmp-${Date.now()}`
      await writeFile(temp, data)
      await rename(temp, target)
    }
    finally { clearTimeout(timeout) }
  }

  private getDownloadCacheDir(): string {
    const basePath = this.getElectronApp().getPath('userData')
    const target = join(basePath, 'nvm-manager-cache')
    mkdirSync(target, { recursive: true })
    return target
  }

  private getElectronApp(): ElectronAppAdapter {
    if (!this.appAdapter)
      throw new Error('Electron app adapter is required for installer filesystem paths')

    return this.appAdapter
  }

  private async ensurePosixProfileFile(writeProfile: boolean): Promise<void> {
    if (!writeProfile || this.platform !== 'darwin')
      return

    const shellName = process.env.SHELL?.split('/').pop()
    if (shellName !== 'zsh')
      return

    const zshrc = join(homedir(), '.zshrc')
    if (!existsSync(zshrc))
      await writeFile(zshrc, '')
  }
}
