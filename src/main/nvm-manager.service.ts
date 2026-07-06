import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { app } from 'electron'
import type {
  InstalledNodeVersion,
  NodeReleaseSummary,
  NvmManagerInstallOptions,
  NvmManagerPaths,
  NvmManagerProvider,
  NvmManagerStatus,
  NvmManagerVersionOption,
  OperationResult,
} from '../common/types'
import { ExecFileCommandRunner } from './command-runner'
import type { CommandRunner } from './command-runner'
import { NvmInstaller } from './nvm-installer'
import {
  PosixNvmProvider,
  WindowsNvmProvider,
} from './nvm-provider'
import type { NvmProvider } from './nvm-provider'
import { providerForPlatform, resolvePosixNvmDir } from './nvm-manager.shared'
import { ReleaseClient } from './release-client'

const DEFAULT_NODE_RELEASE_URL = 'https://nodejs.org/dist/index.json'

// Facade for NVM/NPM workflows. Controllers call this service, while platform
// details stay in providers, installers, release clients, and command runners.
export class NvmManagerService {
  private readonly platform: NodeJS.Platform
  private readonly providerName: NvmManagerProvider
  private readonly runner: CommandRunner
  private readonly provider: NvmProvider
  private readonly windowsProvider?: WindowsNvmProvider
  private readonly installer: NvmInstaller
  private readonly releaseClient: ReleaseClient

  constructor(
    platform: NodeJS.Platform = process.platform,
    runner: CommandRunner = new ExecFileCommandRunner(platform),
  ) {
    this.platform = platform
    this.providerName = providerForPlatform(platform)
    this.runner = runner
    this.windowsProvider = this.providerName === 'nvm-windows'
      ? new WindowsNvmProvider(runner)
      : undefined
    this.provider = this.windowsProvider
      || new PosixNvmProvider(runner, () => this.getPosixNvmDir())
    this.installer = new NvmInstaller(
      this.providerName,
      runner,
      () => this.getPosixNvmDir(),
      platform,
      app,
    )
    this.releaseClient = new ReleaseClient(this.providerName)
  }

  public async detect(): Promise<NvmManagerStatus> {
    const paths = await this.getPaths()
    try {
      const version = await this.currentManagerVersion()
      return {
        platform: this.platform,
        provider: this.providerName,
        installed: true,
        version: version.trim(),
        paths,
      }
    }
    catch (error) {
      return {
        platform: this.platform,
        provider: this.providerName,
        installed: false,
        paths,
        message: this.runner.formatError(error),
      }
    }
  }

  public async listManagerVersions(): Promise<NvmManagerVersionOption[]> {
    return this.releaseClient.listManagerVersions()
  }

  public async currentManagerVersion(): Promise<string> {
    return this.provider.currentManagerVersion()
  }

  public async getPaths(): Promise<NvmManagerPaths> {
    if (this.providerName === 'nvm-windows') {
      const envHome = process.env.NVM_HOME
      const envSymlink = process.env.NVM_SYMLINK
      return {
        executable: await this.windowsProvider?.findExecutable(envHome),
        nvmHome: envHome,
        nvmSymlink: envSymlink,
        embeddedInstaller: this.installer.getEmbeddedWindowsInstallerPath(),
      }
    }

    const nvmDir = this.getPosixNvmDir()
    return {
      executable: existsSync(join(nvmDir, 'nvm.sh')) ? join(nvmDir, 'nvm.sh') : undefined,
      nvmDir,
    }
  }

  public async installManager(options: NvmManagerInstallOptions): Promise<NvmManagerStatus> {
    await this.installer.install(options.version, options.source, options.writeProfile === true)
    return this.detect()
  }

  public async refreshEnv(): Promise<NvmManagerStatus> {
    return this.detect()
  }

  public async listInstalledVersions(): Promise<InstalledNodeVersion[]> {
    try {
      return await this.provider.listInstalledVersions()
    }
    catch (error) {
      if (this.runner.isCommandMissingError(error))
        throw new Error('NVM manager is not installed. Please install it in Settings first.')

      throw new Error(this.runner.formatError(error))
    }
  }

  public async listAvailableNodeReleases(
    releaseUrl: string = DEFAULT_NODE_RELEASE_URL,
  ): Promise<NodeReleaseSummary[]> {
    try {
      return await this.releaseClient.listNodeReleaseSummaries(
        releaseUrl,
        await this.listInstalledVersions(),
      )
    }
    catch (error) {
      throw new Error(this.runner.formatError(error))
    }
  }

  public async installNodeVersion(version: string): Promise<OperationResult> {
    const message = await this.runNvmCommand(['install', version])
    return { success: true, message }
  }

  public async useNodeVersion(version: string): Promise<OperationResult> {
    const message = await this.runNvmCommand(['use', version])
    return { success: true, message }
  }

  public async uninstallNodeVersion(version: string): Promise<OperationResult> {
    const message = await this.runNvmCommand(['uninstall', version])
    return { success: true, message }
  }

  public async runNvmCommand(args: string[]): Promise<string> {
    try {
      return await this.provider.runNvmCommand(args)
    }
    catch (error) {
      if (this.runner.isCommandMissingError(error))
        throw new Error('NVM manager is not installed. Please install it in Settings first.')

      throw new Error(this.runner.formatError(error))
    }
  }

  public async runNpmCommand(args: string[]): Promise<string> {
    try {
      return await this.runner.run('npm', args)
    }
    catch (error) {
      throw new Error(this.runner.formatError(error))
    }
  }

  public async testRegistrySpeed(registry: string): Promise<number> {
    let url: URL
    try {
      url = new URL('react', registry)
    }
    catch {
      throw new Error('Invalid registry URL')
    }

    const startedAt = Date.now()
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    try {
      const response = await fetch(url.toString(), {
        signal: controller.signal,
        headers: { 'User-Agent': 'nvm-gui' },
      })
      if (!response.ok)
        return -1

      return Date.now() - startedAt
    }
    catch {
      return -1
    }
    finally {
      clearTimeout(timeout)
    }
  }

  private getPosixNvmDir(): string {
    return resolvePosixNvmDir(process.env, homedir())
  }
}
