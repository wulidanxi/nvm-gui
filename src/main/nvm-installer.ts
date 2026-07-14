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

/** 安装器所需的最小 Electron app 接口，便于单元测试替换。 */
export interface ElectronAppAdapter {
  isPackaged: boolean
  getPath: (name: 'userData') => string
}

// 安装逻辑独立封装，因为它集中涉及提权、文件写入和远程下载。
/** 为当前平台准备并执行受控的 NVM 管理器安装流程。 */
export class NvmInstaller {
  constructor(
    private readonly provider: NvmManagerProvider,
    private readonly runner: CommandRunner,
    private readonly posixNvmDir: () => string,
    private readonly platform: NodeJS.Platform = process.platform,
    private readonly appAdapter?: ElectronAppAdapter,
  ) {}

  /** 校验版本后分派到 Windows 或 POSIX 安装流程。 */
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

  /** 解析可信的 Windows 安装包，并返回后续签名校验所需的哈希。 */
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

  /** 根据开发或打包环境定位内置的 nvm-windows 安装包。 */
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

  /** 推荐版本优先使用内置资源，缺失时再回退到可信下载。 */
  private async resolveEmbeddedWindowsInstaller(version: string): Promise<string> {
    if (version !== WINDOWS_NVM_RECOMMENDED_VERSION)
      return this.downloadWindowsInstaller(version)

    const embeddedPath = this.getEmbeddedWindowsInstallerPath()
    if (embeddedPath && existsSync(embeddedPath))
      return embeddedPath

    return this.downloadWindowsInstaller(version)
  }

  /** 仅下载可信清单中存在 SHA-256 的 nvm-windows 版本。 */
  private async downloadWindowsInstaller(version: string, expectedHash?: string): Promise<string> {
    const hash = expectedHash || trustedManagerHash('nvm-windows', version)
    if (!hash)
      throw new Error(`Version ${version} is not in the trusted NVM manager manifest`)
    const url = githubAssetUrl('nvm-windows', version)
    const target = join(this.getDownloadCacheDir(), `nvm-windows-${version}`, managerAssetName('nvm-windows'))
    await this.downloadFile(url, target, hash)
    return target
  }

  /** 下载 nvm-sh 安装脚本，并按用户选择决定是否允许修改 shell 配置。 */
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

  /** 限制重定向、超时和文件大小，并在需要时校验 SHA-256 后原子落盘。 */
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

  /** 返回 userData 下的专用下载缓存目录。 */
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

  /** 仅在 macOS zsh 且用户授权写入配置时创建缺失的 .zshrc。 */
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
