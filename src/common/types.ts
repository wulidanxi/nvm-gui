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
