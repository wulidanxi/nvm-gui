import { Controller, IpcHandle } from 'einf'
import { NvmManagerService } from './nvm-manager.service'
import { assertRegistryUrl } from '../common/validation'

@Controller()
/** 提供 npm 镜像、全局包和连通性相关的 IPC 入口。 */
export class NpmController {
  public constructor(private readonly nvmManager: NvmManagerService = new NvmManagerService()) {}

  @IpcHandle('npm-get-registry')
  public async getNpmRegistry(): Promise<string> {
    return this.nvmManager.runNpmCommand(['config', 'get', 'registry'])
  }

  @IpcHandle('npm-set-registry')
  public async setNpmRegistry(registry: string): Promise<string> {
    assertRegistryUrl(registry)
    return this.nvmManager.runNpmCommand(['config', 'set', 'registry', registry])
  }

  @IpcHandle('npm-list-global')
  public async listGlobalPackages(): Promise<string> {
    return this.nvmManager.runNpmCommand(['list', '-g', '--depth=0', '--json'])
  }

  @IpcHandle('npm-install-global')
  public async installGlobalPackage(pkg: string): Promise<string> {
    this.validatePackageName(pkg)
    return this.nvmManager.runNpmCommand(['install', '-g', pkg])
  }

  @IpcHandle('npm-test-registry-speed')
  public async testRegistrySpeed(registry: string): Promise<number> {
    assertRegistryUrl(registry)
    return this.nvmManager.testRegistrySpeed(registry)
  }

  /** 包名只允许 npm 的普通名或作用域名格式，禁止附加命令参数。 */
  private validatePackageName(pkg: string) {
    if (!/^(?:@[a-zA-Z0-9._-]+\/)?[a-zA-Z0-9._-]+$/.test(pkg))
      throw new Error('Invalid package name')
  }
}
