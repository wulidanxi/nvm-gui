import type { NvmManagerInstallOptions } from '@common/types'

const { nvmGui } = window

export function nvmList() {
  return invokeGui(() => nvmGui.nvm.list())
}

export function nvmCurrent() {
  return invokeGui(() => nvmGui.nvm.current())
}

export function nvmVersion() {
  return invokeGui(() => nvmGui.nvm.version())
}

export function nvmUse(version: string) {
  return invokeGui(() => nvmGui.nvm.use(version))
}

export function nvmInstall(version: string) {
  return invokeGui(() => nvmGui.nvm.install(version))
}

export function nvmUninstall(version: string) {
  return invokeGui(() => nvmGui.nvm.uninstall(version))
}

export function detectNvmManager() {
  return nvmGui.nvm.manager.detect()
}

export function listNvmManagerVersions() {
  return nvmGui.nvm.manager.listVersions()
}

export function installNvmManager(options: NvmManagerInstallOptions) {
  return nvmGui.nvm.manager.install(options)
}

export function currentNvmManagerVersion() {
  return nvmGui.nvm.manager.currentVersion()
}

export function refreshNvmManager() {
  return nvmGui.nvm.manager.refresh()
}

export function getNpmRegistry() {
  return nvmGui.npm.getRegistry()
}

export function setNpmRegistry(registry: string) {
  return nvmGui.npm.setRegistry(registry)
}

export function listGlobalPackages() {
  return nvmGui.npm.listGlobalPackages()
}

export function installGlobalPackage(pkg: string) {
  return nvmGui.npm.installGlobalPackage(pkg)
}

export function openDirectoryDialog() {
  return nvmGui.project.openDirectoryDialog()
}

export function checkNvmrc(path: string) {
  return nvmGui.project.checkNvmrc(path)
}

export function openUrl(url: string) {
  return nvmGui.shell.openUrl(url)
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

function formatIpcError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error || '')
  return message
    .replace(/^Error invoking remote method '[^']+': Error:\s*/u, '')
    .replace(/^Error invoking remote method "[^"]+": Error:\s*/u, '')
    .trim() || 'Command execution failed'
}
