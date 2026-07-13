import { Controller, IpcHandle } from 'einf'
import type { NodeReleaseRequest, NvmManagerInstallOptions } from '../common/types'
import { assertNodeVersion } from '../common/validation'
import { NvmManagerService } from './nvm-manager.service'

@Controller()
export class NvmController {
  public constructor(private readonly nvmManager: NvmManagerService = new NvmManagerService()) {}

  @IpcHandle('nvm-list-installed')
  public async listInstalledVersions() {
    return this.nvmManager.listInstalledVersions()
  }

  @IpcHandle('nvm-list-available-releases')
  public async listAvailableNodeReleases(request?: NodeReleaseRequest) {
    assertNodeReleaseRequest(request)
    return this.nvmManager.listAvailableNodeReleases(request)
  }

  @IpcHandle('nvm-current')
  public async currentVersion(): Promise<string> {
    return this.nvmManager.runNvmCommand(['current'])
  }

  @IpcHandle('nvm-version')
  public async nvmVersion(): Promise<string> {
    return this.nvmManager.currentManagerVersion()
  }

  @IpcHandle('nvm-use-version')
  public async useNodeVersion(version: string) {
    assertNodeVersion(version)
    return this.nvmManager.useNodeVersion(version)
  }

  @IpcHandle('nvm-install-version')
  public async installNodeVersion(version: string) {
    assertNodeVersion(version)
    return this.nvmManager.installNodeVersion(version)
  }

  @IpcHandle('nvm-uninstall-version')
  public async uninstallNodeVersion(version: string) {
    assertNodeVersion(version)
    return this.nvmManager.uninstallNodeVersion(version)
  }

  @IpcHandle('nvm-manager-detect')
  public async detectNvmManager() {
    return this.nvmManager.detect()
  }

  @IpcHandle('nvm-manager-list-versions')
  public async listNvmManagerVersions() {
    return this.nvmManager.listManagerVersions()
  }

  @IpcHandle('nvm-manager-install')
  public async installNvmManager(options: NvmManagerInstallOptions) {
    return this.nvmManager.installManager(options)
  }

  @IpcHandle('nvm-manager-current-version')
  public async currentNvmManagerVersion(): Promise<string> {
    return this.nvmManager.currentManagerVersion()
  }

  @IpcHandle('nvm-manager-refresh')
  public async refreshNvmManager() {
    return this.nvmManager.refreshEnv()
  }

}

function assertNodeReleaseRequest(value: unknown): asserts value is NodeReleaseRequest | undefined {
  if (value === undefined)
    return
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid Node release request.')
  const request = value as Record<string, unknown>
  if (request.releaseUrl !== undefined && typeof request.releaseUrl !== 'string')
    throw new Error('Invalid Node release URL.')
  if (request.cacheHours !== undefined && (!Number.isInteger(request.cacheHours) || Number(request.cacheHours) < 0 || Number(request.cacheHours) > 168))
    throw new Error('Invalid Node release cache hours.')
  if (request.forceRefresh !== undefined && typeof request.forceRefresh !== 'boolean')
    throw new Error('Invalid Node release refresh preference.')
}

