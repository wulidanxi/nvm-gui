import { Controller, IpcHandle } from 'einf'
import type { NvmManagerInstallOptions } from '../common/types'
import { assertNodeVersion } from '../common/validation'
import { NvmManagerService } from './nvm-manager.service'

@Controller()
export class NvmController {
  private readonly nvmManager = new NvmManagerService()

  @IpcHandle('nvm-list-installed')
  public async listInstalledVersions() {
    return this.nvmManager.listInstalledVersions()
  }

  @IpcHandle('nvm-list-available-releases')
  public async listAvailableNodeReleases(releaseUrl?: string) {
    return this.nvmManager.listAvailableNodeReleases(releaseUrl)
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

