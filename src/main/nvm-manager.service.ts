import { execFile } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import util from 'node:util'
import { app } from 'electron'
import type {
  NvmManagerInstallOptions,
  NvmManagerPaths,
  NvmManagerProvider,
  NvmManagerStatus,
  NvmManagerVersionOption,
} from '../common/types'
import {
  githubAssetUrl,
  githubRepoForProvider,
  managerAssetName,
  normalizeManagerVersion,
  providerForPlatform,
  recommendedManagerOption,
  releaseTagsToOptions,
  validateManagerVersion,
  WINDOWS_NVM_RECOMMENDED_VERSION,
} from './nvm-manager.shared'

const execFilePromise = util.promisify(execFile)
const COMMAND_TIMEOUT_MS = 120_000

export class NvmManagerService {
  private readonly platform: NodeJS.Platform
  private readonly provider: NvmManagerProvider

  constructor(platform: NodeJS.Platform = process.platform) {
    this.platform = platform
    this.provider = providerForPlatform(platform)
  }

  public async detect(): Promise<NvmManagerStatus> {
    const paths = await this.getPaths()
    try {
      const version = await this.currentManagerVersion()
      return {
        platform: this.platform,
        provider: this.provider,
        installed: true,
        version: version.trim(),
        paths,
      }
    }
    catch (error: any) {
      return {
        platform: this.platform,
        provider: this.provider,
        installed: false,
        paths,
        message: this.formatCommandError(error),
      }
    }
  }

  public async listManagerVersions(): Promise<NvmManagerVersionOption[]> {
    const fallback = this.provider === 'nvm-windows'
      ? [recommendedManagerOption(this.provider, 'embedded')]
      : [recommendedManagerOption(this.provider, 'remote')]

    try {
      const releases = await this.fetchGithubReleases()
      const remoteOptions = releaseTagsToOptions(this.provider, releases)
      if (this.provider !== 'nvm-windows')
        return remoteOptions.length > 0 ? remoteOptions : fallback

      const embedded = recommendedManagerOption(this.provider, 'embedded')
      return [
        embedded,
        ...remoteOptions.filter(item => item.version !== embedded.version),
      ]
    }
    catch (error) {
      console.warn('Failed to load NVM manager releases, using fallback', error)
      return fallback
    }
  }

  public async currentManagerVersion(): Promise<string> {
    if (this.provider === 'nvm-windows')
      return this.runCommand('nvm', ['version'])

    return this.runPosixNvm(['--version'])
  }

  public async getPaths(): Promise<NvmManagerPaths> {
    if (this.provider === 'nvm-windows') {
      const envHome = process.env.NVM_HOME
      const envSymlink = process.env.NVM_SYMLINK
      return {
        executable: await this.findWindowsNvmExecutable(envHome),
        nvmHome: envHome,
        nvmSymlink: envSymlink,
        embeddedInstaller: this.getEmbeddedWindowsInstallerPath(),
      }
    }

    const nvmDir = this.getPosixNvmDir()
    return {
      executable: existsSync(join(nvmDir, 'nvm.sh')) ? join(nvmDir, 'nvm.sh') : undefined,
      nvmDir,
    }
  }

  public async installManager(options: NvmManagerInstallOptions): Promise<NvmManagerStatus> {
    const version = validateManagerVersion(this.provider, options.version)
    if (this.provider === 'nvm-windows')
      await this.installWindowsManager(version, options.source)
    else
      await this.installPosixManager(version, options.writeProfile === true)

    return this.detect()
  }

  public async refreshEnv(): Promise<NvmManagerStatus> {
    return this.detect()
  }

  public async runNvmCommand(args: string[]): Promise<string> {
    try {
      if (this.provider === 'nvm-windows')
        return this.runCommand('nvm', args)

      return this.runPosixNvm(args)
    }
    catch (error: any) {
      if (this.isCommandMissingError(error)) {
        throw new Error('NVM manager is not installed. Please install it in Settings first.')
      }
      throw new Error(this.formatCommandError(error))
    }
  }

  public async runNpmCommand(args: string[]): Promise<string> {
    try {
      return this.runCommand('npm', args)
    }
    catch (error: any) {
      throw new Error(this.formatCommandError(error))
    }
  }

  private async installWindowsManager(version: string, source: 'embedded' | 'remote') {
    const installer = source === 'embedded'
      ? await this.resolveEmbeddedWindowsInstaller(version)
      : await this.downloadWindowsInstaller(version)

    await execFilePromise(installer, ['/VERYSILENT', '/SUPPRESSMSGBOXES', '/NORESTART'], {
      windowsHide: true,
      timeout: COMMAND_TIMEOUT_MS * 5,
      maxBuffer: 1024 * 1024 * 10,
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

  private async downloadWindowsInstaller(version: string): Promise<string> {
    const url = githubAssetUrl('nvm-windows', version)
    const target = join(this.getDownloadCacheDir(), `nvm-windows-${version}`, managerAssetName('nvm-windows'))
    await this.downloadFile(url, target)
    return target
  }

  private async installPosixManager(version: string, writeProfile: boolean) {
    const installScriptUrl = githubAssetUrl('nvm-sh', version)
    const tmpFile = join(this.getDownloadCacheDir(), `nvm-install-${normalizeManagerVersion('nvm-sh', version)}.sh`)
    await this.downloadFile(installScriptUrl, tmpFile)

    const nvmDir = this.getPosixNvmDir()
    await mkdir(nvmDir, { recursive: true })

    const profile = writeProfile ? '' : '/dev/null'
    const script = [
      `export NVM_DIR=${shellQuote(nvmDir)}`,
      profile ? `export PROFILE=${shellQuote(profile)}` : '',
      `bash ${shellQuote(tmpFile)}`,
      `[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"`,
      'nvm --version',
    ].filter(Boolean).join(' && ')

    await this.runShell(script)
  }

  private async fetchGithubReleases(): Promise<Array<{ tag_name?: string; draft?: boolean; prerelease?: boolean }>> {
    const url = `https://api.github.com/repos/${githubRepoForProvider(this.provider)}/releases`
    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'nvm-gui',
      },
    })

    if (!response.ok)
      throw new Error(`GitHub release request failed: ${response.status}`)

    return response.json()
  }

  private async downloadFile(url: string, target: string): Promise<void> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'nvm-gui',
      },
    })

    if (!response.ok)
      throw new Error(`Download failed: ${response.status} ${response.statusText}`)

    const data = Buffer.from(await response.arrayBuffer())
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, data)
  }

  private getEmbeddedWindowsInstallerPath(): string | undefined {
    const packagedPath = join(process.resourcesPath, 'nvm-manager', managerAssetName('nvm-windows'))
    if (app.isPackaged)
      return packagedPath

    return join(process.cwd(), 'resources', 'nvm-windows', managerAssetName('nvm-windows'))
  }

  private getDownloadCacheDir(): string {
    const basePath = app.getPath('userData')
    const target = join(basePath, 'nvm-manager-cache')
    mkdirSync(target, { recursive: true })
    return target
  }

  private getPosixNvmDir(): string {
    return process.env.NVM_DIR || join(homedir(), '.nvm')
  }

  private async findWindowsNvmExecutable(envHome?: string): Promise<string | undefined> {
    const envPath = envHome ? join(envHome, 'nvm.exe') : undefined
    if (envPath && existsSync(envPath))
      return envPath

    try {
      const result = await this.runCommand('where', ['nvm'])
      return result.split(/\r?\n/).map(line => line.trim()).find(Boolean)
    }
    catch {
      return undefined
    }
  }

  private async runCommand(command: string, args: string[]): Promise<string> {
    const executable = this.platform === 'win32'
      ? process.env.ComSpec || 'cmd.exe'
      : command
    const commandArgs = this.platform === 'win32'
      ? ['/d', '/s', '/c', command, ...args]
      : args

    const { stdout } = await execFilePromise(executable, commandArgs, {
      windowsHide: true,
      timeout: COMMAND_TIMEOUT_MS,
      maxBuffer: 1024 * 1024 * 10,
    })
    return stdout
  }

  private async runPosixNvm(args: string[]): Promise<string> {
    const nvmDir = this.getPosixNvmDir()
    const script = [
      `export NVM_DIR=${shellQuote(nvmDir)}`,
      `[ -s "$NVM_DIR/nvm.sh" ] || { echo "NVM manager is not installed" >&2; exit 127; }`,
      `. "$NVM_DIR/nvm.sh"`,
      `nvm ${args.map(shellQuote).join(' ')}`,
    ].join(' && ')

    return this.runShell(script)
  }

  private async runShell(script: string): Promise<string> {
    const shell = process.env.SHELL || '/bin/bash'
    const { stdout } = await execFilePromise(shell, ['-lc', script], {
      timeout: COMMAND_TIMEOUT_MS,
      maxBuffer: 1024 * 1024 * 10,
    })
    return stdout
  }

  private isCommandMissingError(error: any): boolean {
    const message = this.formatCommandError(error).toLowerCase()
    return message.includes('not recognized')
      || message.includes('command not found')
      || message.includes('not installed')
      || message.includes('not found')
      || message.includes('cannot find')
  }

  private formatCommandError(error: any): string {
    return error?.stderr?.trim()
      || error?.stdout?.trim()
      || error?.message
      || 'Command execution failed'
  }
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`
}
