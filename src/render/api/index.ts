import type {
  InstalledNodeVersion,
  NodeReleaseSummary,
  NvmManagerInstallOptions,
  OperationResult,
} from '@common/types'

export function nvmList() {
  return invokeGui(async () => installedVersionsToStdout(await getNvmGui().nvm.listInstalled()))
}

export function listInstalledNodeVersions(): Promise<InstalledNodeVersion[]> {
  return invokeGui(() => getNvmGui().nvm.listInstalled())
}

export function listAvailableNodeReleases(releaseUrl?: string): Promise<NodeReleaseSummary[]> {
  return invokeGui(() => getNvmGui().nvm.listAvailableReleases(releaseUrl))
}

export function nvmCurrent() {
  return invokeGui(() => getNvmGui().nvm.current())
}

export function nvmVersion() {
  return invokeGui(() => getNvmGui().nvm.version())
}

export function nvmUse(version: string) {
  return invokeGui(async () => (await getNvmGui().nvm.use(version)).message)
}

export function nvmInstall(version: string) {
  return invokeGui(async () => (await getNvmGui().nvm.install(version)).message)
}

export function nvmUninstall(version: string) {
  return invokeGui(async () => (await getNvmGui().nvm.uninstall(version)).message)
}

export function installNodeVersion(version: string): Promise<OperationResult> {
  return invokeGui(() => getNvmGui().nvm.install(version))
}

export function useNodeVersion(version: string): Promise<OperationResult> {
  return invokeGui(() => getNvmGui().nvm.use(version))
}

export function uninstallNodeVersion(version: string): Promise<OperationResult> {
  return invokeGui(() => getNvmGui().nvm.uninstall(version))
}

export function detectNvmManager() {
  return getNvmGui().nvm.manager.detect()
}

export function listNvmManagerVersions() {
  return getNvmGui().nvm.manager.listVersions()
}

export function installNvmManager(options: NvmManagerInstallOptions) {
  return getNvmGui().nvm.manager.install(options)
}

export function currentNvmManagerVersion() {
  return getNvmGui().nvm.manager.currentVersion()
}

export function refreshNvmManager() {
  return getNvmGui().nvm.manager.refresh()
}

export function getNpmRegistry() {
  return getNvmGui().npm.getRegistry()
}

export function setNpmRegistry(registry: string) {
  return getNvmGui().npm.setRegistry(registry)
}

export function listGlobalPackages() {
  return getNvmGui().npm.listGlobalPackages()
}

export function installGlobalPackage(pkg: string) {
  return getNvmGui().npm.installGlobalPackage(pkg)
}

export function testRegistrySpeed(registry: string) {
  return invokeGui(() => getNvmGui().npm.testRegistrySpeed(registry))
}

export function openDirectoryDialog() {
  return getNvmGui().project.openDirectoryDialog()
}

export function checkNvmrc(path: string) {
  return getNvmGui().project.checkNvmrc(path)
}

export function openUrl(url: string) {
  return getNvmGui().shell.openUrl(url)
}

export async function executeNvmSafely(
  command: string,
  version: string,
): Promise<string> {
  if (!version || !/^v?\d+\.\d+\.\d+$/.test(version)) {
    throw new Error(`Invalid version: ${version}`)
  }

  switch (command) {
    case 'install':
      return nvmInstall(version)
    case 'use':
      return nvmUse(version)
    case 'uninstall':
      return nvmUninstall(version)
    default:
      throw new Error(`Unsupported nvm operation: ${command}`)
  }
}

async function invokeGui<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action()
  }
  catch (error) {
    throw new Error(formatIpcError(error))
  }
}

function installedVersionsToStdout(versions: InstalledNodeVersion[]): string {
  return versions
    .map(item => `${item.active ? '* ' : '  '}${item.version}`)
    .join('\n')
}

function getNvmGui() {
  return window.nvmGui
}

function formatIpcError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error || '')
  return message
    .replace(/^Error invoking remote method '[^']+': Error:\s*/u, '')
    .replace(/^Error invoking remote method "[^"]+": Error:\s*/u, '')
    .trim() || 'Command execution failed'
}
