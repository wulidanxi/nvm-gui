import { contextBridge, ipcRenderer } from 'electron'
import type { AppUpdateStatus, ExternalLinkTarget, NodeReleaseRequest } from '../common/types'
import type { DesktopApi } from '../common/desktop-api'

const invoke = ipcRenderer.invoke.bind(ipcRenderer)

// 只把声明过的业务方法桥接到 window，渲染进程无法直接访问 ipcRenderer。
const desktopApi = {
  nvm: {
    listInstalled: () => invoke('nvm-list-installed'),
    listAvailableReleases: (request?: NodeReleaseRequest) => invoke('nvm-list-available-releases', request),
    current: () => invoke('nvm-current'),
    version: () => invoke('nvm-version'),
    use: (version: string) => invoke('nvm-use-version', version),
    install: (version: string) => invoke('nvm-install-version', version),
    uninstall: (version: string) => invoke('nvm-uninstall-version', version),
    manager: {
      detect: () => invoke('nvm-manager-detect'),
      listVersions: () => invoke('nvm-manager-list-versions'),
      install: (options: { version: string; source: 'embedded' | 'remote'; writeProfile?: boolean }) =>
        invoke('nvm-manager-install', options),
      currentVersion: () => invoke('nvm-manager-current-version'),
      refresh: () => invoke('nvm-manager-refresh'),
    },
  },
  npm: {
    getRegistry: () => invoke('npm-get-registry'),
    setRegistry: (registry: string) => invoke('npm-set-registry', registry),
    listGlobalPackages: () => invoke('npm-list-global'),
    installGlobalPackage: (pkg: string) => invoke('npm-install-global', pkg),
    testRegistrySpeed: (registry: string) => invoke('npm-test-registry-speed', registry),
  },
  project: {
    openDirectoryDialog: () => invoke('open-directory-dialog'),
    checkNvmrc: (path: string) => invoke('check-nvmrc', path),
  },
  commandLog: {
    list: (query?: unknown) => invoke('command-log-list', query),
    statistics: () => invoke('command-log-statistics'),
    remove: (id: string) => invoke('command-log-remove', id),
    clear: () => invoke('command-log-clear'),
    export: () => invoke('command-log-export'),
  },
  updates: {
    status: () => invoke('app-update-status'),
    check: (includePrerelease: boolean) => invoke('app-update-check', includePrerelease),
    download: () => invoke('app-update-download'),
    quitAndInstall: () => invoke('app-update-quit-and-install'),
    onStatus: (listener: (status: AppUpdateStatus) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, status: AppUpdateStatus) => listener(status)
      ipcRenderer.on('app-update-status', handler)
      // 由调用方在组件卸载时注销监听，避免页面反复进入后重复接收事件。
      return () => ipcRenderer.removeListener('app-update-status', handler)
    },
  },
  shell: {
    openUrl: (target: ExternalLinkTarget) => invoke('openUrl', target),
  },
  system: {
    platform: process.platform,
    systemVersion: typeof process.getSystemVersion === 'function'
      ? process.getSystemVersion()
      : '',
    nodeVersion: process.versions.node,
    chromeVersion: process.versions.chrome,
    electronVersion: process.versions.electron,
  },
} satisfies DesktopApi

contextBridge.exposeInMainWorld('nvmGui', desktopApi)
