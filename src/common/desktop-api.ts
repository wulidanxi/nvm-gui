import type {
  AppUpdateStatus, CommandLogPage, CommandLogQuery, CommandLogStatistics, ExternalLinkTarget,
  InstalledNodeVersion, NodeReleaseRequest, NodeReleaseResult, NvmManagerInstallOptions,
  NvmManagerStatus, NvmManagerVersionOption, OperationResult,
} from './types'

/**
 * 通过 preload 暴露给渲染进程的最小桌面能力集合。
 * 此接口同时约束 preload 实现和渲染端调用，避免直接暴露 Electron API。
 */
export interface DesktopApi {
  nvm: {
    listInstalled: () => Promise<InstalledNodeVersion[]>
    listAvailableReleases: (request?: NodeReleaseRequest) => Promise<NodeReleaseResult>
    current: () => Promise<string>
    version: () => Promise<string>
    use: (version: string) => Promise<OperationResult>
    install: (version: string) => Promise<OperationResult>
    uninstall: (version: string) => Promise<OperationResult>
    manager: {
      detect: () => Promise<NvmManagerStatus>
      listVersions: () => Promise<NvmManagerVersionOption[]>
      install: (options: NvmManagerInstallOptions) => Promise<NvmManagerStatus>
      currentVersion: () => Promise<string>
      refresh: () => Promise<NvmManagerStatus>
    }
  }
  npm: {
    getRegistry: () => Promise<string>
    setRegistry: (registry: string) => Promise<string>
    listGlobalPackages: () => Promise<string>
    installGlobalPackage: (pkg: string) => Promise<string>
    testRegistrySpeed: (registry: string) => Promise<number>
  }
  project: {
    openDirectoryDialog: () => Promise<string | null>
    checkNvmrc: (path: string) => Promise<string | null>
  }
  commandLog: {
    list: (query?: CommandLogQuery) => Promise<CommandLogPage>
    statistics: () => Promise<CommandLogStatistics>
    remove: (id: string) => Promise<void>
    clear: () => Promise<void>
    export: () => Promise<string | null>
  }
  updates: {
    status: () => Promise<AppUpdateStatus>
    check: (includePrerelease: boolean) => Promise<AppUpdateStatus>
    download: () => Promise<AppUpdateStatus>
    quitAndInstall: () => Promise<void>
    onStatus: (listener: (status: AppUpdateStatus) => void) => () => void
  }
  shell: { openUrl: (target: ExternalLinkTarget) => Promise<void> }
  system: {
    platform: NodeJS.Platform
    systemVersion: string
    nodeVersion: string
    chromeVersion: string
    electronVersion: string
  }
}
