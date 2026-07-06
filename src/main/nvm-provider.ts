import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { InstalledNodeVersion } from '../common/types'
import type { CommandRunner } from './command-runner'

// Providers own platform-specific NVM behavior. The rest of the app should not
// need to know whether commands are backed by nvm-windows or nvm-sh.
export interface NvmProvider {
  currentManagerVersion(): Promise<string>
  runNvmCommand(args: string[]): Promise<string>
  listInstalledVersions(): Promise<InstalledNodeVersion[]>
}

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
  // Matches both nvm-windows (`* 20.11.1`) and nvm-sh (`-> v20.11.1`) output.
  const match = line.match(/(?:->)?\s*\*?\s*(v?\d+\.\d+\.\d+)/)
  return match?.[1] || null
}

export function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`
}
