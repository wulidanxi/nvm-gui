/** 可显式表示“无值”的类型。 */
export type Nullable<T> = T | null

/** 可表示尚未初始化或明确为空的类型。 */
export type Voidable<T> = T | null | undefined

/** 当前平台使用的 NVM 实现。 */
export type NvmManagerProvider = 'nvm-windows' | 'nvm-sh'

/** NVM 管理器安装包的来源。 */
export type NvmManagerSource = 'embedded' | 'remote'

/** 不同平台上 NVM 管理器可能使用的文件路径。 */
export interface NvmManagerPaths {
  executable?: string
  nvmHome?: string
  nvmSymlink?: string
  nvmDir?: string
  embeddedInstaller?: string
}

/** NVM 管理器的探测结果，供主进程和渲染进程共享。 */
export interface NvmManagerStatus {
  platform: NodeJS.Platform
  provider: NvmManagerProvider
  installed: boolean
  version?: string
  paths: NvmManagerPaths
  message?: string
}

/** 可安装的 NVM 管理器版本。 */
export interface NvmManagerVersionOption {
  provider: NvmManagerProvider
  version: string
  label: string
  source: NvmManagerSource
  recommended?: boolean
}

/** 安装 NVM 管理器时由界面提交的选项。 */
export interface NvmManagerInstallOptions {
  version: string
  source: NvmManagerSource
  writeProfile?: boolean
}

/** 本机已安装的 Node.js 版本及其可用状态。 */
export interface InstalledNodeVersion {
  version: string
  active: boolean
  valid: boolean
}

/** 按主版本聚合后的 Node.js 发布信息。 */
export interface NodeReleaseSummary {
  version: string
  major: number
  npm?: string
  lts: string | false
  firstReleased?: string
  lastUpdated?: string
  status: 'current' | 'lts' | 'eol'
  installed: boolean
}

/** 可由界面识别并给出针对性提示的命令错误。 */
export type CommandFailureCode =
  | 'NVM_MISSING'
  | 'INVALID_VERSION'
  | 'COMMAND_FAILED'
  | 'NETWORK_FAILED'

/** 跨 IPC 传递的结构化命令错误。 */
export interface CommandFailure {
  code: CommandFailureCode
  message: string
}

/** 安装、切换和卸载等用户操作的统一返回值。 */
export interface OperationResult {
  success: boolean
  message: string
}

/** 获取 Node.js 发布列表时使用的缓存与数据源选项。 */
export interface NodeReleaseRequest {
  releaseUrl?: string
  cacheHours?: number
  forceRefresh?: boolean
}

/** 发布列表实际采用的数据来源。 */
export type NodeReleaseDataSource = 'network' | 'cache' | 'stale-cache'

/** 带来源和抓取时间的 Node.js 发布列表。 */
export interface NodeReleaseResult {
  items: NodeReleaseSummary[]
  source: NodeReleaseDataSource
  fetchedAt: string
  warning?: string
}

/** 命令日志的业务分类。 */
export type CommandLogCategory = 'nvm' | 'npm' | 'nvm-manager' | 'release' | 'system'
/** 命令日志记录的最终状态。 */
export type CommandLogStatus = 'success' | 'error'

/** 一次主进程命令执行的持久化快照。 */
export interface CommandLogEntry {
  id: string
  timestamp: string
  category: CommandLogCategory
  operation: string
  command: string
  args: string[]
  status: CommandLogStatus
  durationMs: number
  output: string
}

/** 命令日志分页和筛选条件。 */
export interface CommandLogQuery {
  page?: number
  pageSize?: number
  status?: CommandLogStatus
  category?: CommandLogCategory
  search?: string
}

/** 命令日志分页查询结果。 */
export interface CommandLogPage {
  items: CommandLogEntry[]
  total: number
  page: number
  pageSize: number
}

/** 应用更新流程的有限状态集合。 */
export type AppUpdatePhase =
  | 'idle'
  | 'checking'
  | 'up-to-date'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'unsupported'
  | 'error'

/** 主进程推送给界面的应用更新状态。 */
export interface AppUpdateStatus {
  phase: AppUpdatePhase
  version?: string
  releaseNotes?: string
  progress?: number
  error?: string
  manualDownload?: boolean
  unsignedWarning?: boolean
}

/** 允许由主进程打开的外部链接白名单键。 */
export type ExternalLinkTarget = 'project' | 'projectReleases' | 'nvmWindows'

/** 外部链接必须通过键名访问，避免渲染进程传入任意 URL。 */
export const EXTERNAL_LINKS: Record<ExternalLinkTarget, string> = {
  project: 'https://github.com/wulidanxi/nvm-gui',
  projectReleases: 'https://github.com/wulidanxi/nvm-gui/releases',
  nvmWindows: 'https://github.com/coreybutler/nvm-windows',
}
