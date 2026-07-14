import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { app, dialog } from 'electron'
import type {
  InstalledNodeVersion,
  NodeReleaseRequest,
  NodeReleaseResult,
  NvmManagerInstallOptions,
  NvmManagerPaths,
  NvmManagerProvider,
  NvmManagerStatus,
  NvmManagerVersionOption,
  OperationResult,
} from '../common/types'
import { ExecFileCommandRunner } from './command-runner'
import type { CommandRunner } from './command-runner'
import { getCommandLogService } from './command-log.service'
import { LoggedCommandRunner } from './logged-command-runner'
import { NvmInstaller } from './nvm-installer'
import { ElevatedExecutor } from './elevated-executor'
import { AsyncMutex } from './async-mutex'
import {
  PosixNvmProvider,
  WindowsNvmProvider,
} from './nvm-provider'
import type { NvmProvider } from './nvm-provider'
import { providerForPlatform, resolvePosixNvmDir } from './nvm-manager.shared'
import { isDefaultNodeReleaseUrl, ReleaseClient, summarizeNodeReleases, validateNodeReleaseUrl } from './release-client'
import { NodeReleaseCacheService } from './node-release-cache.service'
import type { CacheEntry } from './node-release-cache.service'

const DEFAULT_NODE_RELEASE_URL = 'https://nodejs.org/dist/index.json'

// NVM/npm 工作流门面：控制器只调用此服务，平台细节由 Provider、安装器和客户端承担。
/** 协调 NVM 探测、安装、版本操作、发布缓存和命令日志。 */
export class NvmManagerService {
  private readonly platform: NodeJS.Platform
  private readonly providerName: NvmManagerProvider
  private readonly runner: CommandRunner
  private readonly provider: NvmProvider
  private readonly windowsProvider?: WindowsNvmProvider
  private readonly installer: NvmInstaller
  private readonly releaseClient: ReleaseClient
  private readonly releaseCache: NodeReleaseCacheService
  private readonly commandLog = getCommandLogService()
  private readonly elevated: ElevatedExecutor
  private readonly mutationMutex = new AsyncMutex()

  constructor(
    platform: NodeJS.Platform = process.platform,
    runner: CommandRunner = new ExecFileCommandRunner(platform),
  ) {
    this.platform = platform
    this.runner = new LoggedCommandRunner(runner, getCommandLogService())
    this.providerName = providerForPlatform(platform)
    this.windowsProvider = this.providerName === 'nvm-windows'
      ? new WindowsNvmProvider(this.runner)
      : undefined
    this.provider = this.windowsProvider
      || new PosixNvmProvider(this.runner, () => this.getPosixNvmDir())
    this.installer = new NvmInstaller(
      this.providerName,
      this.runner,
      () => this.getPosixNvmDir(),
      platform,
      app,
    )
    this.releaseClient = new ReleaseClient(this.providerName)
    this.releaseCache = new NodeReleaseCacheService(app)
    this.elevated = new ElevatedExecutor(getCommandLogService())
  }

  /** 探测管理器是否可用，并始终返回已发现的路径以辅助诊断。 */
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

  /** 返回适用于当前平台的可安装管理器版本。 */
  public async listManagerVersions(): Promise<NvmManagerVersionOption[]> {
    return this.releaseClient.listManagerVersions()
  }

  public async currentManagerVersion(): Promise<string> {
    return this.provider.currentManagerVersion()
  }

  /** 收集平台特有的管理器路径，不假定环境变量一定完整。 */
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

  /** 串行安装管理器；Windows 安装必须经过 UAC 执行器。 */
  public async installManager(options: NvmManagerInstallOptions): Promise<NvmManagerStatus> {
    return this.mutationMutex.runExclusive(async () => {
      if (this.platform === 'win32') {
        const artifact = await this.installer.resolveWindowsInstaller(options.version, options.source)
        await this.elevated.installNvmManager(artifact.path, artifact.hash)
        return this.detect()
      }
      await this.installer.install(options.version, options.source, options.writeProfile === true)
      return this.detect()
    })
  }

  public async refreshEnv(): Promise<NvmManagerStatus> {
    return this.detect()
  }

  /** 列出有效的本地版本，并把“未安装 NVM”转换为可操作提示。 */
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

  /**
   * 优先使用有效缓存，否则请求网络并回写缓存；网络失败时可降级到过期缓存。
   * 自定义来源在每次联网前都要求用户确认，且请求仍受主进程 SSRF 防护约束。
   */
  public async listAvailableNodeReleases(request: NodeReleaseRequest = {}): Promise<NodeReleaseResult> {
    const startedAt = Date.now()
    const cacheHours = normalizeCacheHours(request.cacheHours)
    let validatedUrl = DEFAULT_NODE_RELEASE_URL
    let cached: CacheEntry | undefined
    try {
      validatedUrl = validateNodeReleaseUrl(request.releaseUrl || DEFAULT_NODE_RELEASE_URL)
      cached = cacheHours > 0 ? await this.releaseCache.get(validatedUrl) : undefined
      const cacheAge = cached ? Date.now() - Date.parse(cached.fetchedAt) : Number.POSITIVE_INFINITY
      if (!request.forceRefresh && cached && cacheAge <= cacheHours * 60 * 60 * 1000) {
        const result = {
          items: summarizeNodeReleases(cached.records, await this.listInstalledVersions()),
          source: 'cache' as const,
          fetchedAt: cached.fetchedAt,
        }
        await this.recordReleaseRequest(
          'success',
          startedAt,
          validatedUrl,
          `Cache hit from ${cached.fetchedAt}; ${result.items.length} summarized releases.`,
          'CACHE',
        )
        return result
      }

      if (!isDefaultNodeReleaseUrl(validatedUrl)) {
        const response = await dialog.showMessageBox({
          type: 'warning', buttons: ['Cancel', 'Allow once'], defaultId: 0, cancelId: 0,
          title: 'Allow custom Node release source?',
          message: `The app will request Node release metadata from:\n${validatedUrl}`,
        })
        if (response.response !== 1)
          throw new Error('Custom Node release source was not approved')
      }
      const records = await this.releaseClient.fetchNodeReleaseRecords(validatedUrl)
      const fetchedAt = new Date().toISOString()
      if (cacheHours > 0) {
        await this.releaseCache.set(validatedUrl, records, fetchedAt).catch((error) => {
          console.warn('Failed to persist Node release cache', error)
        })
      }
      const result = {
        items: summarizeNodeReleases(records, await this.listInstalledVersions()),
        source: 'network' as const,
        fetchedAt,
      }
      await this.recordReleaseRequest('success', startedAt, validatedUrl, `Network fetch completed; ${records.length} records, ${result.items.length} summarized releases.`)
      return result
    }
    catch (error) {
      const message = this.runner.formatError(error)
      if (cacheHours > 0 && cached) {
        const result = {
          items: summarizeNodeReleases(cached.records, await this.listInstalledVersions()),
          source: 'stale-cache' as const,
          fetchedAt: cached.fetchedAt,
          warning: message,
        }
        await this.recordReleaseRequest('error', startedAt, validatedUrl, `Network fetch failed; stale cache from ${cached.fetchedAt} was used. ${message}`)
        return result
      }
      await this.recordReleaseRequest('error', startedAt, validatedUrl, message)
      throw new Error(message)
    }
  }

  /** 记录发布元数据请求；日志失败不能反向中断主要业务。 */
  private async recordReleaseRequest(
    status: 'success' | 'error',
    startedAt: number,
    url: string,
    output: string,
    command = 'GET',
  ): Promise<void> {
    await this.commandLog.record({
      category: 'release', operation: 'Node release metadata', command, args: [url],
      status, durationMs: Date.now() - startedAt, output,
    }).catch((error) => {
      console.warn('Failed to persist Node release request log', error)
    })
  }

  /** 串行安装 Node.js，Windows 操作走提权白名单。 */
  public async installNodeVersion(version: string): Promise<OperationResult> {
    return this.mutationMutex.runExclusive(async () => {
      if (this.platform === 'win32')
        return { success: true, message: await this.elevated.executeNvm('install', version) }
      const message = await this.runNvmCommand(['install', version])
      return { success: true, message }
    })
  }

  /** 串行切换 Node.js，避免与安装或卸载并发修改 NVM 目录。 */
  public async useNodeVersion(version: string): Promise<OperationResult> {
    return this.mutationMutex.runExclusive(async () => {
      if (this.platform === 'win32')
        return { success: true, message: await this.elevated.executeNvm('use', version) }
      const message = await this.runNvmCommand(['use', version])
      return { success: true, message }
    })
  }

  /** 串行卸载 Node.js，保持管理器状态一致。 */
  public async uninstallNodeVersion(version: string): Promise<OperationResult> {
    return this.mutationMutex.runExclusive(async () => {
      if (this.platform === 'win32')
        return { success: true, message: await this.elevated.executeNvm('uninstall', version) }
      const message = await this.runNvmCommand(['uninstall', version])
      return { success: true, message }
    })
  }

  /** 统一 NVM 命令的缺失提示和平台错误文本。 */
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

  /** 执行 npm 命令并隐藏底层进程错误结构。 */
  public async runNpmCommand(args: string[]): Promise<string> {
    try {
      return await this.runner.run('npm', args)
    }
    catch (error) {
      throw new Error(this.runner.formatError(error))
    }
  }

  /** 请求一个小型包元数据端点，以往返耗时衡量镜像可用性。 */
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

/** 规范缓存时长；0 表示禁用读写缓存。 */
function normalizeCacheHours(value: number | undefined): number {
  if (value === undefined)
    return 24
  if (!Number.isInteger(value) || value < 0 || value > 168)
    throw new Error('Node release cache hours must be an integer between 0 and 168.')
  return value
}
