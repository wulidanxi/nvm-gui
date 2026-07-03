import type { MessageApiInjection } from 'naive-ui/lib/message/src/MessageProvider'
import type {
  NvmManagerInstallOptions,
  NvmManagerStatus,
  NvmManagerVersionOption,
} from '../common/types'

type NvmGuiApi = {
  nvm: {
    list: () => Promise<string>
    current: () => Promise<string>
    version: () => Promise<string>
    use: (version: string) => Promise<string>
    install: (version: string) => Promise<string>
    uninstall: (version: string) => Promise<string>
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
  }
  project: {
    openDirectoryDialog: () => Promise<string | null>
    checkNvmrc: (path: string) => Promise<string | null>
  }
  shell: {
    openUrl: (url: string) => Promise<void>
  }
  system: {
    platform: NodeJS.Platform
    systemVersion: string
    nodeVersion: string
    chromeVersion: string
    electronVersion: string
  }
}

declare global {
  interface Window {
    nvmGui: NvmGuiApi
    $message: MessageApiInjection
    $dialog: any
  }
}

export { }
