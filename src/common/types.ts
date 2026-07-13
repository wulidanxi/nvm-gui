export type Nullable<T> = T | null

export type Voidable<T> = T | null | undefined

export type NvmManagerProvider = 'nvm-windows' | 'nvm-sh'

export type NvmManagerSource = 'embedded' | 'remote'

export interface NvmManagerPaths {
  executable?: string
  nvmHome?: string
  nvmSymlink?: string
  nvmDir?: string
  embeddedInstaller?: string
}

export interface NvmManagerStatus {
  platform: NodeJS.Platform
  provider: NvmManagerProvider
  installed: boolean
  version?: string
  paths: NvmManagerPaths
  message?: string
}

export interface NvmManagerVersionOption {
  provider: NvmManagerProvider
  version: string
  label: string
  source: NvmManagerSource
  recommended?: boolean
}

export interface NvmManagerInstallOptions {
  version: string
  source: NvmManagerSource
  writeProfile?: boolean
}

export interface InstalledNodeVersion {
  version: string
  active: boolean
  valid: boolean
}

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

export type CommandFailureCode =
  | 'NVM_MISSING'
  | 'INVALID_VERSION'
  | 'COMMAND_FAILED'
  | 'NETWORK_FAILED'

export interface CommandFailure {
  code: CommandFailureCode
  message: string
}

export interface OperationResult {
  success: boolean
  message: string
}

export interface NodeReleaseRequest {
  releaseUrl?: string
  cacheHours?: number
  forceRefresh?: boolean
}

export type NodeReleaseDataSource = 'network' | 'cache' | 'stale-cache'

export interface NodeReleaseResult {
  items: NodeReleaseSummary[]
  source: NodeReleaseDataSource
  fetchedAt: string
  warning?: string
}

export type CommandLogCategory = 'nvm' | 'npm' | 'nvm-manager' | 'release' | 'system'
export type CommandLogStatus = 'success' | 'error'

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

export interface CommandLogQuery {
  page?: number
  pageSize?: number
  status?: CommandLogStatus
  category?: CommandLogCategory
  search?: string
}

export interface CommandLogPage {
  items: CommandLogEntry[]
  total: number
  page: number
  pageSize: number
}

export type AppUpdatePhase =
  | 'idle'
  | 'checking'
  | 'up-to-date'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'unsupported'
  | 'error'

export interface AppUpdateStatus {
  phase: AppUpdatePhase
  version?: string
  releaseNotes?: string
  progress?: number
  error?: string
  manualDownload?: boolean
  unsignedWarning?: boolean
}

export type ExternalLinkTarget = 'project' | 'projectReleases' | 'nvmWindows'

export const EXTERNAL_LINKS: Record<ExternalLinkTarget, string> = {
  project: 'https://github.com/wulidanxi/nvm-gui',
  projectReleases: 'https://github.com/wulidanxi/nvm-gui/releases',
  nvmWindows: 'https://github.com/coreybutler/nvm-windows',
}
