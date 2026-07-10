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
  date?: string
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

export type ExternalLinkTarget = 'project' | 'nvmWindows'

export const EXTERNAL_LINKS: Record<ExternalLinkTarget, string> = {
  project: 'https://github.com/wulidanxi/nvm-gui',
  nvmWindows: 'https://github.com/coreybutler/nvm-windows',
}
