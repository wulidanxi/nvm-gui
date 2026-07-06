import { contextBridge, ipcRenderer } from 'electron'

const invoke = ipcRenderer.invoke.bind(ipcRenderer)

contextBridge.exposeInMainWorld('nvmGui', {
  nvm: {
    list: () => invoke('nvm-list-installed'),
    listInstalled: () => invoke('nvm-list-installed'),
    listAvailableReleases: (releaseUrl?: string) => invoke('nvm-list-available-releases', releaseUrl),
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
  shell: {
    openUrl: (url: string) => invoke('openUrl', url),
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
})
