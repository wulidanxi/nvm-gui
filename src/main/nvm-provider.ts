import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { InstalledNodeVersion } from '../common/types'
import type { CommandRunner } from './command-runner'

// Provider 封装平台差异，使其余模块无需区分 nvm-windows 和 nvm-sh。
/** NVM 平台适配器统一提供版本查询、命令执行和安装列表。 */
export interface NvmProvider {
  currentManagerVersion(): Promise<string>
  runNvmCommand(args: string[]): Promise<string>
  listInstalledVersions(): Promise<InstalledNodeVersion[]>
}

/** nvm-windows 适配器，并额外过滤残缺的 Node.js 安装。 */
export class WindowsNvmProvider implements NvmProvider {
  constructor(
    private readonly runner: CommandRunner,
    private readonly env: NodeJS.ProcessEnv = process.env,
  ) {}

  public async currentManagerVersion(): Promise<string> {
    return this.runner.run('nvm', ['version'])
  }

  public async runNvmCommand(args: string[]): Promise<string> {
    if (args[0] === 'use' && args[1])
      await this.assertNodeVersionInstalled(args[1])

    const stdout = await this.runner.run('nvm', args)
    if (args[0] === 'ls' || args[0] === 'list')
      return this.filterNvmList(stdout)

    return stdout
  }

  public async listInstalledVersions(): Promise<InstalledNodeVersion[]> {
    const stdout = await this.runNvmCommand(['ls'])
    return parseNvmList(stdout)
  }

  /** 优先使用 NVM_HOME，无法命中时再通过 PATH 查找 nvm.exe。 */
  public async findExecutable(envHome?: string): Promise<string | undefined> {
    const envPath = envHome ? join(envHome, 'nvm.exe') : undefined
    if (envPath && existsSync(envPath))
      return envPath

    try {
      const result = await this.runner.run('where', ['nvm'])
      return result.split(/\r?\n/).map(line => line.trim()).find(Boolean)
    }
    catch {
      return undefined
    }
  }

  /** 隐藏缺少 node.exe 的残留版本，避免界面将其显示为可切换版本。 */
  private async filterNvmList(stdout: string): Promise<string> {
    const lines = stdout.split(/\r?\n/)
    const filtered: string[] = []

    for (const line of lines) {
      const version = extractNvmListVersion(line)
      if (!version || await this.isNodeVersionInstalled(version))
        filtered.push(line)
    }

    return filtered.join('\n')
  }

  private async assertNodeVersionInstalled(version: string) {
    if (await this.isNodeVersionInstalled(version))
      return

    throw new Error(
      `Node.js ${version} installation is incomplete. Please reinstall this version before switching to it.`,
    )
  }

  private async isNodeVersionInstalled(version: string): Promise<boolean> {
    const root = await this.getNvmRoot()
    if (!root)
      return false

    const normalized = version.trim().replace(/^v/i, '')
    return existsSync(join(root, `v${normalized}`, 'node.exe'))
  }

  private async getNvmRoot(): Promise<string | undefined> {
    if (this.env.NVM_HOME)
      return this.env.NVM_HOME

    const executable = await this.findExecutable()
    return executable ? dirname(executable) : undefined
  }
}

/** nvm-sh 适配器，通过登录 shell 加载 nvm.sh 后执行函数式命令。 */
export class PosixNvmProvider implements NvmProvider {
  constructor(
    private readonly runner: CommandRunner,
    private readonly nvmDir: () => string,
  ) {}

  public async currentManagerVersion(): Promise<string> {
    return this.runNvmCommand(['--version'])
  }

  public async runNvmCommand(args: string[]): Promise<string> {
    const nvmDir = this.nvmDir()
    const script = [
      `export NVM_DIR=${shellQuote(nvmDir)}`,
      `[ -s "$NVM_DIR/nvm.sh" ] || { echo "NVM manager is not installed" >&2; exit 127; }`,
      `. "$NVM_DIR/nvm.sh"`,
      `nvm ${args.map(shellQuote).join(' ')}`,
    ].join(' && ')

    return this.runner.runShell(script)
  }

  public async listInstalledVersions(): Promise<InstalledNodeVersion[]> {
    const stdout = await this.runNvmCommand(['ls'])
    return parseNvmList(stdout)
  }
}

/** 将不同 NVM 实现的文本输出解析为统一的已安装版本列表。 */
export function parseNvmList(stdout: string): InstalledNodeVersion[] {
  if (!stdout)
    return []

  return stdout
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map((line) => {
      const active = line.includes('*') || line.startsWith('->')
      const version = extractNvmListVersion(line)
      return version
        ? { version, active, valid: true }
        : null
    })
    .filter((item): item is InstalledNodeVersion => Boolean(item))
}

export function extractNvmListVersion(line: string): string | null {
  // 同时匹配 nvm-windows 的“* 20.11.1”和 nvm-sh 的“-> v20.11.1”。
  const match = line.match(/(?:->)?\s*\*?\s*(v?\d+\.\d+\.\d+)/)
  return match?.[1] || null
}

/** 按 POSIX 单引号规则转义单个命令参数。 */
export function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`
}
